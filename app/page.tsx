"use client";
// app/page.tsx

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";


function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const supabase = createSupabase();

  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  function reset() { setError(null); setSuccess(null); }

  async function handleGoogle() {
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Email ou senha incorretos."); }
    else { window.location.href = "/dashboard"; }
    setLoading(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); reset();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); }
    else { setSuccess("Conta criada! Verifique seu email para confirmar."); }
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) { setError(error.message); }
    else { setSuccess("Link de recuperação enviado! Verifique seu email."); }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "12px",
    border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "16px",
    color: "#1D1D1F", fontFamily: "inherit", background: "#FAFAFA",
    boxSizing: "border-box", transition: "border-color 0.2s", outline: "none",
  };

  const pillars = [
    { icon: "◆", title: "Temas do seu mundo", desc: "O Chico usa seus interesses para criar exemplos que fazem sentido para você" },
    { icon: "◇", title: "Arqueologia das línguas", desc: "Descubra as raízes que conectam português, espanhol, francês e mais" },
    { icon: "○", title: "Voz nativa", desc: "Ouça cada tradução com pronúncia autêntica via Web Speech API" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #F5F5F7; }
        input { -webkit-appearance: none; appearance: none; }
        input:focus { border-color: #0071E3 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.2s ease both; }
        @media (max-width: 767px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; padding: 48px 24px 56px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Nunito', -apple-system, sans-serif", background: "#F5F5F7" }}>

                {/* ── Painel esquerdo Duolingo-style ── */}
        <div className="left-panel" style={{ flex: 1, background: "linear-gradient(160deg,#0D2E6B 0%,#1A4A8A 55%,#2A6ACC 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 48px", position: "relative", overflow: "hidden", textAlign: "center" as const }}>
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", top: -160, right: -140 }}/>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)", bottom: -80, left: -60 }}/>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="fade-up" style={{ marginBottom: "20px" }}>
              <div style={{ width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"3px solid rgba(255,255,255,0.30)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"72px" }}>🐕</div>
            </div>
            <div className="fade-up-2" style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "44px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Nunito', sans-serif", lineHeight: 1 }}>chico</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.60)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginTop: "6px" }}>mentor de línguas</div>
            </div>
            <div className="fade-up-2" style={{ marginBottom: "36px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.02em", margin: "0 0 12px", fontFamily: "'Nunito', sans-serif" }}>
                Aprenda idiomas<br/>do jeito que você aprende.
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0, maxWidth: "320px" }}>
                Com exemplos dos seus interesses, conexões linguísticas reais e o Chico do seu lado.
              </p>
            </div>
            <div className="fade-up-3" style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, justifyContent: "center" }}>
              {pillars.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <span style={{ fontSize: "17px" }}>{item.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Painel direito — formulário ── */}
        <div className="right-panel" style={{ width: "460px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 48px", background: "#FFFFFF", animation: "fadeUp 0.4s ease forwards" }}>

          {/* Logo mobile */}
          <div style={{ display: "none", alignItems: "center", gap: "10px", marginBottom: "36px" }} className="mobile-logo">
            <div style={{ width: 34, height: 34, borderRadius: "10px", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1D1D1F" }}>Chico Mentor</span>
          </div>

          {/* Cabeçalho */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1A4A8A", letterSpacing: "-0.02em", fontFamily: "'Nunito', sans-serif", marginBottom: "6px" }}>
              {mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
            </h2>
            <p style={{ fontSize: "14px", color: "#86868B", lineHeight: 1.5 }}>
              {mode === "login" ? "Entre para continuar sua jornada linguística"
                : mode === "signup" ? "Comece sua aventura com o Chico"
                : "Informe seu email para receber o link"}
            </p>
          </div>

          {/* Google */}
          {mode !== "forgot" && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "15px", fontWeight: 500, color: "#1D1D1F", marginBottom: "18px", fontFamily: "inherit", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F7")}
                onMouseLeave={e => (e.currentTarget.style.background = "#FFFFFF")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }}/>
                <span style={{ fontSize: "12px", color: "#AEAEB2", fontWeight: 500 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }}/>
              </div>
            </>
          )}

          {/* Formulário */}
          <form onSubmit={mode === "login" ? handleEmailLogin : mode === "signup" ? handleSignup : handleForgot}>
            {mode === "signup" && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#1A4A8A")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}/>
              </div>
            )}

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1A4A8A")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}/>
            </div>

            {mode !== "forgot" && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                  required minLength={6} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#1A4A8A")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}/>
              </div>
            )}

            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: "20px" }}>
                <button type="button" onClick={() => { setMode("forgot"); reset(); }}
                  style={{ background: "none", border: "none", color: "#1A4A8A", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode !== "login" && <div style={{ marginBottom: "20px" }}/>}

            {error && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.18)", fontSize: "13px", color: "#FF3B30", marginBottom: "14px", lineHeight: 1.5 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.18)", fontSize: "13px", color: "#34C759", marginBottom: "14px", lineHeight: 1.5 }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: loading ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg,#1A4A8A,#2A6ACC)", color: loading ? "#86868B" : "#fff", fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 12px rgba(26,74,138,0.30)", transition: "all 0.2s", letterSpacing: "-0.01em" }}>
              {loading ? "Aguarde..."
                : mode === "login" ? "Entrar"
                : mode === "signup" ? "Criar conta"
                : "Enviar link"}
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            {mode === "forgot" ? (
              <button onClick={() => { setMode("login"); reset(); }}
                style={{ background: "none", border: "none", color: "#1A4A8A", fontWeight: 600, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>
                ← Voltar para o login
              </button>
            ) : (
              <p style={{ fontSize: "13px", color: "#86868B", margin: 0 }}>
                {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
                <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); }}
                  style={{ background: "none", border: "none", color: "#1A4A8A", fontWeight: 600, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            )}
          </div>

          {/* Rodapé */}
          <p style={{ marginTop: "auto", paddingTop: "32px", fontSize: "11px", color: "#AEAEB2", textAlign: "center", lineHeight: 1.6 }}>
            Ao continuar, você concorda com nossos termos de uso.<br/>Seus dados são protegidos pela política de privacidade.
          </p>
        </div>
      </div>
    </>
  );
}
