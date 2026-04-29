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
  const [sharing, setSharing] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
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

          <button className="btn bs" style={{ borderColor: "var(--ok)", color: "var(--ok)", opacity: sharing ? 0.5 : 1 }}
            disabled={sharing}
            onClick={async () => {
              if (sharing) return;
              setSharing(true);
              try {
                const token = localStorage.getItem('token');
                if (!token) { showToast('Please sign in first', 'error'); return; }
                
                showToast('Checking LinkedIn connection...', 'info');
                
                // Step 1: Check if LinkedIn connected
                const statusRes = await fetch('https://threatready-db.onrender.com/api/linkedin/status', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const statusData = await statusRes.json();
                
                // Step 2: If NOT connected, open LinkedIn OAuth
                if (!statusData.connected) {
                  const authRes = await fetch('https://threatready-db.onrender.com/api/linkedin/auth', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const authData = await authRes.json();
                  
                  if (!authData.auth_url) { showToast('Failed to start LinkedIn connection', 'error'); return; }
                  
                  // Open OAuth popup
                  const popup = window.open(authData.auth_url, 'linkedin-oauth', 'width=600,height=700');
                  
                  // Wait for popup to close (user authorizes)
                  showToast('Waiting for LinkedIn authorization...', 'info');
                  await new Promise((resolve) => {
                    const interval = setInterval(() => {
                      if (popup.closed) { clearInterval(interval); resolve(); }
                    }, 500);
                  });
                  
                  // Re-check status
                  const recheckRes = await fetch('https://threatready-db.onrender.com/api/linkedin/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const recheckData = await recheckRes.json();
                  if (!recheckData.connected) { showToast('LinkedIn connection cancelled', 'error'); return; }
                  showToast('✅ LinkedIn connected! Generating post...', 'success');
                }
                
                // Step 3: Generate score image
                const role = ROLES.find(r => r.id === activeRole)?.name || activeRole;
                const score = results.overall_score;
                const badge = results.badge;
                const percentile = 100 - results.percentile;
                
                const canvas = document.createElement('canvas');
                canvas.width = 1200;
                canvas.height = 630;
                const ctx = canvas.getContext('2d');
                
                const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
                gradient.addColorStop(0, '#0a0e1a');
                gradient.addColorStop(1, '#1a1f2e');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1200, 630);
                
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 4;
                ctx.strokeRect(20, 20, 1160, 590);
                
                ctx.fillStyle = '#00e5ff';
                ctx.font = 'bold 38px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ THREATREADY', 600, 100);
                
                ctx.fillStyle = '#8890b0';
                ctx.font = '16px Arial';
                ctx.fillText('CYBERSECURITY ASSESSMENT', 600, 130);
                
                const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#ffab40' : '#ff5252';
                ctx.fillStyle = scoreColor;
                ctx.font = 'bold 200px Arial';
                ctx.fillText(`${score}`, 600, 340);
                
                ctx.fillStyle = '#8890b0';
                ctx.font = '32px Arial';
                ctx.fillText('/ 10', 600, 380);
                
                const badgeColor = badge === 'Platinum' ? '#e2e8f0' : badge === 'Gold' ? '#f59e0b' : badge === 'Silver' ? '#94a3b8' : '#cd7f32';
                ctx.fillStyle = badgeColor;
                ctx.font = 'bold 36px Arial';
                ctx.fillText(`🏅 ${badge.toUpperCase()} BADGE`, 600, 440);
                
                ctx.fillStyle = '#e8eaf6';
                ctx.font = '24px Arial';
                ctx.fillText(role, 600, 490);
                
                ctx.fillStyle = '#00e5ff';
                ctx.font = 'bold 22px Arial';
                ctx.fillText(`Top ${percentile}% of all candidates`, 600, 530);
                
                ctx.fillStyle = '#5a6380';
                ctx.font = '16px Arial';
                ctx.fillText('threatready.io', 600, 590);
                
                const imageBase64 = canvas.toDataURL('image/png');
                
                // Step 4: Post to LinkedIn via backend
                showToast('Posting to LinkedIn...', 'info');
                const text = `🎯 Just scored ${score}/10 on a ${role} cybersecurity assessment on ThreatReady!\n\n` +
                  `🏅 Badge: ${badge}\n` +
                  `📊 Top ${percentile}% of all candidates\n\n` +
                  `Practice your cybersecurity skills at https://threatready.io/\n\n` +
                  `#Cybersecurity #ThreatReady #InfoSec`;
                
                const shareRes = await fetch('https://threatready-db.onrender.com/api/linkedin/share', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ text, image_base64: imageBase64 })
                });
                const shareData = await shareRes.json();
                
                if (shareData.success) {
                  setPostedSuccess(true);
                } else {
                  showToast('❌ ' + (shareData.error || 'Share failed'), 'error');
                }

              } catch (e) {
                console.error('LinkedIn share error:', e);
                showToast('❌ ' + e.message, 'error');
              } finally {
                setSharing(false);
              }
            }}>
            📤 Share Score on LinkedIn
          </button>

        </div>

        {!isPaid && isTrialExhausted() && (
          <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14 }} onClick={() => setView("trial-complete")}>
            🔓 View Subscription Options →
          </button>
        )}

      </div></div>
      
      {/* LinkedIn Post Success Modal */}
      {postedSuccess && (
        <div onClick={() => setPostedSuccess(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0f1420", border: "2px solid var(--ok)", borderRadius: 16,
            padding: 32, maxWidth: 420, width: "100%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 60px rgba(0,224,150,0.3)"
          }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "var(--ok)" }}>
              Posted to LinkedIn!
            </div>
            <div style={{ fontSize: 14, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.6 }}>
              Your cybersecurity score has been shared on your LinkedIn feed. 
              Check your profile to see the post!
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn bs" style={{ flex: 1, padding: "10px" }}
                onClick={() => setPostedSuccess(false)}>
                Close
              </button>
              <button className="btn bp" style={{ flex: 1, padding: "10px" }}
                onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')}>
                View on LinkedIn →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}