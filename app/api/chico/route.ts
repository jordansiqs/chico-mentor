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
  nexos_recentes?: string[];
  memoria?: ChicoMemoria;
  modo_especial?: "cultura" | "viagem" | "musica" | "normal";
}

export interface ChicoMemoria {
  resumo?: string;
  pontos_fortes?: string[];
  pontos_fracos?: string[];
  estilo?: string;
  ultima_sessao?: string;
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

// ── System Prompt Principal ───────────────────────────────────────────────────

function buildSystemPrompt(
  tronco: "românico" | "germânico",
  interesses: string[],
  nexos_recentes: string[],
  memoria: ChicoMemoria,
  modo_especial: string
): string {
  const troncoInfo    = TRONCOS[tronco];
  const linguas       = troncoInfo.linguas.map(l => l.nome).join(", ");
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";
  const nexosStr      = nexos_recentes.length > 0
    ? `Palavras já aprendidas: ${nexos_recentes.slice(0, 10).join(", ")}.`
    : "";

  const memoriaStr = memoria.resumo
    ? `\n## Memória do aluno\n${memoria.resumo}\nPontos fortes: ${(memoria.pontos_fortes||[]).join(", ")||"não identificados"}.\nPontos fracos: ${(memoria.pontos_fracos||[]).join(", ")||"não identificados"}.\nÚltima sessão: ${memoria.ultima_sessao||"primeira vez"}.`
    : "";

  const modoInstrucao: Record<string, string> = {
    normal: `## Como ensinar
1. A palavra em destaque primeiro — o que é e o que significa (1 frase).
2. Uso real — exemplo ligado aos interesses do aluno (${interessesStr}).
3. Tempo verbal / classe gramatical — só se for verbo ou relevante.
4. Conexão — se conecta com algo já aprendido, mencione em 1 frase.
5. Pergunta de verificação — prática, respondível em 1-2 frases.`,

    cultura: `## Modo Cultura
O aluno quer entender a história e a alma da palavra, não só a tradução.
Explique:
1. O que a palavra significa na cultura de origem.
2. Por que ela existe — contexto histórico ou social brevemente.
3. Como ela se manifesta nas outras línguas do tronco (se existe cognato ou equivalente cultural).
4. Um exemplo de uso cultural real (cinema, música, culinária, etc.).
Seja fascinante. Trate a língua como arqueologia viva.`,

    viagem: `## Modo Viagem
O aluno quer sobreviver e se comunicar bem numa cidade/país específico.
Para o destino mencionado:
1. Contexto cultural rápido (1 frase sobre o destino).
2. As 3 traduções nas línguas do tronco para a palavra/situação pedida.
3. Exemplo de uso numa situação real de viagem (hotel, restaurante, transporte, etc.).
4. Dica cultural prática — algo que um turista precisa saber sobre aquele contexto linguístico.`,

    musica: `## Modo Música
O aluno quer analisar uma letra de música e aprender com ela.
Para cada verso ou trecho apresentado:
1. Tradução fiel do verso para português.
2. Destaque as palavras mais ricas linguisticamente — com conexão ao tronco.
3. Explique o que a escolha de palavras revela sobre a língua ou cultura.
4. Mostre cognatos entre as línguas do tronco se existirem.
Trate a letra como um texto literário, não como uma tradução mecânica.`,
  };

  return `Você é o Chico — linguista que ensina como conversa. Direto, humano, denso.

## Contexto
- Tronco: ${troncoInfo.label} | Línguas: ${linguas}
- Interesses: ${interessesStr}
- ${nexosStr}
${memoriaStr}

${modoInstrucao[modo_especial] || modoInstrucao.normal}

## Regras gerais
- Sem introduções ("Ótima pergunta!") e sem fechamentos ("Espero ter ajudado!").
- Use o histórico da conversa para não repetir.
- Máximo 3 parágrafos curtos no aula_chico.
- Se o aluno escrever algo errado, corrija de forma natural — sem apontar o erro.

## FORMATO — JSON puro. Nada fora dele. Primeira linha { última linha }

{
  "titulo_card": "Palavra central. Máx 3 palavras.",
  "aula_chico": "Explicação seguindo o modo ativo. Máx 3 parágrafos.",
  "pergunta_verificacao": "Uma pergunta prática ao final.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética para brasileiros. Ex: [a-MI-go]",
    "exemplo": "Frase natural contextualizada."
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase natural."
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase natural."
  }
}`;
}

// ── Prompt para atualizar memória ─────────────────────────────────────────────

function buildMemoriaPrompt(
  nexos: string[],
  memoriaAtual: ChicoMemoria,
  historico: { role: string; content: string }[]
): string {
  const userMsgs = historico.filter(m => m.role === "user").map(m => m.content).join(" | ");
  return `Analise o progresso deste aluno de línguas e atualize o perfil de aprendizado.

Palavras aprendidas: ${nexos.slice(0, 20).join(", ")}
Mensagens recentes do aluno: ${userMsgs.slice(0, 500)}
Memória anterior: ${memoriaAtual.resumo || "primeira sessão"}

Responda APENAS com JSON:
{
  "resumo": "2-3 frases descrevendo o perfil e progresso do aluno",
  "pontos_fortes": ["palavra ou tema que domina bem", "..."],
  "pontos_fracos": ["palavra ou tema com dificuldade", "..."],
  "estilo": "uma palavra: visual/contextual/sistemático/intuitivo",
  "ultima_sessao": "O que foi explorado nesta sessão em 1 frase"
}`;
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

// ── Parsear JSON robusto ──────────────────────────────────────────────────────

function parseJSON(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
  return JSON.parse(cleaned);
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
      historico       = [],
      nexos_recentes  = [],
      memoria         = {},
      modo_especial   = "normal",
    } = body;

    if (!tema_gerador?.trim()) return NextResponse.json({ error: "Tema vazio." }, { status: 400 });
    if (!["românico","germânico"].includes(tronco)) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const historicoLimitado = historico.slice(-8).map(m => ({
      role:    m.role as "user"|"assistant",
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.55,
      max_tokens:  1400,
      messages: [
        { role:"system", content: buildSystemPrompt(tronco, interesses||[], nexos_recentes, memoria, modo_especial) },
        ...historicoLimitado,
        { role:"user", content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      titulo_card: string;
      aula_chico: string;
      pergunta_verificacao?: string;
      lang_1: { txt:string; fon:string; exemplo:string };
      lang_2: { txt:string; fon:string; exemplo:string };
      lang_3: { txt:string; fon:string; exemplo:string };
    };

    try {
      parsed = parseJSON(rawContent);
      if (!parsed.aula_chico || !parsed.lang_1 || !parsed.lang_2 || !parsed.lang_3)
        throw new Error("Campos ausentes");
    } catch {
      console.error("Parse error:", rawContent.slice(0, 200));
      parsed = {
        titulo_card:          tema_gerador.slice(0, 30),
        aula_chico:           rawContent.replace(/```[\s\S]*?```/g,"").trim() || "Tente reformular sua pergunta.",
        pergunta_verificacao: undefined,
        lang_1: { txt:"—", fon:"—", exemplo:"—" },
        lang_2: { txt:"—", fon:"—", exemplo:"—" },
        lang_3: { txt:"—", fon:"—", exemplo:"—" },
      };
    }

    const troncoInfo = TRONCOS[tronco];
    const card: ChicoCard = {
      tema_gerador,
      titulo_card:          parsed.titulo_card ?? tema_gerador.slice(0,40),
      tronco,
      aula_chico:           parsed.aula_chico,
      pergunta_verificacao: parsed.pergunta_verificacao,

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

    if (dbError) return NextResponse.json({ card, saved:false, db_error:dbError.message });

    return NextResponse.json({ card:savedCard, saved:true }, { status:201 });

  } catch (err) {
    console.error("Erro /api/chico:", err);
    return NextResponse.json({ error:"Erro interno." }, { status:500 });
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error:"Não autorizado." }, { status:401 });

    const { searchParams } = new URL(request.url);
    const tipo   = searchParams.get("tipo");
    const tronco = searchParams.get("tronco");
    const limit  = parseInt(searchParams.get("limit")??"20",10);
    const offset = parseInt(searchParams.get("offset")??"0",10);

    // Buscar memória do usuário
    if (tipo === "memoria") {
      const { data } = await supabase
        .from("chico_memoria")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      return NextResponse.json({ memoria: data });
    }

    let query = supabase
      .from("mentoria_cards")
      .select("*")
      .eq("user_id", session.user.id)
      .order("criado_em",{ ascending:false })
      .range(offset, offset+limit-1);

    if (tronco && ["românico","germânico"].includes(tronco)) query = query.eq("tronco",tronco);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error:error.message },{ status:500 });

    return NextResponse.json({ cards:data });
  } catch (err) {
    console.error("Erro GET:", err);
    return NextResponse.json({ error:"Erro interno." },{ status:500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error:"Não autorizado." },{ status:401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error:"ID obrigatório." },{ status:400 });

    const { error } = await supabase
      .from("mentoria_cards")
      .delete()
      .eq("id",id)
      .eq("user_id",session.user.id);

    if (error) return NextResponse.json({ error:error.message },{ status:500 });
    return NextResponse.json({ deleted:true });
  } catch (err) {
    console.error("Erro DELETE:", err);
    return NextResponse.json({ error:"Erro interno." },{ status:500 });
  }
}

// ── PATCH — Roteiro / Memória / Proativo ──────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error:"Não autorizado." },{ status:401 });

    const body = await request.json();
    const { acao } = body;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // ── Atualizar memória ──────────────────────────────────────────────────
    if (acao === "atualizar_memoria") {
      const { nexos, historico, memoria_atual } = body;

      const completion = await groq.chat.completions.create({
        model:       "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens:  400,
        messages: [{ role:"user", content: buildMemoriaPrompt(nexos, memoria_atual||{}, historico||[]) }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      let novaMemoria: ChicoMemoria;
      try { novaMemoria = parseJSON(raw); } catch { return NextResponse.json({ error:"Erro ao processar memória." },{ status:500 }); }

      await supabase.from("chico_memoria").upsert({
        user_id:        session.user.id,
        resumo:         novaMemoria.resumo,
        pontos_fortes:  novaMemoria.pontos_fortes || [],
        pontos_fracos:  novaMemoria.pontos_fracos || [],
        estilo:         novaMemoria.estilo,
        ultima_sessao:  novaMemoria.ultima_sessao,
        atualizado_em:  new Date().toISOString(),
      }, { onConflict:"user_id" });

      return NextResponse.json({ memoria:novaMemoria });
    }

    // ── Sugestão proativa ──────────────────────────────────────────────────
    if (acao === "sugestao_proativa") {
      const { tronco, interesses, nexos, memoria } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const interessesStr = (interesses||[]).join(", ") || "cotidiano";
      const prompt = `Você é o Chico, linguista. Baseado no perfil do aluno, sugira UMA ação específica para a sessão de hoje.

Perfil: ${memoria?.resumo || "aluno novo"}
Pontos fracos: ${(memoria?.pontos_fracos||[]).join(", ") || "não identificados"}
Última sessão: ${memoria?.ultima_sessao || "primeira vez"}
Palavras aprendidas recentemente: ${(nexos||[]).slice(0,8).join(", ")}
Interesses: ${interessesStr}
Tronco: ${troncoInfo.label}

Responda com JSON:
{
  "titulo": "Título curto da sugestão (ex: Revisão de verbos)",
  "mensagem": "Mensagem direta para o aluno, 2-3 frases. Como o Chico falaria: direto, sem floreio.",
  "acao": "explorar|revisar|desafiar",
  "palavra_sugerida": "Uma palavra específica para começar (opcional)"
}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", temperature:0.7, max_tokens:250,
        messages: [{ role:"user", content:prompt }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      try {
        const sugestao = parseJSON(raw);
        return NextResponse.json({ sugestao });
      } catch {
        return NextResponse.json({ sugestao:null });
      }
    }

    // ── Roteiro de aprendizado ─────────────────────────────────────────────
    if (acao === "roteiro") {
      const { tronco, interesses, tema } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const completion = await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile", temperature:0.7, max_tokens:600,
        messages:[{ role:"user", content:`Crie um roteiro de aprendizado com 5 palavras sobre "${tema}" para o ${troncoInfo.label}. Progressão pedagógica. Responda APENAS com JSON:
{
  "titulo": "Nome do roteiro",
  "descricao": "Uma frase",
  "nexos": [
    {"palavra": "palavra1", "motivo": "por que começar aqui"},
    {"palavra": "palavra2", "motivo": "próximo passo"},
    {"palavra": "palavra3", "motivo": "..."},
    {"palavra": "palavra4", "motivo": "..."},
    {"palavra": "palavra5", "motivo": "passo final"}
  ]
}` }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      try { return NextResponse.json({ roteiro:parseJSON(raw) }); }
      catch { return NextResponse.json({ error:"Erro ao gerar roteiro." },{ status:500 }); }
    }

    // ── Modo Viagem ────────────────────────────────────────────────────────
    if (acao === "viagem") {
      const { tronco, destino } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const linguas = troncoInfo.linguas.map(l=>l.nome).join(", ");
      const prompt = `Crie um guia de sobrevivência linguística para viagem a ${destino}.
Línguas do tronco: ${linguas} (base: Português).
Inclua 8 palavras/expressões essenciais para esta cidade/país.
Responda APENAS com JSON:
{
  "destino": "${destino}",
  "dica_cultural": "1 frase sobre o que saber linguisticamente sobre este destino",
  "palavras": [
    {
      "pt": "palavra em português",
      "contexto": "quando usar (ex: no hotel, no restaurante)",
      "lang_1": "tradução na língua 1",
      "lang_2": "tradução na língua 2",
      "lang_3": "tradução na língua 3",
      "fon_1": "fonética língua 1",
      "fon_2": "fonética língua 2",
      "fon_3": "fonética língua 3"
    }
  ]
}`;

      const completion = await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile", temperature:0.6, max_tokens:1000,
        messages:[{ role:"user", content:prompt }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      try { return NextResponse.json({ viagem:parseJSON(raw), troncoInfo:troncoInfo.linguas }); }
      catch { return NextResponse.json({ error:"Erro ao gerar guia de viagem." },{ status:500 }); }
    }

    // ── Analisar música (texto livre, sem JSON) ───────────────────────────────
    if (acao === "analisar_musica") {
      const { tronco, interesses, artista, letra } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const linguas = troncoInfo.linguas.map(l=>l.nome).join(", ");
      const artistaStr = artista ? `de ${artista} ` : "";
      const interessesStr = (interesses||[]).join(", ") || "cotidiano";

      const prompt = `Você é o Chico — linguista que analisa músicas como textos literários.

Analise estes versos ${artistaStr}para o ${troncoInfo.label} (${linguas}).

Para cada verso ou expressão importante:
1. Traduza para as línguas do tronco (${linguas})
2. Destaque cognatos e raízes latinas/germânicas
3. Explique o que a escolha de palavras revela sobre a língua e cultura

Seja fascinante. Trate cada palavra como arqueologia viva. Responda em português.
Não use JSON. Responda com texto corrido e bem estruturado.
Máximo 4 parágrafos.

Versos:
${letra}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
        messages: [{ role:"user", content:prompt }],
      });

      const analise = completion.choices[0]?.message?.content ?? "";
      return NextResponse.json({ analise });
    }

    return NextResponse.json({ error:"Ação desconhecida." },{ status:400 });
  } catch (err) {
    console.error("Erro PATCH:", err);
    return NextResponse.json({ error:"Erro interno." },{ status:500 });
  }
}
