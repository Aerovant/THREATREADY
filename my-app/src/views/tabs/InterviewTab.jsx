// ═══════════════════════════════════════════════════════════════
// INTERVIEW TAB (Dashboard - Interview Simulation Mode + 5 Practice Modules)
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";
import ArchitectDefend from "./modules/ArchitectDefend.jsx";
import IncidentSim from "./modules/IncidentSim.jsx";
import ThreatBrief from "./modules/ThreatBrief.jsx";
import ThreatHunt from "./modules/ThreatHunt.jsx";
import VulnVerdict from "./modules/VulnVerdict.jsx";

// Definitions for the 5 practice modules
const PRACTICE_MODULES = [
  {
    id: "architectdefend",
    name: "Architect & Defend",
    desc: "Design a secure architecture for a real-world scenario. Place components, justify decisions.",
    icon: "🏛️",
    color: "#3b82f6",
    component: ArchitectDefend,
  },
  {
    id: "incidentsim",
    name: "Incident Simulator",
    desc: "Multi-stage incident response. React under pressure as the on-call commander.",
    icon: "🚨",
    color: "#ef4444",
    component: IncidentSim,
  },
  {
    id: "threatbrief",
    name: "Threat Brief",
    desc: "Communicate a security incident to the Board, CEO, Media, or Customers — under time pressure.",
    icon: "📢",
    color: "#a855f7",
    component: ThreatBrief,
  },
  {
    id: "threathunt",
    name: "Threat Hunt",
    desc: "Hunt through CloudTrail, VPC Flow, DNS, and WAF logs to find the attack timeline.",
    icon: "🔍",
    color: "#22c55e",
    component: ThreatHunt,
  },
  {
    id: "vulnverdict",
    name: "Vuln Verdict",
    desc: "Prioritize 12 real vulnerabilities under a strict 40-point budget. Defend your reasoning.",
    icon: "⚖️",
    color: "#f59e0b",
    component: VulnVerdict,
  },
];

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
  // Track which module (if any) is currently open
  const [activeModule, setActiveModule] = useState(null);

  // ── If a module is open, render only that module + a back button ──
  if (activeModule) {
    const mod = PRACTICE_MODULES.find(m => m.id === activeModule);
    if (mod) {
      const ModuleComponent = mod.component;
      return (
        <div className="fadeUp">
          <button
            className="btn bs"
            style={{ marginBottom: 12, fontSize: 12, padding: "6px 14px" }}
            onClick={() => setActiveModule(null)}
          >
            ← Back to Practice Modules
          </button>
          <ModuleComponent />
        </div>
      );
    }
  }

  return (
    <div className="fadeUp">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* PRACTICE MODULES — Available to everyone, no subscription needed */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="lbl" style={{ marginBottom: 4 }}>PRACTICE MODULES</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Hands-on Security Practice</h3>
        <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16, lineHeight: 1.6 }}>
          Choose a module below to practice real-world security scenarios. Each module simulates a different aspect of working as a security professional.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {PRACTICE_MODULES.map((mod, i) => (
            <div
              key={mod.id}
              className="card card-glow fadeUp"
              style={{
                padding: 16,
                cursor: "pointer",
                borderTop: `3px solid ${mod.color}`,
                transition: "all .2s",
                animationDelay: `${i * 0.05}s`,
              }}
              onClick={() => setActiveModule(mod.id)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{mod.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: mod.color }}>
                {mod.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10 }}>
                {mod.desc}
              </div>
              <div style={{
                fontSize: 11,
                color: mod.color,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}>
                START PRACTICE →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ATTACK REASONING LAB (existing Interview Simulation) */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* NOT SUBSCRIBED — show lock screen */}
      {subscribedRoles.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Attack Reasoning Lab is a Premium Feature</h3>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8, lineHeight: 1.8 }}>
            Subscribe to a role to unlock the Attack Reasoning Lab.<br />
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
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Attack Reasoning Lab</h3>
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
