// ═══════════════════════════════════════════════════════════════
// TRIAL ROLE SELECT VIEW
// Free Trial Entry — Pick exactly 1-2 roles for free trial
// Extracted from App.jsx lines 1830-1913 (84 lines)
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import { showToast } from "../components/helpers.js";
import ToastContainer from "../components/ToastContainer.jsx";

export default function TrialRoleSelectView({
  // ── STATE ──
  trialRoles,
  // ── SETTERS ──
  setTrialRoles,
  setRoleAttempts,
  setSubscribedRoles,
  setIsPaid,
  setView,
  setDashTab,
  // ── HANDLERS ──
  goBack,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <button className="home-btn" onClick={goBack}>← Back</button>
      <div className="page"><div className="cnt" style={{ paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="fadeUp">
          <div className="lbl" style={{ marginBottom: 10 }}>FREE TRIAL</div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Select 1 or 2 Roles to Try</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.7, maxWidth: 500, margin: "8px auto 0" }}>
            Pick 1 or 2 security roles. You'll get 2 beginner-level interview attempts — no credit card needed.
          </p>
          <div style={{ background: "rgba(0,229,255,.06)", border: "1px solid rgba(0,229,255,.2)", borderRadius: 10, padding: "10px 16px", marginTop: 14, fontSize: 13, color: "var(--ac)", display: "inline-block" }}>
            🎯 Beginner difficulty only &nbsp;·&nbsp; 2 total attempts &nbsp;·&nbsp; No signup to start
          </div>
        </div>

        <div className="rgrid">
          {ROLES.map((r, i) => {
            const sel = trialRoles.includes(r.id);
            const disabled = !sel && trialRoles.length >= 2;
            return (
              <div key={r.id} className={`sub-card fadeUp ${sel ? "sel" : ""}`}
                style={{
                  animationDelay: `${i * .04}s`,
                  borderColor: sel ? r.color : undefined,
                  opacity: disabled ? 0.3 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  pointerEvents: disabled ? "none" : "auto"
                }}
                onClick={() => setTrialRoles(p => sel ? p.filter(x => x !== r.id) : [...p, r.id])}>
                {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: r.color, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10, fontWeight: 500 }}>{r.desc}</div>
                <div className="tag" style={{ fontSize: 11 }}>Beginner Free</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          {trialRoles.length >= 1 && (
            <div className="card fadeUp" style={{ padding: 24, borderColor: "var(--ac)", maxWidth: 480, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {trialRoles.map(rid => {
                  const role = ROLES.find(r => r.id === rid);
                  return (
                    <div key={rid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,229,255,.06)", borderRadius: 20, border: "1px solid rgba(0,229,255,.2)" }}>
                      <span>{role?.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ac)" }}>{role?.name}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>
                {trialRoles.length} role{trialRoles.length > 1 ? "s" : ""} selected · Beginner difficulty · 2 total attempts
              </div>
              <button className="btn bp" style={{ width: "100%", padding: "14px 0", fontSize: 15 }}
                onClick={() => {
                  const init = {};
                  trialRoles.forEach(rid => { init[rid] = 0; });
                  setRoleAttempts(init);
                  setSubscribedRoles(trialRoles);
                  setIsPaid(false);
                  localStorage.setItem('subscribedRoles', JSON.stringify(trialRoles));
                  localStorage.setItem('trialRoles', JSON.stringify(trialRoles));
                  localStorage.setItem('roleAttempts', JSON.stringify(init));
                  localStorage.setItem('cyberprep_freetrial', 'true');
                  localStorage.setItem('cyberprep_usertype', 'b2c');
                  localStorage.setItem('cyberprep_session_start', Date.now().toString());
                  // CRITICAL: Clear any leftover isPaid flag from previous sessions
                  localStorage.removeItem('isPaid');
                  setView("dashboard");
                  setDashTab("home");
                  showToast("Free trial started! 2 total attempts on Beginner only.", "success");
                }}>
                Start Free Trial →
              </button>
            </div>
          )}
        </div>
      </div></div>
    </div>
  );
}
