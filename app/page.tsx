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

// ── Ícones SVG ────────────────────────────────────────────────────────────────

function IconSeedling() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M5 12C5 8.13 8.13 5 12 5s7 3.13 7 7" />
      <path d="M5 12c0-2.76 2.24-5 5-5" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconWaveform() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 6v12M22 12h-2" />
    </svg>
  );
}

function IconLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export default function LoginPage() {
  const supabase = createSupabase();

  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou senha incorretos. Tente novamente.");
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    }
    setLoading(false);
  }

  const pillars = [
    { icon: <IconSeedling />, title: "Temas Geradores", desc: "O ensino parte do que você já conhece e vive" },
    { icon: <IconCompass />,  title: "Arqueologia das Línguas", desc: "Raízes que conectam Português, Espanhol, Francês e mais" },
    { icon: <IconWaveform />, title: "Voz Nativa", desc: "Ouça cada tradução com pronúncia autêntica" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input:focus { outline: none; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F5F5F7", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Painel esquerdo */}
        <div style={{ flex: 1, background: "linear-gradient(145deg, #0071E3 0%, #0055B3 60%, #003D8F 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -100, right: -100 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -80, left: -80 }} />

          <div style={{ position: "relative", animation: "fadeIn 0.6s ease forwards" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "52px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
                <IconLogo />
              </div>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                Chico Mentor
              </span>
            </div>

            <h1 style={{ fontSize: "40px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "20px" }}>
              Aprenda idiomas<br />como um arqueólogo.
            </h1>

            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: "52px", maxWidth: "400px" }}>
              O Chico revela as raízes e engrenagens que conectam as línguas, ancorando cada lição nos seus interesses.
            </p>

            {pillars.map((item) => (
              <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "22px" }}>
                <div style={{ width: 38, height: 38, borderRadius: "10px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.9)", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF", marginBottom: "3px" }}>{item.title}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel direito */}
        <div style={{ width: "460px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", background: "#FFFFFF", animation: "fadeIn 0.5s ease forwards" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "6px" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ fontSize: "14px", color: "#86868B", marginBottom: "32px" }}>
            {mode === "login" ? "Entre para continuar sua jornada linguística" : "Comece sua aventura com o Chico"}
          </p>

          {/* Botão Google */}
          <button onClick={handleGoogle} disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "20px", transition: "all 0.2s", fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
            <span style={{ fontSize: "12px", color: "#AEAEB2", fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Formulário */}
          <form onSubmit={mode === "login" ? handleEmailLogin : handleSignup}>
            {mode === "signup" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Nome completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#1D1D1F", fontFamily: "inherit", background: "#FAFAFA" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
                />
              </div>
            )}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#1D1D1F", fontFamily: "inherit", background: "#FAFAFA" }}
                onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"} required minLength={6}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#1D1D1F", fontFamily: "inherit", background: "#FAFAFA" }}
                onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>

            {error && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(255,59,48,0.07)", border: "1px solid rgba(255,59,48,0.2)", fontSize: "13px", color: "#FF3B30", marginBottom: "16px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "11px 14px", borderRadius: "10px", background: "rgba(52,199,89,0.07)", border: "1px solid rgba(52,199,89,0.2)", fontSize: "13px", color: "#34C759", marginBottom: "16px" }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #0071E3 0%, #0077ED 100%)", color: loading ? "#86868B" : "#FFFFFF", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 12px rgba(0,113,227,0.30)" }}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#86868B", marginTop: "24px" }}>
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              style={{ background: "none", border: "none", color: "#0071E3", fontWeight: 600, cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
