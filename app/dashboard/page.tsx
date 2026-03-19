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

// ── Supabase ──────────────────────────────────────────────────────────────────

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Ícones SVG ────────────────────────────────────────────────────────────────

function IconPlay() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0.5 9,5 1,9.5"/></svg>;
}
function IconStop() {
  return (
    <span style={{ display:"flex", gap:"2px", alignItems:"center" }}>
      {[10,14,8].map((h,i)=><span key={i} style={{ width:3, height:h, background:"currentColor", borderRadius:2, animation:`pulse 0.6s ${i*0.15}s ease-in-out infinite alternate` }}/>)}
    </span>
  );
}
function IconMic({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#86868B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}
function IconSend({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#86868B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function IconChevron({ down }: { down: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: down?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}>
      <path d="M2 4l4 4 4-4" stroke="#0071E3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}
function IconAvatar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
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
      style={{ display:"flex", alignItems:"center", gap:"4px", padding:"4px 10px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:500, transition:"all 0.2s", flexShrink:0, background:isActive?"linear-gradient(135deg,#0071E3,#0077ED)":"rgba(0,113,227,0.08)", color:isActive?"#fff":"#0071E3" }}
    >
      {isActive ? <IconStop /> : <IconPlay />}
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
  const tc = { dot: isRom?"#FF3B30":"#0071E3", bg: isRom?"rgba(255,59,48,0.07)":"rgba(0,113,227,0.07)", label: isRom?"Tear Românico":"Tear Germânico" };

  return (
    <article style={{ background:"#fff", borderRadius:"18px", padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.05)", transition:"transform 0.2s,box-shadow 0.2s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <div>
          <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 8px", borderRadius:"8px", background:tc.bg, fontSize:"10px", fontWeight:600, color:tc.dot, textTransform:"uppercase" as const, letterSpacing:"0.04em", marginBottom:"8px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:tc.dot }} />{tc.label}
          </span>
          <h3 style={{ margin:0, fontSize:"15px", fontWeight:600, color:"#1D1D1F", lineHeight:1.35 }}>{card.tema_gerador}</h3>
        </div>
        <span style={{ fontSize:"11px", color:"#86868B", whiteSpace:"nowrap", marginLeft:"8px" }}>
          {new Date(card.criado_em).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}
        </span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"12px" }}>
        {langs.map(l=>(
          <div key={l.bcp47} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", padding:"10px 12px", borderRadius:"12px", background:"#F5F5F7" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"13px", fontWeight:600, color:"#1D1D1F", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.txt}</div>
              <div style={{ fontSize:"11px", color:"#86868B", fontStyle:"italic" }}>{l.fon}</div>
            </div>
            <AudioButton label={l.nome} bcp47={l.bcp47} isActive={audio.isSpeaking&&audio.speakingBcp47===l.bcp47} onPlay={()=>audio.speak(l.txt,l.bcp47)} onStop={audio.stopSpeaking}/>
          </div>
        ))}
      </div>

      <button onClick={()=>setExpanded(v=>!v)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:"12px", background:expanded?"rgba(0,113,227,0.06)":"#F5F5F7", transition:"background 0.2s" }}>
          <span style={{ fontSize:"12px", fontWeight:600, color:"#0071E3", display:"flex", alignItems:"center", gap:"6px" }}>
            <IconBook /> Lição do Chico
          </span>
          <IconChevron down={expanded}/>
        </div>
      </button>
      {expanded && <div style={{ marginTop:"8px", padding:"12px", borderRadius:"12px", background:"rgba(0,113,227,0.04)", fontSize:"13px", lineHeight:"1.65", color:"#3A3A3C" }}>{card.aula_chico}</div>}
    </article>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isChico = message.role === "chico";

  if (message.isLoading) return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <IconLogo/>
      </div>
      <div style={{ padding:"12px 16px", borderRadius:"18px 18px 18px 4px", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", display:"flex", gap:"5px", alignItems:"center" }}>
        {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#86868B", animation:`typingDot 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", flexDirection:isChico?"row":"row-reverse" }}>
      {isChico && (
        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <IconLogo/>
        </div>
      )}
      <div style={{ maxWidth:"75%", padding:"12px 16px", borderRadius:isChico?"18px 18px 18px 4px":"18px 18px 4px 18px", background:isChico?"#fff":"linear-gradient(135deg,#0071E3,#0077ED)", boxShadow:isChico?"0 1px 4px rgba(0,0,0,0.08)":"0 2px 8px rgba(0,113,227,0.25)", fontSize:"14px", lineHeight:"1.55", color:isChico?"#1D1D1F":"#fff" }}>
        {message.content}
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
  const [sidebarFilter, setSidebarFilter]   = useState<"todos"|"românico"|"germânico">("todos");

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(()=>{
    async function load() {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { window.location.href="/"; return; }
      const { data:prof } = await supabase.from("user_profiles").select("*").eq("id",user.id).single();
      if (prof) {
        if (!prof.onboarding_ok) { window.location.href="/onboarding"; return; }
        setProfile(prof as UserProfile);
      }
      const { data:c } = await supabase.from("mentoria_cards").select("*").eq("user_id",user.id).order("criado_em",{ascending:false}).limit(50);
      if (c) setCards(c as MentoriaCard[]);
      setFetchingCards(false);
    }
    load();
  },[]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(()=>{
    if (profile && messages.length===0) {
      const troncoLabel = profile.tronco==="românico"?"Tear Românico":"Tear Germânico";
      const interessesList = profile.interesses?.slice(0,2).join(" e ") ?? "seu universo";
      setMessages([{ id:"welcome", role:"chico", content:`Olá, ${profile.display_name?.split(" ")[0]??""}. Sou o Chico. Juntos vamos explorar o ${troncoLabel}. Vejo que você se interessa por ${interessesList}. O que quer compreender hoje?` }]);
    }
  },[profile]);

  const sendMessage = useCallback(async(text: string)=>{
    if (!text.trim()||isLoading||!profile) return;
    setMessages(prev=>[...prev,
      { id:`u-${Date.now()}`, role:"user", content:text.trim() },
      { id:`l-${Date.now()}`, role:"chico", content:"", isLoading:true },
    ]);
    setInputText("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/chico",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tema_gerador:text.trim(), tronco:profile.tronco, interesses:profile.interesses??[] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error??"Erro desconhecido");
      const savedCard: MentoriaCard = data.card;
      setCards(prev=>[savedCard,...prev]);
      setMessages(prev=>prev.map(m=>m.isLoading?{ id:`c-${Date.now()}`, role:"chico" as const, content:savedCard.aula_chico }:m));
    } catch(err) {
      setMessages(prev=>prev.map(m=>m.isLoading?{ id:`e-${Date.now()}`, role:"chico" as const, content:`Perdoe-me — ${(err as Error).message}. Podemos tentar novamente?` }:m));
    } finally { setIsLoading(false); }
  },[isLoading,profile]);

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(inputText); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(inputText); }
  }
  function handleMic() {
    if (audio.isListening) { audio.stopListening(); return; }
    audio.startListening(text=>setInputText(prev=>(prev?`${prev} ${text}`:text).trim()));
  }
  async function handleLogout() { await supabase.auth.signOut(); window.location.href="/"; }

  const filteredCards = sidebarFilter==="todos"?cards:cards.filter(c=>c.tronco===sidebarFilter);

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

      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#F5F5F7", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top Bar */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"52px", background:"rgba(255,255,255,0.90)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(0,0,0,0.07)", flexShrink:0, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:28, height:28, borderRadius:"8px", background:"linear-gradient(135deg,#0071E3,#34AADC)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IconLogo/>
            </div>
            <span style={{ fontSize:"16px", fontWeight:700, color:"#1D1D1F", letterSpacing:"-0.02em" }}>Chico Mentor</span>
            {profile?.tronco && (
              <span style={{ padding:"3px 8px", borderRadius:"8px", fontSize:"11px", fontWeight:600, letterSpacing:"0.03em", textTransform:"uppercase" as const, background:profile.tronco==="românico"?"rgba(255,59,48,0.09)":"rgba(0,113,227,0.09)", color:profile.tronco==="românico"?"#FF3B30":"#0071E3" }}>
                {profile.tronco==="românico"?"Tear Românico":"Tear Germânico"}
              </span>
            )}
          </div>
          {profile && (
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <span style={{ fontSize:"13px", color:"#86868B" }}>{profile.display_name}</span>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover", border:"1.5px solid rgba(0,0,0,0.08)" }}/>
                : <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#5E5CE6,#BF5AF2)", display:"flex", alignItems:"center", justifyContent:"center" }}><IconAvatar/></div>
              }
              <button onClick={handleLogout} style={{ padding:"5px 12px", borderRadius:"8px", border:"1px solid rgba(0,0,0,0.10)", background:"transparent", fontSize:"12px", color:"#86868B", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#F5F5F7")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              >
                Sair
              </button>
            </div>
          )}
        </header>

        {/* Layout */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* Sidebar */}
          <aside style={{ width:"380px", minWidth:"320px", maxWidth:"420px", display:"flex", flexDirection:"column", borderRight:"1px solid rgba(0,0,0,0.07)", background:"#F5F5F7", flexShrink:0, overflow:"hidden" }}>
            <div style={{ padding:"20px 20px 12px", flexShrink:0 }}>
              <h2 style={{ margin:"0 0 4px", fontSize:"19px", fontWeight:700, color:"#1D1D1F", letterSpacing:"-0.02em" }}>Biblioteca de Nexos</h2>
              <p style={{ margin:"0 0 14px", fontSize:"13px", color:"#86868B" }}>{cards.length} {cards.length===1?"nexo":"nexos"} salvos</p>
              <div style={{ display:"flex", gap:"6px", padding:"4px", borderRadius:"12px", background:"rgba(0,0,0,0.06)" }}>
                {(["todos","românico","germânico"] as const).map(f=>(
                  <button key={f} onClick={()=>setSidebarFilter(f)}
                    style={{ flex:1, padding:"6px 8px", borderRadius:"9px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:600, transition:"all 0.15s", background:sidebarFilter===f?"#fff":"transparent", color:sidebarFilter===f?"#1D1D1F":"#86868B", boxShadow:sidebarFilter===f?"0 1px 4px rgba(0,0,0,0.10)":"none", fontFamily:"inherit" }}>
                    {f==="todos"?"Todos":f==="românico"?"Românico":"Germânico"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"0 16px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              {isFetchingCards
                ? Array.from({length:3}).map((_,i)=><div key={i} style={{ height:160, borderRadius:"18px", background:"#e8e8e8" }}/>)
                : filteredCards.length===0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 20px", textAlign:"center", gap:"12px" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <p style={{ margin:0, fontSize:"14px", color:"#86868B", lineHeight:1.5 }}>Sua biblioteca está vazia.<br/>Pergunte algo ao Chico.</p>
                    </div>
                  : filteredCards.map(card=>(
                      <div key={card.id} style={{ animation:"fadeIn 0.3s ease forwards" }}>
                        <NexoCard card={card} audio={audio}/>
                      </div>
                    ))
              }
            </div>
          </aside>

          {/* Chat */}
          <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"28px 32px", display:"flex", flexDirection:"column", gap:"16px" }}>
              {messages.map(msg=>(
                <div key={msg.id} style={{ animation:"fadeIn 0.3s ease forwards" }}>
                  <ChatBubble message={msg}/>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>

            {audio.isListening && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"8px", background:"rgba(255,59,48,0.07)", borderTop:"1px solid rgba(255,59,48,0.12)" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#FF3B30", animation:"pulse 0.8s ease-in-out infinite alternate" }}/>
                <span style={{ fontSize:"12px", color:"#FF3B30", fontWeight:600, letterSpacing:"0.02em" }}>A ouvir...</span>
              </div>
            )}

            {/* Input */}
            <div style={{ padding:"16px 24px 20px", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(0,0,0,0.07)", flexShrink:0 }}>
              <form onSubmit={handleSubmit} style={{ display:"flex", gap:"10px", alignItems:"flex-end" }}>
                <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:"8px", padding:"10px 14px", background:"#fff", borderRadius:"20px", border:"1.5px solid rgba(0,0,0,0.09)", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <textarea ref={textareaRef} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao Chico..." rows={1} disabled={isLoading}
                    style={{ flex:1, border:"none", background:"transparent", fontSize:"14px", lineHeight:"1.5", color:"#1D1D1F", fontFamily:"inherit", maxHeight:"120px", overflowY:"auto", padding:0 }}
                  />
                  <button type="button" onClick={handleMic}
                    style={{ width:32, height:32, borderRadius:"50%", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:audio.isListening?"#FF3B30":"rgba(0,0,0,0.06)", flexShrink:0, transition:"all 0.2s" }}
                    title={audio.isListening?"Parar gravação":"Gravar voz"}
                  >
                    <IconMic active={audio.isListening}/>
                  </button>
                </div>
                <button type="submit" disabled={!inputText.trim()||isLoading}
                  style={{ width:44, height:44, borderRadius:"50%", border:"none", flexShrink:0, cursor:!inputText.trim()||isLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:!inputText.trim()||isLoading?"rgba(0,0,0,0.08)":"linear-gradient(135deg,#0071E3,#0077ED)", boxShadow:!inputText.trim()||isLoading?"none":"0 2px 8px rgba(0,113,227,0.30)", transition:"all 0.2s" }}
                  title="Enviar mensagem"
                >
                  <IconSend active={!(!inputText.trim()||isLoading)}/>
                </button>
              </form>
              <p style={{ margin:"8px 0 0", fontSize:"11px", color:"#AEAEB2", textAlign:"center" }}>
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
