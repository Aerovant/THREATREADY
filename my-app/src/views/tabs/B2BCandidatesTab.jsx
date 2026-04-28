// ═══════════════════════════════════════════════════════════════
// B2B CANDIDATES TAB (HR Dashboard - Invite + Manage Candidates)
// Extracted from App.jsx (B2B Dashboard) - Phase 4 step 2 (BIGGEST!)
// ═══════════════════════════════════════════════════════════════
import { ROLES, DIFFICULTIES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function B2BCandidatesTab({
  candidates,
  assessments,
  selectedCandidates,
  setSelectedCandidates,
  b2bLoading,
  inviteMode,
  setInviteMode,
  inviteEmail,
  setInviteEmail,
  inviteMultipleEmails,
  setInviteMultipleEmails,
  inviteCsvFile,
  setInviteCsvFile,
  inviteParsedEmails,
  setInviteParsedEmails,
  inviteAssessmentId,
  setInviteAssessmentId,
  inviteRole,
  setInviteRole,
  inviteDiff,
  setInviteDiff,
  inviteMsg,
  setInviteMsg,
  candidatesSearch,
  setCandidatesSearch,
  setReportModal,
  loadB2bData,
  filterBySearch,
  showConfirm,
}) {
  return (
    <>
      {/* ── INVITE CANDIDATE FORM ── */}
      <div className="card fadeUp" style={{ padding: 22, marginBottom: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
        <div className="lbl" style={{ marginBottom: 12 }}>📧 INVITE CANDIDATES</div>

        {/* Mode selector tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button className={`btn ${inviteMode === "individual" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("individual"); setInviteMsg(''); }}>👤 Individual</button>
          <button className={`btn ${inviteMode === "multiple" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("multiple"); setInviteMsg(''); }}>👥 Paste Multiple</button>
          <button className={`btn ${inviteMode === "csv" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("csv"); setInviteMsg(''); }}>📄 Upload CSV</button>
        </div>

        {/* MODE: Individual email */}
        {inviteMode === "individual" && (
          <input id="invite-email-input" className="input" type="email" placeholder="candidate@company.com"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ marginBottom: 10 }} />
        )}

        {/* MODE: Paste multiple emails */}
        {inviteMode === "multiple" && (
          <div style={{ marginBottom: 10 }}>
            <textarea className="input" placeholder={"Paste emails (one per line OR comma-separated)\n\nExample:\njohn@company.com\njane@company.com\nbob@company.com"}
              value={inviteMultipleEmails}
              onChange={e => setInviteMultipleEmails(e.target.value)}
              style={{ minHeight: 120, fontFamily: "monospace", fontSize: 13 }} />
            {inviteMultipleEmails.trim() && (() => {
              const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
              return (
                <div style={{ fontSize: 12, color: emails.length > 0 ? "var(--ok)" : "var(--wn)", marginTop: 6 }}>
                  {emails.length > 0 ? `✓ ${emails.length} valid email${emails.length !== 1 ? "s" : ""} detected` : "⚠️ No valid emails detected yet"}
                </div>
              );
            })()}
          </div>
        )}

        {/* MODE: CSV upload */}
        {inviteMode === "csv" && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ padding: 14, border: "1px dashed var(--bd)", borderRadius: 8, background: "var(--s2)", textAlign: "center" }}>
              <input type="file" id="csv-invite-upload" accept=".csv,.txt" style={{ display: "none" }}
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setInviteCsvFile(file);
                  const text = await file.text();
                  const emailRegex = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                  const matches = text.match(emailRegex) || [];
                  const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))];
                  setInviteParsedEmails(uniqueEmails);
                  setInviteMsg(uniqueEmails.length > 0 ? `✅ Found ${uniqueEmails.length} email${uniqueEmails.length !== 1 ? "s" : ""} in file` : '❌ No valid emails found in file');
                  setTimeout(() => setInviteMsg(''), 3000);
                }} />
              <label htmlFor="csv-invite-upload" style={{ cursor: "pointer", display: "inline-block" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: 12, color: "var(--tx)", fontWeight: 600 }}>
                  {inviteCsvFile ? inviteCsvFile.name : "Click to upload CSV"}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>
                  Any column with email addresses works · .csv or .txt
                </div>
              </label>
            </div>
            {inviteParsedEmails.length > 0 && (
              <div style={{ marginTop: 10, padding: 10, background: "rgba(0,224,150,.04)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 6, maxHeight: 120, overflowY: "auto" }}>
                <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700, marginBottom: 6 }}>
                  {inviteParsedEmails.length} EMAIL{inviteParsedEmails.length !== 1 ? "S" : ""} READY TO INVITE
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", fontFamily: "monospace", lineHeight: 1.6 }}>
                  {inviteParsedEmails.slice(0, 20).join(", ")}
                  {inviteParsedEmails.length > 20 && ` ... and ${inviteParsedEmails.length - 20} more`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assessment Selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ASSESSMENT (Optional — links to saved assessment)</div>
          <select className="input" value={inviteAssessmentId}
            onChange={e => {
              const id = e.target.value;
              setInviteAssessmentId(id);
              if (id) {
                const a = assessments.find(x => String(x.id) === String(id));
                if (a) {
                  setInviteRole(a.role_id);
                  setInviteDiff(a.difficulty);
                }
              }
            }}>
            <option value="">— Generate new questions (5 default) —</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} · {ROLES.find(r => r.id === a.role_id)?.name} · {a.difficulty} · {a.question_count || 5} Q
              </option>
            ))}
          </select>
          {inviteAssessmentId && (
            <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 4 }}>
              ✅ Candidates will receive the full set of questions from this assessment
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ROLE</div>
            <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} disabled={!!inviteAssessmentId}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>DIFFICULTY</div>
            <select className="input" value={inviteDiff} onChange={e => setInviteDiff(e.target.value)} disabled={!!inviteAssessmentId}>
              {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        {inviteMsg && (
          <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: inviteMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: inviteMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
            {inviteMsg}
          </div>
        )}
        <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 14 }}
          disabled={(() => {
            if (inviteMode === "individual") return !inviteEmail.trim();
            if (inviteMode === "multiple") {
              const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
              return emails.length === 0;
            }
            if (inviteMode === "csv") return inviteParsedEmails.length === 0;
            return true;
          })()}
          onClick={async () => {
            let emailsToSend = [];
            if (inviteMode === "individual") {
              if (!inviteEmail.trim()) return;
              emailsToSend = [inviteEmail.trim()];
            } else if (inviteMode === "multiple") {
              emailsToSend = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
              if (emailsToSend.length === 0) { setInviteMsg('❌ No valid emails found'); return; }
            } else if (inviteMode === "csv") {
              emailsToSend = inviteParsedEmails;
              if (emailsToSend.length === 0) { setInviteMsg('❌ Upload a CSV first'); return; }
            }

            setInviteMsg(`Sending invite${emailsToSend.length > 1 ? `s to ${emailsToSend.length} candidates` : ''}...`);
            try {
              const token = localStorage.getItem('token');
              const payload = { role_id: inviteRole, difficulty: inviteDiff };
              if (emailsToSend.length === 1) {
                payload.candidate_email = emailsToSend[0];
              } else {
                payload.candidate_emails = emailsToSend;
              }
              if (inviteAssessmentId) payload.assessment_id = parseInt(inviteAssessmentId);
              const res = await fetch('https://threatready-db.onrender.com/api/b2b/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (data.candidate || data.candidates) {
                const sentCount = data.candidates ? data.candidates.length : 1;
                setInviteMsg(`✅ Invite${sentCount > 1 ? `s` : ''} sent to ${sentCount} candidate${sentCount > 1 ? 's' : ''}`);
                setInviteEmail('');
                setInviteMultipleEmails('');
                setInviteCsvFile(null);
                setInviteParsedEmails([]);
                loadB2bData();
                setTimeout(() => setInviteMsg(''), 4000);
              } else {
                setInviteMsg('❌ ' + (data.error || 'Failed'));
              }
            } catch (e) { setInviteMsg('❌ ' + e.message); }
          }}>
          📧 {inviteMode === "individual" ? "Send Assessment Invite" :
            inviteMode === "multiple" ? `Send Invites to All${(() => {
              const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
              return emails.length > 0 ? ` (${emails.length})` : '';
            })()}` :
              `Send Invites to All${inviteParsedEmails.length > 0 ? ` (${inviteParsedEmails.length})` : ''}`}
        </button>
      </div>

      {/* ── ALL CANDIDATES TABLE ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="lbl">ALL CANDIDATES ({filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length})</div>
          {selectedCandidates.length > 0 && (
            <>
              <button className="btn" style={{ fontSize: 12, padding: "4px 10px", background: "rgba(0,224,150,.15)", border: "1px solid var(--ok)", color: "var(--ok)" }}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const selectedCompleted = candidates.filter(c => selectedCandidates.includes(c.id) && c.status === 'completed');
                  if (selectedCompleted.length === 0) {
                    showToast('No completed assessments in selection', 'error');
                    return;
                  }
                  showToast(`Generating ${selectedCompleted.length} PDF(s)...`, 'info');
                  for (const c of selectedCompleted) {
                    try {
                      const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (!data.candidate) continue;
                      const cand = data.candidate;
                      const score = parseFloat(cand.overall_score) || 0;
                      const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#f59e0b' : '#ff5252';
                      const badgeColor = score >= 8 ? '#e2e8f0' : score >= 7 ? '#f59e0b' : score >= 6 ? '#94a3b8' : score >= 4 ? '#cd7f32' : '#ff5252';
                      const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
                        score >= 7 ? "Strong candidate — recommended for next round" :
                          score >= 6 ? "Good candidate — consider for interview" :
                            score >= 5 ? "Average — more assessment needed" :
                              score >= 4 ? "Below expectations — not recommended" :
                                "Not ready — significant skill gaps";
                      const evals = cand.evaluations || [];
                      const strongCount = evals.filter(e => e.score >= 7).length;
                      const weakCount = evals.filter(e => e.score < 5).length;
                      const roleName = ROLES.find(r => r.id === cand.role_id)?.name || cand.role_id;
                      const escape = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report - ${escape(cand.name)}</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
.header { border-bottom: 3px solid #00b8d4; padding-bottom: 16px; margin-bottom: 24px; }
.brand { color: #00b8d4; font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
.subtitle { color: #666; font-size: 11px; margin-bottom: 12px; }
h1 { font-size: 20px; margin: 0 0 6px 0; }
.meta { color: #666; font-size: 12px; }
.score-card { background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%); color: #fff; padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0; }
.score-label { font-size: 11px; color: #8890b0; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px; }
.score-value { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; margin-bottom: 8px; }
.score-max { font-size: 22px; color: #8890b0; }
.badge { display: inline-block; border: 2px solid ${badgeColor}; color: ${badgeColor}; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 2px; margin: 12px 0; }
.verdict { font-size: 13px; color: ${scoreColor}; font-weight: 600; margin-top: 8px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
.stat { background: #f5f7fa; padding: 12px; border-radius: 8px; text-align: center; }
.stat-label { font-size: 9px; color: #666; letter-spacing: 1px; margin-bottom: 4px; font-weight: 700; }
.stat-val { font-size: 13px; font-weight: 700; }
.summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
.sum-box { padding: 14px; border-radius: 10px; border: 1px solid; }
.sum-strong { background: #e6faf1; border-color: #00c48a; }
.sum-weak { background: #fff0f0; border-color: #ff5252; }
.sum-count { font-size: 26px; font-weight: 900; }
.sum-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
.sum-desc { font-size: 10px; color: #666; margin-top: 2px; }
.section-title { font-size: 13px; color: #00b8d4; font-weight: 700; letter-spacing: 2px; margin: 28px 0 14px; text-transform: uppercase; border-bottom: 2px solid #00b8d4; padding-bottom: 6px; }
.q-block { margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #ccc; page-break-inside: avoid; }
.q-block.good { border-left-color: #00c48a; }
.q-block.avg { border-left-color: #f59e0b; }
.q-block.bad { border-left-color: #ff5252; }
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
.q-num { font-size: 10px; color: #666; font-weight: 700; letter-spacing: 1px; }
.q-score { font-size: 14px; font-weight: 900; }
.q-question { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.q-answer { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid #999; font-size: 11px; margin-bottom: 10px; color: #333; }
.q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
.q-str { background: #e6faf1; padding: 8px; border-radius: 6px; border-left: 3px solid #00c48a; font-size: 11px; margin-bottom: 6px; color: #1a5f3f; }
.q-wk { background: #fff0f0; padding: 8px; border-radius: 6px; border-left: 3px solid #ff5252; font-size: 11px; margin-bottom: 6px; color: #8b1a1a; }
.q-ideal { background: #e7f5ff; padding: 8px; border-radius: 6px; border-left: 3px solid #00b8d4; font-size: 11px; color: #0a4d68; }
.footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
<div class="brand">⚡ THREATREADY</div>
<div class="subtitle">Cybersecurity Assessment Platform · Candidate Report</div>
<h1>${escape(cand.name)}</h1>
<div class="meta">${escape(cand.email)} · ${escape(cand.assessment_name || roleName + ' Assessment')}</div>
</div>
<div class="score-card">
<div class="score-label">OVERALL SCORE</div>
<div class="score-value">${score.toFixed(1)}<span class="score-max">/10</span></div>
<div class="badge">${escape((cand.badge || '').toUpperCase())}</div>
<div class="verdict">${escape(verdict)}</div>
</div>
<div class="stats">
<div class="stat"><div class="stat-label">ROLE</div><div class="stat-val">${escape(roleName)}</div></div>
<div class="stat"><div class="stat-label">DIFFICULTY</div><div class="stat-val" style="text-transform:capitalize">${escape(cand.difficulty)}</div></div>
<div class="stat"><div class="stat-label">QUESTIONS</div><div class="stat-val">${evals.length} answered</div></div>
<div class="stat"><div class="stat-label">COMPLETED</div><div class="stat-val">${escape(cand.completed_at?.substring(0, 10) || '—')}</div></div>
</div>
<div class="summary">
<div class="sum-box sum-strong"><div class="sum-label" style="color:#00a878">✓ STRONG ANSWERS</div><div class="sum-count" style="color:#00a878">${strongCount}</div><div class="sum-desc">Questions scored 7+ / 10</div></div>
<div class="sum-box sum-weak"><div class="sum-label" style="color:#d32f2f">✗ WEAK AREAS</div><div class="sum-count" style="color:#d32f2f">${weakCount}</div><div class="sum-desc">Questions scored below 5 / 10</div></div>
</div>
<div class="section-title">📝 Detailed Question Breakdown</div>
${evals.map((ev, i) => {
                        const cls = ev.score >= 7 ? 'good' : ev.score >= 5 ? 'avg' : 'bad';
                        const col = ev.score >= 7 ? '#00a878' : ev.score >= 5 ? '#d97706' : '#d32f2f';
                        return `<div class="q-block ${cls}">
    <div class="q-header"><span class="q-num">QUESTION ${i + 1} · ${escape(ev.category || 'General')}</span><span class="q-score" style="color:${col}">${ev.score}/10</span></div>
    <div class="q-question">❓ ${escape(ev.question)}</div>
    <div class="q-tag">CANDIDATE'S ANSWER</div>
    <div class="q-answer">${escape(ev.answer || '(No answer provided)')}</div>
    ${ev.strengths ? `<div class="q-str"><strong>✓ Strengths:</strong> ${escape(ev.strengths)}</div>` : ''}
    ${ev.weaknesses ? `<div class="q-wk"><strong>✗ Weaknesses:</strong> ${escape(ev.weaknesses)}</div>` : ''}
    ${ev.improved_answer && ev.improved_answer !== '-' ? `<div class="q-ideal"><strong>💡 Ideal Answer:</strong> ${escape(ev.improved_answer)}</div>` : ''}
  </div>`;
                      }).join('')}
<div class="footer">Generated by ThreatReady · ${new Date().toLocaleString()}</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body></html>`;
                      const w = window.open('', '_blank');
                      if (!w) { showToast('Please allow popups for bulk download', 'error'); return; }
                      w.document.write(html);
                      w.document.close();
                      await new Promise(r => setTimeout(r, 800));
                    } catch (e) { console.error('PDF error:', e); }
                  }
                  showToast(`${selectedCompleted.length} PDF(s) opened!`, 'success');
                }}>📥 Download PDFs ({selectedCandidates.length})</button>
              <button className="btn bdn" style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => {
                  showConfirm(`Delete ${selectedCandidates.length} selected candidate(s)?`, async () => {
                    const token = localStorage.getItem('token');
                    await Promise.all(selectedCandidates.map(id =>
                      fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${id}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                      })
                    ));
                    setSelectedCandidates([]);
                    loadB2bData();
                    showToast(`${selectedCandidates.length} candidates deleted.`, 'success');
                  });
                }}>🗑 Delete Selected ({selectedCandidates.length})</button>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
          <input className="input" type="text" placeholder="🔍 Search name, email, or date..."
            value={candidatesSearch} onChange={e => setCandidatesSearch(e.target.value)}
            style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
          {candidatesSearch && (
            <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setCandidatesSearch('')}>✕</button>
          )}
        </div>
        <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }}
          onClick={() => {
            const filtered = filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at);
            const csv = ['Name,Email,Role,Difficulty,Score,Status,Invited']
              .concat(filtered.map(c => `${c.candidate_name || ''},${c.candidate_email || ''},${c.role_id || ''},${c.difficulty || ''},${c.overall_score || ''},${c.status || ''},${c.invited_at?.substring(0, 10) || ''}`))
              .join('\n');
            const a = document.createElement('a');
            a.href = 'data:text/csv,' + encodeURIComponent(csv);
            a.download = 'candidates.csv'; a.click();
          }}>📥 Export CSV</button>
      </div>
      {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
      <div className="card fadeUp" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "30px 2fr 2fr 1fr 1fr 1fr 1fr 0.5fr", padding: "10px 14px", background: "var(--s2)", fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, textTransform: "uppercase" }}>
          <span>
            <input type="checkbox" style={{ cursor: "pointer" }}
              checked={selectedCandidates.length === filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length && candidates.length > 0}
              onChange={e => {
                const filtered = filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at);
                setSelectedCandidates(e.target.checked ? filtered.map(c => c.id) : []);
              }} />
          </span>
          <span>Name</span><span>Email</span><span>Role</span><span>Score</span><span>Status</span><span>Report</span><span></span>
        </div>
        {candidates.length === 0 && !b2bLoading && (
          <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates yet. Use the invite form above.</div>
        )}
        {candidates.length > 0 && filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates match "{candidatesSearch}"</div>
        )}
        {filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "30px 2fr 2fr 1fr 1fr 1fr 1fr 0.5fr", padding: "10px 14px", borderTop: "1px solid var(--bd)", fontSize: 13, alignItems: "center", background: selectedCandidates.includes(c.id) ? "rgba(0,229,255,0.05)" : undefined }}>
            <span>
              <input type="checkbox" style={{ cursor: "pointer" }}
                checked={selectedCandidates.includes(c.id)}
                onChange={e => setSelectedCandidates(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
            </span>
            <span style={{ fontWeight: 600 }}>{c.candidate_name || c.candidate_email?.split("@")[0] || '—'}</span>
            <span style={{ color: "var(--tx2)", fontSize: 12 }}>{c.candidate_email}</span>
            <span>{c.role_id ? (ROLES.find(r => r.id === c.role_id)?.icon || c.role_id) : "—"}</span>
            <span className="mono" style={{ fontWeight: 700, color: c.overall_score ? (c.overall_score >= 7 ? "var(--ok)" : c.overall_score >= 5 ? "var(--wn)" : "var(--dn)") : "var(--tx2)" }}>
              {c.overall_score ? `${c.overall_score}/10` : "—"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: c.status === "completed" ? "var(--ok)" : c.status === "in_progress" ? "var(--wn)" : "var(--tx2)" }}>
              {c.status === "completed" ? "✓ Done" : c.status === "in_progress" ? "● Active" : "○ Pending"}
            </span>
            <span style={{ display: "flex", gap: 6 }}>
              {c.status === "completed" ? (
                <>
                  <button style={{ background: "rgba(0,229,255,.1)", border: "1px solid var(--ac)", cursor: "pointer", fontSize: 12, color: "var(--ac)", padding: "3px 8px", borderRadius: 4 }}
                    title="View Report"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.candidate) setReportModal(data.candidate);
                        else showToast('Report not available', 'error');
                      } catch (e) { showToast('Error loading report', 'error'); }
                    }}>👁 View</button>
                  <button style={{ background: "rgba(0,224,150,.1)", border: "1px solid var(--ok)", cursor: "pointer", fontSize: 12, color: "var(--ok)", padding: "3px 8px", borderRadius: 4 }}
                    title="Download PDF"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (!data.candidate) { showToast('Report not available', 'error'); return; }
                        const cand = data.candidate;
                        const score = parseFloat(cand.overall_score) || 0;
                        const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#f59e0b' : '#ff5252';
                        const badgeColor = score >= 8 ? '#e2e8f0' : score >= 7 ? '#f59e0b' : score >= 6 ? '#94a3b8' : score >= 4 ? '#cd7f32' : '#ff5252';
                        const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
                          score >= 7 ? "Strong candidate — recommended for next round" :
                            score >= 6 ? "Good candidate — consider for interview" :
                              score >= 5 ? "Average — more assessment needed" :
                                score >= 4 ? "Below expectations — not recommended" :
                                  "Not ready — significant skill gaps";
                        const evals = cand.evaluations || [];
                        const strongCount = evals.filter(e => e.score >= 7).length;
                        const weakCount = evals.filter(e => e.score < 5).length;
                        const roleName = ROLES.find(r => r.id === cand.role_id)?.name || cand.role_id;
                        const escape = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Assessment Report - ${escape(cand.name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
  .header { border-bottom: 3px solid #00b8d4; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { color: #00b8d4; font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 11px; margin-bottom: 12px; }
  h1 { font-size: 20px; margin: 0 0 6px 0; color: #1a1a1a; }
  .meta { color: #666; font-size: 12px; }
  .score-card { background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%); color: #fff; padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0; }
  .score-label { font-size: 11px; color: #8890b0; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px; }
  .score-value { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; margin-bottom: 8px; }
  .score-max { font-size: 22px; color: #8890b0; }
  .badge { display: inline-block; border: 2px solid ${badgeColor}; color: ${badgeColor}; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 2px; margin: 12px 0; }
  .verdict { font-size: 13px; color: ${scoreColor}; font-weight: 600; margin-top: 8px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
  .stat { background: #f5f7fa; padding: 12px; border-radius: 8px; text-align: center; }
  .stat-label { font-size: 9px; color: #666; letter-spacing: 1px; margin-bottom: 4px; font-weight: 700; }
  .stat-val { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
  .sum-box { padding: 14px; border-radius: 10px; border: 1px solid; }
  .sum-strong { background: #e6faf1; border-color: #00c48a; }
  .sum-weak { background: #fff0f0; border-color: #ff5252; }
  .sum-count { font-size: 26px; font-weight: 900; }
  .sum-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
  .sum-desc { font-size: 10px; color: #666; margin-top: 2px; }
  .section-title { font-size: 13px; color: #00b8d4; font-weight: 700; letter-spacing: 2px; margin: 28px 0 14px; text-transform: uppercase; border-bottom: 2px solid #00b8d4; padding-bottom: 6px; }
  .q-block { margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #ccc; page-break-inside: avoid; }
  .q-block.good { border-left-color: #00c48a; }
  .q-block.avg { border-left-color: #f59e0b; }
  .q-block.bad { border-left-color: #ff5252; }
  .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .q-num { font-size: 10px; color: #666; font-weight: 700; letter-spacing: 1px; }
  .q-score { font-size: 14px; font-weight: 900; }
  .q-question { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
  .q-answer { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid #999; font-size: 11px; margin-bottom: 10px; color: #333; }
  .q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
  .q-str { background: #e6faf1; padding: 8px; border-radius: 6px; border-left: 3px solid #00c48a; font-size: 11px; margin-bottom: 6px; color: #1a5f3f; }
  .q-wk { background: #fff0f0; padding: 8px; border-radius: 6px; border-left: 3px solid #ff5252; font-size: 11px; margin-bottom: 6px; color: #8b1a1a; }
  .q-ideal { background: #e7f5ff; padding: 8px; border-radius: 6px; border-left: 3px solid #00b8d4; font-size: 11px; color: #0a4d68; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
</style></head>
<body>
  <div class="header">
    <div class="brand">⚡ THREATREADY</div>
    <div class="subtitle">Cybersecurity Assessment Platform · Candidate Report</div>
    <h1>${escape(cand.name)}</h1>
    <div class="meta">${escape(cand.email)} · ${escape(cand.assessment_name || roleName + ' Assessment')}</div>
  </div>

  <div class="score-card">
    <div class="score-label">OVERALL SCORE</div>
    <div class="score-value">${score.toFixed(1)}<span class="score-max">/10</span></div>
    <div class="badge">${escape((cand.badge || '').toUpperCase())}</div>
    <div class="verdict">${escape(verdict)}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-label">ROLE</div><div class="stat-val">${escape(roleName)}</div></div>
    <div class="stat"><div class="stat-label">DIFFICULTY</div><div class="stat-val" style="text-transform:capitalize">${escape(cand.difficulty)}</div></div>
    <div class="stat"><div class="stat-label">QUESTIONS</div><div class="stat-val">${evals.length} answered</div></div>
    <div class="stat"><div class="stat-label">COMPLETED</div><div class="stat-val">${escape(cand.completed_at?.substring(0, 10) || '—')}</div></div>
  </div>

  <div class="summary">
    <div class="sum-box sum-strong">
      <div class="sum-label" style="color:#00a878">✓ STRONG ANSWERS</div>
      <div class="sum-count" style="color:#00a878">${strongCount}</div>
      <div class="sum-desc">Questions scored 7+ / 10</div>
    </div>
    <div class="sum-box sum-weak">
      <div class="sum-label" style="color:#d32f2f">✗ WEAK AREAS</div>
      <div class="sum-count" style="color:#d32f2f">${weakCount}</div>
      <div class="sum-desc">Questions scored below 5 / 10</div>
    </div>
  </div>

  <div class="section-title">📝 Detailed Question Breakdown</div>
  ${evals.map((ev, i) => {
                          const cls = ev.score >= 7 ? 'good' : ev.score >= 5 ? 'avg' : 'bad';
                          const col = ev.score >= 7 ? '#00a878' : ev.score >= 5 ? '#d97706' : '#d32f2f';
                          return `<div class="q-block ${cls}">
      <div class="q-header">
        <span class="q-num">QUESTION ${i + 1} · ${escape(ev.category || 'General')}</span>
        <span class="q-score" style="color:${col}">${ev.score}/10</span>
      </div>
      <div class="q-question">❓ ${escape(ev.question)}</div>
      <div class="q-tag">CANDIDATE'S ANSWER</div>
      <div class="q-answer">${escape(ev.answer || '(No answer provided)')}</div>
      ${ev.strengths ? `<div class="q-str"><strong>✓ Strengths:</strong> ${escape(ev.strengths)}</div>` : ''}
      ${ev.weaknesses ? `<div class="q-wk"><strong>✗ Weaknesses:</strong> ${escape(ev.weaknesses)}</div>` : ''}
      ${ev.improved_answer && ev.improved_answer !== '-' ? `<div class="q-ideal"><strong>💡 Ideal Answer:</strong> ${escape(ev.improved_answer)}</div>` : ''}
    </div>`;
                        }).join('')}

  <div class="footer">Generated by ThreatReady · ${new Date().toLocaleString()}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body></html>`;

                        const w = window.open('', '_blank');
                        if (!w) { showToast('Please allow popups for PDF download', 'error'); return; }
                        w.document.write(html);
                        w.document.close();
                        showToast("Opening PDF... use your browser's Save as PDF option", 'success');
                      } catch (e) { showToast('Error downloading: ' + e.message, 'error'); }
                    }}>📥</button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: "var(--tx2)" }}>—</span>
              )}
            </span>
            <span>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--dn)", padding: "2px 6px" }}
                title="Delete"
                onClick={() => {
                  showConfirm(`Delete ${c.candidate_name || c.candidate_email}? This cannot be undone.`, async () => {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}`, {
                      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) { loadB2bData(); showToast('Deleted.', 'success'); }
                    else showToast('Delete failed', 'error');
                  });
                }}>🗑</button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}