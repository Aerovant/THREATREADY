// ═══════════════════════════════════════════════════════════════
// B2B OVERVIEW TAB (HR Dashboard - Stats + Notifications + Quick Actions)
// Extracted from App.jsx (B2B Dashboard) - Phase 4 step 1
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";

export default function B2BOverviewTab({
  b2bStats,
  b2bLoading,
  candidates,
  setB2bTab,
}) {
  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          [b2bStats.total_candidates, "Candidates"],
          [b2bStats.assessed, "Assessed"],
          [b2bStats.total_assessments, "Assessments"],
          [b2bStats.avg_score || "—", "Avg Score"]
        ].map(([v, l], i) => (
          <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .05}s` }}>
            <div className="statval" style={{ color: "var(--ac)", fontSize: 20 }}>
              {b2bLoading ? <span className="loader" style={{ width: 14, height: 14 }} /> : v}
            </div>
            <div className="statlbl">{l}</div>
          </div>
        ))}
      </div>

      {/* HR NOTIFICATIONS */}
      <div className="lbl" style={{ marginBottom: 10 }}>🔔 NOTIFICATIONS</div>
      {(() => {
        const completed = candidates.filter(c => c.status === "completed");
        const inProgress = candidates.filter(c => c.status === "in_progress");
        const pending = candidates.filter(c => c.status === "not_started" || !c.status);
        if (completed.length === 0 && inProgress.length === 0 && pending.length === 0) {
          return (
            <div className="card fadeUp" style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--tx2)" }}>
              No notifications yet. Invite candidates to get started.
            </div>
          );
        }
        return (
          <div style={{ marginBottom: 20 }}>
            {completed.slice(0, 3).map((c, i) => (
              <div key={c.id} className="card fadeUp" style={{ padding: 14, marginBottom: 8, borderLeft: "3px solid var(--ok)", animationDelay: `${i * .04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)" }}>✅ {c.candidate_name || c.candidate_email?.split("@")[0]} completed assessment</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                      {ROLES.find(r => r.id === c.role_id)?.name || c.role_id} · Score: <strong style={{ color: c.overall_score >= 7 ? "var(--ok)" : c.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>{c.overall_score}/10</strong>
                    </div>
                  </div>
                  <button className="btn bs" style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => { setB2bTab("teamskills"); localStorage.setItem('cyberprep_b2btab', 'teamskills'); }}>
                    View →
                  </button>
                </div>
              </div>
            ))}
            {inProgress.slice(0, 2).map((c, i) => (
              <div key={c.id} className="card fadeUp" style={{ padding: 14, marginBottom: 8, borderLeft: "3px solid var(--wn)", animationDelay: `${i * .04}s` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wn)" }}>● {c.candidate_name || c.candidate_email?.split("@")[0]} is taking the assessment now</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>{ROLES.find(r => r.id === c.role_id)?.name || c.role_id}</div>
              </div>
            ))}
            {pending.length > 0 && (
              <div className="card fadeUp" style={{ padding: 14, borderLeft: "3px solid var(--tx3)" }}>
                <div style={{ fontSize: 12, color: "var(--tx2)" }}>⏳ <strong>{pending.length}</strong> candidate(s) haven't started yet</div>
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 16 }}>
        <button className="btn bp" onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>+ Create Assessment</button>
        <button className="btn bs" onClick={() => { setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates'); }}>Invite Candidates →</button>
      </div>
    </>
  );
}