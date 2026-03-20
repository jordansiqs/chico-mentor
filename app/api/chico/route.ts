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
}

export interface ChicoCard {
  tema_gerador: string;
  titulo_card: string;
  tronco: "românico" | "germânico";
  aula_chico: string;

  lang_1_nome: string;
  lang_1_txt: string;
  lang_1_fon: string;
  lang_1_exemplo: string;
  lang_1_bcp47: string;

  lang_2_nome: string;
  lang_2_txt: string;
  lang_2_fon: string;
  lang_2_exemplo: string;
  lang_2_bcp47: string;

  lang_3_nome: string;
  lang_3_txt: string;
  lang_3_fon: string;
  lang_3_exemplo: string;
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
  interesses: string[]
): string {
  const troncoInfo    = TRONCOS[tronco];
  const linguas       = troncoInfo.linguas.map(l => l.nome).join(", ");
  const interessesStr = interesses.length > 0 ? interesses.join(", ") : "cotidiano";

  return `Você é o Chico — um linguista que ensina como conversa: direto, humano, sem enrolar.

## Tom e estilo
- Respostas curtas e densas. Nada de introduções ou fechamentos.
- Vai direto ao que foi perguntado.
- Quando uma conexão com os interesses do aluno (${interessesStr}) surgir naturalmente, use. Nunca force.
- Mencione raízes linguísticas só quando iluminarem o entendimento — uma frase, não um parágrafo.

## O que você SEMPRE faz em cada resposta
1. **Explica o significado** da palavra ou expressão em português claro (1-2 frases).
2. **Mostra o tempo verbal e por quê**: se a tradução envolve um verbo, explique o tempo usado (presente, passado, imperativo, etc.) e quando usá-lo. Se não for verbo, explique a classe gramatical rapidamente.
3. **Extrai a palavra-chave principal**: identifique a palavra ou expressão central da pergunta — essa será o título do card (máximo 3 palavras).

## Tronco: ${troncoInfo.label} | Línguas: ${linguas}

## Formato obrigatório — JSON puro, sem markdown
{
  "titulo_card": "A palavra ou expressão central. Máximo 3 palavras. Ex: 'Saudade', 'Bom dia', 'Correr'",
  "aula_chico": "Explicação em PT-BR. Máximo 2 parágrafos curtos. Inclui: o que significa, o tempo verbal (se aplicável) e quando usar. Direto, sem floreios.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética simplificada para brasileiros. Ex: [a-MI-go]",
    "exemplo": "Uma frase curta de uso real em ${troncoInfo.linguas[0].nome}. Contextualizada no cotidiano ou em ${interessesStr} se encaixar."
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Uma frase curta de uso real em ${troncoInfo.linguas[1].nome}."
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética simplificada",
    "exemplo": "Uma frase curta de uso real em ${troncoInfo.linguas[2].nome}."
  }
}

## Regras absolutas
- JSON puro. Nada fora dele.
- titulo_card: máximo 3 palavras, sem pontuação final.
- aula_chico: máximo 2 parágrafos. Sem saudações, sem "espero ter ajudado".
- exemplo: frase real e natural, não uma tradução literal da palavra. Mostra como se usa na prática.
- Se a pergunta for simples, a resposta é simples. Não infle.`;
}

// ── Supabase Helper ───────────────────────────────────────────────────────────

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
    const { tema_gerador, tronco, interesses } = body;

    if (!tema_gerador?.trim()) return NextResponse.json({ error: "Tema vazio." }, { status: 400 });
    if (!["românico", "germânico"].includes(tronco)) return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 1200,
      messages: [
        { role: "system", content: buildSystemPrompt(tronco, interesses || []) },
        { role: "user",   content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      titulo_card: string;
      aula_chico: string;
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
      titulo_card:  parsed.titulo_card ?? tema_gerador.slice(0, 40),
      tronco,
      aula_chico:   parsed.aula_chico,

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
    console.error("Erro GET cards:", err);
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
    console.error("Erro DELETE card:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
