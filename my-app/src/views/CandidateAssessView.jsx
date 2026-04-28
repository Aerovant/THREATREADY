// ═══════════════════════════════════════════════════════════════
// CANDIDATE ASSESSMENT VIEW (HR Invite Link Page)
// External candidates take assessment via shared link
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import { showToast } from "../components/helpers.js";
import ToastContainer from "../components/ToastContainer.jsx";
import AIAvatar from "../components/AIAvatar.jsx";

export default function CandidateAssessView({
  // ── STATE ──
  candidateAssessState,
  candidateAssessData,
  candidateAssessError,
  candidateQIndex,
  candidateAnswers,
  candidateResult,
  candidateSubmitting,
  candidateToken,
  isMuted,
  isSpeaking,
  voice,
  // ── SETTERS ──
  setCandidateAssessState,
  setCandidateQIndex,
  setCandidateAnswers,
  setCandidateResult,
  setCandidateAssessError,
  setCandidateSubmitting,
  setIsMuted,
  setIsSpeaking,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 620, padding: "0 16px" }}>

          {candidateAssessState === "loading" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div className="loader" style={{ width: 36, height: 36, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 14, color: "var(--tx2)" }}>Loading your assessment...</div>
            </div>
          )}

          {candidateAssessState === "error" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invalid or Expired Link</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>{candidateAssessError || "This link is invalid or expired. Please contact the hiring team for a new link."}</p>
            </div>
          )}

          {candidateAssessState === "already_done" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Already Completed</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>You have already completed this assessment. Check your email for your detailed results report.</p>
            </div>
          )}

          {candidateAssessState === "intro" && candidateAssessData && (
            <div className="card fadeUp" style={{ padding: 36, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ac)", letterSpacing: 2, marginBottom: 12 }}>⚡ THREATREADY ASSESSMENT</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                {candidateAssessData.candidate.assessment_name || `${ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.name} Assessment`}
              </h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.7 }}>
                Hello <strong style={{ color: "var(--tx1)" }}>{candidateAssessData.candidate.name}</strong>! You have been invited to complete a cybersecurity skills assessment.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
                {[["📋", "5 Questions", "Scenario-based"], ["🤖", "AI Evaluated", "Instant scoring"], ["📧", "Email Report", "Sent after submit"]].map(([icon, t, d], i) => (
                  <div key={i} className="card" style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)" }}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginBottom: 24, padding: "10px 16px", background: "var(--s2)", borderRadius: 10, fontSize: 12, color: "var(--tx2)" }}>
                <span style={{ fontSize: 20 }}>{ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.icon}</span>
                <span style={{ fontWeight: 700 }}>{ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.name}</span>
                <span>·</span>
                <span className={`diff diff-${candidateAssessData.candidate.difficulty}`}>{candidateAssessData.candidate.difficulty}</span>
              </div>
              <button className="btn bp" style={{ width: "100%", padding: 16, fontSize: 16, fontWeight: 800 }}
                onClick={() => { setCandidateAssessState("question"); setCandidateQIndex(0); setCandidateAnswers({}); }}>
                Start Assessment →
              </button>
            </div>
          )}

          {candidateAssessState === "question" && candidateAssessData && (() => {
            const q = candidateAssessData.questions[candidateQIndex];
            const total = candidateAssessData.questions.length;
            const ans = candidateAnswers[candidateQIndex] || "";

            // Auto-speak question once when index changes (tracked via window global)
            if (q?.question && window.__lastSpokenIdx !== candidateQIndex) {
              window.__lastSpokenIdx = candidateQIndex;
              setTimeout(() => {
                if (window.speechSynthesis && !isMuted) {
                  window.speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(q.question);
                  const voices = window.speechSynthesis.getVoices();
                  const useFemale = candidateQIndex % 2 === 0;
                  const femaleVoice = voices.find(v => /samantha|victoria|karen|moira|tessa|zira|susan|fiona|ava|allison/i.test(v.name) && !/male/i.test(v.name.replace(/female/i,'')) && v.lang.startsWith('en'))
                    || voices.find(v => /female/i.test(v.name) && v.lang.startsWith('en'));
                  const maleVoice = voices.find(v => /daniel|alex|fred|david|james|tom|oliver|aaron|arthur/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'))
                    || voices.find(v => /\bmale\b/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'));
                  const english = voices.filter(v => v.lang.startsWith('en'));
                  utt.voice = useFemale ? (femaleVoice || english[0]) : (maleVoice || english.find(v => v !== femaleVoice) || english[0]);
                  utt.rate = useFemale ? 0.95 : 0.9;
                  utt.pitch = useFemale ? 1.4 : 0.6;
                  utt.onstart = () => setIsSpeaking(true);
                  utt.onend = () => setIsSpeaking(false);
                  utt.onerror = () => setIsSpeaking(false);
                  window.speechSynthesis.speak(utt);
                }
              }, 500);
            }

            const replayQuestion = () => {
              if (!window.speechSynthesis) { showToast('Voice not supported in this browser', 'error'); return; }
              window.speechSynthesis.cancel();
              const utt = new SpeechSynthesisUtterance(q.question);
              const voices = window.speechSynthesis.getVoices();
              const useFemale = candidateQIndex % 2 === 0;
              const femaleVoice = voices.find(v => /samantha|victoria|karen|moira|tessa|zira|susan|fiona|ava|allison/i.test(v.name) && !/male/i.test(v.name.replace(/female/i,'')) && v.lang.startsWith('en'))
                || voices.find(v => /female/i.test(v.name) && v.lang.startsWith('en'));
              const maleVoice = voices.find(v => /daniel|alex|fred|david|james|tom|oliver|aaron|arthur/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'))
                || voices.find(v => /\bmale\b/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'));
              const english = voices.filter(v => v.lang.startsWith('en'));
              utt.voice = useFemale ? (femaleVoice || english[0]) : (maleVoice || english.find(v => v !== femaleVoice) || english[0]);
              utt.rate = useFemale ? 0.95 : 0.9;
              utt.pitch = useFemale ? 1.4 : 0.6;
              utt.onstart = () => setIsSpeaking(true);
              utt.onend = () => setIsSpeaking(false);
              utt.onerror = () => setIsSpeaking(false);
              window.speechSynthesis.speak(utt);
            };

            const toggleDictation = () => {
              const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
              if (!SR) { showToast('Voice input not supported. Use Chrome/Edge.', 'error'); return; }
              if (voice.recording) {
                voice.stop();
                if (voice.transcript?.trim()) {
                  setCandidateAnswers(p => ({
                    ...p,
                    [candidateQIndex]: (p[candidateQIndex] ? p[candidateQIndex] + ' ' : '') + voice.transcript.trim()
                  }));
                  voice.reset();
                }
              } else {
                voice.reset();
                voice.start();
              }
            };

            return (
              <div className="card fadeUp" style={{ padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span className="tag">Q{candidateQIndex + 1} of {total} · {q.category || "Security"}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {Array.from({ length: total }).map((_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < candidateQIndex ? "var(--ok)" : i === candidateQIndex ? "var(--ac)" : "var(--s3)", transition: "background .3s" }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <AIAvatar isSpeaking={isSpeaking} isMuted={isMuted} qIndex={candidateQIndex} />
                </div>

                <div style={{ padding: "18px 22px", background: "var(--s2)", borderRadius: 10, border: "1px solid var(--bd)", marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7 }}>{q.question}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={replayQuestion}>
                      🔊 Replay Question
                    </button>
                    <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); setIsMuted(m => !m); }}>
                      {isMuted ? "🔇 Unmute" : "🔈 Mute"}
                    </button>
                  </div>
                </div>

                {candidateAssessData.candidate.difficulty === "beginner" && q.hint && (
                  <div style={{ padding: "8px 14px", background: "rgba(0,229,255,.05)", borderRadius: 8, border: "1px solid rgba(0,229,255,.15)", fontSize: 13, color: "var(--ac)", marginBottom: 14 }}>
                    💡 Hint: {q.hint}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 700, letterSpacing: 1 }}>YOUR ANSWER</span>
                    <button className={`btn ${voice.recording ? 'bdn' : 'bs'}`}
                      style={{ fontSize: 13, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
                      onClick={toggleDictation}>
                      {voice.recording
                        ? <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5252", animation: "pulse 1s infinite" }} /> Stop Recording</>
                        : <>🎤 Speak Answer</>}
                    </button>
                  </div>
                  <textarea className="input" placeholder={voice.recording ? "🎤 Listening... speak your answer" : "Type your answer here, or click 🎤 to speak..."}
                    value={ans}
                    onChange={e => setCandidateAnswers(p => ({ ...p, [candidateQIndex]: e.target.value }))}
                    style={{ minHeight: 140, fontSize: 13, borderColor: voice.recording ? "#ff5252" : undefined }} />
                  {voice.recording && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,82,82,.08)", border: "1px solid rgba(255,82,82,.25)", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--dn)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5252", animation: "pulse 1s infinite" }} />
                        Recording — click "Stop Recording" to add to answer
                      </div>
                      {voice.transcript && (
                        <div style={{ fontSize: 12, color: "var(--tx2)", fontStyle: "italic" }}>{voice.transcript}</div>
                      )}
                    </div>
                  )}
                </div>

                <button className="btn bp" style={{ width: "100%", padding: 14, fontSize: 15 }}
                  disabled={!ans.trim() || candidateSubmitting}
                  onClick={async () => {
                    if (voice.recording) voice.stop();
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);

                    if (candidateQIndex < total - 1) {
                      setCandidateQIndex(p => p + 1);
                    } else {
                      setCandidateSubmitting(true);
                      setCandidateAssessState("submitting");
                      try {
                        const answers = candidateAssessData.questions.map((q, i) => ({
                          question: q.question,
                          answer: candidateAnswers[i] || "",
                          category: q.category || "Security"
                        }));
                        const res = await fetch("https://threatready-db.onrender.com/api/candidate/submit", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token: candidateToken, answers, role_id: candidateAssessData.candidate.role_id, difficulty: candidateAssessData.candidate.difficulty })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setCandidateResult(data);
                          setCandidateAssessState("done");
                        } else {
                          setCandidateAssessState("error");
                          setCandidateAssessError(data.error || "Submission failed. Please try again.");
                        }
                      } catch (e) {
                        setCandidateAssessState("error");
                        setCandidateAssessError("Network error: " + e.message);
                      }
                      setCandidateSubmitting(false);
                    }
                  }}>
                  {candidateQIndex < total - 1 ? `Next Question (${candidateQIndex + 2}/${total}) →` : "Submit Assessment →"}
                </button>
              </div>
            );
          })()}

          {candidateAssessState === "submitting" && (
            <div className="card fadeUp" style={{ padding: 56, textAlign: "center" }}>
              <div className="loader" style={{ width: 44, height: 44, margin: "0 auto 24px" }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Evaluating your answers...</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>
                AI is scoring your responses. This takes about 15–20 seconds.<br />Please keep this page open.
              </div>
            </div>
          )}

          {candidateAssessState === "done" && candidateResult && (
            <div className="card fadeUp" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>ASSESSMENT COMPLETE</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Well done!</h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.7 }}>
                Thank you for completing the assessment. Your results have been recorded.
              </p>
              <div style={{ background: "var(--s2)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>Your Score</div>
                <div className="mono" style={{ fontSize: 64, fontWeight: 900, color: candidateResult.score >= 7 ? "var(--ok)" : candidateResult.score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                  {candidateResult.score}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 14 }}>out of 10</div>
                <div style={{ display: "inline-block", border: `2px solid ${candidateResult.score >= 8 ? "#e2e8f0" : candidateResult.score >= 7 ? "#f59e0b" : candidateResult.score >= 6 ? "#94a3b8" : candidateResult.score >= 4 ? "#cd7f32" : "#ff5252"}`, color: candidateResult.score >= 8 ? "#e2e8f0" : candidateResult.score >= 7 ? "#f59e0b" : candidateResult.score >= 6 ? "#94a3b8" : candidateResult.score >= 4 ? "#cd7f32" : "#ff5252", padding: "6px 24px", borderRadius: 24, fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
                  {(candidateResult.badge || "").toUpperCase()}
                </div>
              </div>
              <div style={{ padding: 16, background: "rgba(0,229,255,.05)", borderRadius: 12, border: "1px solid rgba(0,229,255,.15)", fontSize: 12, color: "var(--tx2)", lineHeight: 1.8 }}>
                📧 A detailed report with your scores, strengths, weaknesses and model answers has been sent to your email address.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}