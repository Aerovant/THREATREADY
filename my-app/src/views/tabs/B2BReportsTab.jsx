// ═══════════════════════════════════════════════════════════════
// B2B REPORTS TAB - Hiring + Team Skills + Benchmark CSV reports
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function B2BReportsTab({ candidates }) {
  return (
    <>
      <div className="lbl" style={{ marginBottom: 12 }}>ASSESSMENT REPORTS</div>

      {/* Hiring Report */}
      <div className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📊 Hiring Report</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Top candidates ranked with scorecards</div>
          </div>
          <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => {
              const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
              if (completed.length === 0) { showToast('No completed assessments to report yet.', 'warning'); return; }
              const rows = completed
                .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
                .map((c, i) => {
                  const score = parseFloat(c.overall_score || 0);
                  const badge = score >= 8 ? 'Platinum' : score >= 7 ? 'Gold' : score >= 6 ? 'Silver' : score >= 4 ? 'Bronze' : 'Not Ready';
                  const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id;
                  return `${i + 1},${c.candidate_name || c.candidate_email},${c.candidate_email},${role},${c.difficulty},${score}/10,${badge},${c.completed_at?.substring(0, 10) || ''}`;
                });
              const csv = ['Rank,Name,Email,Role,Difficulty,Score,Badge,Completed Date', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `hiring-report-${new Date().toISOString().substring(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showToast('Hiring report downloaded!', 'success');
            }}>
            Download CSV
          </button>
        </div>
        {candidates.filter(c => c.status === 'completed').length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>TOP CANDIDATES</div>
            {candidates
              .filter(c => c.status === 'completed' && c.overall_score)
              .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
              .slice(0, 3)
              .map((c, i) => {
                const score = parseFloat(c.overall_score || 0);
                return (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--bd)' : 'none', fontSize: 13 }}>
                    <span><span style={{ color: 'var(--ac)', fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>{c.candidate_name || c.candidate_email}</span>
                    <span className="mono" style={{ fontWeight: 700, color: score >= 7 ? 'var(--ok)' : score >= 5 ? 'var(--wn)' : 'var(--dn)' }}>{score.toFixed(1)}/10</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Team Skills Report */}
      <div className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, animationDelay: "0.05s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>🏢 Team Skills Report</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Skill gap analysis across all candidates</div>
          </div>
          <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => {
              if (candidates.length === 0) { showToast('No candidates data yet.', 'warning'); return; }
              const roleGroups = {};
              candidates.filter(c => c.status === 'completed' && c.overall_score).forEach(c => {
                const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id || 'Unknown';
                if (!roleGroups[role]) roleGroups[role] = [];
                roleGroups[role].push(parseFloat(c.overall_score));
              });
              const rows = Object.entries(roleGroups).map(([role, scores]) => {
                const avg = (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
                return `${role},${scores.length},${avg}/10,${Math.max(...scores).toFixed(1)}/10,${Math.min(...scores).toFixed(1)}/10`;
              });
              const csv = ['Role,Candidates,Avg Score,Best,Lowest', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `team-skills-${new Date().toISOString().substring(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showToast('Team skills report downloaded!', 'success');
            }}>
            Download CSV
          </button>
        </div>
      </div>

      {/* Benchmark Report */}
      <div className="card card-glow fadeUp" style={{ padding: 16, animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📈 Benchmark Report</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Your candidates vs. industry average (7.2/10)</div>
          </div>
          <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => {
              const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
              if (completed.length === 0) { showToast('No completed assessments yet.', 'warning'); return; }
              const INDUSTRY_AVG = 7.2;
              const rows = completed.map(c => {
                const score = parseFloat(c.overall_score || 0);
                const diff = (score - INDUSTRY_AVG).toFixed(1);
                const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id;
                return `${c.candidate_name || c.candidate_email},${role},${score}/10,${INDUSTRY_AVG}/10,${score >= INDUSTRY_AVG ? '+' + diff : diff} vs avg`;
              });
              const csv = ['Candidate,Role,Score,Industry Avg,Benchmark', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `benchmark-${new Date().toISOString().substring(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showToast('Benchmark report downloaded!', 'success');
            }}>
            Download CSV
          </button>
        </div>
        {candidates.filter(c => c.status === 'completed' && c.overall_score).length > 0 && (() => {
          const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
          const avgScore = completed.reduce((s, c) => s + parseFloat(c.overall_score || 0), 0) / completed.length;
          const INDUSTRY_AVG = 7.2;
          const aboveAvg = completed.filter(c => parseFloat(c.overall_score) >= INDUSTRY_AVG).length;
          return (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[["Your Avg", avgScore.toFixed(1) + "/10", avgScore >= INDUSTRY_AVG ? "var(--ok)" : "var(--dn)"],
                ["Industry", "7.2/10", "var(--ac)"],
                ["Above Avg", aboveAvg + "/" + completed.length, "var(--wn)"]
                ].map(([l, v, c], i) => (
                  <div key={i} className="statbox" style={{ padding: 10 }}>
                    <div className="statval" style={{ color: c, fontSize: 14 }}>{v}</div>
                    <div className="statlbl">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}