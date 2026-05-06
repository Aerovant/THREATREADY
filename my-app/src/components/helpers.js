// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// All code is verbatim from original App.jsx — no logic changes.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from "react";

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
  const committedRef = useRef("");      // text committed from prior SR sessions
  const sessionFinalRef = useRef("");   // current SR session's final text
  const manuallyStopped = useRef(false);

  const startRecognition = useCallback(() => {
    if (manuallyStopped.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.log("Speech recognition not supported"); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;

    r.lang = 'en-US';
    r.maxAlternatives = 1;

    // Fresh session — reset the per-session final ref
    sessionFinalRef.current = "";

    r.onresult = (e) => {
      // Rebuild this session's transcript from scratch each call.
      // Mobile browsers emit progressively-longer "final" results for the
      // same utterance; rebuilding (instead of appending) avoids duplicates.
      let sessionFinal = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          sessionFinal += text.trim() + ' ';
        } else {
          interim += text;
        }
      }
      sessionFinalRef.current = sessionFinal;
      setTr(committedRef.current + sessionFinal + interim);
    };

    r.onend = () => {
      // Commit the session's final text to the global committed text
      committedRef.current += sessionFinalRef.current;
      sessionFinalRef.current = "";

      if (!manuallyStopped.current) {
        // Auto-restart for continuous recognition
        setTimeout(() => {
          if (!manuallyStopped.current) {
            startRecognition();
          }
        }, 100);
      } else {
        setRec(false);
        recRef.current = null;
        setTr(committedRef.current.trim());
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
    // If transcript already has text, this is a RESUME — keep existing text
    // If empty, this is a FRESH START — clear refs (already empty, but explicit)
    sessionFinalRef.current = "";
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
    committedRef.current = "";
    sessionFinalRef.current = "";
    setTr("");
    setRec(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }
  }, []);

  const setTranscript = useCallback((text) => {
    committedRef.current = text + ' ';
    sessionFinalRef.current = "";
    setTr(text);
  }, []);

  // Cleanup: stop recognition when component using this hook unmounts
  useEffect(() => {
    return () => {
      manuallyStopped.current = true;
      if (recRef.current) {
        try { recRef.current.stop(); } catch (e) {}
        recRef.current = null;
      }
    };
  }, []);

  return { recording, transcript, start, stop, reset, setTranscript };
}