// ═══════════════════════════════════════════════════════════════
// PROFILE TAB — REDESIGNED
// Matches reference design:
//  - Title + subtitle
//  - 2-column layout
//    LEFT:  Profile Settings (name/email), Privacy (3 toggles), Data (download/delete)
//    RIGHT: Resume Context, Career Goals, Interview Readiness
//
// Preserved props:
//   user, resumeText, setResumeText, resumeAiData, setResumeAiData,
//   targetRole, setTargetRole, experienceLevel, setExperienceLevel, readiness
// Preserved backend calls:
//   /api/resume/upload, /api/profile/goals
// New backend calls (optional — graceful fail-toast if not present):
//   /api/profile/update, /api/profile/privacy, /api/account/delete
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";
import FileUpload from "../../components/FileUpload.jsx";

const API_BASE = "https://threatready-db.onrender.com";

// ── Scoped CSS ──
const PROFILE_CSS = `
.tr-prof-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1)}
.tr-prof-root svg:not([width]){width:16px;height:16px;flex-shrink:0}

/* Header */
.tr-prof-head{margin-bottom:18px}
.tr-prof-title{font-size:26px;font-weight:800;letter-spacing:-.6px;margin:0 0 4px;color:var(--tx1)}
.tr-prof-sub{font-size:13.5px;color:var(--tx2);font-weight:500;margin:0;line-height:1.5}

/* 2-column layout */
.tr-prof-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}
@media (max-width:1100px){.tr-prof-layout{grid-template-columns:1fr}}

.tr-prof-col{display:flex;flex-direction:column;gap:16px}

/* Card */
.tr-prof-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:20px;
}
.tr-prof-card-label{
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;
}

/* Form fields */
.tr-prof-field{margin-bottom:12px}
.tr-prof-field:last-of-type{margin-bottom:14px}
.tr-prof-field-label{
  display:block;font-size:12.5px;color:var(--tx1);font-weight:600;margin-bottom:6px;
}
.tr-prof-input{
  width:100%;
  padding:11px 14px;
  background:var(--s1);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  font-size:13.5px;color:var(--tx1);font-weight:500;
  font-family:inherit;box-sizing:border-box;
  transition:border-color .15s ease;
}
.tr-prof-input:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.1)}
.tr-prof-textarea{
  min-height:90px;
  resize:vertical;
}

/* Buttons */
.tr-prof-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:10px 18px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;
  border-radius:10px;
  font-size:13px;font-weight:600;
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-prof-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.3)}
.tr-prof-btn.full{width:100%}
.tr-prof-btn.danger{background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%)}
.tr-prof-btn.danger:hover{box-shadow:0 8px 20px rgba(239,68,68,.3)}
.tr-prof-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

/* Privacy toggle rows */
.tr-prof-toggle{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 0;
  border-bottom:1px solid var(--bd,#e9e5f3);
}
.tr-prof-toggle:last-child{border-bottom:none}
.tr-prof-toggle-label{font-size:13.5px;color:var(--tx1);font-weight:500}
.tr-prof-checkbox{
  position:relative;
  width:22px;height:22px;
  border:1.5px solid var(--bd,#d4cce8);
  border-radius:6px;
  background:var(--s1);cursor:pointer;
  display:grid;place-items:center;
  flex-shrink:0;
  transition:all .15s ease;
}
.tr-prof-checkbox:hover{border-color:#a78bfa}
.tr-prof-checkbox.on{background:#7c3aed;border-color:#7c3aed}
.tr-prof-checkbox svg{color:#fff;opacity:0}
.tr-prof-checkbox.on svg{opacity:1}
.tr-prof-checkbox input{
  position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;
}

/* Data section button row */
.tr-prof-data-btns{display:flex;flex-direction:column;gap:10px}

/* Resume card extras */
.tr-prof-resume-hint{
  font-size:12.5px;color:var(--tx2);line-height:1.5;margin-bottom:10px;
}
.tr-prof-resume-ok{
  margin-top:8px;font-size:12px;color:#10b981;font-weight:600;
}
.tr-prof-resume-formats{
  text-align:center;font-size:11.5px;color:var(--tx2);margin:8px 0 12px;
  text-transform:uppercase;letter-spacing:1px;font-weight:600;
}

/* AI analysis (kept from original, restyled) */
.tr-prof-ai{
  margin-top:14px;
  background:linear-gradient(135deg,#faf8ff,#f3eeff);
  border:1px solid #c4b5fd;
  border-radius:12px;
  padding:14px 16px;
}
[data-theme="dark"] .tr-prof-ai{
  background:linear-gradient(135deg, rgba(167,139,250,.10), rgba(124,58,237,.06));
  border-color: rgba(167,139,250,.30);
}
.tr-prof-ai-h{font-size:11.5px;font-weight:700;color:#7c3aed;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px}
[data-theme="dark"] .tr-prof-ai-h{color:#c4b5fd}
.tr-prof-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.tr-prof-pill{
  background:var(--s1);border:1px solid #c4b5fd;color:#6d28d9;
  font-size:12px;padding:4px 10px;border-radius:12px;font-weight:600;
}
[data-theme="dark"] .tr-prof-pill{
  background: rgba(167,139,250,.10);
  border-color: rgba(167,139,250,.30);
  color:#c4b5fd;
}
.tr-prof-pill.warn{border-color:#fcd34d;color:#92400e;background:#fffbeb}
[data-theme="dark"] .tr-prof-pill.warn{
  background: rgba(252,211,77,.10);
  border-color: rgba(252,211,77,.30);
  color: #fde68a;
}

/* Readiness card */
.tr-prof-readiness{text-align:center;padding:6px 0}
.tr-prof-readiness-score{
  font-size:40px;font-weight:800;letter-spacing:-1px;
  font-family:'JetBrains Mono','SF Mono',monospace;
  line-height:1;margin-bottom:6px;
}
.tr-prof-readiness-score .unit{font-size:18px;color:var(--tx2);font-weight:600}
.tr-prof-readiness-empty{
  font-size:32px;font-weight:700;color:var(--tx2);
  font-family:'JetBrains Mono','SF Mono',monospace;
  line-height:1;margin-bottom:14px;
}
.tr-prof-readiness-desc{font-size:13px;color:var(--tx2);line-height:1.55}
.tr-prof-readiness-desc small{font-size:12px;color:var(--tx2);display:block;margin-top:3px}
.tr-prof-readiness-stats{
  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;
}
.tr-prof-readiness-stat{text-align:center}
.tr-prof-readiness-stat-num{font-size:16px;font-weight:700;font-family:'JetBrains Mono',monospace}
.tr-prof-readiness-stat-lbl{font-size:11px;color:var(--tx2);margin-top:2px}
`;

// Icons (all sized explicitly)
const I = {
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  save: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

export default function ProfileTab({
  user,
  resumeText,
  setResumeText,
  resumeAiData,
  setResumeAiData,
  targetRole,
  setTargetRole,
  experienceLevel,
  setExperienceLevel,
  readiness,
}) {

  // ── Profile settings local state ──
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Privacy state (defaults match the design) ──
  const [privPublic, setPrivPublic] = useState(false);
  const [privLeaderboard, setPrivLeaderboard] = useState(true);
  const [privBenchmark, setPrivBenchmark] = useState(true);

  // Load saved privacy prefs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cyberprep_privacy_prefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.public === 'boolean') setPrivPublic(p.public);
        if (typeof p.leaderboard === 'boolean') setPrivLeaderboard(p.leaderboard);
        if (typeof p.benchmark === 'boolean') setPrivBenchmark(p.benchmark);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Keep name/email in sync if user prop arrives later
  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name);
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist privacy locally on every change (so the next mount remembers)
  const persistPrivacy = (next) => {
    try { localStorage.setItem('cyberprep_privacy_prefs', JSON.stringify(next)); } catch (_) {}
  };
  const togglePriv = (key) => {
    if (key === 'public')      { const v = !privPublic;      setPrivPublic(v);      persistPrivacy({ public: v, leaderboard: privLeaderboard, benchmark: privBenchmark }); }
    if (key === 'leaderboard') { const v = !privLeaderboard; setPrivLeaderboard(v); persistPrivacy({ public: privPublic, leaderboard: v, benchmark: privBenchmark }); }
    if (key === 'benchmark')   { const v = !privBenchmark;   setPrivBenchmark(v);   persistPrivacy({ public: privPublic, leaderboard: privLeaderboard, benchmark: v }); }
  };

  // ── Handlers ──
  const handleSaveProfile = async () => {
    if (!fullName.trim()) { showToast("Name cannot be empty", "warning"); return; }
    if (!email.trim() || !email.includes("@")) { showToast("Enter a valid email", "warning"); return; }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: fullName.trim(), email: email.trim() }),
      });
      if (res.ok) showToast("Profile updated", "success");
      else throw new Error("update_failed");
    } catch (_) {
      showToast("Could not save profile — please try again later", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      if (res.ok) showToast('Resume saved successfully!', 'success');
      else throw new Error("save_failed");
    } catch (e) { showToast('Failed to save resume', 'error'); }
  };

  const handleSaveGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/profile/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ target_role: targetRole, experience_level: experienceLevel }),
      });
      if (res.ok) showToast('Career goals saved!', 'success');
      else throw new Error("save_failed");
    } catch (_) { showToast('Failed to save goals', 'error'); }
  };

  const handleDownloadReport = () => {
    // Generates a print-ready PDF (opens print dialog in new window)
    const generated = new Date().toLocaleString();
    const esc = (s) => String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, "<br>");

    const privacyRow = (label, val) => `
      <tr><td>${esc(label)}</td><td><strong>${val ? "Yes" : "No"}</strong></td></tr>`;

    const readinessSection = readiness ? `
      <div class="section">
        <div class="section-h">Readiness Snapshot</div>
        <div class="readiness-grid">
          ${Object.entries(readiness).map(([k, v]) => `
            <div class="kv"><div class="k">${esc(k)}</div><div class="v">${esc(typeof v === "object" ? JSON.stringify(v) : v)}</div></div>
          `).join("")}
        </div>
      </div>` : "";

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>ThreatReady — Profile Report</title>
<style>
  @page { margin: 14mm 12mm; size: A4 portrait; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter','Segoe UI',Arial,sans-serif;color:#0f0a1f;padding:24px;font-size:12px;line-height:1.55}
  .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #7c3aed;padding-bottom:14px;margin-bottom:18px}
  .brand{font-size:22px;font-weight:800;letter-spacing:-.3px;color:#7c3aed}
  .brand .ico{display:inline-block;margin-right:6px}
  .meta{text-align:right;font-size:11px;color:#5b5475}
  h1{font-size:22px;font-weight:800;margin:2px 0 4px;letter-spacing:-.4px;color:#0f0a1f}
  .sub{font-size:12px;color:#5b5475}
  .section{margin:20px 0 14px;page-break-inside:avoid}
  .section-h{font-size:10px;font-weight:800;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e3dcf2}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .kv{padding:11px 14px;border:1px solid #e3dcf2;border-radius:9px;background:#faf8ff}
  .k{font-size:10px;font-weight:700;letter-spacing:1.2px;color:#5b5475;text-transform:uppercase;margin-bottom:4px}
  .v{font-size:13px;color:#0f0a1f;font-weight:600;word-break:break-word}
  table{width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e3dcf2;border-radius:9px;overflow:hidden}
  th{background:#f6f3ff;color:#5b5475;text-align:left;padding:9px 12px;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid #e3dcf2}
  td{padding:10px 12px;border-bottom:1px solid #f0eafa}
  tr:last-child td{border-bottom:none}
  .resume{padding:14px;border:1px solid #e3dcf2;border-radius:9px;background:#faf8ff;font-size:12px;line-height:1.65;color:#0f0a1f;white-space:pre-wrap}
  .empty{padding:14px;text-align:center;color:#8b85a4;font-size:11px;border:1px dashed #e3dcf2;border-radius:8px}
  .readiness-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .foot{margin-top:24px;padding-top:14px;border-top:1px solid #e3dcf2;font-size:10px;color:#8b85a4;text-align:center}
</style></head><body>
<div class="head">
  <div>
    <div class="brand"><span class="ico">⚡</span>THREATREADY</div>
    <h1>Profile Report</h1>
    <div class="sub">${esc(fullName || "User")} · ${esc(email || "—")}</div>
  </div>
  <div class="meta">Generated<br><strong>${esc(generated)}</strong></div>
</div>

<div class="section">
  <div class="section-h">Account Information</div>
  <div class="grid">
    <div class="kv"><div class="k">Full Name</div><div class="v">${esc(fullName || "—")}</div></div>
    <div class="kv"><div class="k">Email Address</div><div class="v">${esc(email || "—")}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-h">Privacy Preferences</div>
  <table>
    <thead><tr><th>Setting</th><th>Status</th></tr></thead>
    <tbody>
      ${privacyRow("Make profile public", privPublic)}
      ${privacyRow("Include in leaderboard", privLeaderboard)}
      ${privacyRow("Allow benchmarking data", privBenchmark)}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-h">Career Goals</div>
  <div class="grid">
    <div class="kv"><div class="k">Target Role</div><div class="v">${esc(targetRole || "—")}</div></div>
    <div class="kv"><div class="k">Experience Level</div><div class="v">${esc(experienceLevel || "—")}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-h">Resume / Context</div>
  ${resumeText ? `<div class="resume">${esc(resumeText)}</div>` : `<div class="empty">No resume context uploaded yet.</div>`}
</div>

${readinessSection}

<div class="foot">ThreatReady · Cybersecurity Interview Prep · Generated ${esc(generated)}</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };</script>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) { showToast("Pop-up blocked — please allow pop-ups to download your PDF report.", "error"); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    showToast("PDF report ready — check the new window", "success");
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.");
    if (!ok) return;
    const again = window.prompt('Type DELETE to confirm:');
    if (again !== 'DELETE') { showToast("Cancelled", "info"); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/account/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Account deleted", "success");
        try { localStorage.clear(); } catch (_) {}
        setTimeout(() => { window.location.href = "/"; }, 800);
      } else { throw new Error("delete_failed"); }
    } catch (_) {
      showToast("Could not delete account — please contact support", "error");
    }
  };

  return (
    <>
      <style>{PROFILE_CSS}</style>

      <div className="tr-prof-root" style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>

        {/* ── Header ── */}
        <div className="tr-prof-head fadeUp">
          <h2 className="tr-prof-title">Profile</h2>
          <p className="tr-prof-sub">Manage your personal information and privacy settings.</p>
        </div>

        {/* ── 2-column layout ── */}
        <div className="tr-prof-layout">

          {/* ════════ LEFT COLUMN ════════ */}
          <div className="tr-prof-col">

            {/* Profile Settings */}
            <div className="tr-prof-card fadeUp">
              <div className="tr-prof-card-label">Profile Settings</div>
              <div className="tr-prof-field">
                <label className="tr-prof-field-label">Full Name</label>
                <input type="text" className="tr-prof-input"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name" />
              </div>
              <div className="tr-prof-field">
                <label className="tr-prof-field-label">Email Address</label>
                <input type="email" className="tr-prof-input"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" />
              </div>
              <button type="button" className="tr-prof-btn"
                onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>

            {/* Privacy */}
            <div className="tr-prof-card fadeUp">
              <div className="tr-prof-card-label">Privacy</div>
              {[
                { id: 'public',      label: 'Make profile public',     val: privPublic },
                { id: 'leaderboard', label: 'Include in leaderboard',  val: privLeaderboard },
                { id: 'benchmark',   label: 'Allow benchmarking data', val: privBenchmark },
              ].map(t => (
                <label key={t.id} className="tr-prof-toggle">
                  <span className="tr-prof-toggle-label">{t.label}</span>
                  <span className={`tr-prof-checkbox${t.val ? ' on' : ''}`}>
                    <input type="checkbox" checked={t.val} onChange={() => togglePriv(t.id)} />
                    {I.check}
                  </span>
                </label>
              ))}
            </div>

            {/* Data */}
            <div className="tr-prof-card fadeUp">
              <div className="tr-prof-card-label">Data</div>
              <div className="tr-prof-data-btns">
                <button type="button" className="tr-prof-btn full" onClick={handleDownloadReport}>
                  {I.download} Download My Report (PDF)
                </button>
                <button type="button" className="tr-prof-btn full danger" onClick={handleDeleteAccount}>
                  {I.trash} Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN ════════ */}
          <div className="tr-prof-col">

            {/* Resume Context */}
            <div className="tr-prof-card fadeUp">
              <div className="tr-prof-card-label">Resume Context</div>
              <div className="tr-prof-resume-hint">
                Paste your resume here OR upload PDF/DOC/TXT below.<br />
                AI extracts key points automatically.
              </div>
              <textarea
                className="tr-prof-input tr-prof-textarea"
                placeholder=""
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              <div style={{ marginTop: 10 }}>
                <FileUpload onUpload={(text, aiData) => { setResumeText(text); if (aiData) setResumeAiData(aiData); }} label="Upload Resume (PDF/DOC/TXT)" />
              </div>
              <div className="tr-prof-resume-formats">PDF · TXT · DOC</div>
              <button type="button" className="tr-prof-btn full" onClick={handleSaveResume}>
                {I.save} Save Resume
              </button>
              {resumeText && <div className="tr-prof-resume-ok">✓ Resume loaded · AI will personalize your scenarios</div>}

              {/* AI analysis (conditional) */}
              {resumeAiData && (resumeAiData.skills?.length > 0 || resumeAiData.experience_years || resumeAiData.weak_areas?.length > 0) && (
                <div className="tr-prof-ai">
                  {resumeAiData.skills?.length > 0 && (
                    <>
                      <div className="tr-prof-ai-h">✓ We Detected</div>
                      <div className="tr-prof-pills">
                        {resumeAiData.skills.map((s, i) => (<span key={i} className="tr-prof-pill">{s}</span>))}
                      </div>
                    </>
                  )}
                  {resumeAiData.experience_years > 0 && (
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>
                      Experience: <strong style={{ color: "var(--tx1)" }}>{resumeAiData.experience_years} years</strong>
                      {resumeAiData.top_role && <> · Top strength: <strong style={{ color: "#10b981" }}>{resumeAiData.top_role}</strong></>}
                    </div>
                  )}
                  {resumeAiData.weak_areas?.length > 0 && (
                    <>
                      <div className="tr-prof-ai-h" style={{ color: "#92400e" }}>⚠ Areas to Improve</div>
                      <div className="tr-prof-pills">
                        {resumeAiData.weak_areas.map((a, i) => (<span key={i} className="tr-prof-pill warn">{a}</span>))}
                      </div>
                    </>
                  )}
                  {resumeAiData.recommended_difficulty && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "var(--tx2)" }}>
                      🎯 Start with <strong style={{ color: "#10b981", textTransform: "capitalize" }}>{resumeAiData.recommended_difficulty}</strong> difficulty
                      {resumeAiData.recommended_roles?.length > 0 && (
                        <> · focus on <strong style={{ color: "#7c3aed" }}>
                          {resumeAiData.recommended_roles.map(rid => ROLES.find(r => r.id === rid)?.name).filter(Boolean).join(", ")}
                        </strong></>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Career Goals */}
            <div className="tr-prof-card fadeUp">
              <div className="tr-prof-card-label">Career Goals</div>
              <div className="tr-prof-resume-hint" style={{ marginBottom: 14 }}>Target role and experience level</div>
              <div className="tr-prof-field">
                <select className="tr-prof-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  <option value="">Select target role…</option>
                  {ROLES.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
              <div className="tr-prof-field">
                <select className="tr-prof-input" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="">Select experience level…</option>
                  <option value="junior">Junior (0–2 years)</option>
                  <option value="mid">Mid (2–5 years)</option>
                  <option value="senior">Senior (5–8 years)</option>
                  <option value="lead">Lead (8+ years)</option>
                </select>
              </div>
              <button type="button" className="tr-prof-btn full" onClick={handleSaveGoals}>
                {I.save} Save Goals
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
