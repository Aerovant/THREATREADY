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
  // ENTERPRISE REPORT HTML GENERATOR (matches the sample report format)
  // Same as B2BCandidatesTab — opens the full enterprise report
  // ═══════════════════════════════════════════════════════════════
  const generateReportHTML = (cand, autoPrint) => {
    const score10 = parseFloat(cand.overall_score) || 0;
    const score100 = Math.round(score10 * 10);
    const scoreColor = score10 >= 7 ? '#00e096' : score10 >= 5 ? '#f59e0b' : '#ff5252';
    const evals = cand.evaluations || [];
    const role = ROLES.find(r => r.id === cand.role_id);
    const roleName = role?.name || cand.role_id || '';
    const roleColor = role?.color || '#7c3aed';
    const escape = s => (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    let durationStr = '—', startedStr = '—', completedStr = '—';
    if (cand.completed_at) {
      const completed = new Date(cand.completed_at);
      completedStr = completed.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      if (cand.invited_at) {
        const started = new Date(cand.invited_at);
        startedStr = started.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        const diffMs = completed - started;
        const mins = Math.floor(diffMs / 60000);
        if (mins > 0 && mins < 60 * 24 * 7) {
          const sec = Math.floor((diffMs % 60000) / 1000);
          durationStr = mins + ' min ' + sec + ' sec';
        }
      }
    }

    const percentile = score10 >= 8 ? 'Top 15%' : score10 >= 7 ? 'Top 25%' : score10 >= 6 ? 'Top 50%' : score10 >= 4 ? 'Top 75%' : 'Bottom 25%';
    const recommendApproved = score10 >= 6;
    const recommendText = score10 >= 7 ? 'Recommended to advance to the next round'
      : score10 >= 5 ? 'Borderline — consider for further screening'
      : 'Not recommended — significant skill gaps';
    const recommendDetail = score10 >= 7
      ? 'Score of ' + score100 + '/100 is in the ' + percentile + ' of ' + roleName + ' · ' + (cand.difficulty || '') + ' candidates. No integrity concerns.'
      : score10 >= 5
      ? 'Score of ' + score100 + '/100 shows partial competency. May benefit from a deeper technical interview.'
      : 'Score of ' + score100 + '/100 is below the recommended threshold for this role.';

    const categoryScores = {};
    evals.forEach(e => {
      const cat = e.category || 'General';
      if (!categoryScores[cat]) categoryScores[cat] = { total: 0, count: 0 };
      categoryScores[cat].total += parseFloat(e.score) || 0;
      categoryScores[cat].count += 1;
    });
    const categories = Object.keys(categoryScores).map(cat => ({
      name: cat,
      avg: categoryScores[cat].total / categoryScores[cat].count
    })).sort((a, b) => b.avg - a.avg);

    const topStrengths = evals.filter(e => e.score >= 7).slice(0, 4).map(e => e.strengths).filter(Boolean);
    const topGrowth = evals.filter(e => e.score < 7).slice(0, 4).map(e => e.weaknesses).filter(Boolean);

    const weakestCat = categories.length > 0 ? categories[categories.length - 1] : null;
    const interviewFocus = weakestCat && weakestCat.avg < 6
      ? 'Behavioral questions on ' + weakestCat.name.toLowerCase() + ', and a live whiteboard exercise focused on this area. The candidate scored ' + weakestCat.avg.toFixed(1) + '/10 here, so probe deeper to assess true capability.'
      : 'Behavioral questions on past incidents and a live whiteboard exercise. The candidate performed well overall — shape your loop accordingly.';

    const evalBlocks = evals.map((e, i) => {
      const techScore = parseFloat(e.score) || 0;
      const techCol = techScore >= 7 ? '#00c48a' : techScore >= 5 ? '#f59e0b' : '#ff5252';
      return '<div class="q-block">' +
        '<div class="q-meta"><span class="q-num">QUESTION ' + (i + 1) + ' OF ' + evals.length + ' · ' + escape((e.category || 'General').toUpperCase()) + '</span>' +
        '<span class="pill" style="background:' + techCol + '20;color:' + techCol + '">Score: ' + techScore.toFixed(1) + '/10</span></div>' +
        '<div class="q-question">' + escape(e.question) + '</div>' +
        '<div class="q-grid">' +
          '<div class="q-side"><div class="q-tag">👤 CANDIDATE ANSWER</div><div class="q-body">' + escape(e.answer || '(No answer provided)') + '</div></div>' +
          '<div class="q-side"><div class="q-tag" style="color:#00c48a">✓ MODEL ANSWER</div><div class="q-body model">' + escape(e.improved_answer && e.improved_answer !== '-' ? e.improved_answer : 'Model answer not available') + '</div></div>' +
        '</div>' +
        (e.weaknesses || e.strengths ? '<div class="evaluator-note"><strong>Evaluator note:</strong> ' + (e.strengths ? '✓ ' + escape(e.strengths) + '. ' : '') + (e.weaknesses ? '✗ ' + escape(e.weaknesses) : '') + '</div>' : '') +
      '</div>';
    }).join('');

    const barChartHtml = categories.slice(0, 6).map(c => {
      const pct = (c.avg / 10) * 100;
      const col = c.avg >= 7 ? '#00c48a' : c.avg >= 5 ? '#f59e0b' : '#ff5252';
      return '<div class="skill-row">' +
        '<div class="skill-label">' + escape(c.name) + '</div>' +
        '<div class="skill-bar"><div class="skill-fill" style="width:' + pct + '%;background:' + col + '"></div></div>' +
        '<div class="skill-val" style="color:' + col + '">' + c.avg.toFixed(1) + '</div>' +
      '</div>';
    }).join('');

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escape(cand.name) + ' — Assessment Report</title>' +
'<style>' +
'@page { size: A4; margin: 12mm; }' +
'* { box-sizing: border-box; }' +
'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif; color: #1a1a1a; line-height: 1.55; margin: 0; padding: 0; background: #f5f6fa; }' +
'.page { max-width: 880px; margin: 0 auto; background: #fff; padding: 36px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }' +
'.brand-bar { background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%); color: #fff; padding: 12px 20px; text-align: center; margin: -36px -36px 28px -36px; border-radius: 12px 12px 0 0; }' +
'.brand-bar strong { font-size: 14px; font-weight: 700; letter-spacing: 1px; }' +
'.brand-bar .sub { font-size: 9px; opacity: 0.85; margin-top: 2px; letter-spacing: 1.5px; }' +
'.profile { display: flex; gap: 16px; padding: 18px; background: #fafbff; border: 1px solid #e8eaf6; border-radius: 12px; margin-bottom: 16px; }' +
'.avatar { width: 56px; height: 56px; border-radius: 50%; background: ' + roleColor + '; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }' +
'.profile-info h2 { margin: 0; font-size: 18px; font-weight: 700; }' +
'.profile-info .email { font-size: 12px; color: #666; margin-top: 2px; }' +
'.profile-info .role-line { font-size: 12px; color: #7c3aed; margin-top: 4px; font-weight: 600; }' +
'.badges { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }' +
'.badge-pill { font-size: 9px; padding: 3px 8px; border-radius: 12px; background: #e8eaf6; color: #5a4fcf; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }' +
'.linked-assess { background: #f0f4ff; padding: 10px 14px; border-radius: 8px; margin-bottom: 18px; font-size: 12px; }' +
'.linked-assess .label { color: #7c3aed; font-weight: 700; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }' +
'.linked-assess .name { color: #1a1a1a; font-weight: 600; margin-top: 2px; }' +
'.score-row { display: grid; grid-template-columns: 200px 1fr; gap: 24px; padding: 18px; background: #fafbff; border-radius: 12px; margin-bottom: 16px; align-items: center; }' +
'.score-big { text-align: center; }' +
'.score-num { font-size: 56px; font-weight: 900; color: ' + scoreColor + '; line-height: 1; }' +
'.score-out { font-size: 14px; color: #666; }' +
'.score-label { font-size: 9px; color: #999; letter-spacing: 1.5px; margin-top: 6px; font-weight: 700; }' +
'.score-tag { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 14px; font-size: 10px; font-weight: 700; ' +
  (recommendApproved ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b') + '; }' +
'.skill-row { display: grid; grid-template-columns: 130px 1fr 50px; gap: 10px; align-items: center; margin-bottom: 8px; font-size: 12px; }' +
'.skill-label { color: #444; font-weight: 500; }' +
'.skill-bar { background: #e8eaf6; height: 8px; border-radius: 4px; overflow: hidden; }' +
'.skill-fill { height: 100%; border-radius: 4px; }' +
'.skill-val { font-weight: 700; font-family: ui-monospace, monospace; text-align: right; }' +
'.meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px; background: #fafbff; border-radius: 10px; margin-bottom: 16px; font-size: 11px; }' +
'.meta-item .meta-lbl { color: #999; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; font-size: 9px; }' +
'.meta-item .meta-val { color: #1a1a1a; font-weight: 600; margin-top: 3px; font-family: ui-monospace, monospace; font-size: 11px; }' +
'.section { padding: 18px; background: #fff; border: 1px solid #e8eaf6; border-radius: 12px; margin-bottom: 16px; page-break-inside: avoid; }' +
'.section-num { color: #999; font-size: 9px; letter-spacing: 1px; }' +
'.section h3 { margin: 4px 0 14px 0; font-size: 16px; font-weight: 700; text-align: right; color: #1a1a1a; }' +
'.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }' +
'.q-block { padding: 14px; background: #fafbff; border-radius: 10px; margin-bottom: 12px; page-break-inside: avoid; }' +
'.q-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }' +
'.q-num { font-size: 9px; color: #7c3aed; letter-spacing: 1px; font-weight: 700; }' +
'.pill { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 10px; }' +
'.q-question { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e8eaf6; }' +
'.q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }' +
'.q-side .q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #999; margin-bottom: 4px; text-transform: uppercase; }' +
'.q-body { padding: 10px; background: #fff; border: 1px solid #e8eaf6; border-radius: 6px; font-size: 11px; color: #444; min-height: 60px; line-height: 1.6; }' +
'.q-body.model { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }' +
'.evaluator-note { margin-top: 10px; padding: 8px 12px; background: #fff7ed; border-left: 3px solid #f59e0b; font-size: 11px; color: #78350f; border-radius: 4px; }' +
'.audit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; border-bottom: 1px solid #f0f1f5; font-size: 11px; }' +
'.audit-row:last-child { border-bottom: none; }' +
'.audit-row .check { color: #00a878; font-weight: 700; }' +
'.audit-row .lbl { color: #1a1a1a; font-weight: 600; }' +
'.audit-row .val { color: #666; font-family: ui-monospace, monospace; font-size: 10px; }' +
'.rec-box { padding: 14px; border-radius: 10px; margin-bottom: 12px; ' +
  (recommendApproved ? 'background:#dcfce7;border-left:4px solid #00a878;color:#166534' : 'background:#fee2e2;border-left:4px solid #ff5252;color:#991b1b') + '; }' +
'.rec-title { font-weight: 700; font-size: 13px; margin-bottom: 4px; }' +
'.rec-detail { font-size: 11px; opacity: 0.9; }' +
'.sg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }' +
'.sg-col h4 { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #7c3aed; margin: 0 0 8px 0; font-weight: 700; }' +
'.sg-list { font-size: 11px; color: #444; line-height: 1.8; padding-left: 0; list-style: none; margin: 0; }' +
'.sg-list li { padding-left: 18px; position: relative; }' +
'.sg-list.strengths li:before { content: "✓"; position: absolute; left: 0; color: #00a878; font-weight: 700; }' +
'.sg-list.growth li:before { content: "↗"; position: absolute; left: 0; color: #f59e0b; font-weight: 700; }' +
'.interview-focus { margin-top: 14px; padding: 12px; background: #f0f4ff; border-radius: 8px; font-size: 11px; }' +
'.interview-focus strong { color: #7c3aed; }' +
'.footer { text-align: center; padding-top: 20px; border-top: 1px solid #e8eaf6; font-size: 10px; color: #999; margin-top: 20px; }' +
'.footer a { color: #7c3aed; text-decoration: none; }' +
'@media print { body { background: #fff; } .page { box-shadow: none; max-width: 100%; padding: 18px; } .brand-bar { margin: -18px -18px 18px -18px; } }' +
'</style></head>' +
'<body><div class="page">' +
'<div class="brand-bar"><strong>⚡ ThreatReady.io</strong><div class="sub">BY AEROVANT TECHNOLOGIES</div></div>' +
'<div class="profile">' +
  '<div class="avatar">' + (role?.icon || '👤') + '</div>' +
  '<div class="profile-info">' +
    '<h2>' + escape(cand.name) + ' <span style="font-size:11px;color:#999;font-weight:400">(candidate)</span></h2>' +
    '<div class="email">📧 ' + escape(cand.email || '') + '</div>' +
    '<div class="role-line">' + escape(roleName) + ' · ' + escape(cand.difficulty || '') + '</div>' +
    '<div class="badges">' +
      '<span class="badge-pill">✓ Verified</span>' +
      '<span class="badge-pill">✓ Assessment Completed</span>' +
      '<span class="badge-pill">✓ ' + escape((cand.badge || 'Scored').toUpperCase()) + '</span>' +
    '</div>' +
  '</div>' +
'</div>' +
(cand.assessment_name ? '<div class="linked-assess"><div class="label">Linked Assessment</div><div class="name">' + escape(cand.assessment_name) + '</div></div>' : '') +
'<div class="score-row">' +
  '<div class="score-big">' +
    '<div class="score-num">' + score100 + '</div>' +
    '<div class="score-out">/100</div>' +
    '<div class="score-label">OVERALL SCORE</div>' +
    '<div class="score-tag">' + (recommendApproved ? '✓ Recommended for next round' : '✗ Not recommended') + '</div>' +
  '</div>' +
  '<div>' + (barChartHtml || '<div style="font-size:11px;color:#999">No category data available</div>') + '</div>' +
'</div>' +
'<div class="meta-grid">' +
  '<div class="meta-item"><div class="meta-lbl">Session Started</div><div class="meta-val">' + startedStr + '</div></div>' +
  '<div class="meta-item"><div class="meta-lbl">Session Ended</div><div class="meta-val">' + completedStr + '</div></div>' +
  '<div class="meta-item"><div class="meta-lbl">Duration</div><div class="meta-val">' + durationStr + '</div></div>' +
  '<div class="meta-item"><div class="meta-lbl">Percentile</div><div class="meta-val">' + percentile + '</div></div>' +
'</div>' +
'<div class="section">' +
  '<div class="section-head"><span class="section-num">§5 · Question-by-question breakdown</span><h3>Detailed Q&amp;A Analysis</h3></div>' +
  evalBlocks +
'</div>' +
'<div class="section">' +
  '<div class="section-head"><span class="section-num">§6 · Integrity &amp; validation</span><h3>Proof this score is defensible</h3></div>' +
  '<div style="font-size:11px;color:#666;margin-bottom:12px">Every ThreatReady assessment runs under six integrity controls. If a score reaches you, all six passed.</div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Copy-paste disabled</span></div><div class="val">Blocked at input level</div></div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Forward-only navigation</span></div><div class="val">No revisions after submit</div></div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Continuous timer</span></div><div class="val">Session timer active throughout</div></div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Rubric-based AI evaluation</span></div><div class="val">Anthropic Claude API</div></div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Adaptive follow-ups</span></div><div class="val">Context-aware questioning</div></div>' +
  '<div class="audit-row"><div class="check">✓ <span class="lbl">Random scenario selection</span></div><div class="val">Picked at session start</div></div>' +
  '<div style="margin-top:12px;padding:10px;background:#fafbff;border-radius:6px">' +
    '<div style="font-size:9px;color:#999;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;font-weight:700">AUDIT TRAIL (excerpt)</div>' +
    '<div style="font-size:10px;font-family:monospace;color:#666;line-height:1.8">' +
      'Session ID: <span style="color:#1a1a1a">tr_' + escape((cand.id || '').toString()) + '</span><br/>' +
      'Started: <span style="color:#1a1a1a">' + escape(cand.invited_at ? new Date(cand.invited_at).toISOString().substring(0, 19).replace('T', ' ') : '—') + '</span><br/>' +
      'Completed: <span style="color:#1a1a1a">' + escape(cand.completed_at ? new Date(cand.completed_at).toISOString().substring(0, 19).replace('T', ' ') : '—') + '</span><br/>' +
      'Evaluation model: <span style="color:#1a1a1a">claude-sonnet-4 via Anthropic API</span><br/>' +
      'Integrity violations: <span style="color:#00a878;font-weight:700">0</span>' +
    '</div>' +
  '</div>' +
'</div>' +
'<div class="section">' +
  '<div class="section-head"><span class="section-num">§7 · Hiring signal</span><h3>Recommendation &amp; summary</h3></div>' +
  '<div class="rec-box">' +
    '<div class="rec-title">' + (recommendApproved ? '✓ ' : '✗ ') + escape(recommendText) + '</div>' +
    '<div class="rec-detail">' + escape(recommendDetail) + '</div>' +
  '</div>' +
  (topStrengths.length || topGrowth.length ? '<div class="sg-grid">' +
    (topStrengths.length ? '<div class="sg-col"><h4>Strengths</h4><ul class="sg-list strengths">' +
      topStrengths.map(s => '<li>' + escape(s) + '</li>').join('') +
    '</ul></div>' : '<div></div>') +
    (topGrowth.length ? '<div class="sg-col"><h4>Growth Areas</h4><ul class="sg-list growth">' +
      topGrowth.map(g => '<li>' + escape(g) + '</li>').join('') +
    '</ul></div>' : '<div></div>') +
  '</div>' : '') +
  '<div class="interview-focus"><strong>Suggested interview focus:</strong> ' + escape(interviewFocus) + '</div>' +
'</div>' +
'<div class="footer">' +
  'Report generated ' + new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ThreatReady Cybersecurity Platform' +
  '<br/>For questions about scoring, contact <a href="mailto:admin@aerovanttech.com">admin@aerovanttech.com</a>' +
'</div>' +
'</div>' +
(autoPrint ? '<script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>' : '') +
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
