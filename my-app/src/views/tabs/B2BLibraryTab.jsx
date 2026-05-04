// ═══════════════════════════════════════════════════════════════
// B2B LIBRARY TAB - Saved assessments list with Preview/Edit
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
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
  // ── Preview / Edit modal state ──
  const [previewAssessment, setPreviewAssessment] = useState(null);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [savingPreview, setSavingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const openPreview = (a) => {
    const qs = Array.isArray(a.questions) ? a.questions : [];
    setEditedQuestions(qs.map(q => ({ ...q })));
    setPreviewAssessment(a);
    setPreviewError(null);
  };

  const closePreview = () => {
    setPreviewAssessment(null);
    setEditedQuestions([]);
    setPreviewError(null);
  };

  const updateQuestionText = (idx, newText) => {
    setEditedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question: newText } : q));
  };

  const saveQuestions = async () => {
    if (!previewAssessment) return;
    const hasEmpty = editedQuestions.some(q => !q.question || !q.question.trim());
    if (hasEmpty) {
      setPreviewError("All questions must have content. Please fill in any empty questions.");
      return;
    }
    setSavingPreview(true);
    setPreviewError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://threatready-db.onrender.com/api/b2b/assessments/${previewAssessment.id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ questions: editedQuestions })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Questions updated successfully!', 'success');
        loadB2bData();
        closePreview();
      } else {
        setPreviewError(data.error || 'Update failed');
      }
    } catch (e) {
      setPreviewError(e.message || 'Network error');
    } finally {
      setSavingPreview(false);
    }
  };

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                {ROLES.find(r => r.id === a.role_id)?.name || a.role_id} · {a.difficulty} · {a.total_candidates || 0} candidates · {a.created_at?.substring(0, 10)}
              </div>
              {a.questions?.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 4 }}>✅ {a.questions.length} questions generated</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="btn bs" style={{ fontSize: 11, padding: "4px 8px" }}
                disabled={!(a.questions?.length > 0)}
                onClick={() => openPreview(a)}>
                👁 Preview
              </button>
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

      {/* ── Preview / Edit Modal ── */}
      {previewAssessment && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closePreview(); }}
        >
          <div style={{
            background: "#0f1420",
            border: "1px solid var(--ac)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 760,
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 80px rgba(0,0,0,.9), 0 0 40px rgba(0,229,255,0.18)"
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #1e2536",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0a0e1a",
              flexShrink: 0
            }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ac)", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
                  PREVIEW &amp; EDIT QUESTIONS
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx1)" }}>
                  {previewAssessment.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>
                  {ROLES.find(r => r.id === previewAssessment.role_id)?.name || previewAssessment.role_id} · {previewAssessment.difficulty} · {editedQuestions.length} question{editedQuestions.length === 1 ? '' : 's'}
                </div>
              </div>
              <button
                className="btn bs"
                style={{ fontSize: 14, padding: "4px 10px" }}
                onClick={closePreview}
                disabled={savingPreview}
              >✕</button>
            </div>

            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              {editedQuestions.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "var(--tx2)", fontSize: 13 }}>
                  No questions found in this assessment.
                </div>
              ) : (
                editedQuestions.map((q, idx) => (
                  <div key={idx} style={{
                    background: "rgba(0,229,255,0.03)",
                    border: "1px solid rgba(0,229,255,0.12)",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 12
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                      flexWrap: "wrap",
                      gap: 6
                    }}>
                      <div style={{ fontSize: 11, color: "var(--ac)", fontWeight: 700, letterSpacing: 1 }}>
                        QUESTION {idx + 1}
                      </div>
                      {q.category && (
                        <div style={{ fontSize: 10, color: "var(--tx2)", padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                          {q.category}
                        </div>
                      )}
                    </div>
                    <textarea
                      className="input"
                      value={q.question || ''}
                      onChange={(e) => updateQuestionText(idx, e.target.value)}
                      placeholder="Enter the question..."
                      style={{
                        minHeight: 80,
                        fontSize: 13,
                        width: "100%",
                        resize: "vertical",
                        lineHeight: 1.5
                      }}
                    />
                  </div>
                ))
              )}

              {previewError && (
                <div style={{
                  background: "rgba(255,82,82,0.1)",
                  border: "1px solid rgba(255,82,82,0.3)",
                  borderRadius: 8,
                  padding: 10,
                  color: "#ff5252",
                  fontSize: 12,
                  marginTop: 4
                }}>
                  ⚠ {previewError}
                </div>
              )}
            </div>

            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid #1e2536",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              background: "#0a0e1a",
              flexWrap: "wrap"
            }}>
              <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                ℹ Edits affect future invites only — already invited candidates keep their original questions.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn bs"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={closePreview}
                  disabled={savingPreview}
                >Cancel</button>
                <button
                  className="btn bp"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={saveQuestions}
                  disabled={savingPreview || editedQuestions.length === 0}
                >
                  {savingPreview ? '⟳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
