"use client";
// app/onboarding/page.tsx — Escolha de tronco e interesses

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const INTERESSES = [
  { id: "futebol",      label: "Futebol",       icon: "⚽" },
  { id: "musica",       label: "Música",        icon: "🎵" },
  { id: "culinaria",    label: "Culinária",     icon: "🍳" },
  { id: "tecnologia",   label: "Tecnologia",    icon: "💻" },
  { id: "viagens",      label: "Viagens",       icon: "✈️" },
  { id: "cinema",       label: "Cinema",        icon: "🎬" },
  { id: "literatura",   label: "Literatura",    icon: "📚" },
  { id: "negocios",     label: "Negócios",      icon: "💼" },
  { id: "esportes",     label: "Esportes",      icon: "🏋️" },
  { id: "arte",         label: "Arte",          icon: "🎨" },
  { id: "jogos",        label: "Jogos",         icon: "🎮" },
  { id: "natureza",     label: "Natureza",      icon: "🌿" },
];

const TRONCOS = [
  {
    id: "românico" as const,
    label: "Tear Românico",
    desc: "Aprenda Espanhol, Francês e Italiano a partir do Português",
    linguas: ["🇧🇷 Português", "🇪🇸 Espanhol", "🇫🇷 Francês", "🇮🇹 Italiano"],
    color: "#FF3B30",
    bg: "rgba(255,59,48,0.06)",
    border: "rgba(255,59,48,0.25)",
  },
  {
    id: "germânico" as const,
    label: "Tear Germânico",
    desc: "Aprenda Inglês, Alemão e Holandês a partir do Português",
    linguas: ["🇧🇷 Português", "🇺🇸 Inglês", "🇩🇪 Alemão", "🇳🇱 Holandês"],
    color: "#0071E3",
    bg: "rgba(0,113,227,0.06)",
    border: "rgba(0,113,227,0.25)",
  },
];

export default function OnboardingPage() {
  const supabase = createSupabase();

  const [step, setStep]                           = useState<1 | 2>(1);
  const [tronco, setTronco]                       = useState<"românico" | "germânico" | null>(null);
  const [interesses, setInteresses]               = useState<string[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  function toggleInteresse(id: string) {
    setInteresses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!tronco || interesses.length === 0) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/";
      return;
    }

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        tronco,
        interesses,
        onboarding_ok: true,
      });

    if (error) {
      setError("Erro ao salvar. Tente novamente.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#F5F5F7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "12px", background: "linear-gradient(135deg, #0071E3, #34AADC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🦋
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            Chico Mentor
          </span>
        </div>

        {/* Card principal */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "48px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
          animation: "fadeIn 0.4s ease forwards",
        }}>

          {/* Indicador de passos */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "36px" }}>
            {[1, 2].map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: step >= n ? "#0071E3" : "rgba(0,0,0,0.08)",
                  color: step >= n ? "#fff" : "#86868B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, transition: "all 0.3s ease",
                }}>
                  {n}
                </div>
                <span style={{ fontSize: "13px", fontWeight: step === n ? 600 : 400, color: step === n ? "#1D1D1F" : "#86868B" }}>
                  {n === 1 ? "Escolha o tronco" : "Seus interesses"}
                </span>
                {n < 2 && <div style={{ width: 32, height: 1, background: "rgba(0,0,0,0.12)", margin: "0 4px" }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Escolha do tronco ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Por qual caminho vamos?
              </h2>
              <p style={{ fontSize: "15px", color: "#86868B", marginBottom: "28px", lineHeight: 1.5 }}>
                O Chico vai comparar as línguas do tronco escolhido, revelando as raízes em comum.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "36px" }}>
                {TRONCOS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTronco(t.id)}
                    style={{
                      width: "100%",
                      padding: "20px",
                      borderRadius: "16px",
                      border: `2px solid ${tronco === t.id ? t.color : "rgba(0,0,0,0.08)"}`,
                      background: tronco === t.id ? t.bg : "#FAFAFA",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: tronco === t.id ? t.color : "#1D1D1F" }}>
                        {t.label}
                      </span>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `2px solid ${tronco === t.id ? t.color : "rgba(0,0,0,0.2)"}`,
                        background: tronco === t.id ? t.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}>
                        {tronco === t.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#86868B", marginBottom: "12px" }}>{t.desc}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {t.linguas.map((l) => (
                        <span key={l} style={{ padding: "4px 10px", borderRadius: "20px", background: tronco === t.id ? t.bg : "rgba(0,0,0,0.05)", fontSize: "12px", fontWeight: 500, color: tronco === t.id ? t.color : "#86868B", border: `1px solid ${tronco === t.id ? t.border : "transparent"}` }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => tronco && setStep(2)}
                disabled={!tronco}
                style={{
                  width: "100%", padding: "14px", borderRadius: "14px", border: "none",
                  background: tronco ? "linear-gradient(135deg, #0071E3, #0077ED)" : "rgba(0,0,0,0.08)",
                  color: tronco ? "#fff" : "#86868B",
                  fontSize: "15px", fontWeight: 600, cursor: tronco ? "pointer" : "not-allowed",
                  fontFamily: "inherit", transition: "all 0.2s ease",
                  boxShadow: tronco ? "0 2px 12px rgba(0,113,227,0.35)" : "none",
                }}
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── STEP 2: Interesses ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                O que te move?
              </h2>
              <p style={{ fontSize: "15px", color: "#86868B", marginBottom: "28px", lineHeight: 1.5 }}>
                O Chico vai usar seus interesses para criar exemplos que fazem sentido para você. Escolha pelo menos 1.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "32px" }}>
                {INTERESSES.map((item) => {
                  const selected = interesses.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInteresse(item.id)}
                      style={{
                        padding: "14px 10px",
                        borderRadius: "14px",
                        border: `2px solid ${selected ? "#0071E3" : "rgba(0,0,0,0.08)"}`,
                        background: selected ? "rgba(0,113,227,0.06)" : "#FAFAFA",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>{item.icon}</span>
                      <span style={{ fontSize: "12px", fontWeight: selected ? 600 : 500, color: selected ? "#0071E3" : "#3A3A3C" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(255,59,48,0.08)", fontSize: "13px", color: "#FF3B30", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", color: "#1D1D1F", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSave}
                  disabled={interesses.length === 0 || loading}
                  style={{
                    flex: 2, padding: "14px", borderRadius: "14px", border: "none",
                    background: interesses.length > 0 && !loading ? "linear-gradient(135deg, #0071E3, #0077ED)" : "rgba(0,0,0,0.08)",
                    color: interesses.length > 0 && !loading ? "#fff" : "#86868B",
                    fontSize: "15px", fontWeight: 600,
                    cursor: interesses.length > 0 && !loading ? "pointer" : "not-allowed",
                    fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: interesses.length > 0 && !loading ? "0 2px 12px rgba(0,113,227,0.35)" : "none",
                  }}
                >
                  {loading ? "Salvando..." : "Começar com o Chico 🦋"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
