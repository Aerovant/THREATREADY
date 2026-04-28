// ═══════════════════════════════════════════════════════════════
// B2B LIBRARY TAB - Saved assessments list
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function B2BLibraryTab({
  assessments,
  b2bLoading,
  librarySearch,
  setLibrarySearch,
  setB2bTab,
  setInviteRole,
  setInviteDiff,
  setInviteAssessmentId,
  loadB2bData,
  filterBySearch,
  showConfirm,
}) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div className="lbl">SAVED ASSESSMENTS ({filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).length})</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
          <input className="input" type="text" placeholder="🔍 Search name or date..."
            value={librarySearch} onChange={e => setLibrarySearch(e.target.value)}
            style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
          {librarySearch && (
            <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setLibrarySearch('')}>✕</button>
          )}
        </div>
        <button className="btn bp" style={{ fontSize: 13, padding: "6px 14px" }}
          onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>
          + New Assessment
        </button>
      </div>
      {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
      {assessments.length === 0 && !b2bLoading && (
        <div className="card fadeUp" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No saved assessments yet</div>
          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>Create an assessment and it will appear here.</div>
          <button className="btn bp" style={{ fontSize: 12, padding: "10px 24px" }}
            onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>
            Create First Assessment →
          </button>
        </div>
      )}
      {assessments.length > 0 && filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).length === 0 && (
        <div className="card fadeUp" style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>
          No assessments match "{librarySearch}"
        </div>
      )}
      {filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).map((a, i) => (
        <div key={a.id} className="card card-glow fadeUp" style={{ padding: 14, marginBottom: 10, animationDelay: `${i * .04}s` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                {ROLES.find(r => r.id === a.role_id)?.name || a.role_id} · {a.difficulty} · {a.total_candidates || 0} candidates · {a.created_at?.substring(0, 10)}
              </div>
              {a.questions?.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 4 }}>✅ {a.questions.length} questions generated</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn bs" style={{ fontSize: 11, padding: "4px 8px" }}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`https://threatready-db.onrender.com/api/b2b/assessments/${a.id}/duplicate`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const data = await res.json();
                  if (data.assessment) { loadB2bData(); showToast('Assessment duplicated!', 'success'); }
                  else showToast('Duplicate failed', 'error');
                }}>Duplicate</button>
              <button className="btn bp" style={{ fontSize: 11, padding: "4px 8px" }}
                onClick={() => {
                  setInviteRole(a.role_id); setInviteDiff(a.difficulty);
                  setInviteAssessmentId(String(a.id));
                  setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates');
                  setTimeout(() => document.getElementById('invite-email-input')?.focus(), 300);
                  showToast(`Linked to "${a.name}" (${a.question_count || 5} questions). Enter email to invite.`, 'info');
                }}>Invite →</button>
              <button className="btn bs" style={{ fontSize: 11, padding: "4px 8px", color: "var(--dn)", borderColor: "var(--dn)" }}
                onClick={() => {
                  showConfirm(`Delete "${a.name}"? This cannot be undone.`, async () => {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`https://threatready-db.onrender.com/api/b2b/assessments/${a.id}`, {
                      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) { loadB2bData(); showToast('Assessment deleted.', 'success'); }
                    else showToast('Delete failed: ' + (data.error || 'Error'), 'error');
                  });
                }}>🗑 Delete</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}