// ═══════════════════════════════════════════════════════════════
// BADGES TAB (Dashboard - Role badges + Milestones)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";

export default function BadgesTab({
  user,
  badges,
  completedScenarios,
  streak,
}) {
  return (
    <>
      <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
        <div className="lbl" style={{ marginBottom: 12 }}>YOUR BADGES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {ROLES.map(r => {
            const badge = badges.find(b => b.role === r.id);
            return (
              <div key={r.id} className="card fadeUp" style={{ padding: 16, textAlign: "center", opacity: badge ? 1 : 0.4 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                {badge ? (
                  <>
                    <div className="badge-card" style={{ marginTop: 8, fontSize: 8, padding: "4px 8px", borderColor: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32", color: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32" }}>
                      {badge.tier.toUpperCase()}
                    </div>
                    <button className="btn bs" style={{ marginTop: 8, fontSize: 8, padding: "3px 8px" }}>📤 Share</button>
                  </>
                ) : <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 8 }}>🔒 Not earned</div>}
              </div>
            );
          })}
        </div>
        <div className="lbl" style={{ marginTop: 20, marginBottom: 8 }}>MILESTONES</div>
        <div className="card fadeUp" style={{ padding: 16 }}>
          {[["🎯 First Scenario", completedScenarios.length >= 1], ["🔥 10 Scenarios", completedScenarios.length >= 10], ["🌟 All 12 Roles", false], ["💎 Expert Badge", false], ["📅 30-Day Streak", streak >= 30]].map(([m, done], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid var(--bd)" : "none" }}>
              <span style={{ fontSize: 12, color: done ? "var(--ok)" : "var(--tx2)" }}>{m}</span>
              <span style={{ fontSize: 12 }}>{done ? "✅" : "⬜"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}