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

export default function LoginPage() {
  const supabase = createSupabase();

  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // ── Login com Google ────────────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  // ── Login com email/senha ───────────────────────────────────────────────────
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

  // ── Criar conta ─────────────────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    }
    setLoading(false);
  }

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

      <div style={{
        minHeight: "100vh",
        background: "#F5F5F7",
        display: "flex",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>

        {/* Painel esquerdo — apresentação */}
        <div style={{
          flex: 1,
          background: "linear-gradient(145deg, #0071E3 0%, #0055B3 60%, #003D8F 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Círculos decorativos */}
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -100, right: -100 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -80, left: -80 }} />

          <div style={{ position: "relative", animation: "fadeIn 0.6s ease forwards" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "48px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", backdropFilter: "blur(10px)" }}>
                🦋
              </div>
              <span style={{ fontSize: "26px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                Chico Mentor
              </span>
            </div>

            <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "20px" }}>
              Aprenda idiomas<br />como um arqueólogo.
            </h1>

            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: "48px", maxWidth: "420px" }}>
              O Chico revela as raízes e engrenagens que conectam as línguas — e ancora cada lição nos seus próprios interesses.
            </p>

            {/* Três pilares */}
            {[
              { icon: "🌱", title: "Temas Geradores", desc: "O ensino parte do que você já ama" },
              { icon: "🔍", title: "Arqueologia das Línguas", desc: "Raízes que conectam Português, Espanhol, Francês e mais" },
              { icon: "🎙️", title: "Voz Nativa", desc: "Ouça cada tradução com sotaque autêntico" },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#FFFFFF", marginBottom: "2px" }}>{item.title}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel direito — formulário */}
        <div style={{
          width: "480px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          background: "#FFFFFF",
          animation: "fadeIn 0.5s ease forwards",
        }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: "6px" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ fontSize: "15px", color: "#86868B", marginBottom: "32px" }}>
            {mode === "login"
              ? "Entre para continuar sua jornada linguística"
              : "Comece sua aventura com o Chico"}
          </p>

          {/* Botão Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "14px",
              border: "1.5px solid rgba(0,0,0,0.12)",
              background: "#FFFFFF",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              marginBottom: "20px",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            {/* Ícone Google SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24">
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
            <span style={{ fontSize: "13px", color: "#AEAEB2", fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Formulário email/senha */}
          <form onSubmit={mode === "login" ? handleEmailLogin : handleSignup}>
            {mode === "signup" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "15px", color: "#1D1D1F", fontFamily: "inherit", transition: "border-color 0.2s", background: "#FAFAFA" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
                />
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "15px", color: "#1D1D1F", fontFamily: "inherit", transition: "border-color 0.2s", background: "#FAFAFA" }}
                onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "6px" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                required
                minLength={6}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "15px", color: "#1D1D1F", fontFamily: "inherit", transition: "border-color 0.2s", background: "#FAFAFA" }}
                onFocus={(e) => (e.target.style.borderColor = "#0071E3")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>

            {/* Mensagens de erro/sucesso */}
            {error && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", fontSize: "13px", color: "#FF3B30", marginBottom: "16px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)", fontSize: "13px", color: "#34C759", marginBottom: "16px" }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: loading ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #0071E3 0%, #0077ED 100%)",
                color: loading ? "#86868B" : "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                boxShadow: loading ? "none" : "0 2px 12px rgba(0,113,227,0.35)",
              }}
            >
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {/* Alternar modo */}
          <p style={{ textAlign: "center", fontSize: "14px", color: "#86868B", marginTop: "24px" }}>
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              style={{ background: "none", border: "none", color: "#0071E3", fontWeight: 600, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
