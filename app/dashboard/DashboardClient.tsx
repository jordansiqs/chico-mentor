"use client";
// app/dashboard/DashboardClient.tsx

import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { ChicoCard } from "@/app/api/chico/route";

// ── Imagens do Chico (base64) ────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MentoriaCard extends ChicoCard {
  id: string;
  criado_em: string;
  titulo_card?: string;
  lang_1_exemplo?: string;
  lang_2_exemplo?: string;
  lang_3_exemplo?: string;
  pergunta_verificacao?: string;
  quiz_acertos?: number;
  quiz_erros?: number;
  modo?: string;
  nivel?: string;
  sr_interval?: number;
  sr_easiness?: number;
  sr_due_date?: string;
  sr_reviews?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "chico";
  content: string;
  isLoading?: boolean;
  card?: MentoriaCard;         // card inline no chat
  isVerificacao?: boolean;
  isRoteiro?: boolean;
}

interface UserProfile {
  display_name: string;
  avatar_url?: string;
  tronco: "românico" | "germânico";
  troncos_selecionados?: ("românico" | "germânico")[];
  interesses: string[];
}

interface ChicoMemoria {
  resumo?: string;
  pontos_fortes?: string[];
  pontos_fracos?: string[];
  estilo?: string;
  ultima_sessao?: string;
}

type MainTab       = "chat" | "flashcards" | "progresso" | "praticar" | "viagem" | "musica" | "historias" | "livros" | "perfil";
type SidebarFilter = "todos" | "românico" | "germânico";

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Ícones ────────────────────────────────────────────────────────────────────

const Icon = {
  Logo:      () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>),
  Chat:      ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Cards:     ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>),
  Progress:  ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  Immersion: ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  Diary:     ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  Settings:  ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Library:   ({ c }: { c: string }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  Book:      () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  Chevron:   ({ down }: { down: boolean }) => (<svg width="12" height="12" viewBox="0 0 12 12" style={{ transform:down?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><path d="M2 4l4 4 4-4" stroke="#1B5E2B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Play:      () => (<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0.5 9,5 1,9.5"/></svg>),
  Wave:      () => (<span style={{ display:"flex", gap:"2px", alignItems:"center" }}>{[10,14,8].map((h,i)=><span key={i} style={{ width:3, height:h, background:"currentColor", borderRadius:2, animation:`pulse 0.6s ${i*0.15}s ease-in-out infinite alternate` }}/>)}</span>),
  Mic:       ({ active }: { active: boolean }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#86868B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  Send:      ({ active }: { active: boolean }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Search:    ({ size=32, color="#AEAEB2" }: { size?: number; color?: string }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Avatar:    () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  Check:     () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2E7D45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X:         () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Trash:     () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  Copy:      () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>),
  Download:  () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  Menu:      () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  Close:     () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  CheckMark: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Fire:      () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>),
  Route:     () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>),
  Volume:    () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>),
};

// ── Audio Hook ────────────────────────────────────────────────────────────────

// ── Seletor de melhor voz disponível ─────────────────────────────────────────
// Ordem de prioridade: Neural remota > neural local > qualquer voz do idioma
// Chrome/Edge baixam vozes neurais de servidores Google quando há conexão.
// Essas vozes (localService=false) são dramaticamente melhores que as nativas.
function pickBestVoice(bcp47: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const lang  = bcp47.toLowerCase();
  const base  = lang.split("-")[0];

  // Nomes de vozes neurais conhecidas por navegador (substrings para match parcial)
  const neuralKeywords = [
    "neural", "natural", "wavenet", "enhanced", "premium",
    "google", "microsoft", "online",
    // Vozes neurais específicas por idioma
    "diego", "elena", "alvaro",      // ES neural Chrome
    "amelie", "thomas", "lea",       // FR neural
    "alice", "luca", "isabella",     // IT neural
    "george", "libby", "ryan",       // EN-GB neural
    "aria", "jenny", "guy",          // EN-US neural
    "katja", "konrad", "amala",      // DE neural
    "fenna", "colette",              // NL neural
  ];

  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const langMatch = v.lang.toLowerCase();
    if (!langMatch.startsWith(base)) return -1;         // idioma errado
    let s = 0;
    if (langMatch === lang) s += 100;                   // match exato de locale
    else if (langMatch.startsWith(lang)) s += 80;
    if (!v.localService) s += 60;                       // remota = neural no Chrome/Edge
    if (neuralKeywords.some(k => name.includes(k))) s += 40;
    if (name.includes("female") || name.includes("mujer")) s += 5;
    return s;
  };

  const ranked = voices
    .map(v => ({ v, s: score(v) }))
    .filter(x => x.s >= 0)
    .sort((a, b) => b.s - a.s);

  return ranked[0]?.v ?? null;
}

// Configurações de voz por idioma: rate e pitch calibrados para soar natural
const VOICE_CONFIG: Record<string, { rate: number; pitch: number }> = {
  "es": { rate: 0.90, pitch: 1.05 },
  "fr": { rate: 0.88, pitch: 1.00 },
  "it": { rate: 0.92, pitch: 1.05 },
  "en": { rate: 0.92, pitch: 1.00 },
  "de": { rate: 0.85, pitch: 0.98 },
  "nl": { rate: 0.88, pitch: 1.00 },
  "ja": { rate: 0.85, pitch: 1.10 },
  "ko": { rate: 0.88, pitch: 1.05 },
  "zh": { rate: 0.82, pitch: 1.00 },
  "ar": { rate: 0.85, pitch: 1.00 },
  "ru": { rate: 0.87, pitch: 1.00 },
};

function useAudio() {
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceCacheRef  = useRef<Map<string, SpeechSynthesisVoice | null>>(new Map());

  // Pré-carrega a lista de vozes assim que o hook monta
  // (Chrome carrega de forma assíncrona na primeira chamada)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const load = () => { synth.getVoices(); voiceCacheRef.current.clear(); };
    synth.addEventListener("voiceschanged", load);
    load();
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  function getBestVoice(bcp47: string): SpeechSynthesisVoice | null {
    if (voiceCacheRef.current.has(bcp47)) return voiceCacheRef.current.get(bcp47)!;
    const v = pickBestVoice(bcp47);
    voiceCacheRef.current.set(bcp47, v);
    return v;
  }

  function speak(text: string, bcp47: string, key?: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();

    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = bcp47;

    const cfg   = VOICE_CONFIG[bcp47.split("-")[0]] ?? { rate: 0.90, pitch: 1.00 };
    utt.rate    = cfg.rate;
    utt.pitch   = cfg.pitch;
    utt.volume  = 1.0;

    const voice = getBestVoice(bcp47);
    if (voice) utt.voice = voice;

    const k = key ?? `${bcp47}-${text.slice(0, 12)}`;
    utt.onstart = () => { setIsSpeaking(true);  setSpeakingKey(k); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingKey(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingKey(null); };

    // Workaround bug Chrome: síntese para após ~14s em algumas versões
    window.speechSynthesis.speak(utt);
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
    utt.onend   = () => { clearInterval(keepAlive); setIsSpeaking(false); setSpeakingKey(null); };
    utt.onerror = () => { clearInterval(keepAlive); setIsSpeaking(false); setSpeakingKey(null); };
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingKey(null);
  }

  function startListening(onResult: (text: string) => void) {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Reconhecimento de voz nao suportado neste navegador."); return; }
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

  return { speak, stopSpeaking, isSpeaking, speakingKey, startListening, stopListening, isListening };
}

// ── Design tokens (cores e espaçamentos globais) ──────────────────────────────
const C = {
  green:      "#1B5E2B", greenMid:   "#2E7D45", greenLt:"#EBF5EE", greenBd:"#A8D5B5",
  yellow:     "#F5C800", yellowLt:   "#FFFAE6", yellowBd:"#E8B800",
  bg:         "#F4F5F0", panel:      "#FFFFFF",  border:"#E2E5E9",  surface:"#F9FAFB",
  text:       "#111827", muted:      "#6B7280",  hint:"#9CA3AF",
  red:        "#991B1B", redLt:      "#FEF2F2",  redBd:"#FECACA",
  blue:       "#1B5E2B", blueLight:  "#EBF5EE",
  orange:     "#E07820", orangeLight:"#FFF3E8",
  textSub:    "#6B7280", textMuted:  "#9CA3AF",
};


// ── Bandeiras SVG (cross-platform, sem emoji) ─────────────────────────────────

const FLAG_SVG: Record<string, React.ReactNode> = {
  "es": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="28" height="20" fill="#AA151B"/><rect y="5" width="28" height="10" fill="#F1BF00"/></svg>,
  "fr": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="9.3" height="20" fill="#002395"/><rect x="9.3" width="9.4" height="20" fill="#FFFFFF"/><rect x="18.7" width="9.3" height="20" fill="#ED2939"/></svg>,
  "it": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="9.3" height="20" fill="#009246"/><rect x="9.3" width="9.4" height="20" fill="#FFFFFF"/><rect x="18.7" width="9.3" height="20" fill="#CE2B37"/></svg>,
  "en": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="28" height="20" fill="#012169"/><polygon points="0,0 28,20 28,15 5,0" fill="#FFFFFF"/><polygon points="28,0 0,20 0,15 23,0" fill="#FFFFFF"/><polygon points="0,0 28,20 28,18 2,0" fill="#C8102E"/><polygon points="28,0 0,20 0,18 26,0" fill="#C8102E"/><rect x="11.5" width="5" height="20" fill="#FFFFFF"/><rect y="7.5" width="28" height="5" fill="#FFFFFF"/><rect x="12.5" width="3" height="20" fill="#C8102E"/><rect y="8.5" width="28" height="3" fill="#C8102E"/></svg>,
  "de": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="28" height="6.7" fill="#000000"/><rect y="6.7" width="28" height="6.6" fill="#DD0000"/><rect y="13.3" width="28" height="6.7" fill="#FFCE00"/></svg>,
  "nl": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="28" height="6.7" fill="#AE1C28"/><rect y="6.7" width="28" height="6.6" fill="#FFFFFF"/><rect y="13.3" width="28" height="6.7" fill="#21468B"/></svg>,
  "pt": <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%"}}><rect width="10.5" height="20" fill="#006600"/><rect x="10.5" width="17.5" height="20" fill="#FF0000"/><ellipse cx="10.5" cy="10" rx="5" ry="5" fill="#FFD700" stroke="#FFFFFF" strokeWidth=".5"/><ellipse cx="10.5" cy="10" rx="3.5" ry="3.5" fill="#003399"/></svg>,
};

// nome-based lookup (Espanhol → es, etc.)
const NOME_TO_BCP47: Record<string, string> = {
  "Espanhol":"es","Francês":"fr","Italiano":"it",
  "Inglês":"en","Alemão":"de","Holandês":"nl","Português":"pt",
};

function Flag({ bcp47, nome, size = "md" }: { bcp47?: string; nome?: string; size?: "sm"|"md"|"lg" }) {
  const code = bcp47?.split("-")[0]?.toLowerCase() || NOME_TO_BCP47[nome||""] || "";
  const svg = FLAG_SVG[code];
  if (!svg) return null;
  const dims: Record<string,{w:number,h:number}> = { sm:{w:20,h:14}, md:{w:28,h:20}, lg:{w:40,h:28} };
  const d = dims[size];
  return (
    <span style={{ display:"inline-block", width:d.w, height:d.h, borderRadius:"2px", overflow:"hidden", border:"0.5px solid rgba(0,0,0,0.08)", flexShrink:0 }}>
      {svg}
    </span>
  );
}


// ── InlineCard -- card de traduções exibido no chat ───────────────────────────

function InlineCard({ card, audio }: { card: MentoriaCard; audio: ReturnType<typeof useAudio> }) {
  const [expanded, setExpanded] = useState(false);
  const G = "#1B5E2B"; const GL = "#EBF5EE"; const GB = "#A8D5B5";
  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];
  const isRom = card.tronco === "românico";
  const titulo = card.titulo_card || card.tema_gerador;
  // flags handled by <Flag> component
  return (
    <div style={{ marginTop:"10px", borderRadius:"6px", background:"#FFFFFF", border:"1px solid #E2E5E9", overflow:"hidden" }}>
      <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid #E2E5E9", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"10px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:GL, border:"1px solid "+GB, borderRadius:"3px", padding:"2px 8px", marginBottom:"6px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:G, flexShrink:0 as const }}/>
            <span style={{ fontSize:"10px", fontWeight:700, color:G, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>{isRom?"Tear Românico":"Tear Germânico"}</span>
          </div>
          <div style={{ fontSize:"17px", fontWeight:800, color:"#111827", letterSpacing:"-0.2px" }}>{titulo}</div>
        </div>
        <div style={{ background:"#F5C800", borderRadius:"3px", padding:"2px 8px", fontSize:"10px", fontWeight:800, color:"#3D2F00", flexShrink:0 as const, whiteSpace:"nowrap" as const }}>+1 nexo</div>
      </div>
      <div style={{ padding:"0 14px" }}>
        {langs.filter((l: any) => l.txt && l.txt !== "--" && l.txt.trim()).map((l: any) => {
          const key = `ic-${l.bcp47}-${(l.txt||"").slice(0,8)}`;
          const isPlaying = audio.isSpeaking && audio.speakingKey === key;
          return (
            <div key={l.bcp47||l.nome} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 0", borderBottom:"1px solid #F3F4F6" }}>
              <button onClick={() => isPlaying ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, key)}
                style={{ width:28, height:28, borderRadius:"4px", background:isPlaying?G:GL, border:"1px solid "+GB, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill={isPlaying?"#fff":G}>
                  {isPlaying ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21"/>}
                </svg>
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{l.nome}</div>
                <div style={{ fontSize:"15px", fontWeight:700, color:isPlaying?G:"#111827" }}>{l.txt}</div>
                {l.fon && l.fon !== "--" && <div style={{ fontSize:"11px", color:"#9CA3AF", fontStyle:"italic", marginTop:"1px" }}>{l.fon}</div>}
              </div>
              <Flag nome={l.nome} size="md"/>
            </div>
          );
        })}
      </div>
      <button onClick={() => setExpanded((v: boolean) => !v)}
        style={{ width:"100%", padding:"8px 14px", background:"none", border:"none", borderTop:"1px solid #E2E5E9", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"11px", fontWeight:600, color:G, display:"flex", alignItems:"center", gap:"5px" }}>
          <Icon.Book/>{expanded ? "Ocultar exemplos" : "Ver exemplos de uso"}
        </span>
        <Icon.Chevron down={expanded}/>
      </button>
      {expanded && (
        <div style={{ padding:"10px 14px 12px", display:"flex", flexDirection:"column" as const, gap:"8px", background:"#F9FAFB", borderTop:"1px solid #E2E5E9" }}>
          {langs.map((l: any) => {
            if (!l.exemplo) return null;
            const key2 = `ex-${l.bcp47}-${(l.exemplo||"").slice(0,10)}`;
            const isPlay2 = audio.isSpeaking && audio.speakingKey === key2;
            return (
              <div key={l.bcp47||l.nome} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                <button onClick={() => isPlay2 ? audio.stopSpeaking() : audio.speak(l.exemplo, l.bcp47, key2)}
                  style={{ width:22, height:22, borderRadius:"4px", border:"1px solid "+GB, background:GL, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {isPlay2 ? <span style={{ fontSize:"7px", color:G }}>◼</span> : <Icon.Play/>}
                </button>
                <div>
                  <span style={{ fontSize:"12px", color:"#374151", fontStyle:"italic" }}>{l.exemplo}</span>
                  <span style={{ fontSize:"10px", color:"#9CA3AF", marginLeft:"6px" }}>— {l.nome} <Flag nome={l.nome} size="sm"/></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── NexoCard (sidebar) ────────────────────────────────────────────────────────

function NexoCard({ card, audio, onDelete }: {
  card: MentoriaCard; audio: ReturnType<typeof useAudio>; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded]     = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const G = "#1B5E2B"; const GL = "#EBF5EE"; const GB = "#A8D5B5";
  // flags handled by <Flag> component

  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];
  const isRom = card.tronco === "românico";
  const titulo = card.titulo_card || card.tema_gerador;
  const diasDesde = Math.floor((Date.now() - new Date(card.criado_em).getTime()) / 86400000);
  const nextRev = card.sr_due_date;
  const today = new Date().toISOString().split("T")[0];
  const isDue = !nextRev || nextRev <= today;

  async function handleDelete() {
    setDeleting(true);
    try { await fetch(`/api/chico?id=${card.id}`, { method:"DELETE" }); onDelete(card.id); }
    catch { setDeleting(false); setConfirm(false); }
  }

  return (
    <div style={{ borderRadius:"6px", background:"#FFFFFF", border:"1px solid #E2E5E9", overflow:"hidden", animation:"fadeIn 0.3s ease forwards" }}>
      {/* Header */}
      <div style={{ padding:"10px 12px 8px", cursor:"pointer" }} onClick={()=>setExpanded((v:boolean)=>!v)}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:isRom?G:"#1B5E2B", flexShrink:0 as const }}/>
          <span style={{ fontSize:"9px", fontWeight:700, color:isRom?G:"#1B5E2B", textTransform:"uppercase" as const, letterSpacing:"0.06em", flex:1 }}>{isRom?"Românico":"Germânico"}</span>
          {isDue && <span style={{ background:"#FFFAE6", border:"1px solid #E8B800", borderRadius:"3px", padding:"1px 6px", fontSize:"9px", fontWeight:700, color:"#7A5F00" }}>revisar</span>}
          <Icon.Chevron down={expanded}/>
        </div>
        <div style={{ fontSize:"13px", fontWeight:700, color:"#111827" }}>{titulo}</div>
        <div style={{ fontSize:"10px", color:"#9CA3AF", marginTop:"2px" }}>{diasDesde === 0 ? "hoje" : diasDesde === 1 ? "ontem" : `${diasDesde} dias atrás`}</div>
      </div>

      {/* Expanded langs */}
      {expanded && (
        <div style={{ borderTop:"1px solid #E2E5E9" }}>
          <div style={{ padding:"0 12px" }}>
            {langs.filter((l:any) => l.txt && l.txt !== "--" && l.txt.trim()).map((l:any) => {
              const key = `side-${l.bcp47}-${(l.txt||"").slice(0,6)}`;
              const isPlay = audio.isSpeaking && audio.speakingKey === key;
              return (
                <div key={l.bcp47||l.nome} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"9px 0", borderBottom:"1px solid #F3F4F6" }}>
                  <button onClick={()=>isPlay?audio.stopSpeaking():audio.speak(l.txt,l.bcp47,key)}
                    style={{ width:24, height:24, borderRadius:"4px", background:isPlay?G:GL, border:"1px solid "+GB, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill={isPlay?"#fff":G}>
                      {isPlay?<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>:<polygon points="5 3 19 12 5 21"/>}
                    </svg>
                  </button>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"9px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{l.nome}</div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:isPlay?G:"#111827" }}>{l.txt}</div>
                    {l.fon && l.fon !== "--" && <div style={{ fontSize:"10px", color:"#9CA3AF", fontStyle:"italic" }}>{l.fon}</div>}
                  </div>
                  <Flag nome={l.nome} size="md"/>
                </div>
              );
            })}
          </div>
          {/* Actions */}
          <div style={{ padding:"8px 12px", display:"flex", justifyContent:"flex-end", gap:"6px", borderTop:"1px solid #F3F4F6" }}>
            {!confirmDelete ? (
              <button onClick={()=>setConfirm(true)}
                style={{ padding:"4px 10px", borderRadius:"4px", border:"1px solid #FECACA", background:"#FEF2F2", color:"#991B1B", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                Remover
              </button>
            ) : (
              <>
                <button onClick={()=>setConfirm(false)} style={{ padding:"4px 10px", borderRadius:"4px", border:"1px solid #E2E5E9", background:"transparent", color:"#6B7280", fontSize:"11px", cursor:"pointer" }}>Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} style={{ padding:"4px 10px", borderRadius:"4px", border:"none", background:"#991B1B", color:"#fff", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>{deleting?"...":"Confirmar"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Flashcards (SM-2 / Anki-style) ───────────────────────────────────────────

function FlashcardsTab({ cards, audio }: {
  cards: MentoriaCard[];
  audio: ReturnType<typeof useAudio>;
}) {
  const [flipped, setFlipped]     = useState(false);
  const [index, setIndex]         = useState(0);
  const [done, setDone]           = useState(false);
  const [score, setScore]         = useState({ facil:0, bom:0, dificil:0, errei:0 });
  const [saving, setSaving]       = useState(false);
  const [nextInfo, setNextInfo]   = useState<string | null>(null);
  const sessionCards = useRef<MentoriaCard[]>([]);

  // Escrita ativa — estado do campo de digitação
  const [tentativa, setTentativa]   = useState("");
  const [diffResult, setDiffResult] = useState<null|{ok:boolean; diff:React.ReactNode[]}>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Calcula próximo intervalo para preview nos botões (sem salvar)
  function previewInterval(card: MentoriaCard, q: number): string {
    const interval = card.sr_interval || 1;
    const easiness = card.sr_easiness || 2.5;
    const reviews  = card.sr_reviews  || 0;
    let next: number;
    if (q < 3) {
      next = 1; // Errei → reinicia
    } else if (reviews === 0) {
      // Card novo nunca revisado
      if (q === 3) next = 1;       // Difícil → amanhã
      else if (q === 4) next = 4;  // Bom → 4 dias
      else next = 7;               // Fácil → 1 semana
    } else if (reviews === 1) {
      if (q === 3) next = 1;
      else if (q === 4) next = 4;
      else next = 10;
    } else {
      const factor = q === 3 ? Math.max(1.3, easiness - 0.15)
                   : q === 4 ? easiness
                   : easiness + 0.1;
      next = Math.round(interval * factor);
    }
    if (next <= 1)  return "amanhã";
    if (next < 7)   return `${next} dias`;
    if (next < 30)  return `${Math.round(next/7)}sem`;
    return `${Math.round(next/30)}mês`;
  }

  useEffect(() => {
    if (cards.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    // Prioriza cards com revisão vencida (sr_due_date <= hoje) ou nunca revisados
    const vencidos = cards.filter((c: MentoriaCard) => !c.sr_due_date || c.sr_due_date <= today);
    const pool = vencidos.length > 0
      ? [...vencidos].sort((a, b) => (a.sr_due_date||"") < (b.sr_due_date||"") ? -1 : 1).slice(0, 20)
      : [...cards].sort(() => Math.random() - 0.5).slice(0, 10);
    sessionCards.current = pool;
    setIndex(0); setFlipped(false); setDone(false);
    setScore({ facil:0, bom:0, dificil:0, errei:0 });
    setTentativa(""); setDiffResult(null);
  }, [cards.length]);

  async function responder(qualidade: number) {
    const card = sessionCards.current[index];
    if (!card) return;
    setSaving(true);

    // Atualiza score local
    setScore(s => ({
      ...s,
      ...(qualidade === 5 ? {facil: s.facil+1} :
          qualidade === 4 ? {bom: s.bom+1} :
          qualidade === 3 ? {dificil: s.dificil+1} :
          {errei: s.errei+1})
    }));

    // Salva no banco
    try {
      await fetch("/api/chico", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "sr_review", card_id: card.id, qualidade }),
      });
    } catch {}

    setSaving(false);

    // Avança
    if (index + 1 >= sessionCards.current.length) {
      setDone(true);
    } else {
      setIndex(i => i+1);
      setFlipped(false);
      setNextInfo(null);
      setTentativa("");
      setDiffResult(null);
    }
  }

  function reiniciar() {
    const today = new Date().toISOString().split("T")[0];
    const vencidos = cards.filter((c: MentoriaCard) => !c.sr_due_date || c.sr_due_date <= today);
    const pool = vencidos.length > 0
      ? [...vencidos].sort((a,b) => (a.sr_due_date||"") < (b.sr_due_date||"") ? -1 : 1).slice(0,20)
      : [...cards].sort(() => Math.random()-0.5).slice(0,10);
    sessionCards.current = pool;
    setIndex(0); setFlipped(false); setDone(false);
    setScore({ facil:0, bom:0, dificil:0, errei:0 });
  }

  // Verifica o que o aluno digitou contra a tradução correta
  function verificarTentativa() {
    const partes = tentativa.split("|||");
    const hasAny = partes.some((p: string) => p.trim().length > 0);
    if (!hasAny) return;

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g,"").trim();

    const card = sessionCards.current[index];
    const refLangs = langs.filter((l: any) => l.txt && l.txt !== "--" && l.txt.trim().length > 0);

    // Associa cada input do aluno à língua mais próxima (evita problema de swap no DB)
    // Cada campo do aluno (partes[i]) é comparado com cada refLang
    // e atribuído ao refLang com maior score de similaridade
    const assignments: number[] = partes.map((_: string, pi: number) => pi); // default: posição
    if (partes.length >= 2 && refLangs.length >= 2) {
      const usedLangs = new Set<number>();
      partes.forEach((parte: string, pi: number) => {
        if (!parte.trim()) return;
        const dadoNorm = normalize(parte).split(" ").filter((x:string)=>x);
        let bestIdx = pi < refLangs.length ? pi : 0;
        let bestScore = -1;
        refLangs.forEach((l: any, li: number) => {
          if (usedLangs.has(li)) return;
          const espNorm = normalize(l.txt).split(" ").filter((x:string)=>x);
          const score = dadoNorm.filter((w:string, i:number) => w === espNorm[i]).length
                      + dadoNorm.filter((w:string) => espNorm.includes(w)).length * 0.5;
          if (score > bestScore) { bestScore = score; bestIdx = li; }
        });
        assignments[pi] = bestIdx;
        usedLangs.add(bestIdx);
      });
    }

    let totalAcertos = 0;
    let totalPalavras = 0;
    const allDiffs: React.ReactNode[] = [];

    partes.forEach((parte: string, pi: number) => {
      if (!parte.trim()) return;
      const li = assignments[pi] < refLangs.length ? assignments[pi] : pi % refLangs.length;
      const l  = refLangs[li];
      if (!l) return;

      const dado     = normalize(parte).split(" ").filter((x:string)=>x);
      const esperado = normalize(l.txt).split(" ").filter((x:string)=>x);
      totalPalavras += esperado.length;

      allDiffs.push(
        <div key={pi} style={{ marginBottom:"8px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7280", textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"4px" }}>
            {l.nome}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
            {esperado.map((p: string, i: number) => {
              const ok = (dado[i]||"") === p;
              if (ok) totalAcertos++;
              return (
                <span key={i} style={{ display:"inline-block", padding:"2px 8px", borderRadius:"6px", background:ok?"rgba(27,94,43,0.12)":"rgba(204,42,32,0.10)", color:ok?"#1B5E2B":"#991B1B", fontWeight:ok?600:700, fontSize:"14px" }}>
                  {ok ? p : (<>{dado[i]||"___"}<br/><span style={{fontSize:"10px",color:"#1B5E2B",fontWeight:500}}>{p}</span></>)}
                </span>
              );
            })}
          </div>
        </div>
      );

      if (l.bcp47 && l.txt) {
        setTimeout(() => audio.speak(l.txt, l.bcp47, `verify-${pi}-${card?.id}`), 400 + pi * 700);
      }
    });

    const allOk = totalPalavras > 0 && totalAcertos === totalPalavras;
    setDiffResult({ ok: allOk, diff: allDiffs });
    setFlipped(true);
    setTimeout(() => inputRef.current?.blur(), 50);
  }


  // C is defined at module level

  // ── Sem cards ──────────────────────────────────────────────────────────────
  if (cards.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", height:"100%", gap:"12px", padding:"40px", textAlign:"center" as const }}>
      <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
      <p style={{ fontSize:"16px", fontWeight:700, color:C.text, margin:0, fontFamily:"Inter, -apple-system, sans-serif" }}>Nenhum nexo para revisar</p>
      <p style={{ fontSize:"13px", color:C.muted, margin:0 }}>Converse com o Chico primeiro para criar nexos.</p>
    </div>
  );

  // ── Sessão concluída ────────────────────────────────────────────────────────
  if (done) {
    const total = score.facil + score.bom + score.dificil + score.errei;
    const acertos = score.facil + score.bom;
    return (
      <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", height:"100%", gap:"20px", padding:"40px", textAlign:"center" as const }}>
        <div style={{ fontSize:"36px", color:C.green, fontWeight:800 }}>{acertos >= total * 0.8 ? "✦" : acertos >= total * 0.5 ? "◇" : "◆"}</div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:800, color:C.blue, margin:"0 0 6px", fontFamily:"Inter, -apple-system, sans-serif" }}>Sessão concluída!</h3>
          <p style={{ fontSize:"14px", color:C.muted, margin:0 }}>{total} cards revisados</p>
        </div>
        {/* Placar detalhado */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", width:"100%", maxWidth:"360px" }}>
          {[
            { label:"Fácil",   count:score.facil,   color:C.green,  bg:"rgba(27,94,43,0.08)"  },
            { label:"Bom",     count:score.bom,     color:C.blue,   bg:"rgba(27,94,43,0.08)"  },
            { label:"Difícil", count:score.dificil, color:C.orange, bg:"rgba(245,200,0,0.12)" },
            { label:"Errei",   count:score.errei,   color:C.red,    bg:"rgba(204,42,32,0.08)"  },
          ].map((s,i) => (
            <div key={i} style={{ padding:"12px", borderRadius:"12px", background:s.bg, textAlign:"center" as const }}>
              <div style={{ fontSize:"24px", fontWeight:800, color:s.color, fontFamily:"Inter, -apple-system, sans-serif" }}>{s.count}</div>
              <div style={{ fontSize:"12px", color:C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={reiniciar}
          style={{ padding:"13px 32px", borderRadius:"6px", border:"none", background:`linear-gradient(135deg,${C.blue},#2E7D45)`, color:"#fff", fontSize:"15px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:"0 3px 14px rgba(27,94,43,0.28)" }}>
          Revisar novamente
        </button>
      </div>
    );
  }

  const card = sessionCards.current[index];
  if (!card) return null;

  const langs = [
    { nome:card.lang_1_nome||"", txt:card.lang_1_txt||"", fon:card.lang_1_fon||"", bcp47:card.lang_1_bcp47||"", exemplo:card.lang_1_exemplo||"" },
    { nome:card.lang_2_nome||"", txt:card.lang_2_txt||"", fon:card.lang_2_fon||"", bcp47:card.lang_2_bcp47||"", exemplo:card.lang_2_exemplo||"" },
    { nome:card.lang_3_nome||"", txt:card.lang_3_txt||"", fon:card.lang_3_fon||"", bcp47:card.lang_3_bcp47||"", exemplo:card.lang_3_exemplo||"" },
  ];
  // langsValidas: só as que têm tradução real (para diff e verso)
  const langsValidas = langs.filter((l: any) => l.txt && l.txt !== "--" && l.txt.trim().length > 0);

  const vencidos = cards.filter((c: MentoriaCard) => {
    const today = new Date().toISOString().split("T")[0];
    return !c.sr_due_date || c.sr_due_date <= today;
  }).length;

  return (
    <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", padding:"20px 16px 40px", gap:"14px", height:"100%", overflowY:"auto" as const, background:C.bg }}>

      {/* Header: progresso + vencidos */}
      <div style={{ width:"100%", maxWidth:"520px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"13px", color:C.muted, fontFamily:"Inter, -apple-system, sans-serif" }}>
          {index + 1} / {sessionCards.current.length}
        </span>
        {vencidos > 0 && (
          <span style={{ fontSize:"12px", color:C.orange, fontWeight:700, padding:"3px 10px", borderRadius:"8px", background:"rgba(245,200,0,0.15)" }}>
            {vencidos} para revisar hoje
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      <div style={{ width:"100%", maxWidth:"520px", height:5, borderRadius:5, background:"rgba(0,0,0,0.07)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:5, background:`linear-gradient(90deg,${C.blue},#2E7D45)`, width:`${(index/sessionCards.current.length)*100}%`, transition:"width 0.35s ease" }}/>
      </div>

      {/* ── FRENTE do card ─────────────────────────────────────────────────── */}
      {!flipped ? (
        <>
          {/* Card frente — palavra em PT */}
          <div style={{ width:"100%", maxWidth:"520px", borderRadius:"8px", background:`linear-gradient(135deg,${C.blue},#2E7D45)`, boxShadow:"0 6px 28px rgba(27,94,43,0.30)", padding:"28px 24px 24px", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"14px" }}>
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.60)", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", fontFamily:"Inter, -apple-system, sans-serif" }}>
              Em Português
            </span>
            <p style={{ fontSize:"26px", fontWeight:800, color:"#fff", textAlign:"center" as const, margin:0, fontFamily:"Inter, -apple-system, sans-serif", lineHeight:1.2 }}>
              {card.titulo_card || card.tema_gerador}
            </p>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.55)", fontFamily:"Inter, -apple-system, sans-serif" }}>
              Como se diz nas {langs.length} línguas?
            </div>
          </div>

          {/* Campo de digitação — uma linha por língua */}
          <div style={{ width:"100%", maxWidth:"520px", background:"#fff", borderRadius:"6px", padding:"18px 20px", boxShadow:"0 2px 12px rgba(27,94,43,0.08)", border:`1.5px solid rgba(27,94,43,0.12)` }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"12px" }}>
              Digite nas {langs.length} línguas
            </div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:"8px" }}>
              {langs.map((l: any, li: number) => (
                <div key={li} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"11px", fontWeight:700, color:C.muted, minWidth:"62px", textAlign:"right" as const, textTransform:"uppercase" as const, letterSpacing:"0.04em" }}>
                    {l.nome}
                  </span>
                  <input
                    ref={li === 0 ? inputRef : undefined}
                    value={tentativa.split("|||")[li] || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const parts = tentativa.split("|||");
                      while (parts.length < langs.length) parts.push("");
                      parts[li] = e.target.value;
                      setTentativa(parts.join("|||"));
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const allFilled = langs.every((_: any, i: number) => (tentativa.split("|||")[i]||"").trim().length > 0);
                        if (allFilled) verificarTentativa();
                        else {
                          // Foca no próximo campo vazio
                          const next = document.querySelector<HTMLInputElement>(`input[data-lang-idx="${li+1}"]`);
                          if (next) next.focus();
                        }
                      }
                    }}
                    data-lang-idx={li}
                    autoFocus={li === 0}
                    placeholder={`Em ${l.nome}...`}
                    style={{ flex:1, padding:"10px 14px", borderRadius:"10px", border:`1.5px solid rgba(27,94,43,0.18)`, fontSize:"15px", fontFamily:"Inter, -apple-system, sans-serif", color:C.text, outline:"none", background:"#FAFBFD" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              <button
                onClick={verificarTentativa}
                disabled={!tentativa.split("|||").some((p: string) => p.trim().length > 0)}
                style={{ flex:1, padding:"12px", borderRadius:"12px", border:"none", background:!tentativa.split("|||").some((p: string) => p.trim().length > 0)?"rgba(0,0,0,0.06)":`linear-gradient(135deg,${C.blue},#2E7D45)`, color:!tentativa.split("|||").some((p: string) => p.trim().length > 0)?"#AEAEB2":"#fff", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                Ver resposta →
              </button>
              <button
                onClick={() => { setTentativa(""); setFlipped(true); langs.forEach((l: any, i: number) => { if (l.txt && l.bcp47) setTimeout(()=>audio.speak(l.txt, l.bcp47, `skip-${i}-${card.id}`), 300 + i*600); }); }}
                style={{ padding:"12px 16px", borderRadius:"12px", border:`1.5px solid rgba(0,0,0,0.09)`, background:"transparent", color:C.muted, fontSize:"13px", fontWeight:600, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                Pular
              </button>
            </div>
          </div>

          {/* Info intervalo atual */}
          {card.sr_due_date != null && (card.sr_reviews||0) > 0 && (
            <div style={{ fontSize:"12px", color:C.muted, textAlign:"center" as const }}>
              Intervalo atual: {card.sr_interval || 1} {(card.sr_interval||1) === 1 ? "dia" : "dias"}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Resultado da digitação (diff) ───────────────────────────────── */}
          {diffResult && (
            <div style={{ width:"100%", maxWidth:"520px", borderRadius:"6px", padding:"16px 18px", background:diffResult.ok?"rgba(27,94,43,0.08)":"rgba(245,200,0,0.10)", border:`1.5px solid ${diffResult.ok?"rgba(27,94,43,0.25)":"rgba(224,120,32,0.25)"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                <span style={{ fontSize:"16px", fontWeight:800, color:C.green }}>{diffResult.ok ? "✦" : "✎"}</span>
                <span style={{ fontSize:"13px", fontWeight:700, color:diffResult.ok?C.green:C.orange }}>
                  {diffResult.ok ? "Correto!" : "Veja a diferença:"}
                </span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
                {diffResult.diff}
              </div>
              {!diffResult.ok && tentativa.split("|||").some((p:string)=>p.trim()) && (
                <div style={{ marginTop:"8px", fontSize:"12px", color:C.muted }}>
                  {tentativa.split("|||").map((p:string, i:number) => p.trim() ? (
                    <span key={i} style={{ display:"block" }}>
                      {langs[i]?.nome || ""}: <em>{p.trim()}</em>
                    </span>
                  ) : null)}
                </div>
              )}
            </div>
          )}

          {/* ── VERSO do card ───────────────────────────────────────────────── */}
          <div style={{ width:"100%", maxWidth:"520px", borderRadius:"8px", background:"#fff", boxShadow:"0 4px 20px rgba(0,0,0,0.10)", padding:"20px", border:`1.5px solid rgba(27,94,43,0.12)` }}>
            {/* Palavra em PT no topo do verso */}
            <div style={{ textAlign:"center" as const, marginBottom:"16px", paddingBottom:"14px", borderBottom:"1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize:"20px", fontWeight:800, color:C.text, fontFamily:"Inter, -apple-system, sans-serif" }}>
                {card.titulo_card || card.tema_gerador}
              </span>
            </div>

            {/* Traduções nas 3 línguas com áudio */}
            <div style={{ display:"flex", flexDirection:"column" as const, gap:"8px" }}>
              {langsValidas.map((l: any, li: number) => {
                const key = `ans-${li}-${card.id}`;
                const isPlay = audio.isSpeaking && audio.speakingKey === key;
                return (
                  <button key={li}
                    onClick={() => isPlay ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, key)}
                    style={{ width:"100%", borderRadius:"6px", background:isPlay?"rgba(27,94,43,0.08)":"#F7F8FC", border:`1.5px solid ${isPlay?"rgba(27,94,43,0.30)":"transparent"}`, cursor:"pointer", padding:0, overflow:"hidden", textAlign:"left" as const, transition:"all 0.2s", fontFamily:"Inter, -apple-system, sans-serif" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px" }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:isPlay?"#1B5E2B":"rgba(27,94,43,0.10)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isPlay?"#fff":"#1B5E2B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {isPlay
                            ? <><line x1="8" y1="6" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="18"/></>
                            : <polygon points="5 3 19 12 5 21 5 3"/>
                          }
                        </svg>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"10px", fontWeight:700, color:isPlay?"#1B5E2B":C.muted, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"2px" }}>{l.nome}</div>
                        <div style={{ fontSize:"17px", fontWeight:800, color:isPlay?"#1B5E2B":C.text }}>{l.txt}</div>
                        {l.fon && <div style={{ fontSize:"12px", color:C.muted, fontStyle:"italic", marginTop:"1px" }}>{l.fon}</div>}
                      </div>
                    </div>
                    {l.exemplo && (
                      <div style={{ padding:"4px 14px 10px 60px", borderTop:"1px solid rgba(0,0,0,0.05)", fontSize:"11px", color:C.muted, fontStyle:"italic", lineHeight:1.5 }}>
                        {l.exemplo}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Botões SM-2 ─────────────────────────────────────────────────── */}
          <div style={{ width:"100%", maxWidth:"520px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:C.muted, textTransform:"uppercase" as const, letterSpacing:"0.06em", textAlign:"center" as const, marginBottom:"10px" }}>
              Como foi?
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
              {[
                { label:"Errei",   q:0, color:C.red,    bg:"rgba(204,42,32,0.07)",  border:"rgba(204,42,32,0.25)"  },
                { label:"Difícil", q:3, color:C.orange, bg:"rgba(245,200,0,0.10)", border:"rgba(224,120,32,0.25)" },
                { label:"Bom",     q:4, color:C.blue,   bg:"rgba(27,94,43,0.07)",  border:"rgba(27,94,43,0.25)"  },
                { label:"Fácil",   q:5, color:C.green,  bg:"rgba(27,94,43,0.07)",  border:"rgba(27,94,43,0.25)"  },
              ].map((btn: any) => (
                <button key={btn.q}
                  disabled={saving}
                  onClick={() => responder(btn.q)}
                  style={{ padding:"10px 6px", borderRadius:"6px", border:`1.5px solid ${btn.border}`, background:btn.bg, color:btn.color, cursor:saving?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.15s", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"4px" }}>
                  <span style={{ fontSize:"13px", fontWeight:800 }}>{btn.label}</span>
                  <span style={{ fontSize:"10px", color:C.muted, fontWeight:500 }}>
                    {previewInterval(card, btn.q)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}



// ── Progresso ────────────────────────────────────────────────────────────────

function ProgressoTab({ cards }: { cards: MentoriaCard[] }) {
  const total    = cards.length;
  const revisados = cards.filter((c: MentoriaCard) => (c.quiz_acertos||0) + (c.quiz_erros||0) > 0).length;
  const urgentes  = cards.filter((c: MentoriaCard) => Math.floor((Date.now()-new Date(c.criado_em||"").getTime())/86400000) >= 3).length;
  const acertos   = cards.reduce((s,c) => s+(c.quiz_acertos||0), 0);
  const erros     = cards.reduce((s,c) => s+(c.quiz_erros||0), 0);
  const taxa      = acertos+erros > 0 ? Math.round((acertos/(acertos+erros))*100) : 0;

  // Distribuição por tronco
  const romanico  = cards.filter((c: MentoriaCard) => c.tronco === "românico").length;
  const germanico = cards.filter((c: MentoriaCard) => c.tronco === "germânico").length;

  // Últimos 7 dias
  const hoje = new Date();
  const porDia = Array.from({length:7}, (_,i) => {
    const d = new Date(hoje); d.setDate(hoje.getDate()-6+i);
    const label = d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
    const count = cards.filter((c: MentoriaCard) => {
      const cd = new Date(c.criado_em||"");
      return cd.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });
  const maxDia = Math.max(...(porDia||[]).map((d: any) =>d.count), 1);

  const C2 = { blue:"#1B5E2B", orange:"#E07820", green:"#1B5E2B", bg:"#F7F8FC", text:"#111827", muted:"#6B7280" };

  return (
    <div style={{ height:"100%", overflowY:"auto" as const, background:C2.bg }}>
      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"24px 20px 48px" }}>
        <div style={{ fontSize:"22px", fontWeight:800, color:C2.blue, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"20px" }}>Meu Progresso</div>

        {/* Cards de estatísticas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"20px" }}>
          {[
            { label:"Nexos totais", value:total, color:C2.blue },
            { label:"Taxa de acerto", value:taxa+"%", color:C2.green },
            { label:"Para revisar", value:urgentes, color:C2.orange },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:"6px", padding:"16px 14px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)", textAlign:"center" as const }}>
              
              <div style={{ fontSize:"24px", fontWeight:800, color:s.color, fontFamily:"Inter, -apple-system, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize:"11px", color:C2.muted, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gráfico 7 dias */}
        <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"16px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
          <div style={{ fontSize:"13px", fontWeight:700, color:C2.muted, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"16px" }}>Nexos criados — últimos 7 dias</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:"80px" }}>
            {porDia.map((d,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"4px" }}>
                <div style={{ width:"100%", background:d.count>0?"rgba(27,94,43,0.15)":"#F4F5F0", borderRadius:"6px 6px 0 0", height:`${Math.max(4,(d.count/maxDia)*68)}px`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {d.count > 0 && <span style={{ fontSize:"10px", fontWeight:700, color:C2.blue }}>{d.count}</span>}
                </div>
                <span style={{ fontSize:"10px", color:C2.muted, fontWeight:600 }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por tronco */}
        {total > 0 && (
          <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"16px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
            <div style={{ fontSize:"13px", fontWeight:700, color:C2.muted, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"14px" }}>Distribuição por tronco</div>
            {[
              { label:"Tear Românico", count:romanico, color:C2.blue, langs:"Espanhol · Francês · Italiano" },
              { label:"Tear Germânico", count:germanico, color:C2.orange, langs:"Inglês · Alemão · Holandês" },
            ].map((t,i) => (
              <div key={i} style={{ marginBottom:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <div>
                    <span style={{ fontSize:"13px", fontWeight:700, color:C2.text }}>{t.label}</span>
                    <span style={{ fontSize:"11px", color:C2.muted, marginLeft:"8px" }}>{t.langs}</span>
                  </div>
                  <span style={{ fontSize:"13px", fontWeight:700, color:t.color }}>{t.count}</span>
                </div>
                <div style={{ height:"6px", borderRadius:"6px", background:"#F4F5F0", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:"6px", background:t.color, width:`${total>0?(t.count/total)*100:0}%`, transition:"width 0.4s ease" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz stats */}
        {acertos+erros > 0 && (
          <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
            <div style={{ fontSize:"13px", fontWeight:700, color:C2.muted, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"14px" }}>Desempenho no Quiz</div>
            <div style={{ display:"flex", gap:"20px" }}>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:"28px", fontWeight:800, color:C2.green }}>{acertos}</div>
                <div style={{ fontSize:"11px", color:C2.muted }}>Acertos</div>
              </div>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:"28px", fontWeight:800, color:"#991B1B" }}>{erros}</div>
                <div style={{ fontSize:"11px", color:C2.muted }}>Erros</div>
              </div>
              <div style={{ flex:1, display:"flex", alignItems:"center" }}>
                <div style={{ width:"100%", height:"10px", borderRadius:"10px", background:"#F4F5F0", overflow:"hidden" }}>
                  <div style={{ height:"100%", background:`linear-gradient(90deg,${C2.green},#34C759)`, width:`${taxa}%`, borderRadius:"10px", transition:"width 0.4s ease" }}/>
                </div>
              </div>
              <div style={{ textAlign:"center" as const }}>
                <div style={{ fontSize:"28px", fontWeight:800, color:C2.blue }}>{taxa}%</div>
                <div style={{ fontSize:"11px", color:C2.muted }}>Taxa</div>
              </div>
            </div>
          </div>
        )}

        {total === 0 && (
          <div style={{ textAlign:"center" as const, padding:"48px 24px", color:C2.muted }}>
            <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
            <div style={{ fontSize:"15px", fontWeight:700, color:C2.text, fontFamily:"Inter, -apple-system, sans-serif" }}>Nenhum dado ainda</div>
            <div style={{ fontSize:"13px", marginTop:"6px" }}>Converse com o Chico e crie nexos para ver seu progresso aqui.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Viagem ────────────────────────────────────────────────────────────────────

function ViagemTab({ profile, audio }: { profile: UserProfile | null; audio: ReturnType<typeof useAudio> }) {
  const [destino, setDestino]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError]         = useState("");

  async function gerarGuia() {
    if (!destino.trim() || !profile) return;
    setLoading(true); setResultado(null); setError("");
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ acao:"viagem", destino:destino.trim(), tronco:profile.tronco, interesses:profile.interesses??[] }),
      });
      const data = await res.json();
      if (res.ok && data.viagem) setResultado(data.viagem);
      else setError(data.error || "Erro ao gerar guia.");
    } catch { setError("Erro de conexão."); }
    setLoading(false);
  }

  return (
    <div style={{ height:"100%", overflowY:"auto" as const, background:"#F4F5F0" }}>
      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"24px 20px 48px" }}>
        <div style={{ fontSize:"22px", fontWeight:800, color:C.green, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"6px" }}>Modo Viagem ✈️</div>
        <div style={{ fontSize:"14px", color:"#6B7280", marginBottom:"20px" }}>Digite o destino e o Chico cria um guia de sobrevivência linguística personalizado.</div>

        <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
          <input value={destino} onChange={e=>setDestino(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&gerarGuia()}
            placeholder="Ex: Barcelona, Paris, Berlim..."
            style={{ flex:1, padding:"12px 16px", borderRadius:"6px", border:"1.5px solid rgba(27,94,43,0.20)", fontSize:"14px", fontFamily:"Inter, -apple-system, sans-serif", color:"#111827", outline:"none", background:"#fff" }}/>
          <button onClick={gerarGuia} disabled={!destino.trim()||loading}
            style={{ padding:"12px 22px", borderRadius:"6px", border:"none", background:loading||!destino.trim()?"rgba(0,0,0,0.07)":"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:loading||!destino.trim()?"#AEAEB2":"#fff", fontSize:"14px", fontWeight:800, cursor:loading||!destino.trim()?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
            {loading?"...":"Gerar →"}
          </button>
        </div>

        {error && <div style={{ padding:"12px 16px", borderRadius:"12px", background:"rgba(204,42,32,0.08)", color:"#991B1B", fontSize:"13px", marginBottom:"16px" }}>{error}</div>}

        {resultado && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"10px" }}>
            {/* Dica cultural do destino */}
            {resultado.dica_cultural && (
              <div style={{ padding:"12px 16px", borderRadius:"6px", background:"rgba(27,94,43,0.07)", border:"1px solid rgba(27,94,43,0.15)", fontSize:"13px", color:C.green, lineHeight:1.6 }}>
                {resultado.dica_cultural}
              </div>
            )}
            {/* Cards de palavras/expressoes */}
            {Array.isArray(resultado.palavras) && resultado.palavras.map((item: any, i: number) => (
              <div key={i} style={{ background:"#fff", borderRadius:"6px", padding:"16px 18px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                {/* Palavra em PT + contexto */}
                <div style={{ marginBottom:"8px" }}>
                  <div style={{ fontSize:"17px", fontWeight:800, color:C.green, fontFamily:"Inter, -apple-system, sans-serif" }}>
                    {item.pt || item.expressao || item.palavra || ""}
                  </div>
                  {item.contexto && (
                    <div style={{ fontSize:"12px", color:"#6B7280", marginTop:"2px" }}>{item.contexto}</div>
                  )}
                </div>
                {/* Traducoes nas linguas do tronco */}
                <div style={{ display:"flex", flexDirection:"column" as const, gap:"6px" }}>
                  {[
                    { label:"lang_1", txt: item.lang_1, fon: item.fon_1 },
                    { label:"lang_2", txt: item.lang_2, fon: item.fon_2 },
                    { label:"lang_3", txt: item.lang_3, fon: item.fon_3 },
                  ].filter((l: any) => l.txt && l.txt.trim().length > 0).map((l, li) => (
                    <div key={li} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"10px", background:"#F4F5F0" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"15px", fontWeight:700, color:"#111827" }}>{l.txt}</div>
                        {l.fon && <div style={{ fontSize:"12px", color:"#6B7280", fontStyle:"italic" }}>{l.fon}</div>}
                      </div>
                      <button onClick={()=>audio.speak(l.txt, "es-ES", "v"+i+li)}
                        style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"rgba(27,94,43,0.10)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1B5E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!resultado && !loading && !error && (
          <div style={{ textAlign:"center" as const, padding:"48px 24px", color:"#6B7280" }}>
            <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg></div>
            <div style={{ fontSize:"15px", fontWeight:700, color:"#6B7280", fontFamily:"Inter, -apple-system, sans-serif" }}>Para onde você vai?</div>
            <div style={{ fontSize:"13px", marginTop:"6px" }}>O Chico cria um guia com as expressões essenciais para se virar no destino.</div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Praticar ─────────────────────────────────────────────────────────────────

function PraticarTab({ profile, cards, audio }: {
  profile: UserProfile | null;
  cards: MentoriaCard[];
  audio: ReturnType<typeof useAudio>;
}) {
  const linguas = profile?.tronco === "germânico"
    ? ["Inglês","Alemão","Holandês"]
    : ["Espanhol","Francês","Italiano"];

  // ── estado compartilhado ──────────────────────────────────────────────────
  const [modo, setModo]       = useState<"ditado"|"conversa">("ditado");
  const [lingua, setLingua]   = useState(linguas[0]);
  const [nivel, setNivel]     = useState<"iniciante"|"intermediário"|"avançado">("iniciante");

  // ── estado ditado ─────────────────────────────────────────────────────────
  const [ditado, setDitado]         = useState<any>(null);
  const [loadingDitado, setLDitado] = useState(false);
  const [respDitado, setRespDitado] = useState("");
  const [resultDitado, setResultDitado] = useState<null|{acertos:number;total:number;diff:React.ReactNode[]}>(null);
  const [playSpeed, setPlaySpeed]   = useState<0.7|1.0|1.3>(0.7);

  // ── estado conversa guiada ────────────────────────────────────────────────
  const [situacao, setSituacao]     = useState<any>(null);
  const [loadingSit, setLSit]       = useState(false);
  const [sitNum, setSitNum]         = useState(1);
  const [respSit, setRespSit]       = useState("");
  const [avaliacao, setAvaliacao]   = useState<any>(null);
  const [loadingAval, setLAval]     = useState(false);
  const [sessaoDone, setSessaoDone] = useState(false);
  const [placar, setPlacar]         = useState({ acertos:0, total:0 });

  const nexos = cards.map((c: MentoriaCard) => c.titulo_card||c.tema_gerador).filter(Boolean).slice(0,10);

  // ── DITADO: gerar frase ───────────────────────────────────────────────────
  async function gerarDitado() {
    if (!profile) return;
    setLDitado(true);
    setDitado(null); setRespDitado(""); setResultDitado(null);
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          acao:"gerar_ditado", tronco:profile.tronco, lingua, nivel,
          nexos_recentes:nexos, interesses:profile.interesses||[],
        }),
      });
      const data = await res.json();
      if (res.ok && data.ditado) setDitado(data.ditado);
    } catch {}
    setLDitado(false);
  }

  // ── DITADO: ouvir frase ───────────────────────────────────────────────────
  function ouvirFrase() {
    if (!ditado?.frase || !ditado?.bcp47) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(ditado.frase);
    utt.lang = ditado.bcp47;
    utt.rate = playSpeed;
    synth.speak(utt);
  }

  // ── DITADO: verificar resposta ────────────────────────────────────────────
  function verificarDitado() {
    if (!ditado?.frase || !respDitado.trim()) return;
    const esperado = ditado.frase.toLowerCase().trim();
    const dado     = respDitado.toLowerCase().trim();
    const palavrasE = esperado.split(/\s+/);
    const palavrasD = dado.split(/\s+/);
    let acertos = 0;
    const diff: React.ReactNode[] = palavrasE.map((p: string, i: number) => {
      const ok = palavrasD[i]?.replace(/[^a-záéíóúüñàâêîôûäëïöùçœæ]/gi,"") === p.replace(/[^a-záéíóúüñàâêîôûäëïöùçœæ]/gi,"");
      if (ok) acertos++;
      return (
        <span key={i} style={{
          marginRight:"4px", padding:"1px 4px", borderRadius:"4px",
          background: ok ? "rgba(27,94,43,0.12)" : "rgba(204,42,32,0.12)",
          color: ok ? "#1B5E2B" : "#991B1B", fontWeight: ok ? 500 : 700,
        }}>
          {ok ? p : (palavrasD[i] || "___")}
          {!ok && <span style={{fontSize:"10px",display:"block",color:"#1B5E2B"}}>{p}</span>}
        </span>
      );
    });
    setResultDitado({ acertos, total: palavrasE.length, diff });
  }

  // ── CONVERSA: gerar situação ──────────────────────────────────────────────
  async function gerarSituacao(num: number) {
    if (!profile) return;
    setLSit(true); setSituacao(null); setAvaliacao(null); setRespSit("");
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          acao:"gerar_situacao", tronco:profile.tronco, lingua, nivel,
          interesses:profile.interesses||[], situacao_num:num,
        }),
      });
      const data = await res.json();
      if (res.ok && data.situacao) setSituacao(data.situacao);
    } catch {}
    setLSit(false);
  }

  // ── CONVERSA: avaliar resposta ────────────────────────────────────────────
  async function avaliarResposta() {
    if (!situacao || !respSit.trim()) return;
    setLAval(true);
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          acao:"avaliar_resposta", lingua,
          resposta: respSit,
          exemplo_resposta: situacao.exemplo_resposta,
          situacao: situacao.situacao,
        }),
      });
      const data = await res.json();
      if (res.ok && data.avaliacao) {
        setAvaliacao(data.avaliacao);
        const ok = data.avaliacao.correto || data.avaliacao.nota >= 6;
        setPlacar(p => ({ acertos: p.acertos+(ok?1:0), total: p.total+1 }));
      }
    } catch {}
    setLAval(false);
  }

  function proximaSituacao() {
    if (sitNum >= 5) { setSessaoDone(true); return; }
    const next = sitNum + 1;
    setSitNum(next);
    gerarSituacao(next);
  }

  function reiniciarConversa() {
    setSitNum(1); setSessaoDone(false); setPlacar({acertos:0,total:0});
    setSituacao(null); setAvaliacao(null); setRespSit("");
    gerarSituacao(1);
  }

  // ── cores e helpers ───────────────────────────────────────────────────────
  const C3 = { blue:"#1B5E2B", orange:"#E07820", green:"#1B5E2B", bg:"#F7F8FC", muted:"#6B7280", text:"#111827" };
  const nivelCores: Record<string,{bg:string;color:string}> = {
    "iniciante":    {bg:"rgba(27,94,43,0.08)",  color:"#1B5E2B"},
    "intermediário":{bg:"rgba(245,200,0,0.12)", color:"#C06010"},
    "avançado":     {bg:"rgba(27,94,43,0.08)",  color:C.green},
  };

  return (
    <div style={{ height:"100%", overflowY:"auto" as const, background:C3.bg }}>
      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"24px 20px 48px" }}>

        {/* Título */}
        <div style={{ fontSize:"22px", fontWeight:800, color:C3.blue, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"4px" }}>Praticar</div>
        <div style={{ fontSize:"14px", color:C3.muted, marginBottom:"20px" }}>Coloque em prática o que aprendeu com o Chico.</div>

        {/* Selector de modo */}
        <div style={{ display:"flex", gap:"8px", padding:"4px", borderRadius:"6px", background:"rgba(0,0,0,0.06)", marginBottom:"20px" }}>
          {([["ditado","Ditado"],["conversa","Conversa Guiada"]] as const).map(([m,label]) => (
            <button key={m} onClick={()=>setModo(m)}
              style={{ flex:1, padding:"10px", borderRadius:"11px", border:"none", background:modo===m?"#fff":"transparent", color:modo===m?C3.blue:C3.muted, fontSize:"13px", fontWeight:modo===m?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:modo===m?"0 1px 6px rgba(0,0,0,0.10)":"none", transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Controles comuns: língua + nível */}
        <div style={{ background:"#fff", borderRadius:"6px", padding:"18px", marginBottom:"16px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
          <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" as const }}>
            <div style={{ flex:1, minWidth:"120px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:C3.muted, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"8px" }}>Língua</div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" as const }}>
                {linguas.map((l: any) => (
                  <button key={l} onClick={()=>setLingua(l)}
                    style={{ padding:"6px 12px", borderRadius:"8px", border:`1.5px solid ${lingua===l?C3.blue:"rgba(0,0,0,0.09)"}`, background:lingua===l?"rgba(27,94,43,0.08)":"transparent", color:lingua===l?C3.blue:C3.muted, fontSize:"12px", fontWeight:lingua===l?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, minWidth:"180px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:C3.muted, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"8px" }}>Nível</div>
              <div style={{ display:"flex", gap:"6px" }}>
                {(["iniciante","intermediário","avançado"] as const).map((n: any) => {
                  const nc = nivelCores[n];
                  return (
                    <button key={n} onClick={()=>setNivel(n)}
                      style={{ padding:"6px 12px", borderRadius:"8px", border:`1.5px solid ${nivel===n?nc.color:"rgba(0,0,0,0.09)"}`, background:nivel===n?nc.bg:"transparent", color:nivel===n?nc.color:C3.muted, fontSize:"12px", fontWeight:nivel===n?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", textTransform:"capitalize" as const }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── MODO DITADO ─────────────────────────────────────────────────── */}
        {modo === "ditado" && (
          <>
            <button onClick={gerarDitado} disabled={loadingDitado}
              style={{ width:"100%", padding:"14px", borderRadius:"6px", border:"none", background:loadingDitado?"rgba(0,0,0,0.07)":"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:loadingDitado?"#AEAEB2":"#fff", fontSize:"15px", fontWeight:800, cursor:loadingDitado?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"16px", boxShadow:loadingDitado?"none":"0 3px 14px rgba(27,94,43,0.25)" }}>
              {loadingDitado ? "Gerando..." : ditado ? "Nova frase →" : "Gerar frase →"}
            </button>

            {ditado && (
              <>
                {/* Card de áudio */}
                <div style={{ background:C.green, borderRadius:"6px", padding:"22px", marginBottom:"12px", boxShadow:"0 4px 20px rgba(27,94,43,0.25)" }}>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:"12px" }}>
                    Ouça e escreva o que ouvir
                  </div>
                  {/* Botões de velocidade + play */}
                  <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" as const }}>
                    <button onClick={ouvirFrase}
                      style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 20px", borderRadius:"12px", border:"none", background:"rgba(255,255,255,0.20)", color:"#fff", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Ouvir
                    </button>
                    <div style={{ display:"flex", gap:"4px" }}>
                      {([0.7, 1.0, 1.3] as const).map((s: any) => (
                        <button key={s} onClick={()=>setPlaySpeed(s)}
                          style={{ padding:"6px 10px", borderRadius:"8px", border:"none", background:playSpeed===s?"rgba(255,255,255,0.30)":"rgba(255,255,255,0.12)", color:"#fff", fontSize:"12px", fontWeight:playSpeed===s?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                          {s === 0.7 ? "Lento" : s === 1.0 ? "Normal" : "Rápido"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campo de resposta */}
                {!resultDitado ? (
                  <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"12px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:C3.muted, marginBottom:"10px", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>
                      Escreva o que ouviu
                    </div>
                    <textarea
                      value={respDitado}
                      onChange={e => setRespDitado(e.target.value)}
                      placeholder={"Escreva em " + lingua + "..."}
                      rows={3}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:"1.5px solid rgba(27,94,43,0.20)", fontSize:"15px", fontFamily:"Inter, -apple-system, sans-serif", color:C3.text, resize:"none" as const, boxSizing:"border-box" as const }}
                    />
                    <button onClick={verificarDitado} disabled={!respDitado.trim()}
                      style={{ width:"100%", marginTop:"10px", padding:"13px", borderRadius:"12px", border:"none", background:!respDitado.trim()?"rgba(0,0,0,0.06)":"linear-gradient(135deg,#E07820,#F09030)", color:!respDitado.trim()?"#AEAEB2":"#fff", fontSize:"14px", fontWeight:800, cursor:!respDitado.trim()?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                      Verificar →
                    </button>
                  </div>
                ) : (
                  /* Resultado do ditado */
                  <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"12px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                    {/* Pontuação */}
                    <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px", padding:"14px 16px", borderRadius:"12px", background:resultDitado.acertos===resultDitado.total?"rgba(27,94,43,0.08)":"rgba(245,200,0,0.12)" }}>
                      <div style={{ fontSize:"22px", fontWeight:800, color:C.green }}>{resultDitado.acertos===resultDitado.total?"✦":resultDitado.acertos>=resultDitado.total*0.7?"◇":"◆"}</div>
                      <div>
                        <div style={{ fontSize:"20px", fontWeight:800, color:resultDitado.acertos===resultDitado.total?C3.green:C3.orange, fontFamily:"Inter, -apple-system, sans-serif" }}>
                          {resultDitado.acertos}/{resultDitado.total} palavras
                        </div>
                        <div style={{ fontSize:"13px", color:C3.muted }}>
                          {resultDitado.acertos===resultDitado.total?"Perfeito!":resultDitado.acertos>=resultDitado.total*0.7?"Muito bem!":"Continue praticando!"}
                        </div>
                      </div>
                    </div>
                    {/* Diff palavra por palavra */}
                    <div style={{ fontSize:"12px", fontWeight:700, color:C3.muted, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"8px" }}>
                      Comparação (verde = correto · vermelho = errado)
                    </div>
                    <div style={{ fontSize:"16px", lineHeight:2, flexWrap:"wrap" as const, display:"flex" }}>
                      {resultDitado.diff}
                    </div>
                    {/* Frase correta */}
                    <div style={{ marginTop:"12px", padding:"10px 14px", borderRadius:"10px", background:"rgba(27,94,43,0.07)", fontSize:"14px", color:C3.green, fontWeight:600 }}>
                      {ditado.frase}
                    </div>
                    {/* Tradução */}
                    {ditado.traducao_pt && (
                      <div style={{ marginTop:"6px", fontSize:"13px", color:C3.muted, fontStyle:"italic" }}>
                        <Flag bcp47="pt" size="sm"/> {ditado.traducao_pt}
                      </div>
                    )}
                    {/* Dica */}
                    {ditado.dica && (
                      <div style={{ marginTop:"8px", padding:"8px 12px", borderRadius:"8px", background:"rgba(27,94,43,0.06)", fontSize:"12px", color:C3.blue }}>
                        {ditado.dica}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!ditado && !loadingDitado && (
              <div style={{ textAlign:"center" as const, padding:"40px 24px", color:C3.muted }}>
                <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg></div>
                <div style={{ fontSize:"15px", fontWeight:700, color:"#6B7280", fontFamily:"Inter, -apple-system, sans-serif" }}>Pronto para ouvir?</div>
                <div style={{ fontSize:"13px", marginTop:"6px", lineHeight:1.5 }}>O Chico vai falar uma frase em {lingua}.<br/>Ouça e escreva o que ouviu.</div>
              </div>
            )}
          </>
        )}

        {/* ── MODO CONVERSA GUIADA ────────────────────────────────────────── */}
        {modo === "conversa" && (
          <>
            {!situacao && !loadingSit && !sessaoDone && (
              <>
                <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"16px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                  <div style={{ fontSize:"15px", fontWeight:700, color:C3.text, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"6px" }}>Como funciona</div>
                  <div style={{ fontSize:"13px", color:C3.muted, lineHeight:1.6 }}>
                    O Chico vai te colocar em 5 situações reais — restaurante, hotel, transporte, loja e perguntar direções. Você responde em {lingua} e o Chico avalia e corrige.
                  </div>
                </div>
                <button onClick={()=>{ setSitNum(1); gerarSituacao(1); }}
                  style={{ width:"100%", padding:"14px", borderRadius:"6px", border:"none", background:"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:"#fff", fontSize:"15px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:"0 3px 14px rgba(27,94,43,0.28)" }}>
                  Começar sessão →
                </button>
              </>
            )}

            {loadingSit && (
              <div style={{ textAlign:"center" as const, padding:"40px", color:C3.muted, fontSize:"14px" }}>
                Preparando situação {sitNum} de 5...
              </div>
            )}

            {sessaoDone && (
              <div style={{ background:"#fff", borderRadius:"6px", padding:"28px", textAlign:"center" as const, boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                <div style={{ fontSize:"28px", fontWeight:800, color:C.green, marginBottom:"12px" }}>{placar.acertos>=4?"✦":placar.acertos>=3?"◇":"◆"}</div>
                <div style={{ fontSize:"22px", fontWeight:800, color:C3.blue, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"6px" }}>Sessão concluída!</div>
                <div style={{ fontSize:"15px", color:C3.muted, marginBottom:"20px" }}>{placar.acertos}/5 situações respondidas corretamente</div>
                <div style={{ display:"flex", gap:"12px", justifyContent:"center" as const }}>
                  <button onClick={reiniciarConversa}
                    style={{ padding:"12px 24px", borderRadius:"6px", border:"none", background:"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:"#fff", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                    Nova sessão
                  </button>
                  <button onClick={()=>{ setSituacao(null); setSessaoDone(false); }}
                    style={{ padding:"12px 24px", borderRadius:"6px", border:"1.5px solid rgba(27,94,43,0.20)", background:"transparent", color:C3.blue, fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                    Mudar configurações
                  </button>
                </div>
              </div>
            )}

            {situacao && !sessaoDone && (
              <>
                {/* Progresso */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span style={{ fontSize:"13px", color:C3.muted, fontFamily:"Inter, -apple-system, sans-serif" }}>Situação {sitNum} de 5</span>
                  <span style={{ fontSize:"13px", fontWeight:700, color:C3.green }}>{placar.acertos} corretas</span>
                </div>
                <div style={{ height:5, borderRadius:5, background:"rgba(0,0,0,0.07)", marginBottom:"16px", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:5, background:"linear-gradient(90deg,#1B5E2B,#2E7D45)", width:`${((sitNum-1)/5)*100}%`, transition:"width 0.4s ease" }}/>
                </div>

                {/* Card da situação */}
                <div style={{ background:"linear-gradient(135deg,#1B5E2B,#2E7D45)", borderRadius:"6px", padding:"22px", marginBottom:"12px", boxShadow:"0 4px 20px rgba(27,94,43,0.25)" }}>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.65)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:"10px" }}>
                    Situação
                  </div>
                  <div style={{ fontSize:"15px", color:"#fff", lineHeight:1.6, marginBottom:"12px" }}>{situacao.situacao}</div>
                  <div style={{ padding:"10px 14px", borderRadius:"10px", background:"rgba(255,255,255,0.15)", fontSize:"14px", color:"#fff", fontWeight:700 }}>
                    {situacao.instrucao}
                  </div>
                  {/* Palavras úteis */}
                  {situacao.palavras_uteis?.length > 0 && (
                    <div style={{ marginTop:"12px", display:"flex", gap:"6px", flexWrap:"wrap" as const }}>
                      <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.65)", alignSelf:"center" }}>Útil:</span>
                      {(situacao.palavras_uteis||[]).map((p:string, i:number) => (
                        <span key={i} style={{ padding:"3px 10px", borderRadius:"8px", background:"rgba(255,255,255,0.18)", fontSize:"12px", color:"#fff", fontWeight:600 }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo de resposta ou avaliação */}
                {!avaliacao ? (
                  <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:C3.muted, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"10px" }}>
                      Sua resposta em {lingua}
                    </div>
                    <textarea
                      value={respSit}
                      onChange={e => setRespSit(e.target.value)}
                      placeholder={"Responda em " + lingua + "..."}
                      rows={3}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:"1.5px solid rgba(27,94,43,0.25)", fontSize:"15px", fontFamily:"Inter, -apple-system, sans-serif", color:C3.text, resize:"none" as const, boxSizing:"border-box" as const }}
                    />
                    <button onClick={avaliarResposta} disabled={!respSit.trim() || loadingAval}
                      style={{ width:"100%", marginTop:"10px", padding:"13px", borderRadius:"12px", border:"none", background:!respSit.trim()||loadingAval?"rgba(0,0,0,0.06)":"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:!respSit.trim()||loadingAval?"#AEAEB2":"#fff", fontSize:"14px", fontWeight:800, cursor:!respSit.trim()||loadingAval?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                      {loadingAval ? "Avaliando..." : "Enviar →"}
                    </button>
                  </div>
                ) : (
                  /* Avaliação */
                  <div style={{ background:"#fff", borderRadius:"6px", padding:"20px", boxShadow:"0 2px 10px rgba(27,94,43,0.07)" }}>
                    {/* Nota */}
                    <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"14px", padding:"14px 16px", borderRadius:"12px", background:(avaliacao.correto||avaliacao.nota>=6)?"rgba(27,94,43,0.08)":"rgba(245,200,0,0.12)" }}>
                      <div style={{ fontSize:"22px", fontWeight:800, color:C.green }}>{avaliacao.nota>=8?"✦":avaliacao.nota>=6?"◇":"◆"}</div>
                      <div>
                        <div style={{ fontSize:"22px", fontWeight:800, color:(avaliacao.correto||avaliacao.nota>=6)?C3.green:C3.orange, fontFamily:"Inter, -apple-system, sans-serif" }}>
                          {avaliacao.nota}/10
                        </div>
                        <div style={{ fontSize:"13px", color:C3.muted }}>{avaliacao.explicacao}</div>
                      </div>
                    </div>
                    {/* Correção */}
                    {avaliacao.correcao && avaliacao.correcao.trim().length > 0 && (
                      <div style={{ marginBottom:"10px", padding:"10px 14px", borderRadius:"10px", background:"rgba(27,94,43,0.06)", fontSize:"14px", color:C3.blue }}>
                        <span style={{ fontWeight:700 }}>✓ Como ficaria: </span>{avaliacao.correcao}
                      </div>
                    )}
                    {/* Dica */}
                    {avaliacao.dica && (
                      <div style={{ marginBottom:"14px", padding:"10px 14px", borderRadius:"10px", background:"rgba(245,200,0,0.10)", fontSize:"13px", color:"#8A4A10" }}>
                        {avaliacao.dica}
                      </div>
                    )}
                    <button onClick={proximaSituacao}
                      style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:C.green, color:"#fff", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                      {sitNum >= 5 ? "Ver resultado final →" : "Próxima situação →"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}


// ── Livros (Project Gutenberg) ────────────────────────────────────────────────

interface LivroInfo {
  id: number;
  titulo: string;
  autor: string;
  lingua: string;
  assuntos: string[];
  downloads: number;
  url_txt: string;
}

interface LivroProgresso {
  gutenberg_id: number;
  titulo: string;
  autor: string;
  lingua: string;
  capitulo_atual: number;
  url_txt: string;
  atualizado_em: string;
}

interface Capitulo {
  num: number;
  total: number;
  titulo_cap: string;
  texto: string;
  contexto: string;
  nivel: string;
  palavras_chave: { palavra: string; traducao_pt: string; nota: string }[];
}

function LivrosTab({ profile, cards, audio, onAddCard }: {
  profile: UserProfile | null;
  cards: MentoriaCard[];
  audio: ReturnType<typeof useAudio>;
  onAddCard: (card: MentoriaCard) => void;
}) {
  const [view, setView]               = useState<"lista"|"lendo">("lista");
  const [query, setQuery]             = useState("");
  const [livros, setLivros]           = useState<LivroInfo[]>([]);
  const [recomendados, setRecomend]   = useState<number[]>([]);
  const [loading, setLoading]         = useState(false);
  const [progresso, setProgresso]     = useState<LivroProgresso[]>([]);
  const [livroAtual, setLivroAtual]   = useState<LivroInfo | null>(null);
  const [capitulo, setCapitulo]       = useState<Capitulo | null>(null);
  const [capLoading, setCapLoad]      = useState(false);
  const [tradWord, setTradWord]       = useState<{palavra:string;traducao_pt:string;fonetica:string;classe:string;instrucao_biologica?:string;ancora?:string;chunk_tear?:string;exemplo_uso?:string}|null>(null);
  const [translatingLivro, setTranslatingLivro] = useState(false);
  const [salvando, setSalvando]       = useState<string|null>(null);
  const [paralelo, setParalelo]       = useState(false);
  const [selWord, setSelWord]         = useState<string|null>(null);

  // linguaFlag handled by <Flag> component
  const linguaNome: Record<string,string> = {
    "es":"Espanhol","fr":"Francês","it":"Italiano","en":"Inglês","de":"Alemão","nl":"Holandês","pt":"Português"
  };

  useEffect(() => {
    if (!profile) return;
    buscarLivros();
    carregarProgresso();
  }, [profile]);

  async function buscarLivros(q = "") {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "buscar_livros", tronco: profile.tronco,
          nivel: "intermediário", interesses: profile.interesses || [],
          query: q,
        }),
      });
      const data = await res.json();
      if (res.ok) { setLivros(data.livros || []); setRecomend(data.recomendados || []); }
    } catch {}
    setLoading(false);
  }

  async function carregarProgresso() {
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "buscar_progresso_livros" }),
      });
      const data = await res.json();
      if (res.ok) setProgresso(data.livros || []);
    } catch {}
  }

  async function abrirLivro(livro: LivroInfo, capNum = 1) {
    setLivroAtual(livro); setView("lendo");
    setCapitulo(null); setCapLoad(true);
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "carregar_capitulo", url_txt: livro.url_txt,
          capitulo_num: capNum, titulo: livro.titulo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.capitulo) {
        setCapitulo(data.capitulo);
        // Salva progresso
        await fetch("/api/chico", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "salvar_progresso_livro",
            gutenberg_id: livro.id, titulo: livro.titulo,
            autor: livro.autor, lingua: livro.lingua,
            capitulo_atual: capNum, url_txt: livro.url_txt,
          }),
        });
        await carregarProgresso();
      }
    } catch {}
    setCapLoad(false);
  }

  async function traduzirPalavra(palavra: string) {
    if (!profile) return;
    setSelWord(palavra); setTradWord(null); setTranslatingLivro(true);
    // Check palavras_chave do capítulo primeiro
    const found = capitulo?.palavras_chave?.find((p: any) =>
      p.palavra.toLowerCase() === palavra.toLowerCase()
    );
    if (found) {
      setTradWord({ palavra: found.palavra, traducao_pt: found.traducao_pt, fonetica: "", classe: "", instrucao_biologica: found.nota });
      setTranslatingLivro(false);
      return;
    }
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "traduzir_palavra", palavra,
          lingua_origem: livroAtual?.lingua || "es",
          tronco: profile.tronco,
          interesses: profile.interesses || [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) setTradWord({ palavra, ...data.result });
    } catch {}
    setTranslatingLivro(false);
  }

  async function salvarComoNexo() {
    if (!tradWord || !profile) return;
    setSalvando(tradWord.palavra);
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "salvar_palavra_historia",
          palavra: tradWord.palavra,
          traducao_pt: tradWord.traducao_pt,
          fonetica: tradWord.fonetica || "",
          nota: tradWord.instrucao_biologica || "",
          lingua: livroAtual?.lingua || "es",
          tronco: profile.tronco,
          interesses: profile.interesses || [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.card) onAddCard({ ...data.card, id: data.saved_id, criado_em: new Date().toISOString() });
    } catch {}
    setSalvando(null);
    setTradWord(null); setSelWord(null);
  }

  function renderTextoLivro(texto: string) {
    if (!texto) return null;
    const parafs = texto.split(/\n\n+/).filter((p: string) => p.trim());
    return parafs.map((para: string, pi: number) => (
      <p key={pi} style={{ margin: "0 0 16px", fontSize: "16px", lineHeight: "1.85", color: C.text }}>
        {para.split(/(\s+)/).map((token: string, ti: number) => {
          const word = token.trim().replace(/[.,;:!?"""''()]/g, "");
          const isWord = word.length > 2;
          const isKw = capitulo?.palavras_chave?.some((k: any) =>
            k.palavra.toLowerCase() === word.toLowerCase()
          );
          return (
            <span key={ti}
              onClick={() => isWord ? traduzirPalavra(word) : null}
              style={{
                cursor: isWord ? "pointer" : "default",
                background: selWord === word ? "rgba(27,94,43,0.15)" : isKw ? "rgba(245,200,0,0.25)" : "transparent",
                borderRadius: "3px", padding: isWord ? "1px 2px" : "0",
                borderBottom: isKw ? "1px solid #E8B800" : "none",
              }}>
              {token}
            </span>
          );
        })}
      </p>
    ));
  }

  // ── Lista de livros ────────────────────────────────────────────────────────
  if (view === "lista") return (
    <div style={{ height: "100%", overflowY: "auto" as const, background: C.bg }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 48px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.green, fontFamily: "Nunito, sans-serif" }}>
            Biblioteca
          </div>
          <a href="https://www.gutenberg.org" target="_blank" rel="noreferrer"
            style={{ fontSize: "11px", color: C.muted, textDecoration: "none" }}>
            Project Gutenberg ↗
          </a>
        </div>
        <div style={{ fontSize: "14px", color: C.muted, marginBottom: "20px" }}>
          Clássicos da literatura mundial — leitura guiada pelo Chico.
        </div>

        {/* Busca */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") buscarLivros(query); }}
            placeholder="Buscar livro ou autor..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "14px", fontFamily: "Nunito, sans-serif", color: C.text, background: C.panel }}
          />
          <button onClick={() => buscarLivros(query)} disabled={loading}
            style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: loading ? C.border : C.green, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Nunito, sans-serif" }}>
            {loading ? "..." : "Buscar"}
          </button>
        </div>

        {/* Continuar lendo */}
        {progresso.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
              Continuar lendo
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {progresso.slice(0, 3).map((lp: LivroProgresso) => (
                <div key={lp.gutenberg_id}
                  onClick={() => abrirLivro({ id: lp.gutenberg_id, titulo: lp.titulo, autor: lp.autor, lingua: lp.lingua, url_txt: lp.url_txt, assuntos: [], downloads: 0 }, lp.capitulo_atual)}
                  style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "22px" }}><Flag bcp47={lp.lingua} size="md"/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{lp.titulo}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{lp.autor} · Capítulo {lp.capitulo_atual}</div>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.green }}>Continuar →</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de livros */}
        {loading ? (
          <div style={{ textAlign: "center" as const, padding: "48px", color: C.muted }}>
            <div style={{ width:40, height:40, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
            <div style={{ fontSize: "14px" }}>Buscando livros...</div>
          </div>
        ) : livros.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "48px", color: C.muted }}>
            <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: C.text, fontFamily: "Nunito, sans-serif" }}>Nenhum livro encontrado</div>
            <div style={{ fontSize: "13px", marginTop: "6px" }}>Tente buscar por título ou autor.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>
              {recomendados.length > 0 ? "Recomendados para você" : "Resultados"}
            </div>
            {[
              ...livros.filter((l: LivroInfo) => recomendados.includes(l.id)),
              ...livros.filter((l: LivroInfo) => !recomendados.includes(l.id)),
            ].map((livro: LivroInfo) => {
              const isRec = recomendados.includes(livro.id);
              return (
                <div key={livro.id}
                  onClick={() => abrirLivro(livro, 1)}
                  style={{ background: C.panel, border: `1px solid ${isRec ? C.greenBd : C.border}`, borderRadius: "6px", padding: "14px 16px", cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start", transition: "border-color 0.15s" }}>
                  <div style={{ fontSize: "28px", flexShrink: 0 }}><Flag bcp47={livro.lingua} size="md"/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: C.text, fontFamily: "Nunito, sans-serif" }}>{livro.titulo}</span>
                      {isRec && <span style={{ background: C.greenLt, color: C.green, fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", border: `1px solid ${C.greenBd}`, flexShrink: 0 }}>Recomendado</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: C.muted }}>{livro.autor} · {linguaNome[livro.lingua] || livro.lingua}</div>
                    {livro.assuntos.length > 0 && (
                      <div style={{ fontSize: "11px", color: C.hint, marginTop: "4px" }}>{livro.assuntos.slice(0, 2).join(" · ")}</div>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.green, flexShrink: 0 }}>Ler →</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Lendo ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" as const, background: C.bg }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", background: C.panel, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => { setView("lista"); setCapitulo(null); setTradWord(null); setSelWord(null); }}
          style={{ padding: "6px 12px", borderRadius: "5px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "12px", cursor: "pointer", fontFamily: "Nunito, sans-serif" }}>
          ← Voltar
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: C.text, fontFamily: "Nunito, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {livroAtual?.titulo}
          </div>
          <div style={{ fontSize: "11px", color: C.muted }}>{livroAtual?.autor}</div>
        </div>
        {capitulo && (
          <div style={{ fontSize: "12px", color: C.muted, flexShrink: 0 }}>
            Cap. {capitulo.num}/{capitulo.total}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "24px 20px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>

          {capLoading ? (
            <div style={{ textAlign: "center" as const, padding: "80px 0", color: C.muted }}>
              <div style={{ width:40, height:40, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
              <div style={{ fontSize: "14px" }}>Carregando capítulo...</div>
            </div>
          ) : capitulo ? (
            <>
              {/* Título do capítulo */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.green, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "4px" }}>
                  <Flag bcp47={livroAtual?.lingua || "pt"} size="md"/> {linguaNome[livroAtual?.lingua || ""] || ""}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, fontFamily: "Nunito, sans-serif", marginBottom: "6px" }}>
                  {capitulo.titulo_cap}
                </div>
                {capitulo.contexto && (
                  <div style={{ fontSize: "13px", color: C.muted, fontStyle: "italic", padding: "8px 12px", background: C.greenLt, borderRadius: "5px", borderLeft: `3px solid ${C.green}` }}>
                    {capitulo.contexto}
                  </div>
                )}
              </div>

              {/* Palavras-chave */}
              {capitulo.palavras_chave.length > 0 && (
                <div style={{ marginBottom: "20px", padding: "12px 16px", background: C.panel, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "8px" }}>
                    Vocabulário do capítulo — clique para salvar
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                    {capitulo.palavras_chave.map((kw: any, i: number) => (
                      <button key={i} onClick={() => setTradWord({ palavra: kw.palavra, traducao_pt: kw.traducao_pt, fonetica: "", classe: "", instrucao_biologica: kw.nota })}
                        style={{ padding: "4px 10px", borderRadius: "4px", border: `1px solid ${C.yellowBd}`, background: C.yellowLt, color: "#7A5F00", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Nunito, sans-serif" }}>
                        {kw.palavra}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Texto */}
              <div style={{ fontSize: "16px", lineHeight: 1.85, color: C.text, fontFamily: "Georgia, serif" }}>
                {renderTextoLivro(capitulo.texto)}
              </div>

              {/* Popup de tradução — igual HistoriasTab */}
              {selWord && (
                <div style={{ position: "sticky" as const, bottom: "16px", background: C.panel, border: `1.5px solid ${C.greenBd}`, borderRadius: "8px", padding: "14px 16px", boxShadow: "0 4px 16px rgba(27,94,43,0.12)", display: "flex", alignItems: "flex-start", gap: "12px", animation: "fadeIn 0.2s ease forwards" }}>
                  {translatingLivro ? (
                    <div style={{ fontSize: "14px", color: C.muted }}>Traduzindo "{selWord}"...</div>
                  ) : tradWord ? (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: C.green, fontFamily: "Nunito, sans-serif" }}>{tradWord.palavra}</div>
                          {tradWord.fonetica && <div style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>{tradWord.fonetica}</div>}
                          {tradWord.classe && <div style={{ fontSize: "11px", color: C.hint }}>· {tradWord.classe}</div>}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>{tradWord.traducao_pt}</div>
                        {tradWord.instrucao_biologica && (
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: C.greenLt, border: `1px solid ${C.greenBd}`, fontSize: "12px", color: C.greenMid, marginBottom: "5px", lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700 }}>Pronúncia: </span>{tradWord.instrucao_biologica}
                          </div>
                        )}
                        {tradWord.ancora && (
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: C.yellowLt, border: `1px solid ${C.yellowBd}`, fontSize: "12px", color: "#8A4A10", marginBottom: "5px", lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700 }}>Origem: </span>{tradWord.ancora}
                          </div>
                        )}
                        {tradWord.chunk_tear && (
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: C.greenLt, border: `1px solid ${C.greenBd}`, fontSize: "12px", color: C.green, marginBottom: "5px", lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700 }}>Tear: </span>{tradWord.chunk_tear}
                          </div>
                        )}
                        {tradWord.exemplo_uso && (
                          <div style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>"{tradWord.exemplo_uso}"</div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", flexShrink: 0 }}>
                        <button onClick={salvarComoNexo} disabled={salvando === tradWord.palavra}
                          style={{ padding: "7px 14px", borderRadius: "5px", border: "none", background: salvando === tradWord.palavra ? C.border : C.green, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "Nunito, sans-serif", whiteSpace: "nowrap" as const }}>
                          {salvando === tradWord.palavra ? "..." : "+ Nexo"}
                        </button>
                        <button onClick={() => { setTradWord(null); setSelWord(null); }}
                          style={{ padding: "5px", border: "none", background: "none", color: C.hint, fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Navegação de capítulos */}
              <div style={{ display: "flex", gap: "10px", marginTop: "32px", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => livroAtual && abrirLivro(livroAtual, capitulo.num - 1)}
                  disabled={capitulo.num <= 1 || capLoading}
                  style={{ flex: 1, padding: "12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: capitulo.num <= 1 ? C.hint : C.text, fontSize: "13px", fontWeight: 700, cursor: capitulo.num <= 1 ? "not-allowed" : "pointer", fontFamily: "Nunito, sans-serif" }}>
                  ← Cap. anterior
                </button>
                <button onClick={() => livroAtual && abrirLivro(livroAtual, capitulo.num + 1)}
                  disabled={capitulo.num >= capitulo.total || capLoading}
                  style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "none", background: capitulo.num >= capitulo.total ? C.border : C.green, color: capitulo.num >= capitulo.total ? C.hint : "#fff", fontSize: "13px", fontWeight: 700, cursor: capitulo.num >= capitulo.total ? "not-allowed" : "pointer", fontFamily: "Nunito, sans-serif" }}>
                  Cap. seguinte →
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}


// ── Histórias ────────────────────────────────────────────────────────────────

interface Historia {
  titulo: string;
  titulo_pt: string;
  lingua: string;
  nivel: string;
  texto: string;
  resumo_pt: string;
  palavras_chave: { palavra:string; traducao_pt:string; fonetica:string }[];
  perguntas: { pergunta:string; opcoes:string[]; correta:number }[];
}

interface HistoriaSalva extends Historia {
  id: string;
  salva_em: string;
  lida: boolean;
}

function HistoriasTab({ profile, cards, onAddCard }: {
  profile: UserProfile | null;
  cards: MentoriaCard[];
  onAddCard: (card: MentoriaCard) => void;
}) {
  const LINGUAS_TRONCO: Record<string,string[]> = {
    românico:  ["Espanhol","Francês","Italiano"],
    germânico: ["Inglês","Alemão","Holandês"],
  };
  const linguas = profile?.tronco ? (LINGUAS_TRONCO[profile.tronco] ?? ["Espanhol"]) : ["Espanhol"];

  // ── estado ────────────────────────────────────────────────────────────────
  const [view, setView]               = useState<"gerar"|"salvas">("gerar");
  const [lingua, setLingua]           = useState(linguas[0]);
  const [nivel, setNivel]             = useState<"iniciante"|"intermediário"|"avançado">("iniciante");
  const [loading, setLoading]         = useState(false);
  const [historia, setHistoria]       = useState<Historia | null>(null);
  const [savedWords, setSavedWords]   = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord]   = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number|null)[]>([null,null,null]);
  const [quizDone, setQuizDone]       = useState(false);
  const [historiasSalvas, setHistoriasSalvas] = useState<HistoriaSalva[]>([]);
  const [historiaSelecionada, setHistoriaSelecionada] = useState<HistoriaSalva | null>(null);

  // Tradução de qualquer palavra
  const [selWord, setSelWord]         = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [wordTranslation, setWordTranslation] = useState<{traducao_pt:string;fonetica:string;classe:string;exemplo_uso:string;instrucao_biologica?:string;ancora?:string;chunk_tear?:string} | null>(null);

  // Modo paralelo
  const [paralelo, setParalelo]       = useState(false);
  const [loadingParalelo, setLoadingParalelo] = useState(false);
  const [paragrafosPt, setParagrafosPt] = useState<string[]>([]);

  // Áudio
  const [playing, setPlaying]         = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  // Load histórias salvas do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chico_historias_salvas");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistoriasSalvas(parsed);
      }
    } catch {}
  }, []);

  function saveToLocalStorage(list: HistoriaSalva[]) {
    try { localStorage.setItem("chico_historias_salvas", JSON.stringify(list)); } catch {}
  }

  async function gerarHistoria() {
    if (!profile) return;
    setLoading(true); setHistoria(null); setSelWord(null); setWordTranslation(null);
    setSavedWords(new Set()); setQuizStarted(false); setQuizAnswers([null,null,null]);
    setQuizDone(false); setParalelo(false); setParagrafosPt([]); setPlaying(false);
    synth?.cancel();
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ acao:"gerar_historia", tronco:profile.tronco, interesses:profile.interesses??[], lingua, nivel }),
      });
      const data = await res.json();
      if (res.ok && data.historia) setHistoria(data.historia);
    } catch {}
    setLoading(false);
  }

  function salvarHistoria() {
    if (!historia) return;
    const nova: HistoriaSalva = { ...historia, id: Date.now().toString(), salva_em: new Date().toLocaleDateString("pt-BR"), lida: false };
    const list = [nova, ...historiasSalvas].slice(0, 20);
    setHistoriasSalvas(list);
    saveToLocalStorage(list);
  }

  function excluirHistoria(id: string) {
    const list = historiasSalvas.filter(h => h.id !== id);
    setHistoriasSalvas(list);
    saveToLocalStorage(list);
    if (historiaSelecionada?.id === id) setHistoriaSelecionada(null);
  }

  function marcarLida(id: string) {
    const list = historiasSalvas.map(h => h.id === id ? {...h, lida:true} : h);
    setHistoriasSalvas(list);
    saveToLocalStorage(list);
  }

  // Tradução de palavra avulsa
  async function traduzirPalavra(palavra: string) {
    if (!historia || !profile) return;
    setSelWord(palavra); setWordTranslation(null); setTranslating(true);
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ acao:"traduzir_palavra", palavra, lingua_origem:lingua, tronco:profile.tronco, interesses:profile.interesses??[] }),
      });
      const data = await res.json();
      if (res.ok && data.result) setWordTranslation(data.result);
    } catch {}
    setTranslating(false);
  }

  // Modo paralelo
  async function ativarParalelo() {
    if (!historia || !profile) return;
    if (paragrafosPt.length > 0) { setParalelo(v=>!v); return; }
    setLoadingParalelo(true);
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ acao:"traduzir_historia", texto:historia.texto, lingua_origem:historia.lingua }),
      });
      const data = await res.json();
      if (res.ok && data.paragrafos) { setParagrafosPt(data.paragrafos); setParalelo(true); }
    } catch {}
    setLoadingParalelo(false);
  }

  // Áudio
  function toggleAudio() {
    if (!historia || !synth) return;
    if (playing) { synth.cancel(); setPlaying(false); return; }
    const utter = new SpeechSynthesisUtterance(historia.texto);
    const bcp47: Record<string,string> = { Espanhol:"es-ES", Francês:"fr-FR", Italiano:"it-IT", Inglês:"en-GB", Alemão:"de-DE", Holandês:"nl-NL" };
    utter.lang = bcp47[historia.lingua] ?? "es-ES";
    utter.rate = nivel === "iniciante" ? 0.82 : nivel === "intermediário" ? 0.92 : 1.0;
    utter.onend = () => setPlaying(false);
    synth.speak(utter); setPlaying(true);
  }

  // Salvar palavra como nexo
  async function salvarPalavraComNexo(p:{palavra:string;traducao_pt:string;fonetica:string}) {
    if (!profile || savedWords.has(p.palavra)) return;
    setSavingWord(p.palavra);
    try {
      const res = await fetch("/api/chico", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ acao:"salvar_palavra_historia", palavra:p.palavra, traducao_pt:p.traducao_pt, fonetica:p.fonetica, tronco:profile.tronco, lingua_origem:lingua }),
      });
      const data = await res.json();
      if (res.ok && data.card) { onAddCard(data.card); setSavedWords(prev=>new Set([...prev,p.palavra])); }
    } catch {}
    setSavingWord(null);
  }

  function handleQuizAnswer(qi:number, ai:number) {
    if (quizAnswers[qi]!==null) return;
    const next=[...quizAnswers]; next[qi]=ai; setQuizAnswers(next);
    if (next.every(a=>a!==null)) setTimeout(()=>setQuizDone(true),600);
  }

  const acertos = historia ? quizAnswers.filter((a,i)=>a===historia.perguntas[i]?.correta).length : 0;

  // Render texto com palavras clicáveis
  function renderTexto(texto:string|undefined, h:Historia|null) {
    if (!texto || !h) return null;
    const parafs = texto.split("\n\n").filter((p:string) => p.trim().length > 0);
    const ptParafs = paragrafosPt;
    return parafs.map((para, pi) => (
      <div key={pi} style={{ display:"grid", gridTemplateColumns:paralelo&&ptParafs[pi]?"1fr 1fr":"1fr", gap:"16px", marginBottom:"18px" }}>
        <p style={{ margin:0, fontSize:"16px", lineHeight:"1.85", color:"#111827", fontFamily:"Inter, -apple-system, sans-serif", fontWeight:500 }}>
          {para.split(" ").map((word, wi) => {
            const clean = word.replace(/[^a-zA-Z\u00C0-\u024F0-9]/gi,"").toLowerCase();
            const kw = clean.length > 1 ? h.palavras_chave.find(k=>k.palavra.toLowerCase()===clean) : null;
            const isSelected = selWord === word;
            const isSaved = !!(kw && savedWords.has(kw.palavra));
            return (
              <span key={wi}>
                <span
                  onClick={()=>{ if(clean.length>1){ setWordTranslation(null); if(selWord===word){setSelWord(null);}else{traduzirPalavra(word);} } }}
                  style={{
                    cursor: clean.length>1 ? "pointer" : "default",
                    background: isSelected?"rgba(27,94,43,0.15)":kw?(isSaved?"rgba(27,94,43,0.10)":"rgba(224,120,32,0.12)"):"transparent",
                    borderRadius:"3px", padding:"0 2px",
                    color: isSelected?"#1B5E2B":kw?(isSaved?"#1B5E2B":"#B05A10"):"inherit",
                    fontWeight: kw?700:500,
                    textDecoration: kw?"underline":"none",
                    textDecorationStyle: "dotted" as const,
                    transition:"background 0.15s",
                  }}>
                  {word}
                </span>
                {wi < para.split(" ").length-1 ? " " : ""}
              </span>
            );
          })}
        </p>
        {paralelo && ptParafs[pi] && (
          <p style={{ margin:0, fontSize:"14px", lineHeight:"1.75", color:"#6A7A9A", fontFamily:"Inter, -apple-system, sans-serif", borderLeft:"2px solid #E0EAF8", paddingLeft:"14px" }}>
            {ptParafs[pi]}
          </p>
        )}
      </div>
    ));
  }

  const nivelCores: Record<string,{bg:string;color:string;border:string}> = {
    iniciante:     {bg:"rgba(27,94,43,0.08)",  color:"#1B5E2B", border:"rgba(27,94,43,0.25)"},
    intermediário: {bg:"rgba(245,200,0,0.12)", color:"#C06010", border:"rgba(224,120,32,0.25)"},
    avançado:      {bg:"rgba(27,94,43,0.08)",  color:C.green, border:"rgba(27,94,43,0.25)"},
  };

  const textoAtual: Historia | null = historiaSelecionada ?? historia;

  return (
    <div style={{height:"100%", overflowY:"auto", background:"#F4F5F0"}}>
      <div style={{maxWidth:"720px", margin:"0 auto", padding:"24px 20px 48px"}}>

        {/* Tabs gerar / salvas */}
        <div style={{display:"flex", gap:"8px", marginBottom:"16px", padding:"4px", background:"rgba(0,0,0,0.05)", borderRadius:"6px", width:"fit-content"}}>
          {(["gerar","salvas"] as const).map(v=>(
            <button key={v} onClick={()=>{setView(v); setHistoriaSelecionada(null);}}
              style={{padding:"8px 20px", borderRadius:"10px", border:"none", background:view===v?"#fff":"transparent", color:view===v?"#1B5E2B":"#6A7A9A", fontSize:"14px", fontWeight:view===v?800:600, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:view===v?"0 1px 4px rgba(0,0,0,0.10)":"none", transition:"all 0.15s"}}>
              {v==="gerar"?"Gerar história":`Salvas (${historiasSalvas.length})`}
            </button>
          ))}
        </div>

        {/* ── VIEW: GERAR ── */}
        {view==="gerar" && (
          <>
            {/* Controles */}
            <div style={{background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"16px", boxShadow:"0 2px 12px rgba(27,94,43,0.07)"}}>
              <div style={{fontSize:"20px", fontWeight:800, color:C.green, fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"4px"}}>Histórias</div>
              <div style={{fontSize:"14px", color:"#6A7A9A", marginBottom:"18px"}}>Toque em qualquer palavra para traduzir. Palavras destacadas em laranja são do glossário da história.</div>
              <div style={{display:"flex", gap:"16px", flexWrap:"wrap" as const, marginBottom:"16px"}}>
                <div style={{flex:1, minWidth:"130px"}}>
                  <div style={{fontSize:"11px", fontWeight:700, color:"#6B7280", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"6px"}}>Língua</div>
                  <div style={{display:"flex", gap:"6px", flexWrap:"wrap" as const}}>
                    {linguas.map((l: any) =>(
                      <button key={l} onClick={()=>setLingua(l)}
                        style={{padding:"7px 14px", borderRadius:"8px", border:`2px solid ${lingua===l?"#1B5E2B":"rgba(0,0,0,0.09)"}`, background:lingua===l?"rgba(27,94,43,0.08)":"transparent", color:lingua===l?"#1B5E2B":"#6B7280", fontSize:"13px", fontWeight:lingua===l?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.15s"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{flex:1, minWidth:"200px"}}>
                  <div style={{fontSize:"11px", fontWeight:700, color:"#6B7280", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"6px"}}>Nível</div>
                  <div style={{display:"flex", gap:"6px"}}>
                    {(["iniciante","intermediário","avançado"] as const).map((n: any) =>{
                      const nc=nivelCores[n];
                      return(
                        <button key={n} onClick={()=>setNivel(n)}
                          style={{padding:"7px 14px", borderRadius:"8px", border:`2px solid ${nivel===n?nc.border:"rgba(0,0,0,0.09)"}`, background:nivel===n?nc.bg:"transparent", color:nivel===n?nc.color:"#6B7280", fontSize:"13px", fontWeight:nivel===n?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.15s", textTransform:"capitalize" as const}}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button onClick={gerarHistoria} disabled={loading}
                style={{width:"100%", padding:"14px", borderRadius:"6px", border:"none", background:loading?"rgba(0,0,0,0.07)":"linear-gradient(135deg,#1B5E2B,#2E7D45)", color:loading?"#AEAEB2":"#fff", fontSize:"15px", fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:loading?"none":"0 3px 14px rgba(27,94,43,0.28)"}}>
                {loading?"Gerando história...":textoAtual?"Nova história →":"Gerar história →"}
              </button>
            </div>

            {/* História */}
            {textoAtual && (
              <>
                {/* Header da história */}
                <div style={{background:C.green, borderRadius:"6px", padding:"22px 24px", marginBottom:"12px", boxShadow:"0 4px 20px rgba(27,94,43,0.25)"}}>
                  <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px"}}>
                    <span style={{padding:"4px 12px", borderRadius:"8px", background:"rgba(255,255,255,0.15)", fontSize:"12px", fontWeight:700, color:"#fff"}}>{textoAtual?.lingua}</span>
                    <span style={{padding:"4px 12px", borderRadius:"8px", background:"rgba(255,255,255,0.12)", fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"capitalize" as const}}>{textoAtual?.nivel}</span>
                    
                  </div>
                  <div style={{fontSize:"22px", fontWeight:800, color:"#fff", fontFamily:"Inter, -apple-system, sans-serif", lineHeight:1.2, marginBottom:"4px"}}>{textoAtual?.titulo}</div>
                  <div style={{fontSize:"14px", color:"rgba(255,255,255,0.70)", fontStyle:"italic"}}>{textoAtual?.titulo_pt}</div>
                </div>

                {/* Barra de ferramentas */}
                <div style={{display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap" as const}}>
                  {/* Áudio */}
                  <button onClick={toggleAudio}
                    style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"10px", border:"none", background:playing?"rgba(204,42,32,0.09)":"rgba(27,94,43,0.08)", color:playing?"#991B1B":"#1B5E2B", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.2s"}}>
                    {playing
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pausar</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Ouvir</>
                    }
                  </button>
                  {/* Modo paralelo */}
                  <button onClick={ativarParalelo} disabled={loadingParalelo}
                    style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"10px", border:"none", background:paralelo?"rgba(94,92,230,0.12)":"rgba(0,0,0,0.06)", color:paralelo?"#5E5CE6":"#6B7280", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif"}}>
                    {loadingParalelo?"Traduzindo...":paralelo?<><Flag bcp47="pt" size="sm"/> Ocultar PT</>:<><Flag bcp47="pt" size="sm"/> Ler em PT</>}
                  </button>
                  {/* Salvar */}
                  {!historiaSelecionada && (
                    <button onClick={salvarHistoria}
                      style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"10px", border:"none", background:"rgba(27,94,43,0.08)", color:"#1B5E2B", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", marginLeft:"auto"}}>
                      Salvar história
                    </button>
                  )}
                </div>

                {/* Popup de tradução de palavra */}
                {selWord && (
                  <div style={{background:"#fff", borderRadius:"6px", padding:"14px 16px", marginBottom:"12px", border:"1.5px solid rgba(27,94,43,0.15)", boxShadow:"0 2px 12px rgba(27,94,43,0.10)", display:"flex", alignItems:"center", gap:"14px", animation:"fadeIn 0.2s ease forwards"}}>
                    {translating
                      ? <div style={{fontSize:"14px", color:"#6B7280"}}>Traduzindo "{selWord}"...</div>
                      : wordTranslation
                        ? <>
                            <div style={{flex:1}}>
                              <div style={{display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"2px"}}>
                                <div style={{fontSize:"18px", fontWeight:800, color:C.green, fontFamily:"Inter, -apple-system, sans-serif"}}>{selWord}</div>
                                <div style={{fontSize:"11px", color:"#6B7280", fontStyle:"italic"}}>{wordTranslation.fonetica}</div>
                                <div style={{fontSize:"11px", color:"#AEAEB2"}}>· {wordTranslation.classe}</div>
                              </div>
                              <div style={{fontSize:"16px", fontWeight:700, color:"#111827", marginBottom:"6px"}}>{wordTranslation.traducao_pt}</div>
                              {wordTranslation.instrucao_biologica && (
                                <div style={{padding:"6px 10px", borderRadius:"8px", background:"rgba(27,94,43,0.07)", border:"1px solid rgba(27,94,43,0.18)", fontSize:"12px", color:"#2A6A48", marginBottom:"5px", lineHeight:1.5}}>
                                  <span style={{fontWeight:700}}>🫁 Pronúncia: </span>{wordTranslation.instrucao_biologica}
                                </div>
                              )}
                              {wordTranslation.ancora && (
                                <div style={{padding:"6px 10px", borderRadius:"8px", background:"rgba(245,200,0,0.10)", border:"1px solid rgba(224,120,32,0.18)", fontSize:"12px", color:"#8A4A10", marginBottom:"5px", lineHeight:1.5}}>
                                  <span style={{fontWeight:700}}>Origem: </span>{wordTranslation.ancora}
                                </div>
                              )}
                              {wordTranslation.chunk_tear && (
                                <div style={{padding:"6px 10px", borderRadius:"8px", background:"rgba(27,94,43,0.06)", border:"1px solid rgba(27,94,43,0.15)", fontSize:"12px", color:C.green, marginBottom:"5px", lineHeight:1.5}}>
                                  <span style={{fontWeight:700}}>Tear: </span>{wordTranslation.chunk_tear}
                                </div>
                              )}
                              {wordTranslation.exemplo_uso && <div style={{fontSize:"12px", color:"#6B7280", fontStyle:"italic"}}>"{wordTranslation.exemplo_uso}"</div>}
                            </div>
                            <div style={{display:"flex", flexDirection:"column" as const, gap:"6px"}}>
                              <button onClick={()=>salvarPalavraComNexo({palavra:selWord, traducao_pt:wordTranslation.traducao_pt, fonetica:wordTranslation.fonetica})}
                                disabled={savedWords.has(selWord)||savingWord===selWord}
                                style={{padding:"7px 14px", borderRadius:"10px", border:"none", background:savedWords.has(selWord)?"rgba(27,94,43,0.10)":"linear-gradient(135deg,#E07820,#F09030)", color:savedWords.has(selWord)?"#1B5E2B":"#fff", fontSize:"13px", fontWeight:800, cursor:savedWords.has(selWord)?"default":"pointer", fontFamily:"Inter, -apple-system, sans-serif", whiteSpace:"nowrap" as const}}>
                                {savingWord===selWord?"...":savedWords.has(selWord)?"✓ Salvo":"+ Nexo"}
                              </button>
                              <button onClick={()=>{setSelWord(null);setWordTranslation(null);}}
                                style={{padding:"4px", border:"none", background:"none", color:"#AEAEB2", fontSize:"18px", cursor:"pointer", lineHeight:1}}>×</button>
                            </div>
                          </>
                        : <div style={{fontSize:"14px", color:"#991B1B"}}>Não foi possível traduzir.</div>
                    }
                  </div>
                )}

                {/* Texto */}
                <div style={{background:"#fff", borderRadius:"6px", padding:"24px", marginBottom:"12px", boxShadow:"0 2px 12px rgba(27,94,43,0.07)"}}>
                  <div style={{fontSize:"12px", fontWeight:700, color:"#6B7280", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"16px"}}>
                    Toque em qualquer palavra para traduzir
                  </div>
                  {textoAtual && renderTexto(textoAtual?.texto, textoAtual)}
                </div>

                {/* Glossário */}
                {(textoAtual?.palavras_chave||[]).length>0 && (
                  <div style={{background:"#fff", borderRadius:"6px", padding:"20px", marginBottom:"12px", boxShadow:"0 2px 12px rgba(27,94,43,0.07)"}}>
                    <div style={{fontSize:"13px", fontWeight:700, color:"#6B7280", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"14px"}}>Glossário da história</div>
                    <div style={{display:"flex", flexDirection:"column" as const, gap:"8px"}}>
                      {(textoAtual?.palavras_chave||[]).map((p,i)=>{
                        const saved=savedWords.has(p.palavra);
                        return(
                          <div key={i} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:"12px", background:saved?"rgba(27,94,43,0.06)":"#F7F8FC", border:`1px solid ${saved?"rgba(27,94,43,0.20)":"rgba(0,0,0,0.07)"}`}}>
                            <div style={{display:"flex", alignItems:"baseline", gap:"8px", flexWrap:"wrap" as const}}>
                              <span style={{fontSize:"15px", fontWeight:800, color:"#B05A10", fontFamily:"Inter, -apple-system, sans-serif"}}>{p.palavra}</span>
                              <span style={{fontSize:"11px", color:"#6B7280", fontStyle:"italic"}}>{p.fonetica}</span>
                              <span style={{fontSize:"14px", color:"#6B7280"}}>→ {p.traducao_pt}</span>
                            </div>
                            <button onClick={()=>salvarPalavraComNexo(p)} disabled={saved||savingWord===p.palavra}
                              style={{padding:"5px 12px", borderRadius:"8px", border:"none", background:saved?"rgba(27,94,43,0.12)":"rgba(27,94,43,0.08)", color:saved?"#1B5E2B":"#1B5E2B", fontSize:"12px", fontWeight:700, cursor:saved?"default":"pointer", fontFamily:"Inter, -apple-system, sans-serif", flexShrink:0}}>
                              {savingWord===p.palavra?"...":saved?"✓":"+ Nexo"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quiz */}
                {!quizStarted
                  ? <button onClick={()=>setQuizStarted(true)}
                      style={{width:"100%", padding:"14px", borderRadius:"6px", border:"none", background:"linear-gradient(135deg,#E07820,#F09030)", color:"#fff", fontSize:"15px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:"0 3px 14px rgba(224,120,32,0.28)"}}>
                      Testar compreensão →
                    </button>
                  : (
                    <div style={{background:"#fff", borderRadius:"6px", padding:"22px", boxShadow:"0 2px 12px rgba(27,94,43,0.07)"}}>
                      <div style={{fontSize:"13px", fontWeight:700, color:"#6B7280", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"16px"}}>Perguntas de compreensão</div>
                      <div style={{display:"flex", flexDirection:"column" as const, gap:"20px"}}>
                        {(textoAtual.perguntas||[]).map((q,qi)=>(
                          <div key={qi}>
                            <div style={{fontSize:"15px", fontWeight:700, color:"#111827", marginBottom:"10px", fontFamily:"Inter, -apple-system, sans-serif"}}>{qi+1}. {q.pergunta}</div>
                            <div style={{display:"flex", flexDirection:"column" as const, gap:"7px"}}>
                              {(q.opcoes||[]).map((op,oi)=>{
                                const answered=quizAnswers[qi]!==null;
                                const isSelected=quizAnswers[qi]===oi;
                                const isCorrect=oi===q.correta;
                                let bg="#F7F8FC", border="1px solid rgba(0,0,0,0.08)", color="#111827";
                                if(answered){
                                  if(isCorrect){bg="rgba(27,94,43,0.08)";border="1.5px solid #1B5E2B";color="#1B5E2B";}
                                  else if(isSelected){bg="rgba(204,42,32,0.08)";border="1.5px solid #991B1B";color="#991B1B";}
                                }
                                return(
                                  <button key={oi} disabled={answered} onClick={()=>handleQuizAnswer(qi,oi)}
                                    style={{width:"100%", padding:"12px 16px", borderRadius:"12px", border, background:bg, color, fontSize:"14px", fontWeight:isCorrect&&answered?800:500, cursor:answered?"default":"pointer", fontFamily:"Inter, -apple-system, sans-serif", textAlign:"left" as const, transition:"all 0.2s"}}>
                                    {op}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {quizDone && (
                        <div style={{marginTop:"20px", padding:"16px 20px", borderRadius:"6px", background:acertos===3?"rgba(27,94,43,0.08)":acertos>=2?"rgba(245,200,0,0.12)":"rgba(27,94,43,0.08)", border:`1.5px solid ${acertos===3?"rgba(27,94,43,0.25)":acertos>=2?"rgba(224,120,32,0.25)":"rgba(27,94,43,0.20)"}`, textAlign:"center" as const}}>
                          <div style={{fontSize:"28px", fontWeight:800, color:acertos===3?"#1B5E2B":acertos>=2?"#C06010":"#1B5E2B", fontFamily:"Inter, -apple-system, sans-serif"}}>
                            {acertos}/3 {acertos===3?"✦":acertos>=2?"◇":"◆"}
                          </div>
                          <div style={{fontSize:"14px", color:"#6B7280", marginTop:"4px"}}>{acertos===3?"Perfeito!":acertos>=2?"Muito bem!":"Continue praticando!"}</div>
                          <button onClick={gerarHistoria}
                            style={{marginTop:"14px", padding:"10px 24px", borderRadius:"12px", border:"none", background:C.green, color:"#fff", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif"}}>
                            Nova história
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }
              </>
            )}

            {/* Estado vazio */}
            {!textoAtual && !loading && (
              <div style={{textAlign:"center", padding:"48px 24px", color:"#6B7280"}}>
                <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                <div style={{fontSize:"16px", fontWeight:700, color:"#6B7280", fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"6px"}}>Pronto para ler?</div>
                <div style={{fontSize:"14px", lineHeight:1.5}}>Escolha a língua e o nível acima,<br/>e o Chico cria uma história só para você.</div>
              </div>
            )}
          </>
        )}

        {/* ── VIEW: SALVAS ── */}
        {view==="salvas" && (
          <>
            {historiaSelecionada
              ? (
                <>
                  <button onClick={()=>setHistoriaSelecionada(null)}
                    style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px", border:"1px solid rgba(0,0,0,0.09)", background:"#fff", color:"#6B7280", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"14px"}}>
                    ← Voltar
                  </button>
                  {/* Reutiliza a renderização da história */}
                  <div style={{background:C.green, borderRadius:"6px", padding:"22px 24px", marginBottom:"12px", boxShadow:"0 4px 20px rgba(27,94,43,0.25)"}}>
                    <div style={{display:"flex", gap:"8px", marginBottom:"10px"}}>
                      <span style={{padding:"4px 12px", borderRadius:"8px", background:"rgba(255,255,255,0.15)", fontSize:"12px", fontWeight:700, color:"#fff"}}>{historiaSelecionada.lingua}</span>
                      <span style={{padding:"4px 12px", borderRadius:"8px", background:"rgba(255,255,255,0.12)", fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"capitalize" as const}}>{historiaSelecionada.nivel}</span>
                    </div>
                    <div style={{fontSize:"22px", fontWeight:800, color:"#fff", fontFamily:"Inter, -apple-system, sans-serif", lineHeight:1.2, marginBottom:"4px"}}>{historiaSelecionada.titulo}</div>
                    <div style={{fontSize:"14px", color:"rgba(255,255,255,0.70)", fontStyle:"italic"}}>{historiaSelecionada.titulo_pt}</div>
                  </div>
                  <div style={{display:"flex", gap:"8px", marginBottom:"12px"}}>
                    <button onClick={toggleAudio}
                      style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"10px", border:"none", background:playing?"rgba(204,42,32,0.09)":"rgba(27,94,43,0.08)", color:playing?"#991B1B":"#1B5E2B", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif"}}>
                      {playing ? "Pausar" : "Ouvir"}
                    </button>
                    <button onClick={ativarParalelo} disabled={loadingParalelo}
                      style={{display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"10px", border:"none", background:paralelo?"rgba(94,92,230,0.12)":"rgba(0,0,0,0.06)", color:paralelo?"#5E5CE6":"#6B7280", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif"}}>
                      {loadingParalelo?"Traduzindo...":paralelo?<><Flag bcp47="pt" size="sm"/> Ocultar PT</>:<><Flag bcp47="pt" size="sm"/> Ler em PT</>}
                    </button>
                  </div>
                  {selWord && (
                    <div style={{background:"#fff", borderRadius:"6px", padding:"14px 16px", marginBottom:"12px", border:"1.5px solid rgba(27,94,43,0.15)", animation:"fadeIn 0.2s ease forwards"}}>
                      {translating
                        ? <div style={{fontSize:"14px", color:"#6B7280"}}>Traduzindo "{selWord}"...</div>
                        : wordTranslation
                          ? <div style={{display:"flex", alignItems:"center", gap:"14px"}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:"18px", fontWeight:800, color:C.green, fontFamily:"Inter, -apple-system, sans-serif"}}>{selWord}</div>
                                <div style={{fontSize:"11px", color:"#6B7280", fontStyle:"italic"}}>{wordTranslation.fonetica} · {wordTranslation.classe}</div>
                                <div style={{fontSize:"15px", fontWeight:700}}>{wordTranslation.traducao_pt}</div>
                              </div>
                              <button onClick={()=>salvarPalavraComNexo({palavra:selWord, traducao_pt:wordTranslation.traducao_pt, fonetica:wordTranslation.fonetica})}
                                disabled={savedWords.has(selWord)||savingWord===selWord}
                                style={{padding:"7px 14px", borderRadius:"10px", border:"none", background:savedWords.has(selWord)?"rgba(27,94,43,0.10)":"linear-gradient(135deg,#E07820,#F09030)", color:savedWords.has(selWord)?"#1B5E2B":"#fff", fontSize:"13px", fontWeight:800, cursor:savedWords.has(selWord)?"default":"pointer", fontFamily:"Inter, -apple-system, sans-serif"}}>
                                {savedWords.has(selWord)?"✓ Salvo":"+ Nexo"}
                              </button>
                            </div>
                          : null
                      }
                    </div>
                  )}
                  <div style={{background:"#fff", borderRadius:"6px", padding:"24px", boxShadow:"0 2px 12px rgba(27,94,43,0.07)"}}>
                    {renderTexto(historiaSelecionada.texto, historiaSelecionada)}
                  </div>
                </>
              )
              : historiasSalvas.length===0
                ? (
                  <div style={{textAlign:"center", padding:"48px 24px", color:"#6B7280"}}>
                    <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
                    <div style={{fontSize:"16px", fontWeight:700, color:"#6B7280", fontFamily:"Inter, -apple-system, sans-serif", marginBottom:"6px"}}>Nenhuma história salva</div>
                    <div style={{fontSize:"14px"}}>Gere uma história e clique em "Salvar história" para guardar aqui.</div>
                  </div>
                )
                : (
                  <div style={{display:"flex", flexDirection:"column" as const, gap:"10px"}}>
                    {historiasSalvas.map(h=>(
                      <div key={h.id} style={{background:"#fff", borderRadius:"6px", padding:"16px 18px", boxShadow:"0 2px 8px rgba(27,94,43,0.06)", display:"flex", alignItems:"center", gap:"14px", cursor:"pointer"}}
                        onClick={()=>{ marcarLida(h.id); setHistoriaSelecionada(h); setSelWord(null); setWordTranslation(null); setParalelo(false); setParagrafosPt([]); setPlaying(false); synth?.cancel(); }}>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px"}}>
                            <span style={{padding:"2px 8px", borderRadius:"8px", background:C.greenLt, color:C.green, fontSize:"11px", fontWeight:700}}>{h.lingua}</span>
                            <span style={{padding:"2px 8px", borderRadius:"8px", background:`${nivelCores[h.nivel]?.bg??"rgba(0,0,0,0.05)"}`, color:`${nivelCores[h.nivel]?.color??"#6B7280"}`, fontSize:"11px", fontWeight:700, textTransform:"capitalize" as const}}>{h.nivel}</span>
                            {!h.lida && <span style={{padding:"2px 8px", borderRadius:"8px", background:"rgba(245,200,0,0.15)", color:"#C06010", fontSize:"11px", fontWeight:700}}>Nova</span>}
                          </div>
                          <div style={{fontSize:"16px", fontWeight:800, color:"#111827", fontFamily:"Inter, -apple-system, sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{h.titulo}</div>
                          <div style={{fontSize:"13px", color:"#6B7280", marginTop:"2px"}}>{h.titulo_pt} · {h.salva_em}</div>
                        </div>
                        <button onClick={e=>{e.stopPropagation(); excluirHistoria(h.id);}}
                          style={{width:30, height:30, borderRadius:"8px", border:"none", background:"rgba(204,42,32,0.07)", color:"#991B1B", fontSize:"16px", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center"}}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )
            }
          </>
        )}
      </div>
    </div>
  );
}

// ── Música ────────────────────────────────────────────────────────────────────

function MusicaTab({ profile }: { profile: UserProfile | null }) {
  const [letra, setLetra]         = useState("");
  const [artista, setArtista]     = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);

  async function handleAnalisar() {
    if (!letra.trim() || !profile) return;
    setLoading(true); setResultado(null);
    try {
      const res = await fetch("/api/chico", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          acao:       "analisar_musica",
          tronco:     profile.tronco,
          interesses: profile.interesses ?? [],
          artista:    artista.trim(),
          letra:      letra.trim(),
        })
      });
      const data = await res.json();
      setResultado(res.ok ? (data.analise ?? "") : "Erro ao analisar. Tente novamente.");
    } catch { setResultado("Erro de conexão."); }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"20px 16px", gap:"14px", overflowY:"auto" }}>
      <div>
        <h2 style={{ margin:"0 0 4px", fontSize:"17px", fontWeight:700, color:"#1D1D1F" }}>Modo Música</h2>
        <p style={{ margin:0, fontSize:"13px", color:"#86868B", lineHeight:1.5 }}>Cole versos de uma música. O Chico analisa linguisticamente, traduz e revela as raízes de cada palavra.</p>
      </div>

      <input value={artista} onChange={e=>setArtista(e.target.value)} placeholder="Artista ou banda (opcional)"
        style={{ width:"100%", padding:"10px 12px", borderRadius:"10px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", color:"#1D1D1F", fontFamily:"Inter, -apple-system, sans-serif", background:"#fff", outline:"none", boxSizing:"border-box" as const }}
        onFocus={e=>(e.target.style.borderColor="#1B5E2B")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>

      <textarea value={letra} onChange={e=>setLetra(e.target.value)}
        placeholder="Cole aqui os versos da música... Ex: La vie en rose / Des yeux qui font baisser les miens"
        rows={7}
        style={{ width:"100%", padding:"13px", borderRadius:"6px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", lineHeight:"1.7", color:"#1D1D1F", fontFamily:"Inter, -apple-system, sans-serif", background:"#fff", resize:"vertical" as const, outline:"none", boxSizing:"border-box" as const }}
        onFocus={e=>(e.target.style.borderColor="#1B5E2B")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>

      <button onClick={handleAnalisar} disabled={!letra.trim()||loading}
        style={{ padding:"13px", borderRadius:"12px", border:"none", background:!letra.trim()||loading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", color:!letra.trim()||loading?"#86868B":"#fff", fontSize:"14px", fontWeight:600, cursor:!letra.trim()||loading?"not-allowed":"pointer", fontFamily:"Inter, -apple-system, sans-serif", boxShadow:!letra.trim()||loading?"none":"0 2px 10px rgba(0,113,227,0.25)" }}>
        {loading ? "O Chico está analisando..." : "Analisar com o Chico"}
      </button>

      {resultado && (
        <div style={{ background:"#FFFFFF", borderRadius:"6px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:700, color:C.green }}>Análise do Chico</div>
              {artista && <div style={{ fontSize:"11px", color:"#86868B", marginTop:"1px" }}>{artista}</div>}
            </div>
            <button onClick={()=>{ navigator.clipboard.writeText(resultado); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.10)", background:copied?"rgba(52,199,89,0.08)":"transparent", color:copied?"#2E7D45":"#86868B", fontSize:"12px", cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
              <Icon.Copy/>{copied?"Copiado!":"Copiar"}
            </button>
          </div>
          <p style={{ margin:0, fontSize:"13px", lineHeight:"1.75", color:"#3A3A3C", whiteSpace:"pre-wrap" }}>{resultado}</p>
        </div>
      )}
    </div>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────────


function PerfilTab({ profile, onProfileUpdate, cards }: {
  profile: UserProfile | null;
  onProfileUpdate: (p: UserProfile) => void;
  cards: MentoriaCard[];
}) {
  const supabase = createSupabase();

  const [troncos, setTroncos]       = useState<("românico"|"germânico")[]>(
    profile?.troncos_selecionados ?? (profile?.tronco ? [profile.tronco] : [])
  );
  const [nome, setNome]             = useState(profile?.display_name ?? "");
  const [interesses, setInteresses] = useState<string[]>(profile?.interesses ?? []);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [confirmLogout, setConfirmLogout]     = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [resetSent, setResetSent]             = useState(false);
  const [sendingReset, setSendingReset]       = useState(false);

  const total  = cards.length;
  const hoje   = new Date(); hoje.setHours(0,0,0,0);
  let streak = 0; let checkDay = new Date(hoje);
  while (true) {
    if (!cards.some(c => new Date(c.criado_em).toDateString() === checkDay.toDateString())) break;
    streak++; checkDay.setDate(checkDay.getDate()-1);
  }

  const INTERESSES_ALL: {id:string; emoji:string}[] = [
    {id:"futebol",emoji:""},{id:"música",emoji:""},{id:"culinária",emoji:""},
    {id:"tecnologia",emoji:""},{id:"viagens",emoji:""},{id:"cinema",emoji:""},
    {id:"literatura",emoji:""},{id:"negócios",emoji:""},{id:"esportes",emoji:""},
    {id:"arte",emoji:""},{id:"jogos",emoji:""},{id:"natureza",emoji:""},
    {id:"história",emoji:""},{id:"ciência",emoji:""},{id:"moda",emoji:""},
    {id:"fotografia",emoji:""},{id:"saúde",emoji:""},{id:"política",emoji:""},
  ];

  const TC = [
    { id:"românico" as const,  label:"Tear Românico",  desc:"ES · FR · IT", flags:["es","fr","it"], color:"#C04018", bg:"#FFF3EE", border:"#FFDDD0" },
    { id:"germânico" as const, label:"Tear Germânico", desc:"EN · DE · NL", flags:["en","de","nl"], color:C.green, bg:"#EEF3FF", border:"#C8D8F8" },
  ];

  function toggleTronco(id:"românico"|"germânico") {
    setTroncos(prev => prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id]);
  }
  function toggleInteresse(id:string) {
    setInteresses(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id]);
  }

  async function handleSave() {
    if (troncos.length===0||!profile) return;
    setSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({
      display_name: nome.trim()||profile.display_name,
      tronco: troncos[0], troncos_selecionados: troncos, interesses,
    }).eq("id",user.id);
    onProfileUpdate({...profile, display_name:nome.trim()||profile.display_name, tronco:troncos[0], troncos_selecionados:troncos, interesses});
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  async function handleResetPassword() {
    setSendingReset(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, { redirectTo:`${window.location.origin}/auth/callback` });
      setResetSent(true);
    }
    setSendingReset(false);
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mentoria_cards").delete().eq("user_id",user.id);
      await supabase.from("user_profiles").delete().eq("id",user.id);
    }
    await supabase.auth.signOut(); window.location.href="/";
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href="/"; }

  const initials = (nome||profile?.display_name||"U")[0].toUpperCase();

  return (
    <div style={{ height:"100%", overflowY:"auto" as const, background:C.bg }}>
      <div style={{ maxWidth:"540px", margin:"0 auto", padding:"28px 20px 60px" }}>

        {/* ── Header ── */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"24px", marginBottom:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"22px", fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"20px", fontWeight:800, color:C.text, letterSpacing:"-0.4px", marginBottom:"3px" }}>
                {nome || profile?.display_name}
              </div>
              <div style={{ fontSize:"12px", color:C.muted }}>
                {troncoLabel} · {profile?.interesses?.slice(0,3).join(", ")}
              </div>
            </div>
          </div>

          {/* Stats inline */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
            {[
              { val: total, lbl: "Nexos", color: C.green },
              { val: streak, lbl: "Dias streak", color: "#B07D00" },
              { val: taxa + "%", lbl: "Acerto", color: C.text },
            ].map((s, i) => (
              <div key={i} style={{ background:C.bg, borderRadius:"6px", padding:"10px 12px", textAlign:"center" as const }}>
                <div style={{ fontSize:"22px", fontWeight:800, color:s.color, letterSpacing:"-1px", lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:"10px", color:C.muted, marginTop:"3px", fontWeight:500 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Nome ── */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"18px 20px", marginBottom:"12px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:C.hint, letterSpacing:".08em", textTransform:"uppercase" as const, marginBottom:"10px" }}>
            Nome de exibição
          </div>
          <input
            value={nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNome(e.target.value)}
            placeholder={profile?.display_name}
            style={{ width:"100%", padding:"9px 12px", borderRadius:"6px", border:`1px solid ${C.border}`, fontSize:"14px", fontWeight:600, color:C.text, fontFamily:"inherit", background:C.bg, outline:"none" }}
          />
        </div>

        {/* ── Tronco ── */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"18px 20px", marginBottom:"12px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:C.hint, letterSpacing:".08em", textTransform:"uppercase" as const, marginBottom:"12px" }}>
            Tronco linguístico
          </div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"8px" }}>
            {TC.map(t => {
              const sel = troncos.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTronco(t.id)}
                  style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 16px", borderRadius:"6px", border:`2px solid ${sel ? t.color : C.border}`, background: sel ? (t.id === "românico" ? "#FDF6E8" : C.greenLt) : C.panel, cursor:"pointer", textAlign:"left" as const, width:"100%" }}>
                  <div style={{ display:"flex", gap:"5px", flexShrink:0 }}>
                    {(t.flags as string[]).map((code: string) => <Flag key={code} bcp47={code} size="md"/>)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:800, color: sel ? t.color : C.text, letterSpacing:"-0.2px" }}>{t.label}</div>
                    <div style={{ fontSize:"11px", color: sel ? t.color : C.muted, marginTop:"2px" }}>{t.desc}</div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel ? t.color : C.border}`, background: sel ? t.color : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Interesses ── */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"18px 20px", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
            <div style={{ fontSize:"10px", fontWeight:700, color:C.hint, letterSpacing:".08em", textTransform:"uppercase" as const }}>
              Interesses
            </div>
            {interesses.length > 0 && (
              <button onClick={() => setInteresses([])} style={{ background:"none", border:"none", fontSize:"11px", color:C.muted, cursor:"pointer" }}>
                Limpar
              </button>
            )}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"7px" }}>
            {INTERESSES_ALL.map(item => {
              const sel = interesses.includes(item.id);
              return (
                <button key={item.id} onClick={() => toggleInteresse(item.id)}
                  style={{ padding:"6px 13px", borderRadius:"5px", border:`1.5px solid ${sel ? C.green : C.border}`, background: sel ? C.greenLt : C.panel, color: sel ? C.green : C.muted, fontSize:"12px", fontWeight: sel ? 700 : 500, cursor:"pointer", letterSpacing:"-0.1px", fontFamily:"inherit" }}>
                  {item.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Salvar ── */}
        <button onClick={handleSave} disabled={troncos.length === 0 || saving}
          style={{ width:"100%", padding:"13px", borderRadius:"6px", border:"none", background: troncos.length === 0 ? C.border : C.green, color: troncos.length === 0 ? C.hint : "#fff", fontSize:"14px", fontWeight:800, cursor: troncos.length === 0 ? "not-allowed" : "pointer", letterSpacing:"-0.1px", marginBottom:"12px" }}>
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
        </button>

        {/* ── Segurança ── */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"18px 20px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:C.hint, letterSpacing:".08em", textTransform:"uppercase" as const, marginBottom:"12px" }}>
            Segurança
          </div>
          <div style={{ fontSize:"12px", color:C.muted, marginBottom:"10px" }}>{user?.email}</div>
          <button onClick={handleResetPassword} disabled={sendingReset}
            style={{ padding:"8px 14px", borderRadius:"5px", border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontSize:"12px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {sendingReset ? "Enviando..." : "Redefinir senha por email"}
          </button>
          {resetSent && (
            <div style={{ marginTop:"8px", fontSize:"12px", color:C.green, fontWeight:600 }}>
              Link enviado! Verifique seu email.
            </div>
          )}
        </div>

      </div>
    </div>
  );
ENDTSX
echo "Lines: $(wc -l < /home/claude/perfil_return.tsx)";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

// ── Exportar Nexos para Anki ─────────────────────────────────────────────────
function exportAnki(cards: MentoriaCard[]) {
  const header = "#separator:tab\n#html:false\n#notetype:Basic\n#deck:Chico Mentor\n";
  const rows = cards.map((c: MentoriaCard) => {
    const frente = (c.titulo_card || c.tema_gerador || "").replace(/\t|\n/g, " ");
    const verso = [
      c.lang_1_nome && c.lang_1_txt && c.lang_1_txt !== "--"
        ? c.lang_1_nome + ": " + c.lang_1_txt + (c.lang_1_fon ? " [" + c.lang_1_fon + "]" : "") : "",
      c.lang_2_nome && c.lang_2_txt && c.lang_2_txt !== "--"
        ? c.lang_2_nome + ": " + c.lang_2_txt + (c.lang_2_fon ? " [" + c.lang_2_fon + "]" : "") : "",
      c.lang_3_nome && c.lang_3_txt && c.lang_3_txt !== "--"
        ? c.lang_3_nome + ": " + c.lang_3_txt + (c.lang_3_fon ? " [" + c.lang_3_fon + "]" : "") : "",
    ].filter(Boolean).join(" | ").replace(/\t|\n/g, " ");
    const notas = (c.aula_chico || "").slice(0, 200).replace(/\t|\n/g, " ");
    return [frente, verso, notas].join("\t");
  }).filter(r => r.trim()).join("\n");

  const blob = new Blob([header + rows], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "chico_nexos_" + new Date().toISOString().slice(0, 10) + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ message: msg, audio }: {
  message: ChatMessage;
  audio: ReturnType<typeof useAudio>;
}) {
  const isUser = msg.role === "user";

  // Loading
  if (msg.isLoading) return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"8px", marginBottom:"4px" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontSize:"13px", fontWeight:800, color:"#fff" }}>C</span>
      </div>
      <div style={{ padding:"12px 16px", borderRadius:"4px 12px 12px 12px", background:C.panel, border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
          {[0,1,2].map((i: number) => (
            <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.green, animation:"typingDot 1.2s ease infinite", animationDelay:`${i*0.2}s` }}/>
          ))}
        </div>
      </div>
    </div>
  );

  // Roteiro
  if (msg.isRoteiro) {
    let roteiroData: any = null;
    try { roteiroData = JSON.parse(msg.content); } catch {}
    if (roteiroData) return (
      <div style={{ display:"flex", alignItems:"flex-start", gap:"8px", marginBottom:"4px" }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:"13px", fontWeight:800, color:"#fff" }}>C</span>
        </div>
        <div style={{ maxWidth:"88%", padding:"12px 14px", borderRadius:"4px 16px 16px 16px", background:"rgba(255,149,0,0.07)", border:"1px solid rgba(255,149,0,0.20)", fontSize:"14px", color:C.text }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:"#FF9500", textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"8px" }}>
            Roteiro de aprendizado
          </div>
          <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"4px" }}>{roteiroData.titulo}</div>
          <div style={{ fontSize:"13px", color:C.muted, marginBottom:"10px" }}>{roteiroData.descricao}</div>
          {(roteiroData.nexos||[]).map((n: any, i: number) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 0", borderTop:i===0?"none":`1px solid ${C.border}` }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:C.green, color:"#fff", fontSize:"10px", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:700, color:C.text }}>{n.palavra}</div>
                <div style={{ fontSize:"11px", color:C.muted }}>{n.motivo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // User bubble
  if (isUser) return (
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"4px" }}>
      <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:"12px 4px 12px 12px", background:C.green, color:"#fff", fontSize:"14px", lineHeight:1.55, fontFamily:"Nunito, sans-serif", wordBreak:"break-word" as const }}>
        {msg.content}
      </div>
    </div>
  );

  // Chico bubble
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"8px", marginBottom:"4px" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontSize:"13px", fontWeight:800, color:"#fff" }}>C</span>
      </div>
      <div style={{ maxWidth:"82%", display:"flex", flexDirection:"column" as const, gap:"6px" }}>
        <div style={{ padding:"10px 14px", borderRadius:"4px 12px 12px 12px", background:C.panel, border:`1px solid ${C.border}`, fontSize:"14px", lineHeight:1.6, color:C.text, fontFamily:"Nunito, sans-serif", wordBreak:"break-word" as const }}>
          {msg.content}
        </div>
        {msg.card && <InlineCard card={msg.card} audio={audio}/>}
      </div>
    </div>
  );
}


function ChicoDashboard() {
  const supabase = createSupabase();
  const audio    = useAudio();

  const [profile, setProfile]               = useState<UserProfile | null>(null);
  const [cards, setCards]                   = useState<MentoriaCard[]>([]);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [inputText, setInputText]           = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [isFetchingCards, setFetchingCards] = useState(true);
  const [sidebarFilter, setSidebarFilter]   = useState<SidebarFilter>("todos");
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeTab, setActiveTab]           = useState<MainTab>("chat");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(false);
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false);
  const [memoria, setMemoria]               = useState<ChicoMemoria>({});
  const [sugestao, setSugestao]             = useState<{titulo:string;mensagem:string;acao:string;palavra_sugerida?:string}|null>(null);
  const [temaRoteiro, setTemaRoteiro]       = useState("");
  const [showRoteiroInput, setShowRoteiroInput] = useState(false);
  const [modoConversa, setModoConversa]         = useState(false);
  const [linguaConversa, setLinguaConversa]     = useState("Espanhol");

  const chatEndRef     = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const chatHistoryRef = useRef<{role:"user"|"assistant";content:string}[]>([]);

  useEffect(()=>{ function check(){ setIsMobile(window.innerWidth<768); } check(); window.addEventListener("resize",check); return ()=>window.removeEventListener("resize",check); },[]);

  useEffect(()=>{
    async function load() {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) { window.location.href="/"; return; }
      const { data:prof } = await supabase.from("user_profiles").select("*").eq("id",user.id).single();
      if (prof) { if(!prof.onboarding_ok){window.location.href="/onboarding";return;} setProfile(prof as UserProfile); }
      const { data:c } = await supabase.from("mentoria_cards").select("*").eq("user_id",user.id).order("criado_em",{ascending:false}).limit(50);
      if (c) setCards(c.filter((x:any)=>!x.tema_gerador?.startsWith("DIÁRIO:")&&!x.tema_gerador?.startsWith("MODO IMERSÃO")) as MentoriaCard[]);
      setFetchingCards(false);

      // Carrega memória persistente
      try {
        const memRes = await fetch("/api/chico?tipo=memoria");
        const memData = await memRes.json();
        if (memData.memoria) setMemoria(memData.memoria);
      } catch {}
    }
    load();
  },[]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(()=>{
    if (profile && messages.length === 0) {
      const troncoLabel = profile.tronco==="românico"?"Tear Românico":"Tear Germânico";
      const hoje = new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
      const paraRevisar = cards.filter((c: MentoriaCard) =>Math.floor((Date.now()-new Date(c.criado_em).getTime())/86400000)>=3).length;
      // ── Desafio diário ───────────────────────────────────────────────────────
      // Usa a data + cards mais antigos para sempre ser diferente e relevante
      const hoje_dia   = new Date().getDate();
      const hoje_mes   = new Date().getMonth();
      const seed       = hoje_dia + hoje_mes * 31;
      const lingua1    = profile.tronco === "germânico" ? "inglês" : "espanhol";
      const lingua2    = profile.tronco === "germânico" ? "alemão" : "francês";

      // Card mais antigo sem revisão recente — base do desafio
      const cardAntigo = cards.length > 0
        ? cards.reduce((oldest, c) => new Date(c.criado_em) < new Date(oldest.criado_em) ? c : oldest)
        : null;

      const interesseArr = profile.interesses || [];
      const interesse  = interesseArr[seed % (interesseArr.length || 1)] ?? "amigo";
      const interesse2 = interesseArr[(seed+1) % (interesseArr.length || 1)] ?? "trabalho";

      const desafios = [
        // Baseado no card mais antigo (reativa memória)
        ...(cardAntigo ? [
          `Você se lembra de "${cardAntigo.titulo_card}"? Como se usa em uma frase em ${lingua1}?`,
          `Qual é a origem da palavra "${cardAntigo.titulo_card}"? Tem algo surpreendente nela?`,
        ] : []),
        // Baseado nos interesses + pilares do Método Chico
        `Tem uma palavra de ${interesse} em ${lingua1} que você acha difícil de pronunciar?`,
        `Como ${interesse} se conecta com o vocabulário de ${lingua2}? Tem raízes em comum?`,
        `Qual a palavra mais estranha que você já aprendeu sobre ${interesse2}?`,
        `Diz uma palavra em ${lingua1} que você ouviu recentemente e quer entender melhor.`,
        `O Chico quer te surpreender: pergunte a origem de qualquer palavra de ${interesse}.`,
        `Me conta: você usou alguma palavra que aprendeu aqui em uma situação real?`,
      ];

      const desafio = desafios[seed % desafios.length];
      // Busca sugestão proativa em background
      fetch("/api/chico", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ acao:"sugestao_proativa", tronco:profile.tronco, interesses:profile.interesses??[], nexos:cards.slice(0,10).map(c=>c.titulo_card||c.tema_gerador), memoria }) })
        .then(r=>r.json()).then(d=>{ if(d.sugestao) setSugestao(d.sugestao); }).catch(()=>{});

      // Saudação baseada no horário
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
      let welcomeContent = `${saudacao}, ${profile.display_name?.split(" ")[0]??""}! Hoje é ${hoje}.\n\nDesafio do dia:\n${desafio}`;
      if (paraRevisar > 0) welcomeContent += `\n\nTem ${paraRevisar} card${paraRevisar>1?"s":""} aguardando revisão. Vale abrir os Flashcards.`;
      setMessages([{ id:"welcome", role:"chico", content:welcomeContent }]);
      chatHistoryRef.current = [{ role:"assistant", content:welcomeContent }];
    }
  },[profile, cards.length]);

  const sendMessage = useCallback(async(text:string)=>{
    if (!text.trim()||isLoading||!profile) return;
    setMessages(prev=>[...prev,
      { id:`u-${Date.now()}`, role:"user" as const, content:text.trim() },
      { id:`l-${Date.now()}`, role:"chico" as const, content:"", isLoading:true },
    ]);
    setInputText(""); setIsLoading(true);
    chatHistoryRef.current = [...chatHistoryRef.current, { role:"user" as const, content:text.trim() }].slice(-8);

    const nexos_recentes = cards.slice(0,10).map(c=>c.titulo_card||c.tema_gerador).filter(Boolean);

    try {
      const res = await fetch("/api/chico",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ tema_gerador:text.trim(), tronco:profile.tronco, interesses:profile.interesses??[], historico:chatHistoryRef.current, nexos_recentes, memoria })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error??"Erro desconhecido");

      // ── Conversa Livre ────────────────────────────────────────────────────
      if (data.conversa_livre) {
        setMessages(prev=>[...prev.filter(m=>!m.isLoading), {
          id: "cl-"+Date.now(), role:"chico" as const,
          content: data.resposta||"",
          isConversaLivre: true,
          correcao: data.correcao||"",
          palavra_destaque: data.palavra_destaque||"",
          traducao_destaque: data.traducao_destaque||"",
          fonetica_destaque: data.fonetica_destaque||"",
          lingua: data.lingua||linguaConversa,
        }]);
        chatHistoryRef.current = [...chatHistoryRef.current, { role:"assistant" as const, content:data.resposta||"" }].slice(-10);
        setIsLoading(false);
        return;
      }

      const savedCard: MentoriaCard = data.card;
      setCards(prev=>[savedCard,...prev]);

      const chicoContent = savedCard.aula_chico;

      // Substitui a mensagem de loading pela resposta + card inline
      setMessages(prev=>prev.map(m=>m.isLoading
        ? { id:`c-${Date.now()}`, role:"chico" as const, content:chicoContent, card:savedCard }
        : m
      ));

      chatHistoryRef.current = [...chatHistoryRef.current, { role:"assistant" as const, content:chicoContent }].slice(-8);

      // Atualiza memória em background a cada 5 nexos
      if (cards.length > 0 && cards.length % 5 === 0) {
        fetch("/api/chico", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ acao:"atualizar_memoria", nexos:cards.map((c: MentoriaCard) =>c.titulo_card||c.tema_gerador), historico:chatHistoryRef.current, memoria_atual:memoria }) })
          .then(r=>r.json()).then(d=>{ if(d.memoria) setMemoria(d.memoria); }).catch(()=>{});
      }

      // Pergunta de verificação separada após 800ms
      if (savedCard.pergunta_verificacao) {
        setTimeout(()=>{
          setMessages(prev=>[...prev, {
            id:`v-${Date.now()}`, role:"chico" as const,
            content:savedCard.pergunta_verificacao!,
            isVerificacao:true,
          }]);
        }, 800);
      }

    } catch(err) {
      setMessages(prev=>prev.map(m=>m.isLoading?{ id:`e-${Date.now()}`, role:"chico" as const, content:`Perdoe-me -- ${(err as Error).message}.` }:m));
    } finally { setIsLoading(false); }
  },[isLoading, profile, cards]);

  async function gerarRoteiro() {
    if (!temaRoteiro.trim()||!profile) return;
    setGerandoRoteiro(true); setShowRoteiroInput(false);
    try {
      const res  = await fetch("/api/chico",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tronco:profile.tronco, interesses:profile.interesses??[], tema:temaRoteiro }) });
      const data = await res.json();
      if (res.ok && data.roteiro) {
        const r = data.roteiro;
        const content = `${r.titulo}\n${r.descricao}\n\n${(r.nexos||[]).map((n:any,i:number)=>`${i+1}. ${n.palavra} -- ${n.motivo}`).join("\n")}\n\nQuer começar? Pergunte sobre "${r.nexos[0]?.palavra}".`;
        setMessages(prev=>[...prev, { id:`r-${Date.now()}`, role:"chico" as const, content, isRoteiro:true }]);
      }
    } catch {}
    setGerandoRoteiro(false); setTemaRoteiro("");
  }

  function handleDeleteCard(id:string) { setCards(prev=>prev.filter(c=>c.id!==id)); }
  function handleSubmit(e:FormEvent){e.preventDefault();sendMessage(inputText);}
  function handleKeyDown(e:React.KeyboardEvent<HTMLTextAreaElement>){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(inputText);}}
  function handleMic(){if(audio.isListening){audio.stopListening();return;}audio.startListening(text=>setInputText(prev=>(prev?`${prev} ${text}`:text).trim()));}

  const filteredCards = cards
    .filter(c=>sidebarFilter==="todos"||c.tronco===sidebarFilter)
    .filter(c=>{ if(!searchQuery.trim())return true; const q=searchQuery.toLowerCase(); return(c.titulo_card||c.tema_gerador).toLowerCase().includes(q)||c.lang_1_txt?.toLowerCase().includes(q)||c.lang_2_txt?.toLowerCase().includes(q)||c.lang_3_txt?.toLowerCase().includes(q); });

  // C definido no nível do módulo

  const NAV_W        = 220;
  const SIDEBAR_W    = 320;
  const TOPBAR_H     = 0;   // No topbar -- Duolingo style has no topbar
  const MOBILE_NAV_H = 68;

  const troncoLabel = profile?.tronco === "românico" ? "Tear Românico" : "Tear Germânico";

  // Nav items

  const navItems: {id:MainTab; label:string; icon:(active:boolean)=>React.ReactElement}[] = [
    { id:"chat",       label:"Conversar",  icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id:"flashcards", label:"Revisar",    icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { id:"progresso",  label:"Progresso",  icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id:"viagem",     label:"Viagem",     icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { id:"praticar",  label:"Praticar",   icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    { id:"musica",     label:"Música",     icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
    { id:"historias",  label:"Histórias",  icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { id:"livros",     label:"Biblioteca", icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { id:"perfil",     label:"Perfil",     icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#1B5E2B":"#9CA3AF"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  // Guard: SSR/prerender safety + loading state
  if (typeof window === "undefined") return null;
  if (!profile) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F4F5F0" }}>
      <div style={{ textAlign:"center" as const }}>
        <div style={{ width:48, height:48, borderRadius:8, background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <div style={{ fontSize:"18px", fontWeight:700, color:C.green, fontFamily:"Inter, -apple-system, sans-serif" }}>Carregando...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-5px);opacity:1;}}
        @keyframes pulse{from{transform:scaleY(.6);}to{transform:scaleY(1.3);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        *{box-sizing:border-box;}body{margin:0;background:#F4F5F0;}
        textarea{resize:none;outline:none;}input{outline:none;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:4px;}
        @media(max-width:768px){
          .desktop-sidebar{display:none!important;}
          .mobile-nav{display:flex!important;}
          .nexo-sidebar-desktop{display:none!important;}
        }
        @media(min-width:769px){
          .mobile-nav{display:none!important;}
        }
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:"Inter, -apple-system, sans-serif", color:C.text, overflow:"hidden" }}>

        {/* ── NAV ESQUERDA estilo Duolingo ── */}
        {!isMobile && (
          <nav style={{ width:NAV_W, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"24px 16px 20px", zIndex:100 }}>
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"32px", paddingLeft:"8px" }}>
              <div style={{ width:38, height:38, borderRadius:"10px", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
              <span style={{ fontSize:"24px", fontWeight:800, color:C.blue, fontFamily:"Inter, -apple-system, sans-serif", letterSpacing:"-0.02em" }}>chico</span>
            </div>

            {/* Nav items */}
            <div style={{ display:"flex", flexDirection:"column", gap:"4px", flex:1 }}>
              {navItems.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={()=>setActiveTab(item.id)}
                    style={{ display:"flex", alignItems:"center", gap:"14px", padding:"13px 16px", borderRadius:"6px", border:"none", background:active?C.blueLight:"transparent", cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.15s", textAlign:"left" as const, width:"100%" }}>
                    {item.icon(active)}
                    <span style={{ fontSize:"15px", fontWeight:active?800:600, color:active?C.green:C.muted }}>{item.label}</span>
                    {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.orange }}/>}
                  </button>
                );
              })}

              {/* Nexos button */}
              <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
              <button onClick={()=>setSidebarOpen(v=>!v)}
                style={{ display:"flex", alignItems:"center", gap:"14px", padding:"13px 16px", borderRadius:"6px", border:"none", background:sidebarOpen?"#FFF3E8":"transparent", cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", transition:"all 0.15s", textAlign:"left" as const, width:"100%" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sidebarOpen?C.orange:C.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span style={{ fontSize:"15px", fontWeight:600, color:sidebarOpen?C.orange:C.textSub }}>Nexos</span>
                {cards.length > 0 && (
                  <span style={{ marginLeft:"auto", padding:"2px 8px", borderRadius:"8px", background:sidebarOpen?C.orange:C.blueLight, color:sidebarOpen?"#fff":C.blue, fontSize:"12px", fontWeight:800 }}>{cards.length}</span>
                )}
              </button>
            </div>

            {/* Tronco badge */}
            {profile?.tronco && (
              <div style={{ padding:"12px 14px", borderRadius:"6px", background:profile.tronco==="românico"?"#FFF3EE":"#EEF3FF", border:`1px solid ${profile.tronco==="românico"?"#FFDDD0":"#C8D8F8"}` }}>
                <div style={{ fontSize:"10px", fontWeight:700, color:profile.tronco==="românico"?"#C04018":"#1B5E2B", letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:"3px" }}>{troncoLabel}</div>
                <div style={{ fontSize:"12px", color:profile.tronco==="românico"?"#C04018":"#1B5E2B", fontWeight:600, opacity:0.8 }}>
                  <>{(profile.tronco==="românico"?["es","fr","it"]:["en","de","nl"]).map((c:string)=><Flag key={c} bcp47={c} size="sm"/>)}</>
                </div>
              </div>
            )}
          </nav>
        )}

        {/* ── CONTEÚDO PRINCIPAL ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", minWidth:0 }}>

          {/* Área de conteúdo */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

            {/* CHAT */}
            {activeTab==="chat" && (
              <>
                {/* Toolbar roteiro */}
                <div style={{ padding:"8px 20px", background:"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                  {!showRoteiroInput ? (<><button onClick={()=>setShowRoteiroInput(true)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"8px", border:`1.5px solid ${C.orange}`, background:C.orangeLight, color:C.orange, fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>Gerar roteiro</button><div style={{ display:"flex", alignItems:"center", gap:"6px" }}><button onClick={()=>{ setModoConversa(v=>!v); }} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"8px", border:`1.5px solid ${modoConversa?"rgba(27,94,43,0.40)":"rgba(0,0,0,0.10)"}`, background:modoConversa?"rgba(27,94,43,0.10)":"transparent", color:modoConversa?"#1B5E2B":"#6A7A9A", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{modoConversa?"Conversa livre ON":"Conversa livre"}</button>{modoConversa&&profile&&(<div style={{ display:"flex", gap:"4px" }}>{(profile.tronco==="germânico"?["Inglês","Alemão","Holandês"]:["Espanhol","Francês","Italiano"]).map((l:string)=>(<button key={l} onClick={()=>setLinguaConversa(l)} style={{ padding:"5px 11px", borderRadius:"8px", border:`1.5px solid ${linguaConversa===l?"rgba(27,94,43,0.40)":"rgba(0,0,0,0.09)"}`, background:linguaConversa===l?"rgba(27,94,43,0.10)":"transparent", color:linguaConversa===l?"#1B5E2B":"#6A7A9A", fontSize:"12px", fontWeight:linguaConversa===l?800:500, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>{l}</button>))}</div>)}</div></>) : (
                    <>
                      <input value={temaRoteiro} onChange={e=>setTemaRoteiro(e.target.value)} placeholder="Tema do roteiro..."
                        style={{ flex:1, padding:"6px 14px", borderRadius:"8px", border:`1.5px solid ${C.orange}`, fontSize:"13px", color:C.text, fontFamily:"Inter, -apple-system, sans-serif", background:"#fff", outline:"none" }}
                        onKeyDown={e=>e.key==="Enter"&&gerarRoteiro()}/>
                      <button onClick={gerarRoteiro} disabled={!temaRoteiro.trim()||gerandoRoteiro}
                        style={{ padding:"6px 16px", borderRadius:"8px", border:"none", background:C.orange, color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                        {gerandoRoteiro?"...":"Gerar"}
                      </button>
                      <button onClick={()=>{setShowRoteiroInput(false);setTemaRoteiro("");}}
                        style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"rgba(0,0,0,0.07)", color:C.textMuted, fontSize:"16px", cursor:"pointer" }}>×</button>
                    </>
                  )}
                </div>

                {/* Banner sugestão */}
                {sugestao && (
                  <div style={{ padding:"10px 20px", background:"linear-gradient(135deg,rgba(94,92,230,0.07),rgba(191,90,242,0.04))", borderBottom:`1px solid rgba(94,92,230,0.12)`, display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"18px", fontWeight:800, color:"#fff", fontFamily:"Inter, -apple-system, sans-serif" }}>C</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"11px", fontWeight:800, color:"#5E5CE6", marginBottom:"1px", letterSpacing:"0.02em" }}>{sugestao.titulo}</div>
                      <div style={{ fontSize:"13px", color:C.textSub }}>{sugestao.mensagem}</div>
                    </div>
                    <div style={{ display:"flex", gap:"6px" }}>
                      {sugestao.palavra_sugerida && (
                        <button onClick={()=>{setInputText(sugestao.palavra_sugerida!);setSugestao(null);}}
                          style={{ padding:"6px 14px", borderRadius:"10px", border:"none", background:"#5E5CE6", color:"#fff", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif" }}>
                          Começar
                        </button>
                      )}
                      <button onClick={()=>setSugestao(null)}
                        style={{ width:24, height:24, borderRadius:"50%", border:"none", background:"rgba(0,0,0,0.07)", color:C.textMuted, fontSize:"14px", cursor:"pointer" }}>×</button>
                    </div>
                  </div>
                )}

                {/* Banner conversa livre */}
                {modoConversa && (
                  <div style={{ padding:"8px 20px", background:"rgba(27,94,43,0.07)", borderBottom:"1px solid rgba(27,94,43,0.15)", display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#1B5E2B" }}/>
                    <span style={{ fontSize:"13px", fontWeight:700, color:"#1B5E2B" }}>Conversa Livre em {linguaConversa}</span>
                    <span style={{ fontSize:"12px", color:"#6A9A7A" }}>-- escreva na língua e o Chico responde. Erros serão corrigidos com discrição.</span>
                  </div>
                )}

                {/* Mensagens */}
                <div style={{ flex:1, overflowY:"auto", padding:isMobile?"12px 14px":"20px 32px 20px 28px", display:"flex", flexDirection:"column", gap:"12px", background:"#F4F5F0" }}>
                  {messages.map(msg=>(
                    <div key={msg.id} style={{ animation:"fadeIn 0.25s ease forwards" }}>
                      <ChatBubble message={msg} audio={audio}/>
                    </div>
                  ))}
                  <div ref={chatEndRef}/>
                </div>

                {audio.isListening && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"7px", background:"rgba(204,42,32,0.05)", borderTop:`1px solid rgba(204,42,32,0.10)` }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, animation:"pulse 0.8s ease-in-out infinite alternate" }}/>
                    <span style={{ fontSize:"12px", color:C.red, fontWeight:600 }}>A ouvir...</span>
                  </div>
                )}

                {/* Input */}
                <div style={{ padding:isMobile?"8px 12px 12px":"12px 28px 16px", background:"rgba(255,255,255,0.95)", backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ display:"flex", gap:"10px", alignItems:"flex-end", background:"#F4F5F0", borderRadius:"8px", padding:"10px 10px 10px 20px", border:`1.5px solid ${C.border}` }}>
                    <textarea ref={textareaRef} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown}
                      {...(modoConversa ? {placeholder:`Escreva em ${linguaConversa}...`} : {placeholder:"Escreva para o Chico..."})} rows={1} disabled={isLoading}
                      style={{ flex:1, border:"none", background:"transparent", fontSize:"15px", lineHeight:"1.4", color:C.text, fontFamily:"Inter, -apple-system, sans-serif", maxHeight:"120px", overflowY:"auto", padding:0 }}/>
                    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                      <button type="button" onClick={handleMic}
                        style={{ width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:audio.isListening?C.red:"rgba(0,0,0,0.06)", transition:"all 0.2s" }}>
                        <Icon.Mic active={audio.isListening}/>
                      </button>
                      <button onClick={()=>sendMessage(inputText)} disabled={!inputText.trim()||isLoading}
                        style={{ width:36, height:36, borderRadius:"50%", border:"none", cursor:!inputText.trim()||isLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:!inputText.trim()||isLoading?"rgba(0,0,0,0.07)":`linear-gradient(135deg,${C.orange},#F09030)`, transition:"all 0.2s", boxShadow:!inputText.trim()||isLoading?"none":"0 2px 10px rgba(224,120,32,0.35)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!inputText.trim()||isLoading?C.textMuted:"#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </div>
                  {!isMobile && <p style={{ margin:"4px 0 0", fontSize:"10px", color:C.textMuted, textAlign:"center" as const }}>Enter para enviar · Shift+Enter para nova linha</p>}
                </div>
              </>
            )}

            {activeTab==="flashcards" && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><FlashcardsTab cards={cards} audio={audio}/></div>}
            {activeTab==="progresso"  && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><ProgressoTab cards={cards}/></div>}
            {activeTab==="praticar"   && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><PraticarTab profile={profile} cards={cards} audio={audio}/></div>}
            {activeTab==="viagem"     && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><ViagemTab profile={profile} audio={audio}/></div>}
            {activeTab==="musica"     && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><MusicaTab profile={profile}/></div>}
            {activeTab==="historias"  && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><HistoriasTab profile={profile} cards={cards} onAddCard={(c: MentoriaCard)=>setCards(prev=>[c,...prev])}/></div>}
            {activeTab==="livros"     && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><LivrosTab profile={profile} cards={cards} audio={audio} onAddCard={(c: MentoriaCard)=>setCards(prev=>[c,...prev])}/></div>}
            {activeTab==="perfil"     && <div style={{ flex:1, overflow:"hidden", background:C.bg }}><PerfilTab profile={profile} onProfileUpdate={setProfile} cards={cards}/></div>}
          </div>

          {/* ── BIBLIOTECA DIREITA ── */}
          {!isMobile && sidebarOpen && (
            <aside style={{ width:SIDEBAR_W, flexShrink:0, background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 16px 10px", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                  <span style={{ fontSize:"16px", fontWeight:800, color:C.blue, fontFamily:"Inter, -apple-system, sans-serif" }}>Meus Nexos</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <span style={{ padding:"2px 10px", borderRadius:"8px", background:C.blueLight, color:C.blue, fontSize:"12px", fontWeight:800 }}>{filteredCards.length}</span>
                    {cards.length > 0 && (
                      <button onClick={()=>exportAnki(cards)} title="Exportar para Anki"
                        style={{ width:28, height:28, borderRadius:"8px", border:"1px solid rgba(27,94,43,0.20)", background:"rgba(27,94,43,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1B5E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 12px", background:"#F4F5F0", borderRadius:"12px", border:`1px solid ${C.border}`, marginBottom:"8px" }}>
                  <Icon.Search size={13} color={C.textMuted}/>
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar nexos..."
                    style={{ flex:1, border:"none", background:"transparent", fontSize:"13px", color:C.text, fontFamily:"Inter, -apple-system, sans-serif" }}/>
                  {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ border:"none", background:"none", cursor:"pointer", color:C.textMuted, fontSize:"15px", padding:0 }}>×</button>}
                </div>
                <div style={{ display:"flex", gap:"4px", padding:"3px", borderRadius:"10px", background:"rgba(0,0,0,0.05)" }}>
                  {(["todos","românico","germânico"] as const).map(f=>(
                    <button key={f} onClick={()=>setSidebarFilter(f)}
                      style={{ flex:1, padding:"5px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:sidebarFilter===f?800:500, background:sidebarFilter===f?C.panel:"transparent", color:sidebarFilter===f?C.text:C.textMuted, boxShadow:sidebarFilter===f?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily:"Inter, -apple-system, sans-serif" }}>
                      {f==="todos"?"Todos":f==="românico"?"Românico":"Germânico"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:"10px" }}>
                {isFetchingCards
                  ? Array.from({length:3}).map((_,i)=><div key={i} style={{ height:110, borderRadius:"6px", background:"#EEF2F8" }}/>)
                  : filteredCards.length===0
                    ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 12px", textAlign:"center", gap:"12px" }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"18px", fontWeight:800, color:"#fff", fontFamily:"Inter, -apple-system, sans-serif" }}>C</div>
                        <p style={{ margin:0, fontSize:"14px", color:C.textSub, fontWeight:600, lineHeight:1.4 }}>
                          {searchQuery ? `Nenhum resultado para "${searchQuery}"` : "Converse com o Chico para criar nexos!"}
                        </p>
                      </div>
                    : filteredCards.map(card=><div key={card.id} style={{ animation:"fadeIn 0.3s ease forwards" }}><NexoCard card={card} audio={audio} onDelete={handleDeleteCard}/></div>)
                }
              </div>
            </aside>
          )}
        </div>

        {/* ── SIDEBAR MOBILE ── */}
        {isMobile && sidebarOpen && (
          <>
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:150 }} onClick={()=>setSidebarOpen(false)}/>
            <aside style={{ position:"fixed", top:0, right:0, bottom:0, width:"82%", maxWidth:320, zIndex:160, background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"20px 16px 16px", boxShadow:"-4px 0 20px rgba(0,0,0,0.10)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <span style={{ fontSize:"17px", fontWeight:800, color:C.blue, fontFamily:"Inter, -apple-system, sans-serif" }}>Meus Nexos</span>
                <button onClick={()=>setSidebarOpen(false)} style={{ border:"none", background:"transparent", cursor:"pointer", fontSize:"20px", color:C.textMuted }}>×</button>
              </div>
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"10px" }}>
                {filteredCards.map(card=><div key={card.id}><NexoCard card={card} audio={audio} onDelete={handleDeleteCard}/></div>)}
              </div>
            </aside>
          </>
        )}

        {/* ── BOTTOM NAV MOBILE ── */}
        {isMobile && (
          <nav className="mobile-nav" style={{ position:"fixed", bottom:0, left:0, right:0, height:MOBILE_NAV_H, background:"rgba(255,255,255,0.96)", backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", zIndex:200, paddingBottom:"env(safe-area-inset-bottom)" }}>
            {navItems.slice(0,5).map(item=>{ const active=activeTab===item.id; return (
              <button key={item.id} onClick={()=>{setActiveTab(item.id);setSidebarOpen(false);}}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", flex:1 }}>
                {item.icon(active)}
                <span style={{ fontSize:"10px", fontWeight:active?800:500, color:active?C.blue:C.textMuted }}>{item.label}</span>
              </button>
            );})}
            <button onClick={()=>setSidebarOpen(v=>!v)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"Inter, -apple-system, sans-serif", flex:1 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sidebarOpen?C.orange:C.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span style={{ fontSize:"10px", fontWeight:sidebarOpen?800:500, color:sidebarOpen?C.orange:C.textMuted }}>Nexos</span>
            </button>
          </nav>
        )}

      </div>
    </>
  );
}

export default ChicoDashboard;
