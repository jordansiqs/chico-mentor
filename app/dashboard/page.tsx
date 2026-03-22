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
  titulo_card?: string;
  lang_1_exemplo?: string;
  lang_2_exemplo?: string;
  lang_3_exemplo?: string;
  pergunta_verificacao?: string;
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

type MainTab       = "chat" | "flashcards" | "progresso" | "viagem" | "musica" | "perfil";
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
  Chat:      ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Cards:     ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>),
  Progress:  ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  Immersion: ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
  Diary:     ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  Settings:  ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Library:   ({ c }: { c: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  Book:      () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  Chevron:   ({ down }: { down: boolean }) => (<svg width="12" height="12" viewBox="0 0 12 12" style={{ transform:down?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><path d="M2 4l4 4 4-4" stroke="#0071E3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Play:      () => (<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0.5 9,5 1,9.5"/></svg>),
  Wave:      () => (<span style={{ display:"flex", gap:"2px", alignItems:"center" }}>{[10,14,8].map((h,i)=><span key={i} style={{ width:3, height:h, background:"currentColor", borderRadius:2, animation:`pulse 0.6s ${i*0.15}s ease-in-out infinite alternate` }}/>)}</span>),
  Mic:       ({ active }: { active: boolean }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#8A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  Send:      ({ active }: { active: boolean }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Search:    ({ size=32, color="#AEAEB2" }: { size?: number; color?: string }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Avatar:    () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  Check:     () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
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

function useAudio() {
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [speakingKey, setSpeakingKey]     = useState<string | null>(null);
  const [isListening, setIsListening]     = useState(false);
  const recognitionRef = useRef<any>(null);

  function speak(text: string, bcp47: string, key?: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = bcp47; utt.rate = 0.88;
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.lang === bcp47) || voices.find(v => v.lang.startsWith(bcp47.split("-")[0]));
    if (best) utt.voice = best;
    const k = key || `${bcp47}-${text.slice(0,10)}`;
    utt.onstart = () => { setIsSpeaking(true); setSpeakingKey(k); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingKey(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingKey(null); };
    window.speechSynthesis.speak(utt);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false); setSpeakingKey(null);
  }

  function startListening(onResult: (text: string) => void) {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Reconhecimento de voz não suportado."); return; }
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

// ── InlineCard — card de traduções exibido no chat ───────────────────────────

function InlineCard({ card, audio }: { card: MentoriaCard; audio: ReturnType<typeof useAudio> }) {
  const [expanded, setExpanded] = useState(false);
  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];
  const isRom = card.tronco === "românico";
  const accent = isRom ? "#FF3B30" : "#0071E3";
  const titulo = card.titulo_card || card.tema_gerador;

  return (
    <div style={{ marginTop:"10px", borderRadius:"16px", background:"#111827", border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
      {/* Header do card */}
      <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:accent, flexShrink:0, display:"block" }}/>
          <span style={{ fontSize:"10px", fontWeight:700, color:accent, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>
            {isRom?"Tear Românico":"Tear Germânico"}
          </span>
        </div>
        <div style={{ fontSize:"16px", fontWeight:700, color:"#F0EDE6" }}>{titulo}</div>
      </div>

      {/* Traduções */}
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:"8px" }}>
        {langs.filter(l => l.txt && l.txt !== "—").map(l => {
          const key = `ic-${l.bcp47}-${l.txt.slice(0,8)}`;
          const isPlaying = audio.isSpeaking && audio.speakingKey === key;
          return (
            <button key={l.bcp47}
              onClick={() => isPlaying ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, key)}
              style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px", borderRadius:"10px", background:isPlaying?"rgba(212,175,55,0.12)":"#1C2537", border:isPlaying?"1px solid rgba(212,175,55,0.30)":"1px solid rgba(255,255,255,0.04)", cursor:"pointer", textAlign:"left" as const, fontFamily:"inherit", transition:"all 0.2s", width:"100%" }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:isPlaying?"#D4AF37":"rgba(212,175,55,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isPlaying?"#fff":"#0071E3", transition:"all 0.2s" }}>
                {isPlaying ? <Icon.Wave/> : <Icon.Volume/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"10px", fontWeight:600, color:isPlaying?"#D4AF37":"#8A8FA8", textTransform:"uppercase" as const, letterSpacing:"0.04em", marginBottom:"1px" }}>{l.nome}</div>
                <div style={{ fontSize:"15px", fontWeight:700, color:isPlaying?"#D4AF37":"#F0EDE6" }}>{l.txt}</div>
                {l.fon && l.fon !== "—" && (
                  <div style={{ fontSize:"11px", color:"#8A8FA8", fontStyle:"italic", marginTop:"1px" }}>{l.fon}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Exemplos expansíveis */}
      <button onClick={() => setExpanded(v => !v)}
        style={{ width:"100%", padding:"8px 14px", background:"none", border:"none", borderTop:"1px solid rgba(0,0,0,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"11px", fontWeight:600, color:"#D4AF37", display:"flex", alignItems:"center", gap:"5px" }}>
          <Icon.Book/>{expanded ? "Ocultar exemplos" : "Ver exemplos de uso"}
        </span>
        <Icon.Chevron down={expanded}/>
      </button>

      {expanded && (
        <div style={{ padding:"10px 14px 12px", display:"flex", flexDirection:"column", gap:"10px", background:"rgba(0,113,227,0.03)" }}>
          {langs.map(l => {
            if (!l.exemplo) return null;
            const key = `ex-${l.bcp47}-${l.exemplo.slice(0,10)}`;
            const isPlaying = audio.isSpeaking && audio.speakingKey === key;
            return (
              <div key={l.bcp47} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                <button onClick={() => isPlaying ? audio.stopSpeaking() : audio.speak(l.exemplo!, l.bcp47, key)}
                  style={{ width:24, height:24, borderRadius:"50%", border:"none", background:isPlaying?"#D4AF37":"rgba(212,175,55,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isPlaying?"#fff":"#0071E3", marginTop:"1px" }}>
                  {isPlaying ? <span style={{ fontSize:"8px" }}>◼</span> : <Icon.Play/>}
                </button>
                <div>
                  <span style={{ fontSize:"12px", color:"#8A8FA8", fontStyle:"italic" }}>{l.exemplo}</span>
                  <span style={{ fontSize:"10px", color:"#4A5068", marginLeft:"6px" }}>— {l.nome}</span>
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

  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];

  const isRom = card.tronco === "românico";
  const accent = isRom ? "#FF3B30" : "#0071E3";
  const titulo = card.titulo_card || card.tema_gerador;
  const diasDesde = Math.floor((Date.now() - new Date(card.criado_em).getTime()) / 86400000);

  async function handleDelete() {
    setDeleting(true);
    try { await fetch(`/api/chico?id=${card.id}`, { method:"DELETE" }); onDelete(card.id); }
    catch { setDeleting(false); setConfirm(false); }
  }

  return (
    <article style={{ background:"#111827", borderRadius:"16px", padding:"16px", border:"1px solid rgba(255,255,255,0.06)"", border:`1px solid ${diasDesde>=3?"rgba(255,149,0,0.25)":"rgba(0,0,0,0.05)"}`, transition:"all 0.2s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(212,175,55,0.12)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.boxShadow="0 1px 3px rgba(0,0,0,0.06)"; }}>

      {diasDesde >= 3 && (
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize:"10px", color:"#FF9500", fontWeight:600 }}>{diasDesde} dias sem revisar</span>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"4px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:accent, flexShrink:0 }}/>
            <span style={{ fontSize:"9px", fontWeight:700, color:accent, textTransform:"uppercase" as const, letterSpacing:"0.04em" }}>{isRom?"Tear Românico":"Tear Germânico"}</span>
          </div>
          <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:"#F0EDE6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{titulo}</h3>
          {titulo !== card.tema_gerador && <p style={{ margin:"2px 0 0", fontSize:"11px", color:"#4A5068", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{card.tema_gerador}</p>}
        </div>
        <div style={{ display:"flex", gap:"4px", marginLeft:"8px", flexShrink:0 }}>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} disabled={deleting} style={{ padding:"4px 10px", borderRadius:"8px", border:"none", background:"#FF3B30", color:"#fff", fontSize:"11px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{deleting?"...":"Apagar"}</button>
              <button onClick={()=>setConfirm(false)} style={{ padding:"4px 8px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.12)", background:"transparent", color:"#8A8FA8", fontSize:"11px", cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </>
          ) : (
            <button onClick={()=>setConfirm(true)}
              style={{ width:26, height:26, borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#4A5068", transition:"all 0.2s" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(255,59,48,0.08)"; (e.currentTarget as HTMLElement).style.color="#FF3B30"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="#AEAEB2"; }}>
              <Icon.Trash/>
            </button>
          )}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"10px" }}>
        {langs.map(l => {
          const key = `side-${l.bcp47}-${l.txt}`;
          const isPlaying = audio.isSpeaking && audio.speakingKey === key;
          return (
            <div key={l.bcp47} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"10px", background:"#1C2537" }}>
              <button onClick={() => isPlaying ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, key)}
                style={{ width:26, height:26, borderRadius:"50%", border:"none", background:isPlaying?"#D4AF37":"rgba(212,175,55,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isPlaying?"#fff":"#0071E3", transition:"all 0.2s" }}>
                {isPlaying ? <Icon.Wave/> : <Icon.Volume/>}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"12px", fontWeight:600, color:"#1D1D1F", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.txt}</div>
                <div style={{ fontSize:"10px", color:"#8A8FA8", fontStyle:"italic" }}>{l.fon}</div>
              </div>
              <span style={{ fontSize:"10px", color:"#4A5068", fontWeight:500, flexShrink:0 }}>{l.nome}</span>
            </div>
          );
        })}
      </div>

      <button onClick={()=>setExpanded(v=>!v)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:"10px", background:expanded?"rgba(212,175,55,0.10)":"#1C2537", transition:"background 0.2s" }}>
          <span style={{ fontSize:"11px", fontWeight:600, color:"#D4AF37", display:"flex", alignItems:"center", gap:"5px" }}><Icon.Book/>Lição</span>
          <Icon.Chevron down={expanded}/>
        </div>
      </button>
      {expanded && <div style={{ marginTop:"6px", padding:"10px", borderRadius:"10px", background:"rgba(212,175,55,0.05)", fontSize:"12px", lineHeight:"1.65", color:"#3A3A3C" }}>{card.aula_chico}</div>}
    </article>
  );
}

// ── ChatMessage ───────────────────────────────────────────────────────────────

function ChatBubble({ message, audio }: { message: ChatMessage; audio: ReturnType<typeof useAudio> }) {
  const isChico = message.role === "chico";

  if (message.isLoading) return (
    <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"4px" }}>
      <div style={{ padding:"10px 14px", borderRadius:"18px 18px 18px 4px", background:"#1C2537", boxShadow:"0 1px 4px rgba(0,0,0,0.20)", display:"flex", gap:"4px", alignItems:"center" }}>
        {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#C7C7CC", animation:`typingDot 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
      </div>
    </div>
  );

  // Verificação — bolha azul sutil
  if (message.isVerificacao) return (
    <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"4px" }}>
      <div style={{ maxWidth:"82%", padding:"10px 14px", borderRadius:"4px 18px 18px 18px", background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.20)", fontSize:"14px", lineHeight:"1.55", color:"#D4AF37" }}>
        {message.content}
      </div>
    </div>
  );

  // Roteiro
  if (message.isRoteiro) return (
    <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"4px" }}>
      <div style={{ maxWidth:"88%", padding:"12px 14px", borderRadius:"4px 18px 18px 18px", background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.20)", fontSize:"14px", lineHeight:"1.6", color:"#1D1D1F" }}>
        <div style={{ fontSize:"10px", fontWeight:700, color:"#FF9500", textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:"6px", display:"flex", alignItems:"center", gap:"4px" }}>
          <Icon.Route/>Roteiro de aprendizado
        </div>
        <div style={{ whiteSpace:"pre-wrap" }}>{message.content}</div>
      </div>
    </div>
  );

  // Mensagem normal do Chico — com card inline se houver
  if (isChico) return (
    <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"4px" }}>
      <div style={{ maxWidth:"82%" }}>
        {/* Texto da resposta */}
        <div style={{ padding:"10px 14px", borderRadius:"4px 18px 18px 18px", background:"#1C2537", boxShadow:"0 1px 4px rgba(0,0,0,0.20)", fontSize:"14px", lineHeight:"1.6", color:"#1D1D1F", whiteSpace:"pre-wrap" }}>
          {message.content}
        </div>
        {/* Card de traduções inline */}
        {message.card && <InlineCard card={message.card} audio={audio}/>}
      </div>
    </div>
  );

  // Mensagem do usuário
  return (
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"4px" }}>
      <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:"18px 4px 18px 18px", background:"linear-gradient(135deg,#1E3A6E,#2E5299)", fontSize:"14px", lineHeight:"1.55", color:"#fff", whiteSpace:"pre-wrap", boxShadow:"0 2px 12px rgba(30,58,110,0.50)" }}>
        {message.content}
      </div>
    </div>
  );
}

// ── Flashcards ────────────────────────────────────────────────────────────────

function FlashcardsTab({ cards, audio }: { cards: MentoriaCard[]; audio: ReturnType<typeof useAudio> }) {
  const [mode, setMode]             = useState<"flip" | "quiz">("flip");
  const [index, setIndex]           = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [score, setScore]           = useState({ acertos:0, erros:0 });
  const [done, setDone]             = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizOpts, setQuizOpts]     = useState<string[]>([]);
  const [quizLang, setQuizLang]     = useState<0|1|2>(0); // índice da língua aleatória do quiz
  const shuffled                    = useRef<MentoriaCard[]>([]);

  useEffect(() => { doRestart(); }, [cards.length]);

  useEffect(() => {
    if (mode !== "quiz" || quizAnswer !== null || shuffled.current.length === 0) return;
    const c = shuffled.current[index];
    if (!c) return;

    // Escolhe língua aleatória para esta pergunta
    const langIdx = Math.floor(Math.random() * 3) as 0|1|2;
    setQuizLang(langIdx);

    const langTxts: [string,string,string] = [c.lang_1_txt, c.lang_2_txt, c.lang_3_txt];
    const correct = langTxts[langIdx];

    // Coleta opções erradas de TODAS as línguas de outros cards para garantir 3 opções
    const allOtherTxts: string[] = [];
    cards.forEach(x => {
      if (x.id !== c.id) {
        allOtherTxts.push(x.lang_1_txt, x.lang_2_txt, x.lang_3_txt);
      }
    });
    const filtered = [...new Set(allOtherTxts.filter(t => t && t !== correct && t !== "—"))];
    const wrongs   = filtered.sort(() => Math.random() - 0.5).slice(0, 3);
    // Se ainda faltar opções, usa traduções das outras línguas do mesmo card
    if (wrongs.length < 3) {
      langTxts.forEach((t, i) => { if (i !== langIdx && t && t !== correct && !wrongs.includes(t)) wrongs.push(t); });
    }
    // Fallback final
    while (wrongs.length < 3) wrongs.push(`Opção ${wrongs.length + 1}`);

    setQuizOpts([...wrongs.slice(0,3), correct].sort(() => Math.random() - 0.5));
  }, [index, mode, quizAnswer, cards.length]);

  function doRestart() {
    const urgentes = cards.filter(c => Math.floor((Date.now()-new Date(c.criado_em).getTime())/86400000)>=3);
    const pool = urgentes.length > 0
      ? [...urgentes, ...cards.filter(c=>!urgentes.includes(c))].slice(0,10)
      : [...cards].sort(()=>Math.random()-0.5).slice(0,10);
    shuffled.current = pool;
    setIndex(0); setFlipped(false); setScore({acertos:0,erros:0});
    setDone(false); setQuizAnswer(null); setQuizOpts([]); setQuizLang(0);
  }

  function next(ok: boolean) {
    setScore(s=>({acertos:s.acertos+(ok?1:0),erros:s.erros+(ok?0:1)}));
    if (index+1>=shuffled.current.length){setDone(true);return;}
    setIndex(i=>i+1); setFlipped(false); setQuizAnswer(null); setQuizOpts([]); setQuizLang(0);
  }

  const urgentesCount = cards.filter(c=>Math.floor((Date.now()-new Date(c.criado_em).getTime())/86400000)>=3).length;

  if (cards.length===0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"12px", padding:"40px", textAlign:"center" }}>
      <Icon.Search size={32}/><p style={{ fontSize:"15px", fontWeight:600, color:"#1D1D1F", margin:0 }}>Nenhum nexo para revisar</p>
      <p style={{ fontSize:"13px", color:"#8A8FA8", margin:0 }}>Converse com o Chico primeiro.</p>
    </div>
  );

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"20px", padding:"40px", textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:"18px", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div><h3 style={{ fontSize:"20px", fontWeight:700, color:"#F0EDE6", margin:"0 0 6px" }}>Sessão concluída</h3><p style={{ fontSize:"13px", color:"#8A8FA8", margin:0 }}>{shuffled.current.length} cards</p></div>
      <div style={{ display:"flex", gap:"28px" }}>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"32px", fontWeight:700, color:"#34C759" }}>{score.acertos}</div><div style={{ fontSize:"12px", color:"#8A8FA8" }}>Acertos</div></div>
        <div style={{ width:1, background:"rgba(0,0,0,0.08)" }}/>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"32px", fontWeight:700, color:"#FF3B30" }}>{score.erros}</div><div style={{ fontSize:"12px", color:"#8A8FA8" }}>Erros</div></div>
      </div>
      <button onClick={doRestart} style={{ padding:"12px 28px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#0071E3,#0077ED)", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Revisar novamente</button>
    </div>
  );

  const card = shuffled.current[index];
  if (!card) return null;

  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];
  const quizLangNome = langs[quizLang]?.nome ?? langs[0].nome;
  const quizCorrect  = langs[quizLang]?.txt  ?? langs[0].txt;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"16px", gap:"14px", height:"100%", overflowY:"auto" }}>
      {urgentesCount>0&&(
        <div style={{ width:"100%", maxWidth:"500px", padding:"10px 14px", borderRadius:"10px", background:"rgba(255,149,0,0.08)", border:"1px solid rgba(255,149,0,0.25)", display:"flex", alignItems:"center", gap:"8px" }}>
          <Icon.Fire/><span style={{ fontSize:"12px", color:"#FF9500", fontWeight:600 }}>{urgentesCount} card{urgentesCount>1?"s":""} priorizados nesta sessão</span>
        </div>
      )}
      <div style={{ display:"flex", gap:"6px", padding:"3px", borderRadius:"10px", background:"rgba(0,0,0,0.06)", width:"100%", maxWidth:"500px" }}>
        {(["flip","quiz"] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);doRestart();}} style={{ flex:1, padding:"6px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:mode===m?600:500, background:mode===m?"#fff":"transparent", color:mode===m?"#1D1D1F":"#8A8FA8", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.10)":"none", fontFamily:"inherit" }}>
            {m==="flip"?"Virar Card":"Quiz"}
          </button>
        ))}
      </div>
      <div style={{ width:"100%", maxWidth:"500px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
          <span style={{ fontSize:"12px", color:"#8A8FA8" }}>{index+1} de {shuffled.current.length}</span>
          <div style={{ display:"flex", gap:"12px" }}>
            <span style={{ fontSize:"12px", color:"#34C759", fontWeight:600, display:"flex", alignItems:"center", gap:"3px" }}><Icon.Check/>{score.acertos}</span>
            <span style={{ fontSize:"12px", color:"#FF3B30", fontWeight:600, display:"flex", alignItems:"center", gap:"3px" }}><Icon.X/>{score.erros}</span>
          </div>
        </div>
        <div style={{ height:4, borderRadius:4, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#0071E3,#34AADC)", width:`${(index/shuffled.current.length)*100}%`, transition:"width 0.3s ease" }}/>
        </div>
      </div>
      {mode==="flip"&&(
        <>
          {/* Frente — clique vira o card */}
          {!flipped ? (
            <div onClick={()=>setFlipped(true)}
              style={{ width:"100%", maxWidth:"500px", minHeight:"190px", borderRadius:"20px", background:"#111827", boxShadow:"0 4px 24px rgba(0,0,0,0.40)", padding:"24px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px", border:"1.5px solid rgba(0,0,0,0.06)", transition:"transform 0.15s" }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform="scale(1.01)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform="scale(1)"}>
              <span style={{ fontSize:"10px", color:"#8A8FA8", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Em Português</span>
              <p style={{ fontSize:"22px", fontWeight:700, color:"#F0EDE6", textAlign:"center", margin:0 }}>{card.titulo_card||card.tema_gerador}</p>
              <span style={{ fontSize:"11px", color:"#4A5068" }}>Toque para ver as traduções</span>
            </div>
          ) : (
            /* Verso — cada língua é clicável para ouvir */
            <div style={{ width:"100%", maxWidth:"500px", borderRadius:"20px", background:"#111827", boxShadow:"0 4px 24px rgba(0,0,0,0.40)", padding:"20px", border:"1.5px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize:"10px", color:"#D4AF37", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em", display:"block", marginBottom:"12px", textAlign:"center" as const }}>
                Toque numa língua para ouvir
              </span>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {langs.map(l => {
                  const fkey = "fl-" + l.bcp47 + l.txt.slice(0,8);
                  const isPlay = audio.isSpeaking && audio.speakingKey === fkey;
                  return (
                    <button key={l.bcp47}
                      onClick={e => { e.stopPropagation(); isPlay ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, fkey); }}
                      style={{ width:"100%", borderRadius:"12px", background:isPlay?"rgba(212,175,55,0.10)":"#1C2537", border:isPlay?"1.5px solid rgba(212,175,55,0.40)":"1.5px solid rgba(255,255,255,0.04)", cursor:"pointer", padding:0, overflow:"hidden", fontFamily:"inherit", transition:"all 0.2s", textAlign:"left" as const }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px" }}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:isPlay?"#D4AF37":"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isPlay?"#fff":"#0071E3", transition:"all 0.2s" }}>
                          {isPlay ? <Icon.Wave/> : <Icon.Volume/>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:"10px", fontWeight:600, color:isPlay?"#D4AF37":"#8A8FA8", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:"2px" }}>{l.nome}</div>
                          <div style={{ fontSize:"16px", fontWeight:700, color:isPlay?"#D4AF37":"#F0EDE6" }}>{l.txt}</div>
                          <div style={{ fontSize:"12px", color:"#8A8FA8", fontStyle:"italic", marginTop:"2px" }}>{l.fon}</div>
                        </div>
                      </div>
                      {l.exemplo&&(
                        <div style={{ padding:"5px 14px 9px 58px", borderTop:"1px solid rgba(0,0,0,0.05)", fontSize:"11px", color:"#8A8FA8", fontStyle:"italic", lineHeight:1.5 }}>
                          {l.exemplo}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={()=>setFlipped(false)}
                style={{ width:"100%", marginTop:"10px", padding:"6px", background:"none", border:"none", cursor:"pointer", fontSize:"11px", color:"#4A5068", fontFamily:"inherit" }}>
                Virar de volta
              </button>
            </div>
          )}
          {/* Botões Acertei/Errei só aparecem quando virado */}
          {flipped
            ? <div style={{ display:"flex", gap:"12px", width:"100%", maxWidth:"500px" }}>
                <button onClick={()=>next(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(224,85,85,0.25)", background:"rgba(224,85,85,0.08)", color:"#E05555", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><Icon.X/>Errei</button>
                <button onClick={()=>next(true)}  style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(77,184,122,0.25)", background:"rgba(77,184,122,0.08)", color:"#4DB87A", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><Icon.Check/>Acertei</button>
              </div>
            : <p style={{ fontSize:"12px", color:"#4A5068", margin:0 }}>Tente lembrar antes de tocar no card</p>
          }
        </>
      )}
      {mode==="quiz"&&(
        <>
          {/* Pergunta */}
          <div style={{ width:"100%", maxWidth:"500px", borderRadius:"20px", background:"#111827", boxShadow:"0 4px 24px rgba(0,0,0,0.40)", padding:"24px", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin:"0 0 6px", fontSize:"11px", color:"#8A8FA8", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Como se diz em {quizLangNome}?</p>
            <p style={{ margin:0, fontSize:"20px", fontWeight:700, color:"#F0EDE6" }}>{card.titulo_card||card.tema_gerador}</p>
          </div>

          {/* Opções — após responder, a correta ganha botão de áudio */}
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"500px" }}>
            {quizOpts.length===0
              ? <p style={{ textAlign:"center", color:"#8A8FA8", fontSize:"13px" }}>Carregando...</p>
              : quizOpts.map((opt,i)=>{
                  const isCorrect  = opt === quizCorrect;
                  const isSelected = quizAnswer === i;
                  const answered   = quizAnswer !== null;

                  let bg = "#fff", borderColor = "rgba(0,0,0,0.10)", textColor = "#1D1D1F";
                  if (answered) {
                    if (isCorrect)       { bg="rgba(52,199,89,0.08)"; borderColor="#34C759"; textColor="#34C759"; }
                    else if (isSelected) { bg="rgba(255,59,48,0.08)"; borderColor="#FF3B30"; textColor="#FF3B30"; }
                  }

                  // Fonética da opção correta (busca no langs)
                  const langFon = isCorrect ? (langs[quizLang]?.fon ?? "") : "";
                  const qkey    = "quiz-" + i + opt.slice(0,8);
                  const isPlay  = audio.isSpeaking && audio.speakingKey === qkey;

                  return (
                    <button key={i} disabled={answered && !isCorrect}
                      onClick={() => {
                        if (!answered) {
                          setQuizAnswer(i);
                          // Pronuncia automaticamente a resposta correta após 400ms
                          if (isCorrect) setTimeout(() => audio.speak(opt, langs[quizLang]?.bcp47 ?? "pt-BR", qkey), 400);
                          setTimeout(() => next(isCorrect), 1200);
                        } else if (isCorrect) {
                          // Permite ouvir de novo clicando na correta
                          isPlay ? audio.stopSpeaking() : audio.speak(opt, langs[quizLang]?.bcp47 ?? "pt-BR", qkey);
                        }
                      }}
                      style={{ width:"100%", padding:"14px 16px", borderRadius:"12px", border:`1.5px solid ${borderColor}`, background:bg, color:textColor, fontSize:"14px", fontWeight:isCorrect&&answered?700:500, cursor:answered&&!isCorrect?"default":"pointer", fontFamily:"inherit", textAlign:"left" as const, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px" }}>
                      <div>
                        <div>{opt}</div>
                        {/* Mostra fonética da correta após responder */}
                        {isCorrect && answered && langFon && (
                          <div style={{ fontSize:"11px", fontStyle:"italic", color:"#34C759", marginTop:"3px", fontWeight:400 }}>{langFon}</div>
                        )}
                      </div>
                      {/* Ícone de áudio na opção correta após responder */}
                      {isCorrect && answered && (
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(52,199,89,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#34C759" }}>
                          {isPlay ? <Icon.Wave/> : <Icon.Volume/>}
                        </div>
                      )}
                    </button>
                  );
                })
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── Progresso ─────────────────────────────────────────────────────────────────

function ProgressoTab({ cards }: { cards: MentoriaCard[] }) {
  const total=cards.length, romanicos=cards.filter(c=>c.tronco==="românico").length, germanicos=cards.filter(c=>c.tronco==="germânico").length;
  const hoje=new Date();hoje.setHours(0,0,0,0);
  let streak=0,checkDay=new Date(hoje);
  while(true){const d=checkDay.toDateString();const h=cards.some(c=>new Date(c.criado_em).toDateString()===d);if(!h)break;streak++;checkDay.setDate(checkDay.getDate()-1);}
  const paraRevisar=cards.filter(c=>Math.floor((Date.now()-new Date(c.criado_em).getTime())/86400000)>=3).length;
  const diasUnicos=[...new Set(cards.map(c=>new Date(c.criado_em).toDateString()))].length;
  const ultimos7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return{label:d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""),count:cards.filter(c=>new Date(c.criado_em).toDateString()===d.toDateString()).length,isToday:i===6};});
  const maxCount=Math.max(...ultimos7.map(d=>d.count),1);
  const langCount:Record<string,number>={};
  cards.forEach(c=>{[c.lang_1_nome,c.lang_2_nome,c.lang_3_nome].forEach(l=>{langCount[l]=(langCount[l]||0)+1;});});
  const topLangs=Object.entries(langCount).sort((a,b)=>b[1]-a[1]),maxLang=topLangs[0]?.[1]||1;
  const badges=[
    {label:"Primeiro Nexo",unlocked:total>=1,desc:"1º nexo"},
    {label:"10 Nexos",unlocked:total>=10,desc:"10 nexos"},
    {label:"50 Nexos",unlocked:total>=50,desc:"50 nexos"},
    {label:"3 Dias",unlocked:streak>=3,desc:"3 consecutivos"},
    {label:"7 Dias",unlocked:streak>=7,desc:"7 consecutivos"},
    {label:"Bilíngue",unlocked:romanicos>0&&germanicos>0,desc:"2 troncos"},
  ];
  function exportTxt(){const l=cards.map(c=>`${c.titulo_card||c.tema_gerador}\n${c.lang_1_nome}: ${c.lang_1_txt} [${c.lang_1_fon}]\n${c.lang_2_nome}: ${c.lang_2_txt} [${c.lang_2_fon}]\n${c.lang_3_nome}: ${c.lang_3_txt} [${c.lang_3_fon}]\n---`).join("\n\n");const b=new Blob([`CHICO MENTOR\n\n${l}`],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="chico-nexos.txt";a.click();}
  return(
    <div style={{padding:"20px 16px",overflowY:"auto",height:"100%",display:"flex",flexDirection:"column",gap:"14px"}}>
      {streak>0&&<div style={{background:"linear-gradient(135deg,#FF9500,#FF6B00)",borderRadius:"16px",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.8)",marginBottom:"2px"}}>Sequência atual</div><div style={{fontSize:"28px",fontWeight:700,color:"#fff"}}>{streak} {streak===1?"dia":"dias"} seguidos</div></div><Icon.Fire/></div>}
      {paraRevisar>0&&<div style={{background:"rgba(255,149,0,0.08)",borderRadius:"14px",padding:"14px 16px",border:"1px solid rgba(255,149,0,0.25)",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:"12px",fontWeight:700,color:"#FF9500"}}>{paraRevisar} card{paraRevisar>1?"s":""} para revisar</div><div style={{fontSize:"11px",color:"#8A8FA8",marginTop:"2px"}}>Não vistos há 3+ dias</div></div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
        {[{value:total,label:"Nexos",color:"#D4AF37"},{value:diasUnicos,label:"Dias ativos",color:"#FF9500"},{value:total*3,label:"Traduções",color:"#34C759"}].map(s=>(
          <div key={s.label} style={{background:"#fff",borderRadius:"14px",padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",textAlign:"center"}}><div style={{fontSize:"26px",fontWeight:700,color:s.color}}>{s.value}</div><div style={{fontSize:"11px",color:"#8A8FA8",fontWeight:500,marginTop:"2px"}}>{s.label}</div></div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:"16px",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <h3 style={{margin:"0 0 14px",fontSize:"13px",fontWeight:700,color:"#1D1D1F"}}>Últimos 7 dias</h3>
        <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"64px"}}>
          {ultimos7.map(d=>(
            <div key={d.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"5px",height:"100%",justifyContent:"flex-end"}}>
              <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:d.count>0?(d.isToday?"linear-gradient(180deg,#FF9500,#FF6B00)":"linear-gradient(180deg,#0071E3,#34AADC)"):"#F0F0F0",height:`${Math.max((d.count/maxCount)*44,d.count>0?6:3)}px`,transition:"height 0.4s ease"}}/>
              <span style={{fontSize:"9px",color:d.isToday?"#0071E3":"#8A8FA8",fontWeight:d.isToday?700:400,textTransform:"capitalize" as const}}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:"16px",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <h3 style={{margin:"0 0 12px",fontSize:"13px",fontWeight:700,color:"#1D1D1F"}}>Por tronco</h3>
        {[{label:"Tear Românico",count:romanicos,color:"#FF3B30"},{label:"Tear Germânico",count:germanicos,color:"#D4AF37"}].map(t=>(
          <div key={t.label} style={{marginBottom:"10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontSize:"12px",fontWeight:500,color:"#3A3A3C"}}>{t.label}</span><span style={{fontSize:"12px",fontWeight:600,color:t.color}}>{t.count}</span></div>
            <div style={{height:5,borderRadius:5,background:"rgba(0,0,0,0.06)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,background:t.color,width:`${total>0?(t.count/total)*100:0}%`,transition:"width 0.5s ease"}}/></div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:"16px",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <h3 style={{margin:"0 0 14px",fontSize:"13px",fontWeight:700,color:"#1D1D1F"}}>Conquistas</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
          {badges.map(b=>(
            <div key={b.label} style={{padding:"12px 8px",borderRadius:"12px",background:b.unlocked?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${b.unlocked?"rgba(212,175,55,0.25)":"rgba(255,255,255,0.04)"}`,textAlign:"center",opacity:b.unlocked?1:0.5}}>
              <div style={{fontSize:"18px",marginBottom:"5px"}}>{b.unlocked?"⭐":"🔒"}</div>
              <div style={{fontSize:"11px",fontWeight:600,color:b.unlocked?"#D4AF37":"#4A5068",lineHeight:1.3}}>{b.label}</div>
              <div style={{fontSize:"10px",color:"#4A5068",marginTop:"2px"}}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {topLangs.length>0&&<div style={{background:"#fff",borderRadius:"16px",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <h3 style={{margin:"0 0 12px",fontSize:"13px",fontWeight:700,color:"#1D1D1F"}}>Top línguas</h3>
        {topLangs.map(([lang,count])=>(
          <div key={lang} style={{marginBottom:"10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontSize:"12px",fontWeight:500,color:"#3A3A3C"}}>{lang}</span><span style={{fontSize:"12px",fontWeight:600,color:"#D4AF37"}}>{count}x</span></div>
            <div style={{height:5,borderRadius:5,background:"rgba(0,0,0,0.06)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,background:"linear-gradient(90deg,#0071E3,#34AADC)",width:`${(count/maxLang)*100}%`,transition:"width 0.5s ease"}}/></div>
          </div>
        ))}
      </div>}
      <button onClick={exportTxt} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"13px",borderRadius:"12px",border:"1.5px solid rgba(0,113,227,0.25)",background:"rgba(0,113,227,0.05)",color:"#D4AF37",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
        <Icon.Download/>Exportar ({total} nexos)
      </button>
    </div>
  );
}

// ── Imersão ───────────────────────────────────────────────────────────────────

// ── Viagem ────────────────────────────────────────────────────────────────────

function ViagemTab({ profile, audio }: { profile: UserProfile | null; audio: ReturnType<typeof useAudio> }) {
  const [destino, setDestino]     = useState("");
  const [guia, setGuia]           = useState<any>(null);
  const [troncoInfo, setTroncoInfo] = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);

  async function handleGerar() {
    if (!destino.trim() || !profile) return;
    setLoading(true); setGuia(null);
    try {
      const res  = await fetch("/api/chico", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ acao:"viagem", tronco:profile.tronco, destino:destino.trim() }) });
      const data = await res.json();
      if (res.ok) { setGuia(data.viagem); setTroncoInfo(data.troncoInfo||[]); }
    } catch {}
    setLoading(false);
  }

  const langNomes = troncoInfo.map((l:any) => l.nome);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"20px 16px", gap:"14px", overflowY:"auto" }}>
      <div>
        <h2 style={{ margin:"0 0 4px", fontSize:"17px", fontWeight:700, color:"#F0EDE6" }}>Modo Viagem</h2>
        <p style={{ margin:0, fontSize:"13px", color:"#8A8FA8", lineHeight:1.5 }}>Digite um destino e o Chico cria um guia de sobrevivência linguística para a sua viagem.</p>
      </div>

      <div style={{ display:"flex", gap:"8px" }}>
        <input value={destino} onChange={e=>setDestino(e.target.value)} placeholder="Ex: Buenos Aires, Paris, Roma..."
          style={{ flex:1, padding:"12px 14px", borderRadius:"12px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", color:"#1D1D1F", fontFamily:"inherit", background:"#fff", outline:"none" }}
          onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}
          onKeyDown={e=>e.key==="Enter"&&handleGerar()}/>
        <button onClick={handleGerar} disabled={!destino.trim()||loading}
          style={{ padding:"12px 20px", borderRadius:"12px", border:"none", background:!destino.trim()||loading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", color:!destino.trim()||loading?"#8A8FA8":"#fff", fontSize:"14px", fontWeight:600, cursor:!destino.trim()||loading?"not-allowed":"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const }}>
          {loading?"Gerando...":"Gerar guia"}
        </button>
      </div>

      {guia && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {/* Dica cultural */}
          <div style={{ padding:"14px 16px", borderRadius:"14px", background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.20)" }}>
            <div style={{ fontSize:"10px", fontWeight:700, color:"#D4AF37", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:"5px" }}>Dica cultural</div>
            <p style={{ margin:0, fontSize:"13px", color:"#F0EDE6", lineHeight:1.6 }}>{guia.dica_cultural}</p>
          </div>

          {/* Palavras essenciais */}
          <h3 style={{ margin:"4px 0 0", fontSize:"14px", fontWeight:700, color:"#1D1D1F" }}>Palavras essenciais para {guia.destino}</h3>
          {(guia.palavras||[]).map((p: any, i: number) => (
            <div key={i} style={{ background:"#fff", borderRadius:"14px", padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                <div>
                  <div style={{ fontSize:"15px", fontWeight:700, color:"#F0EDE6" }}>{p.pt}</div>
                  <div style={{ fontSize:"11px", color:"#8A8FA8", marginTop:"2px" }}>{p.contexto}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                {[
                  { txt:p.lang_1, fon:p.fon_1, nome:langNomes[0]||"Língua 1", bcp47:troncoInfo[0]?.bcp47||"es-ES" },
                  { txt:p.lang_2, fon:p.fon_2, nome:langNomes[1]||"Língua 2", bcp47:troncoInfo[1]?.bcp47||"fr-FR" },
                  { txt:p.lang_3, fon:p.fon_3, nome:langNomes[2]||"Língua 3", bcp47:troncoInfo[2]?.bcp47||"it-IT" },
                ].map((l, li) => {
                  const vkey = "v-" + i + "-" + li + l.txt.slice(0,5);
                  const isPlay = audio.isSpeaking && audio.speakingKey === vkey;
                  return (
                    <button key={li} onClick={() => isPlay ? audio.stopSpeaking() : audio.speak(l.txt, l.bcp47, vkey)}
                      style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"10px", background:isPlay?"rgba(212,175,55,0.10)":"#1C2537", border:isPlay?"1.5px solid rgba(0,113,227,0.20)":"1.5px solid transparent", cursor:"pointer", textAlign:"left" as const, fontFamily:"inherit", transition:"all 0.2s" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:isPlay?"#D4AF37":"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isPlay?"#fff":"#0071E3" }}>
                        {isPlay ? <Icon.Wave/> : <Icon.Volume/>}
                      </div>
                      <div>
                        <div style={{ fontSize:"11px", fontWeight:600, color:isPlay?"#D4AF37":"#8A8FA8", textTransform:"uppercase" as const, letterSpacing:"0.04em" }}>{l.nome}</div>
                        <div style={{ fontSize:"14px", fontWeight:600, color:isPlay?"#D4AF37":"#F0EDE6" }}>{l.txt}</div>
                        <div style={{ fontSize:"11px", color:"#8A8FA8", fontStyle:"italic" }}>{l.fon}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
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
        <h2 style={{ margin:"0 0 4px", fontSize:"17px", fontWeight:700, color:"#F0EDE6" }}>Modo Música</h2>
        <p style={{ margin:0, fontSize:"13px", color:"#8A8FA8", lineHeight:1.5 }}>Cole versos de uma música. O Chico analisa linguisticamente, traduz e revela as raízes de cada palavra.</p>
      </div>

      <input value={artista} onChange={e=>setArtista(e.target.value)} placeholder="Artista ou banda (opcional)"
        style={{ width:"100%", padding:"10px 12px", borderRadius:"10px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", color:"#1D1D1F", fontFamily:"inherit", background:"#fff", outline:"none", boxSizing:"border-box" as const, colorScheme:"dark" as const }}
        onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>

      <textarea value={letra} onChange={e=>setLetra(e.target.value)}
        placeholder="Cole aqui os versos da música... Ex: La vie en rose / Des yeux qui font baisser les miens"
        rows={7}
        style={{ width:"100%", padding:"13px", borderRadius:"14px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", lineHeight:"1.7", color:"#1D1D1F", fontFamily:"inherit", background:"#fff", resize:"vertical" as const, outline:"none", boxSizing:"border-box" as const, colorScheme:"dark" as const }}
        onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>

      <button onClick={handleAnalisar} disabled={!letra.trim()||loading}
        style={{ padding:"13px", borderRadius:"12px", border:"none", background:!letra.trim()||loading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", color:!letra.trim()||loading?"#8A8FA8":"#fff", fontSize:"14px", fontWeight:600, cursor:!letra.trim()||loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:!letra.trim()||loading?"none":"0 2px 10px rgba(0,113,227,0.25)" }}>
        {loading ? "O Chico está analisando..." : "Analisar com o Chico"}
      </button>

      {resultado && (
        <div style={{ background:"#111827", borderRadius:"16px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)", border:"1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#D4AF37" }}>Análise do Chico</div>
              {artista && <div style={{ fontSize:"11px", color:"#8A8FA8", marginTop:"1px" }}>{artista}</div>}
            </div>
            <button onClick={()=>{ navigator.clipboard.writeText(resultado); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.10)", background:copied?"rgba(52,199,89,0.08)":"transparent", color:copied?"#34C759":"#8A8FA8", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              <Icon.Copy/>{copied?"Copiado!":"Copiar"}
            </button>
          </div>
          <p style={{ margin:0, fontSize:"13px", lineHeight:"1.75", color:"#B0AEBA", whiteSpace:"pre-wrap" }}>{resultado}</p>
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

  const [troncos, setTroncos]           = useState<("românico"|"germânico")[]>(
    profile?.troncos_selecionados ?? (profile?.tronco ? [profile.tronco] : [])
  );
  const [nome, setNome]                 = useState(profile?.display_name ?? "");
  const [interesses, setInteresses]     = useState<string[]>(profile?.interesses ?? []);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [confirmLogout, setConfirmLogout]     = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [resetSent, setResetSent]             = useState(false);
  const [sendingReset, setSendingReset]       = useState(false);

  // Estatísticas
  const total       = cards.length;
  const hoje        = new Date(); hoje.setHours(0,0,0,0);
  let streak = 0;
  let checkDay = new Date(hoje);
  while (true) {
    const dayStr  = checkDay.toDateString();
    const hasCard = cards.some(c => new Date(c.criado_em).toDateString() === dayStr);
    if (!hasCard) break;
    streak++; checkDay.setDate(checkDay.getDate()-1);
  }

  const INTERESSES_ALL = [
    "futebol","música","culinária","tecnologia","viagens","cinema",
    "literatura","negócios","esportes","arte","jogos","natureza",
    "história","ciência","moda","fotografia","política","saúde"
  ];

  function toggleTronco(id: "românico"|"germânico") {
    setTroncos(prev => prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id]);
  }
  function toggleInteresse(id: string) {
    setInteresses(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id]);
  }

  async function handleSave() {
    if (troncos.length===0 || !profile) return;
    setSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({
      display_name: nome.trim() || profile.display_name,
      tronco: troncos[0],
      troncos_selecionados: troncos,
      interesses,
    }).eq("id", user.id);
    onProfileUpdate({ ...profile, display_name: nome.trim() || profile.display_name, tronco: troncos[0], troncos_selecionados: troncos, interesses });
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2000);
  }

  async function handleResetPassword() {
    if (!profile) return;
    setSendingReset(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      setResetSent(true);
    }
    setSendingReset(false);
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (user) {
      // Apaga todos os cards do usuário
      await supabase.from("mentoria_cards").delete().eq("user_id", user.id);
      await supabase.from("user_profiles").delete().eq("id", user.id);
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href="/"; }

  const TC = [
    { id:"românico" as const,  label:"Tear Românico",  desc:"Espanhol, Francês e Italiano", color:"#FF3B30", bg:"rgba(255,59,48,0.06)" },
    { id:"germânico" as const, label:"Tear Germânico", desc:"Inglês, Alemão e Holandês",    color:"#D4AF37", bg:"rgba(0,113,227,0.06)" },
  ];

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"10px 12px", borderRadius:"10px",
    border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px",
    color:"#1D1D1F", fontFamily:"inherit", background:"#FAFAFA",
    boxSizing:"border-box",
  };

  return (
    <div style={{ padding:"20px 16px", overflowY:"auto", height:"100%", display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* Avatar + Stats */}
      <div style={{ background:"#fff", borderRadius:"18px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"18px" }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover" }}/>
            : <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#5E5CE6,#BF5AF2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", fontWeight:700, color:"#fff", flexShrink:0 }}>
                {(nome || profile?.display_name || "U")[0].toUpperCase()}
              </div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"17px", fontWeight:700, color:"#F0EDE6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nome || profile?.display_name}</div>
            <div style={{ fontSize:"12px", color:"#8A8FA8", marginTop:"3px" }}>{interesses.slice(0,3).join(" · ") || "Sem interesses definidos"}</div>
          </div>
        </div>
        {/* Stats resumidas */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
          {[
            { value:total,  label:"Nexos",  color:"#D4AF37" },
            { value:streak, label:"Streak", color:"#FF9500" },
            { value:total*3,label:"Traduções", color:"#34C759" },
          ].map(s=>(
            <div key={s.label} style={{ padding:"12px 10px", borderRadius:"12px", background:"#F5F5F7", textAlign:"center" }}>
              <div style={{ fontSize:"22px", fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"11px", color:"#8A8FA8", marginTop:"4px", fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editar nome */}
      <div style={{ background:"#111827", borderRadius:"16px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin:"0 0 12px", fontSize:"14px", fontWeight:700, color:"#1D1D1F" }}>Nome</h3>
        <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome" style={inputStyle}
          onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>
      </div>

      {/* Troncos */}
      <div style={{ background:"#111827", borderRadius:"16px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin:"0 0 12px", fontSize:"14px", fontWeight:700, color:"#1D1D1F" }}>Troncos linguísticos</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {TC.map(t=>{ const sel=troncos.includes(t.id); return (
            <button key={t.id} onClick={()=>toggleTronco(t.id)}
              style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`2px solid ${sel?t.color:"rgba(0,0,0,0.08)"}`, background:sel?t.bg:"#FAFAFA", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:700, color:sel?t.color:"#1D1D1F" }}>{t.label}</div>
                <div style={{ fontSize:"11px", color:"#8A8FA8", marginTop:"1px" }}>{t.desc}</div>
              </div>
              <div style={{ width:20, height:20, borderRadius:"6px", border:`2px solid ${sel?t.color:"rgba(0,0,0,0.2)"}`, background:sel?t.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {sel&&<Icon.CheckMark/>}
              </div>
            </button>
          );})}
        </div>
      </div>

      {/* Interesses */}
      <div style={{ background:"#111827", borderRadius:"16px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin:"0 0 4px", fontSize:"14px", fontWeight:700, color:"#1D1D1F" }}>Meus interesses</h3>
        <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#8A8FA8" }}>O Chico usa esses temas para criar exemplos personalizados.</p>
        <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"7px" }}>
          {INTERESSES_ALL.map(item => {
            const sel = interesses.includes(item);
            return (
              <button key={item} onClick={()=>toggleInteresse(item)}
                style={{ padding:"6px 12px", borderRadius:"20px", border:`1.5px solid ${sel?"#0071E3":"rgba(0,0,0,0.10)"}`, background:sel?"rgba(212,175,55,0.10)":"transparent", color:sel?"#0071E3":"#3A3A3C", fontSize:"13px", fontWeight:sel?600:400, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão salvar */}
      <button onClick={handleSave} disabled={troncos.length===0||saving}
        style={{ padding:"13px", borderRadius:"12px", border:"none", background:troncos.length===0||saving?"rgba(0,0,0,0.08)":saved?"rgba(52,199,89,0.12)":"linear-gradient(135deg,#0071E3,#0077ED)", color:troncos.length===0||saving?"#8A8FA8":saved?"#34C759":"#fff", fontSize:"14px", fontWeight:600, cursor:troncos.length===0||saving?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.3s", boxShadow:saved||troncos.length===0||saving?"none":"0 2px 10px rgba(0,113,227,0.25)" }}>
        {saving?"Salvando...":saved?"Salvo!":"Salvar alterações"}
      </button>

      {/* Conta */}
      <div style={{ background:"#111827", borderRadius:"16px", padding:"18px", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:700, color:"#1D1D1F" }}>Conta</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {/* Redefinir senha */}
          {!resetSent ? (
            <button onClick={handleResetPassword} disabled={sendingReset}
              style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"1px solid rgba(0,0,0,0.10)", background:"transparent", color:"#1D1D1F", fontSize:"14px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
              {sendingReset?"Enviando...":"Redefinir senha por email"}
            </button>
          ) : (
            <div style={{ padding:"11px 14px", borderRadius:"12px", background:"rgba(52,199,89,0.08)", border:"1px solid rgba(52,199,89,0.20)", fontSize:"13px", color:"#34C759", fontWeight:500 }}>
              Email de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          )}

          {/* Sair */}
          {!confirmLogout ? (
            <button onClick={()=>setConfirmLogout(true)}
              style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(224,85,85,0.25)", background:"rgba(224,85,85,0.08)", color:"#E05555", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Sair da conta
            </button>
          ) : (
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={()=>setConfirmLogout(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(0,0,0,0.12)", background:"transparent", color:"#8A8FA8", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={handleLogout} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"none", background:"#FF3B30", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Confirmar saída</button>
            </div>
          )}

          {/* Apagar conta */}
          {!confirmDelete ? (
            <button onClick={()=>setConfirmDelete(true)}
              style={{ width:"100%", padding:"10px", borderRadius:"12px", border:"none", background:"transparent", color:"#4A5068", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
              Apagar minha conta
            </button>
          ) : (
            <div style={{ padding:"14px", borderRadius:"12px", background:"rgba(255,59,48,0.05)", border:"1px solid rgba(255,59,48,0.20)" }}>
              <p style={{ margin:"0 0 10px", fontSize:"13px", color:"#FF3B30", fontWeight:600 }}>Isso apagará todos os seus nexos e dados. Não tem volta.</p>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={()=>setConfirmDelete(false)} style={{ flex:1, padding:"10px", borderRadius:"10px", border:"1px solid rgba(0,0,0,0.12)", background:"transparent", color:"#8A8FA8", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{ flex:1, padding:"10px", borderRadius:"10px", border:"none", background:"#FF3B30", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {deletingAccount?"Apagando...":"Sim, apagar tudo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

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
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeTab, setActiveTab]           = useState<MainTab>("chat");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(false);
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false);
  const [memoria, setMemoria]               = useState<ChicoMemoria>({});
  const [sugestao, setSugestao]             = useState<{titulo:string;mensagem:string;acao:string;palavra_sugerida?:string}|null>(null);
  const [modoCultura, setModoCultura]       = useState(false);
  const [temaRoteiro, setTemaRoteiro]       = useState("");
  const [showRoteiroInput, setShowRoteiroInput] = useState(false);

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
      const paraRevisar = cards.filter(c=>Math.floor((Date.now()-new Date(c.criado_em).getTime())/86400000)>=3).length;
      const desafios = [
        `Como se diz "${profile.interesses?.[0]??"amigo"}" nas línguas do ${troncoLabel}?`,
        `Qual a origem da palavra "${profile.interesses?.[0]??"trabalho"}" no ${troncoLabel}?`,
        `Me conta o que você quer aprender hoje.`,
        `Tem alguma palavra em português que sempre quis saber como diz em ${troncoLabel === "Tear Românico" ? "espanhol" : "inglês"}?`,
      ];
      const desafio = desafios[new Date().getDate() % desafios.length];
      // Busca sugestão proativa em background
      fetch("/api/chico", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ acao:"sugestao_proativa", tronco:profile.tronco, interesses:profile.interesses??[], nexos:cards.slice(0,10).map(c=>c.titulo_card||c.tema_gerador), memoria }) })
        .then(r=>r.json()).then(d=>{ if(d.sugestao) setSugestao(d.sugestao); }).catch(()=>{});

      let welcomeContent = `Bom dia, ${profile.display_name?.split(" ")[0]??""}. Hoje é ${hoje}.\n\n${desafio}`;
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
        body:JSON.stringify({ tema_gerador:text.trim(), tronco:profile.tronco, interesses:profile.interesses??[], historico:chatHistoryRef.current, nexos_recentes, memoria, modo_especial: modoCultura ? "cultura" : "normal" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error??"Erro desconhecido");

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
        fetch("/api/chico", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ acao:"atualizar_memoria", nexos:cards.map(c=>c.titulo_card||c.tema_gerador), historico:chatHistoryRef.current, memoria_atual:memoria }) })
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
      setMessages(prev=>prev.map(m=>m.isLoading?{ id:`e-${Date.now()}`, role:"chico" as const, content:`Perdoe-me — ${(err as Error).message}.` }:m));
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
        const content = `${r.titulo}\n${r.descricao}\n\n${r.nexos.map((n:any,i:number)=>`${i+1}. ${n.palavra} — ${n.motivo}`).join("\n")}\n\nQuer começar? Pergunte sobre "${r.nexos[0]?.palavra}".`;
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

  const navTabs: {id:MainTab;label:string;icon:(c:string)=>React.ReactElement}[] = [
    {id:"chat",       label:"Conversar",  icon:c=><Icon.Chat c={c}/>},
    {id:"flashcards", label:"Flashcards", icon:c=><Icon.Cards c={c}/>},
    {id:"progresso",  label:"Progresso",  icon:c=><Icon.Progress c={c}/>},
    {id:"viagem",     label:"Viagem",     icon:c=><Icon.Immersion c={c}/>},
    {id:"musica",     label:"Música",     icon:c=><Icon.Diary c={c}/>},
    {id:"perfil",     label:"Perfil",     icon:c=><Icon.Settings c={c}/>},
  ];

  const TOPBAR_H = 52, MOBILE_NAV_H = 68;

  // ── Paleta azul profundo + dourado ─────────────────────────────────────────
  const C = {
    bg:         "#0A0F1E",   // fundo escuro principal
    bgPanel:    "#0D1425",   // painel lateral
    bgCard:     "#111827",   // cards
    bgInput:    "#1C2537",   // inputs
    border:     "rgba(255,255,255,0.06)",
    borderGold: "rgba(212,175,55,0.30)",
    gold:       "#D4AF37",
    goldLight:  "#F0D060",
    goldDim:    "rgba(212,175,55,0.15)",
    blue:       "#1E3A6E",
    blueLight:  "#2E5299",
    text:       "#F0EDE6",
    textDim:    "#8A8FA8",
    textMuted:  "#4A5068",
    white:      "#FFFFFF",
    red:        "#E05555",
    green:      "#4DB87A",
    chatBg:     "#080D1A",
  };

  const TOPBAR_H     = 56;
  const MOBILE_NAV_H = 68;
  const NAV_W        = 72;   // largura do menu vertical direito
  const SIDEBAR_W    = 320;  // largura da biblioteca direita

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.3;}30%{transform:translateY(-5px);opacity:1;}}
        @keyframes pulse{from{transform:scaleY(.5);}to{transform:scaleY(1.4);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes goldShimmer{0%{opacity:0.6;}50%{opacity:1;}100%{opacity:0.6;}}
        *{box-sizing:border-box;}body{margin:0;background:#0A0F1E;}
        textarea{resize:none;outline:none;}input{outline:none;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.20);border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,0.40);}
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:"'DM Sans', sans-serif", color:C.text, overflow:"hidden" }}>

        {/* ── ÁREA PRINCIPAL (esquerda+centro) ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Top bar */}
          <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:TOPBAR_H, background:C.bgPanel, borderBottom:`1px solid ${C.border}`, flexShrink:0, zIndex:100 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              {isMobile && (
                <button onClick={()=>setSidebarOpen(v=>!v)} style={{ width:34, height:34, borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim }}>
                  {sidebarOpen ? <Icon.Close/> : <Icon.Menu/>}
                </button>
              )}
              {/* Logo + nome com tipografia Playfair */}
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:32, height:32, borderRadius:"8px", background:`linear-gradient(135deg,${C.blue},${C.blueLight})`, border:`1px solid ${C.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon.Logo/>
                </div>
                <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"18px", fontWeight:700, color:C.text, letterSpacing:"0.01em" }}>
                  Chico <span style={{ color:C.gold }}>Mentor</span>
                </span>
              </div>
              {!isMobile && profile?.tronco && (
                <span style={{ padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:500, border:`1px solid ${C.borderGold}`, color:C.gold, letterSpacing:"0.04em", textTransform:"uppercase" as const }}>
                  {profile.tronco === "românico" ? "Tear Românico" : "Tear Germânico"}
                </span>
              )}
            </div>
            {profile && !isMobile && (
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"13px", color:C.textDim }}>{profile.display_name}</span>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover", border:`1.5px solid ${C.borderGold}` }}/>
                  : <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue},${C.blueLight})`, border:`1.5px solid ${C.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon.Avatar/></div>
                }
              </div>
            )}
          </header>

          {/* Conteúdo da aba ativa */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

            {/* CHAT */}
            {activeTab === "chat" && (
              <>
                {/* Barra de ferramentas do chat */}
                <div style={{ padding:"8px 20px", background:C.bgPanel, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                  {!showRoteiroInput ? (
                    <>
                      <button onClick={()=>setShowRoteiroInput(true)}
                        style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 12px", borderRadius:"20px", border:`1px solid rgba(212,175,55,0.30)`, background:"transparent", color:C.gold, fontSize:"11px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                        <Icon.Route/>Roteiro
                      </button>
                      <button onClick={()=>setModoCultura(v=>!v)}
                        style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 12px", borderRadius:"20px", border:`1px solid ${modoCultura?"rgba(212,175,55,0.50)":"rgba(255,255,255,0.08)"}`, background:modoCultura?C.goldDim:"transparent", color:modoCultura?C.gold:C.textDim, fontSize:"11px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                        🏛 {modoCultura ? "Cultura ON" : "Cultura"}
                      </button>
                    </>
                  ) : (
                    <>
                      <input value={temaRoteiro} onChange={e=>setTemaRoteiro(e.target.value)} placeholder="Tema do roteiro..."
                        style={{ flex:1, padding:"5px 12px", borderRadius:"20px", border:`1px solid ${C.borderGold}`, fontSize:"12px", color:C.text, fontFamily:"inherit", background:C.bgInput, outline:"none" }}
                        onKeyDown={e=>e.key==="Enter"&&gerarRoteiro()}/>
                      <button onClick={gerarRoteiro} disabled={!temaRoteiro.trim()||gerandoRoteiro}
                        style={{ padding:"5px 14px", borderRadius:"20px", border:"none", background:C.gold, color:"#0A0F1E", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        {gerandoRoteiro ? "..." : "Gerar"}
                      </button>
                      <button onClick={()=>{setShowRoteiroInput(false);setTemaRoteiro("");}}
                        style={{ width:26, height:26, borderRadius:"50%", border:"none", background:C.bgInput, color:C.textDim, fontSize:"14px", cursor:"pointer" }}>×</button>
                    </>
                  )}
                </div>

                {/* Banner sugestão proativa */}
                {sugestao && (
                  <div style={{ padding:"10px 20px", background:`linear-gradient(135deg,rgba(30,58,110,0.60),rgba(46,82,153,0.40))`, borderBottom:`1px solid ${C.borderGold}`, display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"11px", fontWeight:600, color:C.gold, marginBottom:"2px", letterSpacing:"0.04em", textTransform:"uppercase" as const }}>{sugestao.titulo}</div>
                      <div style={{ fontSize:"12px", color:C.textDim, lineHeight:1.4 }}>{sugestao.mensagem}</div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                      {sugestao.palavra_sugerida && (
                        <button onClick={()=>{ setInputText(sugestao.palavra_sugerida!); setSugestao(null); }}
                          style={{ padding:"5px 12px", borderRadius:"8px", border:"none", background:C.gold, color:"#0A0F1E", fontSize:"11px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                          Iniciar
                        </button>
                      )}
                      <button onClick={()=>setSugestao(null)}
                        style={{ width:22, height:22, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.06)", color:C.textDim, fontSize:"13px", cursor:"pointer", lineHeight:1 }}>×</button>
                    </div>
                  </div>
                )}

                {/* Mensagens */}
                <div style={{ flex:1, overflowY:"auto", padding:isMobile?"12px 14px":"20px 32px", display:"flex", flexDirection:"column", gap:"10px", background:C.chatBg }}>
                  {messages.map(msg=>(
                    <div key={msg.id} style={{ animation:"fadeIn 0.25s ease forwards" }}>
                      <ChatBubble message={msg} audio={audio}/>
                    </div>
                  ))}
                  <div ref={chatEndRef}/>
                </div>

                {audio.isListening && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"6px", background:"rgba(224,85,85,0.08)", borderTop:"1px solid rgba(224,85,85,0.15)" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, animation:"pulse 0.8s ease-in-out infinite alternate" }}/>
                    <span style={{ fontSize:"12px", color:C.red, fontWeight:500 }}>A ouvir...</span>
                  </div>
                )}

                {/* Input */}
                <div style={{ padding:isMobile?"10px 14px 14px":"12px 24px 16px", background:C.bgPanel, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ display:"flex", gap:"10px", alignItems:"flex-end", background:C.bgInput, borderRadius:"16px", padding:"10px 10px 10px 18px", border:`1px solid ${C.border}` }}>
                    <textarea ref={textareaRef} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="Escreva para o Chico..." rows={1} disabled={isLoading}
                      style={{ flex:1, border:"none", background:"transparent", fontSize:"15px", lineHeight:"1.4", color:C.text, fontFamily:"'DM Sans', sans-serif", maxHeight:"120px", overflowY:"auto", padding:0 }}/>
                    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                      <button type="button" onClick={handleMic}
                        style={{ width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:audio.isListening?C.red:"rgba(255,255,255,0.06)", transition:"all 0.2s" }}>
                        <Icon.Mic active={audio.isListening}/>
                      </button>
                      <button onClick={()=>sendMessage(inputText)} disabled={!inputText.trim()||isLoading}
                        style={{ width:36, height:36, borderRadius:"50%", border:"none", cursor:!inputText.trim()||isLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:!inputText.trim()||isLoading?"rgba(255,255,255,0.04)":`linear-gradient(135deg,${C.gold},${C.goldLight})`, transition:"all 0.2s", boxShadow:!inputText.trim()||isLoading?"none":`0 2px 12px rgba(212,175,55,0.35)` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!inputText.trim()||isLoading?C.textMuted:"#0A0F1E"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </div>
                  {!isMobile && <p style={{ margin:"5px 0 0", fontSize:"10px", color:C.textMuted, textAlign:"center" }}>Enter para enviar · Shift+Enter para nova linha</p>}
                </div>
              </>
            )}

            {activeTab==="flashcards" && <div style={{ flex:1, overflow:"hidden", background:C.chatBg }}><FlashcardsTab cards={cards} audio={audio}/></div>}
            {activeTab==="progresso"  && <div style={{ flex:1, overflow:"hidden", background:C.chatBg }}><ProgressoTab cards={cards}/></div>}
            {activeTab==="viagem"     && <div style={{ flex:1, overflow:"hidden", background:C.chatBg }}><ViagemTab profile={profile} audio={audio}/></div>}
            {activeTab==="musica"     && <div style={{ flex:1, overflow:"hidden", background:C.chatBg }}><MusicaTab profile={profile}/></div>}
            {activeTab==="perfil"     && <div style={{ flex:1, overflow:"hidden", background:C.chatBg }}><PerfilTab profile={profile} onProfileUpdate={setProfile} cards={cards}/></div>}
          </div>
        </div>

        {/* ── NAV VERTICAL DIREITO ── */}
        {!isMobile && (
          <nav style={{ width:NAV_W, display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0", background:C.bgPanel, borderLeft:`1px solid ${C.border}`, gap:"4px", flexShrink:0, zIndex:100 }}>
            {navTabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} title={tab.label}
                  style={{ width:52, height:52, borderRadius:"14px", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"4px", background:active?C.goldDim:"transparent", transition:"all 0.2s", position:"relative" as const }}>
                  {active && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:28, background:C.gold, borderRadius:"0 3px 3px 0" }}/>}
                  {tab.icon(active ? C.gold : C.textMuted)}
                  <span style={{ fontSize:"8px", fontWeight:active?600:400, color:active?C.gold:C.textMuted, letterSpacing:"0.02em" }}>{tab.label}</span>
                </button>
              );
            })}

            {/* Separador + Nexos */}
            <div style={{ width:32, height:1, background:C.border, margin:"8px 0" }}/>
            <button onClick={()=>setSidebarOpen(v=>!v)} title="Biblioteca de Nexos"
              style={{ width:52, height:52, borderRadius:"14px", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"4px", background:sidebarOpen?C.goldDim:"transparent", transition:"all 0.2s" }}>
              <Icon.Library c={sidebarOpen?C.gold:C.textMuted}/>
              <span style={{ fontSize:"8px", fontWeight:sidebarOpen?600:400, color:sidebarOpen?C.gold:C.textMuted }}>Nexos</span>
            </button>
          </nav>
        )}

        {/* ── SIDEBAR DIREITA — BIBLIOTECA ── */}
        {!isMobile && sidebarOpen && (
          <aside style={{ width:SIDEBAR_W, display:"flex", flexDirection:"column", borderLeft:`1px solid ${C.border}`, background:C.bgPanel, flexShrink:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 16px 10px", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                <h2 style={{ margin:0, fontFamily:"'Playfair Display', serif", fontSize:"16px", fontWeight:700, color:C.text }}>
                  Biblioteca <span style={{ color:C.gold }}>de Nexos</span>
                </h2>
                <span style={{ fontSize:"11px", color:C.textMuted }}>{filteredCards.length} nexos</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 12px", background:C.bgInput, borderRadius:"10px", border:`1px solid ${C.border}`, marginBottom:"10px" }}>
                <Icon.Search size={13} color={C.textMuted}/>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar nexos..."
                  style={{ flex:1, border:"none", background:"transparent", fontSize:"13px", color:C.text, fontFamily:"inherit" }}/>
                {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ border:"none", background:"none", cursor:"pointer", color:C.textMuted, fontSize:"15px", lineHeight:1, padding:0 }}>×</button>}
              </div>
              <div style={{ display:"flex", gap:"4px", padding:"3px", borderRadius:"10px", background:"rgba(255,255,255,0.04)" }}>
                {(["todos","românico","germânico"] as const).map(f=>(
                  <button key={f} onClick={()=>setSidebarFilter(f)}
                    style={{ flex:1, padding:"5px 6px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:sidebarFilter===f?600:400, background:sidebarFilter===f?C.goldDim:"transparent", color:sidebarFilter===f?C.gold:C.textMuted, fontFamily:"inherit", transition:"all 0.15s" }}>
                    {f==="todos"?"Todos":f==="românico"?"Românico":"Germânico"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"0 12px 16px", display:"flex", flexDirection:"column", gap:"10px" }}>
              {isFetchingCards
                ? Array.from({length:3}).map((_,i)=><div key={i} style={{ height:110, borderRadius:"14px", background:"rgba(255,255,255,0.04)" }}/>)
                : filteredCards.length===0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 12px", textAlign:"center", gap:"10px" }}>
                      <Icon.Search size={28} color={C.textMuted}/>
                      <p style={{ margin:0, fontSize:"13px", color:C.textMuted, lineHeight:1.5 }}>
                        {searchQuery ? `Nenhum resultado para "${searchQuery}"` : "Pergunte algo ao Chico
para criar nexos."}
                      </p>
                    </div>
                  : filteredCards.map(card=><div key={card.id} style={{ animation:"fadeIn 0.3s ease forwards" }}><NexoCard card={card} audio={audio} onDelete={handleDeleteCard}/></div>)
              }
            </div>
          </aside>
        )}

        {/* ── SIDEBAR MOBILE ── */}
        {isMobile && sidebarOpen && (
          <>
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:150 }} onClick={()=>setSidebarOpen(false)}/>
            <aside style={{ position:"fixed", top:0, right:0, bottom:0, width:"80%", maxWidth:320, zIndex:160, background:C.bgPanel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <h2 style={{ margin:0, fontFamily:"'Playfair Display', serif", fontSize:"16px", color:C.text }}>Biblioteca</h2>
                <button onClick={()=>setSidebarOpen(false)} style={{ border:"none", background:"transparent", cursor:"pointer", color:C.textDim }}><Icon.Close/></button>
              </div>
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"10px" }}>
                {filteredCards.map(card=><div key={card.id}><NexoCard card={card} audio={audio} onDelete={handleDeleteCard}/></div>)}
              </div>
            </aside>
          </>
        )}

        {/* ── BOTTOM NAV MOBILE ── */}
        {isMobile && (
          <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:MOBILE_NAV_H, background:C.bgPanel, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", zIndex:200, paddingBottom:"env(safe-area-inset-bottom)" }}>
            {navTabs.map(tab=>{ const active=activeTab===tab.id; return (
              <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setSidebarOpen(false);}}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", flex:1 }}>
                {tab.icon(active?C.gold:C.textMuted)}
                <span style={{ fontSize:"9px", fontWeight:active?600:400, color:active?C.gold:C.textMuted }}>{tab.label}</span>
              </button>
            );})}
            <button onClick={()=>setSidebarOpen(v=>!v)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", flex:1 }}>
              <Icon.Library c={sidebarOpen?C.gold:C.textMuted}/>
              <span style={{ fontSize:"9px", fontWeight:sidebarOpen?600:400, color:sidebarOpen?C.gold:C.textMuted }}>Nexos</span>
            </button>
          </nav>
        )}

      </div>
    </>
  );
}
