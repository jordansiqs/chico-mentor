"use client";
// app/onboarding/page.tsx — Onboarding redesenhado

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const INTERESSES = [
  { id:"futebol",    label:"Futebol",    icon:"⚽" },
  { id:"musica",     label:"Música",     icon:"🎵" },
  { id:"culinaria",  label:"Culinária",  icon:"🍳" },
  { id:"tecnologia", label:"Tecnologia", icon:"💻" },
  { id:"viagens",    label:"Viagens",    icon:"✈️" },
  { id:"cinema",     label:"Cinema",     icon:"🎬" },
  { id:"literatura", label:"Literatura", icon:"📚" },
  { id:"negocios",   label:"Negócios",   icon:"💼" },
  { id:"esportes",   label:"Esportes",   icon:"🏋️" },
  { id:"arte",       label:"Arte",       icon:"🎨" },
  { id:"jogos",      label:"Jogos",      icon:"🎮" },
  { id:"natureza",   label:"Natureza",   icon:"🌿" },
];

const TRONCOS = [
  {
    id: "românico" as const,
    label: "Tear Românico",
    desc: "Aprenda Espanhol, Francês e Italiano a partir do Português",
    linguas: ["🇧🇷 Português", "🇪🇸 Espanhol", "🇫🇷 Francês", "🇮🇹 Italiano"],
    accent: "#1B5E2B",
    bg: "#EBF5EE",
    border: "#A8D5B5",
  },
  {
    id: "germânico" as const,
    label: "Tear Germânico",
    desc: "Aprenda Inglês, Alemão e Holandês a partir do Português",
    linguas: ["🇧🇷 Português", "🇺🇸 Inglês", "🇩🇪 Alemão", "🇳🇱 Holandês"],
    accent: "#1A4A8A",
    bg: "#EBF3FB",
    border: "#A8C5E8",
  },
];

export default function OnboardingPage() {
  const supabase = createSupabase();
  const [step, setStep]           = useState<1|2>(1);
  const [tronco, setTronco]       = useState<"românico"|"germânico"|null>(null);
  const [interesses, setInteresses] = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  function toggleInteresse(id: string) {
    setInteresses(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
  }

  async function handleSalvar() {
    if (!tronco || interesses.length < 2) return;
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/"; return; }
      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Aluno",
        tronco,
        interesses,
        onboarding_ok: true,
        updated_at: new Date().toISOString(),
      });
      if (error) { setError(error.message); setLoading(false); return; }
      window.location.href = "/dashboard";
    } catch (e) {
      setError("Erro ao salvar. Tente novamente.");
      setLoading(false);
    }
  }

  const G = "#1B5E2B";
  const Y = "#F5C800";

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0;background:#F4F5F0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:600px){.ob-card{padding:24px!important}.ob-troncos{flex-direction:column!important}.ob-interesses{grid-template-columns:repeat(3,1fr)!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F4F5F0", display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", padding:"32px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"32px" }}>
          <div style={{ width:"34px", height:"34px", background:G, borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontSize:"17px", fontWeight:800, color:G, letterSpacing:"-0.2px" }}>Chico Mentor</span>
        </div>

        {/* Card */}
        <div className="ob-card" style={{ background:"#fff", borderRadius:"6px", border:"1px solid #E2E5E9", padding:"36px 40px", width:"100%", maxWidth:"580px", animation:"fadeUp 0.4s ease forwards" }}>

          {/* Steps */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"32px" }}>
            {[1,2].map(n => (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:step>=n?G:"#E2E5E9", color:step>=n?"#fff":"#9CA3AF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:800, transition:"all 0.2s" }}>
                  {step > n ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : n}
                </div>
                <span style={{ fontSize:"12px", fontWeight:step>=n?700:500, color:step>=n?G:"#9CA3AF" }}>
                  {n===1?"Escolher tronco":"Seus interesses"}
                </span>
                {n < 2 && <div style={{ width:"32px", height:"1px", background:step>1?G:"#E2E5E9", transition:"background 0.3s" }}/>}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Tronco ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize:"22px", fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:"6px" }}>Escolha seu Tear</h2>
              <p style={{ fontSize:"13px", color:"#6B7280", marginBottom:"24px", lineHeight:1.6 }}>
                O Tear define quais línguas você aprende. As línguas de um mesmo Tear compartilham raízes — isso acelera o aprendizado.
              </p>
              <div className="ob-troncos" style={{ display:"flex", gap:"12px", marginBottom:"28px" }}>
                {TRONCOS.map(t => (
                  <div key={t.id} onClick={()=>setTronco(t.id)}
                    style={{ flex:1, padding:"18px", borderRadius:"6px", border:`2px solid ${tronco===t.id?t.accent:t.border}`, background:tronco===t.id?t.bg:"#FAFAFA", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize:"14px", fontWeight:800, color:tronco===t.id?t.accent:"#111827", marginBottom:"5px" }}>{t.label}</div>
                    <div style={{ fontSize:"12px", color:"#6B7280", lineHeight:1.5, marginBottom:"12px" }}>{t.desc}</div>
                    <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"5px" }}>
                      {t.linguas.map((l,i) => (
                        <span key={i} style={{ fontSize:"11px", fontWeight:600, background:tronco===t.id?t.accent:"#E2E5E9", color:tronco===t.id?"#fff":"#374151", padding:"2px 8px", borderRadius:"3px" }}>{l}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>tronco&&setStep(2)} disabled={!tronco}
                style={{ width:"100%", background:!tronco?"#E2E5E9":G, color:!tronco?"#9CA3AF":"#fff", border:"none", borderRadius:"5px", padding:"12px", fontSize:"14px", fontWeight:800, cursor:!tronco?"not-allowed":"pointer" }}>
                Continuar →
              </button>
            </>
          )}

          {/* ── STEP 2: Interesses ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize:"22px", fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:"6px" }}>Seus interesses</h2>
              <p style={{ fontSize:"13px", color:"#6B7280", marginBottom:"6px", lineHeight:1.6 }}>
                O Chico personaliza as aulas com base no que você gosta. Escolha pelo menos 2.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"20px" }}>
                <div style={{ height:"3px", flex:1, borderRadius:"3px", background:"#E2E5E9", overflow:"hidden" }}>
                  <div style={{ height:"100%", background:G, width:`${Math.min(100,(interesses.length/4)*100)}%`, transition:"width 0.3s" }}/>
                </div>
                <span style={{ fontSize:"11px", fontWeight:700, color:interesses.length>=2?G:"#9CA3AF" }}>{interesses.length} selecionados</span>
              </div>
              <div className="ob-interesses" style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:"8px", marginBottom:"24px" }}>
                {INTERESSES.map(item => {
                  const sel = interesses.includes(item.id);
                  return (
                    <button key={item.id} onClick={()=>toggleInteresse(item.id)}
                      style={{ background:sel?"#EBF5EE":"#F9FAFB", border:`1.5px solid ${sel?"#A8D5B5":"#E2E5E9"}`, borderRadius:"5px", padding:"12px 8px", cursor:"pointer", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"5px", transition:"all 0.15s" }}>
                      <span style={{ fontSize:"20px" }}>{item.icon}</span>
                      <span style={{ fontSize:"11px", fontWeight:sel?700:500, color:sel?G:"#374151" }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {error && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"5px", padding:"10px 14px", fontSize:"13px", color:"#991B1B", marginBottom:"16px" }}>{error}</div>}
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setStep(1)}
                  style={{ padding:"12px 20px", background:"#fff", border:"1px solid #E2E5E9", borderRadius:"5px", fontSize:"14px", fontWeight:700, color:"#374151", cursor:"pointer" }}>
                  ← Voltar
                </button>
                <button onClick={handleSalvar} disabled={loading||interesses.length<2}
                  style={{ flex:1, background:loading||interesses.length<2?"#E2E5E9":G, color:loading||interesses.length<2?"#9CA3AF":"#fff", border:"none", borderRadius:"5px", padding:"12px", fontSize:"14px", fontWeight:800, cursor:loading||interesses.length<2?"not-allowed":"pointer" }}>
                  {loading?"Salvando...":"Começar a aprender →"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"20px" }}>
          Chico Mentor · Aprendizado acelerado de línguas
        </p>
      </div>
    </>
  );
}
