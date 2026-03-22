"use client";
// app/onboarding/page.tsx

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Mascote SVG ───────────────────────────────────────────────────────────────

function ChicoFace({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <rect x="8" y="32" width="34" height="68" rx="17" fill="#B8721A"/>
      <rect x="118" y="32" width="34" height="68" rx="17" fill="#B8721A"/>
      <rect x="15" y="40" width="20" height="50" rx="10" fill="#D08828"/>
      <rect x="125" y="40" width="20" height="50" rx="10" fill="#D08828"/>
      <circle cx="80" cy="80" r="56" fill="#E29830"/>
      <circle cx="46" cy="92" r="17" fill="#D08828"/>
      <circle cx="114" cy="92" r="17" fill="#D08828"/>
      <ellipse cx="80" cy="100" rx="26" ry="20" fill="#F2DFA0"/>
      <ellipse cx="80" cy="88" rx="12" ry="8" fill="#1A0800"/>
      <ellipse cx="76" cy="85" rx="3" ry="2" fill="#2A1000" opacity="0.5"/>
      <ellipse cx="84" cy="85" rx="3" ry="2" fill="#2A1000" opacity="0.5"/>
      <circle cx="60" cy="72" r="13" fill="white"/>
      <circle cx="100" cy="72" r="13" fill="white"/>
      <circle cx="60" cy="72" r="9" fill="#5A3208"/>
      <circle cx="100" cy="72" r="9" fill="#5A3208"/>
      <circle cx="60" cy="72" r="5" fill="#0E0400"/>
      <circle cx="100" cy="72" r="5" fill="#0E0400"/>
      <circle cx="64" cy="68" r="3" fill="white"/>
      <circle cx="104" cy="68" r="3" fill="white"/>
      <circle cx="62" cy="75" r="1.5" fill="rgba(255,255,255,0.6)"/>
      <circle cx="102" cy="75" r="1.5" fill="rgba(255,255,255,0.6)"/>
      <path d="M48 60 Q60 54 72 59" stroke="#7A4008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M88 59 Q100 54 112 60" stroke="#7A4008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M66 108 Q80 118 94 108" stroke="#7A4008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="80" cy="114" rx="10" ry="8" fill="#E04870"/>
      <line x1="80" y1="108" x2="80" y2="122" stroke="#C02858" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="44" cy="96" rx="10" ry="6" fill="#E07070" opacity="0.22"/>
      <ellipse cx="116" cy="96" rx="10" ry="6" fill="#E07070" opacity="0.22"/>
    </svg>
  );
}

// ── Dados ─────────────────────────────────────────────────────────────────────

const TRONCOS = [
  {
    id: "românico" as const,
    label: "Tear Românico",
    desc: "Espanhol, Francês e Italiano",
    color: "#C04018",
    bg: "#FFF3EE",
    border: "#FFDDD0",
    flags: ["🇪🇸", "🇫🇷", "🇮🇹"],
    detalhe: "Línguas filhas do latim, moldadas pelo sol do Mediterrâneo.",
  },
  {
    id: "germânico" as const,
    label: "Tear Germânico",
    desc: "Inglês, Alemão e Holandês",
    color: "#1A4A8A",
    bg: "#EEF3FF",
    border: "#C8D8F8",
    flags: ["🇬🇧", "🇩🇪", "🇳🇱"],
    detalhe: "Línguas do norte — precisas, robustas e ricas em compostos.",
  },
];

const INTERESSES = [
  { id: "futebol",     emoji: "⚽", label: "Futebol" },
  { id: "música",      emoji: "🎵", label: "Música" },
  { id: "culinária",   emoji: "🍳", label: "Culinária" },
  { id: "tecnologia",  emoji: "💻", label: "Tecnologia" },
  { id: "viagens",     emoji: "✈️", label: "Viagens" },
  { id: "cinema",      emoji: "🎬", label: "Cinema" },
  { id: "literatura",  emoji: "📚", label: "Literatura" },
  { id: "negócios",    emoji: "💼", label: "Negócios" },
  { id: "esportes",    emoji: "🏃", label: "Esportes" },
  { id: "arte",        emoji: "🎨", label: "Arte" },
  { id: "jogos",       emoji: "🎮", label: "Jogos" },
  { id: "natureza",    emoji: "🌿", label: "Natureza" },
  { id: "história",    emoji: "🏛️", label: "História" },
  { id: "ciência",     emoji: "🔬", label: "Ciência" },
  { id: "moda",        emoji: "👗", label: "Moda" },
  { id: "fotografia",  emoji: "📷", label: "Fotografia" },
  { id: "saúde",       emoji: "💪", label: "Saúde" },
  { id: "política",    emoji: "🗳️", label: "Política" },
];

// ── Componente principal ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const supabase = createSupabase();

  const [step, setStep]           = useState(1);
  const [nome, setNome]           = useState("");
  const [troncos, setTroncos]     = useState<("românico" | "germânico")[]>([]);
  const [interesses, setInteresses] = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [animDir, setAnimDir]     = useState<"forward" | "back">("forward");

  // Pré-preenche nome do Google
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/"; return; }
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      const firstName = displayName.split(" ")[0] || "";
      setNome(firstName);
    }
    load();
  }, []);

  function goNext() { setAnimDir("forward"); setStep(s => s + 1); }
  function goBack() { setAnimDir("back");    setStep(s => s - 1); }

  function toggleTronco(id: "românico" | "germânico") {
    setTroncos(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  function toggleInteresse(id: string) {
    setInteresses(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    if (troncos.length === 0 || interesses.length === 0) {
      setError("Selecione pelo menos um tronco e um interesse.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sem sessão");

      const { error: dbErr } = await supabase.from("user_profiles").upsert({
        id:                  user.id,
        display_name:        nome.trim() || user.user_metadata?.full_name || "Aluno",
        tronco:              troncos[0],
        troncos_selecionados: troncos,
        interesses,
        onboarding_ok:       true,
      }, { onConflict: "id" });

      if (dbErr) throw dbErr;
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message || "Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  // ── Estilos base ─────────────────────────────────────────────────────────

  const S = {
    page: {
      minHeight: "100vh",
      background: "#F5F7FF",
      fontFamily: "'Nunito', -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    } as React.CSSProperties,

    card: {
      width: "100%",
      maxWidth: "520px",
      background: "#FFFFFF",
      borderRadius: "24px",
      boxShadow: "0 4px 40px rgba(26,74,138,0.10), 0 1px 4px rgba(26,74,138,0.06)",
      padding: "40px 40px 36px",
      animation: "fadeUp 0.4s ease forwards",
    } as React.CSSProperties,

    progress: {
      display: "flex",
      gap: "6px",
      marginBottom: "36px",
    } as React.CSSProperties,

    dot: (active: boolean, done: boolean): React.CSSProperties => ({
      flex: 1,
      height: 4,
      borderRadius: 4,
      background: done ? "#1A4A8A" : active ? "#E07820" : "rgba(0,0,0,0.09)",
      transition: "background 0.3s ease",
    }),

    h1: {
      fontSize: "26px",
      fontWeight: 800,
      color: "#1A4A8A",
      letterSpacing: "-0.02em",
      margin: "0 0 8px",
      lineHeight: 1.2,
    } as React.CSSProperties,

    sub: {
      fontSize: "15px",
      color: "#6A7A9A",
      lineHeight: 1.55,
      margin: "0 0 28px",
    } as React.CSSProperties,

    btn: (disabled = false): React.CSSProperties => ({
      width: "100%",
      padding: "14px",
      borderRadius: "14px",
      border: "none",
      background: disabled ? "rgba(0,0,0,0.07)" : "linear-gradient(135deg,#1A4A8A,#2A6ACC)",
      color: disabled ? "#AEAEB2" : "#fff",
      fontSize: "16px",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Nunito', sans-serif",
      boxShadow: disabled ? "none" : "0 3px 14px rgba(26,74,138,0.28)",
      transition: "all 0.2s",
      letterSpacing: "-0.01em",
    }),

    backBtn: {
      background: "none",
      border: "none",
      color: "#8A9AB8",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Nunito', sans-serif",
      padding: "8px 0",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    } as React.CSSProperties,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F7FF; }
        input { outline: none; -webkit-appearance: none; }
        input:focus { border-color: #1A4A8A !important; }
      `}</style>

      <div style={S.page}>
        <div style={S.card}>

          {/* Barra de progresso */}
          <div style={S.progress}>
            {[1, 2, 3].map(n => (
              <div key={n} style={S.dot(step === n, step > n)}/>
            ))}
          </div>

          {/* ── PASSO 1 — Boas-vindas ──────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.35s ease forwards" }}>
              {/* Mascote centralizado */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div style={{ position: "relative" as const }}>
                  <ChicoFace size={100}/>
                  {/* Balão de fala */}
                  <div style={{ position: "absolute" as const, top: -8, right: -100, background: "#1A4A8A", color: "#fff", fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "20px 20px 20px 4px", whiteSpace: "nowrap" as const, boxShadow: "0 2px 8px rgba(26,74,138,0.25)" }}>
                    Au au! 🐾
                  </div>
                </div>
              </div>

              <h1 style={S.h1}>Oi! Sou o Chico.</h1>
              <p style={S.sub}>
                Vou te ensinar línguas do jeito que você aprende — com exemplos do que você gosta, conexões que fazem sentido e muita curiosidade.
              </p>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#3A4A6A", marginBottom: "8px", letterSpacing: "0.01em" }}>
                  Como posso te chamar?
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu primeiro nome"
                  onKeyDown={e => e.key === "Enter" && nome.trim() && goNext()}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: "12px",
                    border: "2px solid rgba(0,0,0,0.10)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1A2A40",
                    fontFamily: "'Nunito', sans-serif",
                    background: "#F8F9FF",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#1A4A8A")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.10)")}
                />
              </div>

              <button
                onClick={goNext}
                disabled={!nome.trim()}
                style={S.btn(!nome.trim())}
              >
                Vamos começar →
              </button>
            </div>
          )}

          {/* ── PASSO 2 — Tronco ───────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ animation: "fadeUp 0.35s ease forwards" }}>
              {/* Chico pequeno no canto */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <ChicoFace size={48}/>
                <div style={{ background: "#F0F5FF", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", fontSize: "14px", color: "#3A5A9A", fontWeight: 600, lineHeight: 1.4, maxWidth: "300px" }}>
                  {nome ? `${nome}, qual` : "Qual"} família de línguas mais te chama?
                </div>
              </div>

              <h1 style={{ ...S.h1, fontSize: "22px" }}>Escolha seu tronco</h1>
              <p style={{ ...S.sub, marginBottom: "20px" }}>
                Você pode escolher os dois — o Chico vai alternar entre eles.
              </p>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", marginBottom: "24px" }}>
                {TRONCOS.map(t => {
                  const sel = troncos.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTronco(t.id)}
                      style={{
                        width: "100%",
                        padding: "18px 20px",
                        borderRadius: "16px",
                        border: `2px solid ${sel ? t.color : "rgba(0,0,0,0.08)"}`,
                        background: sel ? t.bg : "#FAFBFF",
                        cursor: "pointer",
                        textAlign: "left" as const,
                        fontFamily: "'Nunito', sans-serif",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        boxShadow: sel ? `0 2px 12px ${t.color}22` : "none",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {/* Flags */}
                        <div style={{ fontSize: "22px", marginBottom: "6px", letterSpacing: "2px" }}>
                          {t.flags.join(" ")}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: sel ? t.color : "#1A2A40", marginBottom: "3px" }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: sel ? t.color : "#7A8AAA" }}>
                          {t.desc}
                        </div>
                        <div style={{ fontSize: "12px", color: sel ? t.color : "#A0AABF", marginTop: "4px", fontStyle: "italic" }}>
                          {t.detalhe}
                        </div>
                      </div>
                      {/* Checkbox */}
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        border: `2px solid ${sel ? t.color : "rgba(0,0,0,0.15)"}`,
                        background: sel ? t.color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}>
                        {sel && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goNext}
                disabled={troncos.length === 0}
                style={{ ...S.btn(troncos.length === 0), marginBottom: "10px" }}
              >
                Continuar →
              </button>
              <div style={{ textAlign: "center" as const }}>
                <button onClick={goBack} style={S.backBtn}>← Voltar</button>
              </div>
            </div>
          )}

          {/* ── PASSO 3 — Interesses ───────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ animation: "fadeUp 0.35s ease forwards" }}>
              {/* Chico com balão */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <ChicoFace size={48}/>
                <div style={{ background: "#FFF3EE", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", fontSize: "14px", color: "#8A3A18", fontWeight: 600, lineHeight: 1.4, border: "1px solid #FFD8C8" }}>
                  Quais são seus interesses? Vou usá-los nos exemplos!
                </div>
              </div>

              <h1 style={{ ...S.h1, fontSize: "22px" }}>O que você gosta?</h1>
              <p style={{ ...S.sub, marginBottom: "20px" }}>
                Escolha pelo menos 2. O Chico usa esses temas para criar exemplos que fazem sentido pra você.
              </p>

              {/* Grid de chips com emoji */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "24px" }}>
                {INTERESSES.map(item => {
                  const sel = interesses.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInteresse(item.id)}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "24px",
                        border: `2px solid ${sel ? "#1A4A8A" : "rgba(0,0,0,0.09)"}`,
                        background: sel ? "rgba(26,74,138,0.08)" : "#F8F9FF",
                        color: sel ? "#1A4A8A" : "#3A4A6A",
                        fontSize: "14px",
                        fontWeight: sel ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "'Nunito', sans-serif",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: sel ? "0 2px 8px rgba(26,74,138,0.15)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{item.emoji}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Contador */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "#8A9AB8", fontWeight: 500 }}>
                  {interesses.length === 0 ? "Nenhum selecionado" : `${interesses.length} selecionado${interesses.length > 1 ? "s" : ""}`}
                </span>
                {interesses.length > 0 && (
                  <button
                    onClick={() => setInteresses([])}
                    style={{ background: "none", border: "none", color: "#AEAEB2", fontSize: "13px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    Limpar
                  </button>
                )}
              </div>

              {error && (
                <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.18)", fontSize: "13px", color: "#CC2A20", marginBottom: "14px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={interesses.length < 2 || saving}
                style={{ ...S.btn(interesses.length < 2 || saving), background: interesses.length >= 2 && !saving ? "linear-gradient(135deg,#E07820,#F09030)" : "rgba(0,0,0,0.07)", boxShadow: interesses.length >= 2 && !saving ? "0 3px 14px rgba(224,120,32,0.30)" : "none", marginBottom: "10px" }}
              >
                {saving ? "Entrando..." : `Começar com o Chico →`}
              </button>
              <div style={{ textAlign: "center" as const }}>
                <button onClick={goBack} style={S.backBtn}>← Voltar</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
