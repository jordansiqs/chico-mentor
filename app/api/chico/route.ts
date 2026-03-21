// app/api/chico/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ChicoRequest {
  tema_gerador: string;
  tronco: "românico" | "germânico";
  interesses: string[];
  historico?: { role: "user" | "assistant"; content: string }[];
  modo?: "explorar" | "praticar" | "conversar";
  nivel?: "iniciante" | "intermediario" | "avancado";
  nexos_recentes?: string[]; // títulos dos últimos cards aprendidos
}

export interface ChicoCard {
  tema_gerador: string;
  titulo_card?: string;
  tronco: "românico" | "germânico";
  aula_chico: string;
  pergunta_verificacao?: string;

  lang_1_nome: string;
  lang_1_txt: string;
  lang_1_fon: string;
  lang_1_exemplo?: string;
  lang_1_bcp47: string;

  lang_2_nome: string;
  lang_2_txt: string;
  lang_2_fon: string;
  lang_2_exemplo?: string;
  lang_2_bcp47: string;

  lang_3_nome: string;
  lang_3_txt: string;
  lang_3_fon: string;
  lang_3_exemplo?: string;
  lang_3_bcp47: string;
}

// ── Troncos ───────────────────────────────────────────────────────────────────

const TRONCOS = {
  românico: {
    label: "Tear Românico",
    linguas: [
      { nome: "Espanhol", bcp47: "es-ES" },
      { nome: "Francês",  bcp47: "fr-FR" },
      { nome: "Italiano", bcp47: "it-IT" },
    ],
  },
  germânico: {
    label: "Tear Germânico",
    linguas: [
      { nome: "Inglês",   bcp47: "en-US" },
      { nome: "Alemão",   bcp47: "de-DE" },
      { nome: "Holandês", bcp47: "nl-NL" },
    ],
  },
} as const;

// ── System Prompts por modo ───────────────────────────────────────────────────

function buildSystemPrompt(
  tronco: "românico" | "germânico",
  interesses: string[],
  modo: string,
  nivel: string,
  nexos_recentes: string[]
): string {
  const troncoInfo    = TRONCOS[tronco];
  const linguas       = troncoInfo.linguas.map(l => l.nome).join(", ");
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";
  const nexosStr      = nexos_recentes.length > 0
    ? `Você já ensinou ao aluno: ${nexos_recentes.slice(0, 10).join(", ")}.`
    : "É uma sessão nova, sem histórico de palavras anteriores.";

  const nivelInstrucao = {
    iniciante:      "O aluno está começando. Use linguagem simples, explique tudo, seja paciente e encorajador.",
    intermediario:  "O aluno já tem base. Pode usar termos linguísticos básicos e fazer conexões mais sofisticadas.",
    avancado:       "O aluno já tem experiência. Vá fundo nas nuances, exceções e registros formais/informais.",
  }[nivel] || "Adapte ao nível percebido na conversa.";

  const modoInstrucao: Record<string, string> = {
    explorar: `
## Modo: Explorar (padrão)
Você ensina o que o aluno pergunta. Direto, denso, sem floreio.
Ao final da explicação, faça UMA pergunta curta de verificação — algo que o aluno possa responder na próxima mensagem para confirmar que entendeu. A pergunta deve ser prática, não teórica.
Ex: "Como você diria isso numa situação de [interesse do aluno]?" ou "Qual dessas três traduções você usaria para [contexto]?"`,

    praticar: `
## Modo: Praticar
Você está testando o aluno, não ensinando livremente.
Faça perguntas sobre o que ele já aprendeu. Peça para ele traduzir, conjugar, usar numa frase.
Corrija com leveza — nunca humilhe. Se errar, mostre o certo e explique brevemente por quê.
Mantenha o ritmo: pergunta → resposta → feedback → próxima pergunta.
Adapte a dificuldade: se está acertando tudo, aumente o nível.`,

    conversar: `
## Modo: Conversar
Você e o aluno conversam em português misturado com as línguas do tronco.
Comece simples: uma palavra ou frase por vez no idioma. Aumente gradualmente.
Se o aluno errar a gramática ou vocabulário, corrija de forma natural — como um falante nativo faria.
O objetivo é imersão progressiva, não perfeição imediata.
Responda sempre em português + palavras/frases do idioma escolhido.`,
  };

  const basePrompt = `Você é o Chico — linguista que ensina como conversa. Direto, humano, denso.

## Contexto do aluno
- Tronco: ${troncoInfo.label} | Línguas: ${linguas}
- Interesses: ${interessesStr}
- Nível percebido: ${nivel}
- ${nivelInstrucao}
- ${nexosStr}

## Comportamento geral
- Sem introduções ("Ótima pergunta!") e sem fechamentos ("Espero ter ajudado!").
- Use o histórico da conversa para conectar ideias e evitar repetição.
- Se o aluno já aprendeu algo relacionado, mencione a conexão brevemente.
- Analogias surgem naturalmente — nunca forçadas.
- Quando um contexto dos interesses (${interessesStr}) encaixar, use. Nunca force.
- Detecte sinais de confusão ou dificuldade e ajuste o tom automaticamente.

${modoInstrucao[modo] || modoInstrucao.explorar}

## O que você SEMPRE faz (modos Explorar e Praticar)
1. Explica o significado com clareza (1-2 frases).
2. Tempo verbal / classe gramatical: diz qual é e quando usar.
3. Conecta com o que o aluno já aprendeu (${nexosStr}).
4. Extrai o título curto (máximo 3 palavras).
5. Faz uma pergunta de verificação ao final (modo Explorar) ou de prática (modo Praticar).

## Formato — JSON puro, sem markdown
{
  "titulo_card": "Palavra central. Máx 3 palavras.",
  "aula_chico": "Explicação em PT-BR. Máx 2 parágrafos. Inclui significado, tempo verbal, conexão com histórico.",
  "pergunta_verificacao": "Uma pergunta curta e prática para o aluno responder. Relacionada ao que foi ensinado.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética para brasileiros. Ex: [a-MI-go]",
    "exemplo": "Frase curta e natural em ${troncoInfo.linguas[0].nome}."
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase curta e natural em ${troncoInfo.linguas[1].nome}."
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase curta e natural em ${troncoInfo.linguas[2].nome}."
  }
}

## Regras absolutas
- JSON puro. Nada fora dele.
- titulo_card: máx 3 palavras, sem pontuação final.
- aula_chico: máx 2 parágrafos. Sem saudações ou despedidas.
- pergunta_verificacao: curta, prática, respondível em 1-2 frases.
- exemplo: frase real e natural, não tradução literal.
- Pergunta simples = resposta simples. Não infle.`;

  return basePrompt;
}

// ── Prompt especial para modo Conversar ───────────────────────────────────────
// No modo conversar, o retorno é texto livre, não JSON estruturado

function buildConversarPrompt(
  tronco: "românico" | "germânico",
  interesses: string[],
  nivel: string,
  nexos_recentes: string[]
): string {
  const troncoInfo    = TRONCOS[tronco];
  const linguas       = troncoInfo.linguas.map(l => l.nome).join(", ");
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";
  const primaLingua   = troncoInfo.linguas[0].nome;

  return `Você é o Chico — linguista que ensina conversando. Estamos no Modo Conversar.

## Contexto
- Línguas do aluno: ${linguas} (base: Português)
- Interesses: ${interessesStr}
- Nível: ${nivel}
- Palavras já aprendidas: ${nexos_recentes.slice(0,8).join(", ") || "nenhuma ainda"}

## Modo Conversar — Regras
Você conduz uma conversa natural em Português com palavras e frases graduais em ${primaLingua}.

Nível iniciante: 80% português, 20% ${primaLingua}. Uma frase por vez no idioma.
Nível intermediário: 60% português, 40% ${primaLingua}. Parágrafos curtos no idioma.
Nível avançado: 30% português, 70% ${primaLingua}. Só use português para corrigir.

Quando o aluno errar:
- Não interrompa o fluxo da conversa.
- Repita a frase correta de forma natural: "Ah, você quer dizer: [forma correta]?"
- Continue a conversa.

Quando o aluno usar bem uma palavra ou estrutura:
- Reconheça brevemente: "Exato!" ou "Perfeito!" — e continue.

Use os interesses do aluno (${interessesStr}) como tema da conversa quando possível.

## Formato de resposta
Texto livre em português + ${primaLingua}. NÃO use JSON.
Resposta máxima: 4 frases. Mantenha o ritmo de conversa.
Sempre termine com uma pergunta ou provocação para o aluno continuar.`;
}

// ── Supabase ──────────────────────────────────────────────────────────────────

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// ── Detectar nível automaticamente ───────────────────────────────────────────

function detectNivel(historico: { role: string; content: string }[]): "iniciante" | "intermediario" | "avancado" {
  const userMessages = historico.filter(m => m.role === "user");
  if (userMessages.length < 3) return "iniciante";
  // Heurística simples: mensagens longas e vocabulário técnico = avançado
  const avgLen = userMessages.reduce((s, m) => s + m.content.length, 0) / userMessages.length;
  if (avgLen > 120) return "avancado";
  if (avgLen > 50)  return "intermediario";
  return "iniciante";
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const body: ChicoRequest = await request.json();
    const {
      tema_gerador,
      tronco,
      interesses,
      historico     = [],
      modo          = "explorar",
      nexos_recentes = [],
    } = body;

    if (!tema_gerador?.trim()) return NextResponse.json({ error: "Tema vazio." }, { status: 400 });
    if (!["românico", "germânico"].includes(tronco)) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    // Detectar nível automaticamente se não fornecido
    const nivel = body.nivel || detectNivel(historico);

    const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const isConversarMode = modo === "conversar";

    const systemPrompt = isConversarMode
      ? buildConversarPrompt(tronco, interesses || [], nivel, nexos_recentes)
      : buildSystemPrompt(tronco, interesses || [], modo, nivel, nexos_recentes);

    // Limita histórico às últimas 8 mensagens
    const historicoLimitado = historico.slice(-8).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: isConversarMode ? 0.8 : 0.6,
      max_tokens:  isConversarMode ? 400 : 1200,
      messages: [
        { role: "system", content: systemPrompt },
        ...historicoLimitado,
        { role: "user",   content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    // Modo conversar: retorna texto livre sem salvar card
    if (isConversarMode) {
      return NextResponse.json({
        conversa: rawContent,
        modo: "conversar",
        nivel,
        saved: false,
      });
    }

    // Modos explorar/praticar: parse JSON e salva card
    let parsed: {
      titulo_card: string;
      aula_chico: string;
      pergunta_verificacao?: string;
      lang_1: { txt: string; fon: string; exemplo: string };
      lang_2: { txt: string; fon: string; exemplo: string };
      lang_3: { txt: string; fon: string; exemplo: string };
    };

    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Parse error:", rawContent);
      return NextResponse.json({ error: "Erro ao processar resposta. Tente novamente." }, { status: 500 });
    }

    const troncoInfo = TRONCOS[tronco];
    const card: ChicoCard = {
      tema_gerador,
      titulo_card:           parsed.titulo_card ?? tema_gerador.slice(0, 40),
      tronco,
      aula_chico:            parsed.aula_chico,
      pergunta_verificacao:  parsed.pergunta_verificacao,

      lang_1_nome:    troncoInfo.linguas[0].nome,
      lang_1_txt:     parsed.lang_1.txt,
      lang_1_fon:     parsed.lang_1.fon,
      lang_1_exemplo: parsed.lang_1.exemplo,
      lang_1_bcp47:   troncoInfo.linguas[0].bcp47,

      lang_2_nome:    troncoInfo.linguas[1].nome,
      lang_2_txt:     parsed.lang_2.txt,
      lang_2_fon:     parsed.lang_2.fon,
      lang_2_exemplo: parsed.lang_2.exemplo,
      lang_2_bcp47:   troncoInfo.linguas[1].bcp47,

      lang_3_nome:    troncoInfo.linguas[2].nome,
      lang_3_txt:     parsed.lang_3.txt,
      lang_3_fon:     parsed.lang_3.fon,
      lang_3_exemplo: parsed.lang_3.exemplo,
      lang_3_bcp47:   troncoInfo.linguas[2].bcp47,
    };

    const { data: savedCard, error: dbError } = await supabase
      .from("mentoria_cards")
      .insert({ user_id: session.user.id, ...card })
      .select()
      .single();

    if (dbError) return NextResponse.json({ card, saved: false, db_error: dbError.message });

    return NextResponse.json({ card: savedCard, saved: true, nivel }, { status: 201 });

  } catch (err) {
    console.error("Erro /api/chico:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tronco = searchParams.get("tronco");
    const limit  = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    let query = supabase
      .from("mentoria_cards")
      .select("*")
      .eq("user_id", session.user.id)
      .order("criado_em", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tronco && ["românico", "germânico"].includes(tronco)) {
      query = query.eq("tronco", tronco);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ cards: data });
  } catch (err) {
    console.error("Erro GET:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    const { error } = await supabase
      .from("mentoria_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Erro DELETE:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ── Roteiro de aprendizado ────────────────────────────────────────────────────
// POST /api/chico/roteiro — gera uma sequência de 5 nexos relacionados

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { tronco, interesses, tema } = await request.json();
    const troncoInfo = TRONCOS[tronco as "românico" | "germânico"];
    if (!troncoInfo) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Você é um especialista em linguística do ${troncoInfo.label}.
Crie um roteiro de aprendizado com exatamente 5 palavras ou expressões relacionadas ao tema: "${tema}".
As palavras devem ter progressão pedagógica (do mais simples ao mais complexo) e conexão semântica.
Responda APENAS com JSON:
{
  "titulo": "Nome do roteiro (ex: Campo semântico de emoções)",
  "descricao": "Uma frase descrevendo o roteiro",
  "nexos": [
    {"palavra": "palavra1", "motivo": "por que aprender primeiro"},
    {"palavra": "palavra2", "motivo": "por que é o segundo passo"},
    {"palavra": "palavra3", "motivo": "..."},
    {"palavra": "palavra4", "motivo": "..."},
    {"palavra": "palavra5", "motivo": "por que é o passo final"}
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw     = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();

    try {
      const roteiro = JSON.parse(cleaned);
      return NextResponse.json({ roteiro });
    } catch {
      return NextResponse.json({ error: "Erro ao gerar roteiro." }, { status: 500 });
    }
  } catch (err) {
    console.error("Erro PATCH roteiro:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
