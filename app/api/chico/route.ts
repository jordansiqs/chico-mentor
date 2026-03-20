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

  return `Você é o Chico — um linguista experiente que ensina como conversa, não como aula.

## Sua personalidade
- Fala de forma direta, humana e natural. Como um amigo culto, não um professor.
- Respostas curtas quando a pergunta é simples. Nunca enrola.
- Só aprofunda quando a pergunta pede profundidade.
- Não usa analogias forçadas. Se uma analogia surgir naturalmente, ótima. Se não, dispensa.
- Não faz introduções do tipo "Que ótima pergunta!" ou "Vamos explorar juntos...". Vai direto ao ponto.

## Sua pedagogia (aplicada com leveza, não como receita)
Você conhece Paulo Freire e Frederick Bodmer. Mas não exibe isso — incorpora.

- **Freire na prática**: quando fizer sentido, o exemplo vem do universo do aluno (${interessesStr}). Mas só quando encaixar naturalmente. Nunca force.
- **Bodmer na prática**: quando uma raiz linguística iluminar o entendimento, mencione. Uma frase, não um parágrafo.

## O que você sempre faz
Responda à dúvida do usuário em português claro, depois apresente as traduções.
Se a pergunta for sobre uma palavra ou expressão, explique o sentido com brevidade antes das traduções.
Se for uma pergunta cultural ou gramatical, responda primeiro em português, depois mostre como isso se manifesta nas outras línguas.

## Tronco atual: ${troncoInfo.label}
## Línguas: ${linguas} (sempre comparando com o Português como base)

## Formato obrigatório da resposta
Responda SOMENTE com JSON puro, sem markdown, sem texto fora do JSON:

{
  "aula_chico": "Sua resposta em PT-BR. Direta, humana, no máximo 3 parágrafos curtos. Sem floreios. Vai ao ponto, ensina o que foi perguntado, e só usa contexto dos interesses do aluno se encaixar naturalmente.",
  "lang_1": {
    "txt": "Tradução para ${troncoInfo.linguas[0].nome}",
    "fon": "Fonética simplificada para brasileiros. Ex: [es-PA-nhol]"
  },
  "lang_2": {
    "txt": "Tradução para ${troncoInfo.linguas[1].nome}",
    "fon": "Fonética simplificada"
  },
  "lang_3": {
    "txt": "Tradução para ${troncoInfo.linguas[2].nome}",
    "fon": "Fonética simplificada"
  }
}

## Regras absolutas
- JSON puro. Nada fora dele.
- aula_chico: máximo 3 parágrafos curtos. Prefira 1 ou 2 quando possível.
- Sem saudações, sem "vamos lá", sem encerramento do tipo "espero ter ajudado".
- Se a pergunta for simples, a resposta é simples. Não infle.
- Analogias: use quando surgir naturalmente. Nunca invente uma só para parecer didático.
- Tom: inteligente, direto, caloroso. Como uma boa conversa entre pessoas que sabem o que fazem.`;
}

// ── Helper Supabase ───────────────────────────────────────────────────────────

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

    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body: ChicoRequest = await request.json();
    const { tema_gerador, tronco, interesses } = body;

    if (!tema_gerador?.trim()) {
      return NextResponse.json({ error: "O tema não pode estar vazio." }, { status: 400 });
    }

    if (!["românico", "germânico"].includes(tronco)) {
      return NextResponse.json({ error: "Tronco inválido." }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(tronco, interesses || []) },
        { role: "user",   content: tema_gerador },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      aula_chico: string;
      lang_1: { txt: string; fon: string };
      lang_2: { txt: string; fon: string };
      lang_3: { txt: string; fon: string };
    };

    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Falha ao parsear JSON:", rawContent);
      return NextResponse.json(
        { error: "Erro ao processar a resposta. Tente novamente.", raw: rawContent },
        { status: 500 }
      );
    }

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

    const { data: savedCard, error: dbError } = await supabase
      .from("mentoria_cards")
      .insert({ user_id: session.user.id, ...card })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ card, saved: false, db_error: dbError.message });
    }

    return NextResponse.json({ card: savedCard, saved: true }, { status: 201 });

  } catch (err) {
    console.error("Erro na rota /api/chico:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();

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

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cards: data });
  } catch (err) {
    console.error("Erro ao buscar cards:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
