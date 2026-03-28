"use client";
// app/page.tsx — Login redesenhado com identidade brasileira

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LoginPage() {
  const supabase = createSupabase();
  const [mode, setMode]       = useState<"login" | "signup">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) setError(error.message);
      else setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("E-mail ou senha incorretos.");
      else if (data.user) {
        const { data: prof } = await supabase.from("user_profiles").select("onboarding_ok").eq("id", data.user.id).single();
        window.location.href = prof?.onboarding_ok ? "/dashboard" : "/onboarding";
      }
    }
    setLoading(false);
  }

  const G = "#1B5E2B";
  const Y = "#F5C800";

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0;background:#F4F5F0}
        input{outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){.login-left{display:none!important}.login-right{padding:24px!important;justify-content:flex-start!important;padding-top:40px!important}.login-card{padding:28px!important;border-radius:8px!important}.login-root{flex-direction:column!important}}
      `}</style>

      <div className="login-root" style={{ minHeight:"100vh", display:"flex", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* ── Painel esquerdo ── */}
        <div className="login-left" style={{ width:"45%", background:G, display:"flex", flexDirection:"column" as const, justifyContent:"center", padding:"60px 56px", position:"relative", overflow:"hidden" }}>
          {/* Barra amarela no topo */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:Y }} />
          {/* Decoração */}
          <div style={{ position:"absolute", bottom:"-60px", right:"-60px", width:"240px", height:"240px", borderRadius:"50%", border:`2px solid rgba(245,200,0,0.15)` }} />
          <div style={{ position:"absolute", bottom:"-30px", right:"-30px", width:"140px", height:"140px", borderRadius:"50%", border:`2px solid rgba(245,200,0,0.25)` }} />
          <div style={{ position:"absolute", top:"60px", left:"-40px", width:"160px", height:"160px", borderRadius:"50%", border:`2px solid rgba(255,255,255,0.08)` }} />

          <div style={{ position:"relative", animation:"fadeUp 0.6s ease forwards" }}>
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"56px" }}>
              <div style={{ width:"40px", height:"40px", background:Y, borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E2B" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize:"20px", fontWeight:800, color:"#FFFFFF", letterSpacing:"-0.3px" }}>Chico Mentor</span>
            </div>

            <h1 style={{ fontSize:"38px", fontWeight:800, color:"#FFFFFF", lineHeight:1.1, letterSpacing:"-0.5px", marginBottom:"20px" }}>
              Aprenda 3<br/>línguas ao mesmo<br/>tempo.
            </h1>
            <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.65)", lineHeight:1.7, marginBottom:"40px", maxWidth:"340px" }}>
              O Chico usa o Método Tear — você aprende Espanhol, Francês e Italiano juntos, aproveitando as raízes comuns com o Português.
            </p>

            {/* Línguas */}
            <div style={{ display:"flex", flexDirection:"column" as const, gap:"10px" }}>
              {[
                { flag:"🇪🇸", lang:"Espanhol", ex:"Soy Jordan" },
                { flag:"🇫🇷", lang:"Francês",  ex:"Je suis Jordan" },
                { flag:"🇮🇹", lang:"Italiano", ex:"Sono Jordan" },
              ].map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(255,255,255,0.08)", borderRadius:"6px", padding:"10px 14px", border:"1px solid rgba(255,255,255,0.12)" }}>
                  <span style={{ fontSize:"20px" }}>{l.flag}</span>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{l.lang}</div>
                    <div style={{ fontSize:"14px", fontWeight:700, color:"#fff" }}>{l.ex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Painel direito ── */}
        <div className="login-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", background:"#F4F5F0" }}>
          <div className="login-card" style={{ width:"100%", maxWidth:"420px", background:"#FFFFFF", borderRadius:"6px", border:"1px solid #E2E5E9", padding:"36px", animation:"fadeUp 0.4s ease forwards" }}>

            {/* Logo mobile */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"28px" }}>
              <div style={{ width:"32px", height:"32px", background:G, borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize:"16px", fontWeight:800, color:G, letterSpacing:"-0.2px" }}>Chico Mentor</span>
            </div>

            <h2 style={{ fontSize:"22px", fontWeight:800, color:"#111827", letterSpacing:"-0.3px", marginBottom:"6px" }}>
              {mode === "login" ? "Entrar na conta" : "Criar conta grátis"}
            </h2>
            <p style={{ fontSize:"13px", color:"#6B7280", marginBottom:"24px" }}>
              {mode === "login" ? "Bem-vindo de volta." : "Comece a aprender hoje."}
            </p>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading}
              style={{ width:"100%", background:"#fff", border:"1px solid #E2E5E9", borderRadius:"6px", padding:"11px", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", fontSize:"14px", fontWeight:600, color:"#111827", cursor:"pointer", marginBottom:"20px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar com Google
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
              <div style={{ flex:1, height:"1px", background:"#E2E5E9" }}/>
              <span style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:600 }}>ou</span>
              <div style={{ flex:1, height:"1px", background:"#E2E5E9" }}/>
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"5px", padding:"10px 14px", fontSize:"13px", color:"#991B1B", marginBottom:"16px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background:"#EBF5EE", border:"1px solid #A8D5B5", borderRadius:"5px", padding:"10px 14px", fontSize:"13px", color:G, marginBottom:"16px" }}>
                {success}
              </div>
            )}

            <form onSubmit={handleEmailAuth} style={{ display:"flex", flexDirection:"column" as const, gap:"10px" }}>
              {mode === "signup" && (
                <div>
                  <label style={{ fontSize:"12px", fontWeight:700, color:"#374151", display:"block", marginBottom:"5px" }}>Nome</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" required
                    style={{ width:"100%", background:"#F9FAFB", border:"1px solid #E2E5E9", borderRadius:"5px", padding:"10px 13px", fontSize:"14px", color:"#111827", fontFamily:"inherit" }}/>
                </div>
              )}
              <div>
                <label style={{ fontSize:"12px", fontWeight:700, color:"#374151", display:"block", marginBottom:"5px" }}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required
                  style={{ width:"100%", background:"#F9FAFB", border:"1px solid #E2E5E9", borderRadius:"5px", padding:"10px 13px", fontSize:"14px", color:"#111827", fontFamily:"inherit" }}/>
              </div>
              <div>
                <label style={{ fontSize:"12px", fontWeight:700, color:"#374151", display:"block", marginBottom:"5px" }}>Senha</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  style={{ width:"100%", background:"#F9FAFB", border:"1px solid #E2E5E9", borderRadius:"5px", padding:"10px 13px", fontSize:"14px", color:"#111827", fontFamily:"inherit" }}/>
              </div>

              <button type="submit" disabled={loading}
                style={{ marginTop:"4px", width:"100%", background:loading?"#9CA3AF":G, color:"#fff", border:"none", borderRadius:"5px", padding:"12px", fontSize:"14px", fontWeight:800, cursor:loading?"not-allowed":"pointer", letterSpacing:"0.01em" }}>
                {loading ? "Aguarde..." : mode === "login" ? "Entrar →" : "Criar conta →"}
              </button>
            </form>

            {/* Toggle mode */}
            <p style={{ textAlign:"center" as const, fontSize:"13px", color:"#6B7280", marginTop:"20px" }}>
              {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
              <button onClick={()=>{ setMode(mode==="login"?"signup":"login"); setError(null); setSuccess(null); }}
                style={{ background:"none", border:"none", color:G, fontWeight:700, cursor:"pointer", fontSize:"13px" }}>
                {mode === "login" ? "Criar grátis" : "Entrar"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
