// ═══════════════════════════════════════════════════════════════
// INTERVIEW VIEW (Adaptive Scenario Interface + Anti-Gaming)
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { fmt } from "../components/helpers.js";
import NoPasteInput from "../components/NoPasteInput.jsx";
import ArchDiagram from "../components/ArchDiagram.jsx";
import AIAvatar from "../components/AIAvatar.jsx";

export default function InterviewView({
  // ── STATE ──
  scenario,
  currentQ,
  qIndex,
  activeDifficulty,
  answers,
  loading,
  showHint,
  inputMode,
  elapsed,
  voice,
  isMuted,
  isSpeaking,
  
  // ── SETTERS ──
  setAnswers,
  setShowHint,
  setInputMode,
  setIsMuted,

  // ── HANDLERS ──
  submitAnswer,
  exitScenario,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />

      <div className="page"><div className="cnt" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div className="fadeUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{scenario.ti}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span className={`diff diff-${activeDifficulty}`}>{activeDifficulty}</span>
              
              <span className="tag">Q{qIndex + 1}/5</span>

            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: elapsed > 600 ? "var(--dn)" : "var(--ac)" }}>⏱ {fmt(elapsed)}</span>
            <button className="btn bs" style={{ padding: "5px 16px", fontSize: 13, color: "var(--dn)", borderColor: "var(--dn)", fontWeight: 700 }} onClick={exitScenario}>Exit</button>
          </div>
        </div>

        {/* Architecture Diagram (Zoomable + Pannable) with Avatar */}
        <div style={{ position: "relative" }}>
          <ArchDiagram nodes={scenario.no} edges={scenario.ed} />
          <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 10 }}>
            <AIAvatar isSpeaking={isSpeaking} isMuted={isMuted} qIndex={qIndex} />
          </div>
        </div>

        {/* Current Question */}
        <div className="card fadeUp" style={{ marginBottom: 14, padding: 18, borderColor: "var(--ac)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="tag">{currentQ.ca}</div>
            <button
              className="btn bs"
              style={{ padding: "3px 10px", fontSize: 12, marginLeft: 8 }}
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(currentQ.t);
                  const voices = window.speechSynthesis.getVoices();
                  const femaleVoices = voices.filter(v =>
                    v.name.includes('Female') || v.name.includes('Zira') ||
                    v.name.includes('Samantha') || v.name.includes('Google UK English Female')
                  );
                  const maleVoices = voices.filter(v =>
                    v.name.includes('Male') || v.name.includes('Daniel') ||
                    v.name.includes('Google UK English Male') || v.name.includes('Microsoft David')
                  );
                  const useFemale = qIndex % 2 === 0;
                  const preferred = (useFemale ? femaleVoices[0] : maleVoices[0]) ||
                    voices.find(v => v.lang === 'en-US');
                  if (preferred) utterance.voice = preferred;
                  utterance.rate = 0.9;
                  utterance.pitch = useFemale ? 1.1 : 0.85;
                  utterance.volume = 1.0;
                  window.speechSynthesis.speak(utterance);
                } else {
                  setIsMuted(true);
                  window.speechSynthesis.cancel();
                }
              }}
            >
              {isMuted ? "🔊 Unmute" : "🔇 Mute"}
            </button>
          </div>
          <div
            style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
          >{currentQ.t}</div>

          {/* Difficulty-aware hint system: full → reduced → minimal → none */}
          {currentQ.h && activeDifficulty !== "expert" && (() => {
            let hintText = currentQ.h;
            let hintLabel = "Hint";

            if (activeDifficulty === "intermediate") {
              // Reduced: first sentence only
              hintText = currentQ.h.split(/(?<=[.!?])\s+/)[0];
            } else if (activeDifficulty === "advanced") {
              // Minimal: first clause, truncated nudge
              const firstClause = currentQ.h.split(/[,:;.!?]/)[0].trim();
              hintText = (firstClause.length > 50 ? firstClause.slice(0, 50) : firstClause) + "...";
              hintLabel = "Nudge";
            }

            return showHint ? (
              <div style={{ marginTop: 8, padding: 8, background: "rgba(0,229,255,.05)", borderRadius: 6, fontSize: 12, color: "var(--ac)" }}>
                💡 {hintLabel}: {hintText}
              </div>
            ) : (
              <button className="btn bs" style={{ marginTop: 8, fontSize: 11, padding: "3px 10px" }} onClick={() => setShowHint(true)}>
                Show {hintLabel}
              </button>
            );
          })()}

        </div>

        {/* Answer Input (No Copy-Paste) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button className={`btn ${inputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setInputMode("text")}>✏️ Type</button>
          <button className={`btn ${inputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setInputMode("voice")}>🎤 Dictate</button>
        </div>
        {inputMode === "text" ? (
          <NoPasteInput placeholder="Type your answer... (copy-paste disabled)" value={answers[currentQ.id] || ""}
            onChange={e => setAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
            style={{ minHeight: 100, marginBottom: 12, fontSize: 13 }} />
        ) : (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div className={`rec-ring ${voice.recording ? "active" : ""}`}
              onClick={voice.recording ? voice.stop : voice.start}
              style={{ margin: "0 auto 8px" }}>{voice.recording ? "⏹" : "🎤"}</div>
            <div style={{ fontSize: 12, color: voice.recording ? "var(--dn)" : "var(--tx2)" }}>
              {voice.recording ? "🔴 Recording... will continue even if you pause" : "Tap to start dictating"}
            </div>
            {(voice.transcript || voice.recording) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, textAlign: "left" }}>
                  💡 Tip: You can edit the text below to fix any recognition errors
                </div>
                <NoPasteInput
                  value={voice.transcript}
                  onChange={e => voice.setTranscript(e.target.value)}
                  placeholder="Your dictated answer will appear here. Edit to fix errors..."
                  style={{ minHeight: 80, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, width: "100%" }}
                />
              </div>
            )}
          </div>
        )}

        <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 13 }}
          disabled={loading || (!(answers[currentQ.id]?.trim()) && !(voice.transcript?.trim()))}
          onClick={submitAnswer}>
          {loading ? <span className="loader" /> : qIndex < 4 ? `Submit & Next (Q${qIndex + 2}/5) →` : "Finish Assessment →"}
        </button>
      </div></div>
    </div>
  );
}