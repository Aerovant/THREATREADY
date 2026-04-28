// ═══════════════════════════════════════════════════════════════
// DIFFICULTY VIEW
// Pick difficulty level (Beginner/Intermediate/Advanced/Expert) for chosen role
// Extracted from App.jsx lines 2455-2524 (70 lines)
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES, DIFFICULTIES, SCENARIOS } from "../constants.js";
import HomeBtn from "../components/HomeBtn.jsx";

export default function DifficultyView({
  // ── STATE ──
  activeRole,
  isPaid,
  user,
  // ── SETTERS ──
  setView,
  setDashTab,
  setAuthMode,
  // ── HANDLERS ──
  goHome,
  getRemainingAttempts,
  startScenario,
}) {
  const role = ROLES.find(r => r.id === activeRole);
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <HomeBtn goHome={goHome} />
      <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
        <div className="fadeUp" style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 48 }}>{role?.icon}</span>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{role?.name}</h2>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>Select difficulty level</p>
          {!isPaid && (
            <div style={{ fontSize: 13, color: "var(--wn)", marginTop: 8 }}>
              ⚠️ Free trial: {getRemainingAttempts(activeRole)} attempt{getRemainingAttempts(activeRole) !== 1 ? "s" : ""} remaining for {ROLES.find(r => r.id === activeRole)?.name} (Beginner only)
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {DIFFICULTIES.map((d, i) => {
            // In free trial: ONLY beginner unlocked. Paid: all levels unlocked
            const locked = !isPaid && d.id !== "beginner";
            const trialExhausted = !isPaid && d.id === "beginner" && getRemainingAttempts(activeRole) === 0;
            const disabled = locked || trialExhausted;
            return (
              <div key={d.id} className={`card fadeUp ${disabled ? "" : "card-glow"}`}
                style={{ padding: 20, textAlign: "center", animationDelay: `${i * .08}s`, opacity: disabled ? 0.6 : 1, cursor: locked ? "default" : (disabled ? "not-allowed" : "pointer"), borderColor: disabled ? "var(--bd)" : d.color + "40" }}
                onClick={() => {
                  if (locked) return; // button inside handles this
                  if (trialExhausted) { setView("trial-complete"); return; }
                  const scs = SCENARIOS[activeRole];
                  if (scs?.length) startScenario(scs[Math.floor(Math.random() * scs.length)], d.id);
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{d.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>{d.questions} adaptive questions · {d.time}</div>
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                  Hints: {d.hints === true ? "Full" : d.hints === "reduced" ? "Reduced" : d.hints === "minimal" ? "Minimal" : "None"}
                </div>
                {locked && (
                  <button
                    className="btn bp"
                    style={{ marginTop: 12, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        // Save current view so Back button on auth page returns here
                        localStorage.setItem('cyberprep_prev_view', 'difficulty');
                        // Free trial guest → send to signup
                        setAuthMode("signup");
                        setView("auth");
                      } else {
                        // Logged in but not paid → send to Billing tab
                        setView("dashboard");
                        setDashTab("billing");
                      }
                    }}>
                    🔒 Subscribe to Unlock
                  </button>
                )}
                {trialExhausted && <div style={{ fontSize: 12, color: "var(--dn)", marginTop: 8 }}>⚠️ No attempts left — subscribe</div>}
                {!locked && !trialExhausted && !isPaid && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 8 }}>🆓 {getRemainingAttempts(activeRole)} free attempt{getRemainingAttempts(activeRole) !== 1 ? "s" : ""} left</div>}
                {!locked && !trialExhausted && isPaid && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 8 }}>🔓 Unlocked</div>}
              </div>
            );
          })}
        </div>
      </div></div>
    </div>
  );
}
