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
  // ENTERPRISE REPORT HTML GENERATOR (matches the sample report format)
  // 7 sections: Profile, Score+Skills, Session metadata, Q&A, Audit, Recommendation
  // Used by: View button, Download button, Bulk Download button
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

    // Session timing
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

    // Aggregate categories for skill bars
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
'.avatar { width: 56px; height: 56px; border-radius: 50%; background: ' + roleColor + '; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden; }' +
'.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }' +
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
'.snap-empty { padding: 30px 20px; text-align: center; color: #999; font-size: 12px; background: #fafbff; border-radius: 8px; }' +
'.snap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }' +
'.snap-card { background: #fafbff; border: 1px solid #e8eaf6; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }' +
'.snap-img { width: 100%; height: 105px; object-fit: cover; display: block; background: #1a1a1a; }' +
'.snap-cap { padding: 6px 8px; font-size: 10px; }' +
'.snap-cap-q { color: #7c3aed; font-weight: 700; letter-spacing: 0.5px; }' +
'.snap-cap-t { color: #999; font-family: ui-monospace, monospace; font-size: 9px; margin-top: 2px; }' +
'.snap-note { font-size: 10px; color: #666; margin-top: 10px; padding: 8px 10px; background: #fff7ed; border-left: 3px solid #f59e0b; border-radius: 4px; }' +
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
  '<div class="avatar">' + (() => {
    const snaps = Array.isArray(cand.snapshot_urls) ? cand.snapshot_urls : [];
    const firstSnap = snaps.length > 0 && snaps[0] && snaps[0].url ? snaps[0].url : null;
    return firstSnap
      ? '<img src="' + escape(firstSnap) + '" alt="Candidate" />'
      : (role?.icon || '👤');
  })() + '</div>' +
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
  '<div class="section-head"><span class="section-num">§5 · Identity verification</span><h3>Webcam timeline</h3></div>' +
  (() => {
    const snaps = Array.isArray(cand.snapshot_urls) ? cand.snapshot_urls : [];
    if (snaps.length === 0) {
      return '<div class="snap-empty">No webcam snapshots available — candidate did not grant camera permission, or snapshots were not captured.</div>';
    }
    const fmtTime = (iso) => {
      if (!iso) return '—';
      try { return new Date(iso).toISOString().substring(11, 19); } catch { return '—'; }
    };
    const cards = snaps.map((s, i) => {
      const url = (s && s.url) ? s.url : '';
      const qIdx = (s && (s.question_index !== undefined && s.question_index !== null)) ? s.question_index : i;
      const qNum = (typeof qIdx === 'number') ? (qIdx + 1) : (i + 1);
      const captured = (s && s.captured_at) ? s.captured_at : '';
      return '<div class="snap-card">' +
        (url ? '<img class="snap-img" src="' + escape(url) + '" alt="Q' + qNum + ' snapshot" />' : '<div class="snap-img"></div>') +
        '<div class="snap-cap">' +
          '<div class="snap-cap-q">QUESTION ' + qNum + '</div>' +
          '<div class="snap-cap-t">' + escape(fmtTime(captured)) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="snap-grid">' + cards + '</div>' +
      '<div class="snap-note"><strong>Note:</strong> Snapshots were captured automatically at each question transition during the live assessment. ' + snaps.length + ' image' + (snaps.length === 1 ? '' : 's') + ' recorded.</div>';
  })() +
'</div>' +
'<div class="section">' +
  '<div class="section-head"><span class="section-num">§6 · Question-by-question breakdown</span><h3>Detailed Q&amp;A Analysis</h3></div>' +
  evalBlocks +
'</div>' +
'<div class="section">' +
  '<div class="section-head"><span class="section-num">§7 · Integrity &amp; validation</span><h3>Proof this score is defensible</h3></div>' +
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
  '<div class="section-head"><span class="section-num">§8 · Hiring signal</span><h3>Recommendation &amp; summary</h3></div>' +
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
