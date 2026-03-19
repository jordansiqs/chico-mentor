"use client";
// app/onboarding/page.tsx

import React, { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Ícones SVG ────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactElement> = {
  futebol:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 6.3 2.3L12 8.5 5.7 4.3A10 10 0 0 1 12 2z"/><path d="M2.3 7.7L7 12l-4.7 4.3"/><path d="M21.7 7.7L17 12l4.7 4.3"/><path d="M12 21.5v-6l-5-3-2 5.2"/><path d="M12 21.5v-6l5-3 2 5.2"/></svg>,
  musica:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  culinaria:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  tecnologia: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  viagens:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>,
  cinema:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
  literatura: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  negocios:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  esportes:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M6 8H5a4 4 0 0 0 0 8h1"/><rect x="6" y="6" width="12" height="12" rx="6"/></svg>,
  arte:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  jogos:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 10v4M10 12h4"/><circle cx="17" cy="11" r="1" fill="currentColor"/><circle cx="17" cy="13" r="1" fill="currentColor"/></svg>,
  natureza:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M9.5 11.5c-2 2.5-2 5-2 7.5"/><path d="M14 8c0-4-3-6-6-6 0 4 3 6 6 6z"/><path d="M14 8c2-4 6-5 8-4-1 4-5 5-8 4z"/></svg>,
};

const INTERESSES = [
  { id: "futebol",    label: "Futebol"    },
  { id: "musica",     label: "Música"     },
  { id: "culinaria",  label: "Culinária"  },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "viagens",    label: "Viagens"    },
  { id: "cinema",     label: "Cinema"     },
  { id: "literatura", label: "Literatura" },
  { id: "negocios",   label: "Negócios"   },
  { id: "esportes",   label: "Esportes"   },
  { id: "arte",       label: "Arte"       },
  { id: "jogos",      label: "Jogos"      },
  { id: "natureza",   label: "Natureza"   },
];

const TRONCOS = [
  {
    id: "românico" as const,
    label: "Tear Românico",
    desc: "Aprenda Espanhol, Francês e Italiano a partir do Português",
    linguas: ["Português", "Espanhol", "Francês", "Italiano"],
    color: "#FF3B30",
    bg: "rgba(255,59,48,0.05)",
    border: "rgba(255,59,48,0.25)",
  },
  {
    id: "germânico" as const,
    label: "Tear Germânico",
    desc: "Aprenda Inglês, Alemão e Holandês a partir do Português",
    linguas: ["Português", "Inglês", "Alemão", "Holandês"],
    color: "#0071E3",
    bg: "rgba(0,113,227,0.05)",
    border: "rgba(0,113,227,0.25)",
  },
];

function IconLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}

export default function OnboardingPage() {
  const supabase = createSupabase();

  const [step, setStep]             = useState<1 | 2>(1);
  const [tronco, setTronco]         = useState<"românico" | "germânico" | null>(null);
  const [interesses, setInteresses] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function toggleInteresse(id: string) {
    setInteresses((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!tronco || interesses.length === 0) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id, tronco, interesses, onboarding_ok: true,
    });

    if (error) { setError("Erro ao salvar. Tente novamente."); setLoading(false); }
    else { window.location.href = "/dashboard"; }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F5F5F7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #0071E3, #34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconLogo />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Chico Mentor</span>
        </div>

        {/* Card */}
        <div style={{ background: "#FFFFFF", borderRadius: "24px", padding: "44px", width: "100%", maxWidth: "580px", boxShadow: "0 2px 24px rgba(0,0,0,0.08)", animation: "fadeIn 0.4s ease forwards" }}>

          {/* Steps */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "36px" }}>
            {[1, 2].map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: step >= n ? "#0071E3" : "rgba(0,0,0,0.08)", color: step >= n ? "#fff" : "#86868B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, transition: "all 0.3s" }}>
                  {n}
                </div>
                <span style={{ fontSize: "13px", fontWeight: step === n ? 600 : 400, color: step === n ? "#1D1D1F" : "#86868B" }}>
                  {n === 1 ? "Escolha o tronco" : "Seus interesses"}
                </span>
                {n < 2 && <div style={{ width: 28, height: 1, background: "rgba(0,0,0,0.10)", margin: "0 4px" }} />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Por qual caminho vamos?
              </h2>
              <p style={{ fontSize: "14px", color: "#86868B", marginBottom: "28px", lineHeight: 1.6 }}>
                O Chico vai comparar as línguas do tronco escolhido, revelando as raízes em comum.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
                {TRONCOS.map((t) => (
                  <button key={t.id} onClick={() => setTronco(t.id)}
                    style={{ width: "100%", padding: "20px", borderRadius: "14px", border: `2px solid ${tronco === t.id ? t.color : "rgba(0,0,0,0.08)"}`, background: tronco === t.id ? t.bg : "#FAFAFA", cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: tronco === t.id ? t.color : "#1D1D1F" }}>{t.label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${tronco === t.id ? t.color : "rgba(0,0,0,0.2)"}`, background: tronco === t.id ? t.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                        {tronco === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#86868B", marginBottom: "12px" }}>{t.desc}</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                      {t.linguas.map((l) => (
                        <span key={l} style={{ padding: "3px 10px", borderRadius: "20px", background: tronco === t.id ? t.bg : "rgba(0,0,0,0.05)", fontSize: "12px", fontWeight: 500, color: tronco === t.id ? t.color : "#86868B", border: `1px solid ${tronco === t.id ? t.border : "transparent"}` }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => tronco && setStep(2)} disabled={!tronco}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: tronco ? "linear-gradient(135deg,#0071E3,#0077ED)" : "rgba(0,0,0,0.08)", color: tronco ? "#fff" : "#86868B", fontSize: "14px", fontWeight: 600, cursor: tronco ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s", boxShadow: tronco ? "0 2px 12px rgba(0,113,227,0.30)" : "none" }}>
                Continuar
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                O que te move?
              </h2>
              <p style={{ fontSize: "14px", color: "#86868B", marginBottom: "28px", lineHeight: 1.6 }}>
                O Chico usará seus interesses para criar exemplos que fazem sentido para você. Escolha pelo menos um.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "28px" }}>
                {INTERESSES.map((item) => {
                  const selected = interesses.includes(item.id);
                  return (
                    <button key={item.id} onClick={() => toggleInteresse(item.id)}
                      style={{ padding: "14px 10px", borderRadius: "12px", border: `2px solid ${selected ? "#0071E3" : "rgba(0,0,0,0.08)"}`, background: selected ? "rgba(0,113,227,0.05)" : "#FAFAFA", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "8px", transition: "all 0.15s", fontFamily: "inherit" }}>
                      <div style={{ color: selected ? "#0071E3" : "#86868B", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {ICONS[item.id]}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: selected ? 600 : 500, color: selected ? "#0071E3" : "#3A3A3C" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(255,59,48,0.07)", fontSize: "13px", color: "#FF3B30", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(1)}
                  style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", color: "#1D1D1F", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Voltar
                </button>
                <button onClick={handleSave} disabled={interesses.length === 0 || loading}
                  style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: interesses.length > 0 && !loading ? "linear-gradient(135deg,#0071E3,#0077ED)" : "rgba(0,0,0,0.08)", color: interesses.length > 0 && !loading ? "#fff" : "#86868B", fontSize: "14px", fontWeight: 600, cursor: interesses.length > 0 && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s", boxShadow: interesses.length > 0 && !loading ? "0 2px 12px rgba(0,113,227,0.30)" : "none" }}>
                  {loading ? "Salvando..." : "Começar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
