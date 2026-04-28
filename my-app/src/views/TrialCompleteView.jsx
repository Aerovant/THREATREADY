// ═══════════════════════════════════════════════════════════════
// TRIAL COMPLETE VIEW
// Shown after 2 trial attempts are used — pushes user to subscribe
// Extracted from App.jsx lines 1918-1980 (63 lines)
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";

export default function TrialCompleteView({
  // ── STATE ──
  results,
  activeRole,
  user,
  // ── SETTERS ──
  setView,
  setDashTab,
  setAuthMode,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card fadeUp" style={{ maxWidth: 520, width: "90%", padding: 40, textAlign: "center", borderColor: "var(--ac)" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <div className="lbl" style={{ marginBottom: 8, color: "var(--ok)" }}>FREE TRIAL COMPLETE</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>You've Used All Your Free Attempts</h2>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>
            Sign up and subscribe to any roles you want — pick as many as you need.
          </p>

          {results && (
            <div style={{ background: "var(--s2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 4 }}>Last Assessment Score</div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                {results.overall_score}<span style={{ fontSize: 18, color: "var(--tx2)" }}>/10</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                {results.badge} · {ROLES.find(r => r.id === activeRole)?.name || activeRole}
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7, marginBottom: 24 }}>
            Subscribe to unlock <strong style={{ color: "var(--tx1)" }}>all 4 difficulty levels</strong> — Beginner, Intermediate, Advanced, Expert — for every role, with unlimited attempts and full performance tracking.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24, textAlign: "left" }}>
            {[
              ["🔓", "All 4 difficulty levels"],
              ["♾️", "Unlimited attempts"],
              ["📊", "Full score history"],
              ["🏅", "Verified badges"]
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>

          <button className="btn bp" style={{ width: "100%", padding: 16, fontSize: 15, marginBottom: 10 }}
            onClick={() => {
              if (user) {
                setDashTab("billing");
                setView("dashboard");
              } else {
                setAuthMode("signup");
                setView("auth");
              }
            }}>
            {user ? "Go to Subscription →" : "Create Account & Subscribe →"}
          </button>

          <button className="btn bs" style={{ width: "100%", padding: 12, fontSize: 12 }}
            onClick={() => setView("dashboard")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
