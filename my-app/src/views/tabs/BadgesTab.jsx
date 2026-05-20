// ═══════════════════════════════════════════════════════════════
// BADGES TAB — REDESIGNED
// Matches reference design exactly:
//  - Title + subtitle
//  - 4 summary cards (Badges Earned / Rare / Total Points / 30-Day Streak)
//  - "YOUR BADGES" white card with 12 role slots in 3-col grid
//  - "MILESTONES" white card with 4 milestone rows
//
// Props preserved: user, badges, completedScenarios, streak
// ═══════════════════════════════════════════════════════════════
import { useMemo } from "react";
import { ROLES } from "../../constants.js";

// ── Scoped CSS ──
const BADGES_CSS = `
.tr-badges-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1)}

/* Header */
.tr-badges-head{margin-bottom:18px}
.tr-badges-title{font-size:26px;font-weight:800;letter-spacing:-.6px;margin:0 0 4px;color:var(--tx1)}
.tr-badges-sub{font-size:13.5px;color:var(--tx2);font-weight:500;margin:0;line-height:1.5}

/* 4 summary cards */
.tr-badges-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
.tr-badges-stat{
  display:flex;align-items:center;gap:14px;
  padding:16px 18px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  transition:all .25s ease;
}
.tr-badges-stat:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(124,58,237,.08)}
.tr-badges-stat-icon{
  width:48px;height:48px;flex-shrink:0;
  display:grid;place-items:center;
  background:#ede9fe;color:#7c3aed;
  border-radius:12px;
}
.tr-badges-stat-icon svg{width:24px;height:24px}
.tr-badges-stat-body{min-width:0}
.tr-badges-stat-num{font-size:26px;font-weight:800;color:var(--tx1);line-height:1;letter-spacing:-.6px}
.tr-badges-stat-lbl{font-size:13px;color:var(--tx1);margin-top:5px;font-weight:600}
.tr-badges-stat-sub{font-size:11.5px;color:var(--tx2);margin-top:3px;font-weight:500}

/* Section label */
.tr-badges-section-label{
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;
  margin-bottom:12px;
}

/* YOUR BADGES — big white card containing 12 slots */
.tr-badges-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  padding:22px;
  margin-bottom:18px;
}
.tr-badges-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.tr-badges-slot{
  display:flex;align-items:center;gap:14px;
  padding:14px 16px;
  background:var(--bg,#faf8ff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
  transition:all .2s ease;
}
.tr-badges-slot:hover{transform:translateY(-1px);border-color:#c4b5fd;box-shadow:0 6px 18px rgba(124,58,237,.06)}
.tr-badges-slot-icon{
  width:48px;height:48px;flex-shrink:0;
  display:grid;place-items:center;
  border-radius:12px;
}
.tr-badges-slot-icon svg{width:30px;height:30px}
.tr-badges-slot-body{min-width:0;flex:1}
.tr-badges-slot-name{font-size:13.5px;font-weight:700;color:var(--tx1);margin-bottom:4px;line-height:1.25}
.tr-badges-slot-status{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11.5px;color:var(--tx2);font-weight:500;
}
.tr-badges-slot-status svg{width:11px;height:11px}
/* Earned variant */
.tr-badges-slot.earned{
  background:linear-gradient(135deg,#faf8ff,#f3eeff);
  border-color:#c4b5fd;
}
.tr-badges-slot.earned .tr-badges-slot-status{color:#7c3aed;font-weight:600}
.tr-badges-tier{
  display:inline-block;
  margin-left:6px;
  padding:2px 7px;
  border-radius:6px;
  font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
}
.tr-badges-tier.bronze{background:#fef3c7;color:#92400e}
.tr-badges-tier.silver{background:#e2e8f0;color:#475569}
.tr-badges-tier.gold{background:#fde68a;color:#92400e}
.tr-badges-tier.platinum{background:#ede9fe;color:#6d28d9}

/* MILESTONES */
.tr-badges-milestones{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  overflow:hidden;
}
.tr-badges-milestone-row{
  display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:16px;
  padding:16px 22px;
  border-bottom:1px solid var(--bd,#e9e5f3);
  transition:background .15s ease;
  cursor:pointer;
}
.tr-badges-milestone-row:last-child{border-bottom:none}
.tr-badges-milestone-row:hover{background:var(--s2)}
.tr-badges-milestone-emoji{font-size:18px;line-height:1;width:24px;text-align:center}
.tr-badges-milestone-label{font-size:13.5px;color:var(--tx1);font-weight:500}
.tr-badges-milestone-progress{
  font-size:13px;font-weight:700;color:#7c3aed;
  font-family:'JetBrains Mono','SF Mono',monospace;
  white-space:nowrap;
}
.tr-badges-milestone-progress.done{color:#10b981}
.tr-badges-milestone-chev{color:var(--tx2);display:grid;place-items:center}
.tr-badges-milestone-chev svg{width:16px;height:16px}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE OVERRIDES — gradients + tier chips + slot states
   ═══════════════════════════════════════════════════════════════ */

/* Stat icons (Badges Earned / Rare Badges / Total Points / 30-Day Streak) */
[data-theme="dark"] .tr-badges-stat-icon{
  background: rgba(167,139,250,.18);
  color: #c4b5fd;
}
[data-theme="dark"] .tr-badges-stat:hover{
  box-shadow: 0 12px 28px rgba(0,0,0,.40), 0 0 0 1px rgba(167,139,250,.10);
}

/* Section labels (YOUR BADGES / MILESTONES) */
[data-theme="dark"] .tr-badges-section-label{
  color: #c4b5fd;
}

/* Big cards (YOUR BADGES card + MILESTONES card) */
[data-theme="dark"] .tr-badges-card,
[data-theme="dark"] .tr-badges-milestones{
  background: linear-gradient(180deg, rgba(255,255,255,.025) 0%, var(--s1) 100%);
  border-color: rgba(255,255,255,.08);
  box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.30);
}

/* Slot tiles (the 12 badge slots inside YOUR BADGES) */
[data-theme="dark"] .tr-badges-slot{
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.08);
}
[data-theme="dark"] .tr-badges-slot:hover{
  border-color: rgba(167,139,250,.30);
  box-shadow: 0 6px 18px rgba(0,0,0,.40), 0 0 0 1px rgba(167,139,250,.10);
}

/* EARNED slot variant — was light purple gradient */
[data-theme="dark"] .tr-badges-slot.earned{
  background: linear-gradient(135deg, rgba(167,139,250,.18), rgba(124,58,237,.12));
  border-color: rgba(167,139,250,.35);
}
[data-theme="dark"] .tr-badges-slot.earned .tr-badges-slot-status{
  color: #c4b5fd;
}

/* Tier chips — preserve their warm tier colors but adapt for dark bg */
[data-theme="dark"] .tr-badges-tier.bronze{
  background: rgba(217,119,6,.18);
  color: #fbbf24;
}
[data-theme="dark"] .tr-badges-tier.silver{
  background: rgba(148,163,184,.18);
  color: #cbd5e1;
}
[data-theme="dark"] .tr-badges-tier.gold{
  background: rgba(245,158,11,.20);
  color: #fde68a;
}
[data-theme="dark"] .tr-badges-tier.platinum{
  background: rgba(167,139,250,.22);
  color: #c4b5fd;
}

/* Milestone rows */
[data-theme="dark"] .tr-badges-milestone-row{
  border-bottom-color: rgba(255,255,255,.06);
}
[data-theme="dark"] .tr-badges-milestone-row:hover{
  background: rgba(167,139,250,.08);
}
[data-theme="dark"] .tr-badges-milestone-progress{
  color: #c4b5fd;
}
[data-theme="dark"] .tr-badges-milestone-progress.done{
  color: #34d399;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — tablet (≤880) + phone (≤640) + small (≤420)
   ═══════════════════════════════════════════════════════════════ */

/* Tablet */
@media (max-width:880px){
  .tr-badges-stats{grid-template-columns:repeat(2,1fr)}
  .tr-badges-grid{grid-template-columns:repeat(2,1fr)}
}

/* Phone */
@media (max-width: 640px){
  .tr-badges-stat{padding:14px;gap:12px}
  .tr-badges-stat-icon{width:42px;height:42px}
  .tr-badges-stat-icon svg{width:20px;height:20px}
  .tr-badges-stat-num{font-size:22px}
  .tr-badges-stat-lbl{font-size:12px}
  .tr-badges-stat-sub{font-size:10.5px}

  .tr-badges-card{padding:16px;border-radius:14px;margin-bottom:14px}
  .tr-badges-section-label{font-size:11px;letter-spacing:1.6px;margin-bottom:10px}

  .tr-badges-slot{padding:11px 12px;gap:11px}
  .tr-badges-slot-icon{width:42px;height:42px}
  .tr-badges-slot-icon svg{width:26px;height:26px}
  .tr-badges-slot-name{font-size:12.5px}
  .tr-badges-slot-status{font-size:10.5px}

  .tr-badges-tier{font-size:8.5px;padding:2px 6px;margin-left:4px}

  .tr-badges-milestone-row{padding:12px 14px;gap:11px}
  .tr-badges-milestone-emoji{font-size:16px}
  .tr-badges-milestone-label{font-size:12.5px}
  .tr-badges-milestone-progress{font-size:12px}
  .tr-badges-milestone-chev svg{width:14px;height:14px}
}

/* Small phone */
@media (max-width: 560px){
  .tr-badges-grid{grid-template-columns:1fr}
}

@media (max-width: 420px){
  .tr-badges-stats{grid-template-columns:1fr 1fr;gap:8px}
  .tr-badges-stat{padding:12px;gap:10px}
  .tr-badges-stat-icon{width:36px;height:36px}
  .tr-badges-stat-icon svg{width:18px;height:18px}
  .tr-badges-stat-num{font-size:19px}
  .tr-badges-stat-lbl{font-size:11.5px}

  .tr-badges-card{padding:14px;border-radius:12px}
  .tr-badges-slot{padding:10px 11px}
  .tr-badges-milestone-row{padding:10px 12px}
}
`;

// ── Summary-card icons ──
const SI = {
  shield: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ribbon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 18 17 22 15.79 13.88"/></svg>,
  sparkles: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z"/><path d="M19 4l.8 2L22 7l-2.2.8L19 10l-.8-2L16 7l2.2-.8L19 4z"/></svg>,
  calendar: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  lock: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ── Per-role SVG icons (matching the design's flat-colored icons) ──
const ROLE_ICONS = {
  cloud:     <svg viewBox="0 0 24 24" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"><path d="M19 18H6a4 4 0 0 1-.6-7.95A6 6 0 0 1 17.7 9.5 4.5 4.5 0 0 1 19 18z"/></svg>,
  devsecops: <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  appsec:    <svg viewBox="0 0 24 24" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  netsec:    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  prodsec:   <svg viewBox="0 0 24 24" fill="#a47148" stroke="#7c4a2a" strokeWidth="1.4" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline fill="none" stroke="#5a3418" points="3.27 6.96 12 12.01 20.73 6.96"/><line fill="none" stroke="#5a3418" x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  secarch:   <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V9l8-4 8 4v12"/><rect x="9" y="13" width="6" height="8" fill="#fcd34d"/><line x1="13" y1="5" x2="13" y2="13"/><line x1="13" y1="5" x2="18" y2="3"/></svg>,
  dfir:      <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  grc:       <svg viewBox="0 0 24 24" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="9" y="1.5" width="6" height="3" rx="1" fill="#94a3b8" stroke="none"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
  soc:       <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12a7 7 0 0 1 7-7" /><path d="M5 12a7 7 0 0 0 7 7"/><circle cx="5" cy="12" r="2" fill="#94a3b8"/><line x1="5" y1="14" x2="5" y2="22"/><line x1="2" y1="22" x2="8" y2="22"/></svg>,
  threat:    <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="#fee2e2"/><circle cx="12" cy="12" r="2.5" fill="#dc2626" stroke="none"/></svg>,
  red:       <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/><circle cx="9" cy="9" r="2.5" fill="#ef4444" opacity=".6"/></svg>,
  blue:      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb"/><circle cx="9" cy="9" r="2.5" fill="#3b82f6" opacity=".6"/></svg>,
  iam:       <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#0ea5e9"/><circle cx="12" cy="11" r="2" fill="#fff"/><path d="M12 13v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>,
  data:      <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" fill="#10b981"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" fill="#10b981" opacity=".8"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" fill="#10b981" opacity=".6"/></svg>,
  llm:       <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="#a855f7"/><circle cx="9.5" cy="9" r="1" fill="#fff"/><circle cx="14.5" cy="9" r="1" fill="#fff"/><path d="M9 12h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>,
};

// ── Tier → point value (used to compute Total Points) ──
const TIER_POINTS = { bronze: 25, silver: 50, gold: 100, platinum: 200 };

export default function BadgesTab({ user, badges, completedScenarios, streak }) {

  // Aggregate stats from props
  const stats = useMemo(() => {
    const arr = Array.isArray(badges) ? badges : [];
    const badgesEarned = arr.length;
    const rareBadges = arr.filter(b => b?.tier === "gold" || b?.tier === "platinum").length;
    const totalPoints = arr.reduce((sum, b) => sum + (TIER_POINTS[b?.tier] || 0), 0);
    const streakDays = Number(streak) || 0;
    return { badgesEarned, rareBadges, totalPoints, streakDays };
  }, [badges, streak]);

  // Build badge lookup for the 12 slots
  const badgeByRole = useMemo(() => {
    const m = {};
    (badges || []).forEach(b => { if (b?.role) m[b.role] = b; });
    return m;
  }, [badges]);

  // Milestones — computed from completedScenarios + streak
  const completedCount = Array.isArray(completedScenarios) ? completedScenarios.length : 0;
  const uniqueRoles = useMemo(() => {
    if (!Array.isArray(completedScenarios)) return 0;
    const ids = new Set();
    completedScenarios.forEach(s => {
      // s may be a string id like "cloud:beginner:1" or an object
      const key = typeof s === "string" ? s.split(":")[0] : (s?.role_id || s?.role);
      if (key) ids.add(key);
    });
    return ids.size;
  }, [completedScenarios]);

  const milestones = [
    { emoji: "🎯", label: "Complete your first scenario",       cur: Math.min(completedCount, 1),  goal: 1 },
    { emoji: "🔥", label: "Complete 10 scenarios",                cur: Math.min(completedCount, 10), goal: 10 },
    { emoji: "💼", label: "Complete interviews in all 12 roles",  cur: Math.min(uniqueRoles, 12),    goal: 12 },
    { emoji: "📅", label: "Maintain a 30-day streak",             cur: Math.min(stats.streakDays, 30), goal: 30 },
  ];

  return (
    <>
      <style>{BADGES_CSS}</style>

      <div className="tr-badges-root" style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>

        {/* ── Header ── */}
        <div className="tr-badges-head fadeUp">
          <h2 className="tr-badges-title">Badges</h2>
          <p className="tr-badges-sub">Earn badges by completing interviews, maintaining streaks, and achieving milestones.</p>
        </div>

        {/* ── 4 summary cards ── */}
        <div className="tr-badges-stats">
          {[
            { i: SI.shield,   num: stats.badgesEarned, lbl: "Badges Earned",  sub: stats.badgesEarned === 0 ? "Keep learning to earn badges" : `${stats.badgesEarned} unlocked` },
            { i: SI.ribbon,   num: stats.rareBadges,   lbl: "Rare Badges",    sub: stats.rareBadges === 0 ? "Locked" : `${stats.rareBadges} earned` },
            { i: SI.sparkles, num: stats.totalPoints,  lbl: "Total Points",   sub: stats.totalPoints === 0 ? "Earn points to unlock more" : `${stats.totalPoints} pts` },
            { i: SI.calendar, num: stats.streakDays,   lbl: "30-Day Streak",  sub: stats.streakDays === 0 ? "Start your streak today" : `${stats.streakDays}/30 days` },
          ].map((s, idx) => (
            <div key={idx} className="tr-badges-stat fadeUp" style={{ animationDelay: `${idx * .05}s` }}>
              <div className="tr-badges-stat-icon">{s.i}</div>
              <div className="tr-badges-stat-body">
                <div className="tr-badges-stat-num">{s.num}</div>
                <div className="tr-badges-stat-lbl">{s.lbl}</div>
                <div className="tr-badges-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── YOUR BADGES section ── */}
        <div className="tr-badges-section-label fadeUp">YOUR BADGES</div>
        <div className="tr-badges-card fadeUp">
          <div className="tr-badges-grid">
            {ROLES.map(r => {
              const b = badgeByRole[r.id];
              const earned = !!b;
              return (
                <div key={r.id} className={`tr-badges-slot${earned ? " earned" : ""}`}>
                  <div className="tr-badges-slot-icon">
                    {ROLE_ICONS[r.id] || <svg viewBox="0 0 24 24" fill="#cbd5e1"><circle cx="12" cy="12" r="10"/></svg>}
                  </div>
                  <div className="tr-badges-slot-body">
                    <div className="tr-badges-slot-name">{r.name}</div>
                    <span className="tr-badges-slot-status">
                      {earned ? SI.check : SI.lock}
                      {earned ? "Earned" : "Not earned"}
                      {earned && b.tier && <span className={`tr-badges-tier ${b.tier}`}>{b.tier}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MILESTONES section ── */}
        <div className="tr-badges-section-label fadeUp">MILESTONES</div>
        <div className="tr-badges-milestones fadeUp">
          {milestones.map((m, i) => {
            const done = m.cur >= m.goal;
            return (
              <div key={i} className="tr-badges-milestone-row">
                <span className="tr-badges-milestone-emoji">{m.emoji}</span>
                <span className="tr-badges-milestone-label">{m.label}</span>
                <span className={`tr-badges-milestone-progress${done ? " done" : ""}`}>{m.cur} / {m.goal}</span>
                <span className="tr-badges-milestone-chev">{SI.chev}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
