// ═══════════════════════════════════════════════════════════════
// HELP TAB (Dashboard - FAQ + Feedback Form)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { showToast } from "../../components/helpers.js";

export default function HelpTab({
  // ── STATE ──
  feedbackText,
  feedbackSent,
  feedbackInputMode,
  feedbackVoice,
  // ── SETTERS ──
  setFeedbackText,
  setFeedbackSent,
  setFeedbackInputMode,
}) {
  return (
    <>
      <div className="lbl" style={{ marginBottom: 12 }}>FREQUENTLY ASKED QUESTIONS</div>
      {[["How is my score calculated?", "Each question is scored on 3 dimensions: Technical Depth, Communication Quality, and Decision-Making. Overall = average of 5 questions."],
      ["Can I retake scenarios?", "Yes! Paid users get unlimited attempts. Each attempt loads a different architecture from our pool."],
      ["Are badges valid for hiring?", "Badges include a verification link (cyberprep.io/verify/[id]) that hiring managers can check."],
      ["Can I share my profile?", "Yes. Toggle your profile to public in Settings. Share your unique URL on LinkedIn."]
      ].map(([q, a], i) => (
        <div key={i} className="card fadeUp" style={{ padding: 14, marginBottom: 8, animationDelay: `${i * .05}s` }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{q}</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{a}</div>
        </div>
      ))}
      <div className="card fadeUp" style={{ padding: 16, marginTop: 8 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>FEEDBACK</div>
        {feedbackSent ? (
          <div style={{ color: "var(--ok)", fontSize: 13, padding: "10px 0" }}>
            ✅ Thank you! Your feedback has been submitted.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button className={`btn ${feedbackInputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setFeedbackInputMode("text")}>✏️ Type</button>
              <button className={`btn ${feedbackInputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setFeedbackInputMode("voice")}>🎤 Dictate</button>
            </div>
            {feedbackInputMode === "text" ? (
              <textarea
                className="input"
                placeholder="Report a problem, suggest a feature, or share feedback..."
                style={{ minHeight: 60, marginBottom: 10 }}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
              />
            ) : (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div className={`rec-ring ${feedbackVoice.recording ? "active" : ""}`}
                  onClick={() => {
                    if (feedbackVoice.recording) {
                      feedbackVoice.stop();
                      if (feedbackVoice.transcript?.trim()) {
                        setFeedbackText(prev => (prev ? prev + ' ' : '') + feedbackVoice.transcript.trim());
                        feedbackVoice.reset();
                      }
                    } else {
                      feedbackVoice.start();
                    }
                  }}
                  style={{ margin: "0 auto 8px" }}>{feedbackVoice.recording ? "⏹" : "🎤"}</div>
                <div style={{ fontSize: 12, color: feedbackVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                  {feedbackVoice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
                </div>
                {feedbackVoice.transcript && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6 }}>{feedbackVoice.transcript}</div>}
                {feedbackText && !feedbackVoice.recording && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, border: "1px solid var(--bd)" }}>{feedbackText}</div>}
              </div>
            )}
            <button
              className="btn bp"
              style={{ fontSize: 13 }}
              disabled={!feedbackText.trim() && !feedbackVoice.transcript?.trim()}
              onClick={async () => {
                try {
                  const finalMessage = feedbackText.trim() || feedbackVoice.transcript?.trim() || "";
                  const token = localStorage.getItem('token');
                  const headers = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  await fetch('https://threatready-db.onrender.com/api/feedback', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ message: finalMessage })
                  });
                  setFeedbackSent(true);
                  setFeedbackText("");
                  feedbackVoice.reset();
                  setFeedbackInputMode("text");
                  setTimeout(() => setFeedbackSent(false), 4000);
                } catch (e) {
                  showToast('Failed to submit. Please try again.', 'error');
                }
              }}
            >
              Submit Feedback
            </button>
          </>
        )}
      </div>
    </>
  );
}