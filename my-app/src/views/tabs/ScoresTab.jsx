// ═══════════════════════════════════════════════════════════════
// SCORES TAB (Dashboard - Score History Chart + Weakness Tracker)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ROLES } from "../../constants.js";

export default function ScoresTab({
  user,
  completedScenarios,
  localSessionHistory,
  scoreHistory,
  weaknessTracker,
  setDashTab,
}) {
  return (
    <>
      <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
        {(completedScenarios.length === 0 && localSessionHistory.length === 0) ? (
          <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Scores Yet</h3>
            <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
              Complete your first interview to start seeing performance data, score trends, and skill benchmarks here.
            </p>
            <button className="btn bp" style={{ padding: "10px 28px" }} onClick={() => { setDashTab("interview"); localStorage.setItem('cyberprep_tab', 'interview'); }}>
              Start an Interview →
            </button>
          </div>
        ) : (<>
          <div className="lbl" style={{ marginBottom: 12 }}>SCORE TRENDS</div>
          <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
            {scoreHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tx2)", fontSize: 12 }}>
                No assessments completed yet. Your score trends will appear here after your first attempt.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="date" tick={{ fill: "#8890b0", fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#8890b0", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #252b3b", borderRadius: 8 }} />
                  {(() => {
                    // Dynamically build lines for each role the user has attempted
                    const roleKeys = [...new Set(scoreHistory.flatMap(d => Object.keys(d).filter(k => k !== 'date')))];
                    const colors = { cloud: "#00d4ff", devsecops: "#ff6b35", appsec: "#a855f7", netsec: "#00e096", dfir: "#ffab40", grc: "#ff5252", prodsec: "#ffc107", secarch: "#9c27b0", soc: "#2196f3", threat: "#e91e63", red: "#f44336", blue: "#4caf50" };
                    return roleKeys.map(key => (
                      <Line key={key} type="monotone" dataKey={key} stroke={colors[key] || "#00d4ff"} strokeWidth={2} dot={{ r: 4 }} name={ROLES.find(r => r.id === key)?.name || key} connectNulls />
                    ));
                  })()}
                </LineChart>
              </ResponsiveContainer>
            )}
            {scoreHistory.length === 1 && (
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 8, textAlign: "center" }}>
                💡 Complete more assessments to see trends over time
              </div>
            )}
          </div>
          <div className="lbl" style={{ marginBottom: 8 }}>WEAKNESS TRACKER</div>
          <div className="card fadeUp" style={{ padding: 16 }}>
            {weaknessTracker.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--tx2)", fontSize: 12 }}>
                Complete assessments across different roles to see your strengths and weaknesses.
              </div>
            ) : weaknessTracker.map((w, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < weaknessTracker.length - 1 ? "1px solid var(--bd)" : "none" }}>
                <span style={{ fontSize: 12 }}>{w.area} <span style={{ fontSize: 11, color: "var(--tx2)" }}>({w.attempts} attempt{w.attempts !== 1 ? "s" : ""})</span></span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 12, color: w.avg >= 7 ? "var(--ok)" : w.avg >= 5 ? "var(--wn)" : "var(--dn)" }}>{w.avg}/10</span>
                  <span style={{ fontSize: 14 }}>{w.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </>
  );
}