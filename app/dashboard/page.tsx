"use client";
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
  isLoading?: boolean;
}

interface UserProfile {
  display_name: string;
  avatar_url?: string;
  tronco: "românico" | "germânico";
  interesses: string[];
}

type MainTab = "chat" | "flashcards" | "progresso";
type SidebarFilter = "todos" | "românico" | "germânico";

// ── Supabase ──────────────────────────────────────────────────────────────────

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Ícones SVG ────────────────────────────────────────────────────────────────

function IconLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IconCards() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}
function IconProgress() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function IconChevron({ down }: { down: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: down ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <path d="M2 4l4 4 4-4" stroke="#0071E3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconPlay() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0.5 9,5 1,9.5"/></svg>;
}
function IconWave() {
  return (
    <span style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {[10, 14, 8].map((h, i) => (
        <span key={i} style={{ width: 3, height: h, background: "currentColor", borderRadius: 2, animation: `pulse 0.6s ${i * 0.15}s ease-in-out infinite alternate` }} />
      ))}
    </span>
  );
}
function IconMic({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#86868B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}
function IconSend({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#86868B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconAvatar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Audio Hook ────────────────────────────────────────────────────────────────

function useAudio() {
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [speakingBcp47, setSpeakingBcp47] = useState<string | null>(null);
  const [isListening, setIsListening]     = useState(false);
  const recognitionRef                    = useRef<any>(null);

  function speak(text: string, bcp47: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = bcp47;
    utt.rate  = 0.88;
    const voices = window.speechSynthesis.getVoices();
    const best   = voices.find(v => v.lang === bcp47) || voices.find(v => v.lang.startsWith(bcp47.split("-")[0]));
    if (best) utt.voice = best;
    utt.onstart = () => { setIsSpeaking(true);  setSpeakingBcp47(bcp47); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingBcp47(null);  };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingBcp47(null);  };
    window.speechSynthesis.speak(utt);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false); setSpeakingBcp47(null);
  }

  function startListening(onResult: (text: string) => void) {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Reconhecimento de voz não suportado neste navegador."); return; }
    const rec = new SR();
    rec.lang = "pt-BR"; rec.continuous = false; rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false); }

  return { speak, stopSpeaking, isSpeaking, speakingBcp47, startListening, stopListening, isListening };
}

// ── AudioButton ───────────────────────────────────────────────────────────────

function AudioButton({ label, bcp47, isActive, onPlay, onStop }: {
  label: string; bcp47: string; isActive: boolean; onPlay: () => void; onStop: () => void;
}) {
  return (
    <button onClick={isActive ? onStop : onPlay}
      style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 500, transition: "all 0.2s", flexShrink: 0, background: isActive ? "linear-gradient(135deg,#0071E3,#0077ED)" : "rgba(0,113,227,0.08)", color: isActive ? "#fff" : "#0071E3" }}>
      {isActive ? <IconWave /> : <IconPlay />}
      {label}
    </button>
  );
}

// ── NexoCard ──────────────────────────────────────────────────────────────────

function NexoCard({ card, audio }: { card: MentoriaCard; audio: ReturnType<typeof useAudio> }) {
  const [expanded, setExpanded] = useState(false);
  const langs = [
    { nome: card.lang_1_nome, txt: card.lang_1_txt, fon: card.lang_1_fon, bcp47: card.lang_1_bcp47 },
    { nome: card.lang_2_nome, txt: card.lang_2_txt, fon: card.lang_2_fon, bcp47: card.lang_2_bcp47 },
    { nome: card.lang_3_nome, txt: card.lang_3_txt, fon: card.lang_3_fon, bcp47: card.lang_3_bcp47 },
  ];
  const isRom = card.tronco === "românico";
  const tc = { dot: isRom ? "#FF3B30" : "#0071E3", bg: isRom ? "rgba(255,59,48,0.07)" : "rgba(0,113,227,0.07)", label: isRom ? "Tear Românico" : "Tear Germânico" };

  return (
    <article
      style={{ background: "#fff", borderRadius: "18px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)", transition: "transform 0.2s,box-shadow 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 8px", borderRadius: "8px", background: tc.bg, fontSize: "10px", fontWeight: 600, color: tc.dot, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "8px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: tc.dot }} />{tc.label}
          </span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#1D1D1F", lineHeight: 1.35 }}>{card.tema_gerador}</h3>
        </div>
        <span style={{ fontSize: "11px", color: "#86868B", whiteSpace: "nowrap", marginLeft: "8px" }}>
          {new Date(card.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
        {langs.map(l => (
          <div key={l.bcp47} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "#F5F5F7" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.txt}</div>
              <div style={{ fontSize: "11px", color: "#86868B", fontStyle: "italic" }}>{l.fon}</div>
            </div>
            <AudioButton label={l.nome} bcp47={l.bcp47} isActive={audio.isSpeaking && audio.speakingBcp47 === l.bcp47} onPlay={() => audio.speak(l.txt, l.bcp47)} onStop={audio.stopSpeaking} />
          </div>
        ))}
      </div>
      <button onClick={() => setExpanded(v => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", background: expanded ? "rgba(0,113,227,0.06)" : "#F5F5F7", transition: "background 0.2s" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0071E3", display: "flex", alignItems: "center", gap: "6px" }}>
            <IconBook /> Lição do Chico
          </span>
          <IconChevron down={expanded} />
        </div>
      </button>
      {expanded && (
        <div style={{ marginTop: "8px", padding: "12px", borderRadius: "12px", background: "rgba(0,113,227,0.04)", fontSize: "13px", lineHeight: "1.65", color: "#3A3A3C" }}>
          {card.aula_chico}
        </div>
      )}
    </article>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isChico = message.role === "chico";
  if (message.isLoading) return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IconLogo />
      </div>
      <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", gap: "5px", alignItems: "center" }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#86868B", animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexDirection: isChico ? "row" : "row-reverse" }}>
      {isChico && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconLogo />
        </div>
      )}
      <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: isChico ? "18px 18px 18px 4px" : "18px 18px 4px 18px", background: isChico ? "#fff" : "linear-gradient(135deg,#0071E3,#0077ED)", boxShadow: isChico ? "0 1px 4px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,113,227,0.25)", fontSize: "14px", lineHeight: "1.55", color: isChico ? "#1D1D1F" : "#fff" }}>
        {message.content}
      </div>
    </div>
  );
}

// ── Flashcards Tab ────────────────────────────────────────────────────────────

function FlashcardsTab({ cards, audio }: { cards: MentoriaCard[]; audio: ReturnType<typeof useAudio> }) {
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore]   = useState({ acertos: 0, erros: 0 });
  const [done, setDone]     = useState(false);
  const shuffled            = useRef<MentoriaCard[]>([]);

  useEffect(() => {
    shuffled.current = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(10, cards.length));
    setIndex(0); setFlipped(false); setScore({ acertos: 0, erros: 0 }); setDone(false);
  }, [cards.length]);

  function restart() {
    shuffled.current = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(10, cards.length));
    setIndex(0); setFlipped(false); setScore({ acertos: 0, erros: 0 }); setDone(false);
  }

  if (cards.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "40px", textAlign: "center" }}>
      <IconSearch />
      <p style={{ fontSize: "16px", fontWeight: 600, color: "#1D1D1F", margin: 0 }}>Nenhum nexo para revisar ainda</p>
      <p style={{ fontSize: "14px", color: "#86868B", margin: 0 }}>Converse com o Chico primeiro para criar seus flashcards.</p>
    </div>
  );

  const card = shuffled.current[index];
  if (!card) return null;

  const langs = [
    { nome: card.lang_1_nome, txt: card.lang_1_txt, fon: card.lang_1_fon, bcp47: card.lang_1_bcp47 },
    { nome: card.lang_2_nome, txt: card.lang_2_txt, fon: card.lang_2_fon, bcp47: card.lang_2_bcp47 },
    { nome: card.lang_3_nome, txt: card.lang_3_txt, fon: card.lang_3_fon, bcp47: card.lang_3_bcp47 },
  ];

  function next(acertou: boolean) {
    setScore(s => ({ acertos: s.acertos + (acertou ? 1 : 0), erros: s.erros + (acertou ? 0 : 1) }));
    if (index + 1 >= shuffled.current.length) { setDone(true); return; }
    setIndex(i => i + 1); setFlipped(false);
  }

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "24px", padding: "40px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "20px", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Sessão concluída</h3>
        <p style={{ fontSize: "14px", color: "#86868B", margin: 0 }}>{shuffled.current.length} cards revisados</p>
      </div>
      <div style={{ display: "flex", gap: "32px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#34C759" }}>{score.acertos}</div>
          <div style={{ fontSize: "12px", color: "#86868B", fontWeight: 500, marginTop: "2px" }}>Acertos</div>
        </div>
        <div style={{ width: 1, background: "rgba(0,0,0,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#FF3B30" }}>{score.erros}</div>
          <div style={{ fontSize: "12px", color: "#86868B", fontWeight: 500, marginTop: "2px" }}>Erros</div>
        </div>
      </div>
      <button onClick={restart}
        style={{ padding: "13px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#0071E3,#0077ED)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,113,227,0.30)", fontFamily: "inherit" }}>
        Revisar novamente
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", gap: "24px", height: "100%", overflowY: "auto" }}>
      {/* Progresso */}
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", color: "#86868B" }}>{index + 1} de {shuffled.current.length}</span>
          <div style={{ display: "flex", gap: "14px" }}>
            <span style={{ fontSize: "13px", color: "#34C759", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><IconCheck />{score.acertos}</span>
            <span style={{ fontSize: "13px", color: "#FF3B30", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><IconX />{score.erros}</span>
          </div>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#0071E3,#34AADC)", width: `${(index / shuffled.current.length) * 100}%`, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Card */}
      <div onClick={() => setFlipped(v => !v)}
        style={{ width: "100%", maxWidth: "500px", minHeight: "240px", borderRadius: "20px", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", padding: "32px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", transition: "transform 0.15s ease", border: "1.5px solid rgba(0,0,0,0.06)" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.01)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
      >
        {!flipped ? (
          <>
            <span style={{ fontSize: "11px", color: "#86868B", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Em Português</span>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#1D1D1F", textAlign: "center", margin: 0, lineHeight: 1.3 }}>{card.tema_gerador}</p>
            <span style={{ fontSize: "12px", color: "#AEAEB2", marginTop: "8px" }}>Clique para ver as traduções</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: "11px", color: "#0071E3", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Traduções</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              {langs.map(l => (
                <div key={l.bcp47} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: "#F5F5F7" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1D1D1F" }}>{l.txt}</div>
                    <div style={{ fontSize: "11px", color: "#86868B", fontStyle: "italic" }}>{l.fon}</div>
                  </div>
                  <AudioButton label={l.nome} bcp47={l.bcp47} isActive={audio.isSpeaking && audio.speakingBcp47 === l.bcp47} onPlay={() => audio.speak(l.txt, l.bcp47)} onStop={audio.stopSpeaking} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {flipped ? (
        <div style={{ display: "flex", gap: "14px", width: "100%", maxWidth: "500px" }}>
          <button onClick={() => next(false)}
            style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.05)", color: "#FF3B30", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <IconX /> Errei
          </button>
          <button onClick={() => next(true)}
            style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(52,199,89,0.25)", background: "rgba(52,199,89,0.05)", color: "#34C759", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <IconCheck /> Acertei
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "13px", color: "#AEAEB2", margin: 0 }}>
          Tente lembrar as traduções antes de virar o card
        </p>
      )}
    </div>
  );
}

// ── Progresso Tab ─────────────────────────────────────────────────────────────

function ProgressoTab({ cards }: { cards: MentoriaCard[] }) {
  const total      = cards.length;
  const romanicos  = cards.filter(c => c.tronco === "românico").length;
  const germanicos = cards.filter(c => c.tronco === "germânico").length;
  const diasUnicos = [...new Set(cards.map(c => new Date(c.criado_em).toDateString()))].length;

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      count: cards.filter(c => new Date(c.criado_em).toDateString() === d.toDateString()).length,
    };
  });
  const maxCount = Math.max(...ultimos7.map(d => d.count), 1);

  const langCount: Record<string, number> = {};
  cards.forEach(c => {
    [c.lang_1_nome, c.lang_2_nome, c.lang_3_nome].forEach(l => { langCount[l] = (langCount[l] || 0) + 1; });
  });
  const topLangs = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
  const maxLang  = topLangs[0]?.[1] || 1;

  const stats = [
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, value: total,      label: "Nexos criados",  color: "#0071E3" },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,                    value: diasUnicos,   label: "Dias ativos",    color: "#FF9500" },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,                                   value: total * 3,    label: "Traduções vistas", color: "#34C759" },
  ];

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${s.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#86868B", marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de atividade */}
      <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "14px", fontWeight: 700, color: "#1D1D1F" }}>Atividade — últimos 7 dias</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "80px" }}>
          {ultimos7.map(d => (
            <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", borderRadius: "5px 5px 0 0", background: d.count > 0 ? "linear-gradient(180deg,#0071E3,#34AADC)" : "#F0F0F0", height: `${Math.max((d.count / maxCount) * 60, d.count > 0 ? 8 : 4)}px`, transition: "height 0.4s ease", minHeight: "4px" }} />
              <span style={{ fontSize: "10px", color: "#86868B", fontWeight: 500, textTransform: "capitalize" as const }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troncos */}
      <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "#1D1D1F" }}>Distribuição por tronco</h3>
        {[
          { label: "Tear Românico",  count: romanicos,  color: "#FF3B30", total },
          { label: "Tear Germânico", count: germanicos, color: "#0071E3", total },
        ].map(t => (
          <div key={t.label} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#3A3A3C" }}>{t.label}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: t.color }}>{t.count} nexos</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, background: t.color, width: `${total > 0 ? (t.count / total) * 100 : 0}%`, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Top línguas */}
      {topLangs.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "18px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "#1D1D1F" }}>Línguas mais praticadas</h3>
          {topLangs.map(([lang, count]) => (
            <div key={lang} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#3A3A3C" }}>{lang}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0071E3" }}>{count}x</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#0071E3,#34AADC)", width: `${(count / maxLang) * 100}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Principal ───────────────────────────────────────────────────────

export default function ChicoDashboard() {
  const supabase = createSupabase();
  const audio    = useAudio();

  const [profile, setProfile]               = useState<UserProfile | null>(null);
  const [cards, setCards]                   = useState<MentoriaCard[]>([]);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [inputText, setInputText]           = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [isFetchingCards, setFetchingCards] = useState(true);
  const [sidebarFilter, setSidebarFilter]   = useState<SidebarFilter>("todos");
  const [activeTab, setActiveTab]           = useState<MainTab>("chat");

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/"; return; }
      const { data: prof } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
      if (prof) {
        if (!prof.onboarding_ok) { window.location.href = "/onboarding"; return; }
        setProfile(prof as UserProfile);
      }
      const { data: c } = await supabase.from("mentoria_cards").select("*").eq("user_id", user.id).order("criado_em", { ascending: false }).limit(50);
      if (c) setCards(c as MentoriaCard[]);
      setFetchingCards(false);
    }
    load();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Saudação com desafio do dia
  useEffect(() => {
    if (profile && messages.length === 0) {
      const troncoLabel    = profile.tronco === "românico" ? "Tear Românico" : "Tear Germânico";
      const interessesList = profile.interesses?.slice(0, 2).join(" e ") ?? "seu universo";
      const hoje           = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

      const desafios = [
        `Como se diz "${profile.interesses?.[0] ?? "amigo"}" nas línguas do ${troncoLabel}?`,
        `Qual a origem da palavra "${profile.interesses?.[0] ?? "trabalho"}" nas línguas do ${troncoLabel}?`,
        `Como expressar entusiasmo sobre ${profile.interesses?.[0] ?? "um tema"} nas línguas do ${troncoLabel}?`,
        `Quais são as diferenças de sotaque ao falar sobre ${profile.interesses?.[0] ?? "cotidiano"} no ${troncoLabel}?`,
      ];
      const desafio = desafios[new Date().getDate() % desafios.length];

      setMessages([{
        id: "welcome",
        role: "chico",
        content: `Bom dia, ${profile.display_name?.split(" ")[0] ?? ""}. Hoje é ${hoje}.\n\nSeu desafio do dia: ${desafio}\n\nEstou pronto quando quiser começar.`,
      }]);
    }
  }, [profile]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !profile) return;
    setMessages(prev => [...prev,
      { id: `u-${Date.now()}`, role: "user",  content: text.trim() },
      { id: `l-${Date.now()}`, role: "chico", content: "", isLoading: true },
    ]);
    setInputText("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/chico", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema_gerador: text.trim(), tronco: profile.tronco, interesses: profile.interesses ?? [] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      const savedCard: MentoriaCard = data.card;
      setCards(prev => [savedCard, ...prev]);
      setMessages(prev => prev.map(m => m.isLoading ? { id: `c-${Date.now()}`, role: "chico" as const, content: savedCard.aula_chico } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.isLoading ? { id: `e-${Date.now()}`, role: "chico" as const, content: `Perdoe-me — ${(err as Error).message}. Podemos tentar novamente?` } : m));
    } finally { setIsLoading(false); }
  }, [isLoading, profile]);

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(inputText); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); }
  }
  function handleMic() {
    if (audio.isListening) { audio.stopListening(); return; }
    audio.startListening(text => setInputText(prev => (prev ? `${prev} ${text}` : text).trim()));
  }
  async function handleLogout() { await supabase.auth.signOut(); window.location.href = "/"; }

  const filteredCards = sidebarFilter === "todos" ? cards : cards.filter(c => c.tronco === sidebarFilter);

  const tabs: { id: MainTab; label: string; icon: React.ReactElement }[] = [
    { id: "chat",       label: "Conversar",  icon: <IconChat />     },
    { id: "flashcards", label: "Flashcards", icon: <IconCards />    },
    { id: "progresso",  label: "Progresso",  icon: <IconProgress /> },
  ];

  return (
    <>
      <style>{`
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-6px);opacity:1;} }
        @keyframes pulse { from{transform:scaleY(.6);}to{transform:scaleY(1.3);} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        * { box-sizing:border-box; }
        body { margin:0; }
        textarea { resize:none; outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12);border-radius:4px; }
        button:focus-visible { outline:2px solid #0071E3;outline-offset:2px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F5F5F7", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top Bar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "52px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "8px", background: "linear-gradient(135deg,#0071E3,#34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconLogo />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Chico Mentor</span>
            {profile?.tronco && (
              <span style={{ padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" as const, background: profile.tronco === "românico" ? "rgba(255,59,48,0.09)" : "rgba(0,113,227,0.09)", color: profile.tronco === "românico" ? "#FF3B30" : "#0071E3" }}>
                {profile.tronco === "românico" ? "Tear Românico" : "Tear Germânico"}
              </span>
            )}
          </div>
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#86868B" }}>{profile.display_name}</span>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(0,0,0,0.08)" }} />
                : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#5E5CE6,#BF5AF2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconAvatar /></div>
              }
              <button onClick={handleLogout}
                style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: "12px", color: "#86868B", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F7")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                Sair
              </button>
            </div>
          )}
        </header>

        {/* Layout */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sidebar */}
          <aside style={{ width: "380px", minWidth: "320px", maxWidth: "420px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(0,0,0,0.07)", background: "#F5F5F7", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", flexShrink: 0 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "19px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Biblioteca de Nexos</h2>
              <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#86868B" }}>{cards.length} {cards.length === 1 ? "nexo" : "nexos"} salvos</p>
              <div style={{ display: "flex", gap: "6px", padding: "4px", borderRadius: "12px", background: "rgba(0,0,0,0.06)" }}>
                {(["todos", "românico", "germânico"] as const).map(f => (
                  <button key={f} onClick={() => setSidebarFilter(f)}
                    style={{ flex: 1, padding: "6px 8px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s", background: sidebarFilter === f ? "#fff" : "transparent", color: sidebarFilter === f ? "#1D1D1F" : "#86868B", boxShadow: sidebarFilter === f ? "0 1px 4px rgba(0,0,0,0.10)" : "none", fontFamily: "inherit" }}>
                    {f === "todos" ? "Todos" : f === "românico" ? "Românico" : "Germânico"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {isFetchingCards
                ? Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 160, borderRadius: "18px", background: "#e8e8e8" }} />)
                : filteredCards.length === 0
                  ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px", textAlign: "center", gap: "12px" }}>
                      <IconSearch />
                      <p style={{ margin: 0, fontSize: "14px", color: "#86868B", lineHeight: 1.5 }}>Sua biblioteca está vazia.<br />Pergunte algo ao Chico.</p>
                    </div>
                  : filteredCards.map(card => (
                    <div key={card.id} style={{ animation: "fadeIn 0.3s ease forwards" }}>
                      <NexoCard card={card} audio={audio} />
                    </div>
                  ))
              }
            </div>
          </aside>

          {/* Área principal com abas */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Abas */}
            <div style={{ display: "flex", gap: "2px", padding: "10px 24px 0", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: activeTab === tab.id ? 600 : 500, fontFamily: "inherit", transition: "all 0.15s", background: activeTab === tab.id ? "#F5F5F7" : "transparent", color: activeTab === tab.id ? "#1D1D1F" : "#86868B", borderBottom: activeTab === tab.id ? "2px solid #0071E3" : "2px solid transparent" }}>
                  {React.cloneElement(tab.icon, { ...tab.icon.props, stroke: activeTab === tab.id ? "#0071E3" : "#86868B" } as any)}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das abas */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

              {/* Chat */}
              {activeTab === "chat" && (
                <>
                  <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {messages.map(msg => (
                      <div key={msg.id} style={{ animation: "fadeIn 0.3s ease forwards" }}>
                        <ChatBubble message={msg} />
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {audio.isListening && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "8px", background: "rgba(255,59,48,0.07)", borderTop: "1px solid rgba(255,59,48,0.12)" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF3B30", animation: "pulse 0.8s ease-in-out infinite alternate" }} />
                      <span style={{ fontSize: "12px", color: "#FF3B30", fontWeight: 600 }}>A ouvir...</span>
                    </div>
                  )}

                  <div style={{ padding: "16px 24px 20px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "8px", padding: "10px 14px", background: "#fff", borderRadius: "20px", border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                        <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                          placeholder="Pergunte ao Chico..." rows={1} disabled={isLoading}
                          style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", lineHeight: "1.5", color: "#1D1D1F", fontFamily: "inherit", maxHeight: "120px", overflowY: "auto", padding: 0 }} />
                        <button type="button" onClick={handleMic}
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: audio.isListening ? "#FF3B30" : "rgba(0,0,0,0.06)", flexShrink: 0, transition: "all 0.2s" }}>
                          <IconMic active={audio.isListening} />
                        </button>
                      </div>
                      <button type="submit" disabled={!inputText.trim() || isLoading}
                        style={{ width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0, cursor: !inputText.trim() || isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: !inputText.trim() || isLoading ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg,#0071E3,#0077ED)", boxShadow: !inputText.trim() || isLoading ? "none" : "0 2px 8px rgba(0,113,227,0.30)", transition: "all 0.2s" }}>
                        <IconSend active={!(!inputText.trim() || isLoading)} />
                      </button>
                    </form>
                    <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#AEAEB2", textAlign: "center" }}>
                      Enter para enviar · Shift+Enter para nova linha
                    </p>
                  </div>
                </>
              )}

              {/* Flashcards */}
              {activeTab === "flashcards" && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <FlashcardsTab cards={cards} audio={audio} />
                </div>
              )}

              {/* Progresso */}
              {activeTab === "progresso" && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <ProgressoTab cards={cards} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
