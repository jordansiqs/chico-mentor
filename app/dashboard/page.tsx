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
  troncos_selecionados?: ("românico" | "germânico")[];
  interesses: string[];
}

type MainTab = "chat" | "flashcards" | "progresso" | "imersao" | "diario" | "perfil";
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
  Mic:       ({ active }: { active: boolean }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#86868B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  Send:      ({ active }: { active: boolean }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#86868B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Search:    ({ size = 32, color = "#AEAEB2" }: { size?: number; color?: string }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
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
};

// ── Audio Hook ────────────────────────────────────────────────────────────────

function useAudio() {
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [speakingBcp47, setSpeakingBcp47] = useState<string | null>(null);
  const [isListening, setIsListening]     = useState(false);
  const recognitionRef = useRef<any>(null);

  function speak(text: string, bcp47: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = bcp47; utt.rate = 0.88;
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.lang === bcp47) || voices.find(v => v.lang.startsWith(bcp47.split("-")[0]));
    if (best) utt.voice = best;
    utt.onstart = () => { setIsSpeaking(true); setSpeakingBcp47(bcp47); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingBcp47(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingBcp47(null); };
    window.speechSynthesis.speak(utt);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false); setSpeakingBcp47(null);
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

  return { speak, stopSpeaking, isSpeaking, speakingBcp47, startListening, stopListening, isListening };
}

// ── AudioButton ───────────────────────────────────────────────────────────────

function AudioButton({ label, bcp47, isActive, onPlay, onStop }: {
  label: string; bcp47: string; isActive: boolean; onPlay: () => void; onStop: () => void;
}) {
  return (
    <button onClick={isActive ? onStop : onPlay}
      style={{ display:"flex", alignItems:"center", gap:"4px", padding:"3px 9px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:500, transition:"all 0.2s", flexShrink:0, background:isActive?"linear-gradient(135deg,#0071E3,#0077ED)":"rgba(0,113,227,0.08)", color:isActive?"#fff":"#0071E3" }}>
      {isActive ? <Icon.Wave /> : <Icon.Play />}{label}
    </button>
  );
}

// ── NexoCard ──────────────────────────────────────────────────────────────────

function NexoCard({ card, audio, onDelete }: {
  card: MentoriaCard; audio: ReturnType<typeof useAudio>; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];
  const isRom = card.tronco === "românico";
  const tc = { dot:isRom?"#FF3B30":"#0071E3", bg:isRom?"rgba(255,59,48,0.07)":"rgba(0,113,227,0.07)", label:isRom?"Tear Românico":"Tear Germânico" };
  const titulo = card.titulo_card || card.tema_gerador;

  async function handleDelete() {
    setDeleting(true);
    try { await fetch(`/api/chico?id=${card.id}`, { method:"DELETE" }); onDelete(card.id); }
    catch { setDeleting(false); setConfirm(false); }
  }

  return (
    <article style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.05)", transition:"transform 0.2s,box-shadow 0.2s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"2px 7px", borderRadius:"6px", background:tc.bg, fontSize:"9px", fontWeight:600, color:tc.dot, textTransform:"uppercase" as const, letterSpacing:"0.04em", marginBottom:"5px" }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:tc.dot }}/>{tc.label}
          </span>
          <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:"#1D1D1F", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{titulo}</h3>
          {titulo !== card.tema_gerador && <p style={{ margin:"2px 0 0", fontSize:"11px", color:"#AEAEB2", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{card.tema_gerador}</p>}
        </div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center", marginLeft:"8px", flexShrink:0 }}>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} disabled={deleting} style={{ padding:"4px 10px", borderRadius:"8px", border:"none", background:"#FF3B30", color:"#fff", fontSize:"11px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{deleting?"...":"Apagar"}</button>
              <button onClick={()=>setConfirm(false)} style={{ padding:"4px 10px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.12)", background:"transparent", color:"#86868B", fontSize:"11px", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
            </>
          ) : (
            <button onClick={()=>setConfirm(true)} title="Apagar card"
              style={{ width:28, height:28, borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#AEAEB2", transition:"all 0.2s" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(255,59,48,0.08)"; (e.currentTarget as HTMLElement).style.color="#FF3B30"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="#AEAEB2"; }}>
              <Icon.Trash/>
            </button>
          )}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"10px" }}>
        {langs.map(l=>(
          <div key={l.bcp47} style={{ borderRadius:"10px", background:"#F5F5F7", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", padding:"8px 10px" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"13px", fontWeight:600, color:"#1D1D1F" }}>{l.txt}</div>
                <div style={{ fontSize:"10px", color:"#86868B", fontStyle:"italic" }}>{l.fon}</div>
              </div>
              <AudioButton label={l.nome} bcp47={l.bcp47} isActive={audio.isSpeaking&&audio.speakingBcp47===l.bcp47} onPlay={()=>audio.speak(l.txt,l.bcp47)} onStop={audio.stopSpeaking}/>
            </div>
            {l.exemplo&&(
              <div style={{ padding:"5px 10px 8px", borderTop:"1px solid rgba(0,0,0,0.05)", display:"flex", alignItems:"flex-start", gap:"6px" }}>
                <span style={{ fontSize:"10px", color:"#0071E3", fontWeight:600, flexShrink:0, marginTop:"1px" }}>Ex.</span>
                <span style={{ fontSize:"11px", color:"#3A3A3C", lineHeight:1.5, fontStyle:"italic", flex:1 }}>{l.exemplo}</span>
                <button onClick={()=>audio.speak(l.exemplo!,l.bcp47)} style={{ width:20, height:20, borderRadius:"50%", border:"none", background:"rgba(0,113,227,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#0071E3" }}><Icon.Play/></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={()=>setExpanded(v=>!v)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:"10px", background:expanded?"rgba(0,113,227,0.06)":"#F5F5F7", transition:"background 0.2s" }}>
          <span style={{ fontSize:"11px", fontWeight:600, color:"#0071E3", display:"flex", alignItems:"center", gap:"5px" }}><Icon.Book/>Lição do Chico</span>
          <Icon.Chevron down={expanded}/>
        </div>
      </button>
      {expanded&&<div style={{ marginTop:"6px", padding:"10px", borderRadius:"10px", background:"rgba(0,113,227,0.04)", fontSize:"12px", lineHeight:"1.65", color:"#3A3A3C" }}>{card.aula_chico}</div>}
    </article>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isChico = message.role === "chico";
  if (message.isLoading) return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon.Logo/></div>
      <div style={{ padding:"12px 16px", borderRadius:"18px 18px 18px 4px", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", display:"flex", gap:"5px", alignItems:"center" }}>
        {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#86868B", animation:`typingDot 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
      </div>
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", flexDirection:isChico?"row":"row-reverse" }}>
      {isChico&&<div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon.Logo/></div>}
      <div style={{ maxWidth:"75%", padding:"12px 16px", borderRadius:isChico?"18px 18px 18px 4px":"18px 18px 4px 18px", background:isChico?"#fff":"linear-gradient(135deg,#0071E3,#0077ED)", boxShadow:isChico?"0 1px 4px rgba(0,0,0,0.08)":"0 2px 8px rgba(0,113,227,0.25)", fontSize:"14px", lineHeight:"1.55", color:isChico?"#1D1D1F":"#fff", whiteSpace:"pre-wrap" }}>
        {message.content}
      </div>
    </div>
  );
}

// ── Flashcards (Quiz Mode) ────────────────────────────────────────────────────

function FlashcardsTab({ cards, audio }: { cards: MentoriaCard[]; audio: ReturnType<typeof useAudio> }) {
  const [mode, setMode]       = useState<"flip" | "quiz">("flip");
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore]     = useState({ acertos:0, erros:0 });
  const [done, setDone]       = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const shuffled = useRef<MentoriaCard[]>([]);

  useEffect(()=>{ restart(); },[cards.length]);

  function restart() {
    shuffled.current=[...cards].sort(()=>Math.random()-0.5).slice(0,Math.min(10,cards.length));
    setIndex(0); setFlipped(false); setScore({acertos:0,erros:0}); setDone(false); setQuizAnswer(null);
  }

  function next(ok: boolean) {
    setScore(s=>({acertos:s.acertos+(ok?1:0),erros:s.erros+(ok?0:1)}));
    if(index+1>=shuffled.current.length){setDone(true);return;}
    setIndex(i=>i+1); setFlipped(false); setQuizAnswer(null);
  }

  if (cards.length===0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"12px", padding:"40px", textAlign:"center" }}>
      <Icon.Search size={32}/><p style={{ fontSize:"15px", fontWeight:600, color:"#1D1D1F", margin:0 }}>Nenhum nexo para revisar</p>
      <p style={{ fontSize:"13px", color:"#86868B", margin:0 }}>Converse com o Chico primeiro.</p>
    </div>
  );

  const card = shuffled.current[index];
  if (!card) return null;

  const langs = [
    { nome:card.lang_1_nome, txt:card.lang_1_txt, fon:card.lang_1_fon, bcp47:card.lang_1_bcp47, exemplo:card.lang_1_exemplo },
    { nome:card.lang_2_nome, txt:card.lang_2_txt, fon:card.lang_2_fon, bcp47:card.lang_2_bcp47, exemplo:card.lang_2_exemplo },
    { nome:card.lang_3_nome, txt:card.lang_3_txt, fon:card.lang_3_fon, bcp47:card.lang_3_bcp47, exemplo:card.lang_3_exemplo },
  ];

  // Quiz: gera 4 opções (1 correta + 3 erradas)
  function getQuizOptions() {
    const correct = langs[0].txt;
    const others  = cards.filter(c=>c.id!==card.id).map(c=>c.lang_1_txt).filter(Boolean);
    const wrongs  = [...others].sort(()=>Math.random()-0.5).slice(0,3);
    return [...wrongs, correct].sort(()=>Math.random()-0.5);
  }

  const quizOptions = useRef<string[]>([]);
  if (quizAnswer === null && mode === "quiz") {
    quizOptions.current = getQuizOptions();
  }

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"20px", padding:"40px", textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:"18px", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div><h3 style={{ fontSize:"20px", fontWeight:700, color:"#1D1D1F", margin:"0 0 6px" }}>Sessão concluída</h3><p style={{ fontSize:"13px", color:"#86868B", margin:0 }}>{shuffled.current.length} cards</p></div>
      <div style={{ display:"flex", gap:"28px" }}>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"32px", fontWeight:700, color:"#34C759" }}>{score.acertos}</div><div style={{ fontSize:"12px", color:"#86868B" }}>Acertos</div></div>
        <div style={{ width:1, background:"rgba(0,0,0,0.08)" }}/>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"32px", fontWeight:700, color:"#FF3B30" }}>{score.erros}</div><div style={{ fontSize:"12px", color:"#86868B" }}>Erros</div></div>
      </div>
      <button onClick={restart} style={{ padding:"12px 28px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#0071E3,#0077ED)", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Revisar novamente</button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"16px", gap:"14px", height:"100%", overflowY:"auto" }}>
      {/* Modo selector */}
      <div style={{ display:"flex", gap:"6px", padding:"3px", borderRadius:"10px", background:"rgba(0,0,0,0.06)", width:"100%", maxWidth:"500px" }}>
        {(["flip","quiz"] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);restart();}} style={{ flex:1, padding:"6px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:mode===m?600:500, background:mode===m?"#fff":"transparent", color:mode===m?"#1D1D1F":"#86868B", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.10)":"none", fontFamily:"inherit", transition:"all 0.15s" }}>
            {m==="flip"?"Virar Card":"Modo Quiz"}
          </button>
        ))}
      </div>

      {/* Progresso */}
      <div style={{ width:"100%", maxWidth:"500px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
          <span style={{ fontSize:"12px", color:"#86868B" }}>{index+1} de {shuffled.current.length}</span>
          <div style={{ display:"flex", gap:"12px" }}>
            <span style={{ fontSize:"12px", color:"#34C759", fontWeight:600, display:"flex", alignItems:"center", gap:"3px" }}><Icon.Check/>{score.acertos}</span>
            <span style={{ fontSize:"12px", color:"#FF3B30", fontWeight:600, display:"flex", alignItems:"center", gap:"3px" }}><Icon.X/>{score.erros}</span>
          </div>
        </div>
        <div style={{ height:4, borderRadius:4, background:"rgba(0,0,0,0.08)", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#0071E3,#34AADC)", width:`${(index/shuffled.current.length)*100}%`, transition:"width 0.3s ease" }}/>
        </div>
      </div>

      {/* Card virar */}
      {mode === "flip" && (
        <>
          <div onClick={()=>setFlipped(v=>!v)}
            style={{ width:"100%", maxWidth:"500px", minHeight:"190px", borderRadius:"20px", background:"#fff", boxShadow:"0 4px 24px rgba(0,0,0,0.09)", padding:"24px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px", border:"1.5px solid rgba(0,0,0,0.06)", transition:"transform 0.15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform="scale(1.01)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform="scale(1)"}>
            {!flipped ? (
              <><span style={{ fontSize:"10px", color:"#86868B", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Em Português</span>
              <p style={{ fontSize:"22px", fontWeight:700, color:"#1D1D1F", textAlign:"center", margin:0 }}>{card.titulo_card||card.tema_gerador}</p>
              <span style={{ fontSize:"11px", color:"#AEAEB2" }}>Toque para ver as traduções</span></>
            ) : (
              <><span style={{ fontSize:"10px", color:"#0071E3", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Traduções</span>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", width:"100%" }}>
                {langs.map(l=>(
                  <div key={l.bcp47} style={{ borderRadius:"12px", background:"#F5F5F7", overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px" }}>
                      <div><div style={{ fontSize:"14px", fontWeight:600, color:"#1D1D1F" }}>{l.txt}</div><div style={{ fontSize:"10px", color:"#86868B", fontStyle:"italic" }}>{l.fon}</div></div>
                      <AudioButton label={l.nome} bcp47={l.bcp47} isActive={audio.isSpeaking&&audio.speakingBcp47===l.bcp47} onPlay={()=>audio.speak(l.txt,l.bcp47)} onStop={audio.stopSpeaking}/>
                    </div>
                    {l.exemplo&&<div style={{ padding:"4px 12px 8px", borderTop:"1px solid rgba(0,0,0,0.05)", fontSize:"11px", color:"#3A3A3C", fontStyle:"italic" }}>{l.exemplo}</div>}
                  </div>
                ))}</div></>
            )}
          </div>
          {flipped ? (
            <div style={{ display:"flex", gap:"12px", width:"100%", maxWidth:"500px" }}>
              <button onClick={()=>next(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(255,59,48,0.25)", background:"rgba(255,59,48,0.05)", color:"#FF3B30", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><Icon.X/>Errei</button>
              <button onClick={()=>next(true)}  style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(52,199,89,0.25)", background:"rgba(52,199,89,0.05)", color:"#34C759", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><Icon.Check/>Acertei</button>
            </div>
          ) : <p style={{ fontSize:"12px", color:"#AEAEB2", margin:0 }}>Tente lembrar antes de tocar no card</p>}
        </>
      )}

      {/* Quiz */}
      {mode === "quiz" && (
        <>
          <div style={{ width:"100%", maxWidth:"500px", borderRadius:"20px", background:"#fff", boxShadow:"0 4px 24px rgba(0,0,0,0.09)", padding:"24px", border:"1.5px solid rgba(0,0,0,0.06)" }}>
            <p style={{ margin:"0 0 6px", fontSize:"11px", color:"#86868B", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Como se diz em {langs[0].nome}?</p>
            <p style={{ margin:0, fontSize:"20px", fontWeight:700, color:"#1D1D1F" }}>{card.titulo_card||card.tema_gerador}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"500px" }}>
            {quizOptions.current.map((opt, i) => {
              const isCorrect = opt === langs[0].txt;
              const isSelected = quizAnswer === i;
              let bg = "#fff", border = "rgba(0,0,0,0.10)", color = "#1D1D1F";
              if (quizAnswer !== null) {
                if (isCorrect) { bg="rgba(52,199,89,0.08)"; border="#34C759"; color="#34C759"; }
                else if (isSelected) { bg="rgba(255,59,48,0.08)"; border="#FF3B30"; color="#FF3B30"; }
              }
              return (
                <button key={i} disabled={quizAnswer !== null}
                  onClick={()=>{ setQuizAnswer(i); setTimeout(()=>next(isCorrect), 800); }}
                  style={{ width:"100%", padding:"14px 16px", borderRadius:"12px", border:`1.5px solid ${border}`, background:bg, color, fontSize:"14px", fontWeight:500, cursor:quizAnswer!==null?"default":"pointer", fontFamily:"inherit", textAlign:"left", transition:"all 0.2s" }}>
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Progresso com Streak ──────────────────────────────────────────────────────

function ProgressoTab({ cards }: { cards: MentoriaCard[] }) {
  const total      = cards.length;
  const romanicos  = cards.filter(c=>c.tronco==="românico").length;
  const germanicos = cards.filter(c=>c.tronco==="germânico").length;

  // Calcular streak
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  let streak = 0;
  let checkDay = new Date(hoje);
  while (true) {
    const dayStr = checkDay.toDateString();
    const hasCard = cards.some(c => new Date(c.criado_em).toDateString() === dayStr);
    if (!hasCard) break;
    streak++;
    checkDay.setDate(checkDay.getDate() - 1);
  }

  const diasUnicos = [...new Set(cards.map(c=>new Date(c.criado_em).toDateString()))].length;
  const ultimos7   = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return { label:d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""), count:cards.filter(c=>new Date(c.criado_em).toDateString()===d.toDateString()).length, isToday: i===6 }; });
  const maxCount   = Math.max(...ultimos7.map(d=>d.count),1);
  const langCount: Record<string,number> = {};
  cards.forEach(c=>{ [c.lang_1_nome,c.lang_2_nome,c.lang_3_nome].forEach(l=>{ langCount[l]=(langCount[l]||0)+1; }); });
  const topLangs = Object.entries(langCount).sort((a,b)=>b[1]-a[1]);
  const maxLang  = topLangs[0]?.[1]||1;

  // Conquistas
  const badges = [
    { label:"Primeiro Nexo",  unlocked: total >= 1,   desc:"Criou o 1º nexo" },
    { label:"10 Nexos",       unlocked: total >= 10,  desc:"10 nexos criados" },
    { label:"50 Nexos",       unlocked: total >= 50,  desc:"50 nexos criados" },
    { label:"3 Dias Seguidos",unlocked: streak >= 3,  desc:"3 dias de estudo" },
    { label:"7 Dias Seguidos",unlocked: streak >= 7,  desc:"7 dias de estudo" },
    { label:"Bilíngue",       unlocked: romanicos > 0 && germanicos > 0, desc:"Estudou os 2 troncos" },
  ];

  function exportPDF() {
    const linhas = cards.map(c => `
${c.titulo_card || c.tema_gerador}
${c.lang_1_nome}: ${c.lang_1_txt} [${c.lang_1_fon}]${c.lang_1_exemplo ? ` — Ex: ${c.lang_1_exemplo}` : ""}
${c.lang_2_nome}: ${c.lang_2_txt} [${c.lang_2_fon}]${c.lang_2_exemplo ? ` — Ex: ${c.lang_2_exemplo}` : ""}
${c.lang_3_nome}: ${c.lang_3_txt} [${c.lang_3_fon}]${c.lang_3_exemplo ? ` — Ex: ${c.lang_3_exemplo}` : ""}
Lição: ${c.aula_chico}
---`).join("\n");

    const conteudo = `CHICO MENTOR — BIBLIOTECA DE NEXOS\nExportado em ${new Date().toLocaleDateString("pt-BR")}\n\n${linhas}`;
    const blob = new Blob([conteudo], { type:"text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "chico-mentor-nexos.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding:"20px 16px", overflowY:"auto", height:"100%", display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* Streak destaque */}
      {streak > 0 && (
        <div style={{ background:"linear-gradient(135deg,#FF9500,#FF6B00)", borderRadius:"16px", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom:"2px" }}>Sequência atual</div>
            <div style={{ fontSize:"28px", fontWeight:700, color:"#fff" }}>{streak} {streak===1?"dia":"dias"} seguidos</div>
          </div>
          <Icon.Fire/>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
        {[{value:total,label:"Nexos",color:"#0071E3"},{value:diasUnicos,label:"Dias ativos",color:"#FF9500"},{value:total*3,label:"Traduções",color:"#34C759"}].map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:"14px", padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", textAlign:"center" }}>
            <div style={{ fontSize:"26px", fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:"#86868B", fontWeight:500, marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"13px", fontWeight:700, color:"#1D1D1F" }}>Últimos 7 dias</h3>
        <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:"64px" }}>
          {ultimos7.map(d=>(
            <div key={d.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", height:"100%", justifyContent:"flex-end" }}>
              <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:d.count>0?(d.isToday?"linear-gradient(180deg,#FF9500,#FF6B00)":"linear-gradient(180deg,#0071E3,#34AADC)"):"#F0F0F0", height:`${Math.max((d.count/maxCount)*44,d.count>0?6:3)}px`, transition:"height 0.4s ease" }}/>
              <span style={{ fontSize:"9px", color:d.isToday?"#0071E3":"#86868B", fontWeight:d.isToday?700:400, textTransform:"capitalize" as const }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troncos */}
      <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin:"0 0 12px", fontSize:"13px", fontWeight:700, color:"#1D1D1F" }}>Por tronco</h3>
        {[{label:"Tear Românico",count:romanicos,color:"#FF3B30"},{label:"Tear Germânico",count:germanicos,color:"#0071E3"}].map(t=>(
          <div key={t.label} style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
              <span style={{ fontSize:"12px", fontWeight:500, color:"#3A3A3C" }}>{t.label}</span>
              <span style={{ fontSize:"12px", fontWeight:600, color:t.color }}>{t.count}</span>
            </div>
            <div style={{ height:5, borderRadius:5, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:5, background:t.color, width:`${total>0?(t.count/total)*100:0}%`, transition:"width 0.5s ease" }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Conquistas */}
      <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"13px", fontWeight:700, color:"#1D1D1F" }}>Conquistas</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
          {badges.map(b=>(
            <div key={b.label} style={{ padding:"12px 8px", borderRadius:"12px", background:b.unlocked?"linear-gradient(135deg,rgba(0,113,227,0.08),rgba(52,170,220,0.08))":"rgba(0,0,0,0.03)", border:`1px solid ${b.unlocked?"rgba(0,113,227,0.20)":"rgba(0,0,0,0.06)"}`, textAlign:"center", opacity:b.unlocked?1:0.5 }}>
              <div style={{ fontSize:"20px", marginBottom:"5px" }}>{b.unlocked?"⭐":"🔒"}</div>
              <div style={{ fontSize:"11px", fontWeight:600, color:b.unlocked?"#0071E3":"#86868B", lineHeight:1.3 }}>{b.label}</div>
              <div style={{ fontSize:"10px", color:"#AEAEB2", marginTop:"2px" }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Línguas */}
      {topLangs.length>0&&(
        <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin:"0 0 12px", fontSize:"13px", fontWeight:700, color:"#1D1D1F" }}>Top línguas</h3>
          {topLangs.map(([lang,count])=>(
            <div key={lang} style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"12px", fontWeight:500, color:"#3A3A3C" }}>{lang}</span>
                <span style={{ fontSize:"12px", fontWeight:600, color:"#0071E3" }}>{count}x</span>
              </div>
              <div style={{ height:5, borderRadius:5, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:5, background:"linear-gradient(90deg,#0071E3,#34AADC)", width:`${(count/maxLang)*100}%`, transition:"width 0.5s ease" }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exportar */}
      <button onClick={exportPDF}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"13px", borderRadius:"12px", border:"1.5px solid rgba(0,113,227,0.25)", background:"rgba(0,113,227,0.05)", color:"#0071E3", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
        onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,113,227,0.10)")}
        onMouseLeave={e=>(e.currentTarget.style.background="rgba(0,113,227,0.05)")}>
        <Icon.Download/>Exportar biblioteca ({total} nexos)
      </button>
    </div>
  );
}

// ── Imersão ───────────────────────────────────────────────────────────────────

function ImersaoTab({ profile }: { profile: UserProfile | null }) {
  const [texto, setTexto]       = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  async function handle() {
    if (!texto.trim()||!profile) return;
    setLoading(true); setResultado(null);
    try {
      const res  = await fetch("/api/chico",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tema_gerador:`MODO IMERSÃO — Traduza e explique este texto para as línguas do ${profile.tronco==="românico"?"Tear Românico (Espanhol, Francês, Italiano)":"Tear Germânico (Inglês, Alemão, Holandês)"}. Destaque cognatos e raízes comuns. Texto:\n\n${texto}`, tronco:profile.tronco, interesses:profile.interesses??[] }) });
      const data = await res.json();
      setResultado(res.ok?(data.card?.aula_chico??""):"Erro ao processar.");
    } catch { setResultado("Erro de conexão."); }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"20px 16px", gap:"14px", overflowY:"auto" }}>
      <div><h2 style={{ margin:"0 0 4px", fontSize:"17px", fontWeight:700, color:"#1D1D1F" }}>Modo Imersão</h2><p style={{ margin:0, fontSize:"13px", color:"#86868B", lineHeight:1.5 }}>Cole qualquer texto em português. O Chico traduz e explica as raízes linguísticas.</p></div>
      <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Cole aqui um texto, notícia, trecho de livro..." rows={6}
        style={{ width:"100%", padding:"13px", borderRadius:"14px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", lineHeight:"1.6", color:"#1D1D1F", fontFamily:"inherit", background:"#fff", resize:"vertical" as const, outline:"none", boxSizing:"border-box" as const }}
        onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>
      <button onClick={handle} disabled={!texto.trim()||loading}
        style={{ padding:"13px", borderRadius:"12px", border:"none", background:!texto.trim()||loading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", color:!texto.trim()||loading?"#86868B":"#fff", fontSize:"14px", fontWeight:600, cursor:!texto.trim()||loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
        {loading?"Processando...":"Mergulhar no texto"}
      </button>
      {resultado&&(
        <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <span style={{ fontSize:"12px", fontWeight:600, color:"#0071E3" }}>Análise do Chico</span>
            <button onClick={()=>{ navigator.clipboard.writeText(resultado); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.10)", background:copied?"rgba(52,199,89,0.08)":"transparent", color:copied?"#34C759":"#86868B", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              <Icon.Copy/>{copied?"Copiado!":"Copiar"}
            </button>
          </div>
          <p style={{ margin:0, fontSize:"13px", lineHeight:"1.7", color:"#3A3A3C", whiteSpace:"pre-wrap" }}>{resultado}</p>
        </div>
      )}
    </div>
  );
}

// ── Diário ────────────────────────────────────────────────────────────────────

function DiarioTab({ profile }: { profile: UserProfile | null }) {
  const supabase  = createSupabase();
  const [entrada, setEntrada]   = useState("");
  const [entradas, setEntradas] = useState<{id:string;texto_pt:string;texto_chico:string;criado_em:string}[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(()=>{
    async function load() {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("mentoria_cards").select("id,tema_gerador,aula_chico,criado_em").eq("user_id",user.id).like("tema_gerador","DIÁRIO:%").order("criado_em",{ascending:false}).limit(20);
      if (data) setEntradas(data.map(d=>({ id:d.id, texto_pt:d.tema_gerador.replace("DIÁRIO: ",""), texto_chico:d.aula_chico, criado_em:d.criado_em })));
      setFetching(false);
    }
    load();
  },[]);

  async function handleSave() {
    if (!entrada.trim()||!profile) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/chico",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tema_gerador:`DIÁRIO: ${entrada}`, tronco:profile.tronco, interesses:profile.interesses??[] }) });
      const data = await res.json();
      if (res.ok) { setEntradas(prev=>[{ id:data.card.id, texto_pt:entrada, texto_chico:data.card.aula_chico, criado_em:data.card.criado_em },...prev]); setEntrada(""); }
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      <div style={{ padding:"20px 16px 0", flexShrink:0 }}>
        <h2 style={{ margin:"0 0 4px", fontSize:"17px", fontWeight:700, color:"#1D1D1F" }}>Diário Bilíngue</h2>
        <p style={{ margin:"0 0 12px", fontSize:"13px", color:"#86868B", lineHeight:1.5 }}>Escreva sobre o seu dia. O Chico enriquece com vocabulário das línguas que você aprende.</p>
        <textarea value={entrada} onChange={e=>setEntrada(e.target.value)} placeholder={`Conte algo sobre o seu dia, ${profile?.display_name?.split(" ")[0]??""}...`} rows={4}
          style={{ width:"100%", padding:"13px", borderRadius:"14px", border:"1.5px solid rgba(0,0,0,0.10)", fontSize:"14px", lineHeight:"1.6", color:"#1D1D1F", fontFamily:"inherit", background:"#fff", resize:"vertical" as const, outline:"none", boxSizing:"border-box" as const, marginBottom:"10px" }}
          onFocus={e=>(e.target.style.borderColor="#0071E3")} onBlur={e=>(e.target.style.borderColor="rgba(0,0,0,0.10)")}/>
        <button onClick={handleSave} disabled={!entrada.trim()||loading}
          style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:!entrada.trim()||loading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", color:!entrada.trim()||loading?"#86868B":"#fff", fontSize:"14px", fontWeight:600, cursor:!entrada.trim()||loading?"not-allowed":"pointer", fontFamily:"inherit", marginBottom:"18px" }}>
          {loading?"Salvando...":"Salvar no diário"}
        </button>
      </div>
      <div style={{ flex:1, padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:"10px" }}>
        {fetching ? Array.from({length:2}).map((_,i)=><div key={i} style={{ height:100, borderRadius:"14px", background:"#e8e8e8" }}/>)
          : entradas.length===0
            ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 16px", textAlign:"center", gap:"10px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p style={{ margin:0, fontSize:"13px", color:"#86868B" }}>Diário vazio. Escreva a primeira entrada!</p>
              </div>
            : entradas.map(e=>(
              <div key={e.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px" }}>
                  <span style={{ fontSize:"10px", fontWeight:600, color:"#0071E3", textTransform:"uppercase" as const, letterSpacing:"0.04em" }}>Sua entrada</span>
                  <span style={{ fontSize:"10px", color:"#86868B" }}>{new Date(e.criado_em).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span>
                </div>
                <p style={{ margin:"0 0 8px", fontSize:"13px", color:"#1D1D1F", lineHeight:1.6 }}>{e.texto_pt}</p>
                <div style={{ height:1, background:"rgba(0,0,0,0.06)", marginBottom:"8px" }}/>
                <span style={{ fontSize:"10px", fontWeight:600, color:"#86868B", textTransform:"uppercase" as const, letterSpacing:"0.04em", display:"block", marginBottom:"5px" }}>Enriquecido pelo Chico</span>
                <p style={{ margin:0, fontSize:"12px", color:"#3A3A3C", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{e.texto_chico}</p>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────────

function PerfilTab({ profile, onProfileUpdate }: { profile: UserProfile | null; onProfileUpdate: (p: UserProfile) => void }) {
  const supabase = createSupabase();
  const [troncos, setTroncos] = useState<("românico"|"germânico")[]>(
    profile?.troncos_selecionados ?? (profile?.tronco ? [profile.tronco] : [])
  );
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  function toggleTronco(id: "românico"|"germânico") {
    setTroncos(prev => prev.includes(id) ? prev.filter(t=>t!==id) : [...prev, id]);
  }

  async function handleSave() {
    if (troncos.length===0||!profile) return;
    setSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({ tronco:troncos[0], troncos_selecionados:troncos }).eq("id",user.id);
    onProfileUpdate({...profile, tronco:troncos[0], troncos_selecionados:troncos});
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href="/"; }

  const TRONCOS_CONFIG = [
    { id:"românico" as const,  label:"Tear Românico",  desc:"Espanhol, Francês e Italiano", color:"#FF3B30", bg:"rgba(255,59,48,0.06)", border:"rgba(255,59,48,0.25)" },
    { id:"germânico" as const, label:"Tear Germânico", desc:"Inglês, Alemão e Holandês",    color:"#0071E3", bg:"rgba(0,113,227,0.06)", border:"rgba(0,113,227,0.25)" },
  ];

  return (
    <div style={{ padding:"24px 20px", overflowY:"auto", height:"100%", display:"flex", flexDirection:"column", gap:"18px" }}>
      <div style={{ background:"#fff", borderRadius:"18px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:"16px" }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover" }}/>
          : <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#5E5CE6,#BF5AF2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:700, color:"#fff" }}>{profile?.display_name?.[0]?.toUpperCase()??"U"}</div>
        }
        <div>
          <div style={{ fontSize:"16px", fontWeight:700, color:"#1D1D1F" }}>{profile?.display_name}</div>
          <div style={{ fontSize:"13px", color:"#86868B", marginTop:"2px" }}>{profile?.interesses?.slice(0,3).join(" · ")}</div>
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:"18px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin:"0 0 6px", fontSize:"15px", fontWeight:700, color:"#1D1D1F" }}>Meus Troncos</h3>
        <p style={{ margin:"0 0 14px", fontSize:"13px", color:"#86868B", lineHeight:1.5 }}>Adicione ou remova os troncos que deseja aprender.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"14px" }}>
          {TRONCOS_CONFIG.map(t=>{ const selected=troncos.includes(t.id); return (
            <button key={t.id} onClick={()=>toggleTronco(t.id)} style={{ width:"100%", padding:"14px 16px", borderRadius:"12px", border:`2px solid ${selected?t.color:"rgba(0,0,0,0.08)"}`, background:selected?t.bg:"#FAFAFA", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"14px", fontWeight:700, color:selected?t.color:"#1D1D1F" }}>{t.label}</div>
                <div style={{ fontSize:"12px", color:"#86868B", marginTop:"2px" }}>{t.desc}</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:"6px", border:`2px solid ${selected?t.color:"rgba(0,0,0,0.2)"}`, background:selected?t.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }}>
                {selected&&<Icon.CheckMark/>}
              </div>
            </button>
          );})}
        </div>
        <button onClick={handleSave} disabled={troncos.length===0||saving}
          style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:troncos.length===0||saving?"rgba(0,0,0,0.08)":saved?"rgba(52,199,89,0.15)":"linear-gradient(135deg,#0071E3,#0077ED)", color:troncos.length===0||saving?"#86868B":saved?"#34C759":"#fff", fontSize:"14px", fontWeight:600, cursor:troncos.length===0||saving?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.3s" }}>
          {saving?"Salvando...":saved?"Salvo!":"Salvar alterações"}
        </button>
      </div>
      <div style={{ background:"#fff", borderRadius:"18px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin:"0 0 12px", fontSize:"15px", fontWeight:700, color:"#1D1D1F" }}>Conta</h3>
        {!confirmLogout
          ? <button onClick={()=>setConfirmLogout(true)} style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(255,59,48,0.25)", background:"rgba(255,59,48,0.05)", color:"#FF3B30", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sair da conta</button>
          : <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={()=>setConfirmLogout(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1.5px solid rgba(0,0,0,0.12)", background:"transparent", color:"#86868B", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={handleLogout} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"none", background:"#FF3B30", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Confirmar saída</button>
            </div>
        }
      </div>
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
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeTab, setActiveTab]           = useState<MainTab>("chat");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Histórico para memória do Chico (últimas 6 mensagens)
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
    }
    load();
  },[]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(()=>{
    if (profile&&messages.length===0) {
      const troncoLabel    = profile.tronco==="românico"?"Tear Românico":"Tear Germânico";
      const hoje           = new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
      const desafios = [
        `Como se diz "${profile.interesses?.[0]??"amigo"}" nas línguas do ${troncoLabel}?`,
        `Qual a origem da palavra "${profile.interesses?.[0]??"trabalho"}" no ${troncoLabel}?`,
        `Como expressar entusiasmo sobre ${profile.interesses?.[0]??"um tema"} no ${troncoLabel}?`,
        `Quais cognatos de "${profile.interesses?.[0]??"arte"}" existem no ${troncoLabel}?`,
      ];
      const desafio = desafios[new Date().getDate()%desafios.length];
      const welcomeContent = `Bom dia, ${profile.display_name?.split(" ")[0]??""}. Hoje é ${hoje}.\n\nDesafio do dia: ${desafio}\n\nEstou pronto quando quiser começar.`;
      setMessages([{ id:"welcome", role:"chico", content:welcomeContent }]);
      chatHistoryRef.current = [{ role:"assistant", content:welcomeContent }];
    }
  },[profile]);

  const sendMessage = useCallback(async(text:string)=>{
    if(!text.trim()||isLoading||!profile) return;

    const userMsg = { id:`u-${Date.now()}`, role:"user" as const, content:text.trim() };
    const loadMsg = { id:`l-${Date.now()}`, role:"chico" as const, content:"", isLoading:true };
    setMessages(prev=>[...prev, userMsg, loadMsg]);
    setInputText(""); setIsLoading(true);

    // Adiciona ao histórico
    chatHistoryRef.current = [...chatHistoryRef.current, { role:"user", content:text.trim() }].slice(-6);

    try {
      const res = await fetch("/api/chico",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          tema_gerador: text.trim(),
          tronco: profile.tronco,
          interesses: profile.interesses??[],
          historico: chatHistoryRef.current,
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error??"Erro desconhecido");

      const savedCard:MentoriaCard = data.card;
      setCards(prev=>[savedCard,...prev]);

      const chicoContent = savedCard.aula_chico;
      setMessages(prev=>prev.map(m=>m.isLoading?{id:`c-${Date.now()}`,role:"chico" as const,content:chicoContent}:m));

      // Adiciona resposta ao histórico
      chatHistoryRef.current = [...chatHistoryRef.current, { role:"assistant", content:chicoContent }].slice(-6);
    } catch(err) {
      const errContent = `Perdoe-me — ${(err as Error).message}. Podemos tentar novamente?`;
      setMessages(prev=>prev.map(m=>m.isLoading?{id:`e-${Date.now()}`,role:"chico" as const,content:errContent}:m));
    } finally { setIsLoading(false); }
  },[isLoading,profile]);

  function handleDeleteCard(id:string) { setCards(prev=>prev.filter(c=>c.id!==id)); }
  function handleSubmit(e:FormEvent){e.preventDefault();sendMessage(inputText);}
  function handleKeyDown(e:React.KeyboardEvent<HTMLTextAreaElement>){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(inputText);}}
  function handleMic(){if(audio.isListening){audio.stopListening();return;}audio.startListening(text=>setInputText(prev=>(prev?`${prev} ${text}`:text).trim()));}

  // Filtro + busca
  const filteredCards = cards
    .filter(c => sidebarFilter==="todos" || c.tronco===sidebarFilter)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.titulo_card||c.tema_gerador).toLowerCase().includes(q) ||
        c.lang_1_txt?.toLowerCase().includes(q) ||
        c.lang_2_txt?.toLowerCase().includes(q) ||
        c.lang_3_txt?.toLowerCase().includes(q)
      );
    });

  const navTabs: {id:MainTab;label:string;icon:(c:string)=>React.ReactElement}[] = [
    {id:"chat",       label:"Conversar",  icon:c=><Icon.Chat c={c}/>},
    {id:"flashcards", label:"Flashcards", icon:c=><Icon.Cards c={c}/>},
    {id:"progresso",  label:"Progresso",  icon:c=><Icon.Progress c={c}/>},
    {id:"imersao",    label:"Imersão",    icon:c=><Icon.Immersion c={c}/>},
    {id:"diario",     label:"Diário",     icon:c=><Icon.Diary c={c}/>},
    {id:"perfil",     label:"Perfil",     icon:c=><Icon.Settings c={c}/>},
  ];

  const TOPBAR_H     = 52;
  const MOBILE_NAV_H = 68;

  return (
    <>
      <style>{`
        @keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-6px);opacity:1;}}
        @keyframes pulse{from{transform:scaleY(.6);}to{transform:scaleY(1.3);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        *{box-sizing:border-box;}body{margin:0;}
        textarea{resize:none;outline:none;}input{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:4px;}
        button:focus-visible{outline:2px solid #0071E3;outline-offset:2px;}
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#F5F5F7", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top Bar */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:TOPBAR_H, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(0,0,0,0.07)", flexShrink:0, position:"sticky", top:0, zIndex:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{ width:36, height:36, borderRadius:"10px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{sidebarOpen?<Icon.Close/>:<Icon.Menu/>}</button>}
            <div style={{ width:28, height:28, borderRadius:"8px", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon.Logo/></div>
            <span style={{ fontSize:"16px", fontWeight:700, color:"#1D1D1F", letterSpacing:"-0.02em" }}>Chico Mentor</span>
            {!isMobile&&profile?.tronco&&(
              <span style={{ padding:"3px 8px", borderRadius:"8px", fontSize:"11px", fontWeight:600, letterSpacing:"0.03em", textTransform:"uppercase" as const, background:profile.tronco==="românico"?"rgba(255,59,48,0.09)":"rgba(0,113,227,0.09)", color:profile.tronco==="românico"?"#FF3B30":"#0071E3" }}>
                {profile.tronco==="românico"?"Tear Românico":"Tear Germânico"}
              </span>
            )}
          </div>
          {profile&&!isMobile&&(
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"13px", color:"#86868B" }}>{profile.display_name}</span>
              {profile.avatar_url?<img src={profile.avatar_url} alt="" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }}/>:<div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#5E5CE6,#BF5AF2)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon.Avatar/></div>}
              <button onClick={()=>setActiveTab("perfil")} style={{ padding:"5px 10px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.10)", background:"transparent", fontSize:"12px", color:"#86868B", cursor:"pointer", fontFamily:"inherit" }}>Perfil</button>
            </div>
          )}
        </header>

        {/* Layout */}
        <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>
          {isMobile&&sidebarOpen&&<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:150 }} onClick={()=>setSidebarOpen(false)}/>}

          {/* Sidebar */}
          <aside style={{ width:"340px", minWidth:"300px", maxWidth:"380px", display:"flex", flexDirection:"column", borderRight:"1px solid rgba(0,0,0,0.07)", background:"#F5F5F7", flexShrink:0, overflow:"hidden",
            ...(isMobile?{ position:"fixed", top:TOPBAR_H, bottom:MOBILE_NAV_H, left:0, zIndex:160, transform:sidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.3s ease", boxShadow:sidebarOpen?"4px 0 20px rgba(0,0,0,0.15)":"none" }:{}) }}>
            <div style={{ padding:"14px 14px 10px", flexShrink:0 }}>
              <h2 style={{ margin:"0 0 10px", fontSize:"16px", fontWeight:700, color:"#1D1D1F", letterSpacing:"-0.02em" }}>Biblioteca de Nexos</h2>

              {/* Busca */}
              <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", background:"#fff", borderRadius:"10px", border:"1.5px solid rgba(0,0,0,0.09)", marginBottom:"10px" }}>
                <Icon.Search size={14} color="#AEAEB2"/>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar nexos..." style={{ flex:1, border:"none", background:"transparent", fontSize:"13px", color:"#1D1D1F", fontFamily:"inherit" }}/>
                {searchQuery&&<button onClick={()=>setSearchQuery("")} style={{ border:"none", background:"none", cursor:"pointer", color:"#AEAEB2", fontSize:"16px", lineHeight:1, padding:0 }}>×</button>}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <span style={{ fontSize:"12px", color:"#86868B" }}>{filteredCards.length} {filteredCards.length===1?"nexo":"nexos"}</span>
              </div>

              <div style={{ display:"flex", gap:"4px", padding:"3px", borderRadius:"10px", background:"rgba(0,0,0,0.06)" }}>
                {(["todos","românico","germânico"] as const).map(f=>(
                  <button key={f} onClick={()=>setSidebarFilter(f)} style={{ flex:1, padding:"5px 6px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, transition:"all 0.15s", background:sidebarFilter===f?"#fff":"transparent", color:sidebarFilter===f?"#1D1D1F":"#86868B", boxShadow:sidebarFilter===f?"0 1px 4px rgba(0,0,0,0.10)":"none", fontFamily:"inherit" }}>
                    {f==="todos"?"Todos":f==="românico"?"Românico":"Germânico"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"0 12px 16px", display:"flex", flexDirection:"column", gap:"10px" }}>
              {isFetchingCards
                ?Array.from({length:3}).map((_,i)=><div key={i} style={{ height:120, borderRadius:"14px", background:"#e8e8e8" }}/>)
                :filteredCards.length===0
                  ?<div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 12px", textAlign:"center", gap:"10px" }}>
                    <Icon.Search size={32}/>
                    <p style={{ margin:0, fontSize:"13px", color:"#86868B", lineHeight:1.5 }}>
                      {searchQuery ? `Nenhum resultado para "${searchQuery}"` : "Biblioteca vazia.\nPergunte algo ao Chico."}
                    </p>
                  </div>
                  :filteredCards.map(card=><div key={card.id} style={{ animation:"fadeIn 0.3s ease forwards" }}><NexoCard card={card} audio={audio} onDelete={handleDeleteCard}/></div>)
              }
            </div>
          </aside>

          {/* Área principal */}
          <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
            {/* Abas desktop */}
            {!isMobile&&(
              <div style={{ display:"flex", gap:"2px", padding:"8px 20px 0", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(0,0,0,0.07)", flexShrink:0 }}>
                {navTabs.map(tab=>{ const active=activeTab===tab.id; const color=active?"#0071E3":"#86868B"; return (
                  <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px 10px 0 0", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:active?600:500, fontFamily:"inherit", transition:"all 0.15s", background:active?"#F5F5F7":"transparent", color, borderBottom:active?"2px solid #0071E3":"2px solid transparent" }}>
                    {tab.icon(color)}{tab.label}
                  </button>
                );})}
              </div>
            )}

            <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", paddingBottom:isMobile?`${MOBILE_NAV_H}px`:"0" }}>
              {activeTab==="chat"&&(
                <>
                  <div style={{ flex:1, overflowY:"auto", padding:isMobile?"14px":"24px 28px", display:"flex", flexDirection:"column", gap:"14px" }}>
                    {messages.map(msg=><div key={msg.id} style={{ animation:"fadeIn 0.3s ease forwards" }}><ChatBubble message={msg}/></div>)}
                    <div ref={chatEndRef}/>
                  </div>
                  {audio.isListening&&(
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"7px", background:"rgba(255,59,48,0.07)", borderTop:"1px solid rgba(255,59,48,0.12)" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"#FF3B30", animation:"pulse 0.8s ease-in-out infinite alternate" }}/>
                      <span style={{ fontSize:"12px", color:"#FF3B30", fontWeight:600 }}>A ouvir...</span>
                    </div>
                  )}
                  <div style={{ padding:isMobile?"10px 12px 12px":"14px 20px 18px", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(0,0,0,0.07)", flexShrink:0 }}>
                    <form onSubmit={handleSubmit} style={{ display:"flex", gap:"8px", alignItems:"flex-end" }}>
                      <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:"8px", padding:"9px 12px", background:"#fff", borderRadius:"18px", border:"1.5px solid rgba(0,0,0,0.09)", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                        <textarea ref={textareaRef} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Pergunte ao Chico..." rows={1} disabled={isLoading}
                          style={{ flex:1, border:"none", background:"transparent", fontSize:"14px", lineHeight:"1.5", color:"#1D1D1F", fontFamily:"inherit", maxHeight:"100px", overflowY:"auto", padding:0 }}/>
                        <button type="button" onClick={handleMic} style={{ width:30, height:30, borderRadius:"50%", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:audio.isListening?"#FF3B30":"rgba(0,0,0,0.06)", flexShrink:0, transition:"all 0.2s" }}>
                          <Icon.Mic active={audio.isListening}/>
                        </button>
                      </div>
                      <button type="submit" disabled={!inputText.trim()||isLoading}
                        style={{ width:42, height:42, borderRadius:"50%", border:"none", flexShrink:0, cursor:!inputText.trim()||isLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:!inputText.trim()||isLoading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", boxShadow:!inputText.trim()||isLoading?"none":"0 2px 8px rgba(0,113,227,0.25)", transition:"all 0.2s" }}>
                        <Icon.Send active={!(!inputText.trim()||isLoading)}/>
                      </button>
                    </form>
                    {!isMobile&&<p style={{ margin:"6px 0 0", fontSize:"11px", color:"#AEAEB2", textAlign:"center" }}>Enter para enviar · Shift+Enter para nova linha</p>}
                  </div>
                </>
              )}
              {activeTab==="flashcards"&&<div style={{ flex:1, overflow:"hidden" }}><FlashcardsTab cards={cards} audio={audio}/></div>}
              {activeTab==="progresso" &&<div style={{ flex:1, overflow:"hidden" }}><ProgressoTab cards={cards}/></div>}
              {activeTab==="imersao"   &&<div style={{ flex:1, overflow:"hidden" }}><ImersaoTab profile={profile}/></div>}
              {activeTab==="diario"    &&<div style={{ flex:1, overflow:"hidden" }}><DiarioTab profile={profile}/></div>}
              {activeTab==="perfil"    &&<div style={{ flex:1, overflow:"hidden" }}><PerfilTab profile={profile} onProfileUpdate={setProfile}/></div>}
            </div>
          </main>
        </div>

        {/* Bottom Nav mobile */}
        {isMobile&&(
          <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:MOBILE_NAV_H, background:"rgba(255,255,255,0.96)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(0,0,0,0.08)", display:"flex", alignItems:"center", zIndex:200, paddingBottom:"env(safe-area-inset-bottom)" }}>
            {navTabs.map(tab=>{ const active=activeTab===tab.id; const color=active?"#0071E3":"#86868B"; return (
              <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setSidebarOpen(false);}} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", flex:1 }}>
                {tab.icon(color)}
                <span style={{ fontSize:"9px", fontWeight:active?600:500, color }}>{tab.label}</span>
              </button>
            );})}
            <button onClick={()=>setSidebarOpen(v=>!v)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"6px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", flex:1 }}>
              <Icon.Library c={sidebarOpen?"#0071E3":"#86868B"}/>
              <span style={{ fontSize:"9px", fontWeight:sidebarOpen?600:500, color:sidebarOpen?"#0071E3":"#86868B" }}>Nexos</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
