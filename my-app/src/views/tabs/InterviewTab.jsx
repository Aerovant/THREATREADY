// ═══════════════════════════════════════════════════════════════
// INTERVIEW TAB (Dashboard - Interview Simulation Mode Setup)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function InterviewTab({
  subscribedRoles,
  activeRole,
  setActiveRole,
  interviewPersona,
  setInterviewPersona,
  isPaid,
  setDashTab,
  setView,
}) {
  return (
    <div className="fadeUp">
      {/* NOT SUBSCRIBED — show lock screen */}
      {subscribedRoles.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Interview Mode is a Premium Feature</h3>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8, lineHeight: 1.8 }}>
            Subscribe to a role to unlock Interview Simulation Mode.<br />
            Practice with an AI interviewer, get scored, and receive detailed feedback.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, margin: "20px 0", textAlign: "left" }}>
            {[
              ["🎯", "Role-specific questions"],
              ["🔄", "Adaptive AI follow-ups"],
              ["⏱️", "Real interview time pressure"],
              ["📊", "Detailed score & debrief"]
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>
          <button className="btn bp" style={{ padding: "14px 40px", fontSize: 14, marginTop: 8 }}
            onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
            Subscribe to Unlock →
          </button>
        </div>
      )}

      {/* SUBSCRIBED — show full interview mode */}
      {subscribedRoles.length > 0 && (<>
        <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Interview Simulation Mode</h3>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
            AI acts as your interviewer with adaptive follow-ups, time pressure, and detailed debrief.
          </p>

          {/* Persona Selection */}
          <div className="lbl" style={{ marginBottom: 10, textAlign: "left" }}>SELECT INTERVIEWER PERSONA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
            {[["🙂", "Friendly", "Encouraging but thorough", "friendly"],
            ["⚖️", "Standard", "Balanced and fair", "standard"],
            ["😤", "Tough", "Challenges everything", "tough"]
            ].map(([icon, label, desc, val]) => (
              <div key={val} onClick={() => setInterviewPersona(val)}
                className="card card-glow"
                style={{
                  padding: 16, cursor: "pointer", textAlign: "center",
                  borderColor: interviewPersona === val ? "var(--ac)" : "var(--bd)",
                  background: interviewPersona === val ? "rgba(0,229,255,.06)" : undefined,
                  transition: "all .2s"
                }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--tx2)" }}>{desc}</div>
                {interviewPersona === val && <div style={{ fontSize: 11, color: "var(--ac)", marginTop: 6, fontWeight: 700 }}>✓ SELECTED</div>}
              </div>
            ))}
          </div>

          {/* Subscribed Roles — all difficulties unlocked */}
          <div className="lbl" style={{ marginBottom: 10, textAlign: "left" }}>SELECT ROLE TO PRACTICE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 20 }}>
            {ROLES.filter(r => subscribedRoles.includes(r.id)).map(role => (
              <div key={role.id} onClick={() => setActiveRole(role.id)}
                className="card card-glow"
                style={{
                  padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  borderColor: activeRole === role.id ? "var(--ac)" : "var(--bd)",
                  background: activeRole === role.id ? "rgba(0,229,255,.06)" : undefined
                }}>
                <span style={{ fontSize: 26 }}>{role.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{role.name}</div>
                  <div style={{ fontSize: 11, color: activeRole === role.id ? "var(--ac)" : (isPaid ? "var(--ok)" : "var(--wn)"), marginTop: 2, fontWeight: 600 }}>
                    {activeRole === role.id ? "✓ SELECTED" : (isPaid ? "🔓 All levels unlocked" : "🔒 Beginner only · Subscribe to unlock all")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn bp"
            disabled={!activeRole}
            title={!activeRole ? "Please select a role first" : ""}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              cursor: !activeRole ? "not-allowed" : "pointer",
              opacity: !activeRole ? 0.5 : 1
            }}
            onClick={() => {
              if (!activeRole) { showToast('Please select a role first', 'warning'); return; }
              setView("difficulty", { role: activeRole });
            }}>
            {!activeRole ? "Select a role to continue" : `Start ${interviewPersona.charAt(0).toUpperCase() + interviewPersona.slice(1)} Interview →`}
          </button>
        </div>

        {/* What to expect */}
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>WHAT TO EXPECT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {[["🎯", "Role-specific questions", "Tailored to your subscribed role"],
            ["🔄", "Adaptive follow-ups", "AI digs deeper based on your answers"],
            ["⏱️", "Time pressure", "Simulates real interview conditions"],
            ["📊", "Detailed debrief", "Score, strengths, weaknesses, model answers"]
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--bd)" : "none" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>)}
    </div>
  );
}