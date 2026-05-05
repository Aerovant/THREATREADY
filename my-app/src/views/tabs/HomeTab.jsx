// ═══════════════════════════════════════════════════════════════
// HOME TAB (Dashboard - Stats + Daily Challenge + Learning Paths + Leaderboard)
// Extracted from App.jsx (B2C Dashboard) - FINAL Phase 3 step
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";
import NoPasteInput from "../../components/NoPasteInput.jsx";

export default function HomeTab({
  user,
  isPaid,
  xp,
  setXp,
  streak,
  completedScenarios,
  subscribedRoles,
  dailyChallenge,
  dailyAnswered,
  setDailyAnswered,
  dailyResult,
  setDailyResult,
  dailyChallengeError,
  setDailyChallengeError,
  showDailyModal,
  setShowDailyModal,
  dailyAnswer,
  setDailyAnswer,
  dailyVoice,
  dailyInputMode,
  setDailyInputMode,
  dailyLoading,
  setDailyLoading,
  leaderboard,
  myRank,
  setActiveRole,
  setView,
  setDashTab,
  setAuthMode,
  setAuthStep,
  loadDashboardExtras,
}) {
  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[[completedScenarios.length, "Completed"], [xp, "Total XP"], [subscribedRoles.length || 1, "Tracks"], [streak, "Streak"]].map(([v, l], i) => (
          <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .05}s` }}>
            <div className="statval" style={{ color: "var(--ac)", fontSize: 20 }}>{v}</div>
            <div className="statlbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Daily Challenge */}
      <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: dailyAnswered ? "var(--ok)" : dailyChallengeError ? "var(--dn)" : "var(--wn)", background: dailyAnswered ? "rgba(0,224,150,.03)" : dailyChallengeError ? "rgba(255,82,82,.03)" : "rgba(255,171,64,.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: dailyAnswered ? "var(--ok)" : dailyChallengeError ? "var(--dn)" : "var(--wn)" }}>
              {dailyAnswered ? "✅ Daily Challenge Complete!" : dailyChallengeError ? "⚠️ Daily Challenge Unavailable" : "🎯 Daily Challenge"}
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
              {dailyChallenge
                ? `${dailyChallenge.role_id?.toUpperCase()} · ${dailyChallenge.difficulty} · +${dailyChallenge.points} XP`
                : dailyChallengeError
                  ? "Could not load today's challenge. Please try again."
                  : "Loading today's challenge..."}
            </div>
            {dailyAnswered && dailyResult && (
              <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 2 }}>
                Score: {dailyResult.score}/100 · +{dailyResult.points_earned} XP earned
              </div>
            )}
          </div>
          {!dailyAnswered && dailyChallenge && (
            <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setShowDailyModal(true)}>
              Start →
            </button>
          )}
          {dailyChallengeError && (
            <button className="btn bs" style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => { setDailyChallengeError(false); loadDashboardExtras(); }}>
              🔄 Retry
            </button>
          )}
        </div>
      </div>

      {/* Daily Challenge Modal */}
      {showDailyModal && dailyChallenge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowDailyModal(false)}>
          <div style={{ background: "#111827", border: "1px solid #1e2536", borderRadius: 20, padding: 32, maxWidth: 520, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>
            <div style={{ fontSize: 13, color: "var(--wn)", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🎯 DAILY CHALLENGE · +{dailyChallenge.points} XP</div>
            <div
              style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, lineHeight: 1.5, userSelect: "none", WebkitUserSelect: "none" }}
              onCopy={e => e.preventDefault()}
              onCut={e => e.preventDefault()}
              onContextMenu={e => e.preventDefault()}
            >{dailyChallenge.question}</div>
            {dailyChallenge.hint && (
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                💡 Hint: {dailyChallenge.hint}
              </div>
            )}
            {/* Type / Dictate Toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button className={`btn ${dailyInputMode === "text" ? "bp" : "bs"}`}
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => setDailyInputMode("text")}>✏️ Type</button>
              <button className={`btn ${dailyInputMode === "voice" ? "bp" : "bs"}`}
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => setDailyInputMode("voice")}>🎤 Dictate</button>
            </div>
            {dailyInputMode === "text" ? (
              <NoPasteInput placeholder="Type your answer... (copy-paste disabled)"
                value={dailyAnswer} onChange={e => setDailyAnswer(e.target.value)}
                style={{ minHeight: 80, marginBottom: 12, fontSize: 12 }} />
            ) : (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div className={`rec-ring ${dailyVoice.recording ? "active" : ""}`}
                  onClick={dailyVoice.recording ? dailyVoice.stop : dailyVoice.start}
                  style={{ margin: "0 auto 8px" }}>{dailyVoice.recording ? "⏹" : "🎤"}</div>
                <div style={{ fontSize: 12, color: dailyVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                  {dailyVoice.recording ? "🔴 Recording... will continue even if you pause" : "Tap to start dictating"}
                </div>
                {(dailyVoice.transcript || dailyVoice.recording) && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, textAlign: "left" }}>
                      💡 Tip: Edit the text below to fix any recognition errors
                    </div>
                    <NoPasteInput
                      value={dailyVoice.transcript}
                      onChange={e => dailyVoice.setTranscript(e.target.value)}
                      placeholder="Your dictated answer will appear here. Edit to fix errors..."
                      style={{ minHeight: 80, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, width: "100%" }}
                    />
                  </div>
                )}
              </div>
            )}
            {dailyResult && (
              <div style={{
                padding: 12, borderRadius: 10, marginBottom: 12,
                background: dailyResult.score >= 60 ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)",
                border: `1px solid ${dailyResult.score >= 60 ? "rgba(0,224,150,.3)" : "rgba(255,82,82,.3)"}`
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: dailyResult.score >= 60 ? "var(--ok)" : "var(--dn)" }}>
                  Score: {dailyResult.score}/100 · {dailyResult.correct ? "✅ Correct!" : "❌ Needs improvement"}
                </div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>{dailyResult.feedback}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn bs" style={{ flex: 1 }} onClick={() => setShowDailyModal(false)}>Close</button>
              {!dailyAnswered && (
                <button className="btn bp" style={{ flex: 2 }}
                  disabled={(!dailyAnswer.trim() && !dailyVoice.transcript?.trim()) || dailyLoading}
                  onClick={async () => {
                    setDailyLoading(true);
                    try {
                      const token = localStorage.getItem('token');
                      // Use voice transcript if in voice mode, otherwise text
                      const finalAnswer = dailyInputMode === "voice"
                        ? (dailyVoice.transcript || '').trim()
                        : (dailyAnswer || '').trim();
                      const res = await fetch('https://threatready-db.onrender.com/api/daily-challenge/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ challenge_id: dailyChallenge.id, answer: finalAnswer })
                      });
                      const data = await res.json();
                      if (data.result) {
                        setDailyResult(data.result);
                        setDailyAnswered(true);
                        setXp(p => p + (data.result.points_earned || 0));
                        showToast(`+${data.result.points_earned} XP earned!`, 'success');
                      } else {
                        showToast(data.error || 'Submit failed', 'error');
                      }
                    } catch (e) { showToast('Error: ' + e.message, 'error'); }
                    setDailyLoading(false);
                  }}>
                  {dailyLoading ? 'Evaluating...' : 'Submit Answer →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Path */}
      <div className="lbl" style={{ marginBottom: 8 }}>LEARNING PATHS</div>
      {subscribedRoles.length > 0 ? (
        subscribedRoles.map(rid => {
          const role = ROLES.find(r => r.id === rid);
          if (!role) return null;
          const completed = completedScenarios.filter(s => s?.startsWith(rid[0])).length;
          return (
            <div key={rid} className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, cursor: "pointer" }}
              onClick={() => { setActiveRole(rid); setView("difficulty", { role: rid }); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{role.name}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{completed} completed</div>
                  </div>
                </div>
                <span style={{ color: "var(--ac)", fontSize: 12, fontWeight: 600 }}>Open →</span>
              </div>

              {isPaid && (
                <div style={{ marginTop: 10, padding: "6px 8px", background: "var(--s2)", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--ac)", fontWeight: 600 }}>
                    All levels unlocked
                  </div>
                </div>
              )}

            </div>
          );
        })
      ) : (
        <div className="card fadeUp" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10 }}>No roles selected yet</div>
          <button className="btn bp" style={{ fontSize: 13 }} onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
            + Select Roles
          </button>
        </div>
      )}

      <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>+ Add More Tracks</button>
      
      {/* Leaderboard Preview — only for PAID users */}
      {isPaid ? (
        <div className="card fadeUp" style={{ marginTop: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="lbl">WEEKLY LEADERBOARD</div>
            {myRank && <span style={{ fontSize: 12, color: "var(--ac)" }}>Your rank: #{myRank}</span>}
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--tx2)", textAlign: "center", padding: 12 }}>
              Complete assessments this week to appear on the leaderboard!
            </div>
          ) : (
            leaderboard.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < leaderboard.slice(0, 5).length - 1 ? "1px solid var(--bd)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mono" style={{
                    fontSize: 12, fontWeight: 700,
                    color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--tx2)"
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span style={{ fontSize: 12, color: p.id === user?.id ? "var(--ac)" : "var(--tx1)", fontWeight: p.id === user?.id ? 700 : 400 }}>
                    {p.id === user?.id ? "You" : p.name || "Anonymous"}
                  </span>
                  {p.badge && <span style={{ fontSize: 11, color: "var(--wn)" }}>{p.badge}</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  {(() => {
                    const score = p.best_score ?? p.avg_score ?? p.score;
                    const numScore = parseFloat(score);
                    const isValid = score != null && !isNaN(numScore);
                    return (
                      <>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: isValid && numScore >= 7 ? "var(--ok)" : "var(--wn)" }}>
                          {isValid ? numScore.toFixed(1) : "—"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--tx2)" }}>/10</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Locked leaderboard teaser for free trial users */
        <div className="card fadeUp" style={{ marginTop: 16, padding: 20, textAlign: "center", border: "1px dashed var(--bd)" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
          <div className="lbl" style={{ marginBottom: 6 }}>WEEKLY LEADERBOARD</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12, lineHeight: 1.5 }}>
            Compete with other security professionals and climb the rankings.<br/>
            Subscribe to unlock leaderboard access.
          </div>
          <button className="btn bp" style={{ padding: "8px 18px", fontSize: 13 }}
            onClick={() => { 
              localStorage.setItem('cyberprep_prev_view', 'dashboard');
              setAuthMode("login");
              setAuthStep("form");
              setView("auth"); 
            }}>
            🚀 Sign In to Unlock
          </button>
        </div>
      )}
    </>
  );
}