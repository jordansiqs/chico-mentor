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

// ── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  tronco: "românico" | "germânico",
  interesses: string[],
  nexos_recentes: string[]
): string {
  const troncoInfo    = TRONCOS[tronco];
  const linguas       = troncoInfo.linguas.map(l => l.nome).join(", ");
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";
  const nexosStr      = nexos_recentes.length > 0
    ? `Palavras que o aluno já aprendeu: ${nexos_recentes.slice(0, 10).join(", ")}.`
    : "";

  return `Você é o Chico — linguista que ensina como um amigo culto, não como professor.

## Identidade
Direto. Humano. Ensina na medida certa — nem raso, nem enciclopédico.
Sua voz: inteligente, calorosa, sem floreio.

## Tronco: ${troncoInfo.label} | Línguas: ${linguas}
## Interesses do aluno: ${interessesStr}
## ${nexosStr}

## COMO VOCÊ ENSINA — siga esta ordem sempre

### 1. A PALAVRA PRIMEIRO
Comece com a palavra ou expressão central, em destaque.
Diga o que ela é (classe gramatical) e o que significa — em 1 frase limpa.

### 2. COMO SE USA — contexto real
Dê 1 exemplo prático, preferencialmente ligado aos interesses do aluno (${interessesStr}).
O exemplo deve ser uma situação real, não uma frase de livro didático.

### 3. TEMPO VERBAL (só se for verbo)
Se a palavra for um verbo, diga qual tempo está sendo usado e quando aplicar.
1 frase. Não faça tabela de conjugação.

### 4. CONEXÃO (só se existir)
Se a nova palavra conecta com algo que o aluno já aprendeu (${nexosStr}), mencione em 1 frase.
Se não houver conexão, pule este passo.

### 5. PERGUNTA FINAL
Ao final, faça UMA pergunta curta e prática.
Ela deve ser respondível em 1-2 frases e conectada ao cotidiano ou interesses do aluno.
Ex: "Como você usaria isso numa viagem?" ou "Você lembra como diz X em espanhol?"

## CORREÇÃO NATURAL
Se o aluno escrever algo errado, corrija de forma natural na resposta.
Não sinalize o erro explicitamente. Apenas use a forma correta no contexto.
Ex: aluno escreve "eu gostei de the music" → você responde "Ah, *the music* — *la música* em espanhol..."

## APROFUNDAMENTO SOB DEMANDA
Responda o que foi perguntado. Não elabore além.
Se quiser aprofundar algo, termine com "Quer saber mais sobre [aspecto específico]?"
Nunca dê tudo de uma vez.

## REGRAS DE FORMATO
- Resposta máxima: 3 parágrafos curtos ou equivalente
- Sem introduções ("Que ótima pergunta!")
- Sem fechamentos ("Espero ter ajudado!")
- Sem listas com bullets no aula_chico
- Use o histórico da conversa para não repetir o que já foi ensinado

## FORMATO DE SAÍDA — CRÍTICO
Responda SOMENTE com o JSON abaixo. Nenhum texto antes ou depois.
Não use markdown. Não use blocos de código. Não escreva nada fora do JSON.
A primeira linha deve ser { e a última linha deve ser }

{
  "titulo_card": "Palavra central. Máx 3 palavras. Sem pontuação.",
  "aula_chico": "Sua resposta seguindo a ordem: palavra → uso real → tempo verbal (se verbo) → conexão (se houver) → pergunta. Máx 3 parágrafos.",
  "pergunta_verificacao": "A pergunta final extraída do aula_chico. Exatamente igual ao que está no aula_chico.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética para brasileiros. Ex: [a-MI-go]",
    "exemplo": "Frase curta, natural e contextualizada em ${interessesStr} se possível."
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

## REGRAS ABSOLUTAS
- JSON puro. Nada fora dele.
- titulo_card: máx 3 palavras.
- aula_chico: máx 3 parágrafos. Sem bullets. Sem saudações ou despedidas.
- exemplo: frase de uso real, não tradução literal. Contextualizada nos interesses quando natural.
- Pergunta simples = resposta simples. Não infle.
- Nunca repita uma palavra que já foi ensinada (${nexosStr}).`;
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

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const body: ChicoRequest = await request.json();
    const { tema_gerador, tronco, interesses, historico = [], nexos_recentes = [] } = body;

    if (!tema_gerador?.trim()) return NextResponse.json({ error: "Tema vazio." }, { status: 400 });
    if (!["românico", "germânico"].includes(tronco)) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const historicoLimitado = historico.slice(-8).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.55,
      max_tokens:  1400,
      messages: [
        { role: "system", content: buildSystemPrompt(tronco, interesses || [], nexos_recentes) },
        ...historicoLimitado,
        { role: "user",   content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      titulo_card: string;
      aula_chico: string;
      pergunta_verificacao?: string;
      lang_1: { txt: string; fon: string; exemplo: string };
      lang_2: { txt: string; fon: string; exemplo: string };
      lang_3: { txt: string; fon: string; exemplo: string };
    };

    try {
      // Estratégia robusta: tenta 3 abordagens em sequência
      let jsonStr = "";

      // 1. Extrai o primeiro bloco JSON completo entre { }
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // 2. Remove markdown fences e tenta diretamente
        jsonStr = rawContent
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
      }

      parsed = JSON.parse(jsonStr);

      // Valida campos obrigatórios
      if (!parsed.aula_chico || !parsed.lang_1 || !parsed.lang_2 || !parsed.lang_3) {
        throw new Error("Campos obrigatórios ausentes no JSON");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "\nRaw content:", rawContent);

      // Fallback: cria uma resposta básica para não quebrar a UX
      const troncoInfoFallback = TRONCOS[tronco];
      parsed = {
        titulo_card: tema_gerador.slice(0, 30),
        aula_chico: rawContent.replace(/```json[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim() || "Não consegui processar a resposta. Tente reformular sua pergunta.",
        pergunta_verificacao: undefined,
        lang_1: { txt: "—", fon: "—", exemplo: "—" },
        lang_2: { txt: "—", fon: "—", exemplo: "—" },
        lang_3: { txt: "—", fon: "—", exemplo: "—" },
      };
    }

    const troncoInfo = TRONCOS[tronco];
    const card: ChicoCard = {
      tema_gerador,
      titulo_card:          parsed.titulo_card ?? tema_gerador.slice(0, 40),
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

    if (dbError) return NextResponse.json({ card, saved: false, db_error: dbError.message });

    return NextResponse.json({ card: savedCard, saved: true }, { status: 201 });

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

// ── PATCH — Roteiro de aprendizado ────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { tronco, interesses, tema } = await request.json();
    const troncoInfo = TRONCOS[tronco as "românico" | "germânico"];
    if (!troncoInfo) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Crie um roteiro de aprendizado linguístico com exatamente 5 palavras sobre "${tema}" para o ${troncoInfo.label}.
Progressão: do mais simples ao mais complexo. Conexão semântica entre as palavras.
Responda APENAS com JSON:
{
  "titulo": "Nome do roteiro",
  "descricao": "Uma frase descrevendo o roteiro",
  "nexos": [
    {"palavra": "palavra1", "motivo": "por que começar aqui"},
    {"palavra": "palavra2", "motivo": "próximo passo natural"},
    {"palavra": "palavra3", "motivo": "..."},
    {"palavra": "palavra4", "motivo": "..."},
    {"palavra": "palavra5", "motivo": "passo final"}
  ]
}`
      }],
    });

    const raw     = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();

    try {
      return NextResponse.json({ roteiro: JSON.parse(cleaned) });
    } catch {
      return NextResponse.json({ error: "Erro ao gerar roteiro." }, { status: 500 });
    }
  } catch (err) {
    console.error("Erro PATCH:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
