"use client";
// hooks/useChicoAudio.ts

import { useState, useEffect, useRef, useCallback } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SpeakOptions {
  text: string;
  lang: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface UseChicoAudioReturn {
  speak: (options: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  currentLang: string | null;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  resetTranscript: () => void;
  isSupported: { tts: boolean; stt: boolean };
  error: string | null;
}

// ── Declarações de tipo para a Web Speech API ─────────────────────────────────
// Necessário porque o TypeScript não inclui esses tipos por padrão no Next.js

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

// ── Mapa de vozes preferidas por idioma ──────────────────────────────────────

const VOICE_PREFERENCES: Record<string, string[]> = {
  "es-ES": ["Google español", "Paulina", "Monica", "Diego"],
  "fr-FR": ["Google français", "Thomas", "Amélie"],
  "it-IT": ["Google italiano", "Alice", "Luca"],
  "en-US": ["Google US English", "Samantha", "Alex"],
  "en-GB": ["Google UK English Female", "Daniel"],
  "de-DE": ["Google Deutsch", "Anna", "Markus"],
  "nl-NL": ["Google Nederlands", "Xander"],
  "pt-BR": ["Google português do Brasil", "Luciana"],
};

function findBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  const prefs = VOICE_PREFERENCES[lang] ?? [];
  for (const prefName of prefs) {
    const v = voices.find((v) =>
      v.name.toLowerCase().includes(prefName.toLowerCase())
    );
    if (v) return v;
  }
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split("-")[0];
  return voices.find((v) => v.lang.startsWith(prefix)) ?? null;
}

// ── Hook Principal ────────────────────────────────────────────────────────────

export function useChicoAudio(): UseChicoAudioReturn {
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [currentLang, setCurrentLang] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [interimTranscript, setInterim] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [voices, setVoices]           = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = {
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
    stt: typeof window !== "undefined" &&
         ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
  };

  // ── Carregar vozes disponíveis ────────────────────────────────────────────

  useEffect(() => {
    if (!isSupported.tts) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // ── TTS: Falar ────────────────────────────────────────────────────────────

  const speak = useCallback(
    ({ text, lang, rate = 0.88, pitch = 1, volume = 1 }: SpeakOptions) => {
      if (!isSupported.tts) {
        setError("Text-to-Speech não suportado neste navegador.");
        return;
      }

      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang   = lang;
      utterance.rate   = rate;
      utterance.pitch  = pitch;
      utterance.volume = volume;

      const bestVoice = findBestVoice(voices, lang);
      if (bestVoice) utterance.voice = bestVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentLang(lang);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentLang(null);
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") {
          setError(`Erro no áudio: ${e.error}`);
        }
        setIsSpeaking(false);
        setCurrentLang(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voices, isSupported.tts]
  );

  const stop = useCallback(() => {
    if (isSupported.tts) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentLang(null);
    }
  }, [isSupported.tts]);

  // ── STT: Ouvir ────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!isSupported.stt) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const win = window as Window &
      typeof globalThis & {
        SpeechRecognition?: ISpeechRecognitionConstructor;
        webkitSpeechRecognition?: ISpeechRecognitionConstructor;
      };

    const SpeechRecognitionCtor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang            = "pt-BR";
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setInterim("");
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let final   = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) =>
          (prev ? `${prev} ${final}` : final).trim()
        );
        setInterim("");
      } else {
        setInterim(interim);
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setError("Nenhuma fala detectada. Tente novamente.");
      } else if (event.error === "not-allowed") {
        setError("Permissão de microfone negada.");
      } else {
        setError(`Erro no microfone: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported.stt]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterim("");
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stop();
      recognitionRef.current?.abort();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    currentLang,
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    resetTranscript,
    isSupported,
    error,
  };
}