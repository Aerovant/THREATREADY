// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW (Transparent Scoring + Badges + CTAs)
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { CSS } from "../styles.js";
import { ROLES, SCENARIOS } from "../constants.js";
import { showToast, fmt } from "../components/helpers.js";
import HomeBtn from "../components/HomeBtn.jsx";

export default function ResultsView({
  // ── STATE ──
  results,
  scenario,
  activeRole,
  activeDifficulty,
  userType,
  user,
  isPaid,
  radarData,
  // ── SETTERS ──
  setView,
  setActiveRole,
  setActiveDifficulty,
  setResults,
  // ── HANDLERS ──
  goHome,
  startScenario,
  isTrialExhausted,
}) {
  const [showShareChoice, setShowShareChoice] = useState(false);

  // Open LinkedIn composer with the share URL pre-attached as a link card
  const openLinkedInShare = async (showName) => {
    const slug = results?.share_slug;
    if (!slug) {
      showToast('Share link not available yet — please retry in a moment', 'error');
      return;
    }
    // Save user's "show name" preference (only if logged in)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`https://threatready-db.onrender.com/api/share/show-name/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ show_name: !!showName })
        });
      }
    } catch (e) { console.log('show-name save skipped:', e.message); }

    const shareUrl = `https://app.threatready.io/share/${slug}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    setShowShareChoice(false);
  };

  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <HomeBtn goHome={goHome} />
      <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
        {/* Score Card */}
        <div className="card fadeUp" style={{ textAlign: "center", padding: 36, marginBottom: 20, borderColor: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>
          <div className="lbl" style={{ marginBottom: 6 }}>ASSESSMENT COMPLETE · {(activeDifficulty || "").toUpperCase()}</div>
          <div className="mono" style={{ fontSize: 56, fontWeight: 700, color: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>{results.overall_score}</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 14 }}>out of 10 · {results.questions_asked} adaptive questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[["Technical Depth", `${results.depth}/10`], ["Communication", `${results.communication}/10`], ["Decision-Making", `${results.decision}/10`]].map(([l, v], i) => (
              <div key={i} className="statbox"><div className="statval" style={{ color: "var(--ac)", fontSize: 16 }}>{v}</div><div className="statlbl">{l}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            {[["Skills Score", `${results.skillsScore}/500`], ["Attack Thinking", `${results.attackScore}/100`], ["Percentile", `Top ${100 - results.percentile}%`], ["Duration", fmt(results.time)]].map(([l, v], i) => (
              <div key={i}><div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)" }}>{v}</div><div style={{ fontSize: 11, color: "var(--tx2)" }}>{l}</div></div>
            ))}
          </div>
          <div className="badge-card" style={{ margin: "0 auto", maxWidth: 200, borderColor: results.badge === "Platinum" ? "#8b5cf6" : results.badge === "Gold" ? "#f59e0b" : results.badge === "Silver" ? "#94a3b8" : results.badge === "Bronze" ? "#cd7f32" : "var(--dn)", color: results.badge === "Platinum" ? "#8b5cf6" : results.badge === "Gold" ? "#f59e0b" : results.badge === "Silver" ? "#94a3b8" : results.badge === "Bronze" ? "#cd7f32" : "var(--dn)" }}>
            {results.badge === "Not Ready" ? "NOT READY" : `${results.badge.toUpperCase()} · ${(activeDifficulty || "").toUpperCase()}`}
          </div>
          <div className="tag" style={{ marginTop: 14, padding: "5px 12px" }}>+{results.earned} XP</div>
        </div>

        {/* Radar Chart */}
        <div className="card fadeUp" style={{ marginBottom: 20, padding: 20 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>SKILL RADAR</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,229,255,.15)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: "#8890b0", fontSize: 12 }} />
              <Radar name="Score" dataKey="v" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Percentile Bar */}
        <div className="card fadeUp" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="lbl">YOUR RANKING</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)" }}>Top {100 - results.percentile}%</div>
          </div>
          <div style={{ position: "relative", height: 14, background: "rgba(255,255,255,.04)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,229,255,.15)" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${results.percentile}%`,
              background: `linear-gradient(90deg, ${results.percentile >= 70 ? "#00e096" : results.percentile >= 50 ? "#ffab40" : "#ff5252"}, ${results.percentile >= 70 ? "#00e5ff" : results.percentile >= 50 ? "#ffab40" : "#ff5252"})`,
              borderRadius: 8,
              transition: "width 1s ease-out"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--tx2)" }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 10, textAlign: "center" }}>
            You scored better than {results.percentile}% of candidates at {activeDifficulty} level
          </div>
        </div>

        {/* Scoring Transparency */}
        <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>HOW YOUR SCORE WAS CALCULATED</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>
            Each question scored on 3 dimensions: Technical Depth (thoroughness), Communication Quality (clarity), and Decision-Making (soundness).
            Overall score = average across all 5 questions. Percentile calculated against all users at {activeDifficulty} difficulty.
            {activeDifficulty === "beginner" && " Beginner rubric: encouraging, credit for partial understanding."}
            {activeDifficulty === "intermediate" && " Intermediate rubric: balanced, credit reasoning but penalize gaps."}
            {activeDifficulty === "advanced" && " Advanced rubric: strict, interview-grade standards."}
            {activeDifficulty === "expert" && " Expert rubric: rigorous, challenges assumptions."}
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="lbl" style={{ marginBottom: 10 }}>QUESTION-BY-QUESTION BREAKDOWN</div>
        {results.evaluations.map((ev, i) => (
          <div key={i} className="eval-card fadeUp" style={{ animationDelay: `${i * .05}s`, borderLeftColor: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="tag">Q{i + 1} · {ev.category}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{ev.score}/10</span>
            </div>

            {ev.question_text && (
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", marginBottom: 8, lineHeight: 1.5 }}>
                {ev.question_text}
              </div>
            )}

            <div style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--ok)" }}>✓</span> <span style={{ color: "var(--tx2)" }}>{ev.strengths}</span></div>
            <div style={{ fontSize: 13, marginBottom: 8 }}><span style={{ color: "var(--dn)" }}>✗</span> <span style={{ color: "var(--tx2)" }}>{ev.weaknesses}</span></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div style={{ padding: 10, background: "rgba(255,171,64,.06)", border: "1px solid rgba(255,171,64,.2)", borderRadius: 6 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--wn)", marginBottom: 4, fontWeight: 700, letterSpacing: 0.5 }}>YOUR ANSWER</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{ev.user_answer || "— (no answer recorded)"}</div>
              </div>
              <div style={{ padding: 10, background: "rgba(0,224,150,.06)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 6 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ok)", marginBottom: 4, fontWeight: 700, letterSpacing: 0.5 }}>MODEL ANSWER</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6 }}>{ev.improved_answer || "—"}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Improvement Path */}
        {results.evaluations.some(e => e.score < 7) && (
          <div className="card fadeUp" style={{ marginTop: 16, padding: 18, borderColor: "var(--wn)" }}>
            <div className="lbl" style={{ marginBottom: 8 }}>RECOMMENDED IMPROVEMENT PATH</div>
            {results.evaluations.filter(e => e.score < 7).slice(0, 3).map((ev, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--wn)", marginBottom: 3 }}>Weak: {ev.category}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)" }}>{ev.weaknesses}</div>
                <div style={{ fontSize: 12, color: "var(--ac)", marginTop: 4 }}>→ Try a {activeDifficulty === "beginner" ? "Beginner" : "harder"} scenario focusing on {ev.category}</div>
              </div>
            ))}
          </div>
        )}

        {/* B2B Hook */}
        {userType === "b2b" && (
          <div className="card fadeUp" style={{ marginTop: 16, padding: 16, borderColor: "var(--ok)", background: "rgba(0,224,150,.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)", marginBottom: 4 }}>🏢 Hiring for this role?</div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8 }}>Create a custom assessment using this exact scenario for your candidates.</div>
            <button className="btn bok" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setView("b2b-dashboard")}>Create Assessment →</button>
          </div>
        )}

        {/* ALL CTAs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 20 }}>
          <button className="btn bp" onClick={() => { const scs = SCENARIOS[activeRole]; if (scs?.length) startScenario(scs[Math.floor(Math.random() * scs.length)], activeDifficulty); }}>
            🔄 Retry (New Architecture)
          </button>
          <button className="btn bs" onClick={() => { setActiveDifficulty(null); setView("difficulty"); }}>
            ⬆️ Try Next Difficulty
          </button>
          <button className="btn bs" onClick={() => { setActiveRole(null); setView("dashboard"); }}>
            🔀 Try Different Role
          </button>

          {user ? (
            <button className="btn bs" style={{ borderColor: "var(--ok)", color: "var(--ok)" }}
              onClick={() => setShowShareChoice(true)}>
              📤 Share Score on LinkedIn
            </button>
          ) : (
            <button className="btn bs"
              title="Sign up to unlock LinkedIn sharing"
              style={{
                borderColor: "var(--tx2)", color: "var(--tx2)",
                opacity: 0.5, cursor: "not-allowed", position: "relative"
              }}
              onClick={() => {
                showToast('🔒 Sign up to unlock LinkedIn sharing', 'info');
                setView('auth');
              }}>
              🔒 Share Score on LinkedIn
            </button>
          )}
        </div>

        {!isPaid && isTrialExhausted() && (
          <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14 }} onClick={() => setView("trial-complete")}>
            🔓 View Subscription Options →
          </button>
        )}

      </div></div>

      {/* LinkedIn Share — Identity Choice Modal */}
      {showShareChoice && (
        <div onClick={() => setShowShareChoice(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9998,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0f1420", border: "2px solid var(--ac)", borderRadius: 16,
            padding: 28, maxWidth: 440, width: "100%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 60px rgba(0,229,255,0.2)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--ac)" }}>
              Share your score on LinkedIn
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.5 }}>
              LinkedIn will open in a new tab with your score preview attached. Write your own caption,
              then click Post on LinkedIn to share.
            </div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
              SHOW YOUR NAME ON THE SHARE PAGE?
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn bp" style={{ padding: 12 }}
                onClick={() => openLinkedInShare(true)}>
                👤 Yes — show my name
              </button>
              <button className="btn bs" style={{ padding: 12 }}
                onClick={() => openLinkedInShare(false)}>
                🕶️ Anonymous
              </button>
              <button className="btn bs" style={{ padding: 10, marginTop: 4, fontSize: 12, opacity: 0.7 }}
                onClick={() => setShowShareChoice(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}