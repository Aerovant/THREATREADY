// ═══════════════════════════════════════════════════════════════
// PAGE 1: LANDING PAGE (Dynamic Hooks + Random Demo)
// Extracted from App.jsx lines 1693-1825 (138 lines)
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";
import NoPasteInput from "../components/NoPasteInput.jsx";

export default function LandingView({
  // ── STATE ──
  hookHeadline,
  hookSubline,
  demoQ,
  demoAnswer,
  demoScore,
  demoLoading,
  demoInputMode,
  demoVoice,
  // ── SETTERS ──
  setDemoAnswer,
  setDemoInputMode,
  setView,
  setAuthMode,
  setIsPaid,
  setFreeAttempts,
  setUser,
  setSubscribedRoles,
  setSelectedRoles,
  setTrialRoles,
  // ── HANDLERS ──
  runDemo,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="orb" style={{ width: 600, height: 600, background: "radial-gradient(circle,rgba(0,229,255,.15),transparent)", top: -200, right: 0 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(255,61,113,.1),transparent)", bottom: -100, left: 0 }} />
      <div className="page"><div className="cnt">
        {/* HERO */}
        <div className="hero fadeUp">
          <div className="lbl" style={{ marginBottom: 14 }}>ATTACK REASONING LAB</div>
          <h1>{hookHeadline}</h1>
          <p>A real-world cybersecurity assessment platform. Validate security decision-making through adaptive attack simulations. For engineers proving skills and hiring managers validating talent.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <button className="btn bp" onClick={() => {
              setIsPaid(false);
              setFreeAttempts(2);
              setUser(null);
              setSubscribedRoles([]);
              setSelectedRoles([]);
              setTrialRoles([]);
              localStorage.removeItem('token');
              localStorage.removeItem('cyberprep_user');
              localStorage.removeItem('cyberprep_usertype');
              localStorage.removeItem('cyberprep_freetrial');
              localStorage.removeItem('trialRoles');
              localStorage.removeItem('subscribedRoles');
              localStorage.removeItem('roleAttempts');
              setView("trial-role-select");
            }} style={{ fontSize: 18, padding: "18px 48px" }}>Start Free Trial</button>
            <button className="btn bs" onClick={() => { setAuthMode("login"); setView("auth"); }} style={{ fontSize: 15, padding: "14px 32px" }}>Sign In</button>
          </div>
        </div>

        {/* INSTANT DEMO */}
        <div className="card fadeUp" style={{ marginTop: 36, padding: 28, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="lbl" style={{ marginBottom: 8 }}>TRY A REAL ATTACK SCENARIO IN 2 MINUTES</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{hookSubline}</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>No signup required. Type or dictate your answer. Instant AI score.</div>
          </div>
          {!demoScore ? (
            <div>
              <div className="tag" style={{ marginBottom: 10 }}>{demoQ.ca}</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{demoQ.q}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button className={`btn ${demoInputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setDemoInputMode("text")}>✏️ Type</button>
                <button className={`btn ${demoInputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setDemoInputMode("voice")}>🎤 Dictate</button>
              </div>
              {demoInputMode === "text" ? (
                <NoPasteInput placeholder="Type your answer here..." value={demoAnswer} onChange={e => setDemoAnswer(e.target.value)} style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }} />
              ) : (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div className={`rec-ring ${demoVoice.recording ? "active" : ""}`}
                    onClick={demoVoice.recording ? demoVoice.stop : demoVoice.start}
                    style={{ margin: "0 auto 8px" }}>{demoVoice.recording ? "⏹" : "🎤"}</div>
                  <div style={{ fontSize: 12, color: demoVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                    {demoVoice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
                  </div>
                  {demoVoice.transcript && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6 }}>{demoVoice.transcript}</div>}
                </div>
              )}
              <button className="btn bp" style={{ width: "100%", padding: 11 }}
                disabled={demoLoading || (!(demoAnswer?.trim()) && !(demoVoice.transcript?.trim()))}
                onClick={runDemo}>
                {demoLoading ? <span className="loader" /> : "Get My Score →"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 48, fontWeight: 700, color: demoScore.score >= 7 ? "var(--ok)" : demoScore.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{demoScore.score}/10</div>
              <div className="tag" style={{ marginBottom: 8 }}>{demoScore.level}</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 14 }}>{demoScore.feedback}</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12 }}>Your full Skills Score (0-500) + benchmarking + role readiness badges require a free account.</div>
              <button className="btn bp" onClick={() => { setAuthMode("signup"); setView("auth"); }} style={{ padding: "10px 28px" }}>Create Free Account →</button>
            </div>
          )}
        </div>

        {/* BUSINESS VALUE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 28, textAlign: "center" }}>
          {[
            ["🎯 Replace 2-3 Interview Rounds", "Pre-validate attack reasoning. Companies save 20+ hours per hire."],
            ["🏗️ Real Architecture Reasoning", "Not theory. Not certifications. Real attack scenarios with real architectures."],
            ["📊 Team Skill Visibility", "CISOs see team gaps across security domains. Measurable improvement."]
          ].map(([t, d], i) => (
            <div key={i} className="card fadeUp" style={{ padding: 18, animationDelay: `${i * .05}s` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)", marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* TRUST SIGNALS */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--tx2)", letterSpacing: 2, fontWeight: 600 }}>TRUSTED BY 500+ SECURITY ENGINEERS</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 13, color: "var(--tx2)", flexWrap: "wrap", fontWeight: 500 }}>
            <span>Based on real CVEs</span><span>·</span>
            <span>MITRE ATT&CK mapped</span><span>·</span>
            <span>AI-powered evaluation</span><span>·</span>
            <span>Designed by security engineers</span>
          </div>
        </div>

        {/* ROLE GRID */}
        <div style={{ marginTop: 36 }}>
          <div className="lbl" style={{ textAlign: "center", marginBottom: 16 }}>12 SECURITY TRACKS · 4 DIFFICULTY LEVELS · ADAPTIVE AI</div>
          <div className="rgrid">
            {ROLES.map((r, i) => (
              <div key={r.id} className="card card-glow fadeUp" style={{ animationDelay: `${i * .04}s`, textAlign: "center", padding: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, fontWeight: 500 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 28 }}>
          {[["12", "Roles"], ["4", "Difficulty Levels"], ["0-500", "Skills Score"], ["AI", "Adaptive Questions"]].map(([v, l], i) => (
            <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .06}s` }}>
              <div className="statval" style={{ color: "var(--ac)" }}>{v}</div>
              <div className="statlbl">{l}</div>
            </div>
          ))}
        </div>
      </div></div>
    </div>
  );
}
