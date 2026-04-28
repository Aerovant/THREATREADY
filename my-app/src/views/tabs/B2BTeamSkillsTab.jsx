// ═══════════════════════════════════════════════════════════════
// B2B TEAM SKILLS TAB (HR Dashboard - Candidate Skill Scores Table)
// Extracted from App.jsx (B2B Dashboard) - Phase 4 step 3
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";

export default function B2BTeamSkillsTab({
  candidates,
  teamMembers,
  b2bLoading,
  teamSkillsSearch,
  setTeamSkillsSearch,
  setB2bTab,
  loadB2bData,
  filterBySearch,
}) {
  return (
    <>
      {candidates.filter(c => c.status === "completed" && c.overall_score).length === 0 ? (
        <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Scores Yet</h3>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
            Invite candidates and have them complete assessments to see scores here.
          </p>
          <button className="btn bp" style={{ padding: "10px 28px" }} onClick={() => { setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates'); }}>
            Invite Candidates →
          </button>
        </div>
      ) : (<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
          <div className="lbl">CANDIDATE SKILL SCORES ({filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).length})</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
            <input className="input" type="text" placeholder="🔍 Search name, email, or date..."
              value={teamSkillsSearch} onChange={e => setTeamSkillsSearch(e.target.value)}
              style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
            {teamSkillsSearch && (
              <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setTeamSkillsSearch('')}>✕</button>
            )}
          </div>
          <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={loadB2bData}>🔄 Refresh</button>
        </div>
        {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
        <div className="card fadeUp" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "10px 14px", background: "var(--s2)", fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, textTransform: "uppercase" }}>
            <span>Candidate</span><span style={{ textAlign: "center" }}>Role</span><span style={{ textAlign: "center" }}>Difficulty</span><span style={{ textAlign: "center" }}>Score</span><span style={{ textAlign: "center" }}>Badge</span>
          </div>
          {filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).length === 0 && teamSkillsSearch && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates match "{teamSkillsSearch}"</div>
          )}
          {filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).map((m, i) => {
            const score = m.score;
            const badge = score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready";
            const badgeColor = score >= 8 ? "#e2e8f0" : score >= 7 ? "#f59e0b" : score >= 6 ? "#94a3b8" : score >= 4 ? "#b45309" : "var(--dn)";
            const role = ROLES.find(r => r.id === m.role);
            return (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "12px 14px", borderTop: "1px solid var(--bd)", fontSize: 13, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>{m.completed_at?.substring(0, 10)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 16 }}>{role?.icon || "🔒"}</span>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>{role?.name || m.role}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span className={`diff diff-${m.difficulty}`} style={{ fontSize: 8 }}>{m.difficulty}</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: score >= 7 ? "var(--ok)" : score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                    {score.toFixed(1)}
                  </span>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>/10</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor }}>{badge}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card fadeUp" style={{ padding: 14, fontSize: 13, lineHeight: 1.8, color: "var(--tx2)" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>INSIGHTS</div>
          {teamMembers.filter(m => m.score >= 7).length > 0 && (
            <div>✅ <strong style={{ color: "var(--ok)" }}>{teamMembers.filter(m => m.score >= 7).length} candidate(s)</strong> scored 7+ — strong hires</div>
          )}
          {teamMembers.filter(m => m.score >= 5 && m.score < 7).length > 0 && (
            <div>⚡ <strong style={{ color: "var(--wn)" }}>{teamMembers.filter(m => m.score >= 5 && m.score < 7).length} candidate(s)</strong> scored 5–7 — needs more practice</div>
          )}
          {teamMembers.filter(m => m.score < 5).length > 0 && (
            <div>❌ <strong style={{ color: "var(--dn)" }}>{teamMembers.filter(m => m.score < 5).length} candidate(s)</strong> scored below 5 — not ready</div>
          )}
        </div>
      </>)}
    </>
  );
}