// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// All code is verbatim from original App.jsx — no logic changes.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useCallback } from "react";

// ── TOAST & CONFIRM BRIDGE ──
export let _showToast = null;
export let _showConfirm = null;
export const setShowToast = (fn) => { _showToast = fn; };
export const setShowConfirm = (fn) => { _showConfirm = fn; };
export const showToast = (msg, type = 'info') => _showToast && _showToast(msg, type);
export const showConfirm = (msg, onYes, onNo) => _showConfirm && _showConfirm(msg, onYes, onNo);

// ── DISABLE COPY PASTE handler ──
export function noPaste(e) { e.preventDefault(); }

// ── TIME FORMAT ──
export const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// ── RANDOM PICK ──
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ── VOICE HOOK ──
export function useVoice() {
  const [recording, setRec] = useState(false);
  const [transcript, setTr] = useState("");
  const recRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const manuallyStopped = useRef(false);
  const processedFinalsRef = useRef(new Set());

  const startRecognition = useCallback(() => {
    if (manuallyStopped.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.log("Speech recognition not supported"); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        const trimmed = text.trim();
        if (e.results[i].isFinal) {
          if (!trimmed) continue;
          const key = trimmed.toLowerCase();
          if (processedFinalsRef.current.has(key)) continue;
          processedFinalsRef.current.add(key);
          if (processedFinalsRef.current.size > 50) {
            const arr = Array.from(processedFinalsRef.current);
            processedFinalsRef.current = new Set(arr.slice(-30));
          }
          finalTranscriptRef.current += trimmed + ' ';
        } else {
          interim += text;
        }
      }
      setTr(finalTranscriptRef.current + interim);
    };

    r.onend = () => {
      if (!manuallyStopped.current) {
        setTimeout(() => {
          if (!manuallyStopped.current) {
            startRecognition();
          }
        }, 100);
      } else {
        setRec(false);
        recRef.current = null;
      }
    };

    r.onerror = (e) => {
      console.log("Speech error:", e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        manuallyStopped.current = true;
        setRec(false);
        recRef.current = null;
      }
    };

    try {
      r.start();
      recRef.current = r;
    } catch (err) {
      console.log("Failed to start recognition:", err.message);
    }
  }, []);

  const start = useCallback(() => {
    manuallyStopped.current = false;
    processedFinalsRef.current = new Set();
    setRec(true);
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    manuallyStopped.current = true;
    setRec(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    manuallyStopped.current = true;
    finalTranscriptRef.current = "";
    processedFinalsRef.current = new Set();
    setTr("");
    setRec(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }
  }, []);

  const setTranscript = useCallback((text) => {
    finalTranscriptRef.current = text + ' ';
    setTr(text);
  }, []);

  return { recording, transcript, start, stop, reset, setTranscript };
}
