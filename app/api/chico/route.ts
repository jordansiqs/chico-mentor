// app/api/chico/route.ts
// ============================================================
//  Chico Mentor — Rota de API
//  Stack: Next.js 15 App Router + Groq SDK (Llama 3.3 70B)
//  Retorna JSON estruturado para alimentar a tabela mentoria_cards
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ChicoRequest {
  tema_gerador: string;   // A dúvida/frase original do usuário
  tronco: "românico" | "germânico";
  interesses: string[];   // Ex: ['futebol', 'música'] — Temas Geradores de Freire
}

export interface ChicoCard {
  tema_gerador: string;
  tronco: "românico" | "germânico";
  aula_chico: string;

  lang_1_nome: string;
  lang_1_txt: string;
  lang_1_fon: string;
  lang_1_bcp47: string;

  lang_2_nome: string;
  lang_2_txt: string;
  lang_2_fon: string;
  lang_2_bcp47: string;

  lang_3_nome: string;
  lang_3_txt: string;
  lang_3_fon: string;
  lang_3_bcp47: string;
}

// ── Configuração dos Troncos ──────────────────────────────────────────────────

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
      { nome: "Inglês",    bcp47: "en-US" },
      { nome: "Alemão",    bcp47: "de-DE" },
      { nome: "Holandês",  bcp47: "nl-NL" },
    ],
  },
} as const;

// ── System Prompt — A Alma do Chico ──────────────────────────────────────────

function buildSystemPrompt(
  tronco: "românico" | "germânico",
  interesses: string[]
): string {
  const troncoInfo = TRONCOS[tronco];
  const interessesStr = interesses.length > 0
    ? interesses.join(", ")
    : "cotidiano geral";

  const linguas = troncoInfo.linguas.map((l) => l.nome).join(", ");

  return `Você é o Chico — um mentor de linguagens maduro, sereno, profundo e encorajador.
Sua pedagogia funde dois pilares:

1. **Pedagogia da Autonomia (Paulo Freire)** — "Temas Geradores":
   Você nunca ensina no vácuo. Sempre ancora seu ensinamento nos interesses reais do aprendiz.
   Os interesses declarados deste aprendiz são: ${interessesStr}.
   Toda explicação deve usar metáforas, exemplos e cenários desses temas.

2. **Arqueologia Linguística (Frederick Bodmer / "The Loom of Language")**:
   Você não ensina línguas isoladas. Você revela as engrenagens e raízes comuns.
   Você mostra cognatos, padrões morfológicos e como as línguas evoluíram de troncos comuns.
   Ao explicar uma palavra ou estrutura, você ilumina a raiz latina, germânica ou proto-indo-europeia
   que conecta todas as línguas do tronco.

**Tronco atual:** ${troncoInfo.label}
**Línguas a traduzir:** ${linguas} (sempre tendo o Português como base de comparação)

**Sua tarefa para cada mensagem:**
Você receberá uma dúvida ou frase em Português. Você deve responder com um JSON **puro**, sem markdown,
no seguinte formato exato:

{
  "aula_chico": "Sua explicação pedagógica rica em PT-BR (3 a 5 parágrafos). Use a analogia com ${interessesStr}. Revele a raiz linguística. Seja o mestre que o Brasil nunca teve.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonetização simplificada para um brasileiro ler em voz alta. Ex: [es-pa-NHOL: 'fú-bol']"
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonetização simplificada"
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonetização simplificada"
  }
}

Regras absolutas:
- Responda SOMENTE com o JSON. Sem texto antes ou depois. Sem blocos de código markdown.
- A chave "aula_chico" deve ser um texto corrido, rico, pedagógico e inspirador — nunca uma lista de tópicos.
- As fonetizações usam a fonética intuitiva para falantes de PT-BR (ex: inglês "the" → "di").
- Conecte sempre as línguas: "Note como 'football' em inglês guarda a mesma raiz latina 'pé' (foot ← pes/pedis)..."
- Tom de voz: como um mestre sábio contando uma história junto a uma fogueira.`;
}

// ── Handler Principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação via Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // 2. Parse do body
    const body: ChicoRequest = await request.json();
    const { tema_gerador, tronco, interesses } = body;

    if (!tema_gerador?.trim()) {
      return NextResponse.json(
        { error: "O tema gerador não pode estar vazio." },
        { status: 400 }
      );
    }

    if (!["românico", "germânico"].includes(tronco)) {
      return NextResponse.json(
        { error: "Tronco inválido. Escolha 'românico' ou 'germânico'." },
        { status: 400 }
      );
    }

    // 3. Chamada ao Groq
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = buildSystemPrompt(tronco, interesses || []);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    // 4. Parse do JSON retornado pelo Chico
    let parsed: {
      aula_chico: string;
      lang_1: { txt: string; fon: string };
      lang_2: { txt: string; fon: string };
      lang_3: { txt: string; fon: string };
    };

    try {
      // Remove possíveis backticks residuais de segurança
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Falha ao parsear JSON do Chico:", rawContent);
      return NextResponse.json(
        {
          error: "O Chico teve dificuldade em formatar a resposta. Tente novamente.",
          raw: rawContent,
        },
        { status: 500 }
      );
    }

    // 5. Montar o card completo
    const troncoInfo = TRONCOS[tronco];
    const card: ChicoCard = {
      tema_gerador,
      tronco,
      aula_chico: parsed.aula_chico,

      lang_1_nome:  troncoInfo.linguas[0].nome,
      lang_1_txt:   parsed.lang_1.txt,
      lang_1_fon:   parsed.lang_1.fon,
      lang_1_bcp47: troncoInfo.linguas[0].bcp47,

      lang_2_nome:  troncoInfo.linguas[1].nome,
      lang_2_txt:   parsed.lang_2.txt,
      lang_2_fon:   parsed.lang_2.fon,
      lang_2_bcp47: troncoInfo.linguas[1].bcp47,

      lang_3_nome:  troncoInfo.linguas[2].nome,
      lang_3_txt:   parsed.lang_3.txt,
      lang_3_fon:   parsed.lang_3.fon,
      lang_3_bcp47: troncoInfo.linguas[2].bcp47,
    };

    // 6. Salvar no Supabase
    const { data: savedCard, error: dbError } = await supabase
      .from("mentoria_cards")
      .insert({
        user_id: session.user.id,
        ...card,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao salvar no Supabase:", dbError);
      // Retorna o card mesmo se falhar o save (degradação graciosa)
      return NextResponse.json({ card, saved: false, db_error: dbError.message });
    }

    return NextResponse.json({ card: savedCard, saved: true }, { status: 201 });
  } catch (err) {
    console.error("Erro inesperado na rota /api/chico:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// ── GET: Buscar cards do usuário ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

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

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cards: data, total: count });
  } catch (err) {
    console.error("Erro ao buscar cards:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}