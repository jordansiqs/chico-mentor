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
  quiz_acertos?: number;
  quiz_erros?: number;
  modo?: string;
  nivel?: string;

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
    ? `O aluno já internalizou: ${nexos_recentes.slice(0, 12).join(", ")}.`
    : "";
  const memoriaStr    = memoria.resumo
    ? `\nPERFIL DO ALUNO: ${memoria.resumo}\nPontos fortes: ${(memoria.pontos_fortes||[]).join(", ")||"não mapeados"}.\nAtenção: ${(memoria.pontos_fracos||[]).join(", ")||"não mapeados"}.\nÚltima sessão: ${memoria.ultima_sessao||"primeira vez"}.`
    : "";

  const modoExtra: Record<string, string> = {
    viagem: `
## MODO VIAGEM
Para cada expressão: (1) instrução biológica do som mais crítico para brasileiros nessa língua, (2) contexto real de uso, (3) atalho do Tear -- como o padrão aparece nas outras línguas do tronco, (4) dica cultural que o turista não encontra no Google.`,
    musica: `
## MODO MÚSICA
Analise fonético E literariamente: (1) o que a escolha de palavras revela sobre cultura, (2) 1-2 sons característicos da língua no trecho com instrução biológica de como produzi-los, (3) espelhos do padrão nas outras línguas do Tear.`,
  };

  return `Você é o Chico -- mentor de ultra-aprendizado de línguas. Você combina neurociência da linguagem, biologia da fala e arqueologia etimológica para fazer o aluno aprender 3x mais rápido.

Você é caloroso, direto e cientificamente preciso. Trata o aluno como alguém inteligente que merece entender o mecanismo real das coisas -- não decorar.

## CONTEXTO DO ALUNO
Tronco: ${troncoInfo.label} | Línguas: ${linguas}
Interesses: ${interessesStr}
${nexosStr}${memoriaStr}

## O MÉTODO DO CHICO -- 4 PILARES

**PILAR 1 -- ENGENHARIA DA PRONÚNCIA (BIOLOGIA)**
Quando ensinar palavra com som difícil para brasileiros, dê UMA instrução biológica precisa:
- Onde a língua toca (alvéolos, palato, dentes, ou nada)
- Se aspirado (ar sai com força) ou sonoro (corda vocal vibra)
- Analogia sensorial ligada aos interesses do aluno: ${interessesStr}

Referência biológica:
- R francês: "Gargarejo suave no fundo da garganta -- língua relaxada, sem tocar em nada. Como limpar a voz antes de cantar."
- TH inglês: "Ponta da língua entre os dentes, sopro suave -- como cobra vazando ar."
- R espanhol simples: "Uma batida da ponta da língua nos alvéolos -- a crista rugosa atrás dos dentes de cima."
- R espanhol vibrante: "Mesma batida mas com ar forte -- língua vibra como moto engatando."
- Ü alemão: "Diga 'i' mas arredonde os lábios para 'u' ao mesmo tempo."

**PILAR 2 -- DNA ENTRE LÍNGUAS (ATALHOS DO TEAR)**
Ao ensinar qualquer palavra, mostre o padrão que o cérebro pode CLONAR:
- Identifique o chunk (bloco de sentido) transferível
- Mostre a regra de transformação entre as línguas com 1 frase
- Ex: "AQUA (latim) → AGUA (esp) → ACQUA (ita) → EAU (fr, só sobrou o som)"
- Chunks-chave Românico: -tion/-ción/-zione, verbos -ar/-er/-ir, negação no/ne/non
- Chunks-chave Germânico: compostos, modais can/können/kunnen, prefixos un-/in-/on-

**PILAR 3 -- ANCORAGEM NEURO-ETIMOLÓGICA**
Toda palavra nova precisa de 1 âncora de memória longa:
- Uma história ou curiosidade genuinamente surpreendente
- NUNCA diga o óbvio -- se a etimologia está no nome, vá mais fundo
- Crie uma imagem mental ou emoção, não só informação
- Conecte com ${interessesStr} sempre que possível

**PILAR 4 -- INPUT i+1**
Calibre pelo perfil acima: o próximo passo deve ser 1 degrau acima do que o aluno já domina.
Iniciante → chunks de alta frequência + pronúncia básica.
Intermediário → estruturas gramaticais + expressões idiomáticas.
Avançado → nuances culturais, registros, polissemia.

## CLASSIFICAÇÃO DE MENSAGENS

**A) Pedido linguístico** → Aplique os 4 pilares. Ordem: âncora → biologia (se relevante) → atalho do Tear → pergunta i+1.
**B) Conversando** → Responda como amigo. Curto e humano. Conecte ao linguístico só se natural.
**C) Off-topic/vago** → Redirecione com curiosidade: "Posso te mostrar como isso se diz em espanhol de um jeito que você nunca esquece?"

## REGRAS ABSOLUTAS
- NUNCA template "No contexto de X..."
- NUNCA repita pergunta já feita no histórico
- NUNCA trate nomes próprios como palavras a traduzir
- NUNCA diga o óbvio
- NUNCA mais de 3 parágrafos curtos no aula_chico
- SEMPRE conecte com o histórico
- SEMPRE termine com 1 pergunta nova e prática
${modoExtra[modo_especial] || ""}

## FORMATO -- JSON puro. Primeira linha { última linha }

{
  "titulo_card": "Palavra ou chunk central. Máx 3 palavras.",
  "aula_chico": "Resposta com os 4 pilares integrados. Máx 3 parágrafos. Surpreenda. Biologia quando relevante.",
  "pergunta_verificacao": "Pergunta nova, prática, diferente das do histórico.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética com nota biológica se o som for difícil. Ex: [r-RA-to -- uma batida nos alvéolos]",
    "exemplo": "Frase natural ligada a ${interessesStr}."
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética com nota biológica se necessário",
    "exemplo": "Frase natural."
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética com nota biológica se necessário",
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

function sanitizeJSON(str: string): string {
  // Remove markdown fences
  str = str.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
  // Extract first JSON object
  const match = str.match(/\{[\s\S]*\}/);
  if (match) str = match[0];
  // Replace literal control characters inside string values with escaped versions
  // This handles newlines, tabs, carriage returns inside JSON string values
  let result = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = str.charCodeAt(i);
    if (escape) { result += ch; escape = false; continue; }
    if (ch === "\\") { escape = true; result += ch; continue; }
    if (ch === "\"") { inString = !inString; result += ch; continue; }
    if (inString && code < 32) {
      if (code === 10) { result += "\\n"; continue; }
      if (code === 13) { result += "\\r"; continue; }
      if (code === 9)  { result += "\\t"; continue; }
      continue; // drop other control chars
    }
    result += ch;
  }
  return result;
}

function parseJSON(raw: string) {
  try {
    const sanitized = sanitizeJSON(raw);
    return JSON.parse(sanitized);
  } catch {
    // Last resort: try raw
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Cannot parse JSON");
  }
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

    // ── Helper: tenta parsear com retry ─────────────────────────────────────────
    async function tryParseWithRetry(raw: string, attempt: number = 1): Promise<{
      titulo_card: string; aula_chico: string; pergunta_verificacao?: string;
      lang_1: { txt:string; fon:string; exemplo:string };
      lang_2: { txt:string; fon:string; exemplo:string };
      lang_3: { txt:string; fon:string; exemplo:string };
    } | null> {
      try {
        const p: any = parseJSON(raw);
        // Normaliza campos alternativos
        if (p && !p.lang_1 && p.lang_1_txt) {
          p.lang_1 = { txt: p.lang_1_txt||"", fon: p.lang_1_fon||"", exemplo: p.lang_1_exemplo||"" };
          p.lang_2 = { txt: p.lang_2_txt||"", fon: p.lang_2_fon||"", exemplo: p.lang_2_exemplo||"" };
          p.lang_3 = { txt: p.lang_3_txt||"", fon: p.lang_3_fon||"", exemplo: p.lang_3_exemplo||"" };
        }
        if (!p.lang_1) p.lang_1 = { txt:"", fon:"", exemplo:"" };
        if (!p.lang_2) p.lang_2 = { txt:"", fon:"", exemplo:"" };
        if (!p.lang_3) p.lang_3 = { txt:"", fon:"", exemplo:"" };
        // Valida que as línguas têm tradução real
        const hasLangs = [p.lang_1, p.lang_2, p.lang_3].every(
          (l: any) => l?.txt && l.txt !== "--" && l.txt.trim().length > 0
        );
        if (!p.aula_chico || !hasLangs) throw new Error("Campos insuficientes");
        return p;
      } catch {
        return null;
      }
    }

    // ── Chamada principal ─────────────────────────────────────────────────────
    const systemPromptStr = buildSystemPrompt(tronco, interesses||[], nexos_recentes, memoria, modo_especial);

    async function callGroq(temp: number) {
      const r = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: temp,
        max_tokens: 1400,
        messages: [
          { role:"system", content: systemPromptStr },
          ...historicoLimitado,
          { role:"user", content: tema_gerador },
        ],
      });
      return r.choices[0]?.message?.content ?? "";
    }

    let rawContent = await callGroq(0.50);
    let parsed = await tryParseWithRetry(rawContent);

    // ── Retry automático se JSON inválido ou línguas vazias ───────────────────
    if (!parsed) {
      console.warn("[POST] Tentativa 1 falhou. Retrying com temp=0.30...");
      rawContent = await callGroq(0.30);
      parsed = await tryParseWithRetry(rawContent, 2);
    }

    // ── Retry final: modelo mais simples, prompt direto ───────────────────────
    if (!parsed) {
      console.warn("[POST] Tentativa 2 falhou. Retry final com prompt direto...");
      const troncoInfo2 = TRONCOS[tronco];
      const directPrompt = "Responda em JSON puro sobre: " + tema_gerador + "\n\n" +
        "{ \"titulo_card\": \"...\"," +
        " \"aula_chico\": \"Explique brevemente.\"," +
        " \"lang_1\": { \"txt\": \"" + troncoInfo2.linguas[0].nome + " translation\", \"fon\": \"[fo-NE-ti-ca]\", \"exemplo\": \"exemplo\" }," +
        " \"lang_2\": { \"txt\": \"" + troncoInfo2.linguas[1].nome + " translation\", \"fon\": \"[fo-NE-ti-ca]\", \"exemplo\": \"exemplo\" }," +
        " \"lang_3\": { \"txt\": \"" + troncoInfo2.linguas[2].nome + " translation\", \"fon\": \"[fo-NE-ti-ca]\", \"exemplo\": \"exemplo\" } }";
      const r3 = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", temperature: 0.20, max_tokens: 600,
        messages: [{ role:"user", content: directPrompt }],
      });
      rawContent = r3.choices[0]?.message?.content ?? "";
      parsed = await tryParseWithRetry(rawContent, 3);
      if (parsed) console.log("[POST] Retry final bem-sucedido.");
      else console.error("[POST] Todas as tentativas falharam. Raw:", rawContent.slice(0, 200));
    }

    // ── Fallback absoluto (nunca retorna --)  ─────────────────────────────────
    if (!parsed) {
      const cleanText = rawContent.replace(/```[\s\S]*?```/g, "").trim();
      parsed = {
        titulo_card:          tema_gerador.slice(0, 30),
        aula_chico:           cleanText || "Tente reformular sua pergunta.",
        pergunta_verificacao: undefined,
        lang_1: { txt:"", fon:"", exemplo:"" },
        lang_2: { txt:"", fon:"", exemplo:"" },
        lang_3: { txt:"", fon:"", exemplo:"" },
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

// ── PATCH -- Roteiro / Memória / Proativo ──────────────────────────────────────

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

      const prompt = `Você é o Chico -- linguista que analisa músicas como textos literários.

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
        "1. LINGUA OBRIGATORIA: O campo texto do JSON deve conter a historia COMPLETA escrita em " + linguaNome + " (nao em portugues, nao em espanhol, nao em outra lingua). Cada frase, cada palavra, cada dialogo: TUDO em " + linguaNome + ". Isso e inegociavel.",
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
      let systemPrompt = "Sei uno scrittore madrelingua specializzato in testi pedagogici. " +
        "Scrivi SEMPRE e SOLO in " + linguaNome + ". " +
        "NON usare mai il portoghese nel testo della storia. " +
        "Rispondi SOLO con JSON valido, senza testo prima o dopo.";
      // Override systemPrompt per lingua específica
      if (linguaNome === "Italiano") {
        systemPrompt = "Sei uno scrittore italiano madrelingua. Scrivi la storia ESCLUSIVAMENTE in italiano. Zero eccezioni. Rispondi solo con JSON valido.";
      } else if (linguaNome === "Espanhol") {
        systemPrompt = "Eres un escritor hispanohablante nativo. Escribe la historia EXCLUSIVAMENTE en espanol. Cero excepciones. Responde solo con JSON valido.";
      } else if (linguaNome === "Frances" || linguaNome === "Francês") {
        systemPrompt = "Tu es un ecrivain francophone natif. Ecris l histoire EXCLUSIVEMENT en francais. Zero exception. Reponds uniquement avec du JSON valide.";
      } else if (linguaNome === "Ingles" || linguaNome === "Inglês") {
        systemPrompt = "You are a native English writer. Write the story EXCLUSIVELY in English. Zero exceptions. Respond only with valid JSON.";
      } else if (linguaNome === "Alemao" || linguaNome === "Alemão") {
        systemPrompt = "Du bist ein deutschsprachiger Schriftsteller. Schreibe die Geschichte AUSSCHLIESSLICH auf Deutsch. Antworte nur mit validem JSON.";
      } else if (linguaNome === "Holandes" || linguaNome === "Holandês") {
        systemPrompt = "Je bent een Nederlandstalige schrijver. Schrijf het verhaal UITSLUITEND in het Nederlands. Antwoord alleen met geldige JSON.";
      }

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.55,
        max_tokens: 2800,
        messages: [
          { role:"system", content:systemPrompt },
          { role:"user",   content:userPrompt   },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      console.log("[historia] raw:", raw.slice(0,120));
      try {
        const historia = parseJSON(raw);
        if (historia.palavras_chave) {
          historia.palavras_chave = (historia.palavras_chave as any[]).map((p:any) => ({
            palavra:     p.palavra || p.word || "",
            traducao_pt: p.traducao_pt || p.traducao || p.translation || "",
            fonetica:    p.fonetica || p.fon || "",
          }));
        }
        if (!historia.texto || historia.texto.length < 80) {
          console.log("[historia] texto too short:", historia.texto?.length);
          return NextResponse.json({ error:"Erro ao gerar historia." },{ status:500 });
        }
        return NextResponse.json({ historia });
      } catch (e:any) {
        console.log("[historia] parse failed:", e?.message, raw.slice(0,200));
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

      let trad: any = { a:{ txt:"--", fon:"--", exemplo:"--" }, b:{ txt:"--", fon:"--", exemplo:"--" } };
      try {
        const tradResp = await groq.chat.completions.create({
          model:"llama-3.3-70b-versatile", temperature:0.3, max_tokens:300,
          messages:[{ role:"user", content:promptTrad }],
        });
        trad = parseJSON(tradResp.choices[0]?.message?.content ?? "");
      } catch {}

      // Monta os 3 slots de língua
      const langSlots = linguas.map((l:any, i:number) => {
        if (i === origemIdx) return { txt:palavra, fon:fonetica||"--", exemplo:"--" };
        const outrasIdx = linguas.filter((_:any,j:number)=>j!==origemIdx).indexOf(l);
        const slot = outrasIdx === 0 ? trad.a : trad.b;
        return { txt:slot?.txt||"--", fon:slot?.fon||"--", exemplo:slot?.exemplo||"--" };
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

    // ── Traduzir palavra avulsa (Ultra-Aprendizado) ─────────────────────────
    if (acao === "traduzir_palavra") {
      const { palavra, lingua_origem, tronco, interesses } = body;
      const troncoInfo    = TRONCOS[tronco as "românico"|"germânico"];
      const interessesStr = (interesses||[]).join(", ") || "cotidiano";
      const outraLinguas  = troncoInfo ? troncoInfo.linguas.map((l:any)=>l.nome).join(", ") : lingua_origem;

      const promptLines = [
        'Você é o Chico -- especialista em ultra-aprendizado, biologia da fala e arqueologia etimológica.',
        'Analise a palavra/expressão: ' + palavra + ' (' + lingua_origem + ')',
        'Interesses do aluno: ' + interessesStr,
        'Outras línguas do tronco do aluno: ' + outraLinguas,
        '',
        'Responda APENAS com JSON válido:',
        '{',
        '  "traducao_pt": "tradução direta e clara em português",',
        '  "classe": "substantivo|verbo|adjetivo|expressão|advérbio",',
        '  "fonetica": "fonética para brasileiros. Se som difícil, nota biológica entre parênteses",',
        '  "instrucao_biologica": "APENAS se som difícil: onde língua vai, se ar sai, se corda vibra. Conecte com ' + interessesStr + '. Se som simples, string vazia.",',
        '  "ancora": "1 fato surpreendente sobre origem da palavra. NUNCA o óbvio. Imagem mental. Conecte com ' + interessesStr + '.",',
        '  "chunk_tear": "Se padrão clonável nas outras línguas (' + outraLinguas + '), mostre a regra em 1 frase. Se não, string vazia.",',
        '  "exemplo_uso": "frase curta em ' + lingua_origem + ' ligada a ' + interessesStr + '"',
        '}',
      ]

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.35,
        max_tokens: 600,
        messages: [
          { role: "system", content: "Você é especialista em neurociência da linguagem e biologia da fala. Responda sempre com JSON puro e válido, sem markdown." },
          { role: "user",   content: promptLines.join("\n") },
        ],
      });

      try {
        const result = parseJSON(completion.choices[0]?.message?.content ?? "");
        return NextResponse.json({ result });
      } catch {
        return NextResponse.json({ error: "Erro ao traduzir." }, { status: 500 });
      }
    }

    // ── Traduzir história completa (modo paralelo) ────────────────────────────
    if (acao === "traduzir_historia") {
      const { texto, lingua_origem } = body;
      const paragrafos = (texto as string).split("\n\n").filter((p:string) => p.trim().length > 0);
      const listaParas = paragrafos.map((p:string, i:number) => "[" + i + "] " + p).join("\n\n");
      const promptTrad = "Traduza os seguintes parágrafos do " + (lingua_origem as string) + " para o português brasileiro. Mantenha o mesmo número de parágrafos. Tradução natural e fluente, não literal.\nParágrafos:\n\n" + listaParas + "\n\nResponda APENAS com JSON: { \"paragrafos\": [\"tradução do parágrafo 0\", \"tradução do parágrafo 1\"] }";

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", temperature: 0.3, max_tokens: 2000,
        messages: [{ role: "user", content: promptTrad }],
      });
      try {
        const result = parseJSON(completion.choices[0]?.message?.content ?? "");
        return NextResponse.json({ paragrafos: result.paragrafos ?? [] });
      } catch {
        return NextResponse.json({ error: "Erro ao traduzir história." }, { status: 500 });
      }
    }

        // ── Ditado: gerar frase para o aluno ouvir e escrever ───────────────────
    if (acao === "gerar_ditado") {
      const { tronco, lingua, nivel, nexos_recentes, interesses } = body;
      const troncoInfo2 = TRONCOS[tronco as "romanico"|"germanico"] || TRONCOS["romanico"];
      const linguaInfo2 = troncoInfo2.linguas.find((l:any) => l.nome === lingua) || troncoInfo2.linguas[0];
      const linguaNome2 = linguaInfo2.nome as string;
      const bcp472      = linguaInfo2.bcp47 as string;
      const nexosStr2   = (nexos_recentes||[]).slice(0,8).join(", ") || "vocabulario basico";
      const interessesStr2 = (interesses||[]).join(", ") || "cotidiano";
      const nivelKey2 = ((nivel as string)||"iniciante").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
      const nivelGuia2: Record<string,string> = {
        "iniciante":    "frases curtas de 4 a 7 palavras, vocabulario simples, presente do indicativo",
        "intermediario":"frases de 8 a 12 palavras, um ou dois verbos conjugados, vocabulario variado",
        "avancado":     "frases complexas de 12 a 18 palavras, expressoes idiomaticas, tempos verbais variados",
      };
      const guia2 = nivelGuia2[nivelKey2] || nivelGuia2["iniciante"];
      const promptDitado = [
        "Crie UMA frase para ditado em " + linguaNome2 + ".",
        "Nivel: " + guia2,
        "Use palavras relacionadas a: " + nexosStr2,
        "Tema: " + interessesStr2,
        "Responda APENAS com JSON valido:",
        "{",
        '  "frase": "a frase em ' + linguaNome2 + '",',
        '  "traducao_pt": "traducao em portugues",',
        '  "dica": "1 dica sobre a gramatica ou vocabulario",',
        '  "bcp47": "' + bcp472 + '",',
        '  "palavras_chave": ["palavra1", "palavra2"]',
        "}",
      ].join("\n");
      const compDitado = await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile", temperature:0.55, max_tokens:300,
        messages:[
          { role:"system", content:"Voce cria frases pedagogicas para pratica de idiomas. Responda apenas com JSON valido." },
          { role:"user", content:promptDitado },
        ],
      });
      try {
        const result = parseJSON(compDitado.choices[0]?.message?.content ?? "");
        return NextResponse.json({ ditado: result });
      } catch { return NextResponse.json({ error:"Erro ao gerar ditado." },{ status:500 }); }
    }

    // ── Conversa Guiada: gerar situacao ──────────────────────────────────────
    if (acao === "gerar_situacao") {
      const { tronco, lingua, interesses, nivel, situacao_num } = body;
      const troncoInfo3 = TRONCOS[tronco as "romanico"|"germanico"] || TRONCOS["romanico"];
      const linguaInfo3 = troncoInfo3.linguas.find((l:any) => l.nome === lingua) || troncoInfo3.linguas[0];
      const linguaNome3 = linguaInfo3.nome as string;
      const interessesStr3 = (interesses||[]).join(", ") || "cotidiano";
      const num3 = (situacao_num as number) || 1;
      const contextos3 = ["restaurante ou cafe","hotel ou hospedagem","transporte","loja ou mercado","pedir direcoes"];
      const contexto3 = contextos3[(num3-1) % contextos3.length];
      const promptSit = [
        "Crie uma situacao de dialogo para pratica de " + linguaNome3 + ".",
        "Situacao " + num3 + " de 5. Contexto: " + contexto3 + ".",
        "Interesses do aluno: " + interessesStr3,
        "Nivel: " + ((nivel as string)||"iniciante"),
        "Responda APENAS com JSON valido:",
        "{",
        '  "situacao": "descricao em portugues (2 frases)",',
        '  "instrucao": "o que o aluno deve dizer em portugues",',
        '  "exemplo_resposta": "exemplo correto em ' + linguaNome3 + '",',
        '  "palavras_uteis": ["palavra1 em ' + linguaNome3 + '", "palavra2"]',
        "}",
      ].join("\n");
      const compSit = await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile", temperature:0.65, max_tokens:400,
        messages:[
          { role:"system", content:"Voce cria situacoes de dialogo para aprendizes de idiomas. Responda apenas com JSON valido." },
          { role:"user", content:promptSit },
        ],
      });
      try {
        const result = parseJSON(compSit.choices[0]?.message?.content ?? "");
        return NextResponse.json({ situacao: result });
      } catch { return NextResponse.json({ error:"Erro ao gerar situacao." },{ status:500 }); }
    }

    // ── Conversa Guiada: avaliar resposta do aluno ───────────────────────────
    if (acao === "avaliar_resposta") {
      const { resposta, exemplo_resposta, situacao, lingua } = body;
      const promptAval = [
        "Avalie a resposta de um aprendiz de " + (lingua as string) + ".",
        "Situacao: " + (situacao as string),
        "Resposta do aluno: " + (resposta as string),
        "Exemplo correto: " + (exemplo_resposta as string),
        "Responda APENAS com JSON valido:",
        "{",
        '  "nota": 0,',
        '  "correto": false,',
        '  "correcao": "versao corrigida em ' + (lingua as string) + ' se houver erros, senao string vazia",',
        '  "explicacao": "elogio ou explicacao dos erros em portugues (max 2 frases)",',
        '  "dica": "1 dica pratica em portugues"',
        "}",
      ].join("\n");
      const compAval = await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile", temperature:0.3, max_tokens:300,
        messages:[
          { role:"system", content:"Voce e um professor de idiomas que avalia respostas. Seja encorajador e preciso. Responda apenas com JSON valido." },
          { role:"user", content:promptAval },
        ],
      });
      try {
        const result = parseJSON(compAval.choices[0]?.message?.content ?? "");
        return NextResponse.json({ avaliacao: result });
      } catch { return NextResponse.json({ error:"Erro ao avaliar resposta." },{ status:500 }); }
    }

        return NextResponse.json({ error:"Ação desconhecida." },{ status:400 });
  } catch (err) {
    console.error("Erro PATCH:", err);
    return NextResponse.json({ error:"Erro interno." },{ status:500 });
  }
}
