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
  // ═══════════════════════════════════════════════════════════════
  // RICH REPORT HTML GENERATOR (matches the candidate email report)
  // Used by: View button, Download button, Bulk Download button
  // ═══════════════════════════════════════════════════════════════
  const generateReportHTML = (cand, autoPrint) => {
    const score = parseFloat(cand.overall_score) || 0;
    const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#f59e0b' : '#ff5252';
    const badgeColor = score >= 8 ? '#e2e8f0' : score >= 7 ? '#f59e0b' : score >= 6 ? '#94a3b8' : score >= 4 ? '#cd7f32' : '#ff5252';
    const verdict = score >= 7 ? 'Strong performer — ready for industry roles'
      : score >= 5 ? 'Developing — needs more hands-on practice'
      : 'Needs significant improvement — focus on fundamentals';
    const nextSteps = score >= 7
      ? ['Apply to senior security roles', 'Consider OSCP or CISSP certification', 'Contribute to open source security projects', 'Build a portfolio of CTF writeups', 'Explore bug bounty programs']
      : score >= 5
      ? ['Practice on ThreatReady at harder difficulty', 'Complete TryHackMe or HackTheBox labs', 'Study OWASP Top 10 and MITRE ATT&CK', 'Get CompTIA Security+ or CEH certification', 'Work on real-world security projects']
      : ['Start with CompTIA Security+ fundamentals', 'Complete beginner labs on TryHackMe', 'Study networking and OS security basics', 'Read NIST Cybersecurity Framework', 'Retry this assessment in 30 days'];
    const evals = cand.evaluations || [];
    const topStrength = evals.length > 0 ? evals.reduce((best, e) => e.score > best.score ? e : best, evals[0]) : null;
    const topWeakness = evals.length > 0 ? evals.reduce((worst, e) => e.score < worst.score ? e : worst, evals[0]) : null;
    const roleName = ROLES.find(r => r.id === cand.role_id)?.name || cand.role_id;
    const escape = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    const evalRows = evals.map((e, i) => {
      const cls = e.score >= 7 ? 'good' : e.score >= 5 ? 'avg' : 'bad';
      const col = e.score >= 7 ? '#00a878' : e.score >= 5 ? '#d97706' : '#d32f2f';
      return '<div class="q-block ' + cls + '">' +
        '<div class="q-header">' +
          '<span class="q-num">QUESTION ' + (i + 1) + ' &middot; ' + escape(e.category || 'General') + '</span>' +
          '<span class="q-score" style="color:' + col + '">' + e.score + '/10</span>' +
        '</div>' +
        '<div class="q-question">&#10067; ' + escape(e.question) + '</div>' +
        '<div class="q-tag">CANDIDATE\'S ANSWER</div>' +
        '<div class="q-answer">' + escape(e.answer || '(No answer provided)') + '</div>' +
        (e.strengths ? '<div class="q-str"><strong>&#10003; Strengths:</strong> ' + escape(e.strengths) + '</div>' : '') +
        (e.weaknesses ? '<div class="q-wk"><strong>&#10007; Weaknesses:</strong> ' + escape(e.weaknesses) + '</div>' : '') +
        (e.improved_answer && e.improved_answer !== '-' ? '<div class="q-ideal"><strong>&#128161; Ideal Answer:</strong> ' + escape(e.improved_answer) + '</div>' : '') +
      '</div>';
    }).join('');

    const stepsHtml = nextSteps.map((s, i) =>
      '<div class="step"><span class="step-num">' + (i + 1) + '.</span><span class="step-txt">' + escape(s) + '</span></div>'
    ).join('');

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report &mdash; ' + escape(cand.name) + '</title>' +
'<style>' +
'@page { size: A4; margin: 18mm; }' +
'body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #e8eaf6; line-height: 1.5; margin: 0; padding: 28px; background: #0a0e1a; }' +
'.header { text-align: center; margin-bottom: 28px; }' +
'.brand { color: #00e5ff; font-size: 28px; font-weight: 900; letter-spacing: 2px; }' +
'.subtitle { color: #8890b0; font-size: 12px; margin-top: 4px; }' +
'.score-card { text-align: center; background: #111827; border-radius: 14px; padding: 28px; margin-bottom: 20px; }' +
'.greeting { font-size: 13px; color: #8890b0; margin-bottom: 8px; }' +
'.greeting strong { color: #e8eaf6; }' +
'.score-value { font-size: 64px; font-weight: 900; color: ' + scoreColor + '; line-height: 1; }' +
'.score-meta { font-size: 13px; color: #8890b0; margin: 8px 0 14px; }' +
'.badge { display: inline-block; border: 2px solid ' + badgeColor + '; color: ' + badgeColor + '; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 2px; }' +
'.section { background: #1a1f2e; border-radius: 12px; padding: 18px; margin-bottom: 16px; border-left: 4px solid; page-break-inside: avoid; }' +
'.section.s1 { border-left-color: ' + scoreColor + '; }' +
'.section.s2 { border-left-color: #00e096; }' +
'.section.s3 { border-left-color: #ff5252; }' +
'.section.s4 { border-left-color: #ffab40; }' +
'.section.s5 { border-left-color: #8b5cf6; }' +
'.sec-title { font-size: 11px; color: #00e5ff; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }' +
'.sec-body { font-size: 14px; font-weight: 700; color: #e8eaf6; }' +
'.sec-meta { font-size: 12px; color: #8890b0; margin-bottom: 4px; }' +
'.sec-text { font-size: 13px; color: #e8eaf6; }' +
'.step { display: flex; gap: 10px; margin-bottom: 8px; }' +
'.step-num { color: #00e5ff; font-weight: 700; min-width: 18px; }' +
'.step-txt { font-size: 13px; color: #e8eaf6; }' +
'.q-block { margin-bottom: 12px; padding: 14px; background: #1a1f2e; border-radius: 10px; border-left: 3px solid; page-break-inside: avoid; }' +
'.q-block.good { border-left-color: #00c48a; }' +
'.q-block.avg { border-left-color: #f59e0b; }' +
'.q-block.bad { border-left-color: #ff5252; }' +
'.q-header { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #2a3142; }' +
'.q-num { font-size: 11px; color: #8890b0; font-weight: 700; letter-spacing: 1px; }' +
'.q-score { font-size: 14px; font-weight: 900; }' +
'.q-question { font-size: 13px; font-weight: 700; color: #e8eaf6; margin-bottom: 8px; }' +
'.q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #8890b0; margin: 6px 0 4px; }' +
'.q-answer { background: #111827; padding: 10px; border-radius: 6px; border-left: 3px solid #5a6380; font-size: 11px; color: #e8eaf6; margin-bottom: 6px; }' +
'.q-str { background: rgba(0,224,150,0.08); padding: 8px; border-radius: 6px; border-left: 3px solid #00c48a; font-size: 11px; color: #e8eaf6; margin-bottom: 4px; }' +
'.q-wk { background: rgba(255,82,82,0.08); padding: 8px; border-radius: 6px; border-left: 3px solid #ff5252; font-size: 11px; color: #e8eaf6; margin-bottom: 4px; }' +
'.q-ideal { background: rgba(0,184,212,0.08); padding: 8px; border-radius: 6px; border-left: 3px solid #00e5ff; font-size: 11px; color: #e8eaf6; }' +
'.footer { text-align: center; padding-top: 16px; border-top: 1px solid #1e2536; font-size: 11px; color: #5a6380; margin-top: 20px; }' +
'</style></head>' +
'<body>' +
'<div class="header">' +
  '<div class="brand">&#9889; THREATREADY</div>' +
  '<div class="subtitle">Cybersecurity Assessment Report</div>' +
'</div>' +
'<div class="score-card">' +
  '<div class="greeting">Hello <strong>' + escape(cand.name) + '</strong>,</div>' +
  '<div class="score-value">' + score.toFixed(0) + '</div>' +
  '<div class="score-meta">out of 10 &middot; ' + escape(roleName) + ' &middot; ' + escape(cand.difficulty || '') + '</div>' +
  '<div class="badge">' + escape((cand.badge || '').toUpperCase()) + '</div>' +
'</div>' +
'<div class="section s1">' +
  '<div class="sec-title">1. Overall Verdict</div>' +
  '<div class="sec-body">' + escape(verdict) + '</div>' +
'</div>' +
(topStrength ? '<div class="section s2">' +
  '<div class="sec-title">2. Your Top Strength</div>' +
  '<div class="sec-meta">' + escape(topStrength.category || 'General') + ' &mdash; Q' + (evals.indexOf(topStrength) + 1) + ' (' + topStrength.score + '/10)</div>' +
  '<div class="sec-text">' + escape(topStrength.strengths || 'None') + '</div>' +
'</div>' : '') +
(topWeakness ? '<div class="section s3">' +
  '<div class="sec-title">3. Key Area to Improve</div>' +
  '<div class="sec-meta">' + escape(topWeakness.category || 'General') + ' &mdash; Q' + (evals.indexOf(topWeakness) + 1) + ' (' + topWeakness.score + '/10)</div>' +
  '<div class="sec-text">' + escape(topWeakness.weaknesses || 'None') + '</div>' +
'</div>' : '') +
'<div class="section s4">' +
  '<div class="sec-title">4. Recommended Next Steps</div>' +
  stepsHtml +
'</div>' +
'<div class="section s5">' +
  '<div class="sec-title">5. Question-by-Question Breakdown</div>' +
  evalRows +
'</div>' +
'<div class="footer">Assessment completed on ' + ((cand.completed_at && cand.completed_at.substring(0, 10)) || new Date().toLocaleDateString()) + ' &middot; ThreatReady Cybersecurity Platform</div>' +
(autoPrint ? '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>' : '') +
'</body></html>';

    return html;
  };

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
                      const html = generateReportHTML(data.candidate, true);
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
                        if (!data.candidate) { showToast('Report not available', 'error'); return; }
                        const html = generateReportHTML(data.candidate, false);
                        const w = window.open('', '_blank');
                        if (!w) { showToast('Please allow popups to view report', 'error'); return; }
                        w.document.write(html);
                        w.document.close();
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
                        const html = generateReportHTML(data.candidate, true);
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
