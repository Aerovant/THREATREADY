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

// ─────────────────────────────────────────────────────────────
// TEXT-DEDUPE UTILITIES (for voice hook)
// ─────────────────────────────────────────────────────────────
// Normalize for comparison: collapse whitespace, lowercase, strip punctuation.
// This lets us detect "step by step." matches "Step by step" as overlap.
const _norm = (s) => (s || "")
  .toLowerCase()
  .replace(/[.,!?;:'"()\-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Returns the length (in NORMALIZED words) of the longest suffix of `a`
// that also appears as a prefix of `b`. Used to strip overlap when appending.
const _overlapWords = (a, b) => {
  const aw = _norm(a).split(' ').filter(Boolean);
  const bw = _norm(b).split(' ').filter(Boolean);
  if (aw.length === 0 || bw.length === 0) return 0;
  const maxCheck = Math.min(aw.length, bw.length, 20); // cap: check up to 20 words back
  for (let k = maxCheck; k >= 1; k--) {
    const aTail = aw.slice(aw.length - k).join(' ');
    const bHead = bw.slice(0, k).join(' ');
    if (aTail === bHead) return k;
  }
  return 0;
};

// Append `addition` to `committed`, stripping any word-level overlap.
// Returns the merged string.
const _mergeDedupe = (committed, addition) => {
  const clean = (addition || "").trim();
  if (!clean) return committed;
  if (!committed) return clean + ' ';

  const overlap = _overlapWords(committed, clean);
  if (overlap === 0) {
    // No overlap — just append with a space
    const sep = /\s$/.test(committed) ? '' : ' ';
    return committed + sep + clean + ' ';
  }
  // Strip the first `overlap` words from the addition, then append
  const addWords = clean.split(/\s+/);
  const rest = addWords.slice(overlap).join(' ');
  if (!rest) return committed; // fully overlapped — nothing new
  const sep = /\s$/.test(committed) ? '' : ' ';
  return committed + sep + rest + ' ';
};

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

      // ── DEDUPE-AWARE DISPLAY ──
      // Show committed + (deduped session final) + interim.
      // This prevents Chrome's carry-over buffer from making the SAME phrase
      // appear twice on screen while the user is still speaking.
      const merged = _mergeDedupe(committedRef.current, sessionFinal);
      const sepInt = interim && !/\s$/.test(merged) ? ' ' : '';
      setTr((merged + sepInt + interim).trim());
    };

    r.onend = () => {
      // ── DEDUPE-AWARE COMMIT ──
      // Merge session final into committed with overlap stripping.
      // Without this, silence gaps + auto-restart cause "step by step" to
      // get committed 3+ times as the browser re-emits the same buffer.
      committedRef.current = _mergeDedupe(committedRef.current, sessionFinalRef.current);
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
