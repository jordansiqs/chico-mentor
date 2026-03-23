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
  modo_especial?: "cultura" | "viagem" | "musica" | "normal" | "conversa_livre";
  lingua_conversa?: string;
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

function buildConversaLivrePrompt(
  lingua: string,
  interesses: string[],
  nexos_recentes: string[],
  memoria: ChicoMemoria
): string {
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";
  const nexosStr      = nexos_recentes.length > 0
    ? "O aluno ja conhece: " + nexos_recentes.slice(0, 12).join(", ") + "."
    : "";
  const memoriaStr    = memoria.resumo ? "Perfil do aluno: " + memoria.resumo : "";

  return "Voce e o Chico, professor de idiomas que conversa de forma natural. Modo CONVERSA LIVRE em " + lingua + ".\n\n"
    + "MISSAO: Manter uma conversa fluida e interessante em " + lingua + " com o aluno.\n\n"
    + "INTERESSES: " + interessesStr + "\n"
    + nexosStr + "\n"
    + memoriaStr + "\n\n"
    + "REGRAS:\n"
    + "1. Responda SEMPRE em " + lingua + ". Nunca em portugues, exceto nas correcoes.\n"
    + "2. Adapte o vocabulario ao nivel do aluno.\n"
    + "3. Mantenha a conversa sobre os interesses: " + interessesStr + ".\n"
    + "4. No campo correcao, corrija no maximo 2 erros em portugues de forma discreta. Se sem erros, deixe vazio.\n"
    + "5. Termine com uma pergunta na lingua para continuar a conversa.\n\n"
    + "FORMATO JSON puro:\n"
    + "{\n"
    + "  \"resposta\": \"sua resposta em " + lingua + ". Natural. Max 4 frases.\",\n"
    + "  \"correcao\": \"correcao discreta em portugues ou vazio\",\n"
    + "  \"palavra_destaque\": \"uma palavra rica da sua resposta\",\n"
    + "  \"traducao_destaque\": \"traducao em portugues\",\n"
    + "  \"fonetica_destaque\": \"[fo-NE-ti-ca]\"\n"
    + "}";
}

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
    ? `O aluno já aprendeu: ${nexos_recentes.slice(0, 10).join(", ")}.`
    : "";
  const memoriaStr = memoria.resumo
    ? `\nPerfil do aluno: ${memoria.resumo} Última sessão: ${memoria.ultima_sessao || "primeira vez"}.`
    : "";

  const modoExtra: Record<string, string> = {
    viagem: `
## Modo Viagem ativo
Foco em sobrevivência comunicativa no destino mencionado.
Dê contexto cultural de 1 frase, depois as traduções com situações reais (hotel, táxi, mercado).
Inclua uma dica que um turista brasileiro normalmente não sabe.`,

    musica: `
## Modo Música ativo
Analise os versos como texto literário. O que a escolha de palavras revela sobre a língua?
Destaque cognatos e raízes. Mostre conexões entre as línguas do tronco.`,
  };

  return `Você é o Chico — linguista que conversa, não que leciona. Você é curioso, direto e revela o que é surpreendente.

## Quem você está ensinando
Tronco: ${troncoInfo.label} | Línguas: ${linguas}
Interesses: ${interessesStr}
${nexosStr}${memoriaStr}

## Como você pensa antes de responder

Primeiro, classifique o que o aluno enviou:

**A) Pedido de tradução ou explicação linguística**
→ Ensine. Mas sempre priorize o que é NÃO-ÓBVIO.
   Exemplo ruim: "futebol vem de football, esporte jogado com os pés" — isso todos sabem.
   Exemplo bom: "em italiano é calcio, do latim calx (calcanhar/chute) — os italianos nomearam pelo gesto, não pelo esporte."
   
**B) O aluno está conversando** (resposta à sua pergunta, comentário pessoal, reação emocional)
→ Responda como um amigo faria. Breve, natural, humano.
   Depois, se fizer sentido, conecte com algo linguístico. Mas não force.
   Exemplo: aluno diz "Corinthians" após você perguntar o time favorito
   → Resposta errada: tentar traduzir "Corinthians" para espanhol
   → Resposta certa: "Corintians — nome vem de Corinto, cidade grega. Em espanhol os torcedores diriam 'soy del Corinthians', mesma palavra."

**C) Pergunta vaga ou off-topic** (como "como me comportar em viagem")
→ Redirecione para o linguístico. "Posso te ensinar como pedir ajuda em espanhol numa viagem — quer isso?"

## O que você NUNCA faz
- NUNCA use o template "No contexto de X, podemos usar a palavra para descrever X"
- NUNCA repita uma pergunta de verificação que já aparece no histórico da conversa
- NUNCA tente traduzir nomes próprios (times, pessoas, lugares) como se fossem palavras comuns
- NUNCA dê conselhos de comportamento ou etiqueta quando o aluno quer aprender línguas
- NUNCA diga o óbvio. Se a informação está no próprio nome da palavra, vá mais fundo
- NUNCA use mais de 2 parágrafos curtos no aula_chico

## O que você SEMPRE faz
- Conecta com o que o aluno disse ANTES no histórico (se ele falou de Corinthians, lembre na próxima)
- Revela uma conexão etimológica ou cultural que surpreende
- Quando ensina um verbo: diz o tempo e quando usar, em 1 frase
- Termina com UMA pergunta diferente das que já fez — variada, ligada ao contexto da conversa
${modoExtra[modo_especial] || ""}

## FORMATO — JSON puro. Primeira linha { última linha }

{
  "titulo_card": "Palavra central extraída da pergunta. Máx 3 palavras. Se for conversa, use o tema.",
  "aula_chico": "Sua resposta. Máx 2 parágrafos curtos. Surpreenda. Conecte com o histórico. Sem templates.",
  "pergunta_verificacao": "Uma pergunta nova, diferente das que já estão no histórico. Prática e ligada ao contexto.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética para brasileiros. Ex: [a-MI-go]",
    "exemplo": "Frase curta, natural, ligada a ${interessesStr} se encaixar."
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase curta e natural."
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Frase curta e natural."
  }
}

ATENÇÃO: Se o aluno está conversando (caso B), o aula_chico pode ser muito curto — 1-2 frases.
As traduções ainda aparecem, mas o título e a explicação refletem o tema conversacional.
JSON puro. Nada fora dele.`;}


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

    // ── MODO CONVERSA LIVRE ───────────────────────────────────────────────────
    if (modo_especial === "conversa_livre") {
      const lingua = body.lingua_conversa || "Espanhol";
      if (!["românico","germânico"].includes(tronco)) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

      const groq2 = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const historicoConv = historico.slice(-10).map(m => ({
        role: m.role as "user"|"assistant",
        content: m.content,
      }));

      const completion2 = await groq2.chat.completions.create({
        model:       "llama-3.3-70b-versatile",
        temperature: 0.72,
        max_tokens:  600,
        messages: [
          { role:"system", content: buildConversaLivrePrompt(lingua, interesses||[], nexos_recentes, memoria) },
          ...historicoConv,
          { role:"user", content: tema_gerador },
        ],
      });

      const raw2 = completion2.choices[0]?.message?.content ?? "";
      try {
        const parsed2 = parseJSON(raw2);
        return NextResponse.json({
          conversa_livre: true,
          resposta:           parsed2.resposta        || "",
          correcao:           parsed2.correcao        || "",
          palavra_destaque:   parsed2.palavra_destaque   || "",
          traducao_destaque:  parsed2.traducao_destaque  || "",
          fonetica_destaque:  parsed2.fonetica_destaque  || "",
          lingua,
        });
      } catch {
        return NextResponse.json({ error: "Erro na conversa livre." }, { status: 500 });
      }
    }

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

    // ── Gerar história ────────────────────────────────────────────────────────
    if (acao === "gerar_historia") {
      const { tronco, interesses, lingua, nivel } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const interessesStr = (interesses||[]).join(", ") || "cotidiano";
      const linguaInfo    = troncoInfo.linguas.find((l:any) => l.nome === lingua) || troncoInfo.linguas[0];
      const linguaNome    = linguaInfo.nome as string;
      const bcp47         = linguaInfo.bcp47 as string;
      const nivelStr      = (nivel as string) || "iniciante";

      const nivelMap: Record<string,{palavras:string;gramatica:string;vocabulario:string}> = {
        "iniciante":     { palavras:"200 a 260 palavras", gramatica:"SOMENTE presente do indicativo e preterito perfeito simples. Frases curtas de 6 a 12 palavras. Paragrafos de 2 a 3 frases. SEM subjuntivo, SEM condicional.", vocabulario:"cotidiano: familia, comida, casa, rotina." },
        "intermediario": { palavras:"320 a 400 palavras", gramatica:"presente, preterito imperfeito e perfeito, futuro proximo. Use conectores tipicos da lingua.", vocabulario:"emocoes, opinioes, relacoes interpessoais. Inclua 2 expressoes tipicas." },
        "avancado":      { palavras:"460 a 560 palavras", gramatica:"todos os tempos verbais incluindo subjuntivo e condicional. Estruturas subordinadas.", vocabulario:"expressoes idiomaticas, girias autenticas, registros formais e informais." },
      };

      const nivelKey = nivelStr.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      const cfg = nivelMap[nivelKey] || nivelMap["iniciante"];

      const lines = [
        "INSTRUCOES CRITICAS:",
        "1. LINGUA: Escreva O TEXTO INTEIRO da historia em " + linguaNome + ". NAO use portugues no texto. Zero excecoes.",
        "2. NIVEL: " + nivelStr.toUpperCase(),
        "   - Tamanho: " + cfg.palavras,
        "   - Gramatica: " + cfg.gramatica,
        "   - Vocabulario: " + cfg.vocabulario,
        "3. TEMA: Interesses do aluno: " + interessesStr,
        "",
        "ESTRUTURA (5 paragrafos separados por linha em branco):",
        "P1 ABERTURA: Personagem com nome tipico do pais, cenario com detalhes sensoriais.",
        "P2 SITUACAO: Desenvolva a situacao. Inclua um detalhe cultural autentico do pais.",
        "P3 DIALOGO: 3 a 5 trocas naturais entre personagens usando travessao ou aspas.",
        "P4 COMPLICACAO: Problema ou surpresa com reacao emocional do personagem.",
        "P5 DESFECHO: Resolucao com frase final memoravel.",
        "",
        "REGRAS:",
        "- Texto corrido, sem titulos, sem markdown, sem numeracao",
        "- Nomes tipicos: espanhol=Carlos/Maria, frances=Lucie/Antoine, italiano=Marco/Giulia, ingles=James/Emma, alemao=Klaus/Anna, holandes=Lars/Sophie",
        "- Palavras-chave: 8 a 10 palavras ou expressoes do texto que o aluno deveria aprender",
        "",
        'Responda SOMENTE com JSON valido (sem texto antes ou depois):',
        '{',
        '  "titulo": "titulo criativo em ' + linguaNome + '",',
        '  "titulo_pt": "traducao do titulo em portugues",',
        '  "lingua": "' + linguaNome + '",',
        '  "nivel": "' + nivelStr + '",',
        '  "bcp47": "' + bcp47 + '",',
        '  "texto": "historia completa em ' + linguaNome + '. Paragrafos separados por dois enters.",',
        '  "resumo_pt": "resumo de 2 frases em portugues",',
        '  "palavras_chave": [{"palavra":"palavra do texto","traducao_pt":"traducao","fonetica":"[fo-NE-ti-ca]"}],',
        '  "perguntas": [',
        '    {"pergunta":"pergunta factual em portugues","opcoes":["A...","B...","C..."],"correta":0},',
        '    {"pergunta":"pergunta sobre motivacao/sentimento","opcoes":["A...","B...","C..."],"correta":1},',
        '    {"pergunta":"pergunta sobre detalhe cultural","opcoes":["A...","B...","C..."],"correta":2}',
        '  ]',
        '}',
      ];

      const userPrompt   = lines.join("\n");
      const systemPrompt = "Voce e um escritor especialista em textos pedagogicos para aprendizes de idiomas. Voce SEMPRE escreve na lingua solicitada com rigor absoluto de nivel e gramatica.";

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.68,
        max_tokens: 2800,
        messages: [
          { role:"system", content:systemPrompt },
          { role:"user",   content:userPrompt   },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      try {
        const historia = parseJSON(raw);
        if (!historia.texto || historia.texto.length < 80) {
          return NextResponse.json({ error:"Erro ao gerar historia." },{ status:500 });
        }
        return NextResponse.json({ historia });
      } catch {
        return NextResponse.json({ error:"Erro ao gerar historia." },{ status:500 });
      }
    }

    if (acao === "salvar_palavra_historia") {
      const { palavra, traducao_pt, fonetica, tronco, lingua_origem } = body;
      const troncoInfo = TRONCOS[tronco as "românico"|"germânico"];
      if (!troncoInfo) return NextResponse.json({ error:"Tronco inválido." },{ status:400 });

      const supabase = await createSupabaseServer();
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) return NextResponse.json({ error:"Não autorizado." },{ status:401 });

      const linguas = troncoInfo.linguas;
      const origemIdx = linguas.findIndex((l:any) => l.nome === lingua_origem);

      // Traduz para as outras línguas do tronco
      const outras = linguas.filter((_:any, i:number) => i !== origemIdx);
      const jsonSchema = JSON.stringify({"a":{"txt":"traducao","fon":"[fo-NE-ti-ca]","exemplo":"frase curta"},"b":{"txt":"traducao","fon":"[fo-NE-ti-ca]","exemplo":"frase curta"}});
      const promptTrad = ["Traduza a palavra", palavra, "("+lingua_origem+")", "para:", outras.map((l:any)=>l.nome).join(" e "), ". Responda APENAS com JSON:", jsonSchema].join(" ");

      let trad: any = { a:{ txt:"—", fon:"—", exemplo:"—" }, b:{ txt:"—", fon:"—", exemplo:"—" } };
      try {
        const tradResp = await groq.chat.completions.create({
          model:"llama-3.3-70b-versatile", temperature:0.3, max_tokens:300,
          messages:[{ role:"user", content:promptTrad }],
        });
        trad = parseJSON(tradResp.choices[0]?.message?.content ?? "");
      } catch {}

      // Monta os 3 slots de língua
      const langSlots = linguas.map((l:any, i:number) => {
        if (i === origemIdx) return { txt:palavra, fon:fonetica||"—", exemplo:"—" };
        const outrasIdx = linguas.filter((_:any,j:number)=>j!==origemIdx).indexOf(l);
        const slot = outrasIdx === 0 ? trad.a : trad.b;
        return { txt:slot?.txt||"—", fon:slot?.fon||"—", exemplo:slot?.exemplo||"—" };
      });

      const card = {
        user_id:          session.user.id,
        tema_gerador:     palavra + " (" + lingua_origem + ")",
        titulo_card:      palavra,
        tronco,
        aula_chico:       'Palavra encontrada na leitura: ' + palavra + ' (' + lingua_origem + ') = ' + traducao_pt + ' em português.',
        pergunta_verificacao: 'Como se usa ' + palavra + ' em uma frase?',
        modo:             "normal",
        nivel:            "intermediário",
        lang_1_nome: linguas[0].nome, lang_1_txt: langSlots[0].txt, lang_1_fon: langSlots[0].fon, lang_1_exemplo: langSlots[0].exemplo, lang_1_bcp47: linguas[0].bcp47,
        lang_2_nome: linguas[1].nome, lang_2_txt: langSlots[1].txt, lang_2_fon: langSlots[1].fon, lang_2_exemplo: langSlots[1].exemplo, lang_2_bcp47: linguas[1].bcp47,
        lang_3_nome: linguas[2].nome, lang_3_txt: langSlots[2].txt, lang_3_fon: langSlots[2].fon, lang_3_exemplo: langSlots[2].exemplo, lang_3_bcp47: linguas[2].bcp47,
      };

      const { data:saved, error:dbErr } = await supabase.from("mentoria_cards").insert(card).select().single();
      if (dbErr) return NextResponse.json({ error:dbErr.message },{ status:500 });
      return NextResponse.json({ card:saved });
    }

    return NextResponse.json({ error:"Ação desconhecida." },{ status:400 });
  } catch (err) {
    console.error("Erro PATCH:", err);
    return NextResponse.json({ error:"Erro interno." },{ status:500 });
  }
}
