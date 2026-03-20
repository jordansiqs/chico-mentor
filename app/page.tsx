"use client";
// app/page.tsx — Página inicial com login

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function IconLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
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
    if (error) { setError("Email ou senha incorretos. Tente novamente."); }
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
    else { setSuccess("Conta criada! Verifique seu email para confirmar o cadastro."); }
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) { setError(error.message); }
    else { setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada."); }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "12px",
    border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "16px",
    color: "#1D1D1F", fontFamily: "inherit", background: "#FAFAFA",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const pillars = [
    { title: "Temas Geradores", desc: "O ensino parte do que você já vive e conhece" },
    { title: "Arqueologia das Línguas", desc: "Raízes que conectam Português, Espanhol, Francês e mais" },
    { title: "Voz Nativa", desc: "Ouça cada tradução com pronúncia autêntica" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input { -webkit-appearance: none; appearance: none; }
        input:focus { outline: none; border-color: #0071E3 !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 767px) {
          .desktop-panel { display: none !important; }
          .form-panel { width: 100% !important; min-height: 100vh !important; padding: 40px 24px 48px !important; justify-content: flex-start !important; padding-top: 60px !important; }
          .logo-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .logo-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F5F5F7", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Painel esquerdo — desktop only */}
        <div className="desktop-panel" style={{ flex: 1, background: "linear-gradient(145deg,#0071E3 0%,#0055B3 60%,#003D8F 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -100, right: -100 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -80, left: -80 }} />
          <div style={{ position: "relative", animation: "fadeIn 0.6s ease forwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "52px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconLogo />
              </div>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Chico Mentor</span>
            </div>
            <h1 style={{ fontSize: "38px", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "18px" }}>
              Aprenda idiomas<br />como um arqueólogo.
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: "48px", maxWidth: "380px" }}>
              O Chico revela as raízes e engrenagens que conectam as línguas, ancorando cada lição nos seus interesses.
            </p>
            {pillars.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)", marginTop: "7px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{item.title}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel direito — formulário */}
        <div className="form-panel" style={{ width: "460px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", background: "#FFFFFF", animation: "fadeIn 0.5s ease forwards" }}>

          {/* Logo mobile */}
          <div className="logo-mobile" style={{ alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconLogo />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Chico Mentor</span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "6px" }}>
            {mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h2>
          <p style={{ fontSize: "14px", color: "#86868B", marginBottom: "28px" }}>
            {mode === "login" ? "Entre para continuar sua jornada linguística"
              : mode === "signup" ? "Comece sua aventura com o Chico"
              : "Informe seu email para receber o link de recuperação"}
          </p>

          {/* Botão Google — só no login e signup */}
          {mode !== "forgot" && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "15px", fontWeight: 600, color: "#1D1D1F", marginBottom: "18px", fontFamily: "inherit", transition: "background 0.2s" }}
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
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                <span style={{ fontSize: "12px", color: "#AEAEB2", fontWeight: 500 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
              </div>
            </>
          )}

          {/* Formulário */}
          <form onSubmit={mode === "login" ? handleEmailLogin : mode === "signup" ? handleSignup : handleForgot}>
            {mode === "signup" && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#0071E3")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")} />
              </div>
            )}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#0071E3")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")} />
            </div>
            {mode !== "forgot" && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"} required minLength={6} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#0071E3")} onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.12)")} />
              </div>
            )}

            {/* Link esqueci a senha */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: "20px" }}>
                <button type="button" onClick={() => { setMode("forgot"); reset(); }}
                  style={{ background: "none", border: "none", color: "#0071E3", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode !== "login" && <div style={{ marginBottom: "20px" }} />}

            {error && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(255,59,48,0.07)", border: "1px solid rgba(255,59,48,0.2)", fontSize: "13px", color: "#FF3B30", marginBottom: "14px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(52,199,89,0.07)", border: "1px solid rgba(52,199,89,0.2)", fontSize: "13px", color: "#34C759", marginBottom: "14px" }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: loading ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg,#0071E3,#0077ED)", color: loading ? "#86868B" : "#fff", fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 12px rgba(0,113,227,0.28)", transition: "all 0.2s" }}>
              {loading ? "Aguarde..."
                : mode === "login" ? "Entrar"
                : mode === "signup" ? "Criar conta"
                : "Enviar link de recuperação"}
            </button>
          </form>

          {/* Links de alternância */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            {mode === "forgot" ? (
              <button onClick={() => { setMode("login"); reset(); }}
                style={{ background: "none", border: "none", color: "#0071E3", fontWeight: 600, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>
                Voltar para o login
              </button>
            ) : (
              <p style={{ fontSize: "13px", color: "#86868B", margin: 0 }}>
                {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
                <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); }}
                  style={{ background: "none", border: "none", color: "#0071E3", fontWeight: 600, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
