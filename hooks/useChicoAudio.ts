// hooks/useChicoAudio.ts
// ============================================================
//  Chico Mentor — Hook de Áudio (Web Speech API Nativa)
//  Suporte a TTS (Text-to-Speech) e STT (Speech-to-Text)
//  100% gratuito, sem APIs externas
// ============================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SpeakOptions {
  text: string;
  lang: string;       // BCP-47: 'es-ES', 'fr-FR', 'it-IT', 'en-US', 'de-DE', 'nl-NL'
  rate?: number;      // 0.1 – 10 (padrão: 0.9 — levemente mais lento para aprendizado)
  pitch?: number;     // 0 – 2   (padrão: 1)
  volume?: number;    // 0 – 1   (padrão: 1)
}

export interface UseChicoAudioReturn {
  // TTS
  speak: (options: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  currentLang: string | null;

  // STT
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  resetTranscript: () => void;

  // Estado
  isSupported: { tts: boolean; stt: boolean };
  error: string | null;
}

// ── Mapa de vozes preferidas por idioma ──────────────────────────────────────
// Tenta usar a voz nativa do dispositivo mais adequada para cada língua

const VOICE_PREFERENCES: Record<string, string[]> = {
  "es-ES": ["Google español", "Paulina", "Monica", "Diego"],
  "es-419": ["Google español de Estados Unidos"],
  "fr-FR": ["Google français", "Thomas", "Amélie"],
  "it-IT": ["Google italiano", "Alice", "Luca"],
  "en-US": ["Google US English", "Samantha", "Alex", "Google UK English Female"],
  "en-GB": ["Google UK English Female", "Daniel"],
  "de-DE": ["Google Deutsch", "Anna", "Markus"],
  "nl-NL": ["Google Nederlands", "Xander"],
  "pt-BR": ["Google português do Brasil", "Luciana"],
};

function findBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  // 1. Busca por nome preferido
  const prefs = VOICE_PREFERENCES[lang] ?? [];
  for (const prefName of prefs) {
    const v = voices.find(
      (v) => v.name.toLowerCase().includes(prefName.toLowerCase())
    );
    if (v) return v;
  }

  // 2. Busca exata por lang
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;

  // 3. Busca por prefixo (ex: 'es' para 'es-ES')
  const prefix = lang.split("-")[0];
  const partial = voices.find((v) => v.lang.startsWith(prefix));
  return partial ?? null;
}

// ── Hook Principal ────────────────────────────────────────────────────────────

export function useChicoAudio(): UseChicoAudioReturn {
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [currentLang, setCurrentLang]       = useState<string | null>(null);
  const [isListening, setIsListening]       = useState(false);
  const [transcript, setTranscript]         = useState("");
  const [interimTranscript, setInterim]     = useState("");
  const [error, setError]                   = useState<string | null>(null);
  const [voices, setVoices]                 = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Verificar suporte ──────────────────────────────────────────────────────

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

      // Cancela qualquer fala em andamento
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang   = lang;
      utterance.rate   = rate;
      utterance.pitch  = pitch;
      utterance.volume = volume;

      // Tenta usar a voz mais natural disponível
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
        // 'interrupted' é esperado quando stop() é chamado — não é um erro real
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

    const SpeechRecognitionCtor =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang              = "pt-BR";
    recognition.continuous        = false;
    recognition.interimResults    = true;
    recognition.maxAlternatives   = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setInterim("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final    = "";
      let interim  = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => (prev ? `${prev} ${final}` : final).trim());
        setInterim("");
      } else {
        setInterim(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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