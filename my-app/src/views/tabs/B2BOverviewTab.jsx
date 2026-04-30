// ═══════════════════════════════════════════════════════════════
// B2B OVERVIEW TAB (HR Dashboard - Stats + Notifications + Quick Actions)
// Extracted from App.jsx (B2B Dashboard) - Phase 4 step 1
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function B2BOverviewTab({
  b2bStats,
  b2bLoading,
  candidates,
  setB2bTab,
}) {
  // ═══════════════════════════════════════════════════════════════
  // RICH REPORT HTML GENERATOR (matches the candidate email report)
  // Same as B2BCandidatesTab — opens the full 5-section report
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

  // Open rich report in a new tab when clicking View button on a notification
  const openCandidateReport = async (candidateId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${candidateId}/report`, {
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
  };

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
                    onClick={() => openCandidateReport(c.id)}>
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
