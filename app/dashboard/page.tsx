"use client";
// ============================================================
//  Chico Mentor — Dashboard Principal
//  Layout: Biblioteca de Nexos (esquerda) + Chat com Chico (direita)
//  Estética: Apple Style — #F5F5F7, cards brancos, sombras suaves
// ============================================================

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useChicoAudio } from "@/hooks/useChicoAudio";
import type { ChicoCard } from "@/app/api/chico/route";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MentoriaCard extends ChicoCard {
  id: string;
  criado_em: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "chico";
  content: string;
  card?: MentoriaCard;
  isLoading?: boolean;
}

interface UserProfile {
  display_name: string;
  avatar_url?: string;
  tronco: "românico" | "germânico";
  interesses: string[];
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

// Ícone de Play/Stop para áudio
function AudioButton({
  label,
  text,
  lang,
  bcp47,
  isActive,
  onPlay,
  onStop,
}: {
  label: string;
  text: string;
  lang: string;
  bcp47: string;
  isActive: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <button
      onClick={isActive ? onStop : onPlay}
      title={`Ouvir em ${lang}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "20px",
        border: "none",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 500,
        transition: "all 0.2s ease",
        background: isActive
          ? "linear-gradient(135deg, #0071E3 0%, #0077ED 100%)"
          : "rgba(0,113,227,0.08)",
        color: isActive ? "#fff" : "#0071E3",
        letterSpacing: "0.01em",
      }}
      aria-label={`${isActive ? "Parar" : "Ouvir"} ${lang}`}
    >
      {isActive ? (
        // Ícone de pause animado
        <span
          style={{ display: "flex", gap: "2px", alignItems: "center" }}
          aria-hidden="true"
        >
          <span
            style={{
              width: 3,
              height: 10,
              background: "currentColor",
              borderRadius: 2,
              animation: "pulse 0.6s ease-in-out infinite alternate",
            }}
          />
          <span
            style={{
              width: 3,
              height: 14,
              background: "currentColor",
              borderRadius: 2,
              animation: "pulse 0.6s ease-in-out 0.15s infinite alternate",
            }}
          />
          <span
            style={{
              width: 3,
              height: 8,
              background: "currentColor",
              borderRadius: 2,
              animation: "pulse 0.6s ease-in-out 0.3s infinite alternate",
            }}
          />
        </span>
      ) : (
        // Ícone de play
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          aria-hidden="true"
        >
          <polygon points="1,0.5 9,5 1,9.5" />
        </svg>
      )}
      {lang}
    </button>
  );
}

// Card de Nexo linguístico
function NexoCard({
  card,
  onPlay,
  onStop,
  isSpeaking,
  currentLang,
}: {
  card: MentoriaCard;
  onPlay: (text: string, bcp47: string) => void;
  onStop: () => void;
  isSpeaking: boolean;
  currentLang: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const langs = [
    {
      nome: card.lang_1_nome,
      txt: card.lang_1_txt,
      fon: card.lang_1_fon,
      bcp47: card.lang_1_bcp47,
    },
    {
      nome: card.lang_2_nome,
      txt: card.lang_2_txt,
      fon: card.lang_2_fon,
      bcp47: card.lang_2_bcp47,
    },
    {
      nome: card.lang_3_nome,
      txt: card.lang_3_txt,
      fon: card.lang_3_fon,
      bcp47: card.lang_3_bcp47,
    },
  ];

  const troncoColor =
    card.tronco === "românico"
      ? { bg: "rgba(255,59,48,0.07)", dot: "#FF3B30", label: "Tear Românico" }
      : { bg: "rgba(0,113,227,0.07)", dot: "#0071E3", label: "Tear Germânico" };

  const dateStr = new Date(card.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <article
      style={{
        background: "#FFFFFF",
        borderRadius: "18px",
        padding: "20px",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        cursor: "default",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Header do card */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "8px",
              background: troncoColor.bg,
              fontSize: "10px",
              fontWeight: 600,
              color: troncoColor.dot,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: troncoColor.dot,
              }}
            />
            {troncoColor.label}
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              lineHeight: 1.35,
              fontFamily:
                "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif",
            }}
          >
            {card.tema_gerador}
          </h3>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "#86868B",
            whiteSpace: "nowrap",
            marginLeft: "8px",
            paddingTop: "2px",
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Traduções */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {langs.map((l) => (
          <div
            key={l.bcp47}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "#F5F5F7",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.txt}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#86868B",
                  fontStyle: "italic",
                }}
              >
                {l.fon}
              </div>
            </div>
            <AudioButton
              label={l.nome}
              text={l.txt}
              lang={l.nome}
              bcp47={l.bcp47}
              isActive={isSpeaking && currentLang === l.bcp47}
              onPlay={() => onPlay(l.txt, l.bcp47)}
              onStop={onStop}
            />
          </div>
        ))}
      </div>

      {/* Aula do Chico — expansível */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
        }}
        aria-expanded={expanded}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: "12px",
            background: expanded ? "rgba(0,113,227,0.06)" : "#F5F5F7",
            transition: "background 0.2s ease",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#0071E3",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "14px" }}>📖</span>
            Lição do Chico
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="#0071E3"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" stroke="#0071E3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            borderRadius: "12px",
            background: "rgba(0,113,227,0.04)",
            fontSize: "13px",
            lineHeight: "1.65",
            color: "#3A3A3C",
            fontFamily:
              "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif",
          }}
        >
          {card.aula_chico}
        </div>
      )}
    </article>
  );
}

// Bolha de mensagem do chat
function ChatBubble({ message }: { message: ChatMessage }) {
  const isChico = message.role === "chico";

  if (message.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0071E3, #34AADC)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            flexShrink: 0,
          }}
          aria-label="Avatar do Chico"
        >
          🦋
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "18px 18px 18px 4px",
            background: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            display: "flex",
            gap: "5px",
            alignItems: "center",
          }}
          aria-live="polite"
          aria-label="Chico está pensando"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#86868B",
                animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        flexDirection: isChico ? "row" : "row-reverse",
      }}
    >
      {isChico && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0071E3, #34AADC)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            flexShrink: 0,
          }}
          aria-label="Avatar do Chico"
        >
          🦋
        </div>
      )}
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isChico
            ? "18px 18px 18px 4px"
            : "18px 18px 4px 18px",
          background: isChico
            ? "#FFFFFF"
            : "linear-gradient(135deg, #0071E3 0%, #0077ED 100%)",
          boxShadow: isChico
            ? "0 1px 4px rgba(0,0,0,0.08)"
            : "0 2px 8px rgba(0,113,227,0.3)",
          fontSize: "14px",
          lineHeight: "1.55",
          color: isChico ? "#1D1D1F" : "#FFFFFF",
          fontFamily:
            "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

// ── Dashboard Principal ───────────────────────────────────────────────────────

export default function ChicoDashboard() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const { speak, stop, isSpeaking, currentLang, startListening, stopListening,
          isListening, transcript, interimTranscript, resetTranscript } =
    useChicoAudio();

  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [cards, setCards]           = useState<MentoriaCard[]>([]);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [inputText, setInputText]   = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetchingCards, setFetchingCards] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState<"todos" | "românico" | "germânico">("todos");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // ── Carregar perfil e cards ────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) setProfile(prof);

      const { data: c } = await supabase
        .from("mentoria_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("criado_em", { ascending: false })
        .limit(50);

      if (c) setCards(c);
      setFetchingCards(false);
    }

    loadData();
  }, [supabase]);

  // ── Rolar chat para o fim ──────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Integrar transcript de voz no input ──────────────────────────────────

  useEffect(() => {
    if (transcript) {
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // ── Saudação inicial do Chico ─────────────────────────────────────────────

  useEffect(() => {
    if (profile && messages.length === 0) {
      const troncoLabel =
        profile.tronco === "românico" ? "Tear Românico" : "Tear Germânico";
      const interessesList = profile.interesses?.slice(0, 2).join(" e ") ?? "seu universo";

      setMessages([
        {
          id: "welcome",
          role: "chico",
          content: `Olá, ${profile.display_name?.split(" ")[0] ?? "amigo"}. Sou o Chico. Juntos vamos explorar o ${troncoLabel} — não como turistas, mas como arqueólogos que escavam o solo fértil das línguas. Vejo que você se interessa por ${interessesList}. É exatamente aí que começaremos. O que você quer compreender hoje?`,
        },
      ]);
    }
  }, [profile, messages.length]);

  // ── Enviar mensagem ───────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !profile) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const loadingMsg: ChatMessage = {
        id: `loading-${Date.now()}`,
        role: "chico",
        content: "",
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInputText("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tema_gerador: text.trim(),
            tronco: profile.tronco,
            interesses: profile.interesses ?? [],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Erro desconhecido");
        }

        const savedCard: MentoriaCard = data.card;

        // Adiciona card à biblioteca
        setCards((prev) => [savedCard, ...prev]);

        // Substitui a mensagem de loading pela resposta do Chico
        const chicoMsg: ChatMessage = {
          id: `chico-${Date.now()}`,
          role: "chico",
          content: savedCard.aula_chico,
          card: savedCard,
        };

        setMessages((prev) =>
          prev.map((m) => (m.isLoading ? chicoMsg : m))
        );
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "chico",
          content: `Perdoe-me — houve um tropeço no caminho. ${(err as Error).message}. Podemos tentar novamente?`,
        };
        setMessages((prev) =>
          prev.map((m) => (m.isLoading ? errorMsg : m))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, profile]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ── Filtro de cards ───────────────────────────────────────────────────────

  const filteredCards = sidebarFilter === "todos"
    ? cards
    : cards.filter((c) => c.tronco === sidebarFilter);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* CSS global necessário */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          from { transform: scaleY(0.6); }
          to   { transform: scaleY(1.2); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        textarea { resize: none; outline: none; }
        button:focus-visible { outline: 2px solid #0071E3; outline-offset: 2px; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#F5F5F7",
          fontFamily:
            "-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            height: "56px",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0071E3 0%, #34AADC 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🦋
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#1D1D1F",
                letterSpacing: "-0.02em",
              }}
            >
              Chico Mentor
            </span>
            {profile?.tronco && (
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "8px",
                  background:
                    profile.tronco === "românico"
                      ? "rgba(255,59,48,0.10)"
                      : "rgba(0,113,227,0.10)",
                  color:
                    profile.tronco === "românico" ? "#FF3B30" : "#0071E3",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase" as const,
                }}
              >
                {profile.tronco === "românico" ? "Tear Românico" : "Tear Germânico"}
              </span>
            )}
          </div>

          {/* Perfil do usuário */}
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "#86868B" }}>
                {profile.display_name}
              </span>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(0,0,0,0.08)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #5E5CE6, #BF5AF2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {profile.display_name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
          )}
        </header>

        {/* ── Layout principal ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            gap: "0",
          }}
        >
          {/* ── Coluna Esquerda: Biblioteca de Nexos ──────────────────────── */}
          <aside
            style={{
              width: "380px",
              minWidth: "320px",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid rgba(0,0,0,0.07)",
              background: "#F5F5F7",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Header da sidebar */}
            <div
              style={{
                padding: "20px 20px 12px",
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  letterSpacing: "-0.02em",
                }}
              >
                Biblioteca de Nexos
              </h2>
              <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#86868B" }}>
                {cards.length} {cards.length === 1 ? "nexo salvo" : "nexos salvos"}
              </p>

              {/* Filtro de tronco */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "rgba(0,0,0,0.06)",
                }}
                role="group"
                aria-label="Filtrar por tronco"
              >
                {(["todos", "românico", "germânico"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSidebarFilter(f)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: "9px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                      background:
                        sidebarFilter === f
                          ? "#FFFFFF"
                          : "transparent",
                      color:
                        sidebarFilter === f ? "#1D1D1F" : "#86868B",
                      boxShadow:
                        sidebarFilter === f
                          ? "0 1px 4px rgba(0,0,0,0.12)"
                          : "none",
                    }}
                    aria-pressed={sidebarFilter === f}
                  >
                    {f === "todos" ? "Todos" : f === "românico" ? "Românico" : "Germânico"}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de cards */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {isFetchingCards ? (
                // Skeleton loading
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 160,
                      borderRadius: "18px",
                      background: "linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s ease-in-out infinite",
                    }}
                    aria-hidden="true"
                  />
                ))
              ) : filteredCards.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 20px",
                    textAlign: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "40px", opacity: 0.5 }}>🔮</span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#86868B",
                      lineHeight: 1.5,
                    }}
                  >
                    {sidebarFilter === "todos"
                      ? "Sua biblioteca está vazia. Inicie uma conversa com o Chico."
                      : `Nenhum nexo do tear ${sidebarFilter} ainda.`}
                  </p>
                </div>
              ) : (
                filteredCards.map((card) => (
                  <div
                    key={card.id}
                    style={{ animation: "fadeSlideIn 0.3s ease forwards" }}
                  >
                    <NexoCard
                      card={card}
                      onPlay={(text, bcp47) => speak({ text, lang: bcp47 })}
                      onStop={stop}
                      isSpeaking={isSpeaking}
                      currentLang={currentLang}
                    />
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── Coluna Direita: Chat com o Chico ──────────────────────────── */}
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#F5F5F7",
            }}
          >
            {/* Mensagens */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
              role="log"
              aria-live="polite"
              aria-label="Conversa com o Chico"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{ animation: "fadeSlideIn 0.3s ease forwards" }}
                >
                  <ChatBubble message={msg} />
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Indicador de voz ativa */}
            {isListening && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px",
                  background: "rgba(255,59,48,0.08)",
                  borderTop: "1px solid rgba(255,59,48,0.15)",
                }}
                role="status"
                aria-live="assertive"
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#FF3B30",
                    animation: "pulse 0.8s ease-in-out infinite alternate",
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: "13px", color: "#FF3B30", fontWeight: 500 }}>
                  Ouvindo...
                </span>
                {interimTranscript && (
                  <span style={{ fontSize: "12px", color: "#86868B", fontStyle: "italic" }}>
                    "{interimTranscript}"
                  </span>
                )}
              </div>
            )}

            {/* Input de texto */}
            <div
              style={{
                padding: "16px 24px 20px",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(0,0,0,0.07)",
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
                aria-label="Enviar mensagem ao Chico"
              >
                {/* Textarea */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    borderRadius: "20px",
                    border: "1px solid rgba(0,0,0,0.10)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocusCapture={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(0,113,227,0.4)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 0 3px rgba(0,113,227,0.12)";
                  }}
                  onBlurCapture={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(0,0,0,0.10)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 1px 4px rgba(0,0,0,0.06)";
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao Chico... (Ex: Como dizer 'gol de placa' em francês?)"
                    rows={1}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      color: "#1D1D1F",
                      fontFamily: "inherit",
                      maxHeight: "120px",
                      overflowY: "auto",
                      padding: 0,
                    }}
                    aria-label="Mensagem para o Chico"
                  />

                  {/* Botão de microfone */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "none",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isListening
                        ? "#FF3B30"
                        : "rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                    aria-label={isListening ? "Parar gravação" : "Gravar voz"}
                    aria-pressed={isListening}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isListening ? "#fff" : "#86868B"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                </div>

                {/* Botão de envio */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    cursor:
                      !inputText.trim() || isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      !inputText.trim() || isLoading
                        ? "rgba(0,0,0,0.08)"
                        : "linear-gradient(135deg, #0071E3 0%, #0077ED 100%)",
                    transition: "all 0.2s ease",
                    boxShadow:
                      !inputText.trim() || isLoading
                        ? "none"
                        : "0 2px 8px rgba(0,113,227,0.35)",
                    flexShrink: 0,
                  }}
                  aria-label="Enviar mensagem"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={!inputText.trim() || isLoading ? "#86868B" : "#fff"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "11px",
                  color: "#AEAEB2",
                  textAlign: "center",
                }}
              >
                ⌘ + Enter para nova linha · Enter para enviar
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}