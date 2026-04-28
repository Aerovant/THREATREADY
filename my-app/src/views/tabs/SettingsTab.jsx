// ═══════════════════════════════════════════════════════════════
// SETTINGS TAB (Dashboard - Profile + Privacy + Data Export)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { showToast } from "../../components/helpers.js";

export default function SettingsTab({
  user,
  setUser,
  settingsName,
  setSettingsName,
  profilePublic,
  setProfilePublic,
  inLeaderboard,
  setInLeaderboard,
  allowBenchmarking,
  setAllowBenchmarking,
  setView,
  showConfirm,
}) {
  return (
    <>
      <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
        <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>PROFILE SETTINGS</div>
          <input className="input" placeholder="Full Name"
            value={settingsName || user?.name || ''}
            onChange={e => setSettingsName(e.target.value)}
            style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Email" value={user?.email || ''} disabled style={{ marginBottom: 8, opacity: 0.6 }} />
          <button className="btn bp" style={{ fontSize: 13 }}
            onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch('https://threatready-db.onrender.com/api/settings/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: settingsName || user?.name })
              });
              if (res.ok) {
                const updated = { ...user, name: settingsName || user?.name };
                setUser(updated);
                localStorage.setItem('cyberprep_user', JSON.stringify(updated));
                showToast('Profile updated successfully!', 'success');
              }
            }}>Save Changes</button>
        </div>
        <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>PRIVACY</div>
          {[
            ["Make profile public", profilePublic, setProfilePublic],
            ["Include in leaderboard", inLeaderboard, setInLeaderboard],
            ["Allow benchmarking data", allowBenchmarking, setAllowBenchmarking]
          ].map(([l, val, setter], i) => (
            <label key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 12, color: "var(--tx2)" }}>
              {l}
              <input type="checkbox" checked={val} onChange={async e => {
                setter(e.target.checked);
                const token = localStorage.getItem('token');
                try {
                  const res = await fetch('https://threatready-db.onrender.com/api/settings/privacy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      profile_public: l === "Make profile public" ? e.target.checked : profilePublic,
                      in_leaderboard: l === "Include in leaderboard" ? e.target.checked : inLeaderboard,
                      allow_benchmarking: l === "Allow benchmarking data" ? e.target.checked : allowBenchmarking
                    })
                  });
                  if (res.ok) showToast('Privacy settings saved', 'success');
                  else showToast('Failed to save settings', 'error');
                } catch (e) { showToast('Error: ' + e.message, 'error'); }
              }} />
            </label>
          ))}
        </div>
        <div className="card fadeUp" style={{ padding: 16 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>DATA</div>
          <button className="btn bp" style={{ width: "100%", marginBottom: 8 }} onClick={async () => {
            showToast('Generating your report...', 'info');
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('https://threatready-db.onrender.com/api/settings/export', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const d = await res.json();

              const u = d.user || {};
              const st = d.stats || {};
              const scores = d.skill_scores || [];
              const sessions = d.sessions || [];
              const bdgs = d.badges || [];

              const avgScore = sessions.filter(s => s.overall_score).length > 0
                ? (sessions.filter(s => s.overall_score).reduce((a, s) => a + parseFloat(s.overall_score || 0), 0) / sessions.filter(s => s.overall_score).length).toFixed(1)
                : '—';

              const bestScore = sessions.filter(s => s.overall_score).length > 0
                ? Math.max(...sessions.filter(s => s.overall_score).map(s => parseFloat(s.overall_score || 0))).toFixed(1)
                : '—';

              const roleNames = { cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security', netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect', dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst', threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team' };

              const scoreRows = scores.map(s => `
                <tr>
                  <td style="padding:10px;font-weight:600">${roleNames[s.role_id] || s.role_id}</td>
                  <td style="padding:10px;font-weight:800;color:${s.total_score >= 7 ? '#00e096' : s.total_score >= 5 ? '#ffab40' : '#ff5252'}">${parseFloat(s.total_score || 0).toFixed(1)}/10</td>
                  <td style="padding:10px;color:${s.badge_level === 'Platinum' ? '#e2e8f0' : s.badge_level === 'Gold' ? '#f59e0b' : s.badge_level === 'Silver' ? '#94a3b8' : '#b45309'}">${s.badge_level || '—'}</td>
                  <td style="padding:10px">${s.percentile || 0}th percentile</td>
                  <td style="padding:10px;color:#8890b0">${new Date(s.updated_at).toLocaleDateString()}</td>
                </tr>`).join('');

              const sessionRows = sessions.slice(0, 10).map(s => `
                <tr>
                  <td style="padding:8px;color:#8890b0">${s.scenario_id || '—'}</td>
                  <td style="padding:8px;font-weight:700;color:${parseFloat(s.overall_score || 0) >= 7 ? '#00e096' : parseFloat(s.overall_score || 0) >= 5 ? '#ffab40' : '#ff5252'}">${s.overall_score ? parseFloat(s.overall_score).toFixed(1) + '/10' : 'Incomplete'}</td>
                  <td style="padding:8px;color:${s.badge === 'Gold' ? '#f59e0b' : s.badge === 'Platinum' ? '#e2e8f0' : '#94a3b8'}">${s.badge || '—'}</td>
                  <td style="padding:8px;color:#ffab40">+${s.earned_xp || 0} XP</td>
                  <td style="padding:8px;color:#8890b0">${s.completed_at ? new Date(s.completed_at).toLocaleDateString() : 'In Progress'}</td>
                </tr>`).join('');

              const badgeItems = bdgs.map(b => `<span style="display:inline-block;margin:4px;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:#00e5ff">🏅 ${b.name}</span>`).join('');

              const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
                <title>ThreatReady Report - ${u.name || 'User'}</title>
                <style>
                  *{box-sizing:border-box;margin:0;padding:0}
                  body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0e1a;color:#e8eaf6;padding:40px;line-height:1.6}
                  .header{text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #1e2536}
                  .logo{font-size:32px;font-weight:900;color:#00e5ff;letter-spacing:2px;margin-bottom:4px}
                  .subtitle{font-size:13px;color:#8890b0}
                  .name{font-size:22px;font-weight:800;margin:12px 0 4px}
                  .email{font-size:13px;color:#8890b0}
                  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}
                  .stat{background:#111827;border:1px solid #1e2536;border-radius:12px;padding:16px;text-align:center}
                  .stat-val{font-size:28px;font-weight:900;color:#00e5ff;font-family:monospace}
                  .stat-lbl{font-size:10px;color:#8890b0;margin-top:4px;text-transform:uppercase;letter-spacing:1px}
                  .section{margin:28px 0}
                  .section-title{font-size:11px;font-weight:800;color:#00e5ff;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #1e2536}
                  table{width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden}
                  th{background:#1a1f2e;padding:10px;text-align:left;font-size:10px;color:#00e5ff;letter-spacing:1px;text-transform:uppercase}
                  tr{border-bottom:1px solid #1e2536}
                  tr:last-child{border-bottom:none}
                  tr:hover{background:#1a1f2e}
                  .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #1e2536;font-size:11px;color:#5a6380}
                  @media print{body{background:#fff;color:#000} .header,.stat,.section{border-color:#ddd} .stat-val,.logo{color:#0066cc} th{background:#f0f0f0;color:#333}}
                </style></head><body>
                <div class="header">
                  <div class="logo">⚡ THREATREADY</div>
                  <div class="subtitle">Cybersecurity Assessment Platform — Personal Report</div>
                  <div class="name">${u.name || 'User'}</div>
                  <div class="email">${u.email || ''} &nbsp;·&nbsp; Member since ${new Date(u.created_at).toLocaleDateString()}</div>
                </div>

                <div class="stats-grid">
                  <div class="stat"><div class="stat-val">${st.total_xp || 0}</div><div class="stat-lbl">Total XP</div></div>
                  <div class="stat"><div class="stat-val">${sessions.filter(s => s.completed_at).length}</div><div class="stat-lbl">Sessions Done</div></div>
                  <div class="stat"><div class="stat-val">${avgScore}</div><div class="stat-lbl">Avg Score</div></div>
                  <div class="stat"><div class="stat-val">${bestScore}</div><div class="stat-lbl">Best Score</div></div>
                </div>

                ${scores.length > 0 ? `
                <div class="section">
                  <div class="section-title">Skill Scores by Role</div>
                  <table><thead><tr><th>Role</th><th>Score</th><th>Badge</th><th>Percentile</th><th>Last Updated</th></tr></thead>
                  <tbody>${scoreRows}</tbody></table>
                </div>` : ''}

                ${bdgs.length > 0 ? `
                <div class="section">
                  <div class="section-title">Earned Badges (${bdgs.length})</div>
                  <div style="margin-top:8px">${badgeItems}</div>
                </div>` : ''}

                ${sessions.length > 0 ? `
                <div class="section">
                  <div class="section-title">Recent Sessions (Last 10)</div>
                  <table><thead><tr><th>Scenario</th><th>Score</th><th>Badge</th><th>XP</th><th>Date</th></tr></thead>
                  <tbody>${sessionRows}</tbody></table>
                </div>` : ''}

                <div class="footer">
                  ThreatReady &nbsp;·&nbsp; Report generated on ${new Date().toLocaleString()} &nbsp;·&nbsp; Confidential
                </div>
              </body></html>`;

              const w = window.open('', '_blank');
              w.document.write(html);
              w.document.close();
              setTimeout(() => w.print(), 600);
              showToast('Report ready — use Print → Save as PDF', 'success');
            } catch (e) { showToast('Report failed: ' + e.message, 'error'); }
          }}>📊 Download My Report (PDF)</button>
          <button className="btn bdn" style={{ fontSize: 13 }} onClick={() => showConfirm('Delete your account permanently? All data will be lost.', async () => { const token = localStorage.getItem('token'); const res = await fetch('https://threatready-db.onrender.com/api/settings/delete-account', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { localStorage.clear(); setUser(null); setView('landing'); showToast('Account deleted.', 'info'); } })}>🗑️ Delete Account</button>
        </div>
      </div>
    </>
  );
}