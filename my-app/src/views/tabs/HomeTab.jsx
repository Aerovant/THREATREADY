// ═══════════════════════════════════════════════════════════════
// HOME TAB — REDESIGNED
// Welcome banner · 4 stat cards · Daily Challenge with countdown ·
// 2-col grid (Learning Paths + Weekly Leaderboard) ·
// 2-col grid (Launch Platform + Live Contests)
//
// All props/handlers preserved. Scoped CSS via .tr-home-* prefix.
// Hides the App.jsx default topbar "Welcome, name" header so we
// don't double-render the welcome.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";
import NoPasteInput from "../../components/NoPasteInput.jsx";

// ── Scoped CSS ──
const HOME_CSS = `
.tr-home-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1)}
/* Defensive: any button/link svg without explicit size caps at 18px */
.tr-home-root button svg:not([width]){width:16px;height:16px;flex-shrink:0}
.tr-home-root .tr-home-link svg:not([width]){width:14px;height:14px;flex-shrink:0}

/* Welcome banner */
.tr-home-welcome{margin-bottom:16px}
.tr-home-welcome-hello{font-size:18px;font-weight:500;color:var(--tx2);margin-bottom:2px}
.tr-home-welcome-name{
  font-size:30px;font-weight:800;letter-spacing:.5px;line-height:1.05;
  color:var(--ac);text-transform:uppercase;
  display:inline-flex;align-items:center;gap:10px;
}
.tr-home-welcome-wave{font-size:24px;animation:tr-wave 2.4s ease-in-out infinite;transform-origin:70% 70%}
@keyframes tr-wave{0%,60%,100%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-8deg)}30%{transform:rotate(12deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(8deg)}}
.tr-home-welcome-meta{font-size:13px;color:var(--tx2);margin-top:6px;font-weight:500}
.tr-home-welcome-meta strong{color:var(--ac);font-weight:600}

/* 4 stat cards row */
.tr-home-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px}
.tr-home-stat{
  display:flex;align-items:center;gap:16px;
  padding:18px 20px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  transition:all .25s ease;
}
.tr-home-stat:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(124,58,237,.08)}
.tr-home-stat-icon{
  width:52px;height:52px;flex-shrink:0;
  display:grid;place-items:center;
  border-radius:13px;
}
.tr-home-stat-icon.completed{background:#ede9fe;color:#6d28d9}
.tr-home-stat-icon.xp{background:#ede9fe;color:#7c3aed}
.tr-home-stat-icon.tracks{background:#fce7f3;color:#ec4899}
.tr-home-stat-icon.streak{background:#ffedd5;color:#f97316}
.tr-home-stat-icon svg{width:26px;height:26px}
.tr-home-stat-num{font-size:38px;font-weight:800;color:var(--tx1);line-height:1;letter-spacing:-1px}
.tr-home-stat-lbl{font-size:11px;color:var(--tx2);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:600}

/* Daily Challenge banner */
.tr-home-daily{
  display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:18px;
  padding:14px 18px;margin-bottom:14px;
  background:linear-gradient(135deg,#faf8ff 0%,#f3eeff 100%);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
}
.tr-home-daily-icon{
  width:48px;height:48px;flex-shrink:0;
  display:grid;place-items:center;
  background:linear-gradient(135deg,#ede9fe,#ddd6fe);
  border-radius:13px;color:#7c3aed;
}
.tr-home-daily-icon svg{width:26px;height:26px}
.tr-home-daily-title{font-size:15px;font-weight:700;color:var(--tx1)}
.tr-home-daily-meta{font-size:12px;color:var(--tx2);margin-top:2px;font-weight:500;letter-spacing:.2px}
.tr-home-daily-meta-tag{color:var(--ac);font-weight:600;text-transform:uppercase}
.tr-home-daily-timer{display:flex;gap:6px}
.tr-home-timer-cell{
  min-width:46px;text-align:center;padding:6px 4px;
  background:#fff;border:1px solid var(--bd,#e9e5f3);border-radius:9px;
}
.tr-home-timer-num{font-size:18px;font-weight:800;color:var(--tx1);line-height:1;font-variant-numeric:tabular-nums}
.tr-home-timer-lbl{font-size:9px;color:var(--tx2);text-transform:uppercase;letter-spacing:1px;margin-top:3px;font-weight:600}
.tr-home-daily-btn{
  padding:10px 18px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;
  border-radius:11px;
  font-size:13px;font-weight:600;
  cursor:pointer;
  display:inline-flex;align-items:center;gap:8px;
  box-shadow:0 6px 18px rgba(124,58,237,.3);
  transition:all .2s ease;
}
.tr-home-daily-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(124,58,237,.4)}
.tr-home-daily-btn.complete{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 6px 18px rgba(16,185,129,.3)}

/* Main 2-col grid */
.tr-home-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}

/* Card */
.tr-home-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px;
  display:flex;flex-direction:column;min-height:0;
}
.tr-home-card-head{
  display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;
}
.tr-home-card-title{
  font-size:12px;font-weight:700;color:var(--ac);
  text-transform:uppercase;letter-spacing:2px;
}
.tr-home-link{
  font-size:12px;font-weight:600;color:var(--ac);
  cursor:pointer;display:inline-flex;align-items:center;gap:4px;
  background:none;border:none;padding:0;font-family:inherit;
}
.tr-home-link:hover{color:#5b21b6}

/* Learning paths — empty state */
.tr-home-empty{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:16px 12px 8px;
}
.tr-home-empty-icon{
  width:54px;height:54px;
  display:grid;place-items:center;
  background:#ede9fe;color:#7c3aed;border-radius:14px;margin-bottom:10px;
}
.tr-home-empty-icon svg{width:28px;height:28px}
.tr-home-empty-title{font-size:14px;font-weight:600;color:var(--tx1);margin-bottom:4px}
.tr-home-empty-sub{font-size:12px;color:var(--tx2);margin-bottom:14px;max-width:280px;line-height:1.45}
.tr-home-btn-primary{
  padding:10px 20px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;
  border-radius:11px;
  font-size:13px;font-weight:600;
  cursor:pointer;
  display:inline-flex;align-items:center;gap:7px;
  box-shadow:0 6px 18px rgba(124,58,237,.25);
  transition:all .2s ease;
  font-family:inherit;
}
.tr-home-btn-primary:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(124,58,237,.35)}
.tr-home-btn-outline{
  padding:9px 16px;
  background:#fff;
  color:var(--ac);
  border:1.5px dashed var(--bd2,#d4cce8);
  border-radius:11px;
  font-size:13px;font-weight:600;
  cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  transition:all .2s ease;
  width:100%;
  font-family:inherit;
}
.tr-home-btn-outline:hover{background:#faf8ff;border-color:var(--ac);border-style:solid}

/* Learning paths — populated list */
.tr-home-paths{display:flex;flex-direction:column;gap:8px;flex:1;overflow-y:auto;padding-right:2px}
.tr-home-paths::-webkit-scrollbar{width:5px}
.tr-home-paths::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}
.tr-home-path-row{
  display:flex;align-items:center;gap:12px;
  padding:10px 12px;
  background:#faf8ff;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  cursor:pointer;
  transition:all .2s ease;
}
.tr-home-path-row:hover{background:#f3eeff;border-color:var(--ac);transform:translateX(2px)}
.tr-home-path-icon{font-size:22px;line-height:1}
.tr-home-path-name{font-size:13px;font-weight:600;color:var(--tx1)}
.tr-home-path-sub{font-size:11px;color:var(--tx2);margin-top:1px}
.tr-home-path-arrow{margin-left:auto;color:var(--ac);font-size:11px;font-weight:600}

/* Leaderboard podium */
.tr-home-podium{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;align-items:end}
.tr-home-podium-cell{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 4px}
.tr-home-podium-avatar{
  width:48px;height:48px;border-radius:50%;
  display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,#a78bfa,#7c3aed);
  position:relative;
  box-shadow:0 6px 16px rgba(124,58,237,.25);
}
.tr-home-podium-avatar svg{width:18px;height:18px}
.tr-home-podium-cell.first .tr-home-podium-avatar{width:58px;height:58px;background:linear-gradient(135deg,#c4b5fd,#7c3aed);box-shadow:0 10px 24px rgba(124,58,237,.45)}
.tr-home-podium-cell.first .tr-home-podium-avatar svg{width:22px;height:22px}
.tr-home-podium-rank{
  position:absolute;top:-8px;right:-6px;
  width:22px;height:22px;border-radius:50%;
  display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#fff;
  border:2px solid var(--s1,#fff);
}
.tr-home-podium-cell.first .tr-home-podium-rank{background:#f59e0b;width:24px;height:24px}
.tr-home-podium-cell.second .tr-home-podium-rank{background:#94a3b8}
.tr-home-podium-cell.third .tr-home-podium-rank{background:#cd7f32}
.tr-home-podium-name{font-size:12.5px;font-weight:600;color:var(--tx1);margin-top:8px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-home-podium-xp{font-size:11px;color:var(--tx2);margin-top:2px;font-weight:500}

/* Leaderboard rows */
.tr-home-board{display:flex;flex-direction:column;gap:4px;flex:1;min-height:0;overflow-y:auto;padding-right:2px}
.tr-home-board::-webkit-scrollbar{width:5px}
.tr-home-board::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}
.tr-home-board-row{
  display:grid;grid-template-columns:24px 28px 1fr auto;align-items:center;gap:10px;
  padding:7px 10px;border-radius:8px;
  transition:background .15s;
}
.tr-home-board-row:hover{background:#faf8ff}
.tr-home-board-row.you{background:#f3eeff;border:1px solid #c4b5fd;padding:7px 10px}
.tr-home-board-rank{font-size:12px;color:var(--tx2);font-weight:600;text-align:center}
.tr-home-board-row.you .tr-home-board-rank{color:var(--ac);font-weight:700}
.tr-home-board-avatar{
  width:24px;height:24px;border-radius:50%;
  display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,#a78bfa,#7c3aed);
  font-size:10px;font-weight:700;
}
.tr-home-board-name{font-size:12.5px;color:var(--tx1);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-home-board-row.you .tr-home-board-name{color:var(--ac);font-weight:700}
.tr-home-board-xp{font-size:12px;font-weight:600;color:var(--ac)}

/* Launch Platform card */
.tr-home-launch{
  background:linear-gradient(135deg,#faf8ff 0%,#f3eeff 50%,#ede9fe 100%);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px 20px;
  display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;
  overflow:hidden;position:relative;min-height:130px;
}
.tr-home-launch-name{font-size:18px;font-weight:800;color:var(--tx1);display:inline-flex;align-items:center;gap:8px;margin-bottom:4px}
.tr-home-launch-badge{
  font-size:9px;font-weight:700;color:#fff;
  background:linear-gradient(135deg,#7c3aed,#6d28d9);
  padding:2px 7px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;
  box-shadow:0 4px 12px rgba(124,58,237,.3);
}
.tr-home-launch-tag{font-size:13px;color:var(--tx2);line-height:1.4;margin-bottom:12px}
.tr-home-launch-tag strong{color:var(--tx1);font-weight:600;display:block}
.tr-home-launch-btn{
  padding:8px 16px;
  background:#fff;
  color:var(--ac);
  border:1px solid var(--bd2,#d4cce8);
  border-radius:10px;
  font-size:12.5px;font-weight:600;
  cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  transition:all .2s ease;
  font-family:inherit;
}
.tr-home-launch-btn:hover{background:var(--ac);color:#fff;border-color:var(--ac);transform:translateY(-1px)}
.tr-home-launch-art{
  width:110px;height:110px;flex-shrink:0;
  display:grid;place-items:center;
  position:relative;
}

/* Live contests */
.tr-home-contest-card{
  display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:14px;
  padding:14px;
  background:#faf8ff;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
}
.tr-home-contest-icon{
  width:42px;height:42px;flex-shrink:0;
  display:grid;place-items:center;
  background:linear-gradient(135deg,#ede9fe,#ddd6fe);
  border-radius:11px;color:#7c3aed;
}
.tr-home-contest-icon svg{width:22px;height:22px}
.tr-home-contest-title{font-size:13.5px;font-weight:700;color:var(--tx1);display:inline-flex;align-items:center;gap:8px}
.tr-home-contest-live{
  display:inline-flex;align-items:center;gap:5px;
  font-size:10.5px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;
}
.tr-home-contest-live::before{content:"";width:7px;height:7px;border-radius:50%;background:#dc2626;animation:tr-pulse-live 1.6s ease-in-out infinite}
@keyframes tr-pulse-live{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{opacity:.7;box-shadow:0 0 0 6px rgba(220,38,38,0)}}
.tr-home-contest-sub{font-size:11.5px;color:var(--tx2);margin-top:3px;font-weight:500}
.tr-home-contest-count{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--tx2);font-weight:600}
.tr-home-contest-count svg{width:14px;height:14px}
.tr-home-contest-btn{
  padding:8px 14px;
  background:#fff;
  color:var(--ac);
  border:1px solid var(--ac);
  border-radius:10px;
  font-size:12.5px;font-weight:600;
  cursor:pointer;
  transition:all .2s ease;
  font-family:inherit;
}
.tr-home-contest-btn:hover{background:var(--ac);color:#fff;transform:translateY(-1px)}

/* Responsive */
@media (max-width: 980px){
  .tr-home-stats{grid-template-columns:repeat(2,1fr)}
  .tr-home-grid{grid-template-columns:1fr}
  .tr-home-daily{grid-template-columns:auto 1fr;gap:12px}
  .tr-home-daily-timer{grid-column:1 / -1;justify-content:center}
  .tr-home-daily-btn{grid-column:1 / -1;justify-content:center}
}
`;

// ── Helpers ──
const initials = (name) => {
  if (!name) return "??";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "??";
};
const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

// Extract a ranking value from any of the possible backend field names,
// then format it nicely. Returns { value, suffix }.
//   - 0-10 range → treated as a score (e.g. "8.5") with " / 10" suffix
//   - larger    → treated as XP (e.g. "1,980") with " XP" suffix
//   - null/NaN  → "—" with no suffix
const formatRanking = (p) => {
  if (!p) return { value: "—", suffix: "" };
  const raw = p.best_score ?? p.avg_score ?? p.score ?? p.xp ?? p.total_xp ?? p.points;
  if (raw == null) return { value: "—", suffix: "" };
  const n = parseFloat(raw);
  if (isNaN(n)) return { value: "—", suffix: "" };
  if (n >= 0 && n <= 10) return { value: n.toFixed(1), suffix: " / 10" };
  return { value: Math.round(n).toLocaleString(), suffix: " XP" };
};

// Hours/mins/secs until next local midnight (when daily challenge resets)
function useCountdownToMidnight() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const d = new Date();
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    const ms = Math.max(0, next - now);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return { h, m, s };
  }, [now]);
}

// ── SVG icons ──
const I = {
  bookmark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><polyline points="9 11 12 14 17 9"/></svg>,
  bolt: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 11-12h-7l1-8z"/></svg>,
  tracks: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  flame: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 3-3 4-3 7s2 4 3 4 3-1 3-4-3-4-3-7zm-2 12c-2 2-3 4-3 6 0 2 2 4 5 4s5-2 5-4-1-4-3-6c0 1-1 2-2 2s-2-1-2-2z"/></svg>,
  target: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  map: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  trophy: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3v6a6 6 0 0 0 12 0V3z"/><path d="M9 18v2h6v-2"/><path d="M9 21h6"/></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // Decorative shield for Launch card
  shield: (
    <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="trShieldGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="55%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <radialGradient id="trShieldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity=".5"/>
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#trShieldGlow)"/>
      <g transform="translate(60 60)">
        <g transform="rotate(0)">
          <polygon points="-32,-28 32,-28 38,-20 0,40 -38,-20" fill="url(#trShieldGrad)" opacity=".18"/>
          <polygon points="-26,-22 26,-22 30,-15 0,32 -30,-15" fill="url(#trShieldGrad)" opacity=".5"/>
          <polygon points="-20,-16 20,-16 22,-10 0,24 -22,-10" fill="url(#trShieldGrad)"/>
          <path d="M-8,-2 L-2,6 L10,-6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
      </g>
    </svg>
  ),
};

export default function HomeTab({
  user,
  isPaid,
  xp,
  setXp,
  streak,
  completedScenarios,
  subscribedRoles,
  dailyChallenge,
  dailyAnswered,
  setDailyAnswered,
  dailyResult,
  setDailyResult,
  dailyChallengeError,
  setDailyChallengeError,
  showDailyModal,
  setShowDailyModal,
  dailyAnswer,
  setDailyAnswer,
  dailyVoice,
  dailyInputMode,
  setDailyInputMode,
  dailyLoading,
  setDailyLoading,
  leaderboard,
  myRank,
  setActiveRole,
  setView,
  setDashTab,
  setAuthMode,
  setAuthStep,
  loadDashboardExtras,
}) {
  const countdown = useCountdownToMidnight();
  const userName = user?.name || "Agent";
  const attemptsLeft = Math.max(0, 2 - (completedScenarios?.length || 0));

  // Build top-3 + ranked list for leaderboard
  const top3 = (leaderboard || []).slice(0, 3);
  const rest = (leaderboard || []).slice(3);
  // If user not visible in any list, append them
  const youInList = !!(user?.id && [...top3, ...rest].some(p => p?.id === user.id));
  const youRow = (!youInList && user?.id) ? {
    id: user.id,
    name: userName,
    xp: xp || 0,
    rank: myRank || null,
    you: true,
  } : null;

  return (
    <>
      <style>{HOME_CSS}</style>

      <div className="tr-home-root">

        {/* ─────────── Welcome banner ─────────── */}
        <div className="tr-home-welcome fadeUp">
          <div className="tr-home-welcome-hello">Welcome back,</div>
          <div className="tr-home-welcome-name">
            {userName}!
            <span className="tr-home-welcome-wave">👋</span>
          </div>
          <div className="tr-home-welcome-meta">
            {isPaid
              ? <><strong>{subscribedRoles?.length || 0} tracks</strong> · {completedScenarios?.length || 0} completed · {streak || 0} day streak</>
              : <>Free trial · <strong>{attemptsLeft} attempts left</strong> · {completedScenarios?.length || 0} completed · {streak || 0} day streak</>
            }
          </div>
        </div>

        {/* ─────────── 4 Stat cards ─────────── */}
        <div className="tr-home-stats">
          {[
            { v: completedScenarios?.length || 0, l: "Completed", k: "completed", i: I.bookmark },
            { v: xp || 0,                          l: "Total XP",  k: "xp",         i: I.bolt },
            { v: subscribedRoles?.length || 1,     l: "Tracks",    k: "tracks",     i: I.tracks },
            { v: streak || 0,                      l: "Streak",    k: "streak",     i: I.flame },
          ].map((s, i) => (
            <div key={i} className="tr-home-stat fadeUp" style={{ animationDelay: `${i * .05}s` }}>
              <div className={`tr-home-stat-icon ${s.k}`}>{s.i}</div>
              <div>
                <div className="tr-home-stat-num">{s.v}</div>
                <div className="tr-home-stat-lbl">{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─────────── Daily Challenge banner ─────────── */}
        <div className="tr-home-daily fadeUp">
          <div className="tr-home-daily-icon">{I.target}</div>
          <div>
            <div className="tr-home-daily-title">
              {dailyAnswered ? "Daily Challenge Complete! ✓" : dailyChallengeError ? "Daily Challenge Unavailable" : "Daily Challenge"}
            </div>
            <div className="tr-home-daily-meta">
              {dailyChallenge ? (
                <>
                  <span className="tr-home-daily-meta-tag">{dailyChallenge.role_id || "Security"}</span>
                  {" · "}{dailyChallenge.difficulty || "beginner"} · +{dailyChallenge.points || 50} XP
                </>
              ) : dailyChallengeError ? "Could not load today's challenge — try refresh"
                : "Loading today's challenge…"}
            </div>
          </div>
          <div className="tr-home-daily-timer">
            <div className="tr-home-timer-cell"><div className="tr-home-timer-num">{pad(countdown.h)}</div><div className="tr-home-timer-lbl">Hrs</div></div>
            <div className="tr-home-timer-cell"><div className="tr-home-timer-num">{pad(countdown.m)}</div><div className="tr-home-timer-lbl">Min</div></div>
            <div className="tr-home-timer-cell"><div className="tr-home-timer-num">{pad(countdown.s)}</div><div className="tr-home-timer-lbl">Sec</div></div>
          </div>
          {dailyChallengeError ? (
            <button className="tr-home-daily-btn" onClick={() => { setDailyChallengeError(false); loadDashboardExtras && loadDashboardExtras(); }}>
              Retry
            </button>
          ) : dailyAnswered ? (
            <button className="tr-home-daily-btn complete" disabled style={{ cursor: "default", opacity: .9 }}>
              Done ✓
            </button>
          ) : (
            <button className="tr-home-daily-btn" disabled={!dailyChallenge} onClick={() => setShowDailyModal(true)}>
              Start Challenge {I.arrow}
            </button>
          )}
        </div>

        {/* ─────────── Learning Paths + Leaderboard ─────────── */}
        <div className="tr-home-grid">

          {/* Learning Paths */}
          <div className="tr-home-card fadeUp" style={{ minHeight: 280 }}>
            <div className="tr-home-card-head">
              <span className="tr-home-card-title">Learning Paths</span>
            </div>

            {(subscribedRoles && subscribedRoles.length > 0) ? (
              <>
                <div className="tr-home-paths">
                  {subscribedRoles.map(rid => {
                    const role = ROLES.find(r => r.id === rid);
                    if (!role) return null;
                    const completed = (completedScenarios || []).filter(s => s?.startsWith(rid[0])).length;
                    return (
                      <div key={rid} className="tr-home-path-row" onClick={() => { setActiveRole(rid); setView("difficulty", { role: rid }); }}>
                        <span className="tr-home-path-icon">{role.icon}</span>
                        <div>
                          <div className="tr-home-path-name">{role.name}</div>
                          <div className="tr-home-path-sub">{completed} completed</div>
                        </div>
                        <span className="tr-home-path-arrow">Open →</span>
                      </div>
                    );
                  })}
                </div>
                <button className="tr-home-btn-outline" style={{ marginTop: 10 }}
                  onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
                  {I.plus} Add More Tracks
                </button>
              </>
            ) : (
              <>
                <div className="tr-home-empty">
                  <div className="tr-home-empty-icon">{I.map}</div>
                  <div className="tr-home-empty-title">No roles selected yet</div>
                  <div className="tr-home-empty-sub">Choose a role to unlock personalized learning paths.</div>
                  <button className="tr-home-btn-primary"
                    onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
                    {I.plus} Select Roles
                  </button>
                </div>
                <button className="tr-home-btn-outline" style={{ marginTop: 8 }}
                  onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
                  {I.plus} Add More Tracks
                </button>
              </>
            )}
          </div>

          {/* Weekly Leaderboard */}
          <div className="tr-home-card fadeUp" style={{ minHeight: 280 }}>
            <div className="tr-home-card-head">
              <span className="tr-home-card-title">Weekly Leaderboard</span>
              <button className="tr-home-link" onClick={() => { setDashTab("scores"); localStorage.setItem('cyberprep_tab', 'scores'); }}>
                View Full Leaderboard →
              </button>
            </div>

            {(leaderboard && leaderboard.length > 0) ? (
              <>
                {/* Top 3 podium — order: 2nd, 1st, 3rd */}
                {top3.length >= 1 && (
                  <div className="tr-home-podium">
                    {[
                      { p: top3[1], cls: "second", rank: 2 },
                      { p: top3[0], cls: "first",  rank: 1 },
                      { p: top3[2], cls: "third",  rank: 3 },
                    ].map((c, i) => {
                      if (!c.p) return <div key={i} className={`tr-home-podium-cell ${c.cls}`} style={{ visibility: "hidden" }} />;
                      const r = formatRanking(c.p);
                      return (
                        <div key={i} className={`tr-home-podium-cell ${c.cls}`}>
                          <div className="tr-home-podium-avatar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span className="tr-home-podium-rank">{c.rank}</span>
                          </div>
                          <div className="tr-home-podium-name">{c.p.name || "Anonymous"}</div>
                          <div className="tr-home-podium-xp">{r.value}<span style={{ opacity: .65 }}>{r.suffix}</span></div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ranks 4-5 */}
                <div className="tr-home-board">
                  {rest.map((p, i) => {
                    const r = formatRanking(p);
                    return (
                      <div key={p.id ?? i} className={`tr-home-board-row ${p.id === user?.id ? "you" : ""}`}>
                        <span className="tr-home-board-rank">{i + 4}</span>
                        <span className="tr-home-board-avatar">{initials(p.name)}</span>
                        <span className="tr-home-board-name">{p.id === user?.id ? `You (${userName})` : p.name || "Anonymous"}</span>
                        <span className="tr-home-board-xp">{r.value}<span style={{ opacity: .6, fontWeight: 500 }}>{r.suffix}</span></span>
                      </div>
                    );
                  })}
                  {youRow && (
                    <div className="tr-home-board-row you">
                      <span className="tr-home-board-rank">{myRank || "—"}</span>
                      <span className="tr-home-board-avatar">{initials(userName)}</span>
                      <span className="tr-home-board-name">You ({userName})</span>
                      <span className="tr-home-board-xp">{(xp || 0).toLocaleString()}<span style={{ opacity: .6, fontWeight: 500 }}> XP</span></span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="tr-home-empty">
                <div className="tr-home-empty-icon">{I.trophy}</div>
                <div className="tr-home-empty-title">No rankings yet</div>
                <div className="tr-home-empty-sub">
                  {isPaid ? "Complete assessments this week to appear here." : "Subscribe to unlock the weekly leaderboard."}
                </div>
                {!isPaid && (
                  <button className="tr-home-btn-primary"
                    onClick={() => {
                      localStorage.setItem('cyberprep_prev_view', 'dashboard');
                      setAuthMode && setAuthMode("login");
                      setAuthStep && setAuthStep("form");
                      setView && setView("auth");
                    }}>
                    Sign In to Unlock
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─────────── Launch Platform + Live Contests ─────────── */}
        <div className="tr-home-grid">

          {/* Launch Platform */}
          <div className="tr-home-launch fadeUp">
            <div>
              <div className="tr-home-launch-name">
                ThreatReady.io
                <span className="tr-home-launch-badge">New</span>
              </div>
              <div className="tr-home-launch-tag">
                <strong>Real-world incidents.</strong>
                Real-time readiness.
              </div>
              <button className="tr-home-launch-btn" onClick={() => { setDashTab("interview"); localStorage.setItem('cyberprep_tab', 'interview'); }}>
                Launch Platform {I.arrow}
              </button>
            </div>
            <div className="tr-home-launch-art" aria-hidden="true">{I.shield}</div>
          </div>

          {/* Live Contests */}
          <div className="tr-home-card fadeUp" style={{ padding: 14 }}>
            <div className="tr-home-card-head" style={{ marginBottom: 10 }}>
              <span className="tr-home-card-title">Live Contests</span>
              <button className="tr-home-link" onClick={() => showToast("More contests coming soon!", "info")}>
                View All Contests →
              </button>
            </div>
            <div className="tr-home-contest-card">
              <div className="tr-home-contest-icon">{I.trophy}</div>
              <div>
                <div className="tr-home-contest-title">
                  SOC Showdown
                  <span className="tr-home-contest-live">Live</span>
                </div>
                <div className="tr-home-contest-sub">Ends in 2d 14h 30m</div>
              </div>
              <div className="tr-home-contest-count">
                {I.users} 342
              </div>
              <button className="tr-home-contest-btn"
                onClick={() => showToast("Contest registration opening soon!", "info")}>
                Join Now
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────── Daily Challenge Modal (preserved from original) ─────────── */}
      {showDailyModal && dailyChallenge && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="card" style={{ background: "var(--s1)", maxWidth: 540, width: "100%", padding: 22, borderRadius: 16, border: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ac)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                  Daily Challenge · +{dailyChallenge.points || 50} XP
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>
                  {(dailyChallenge.role_id || "").toUpperCase()} · {dailyChallenge.difficulty || "beginner"}
                </div>
              </div>
              <button className="btn bs" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setShowDailyModal(false)}>✕</button>
            </div>
            <div style={{ fontSize: 14, color: "var(--tx1)", fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>
              {dailyChallenge.question}
            </div>
            {dailyChallenge.hint && (
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                💡 Hint: {dailyChallenge.hint}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button className={`btn ${dailyInputMode === "text" ? "bp" : "bs"}`}
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => setDailyInputMode("text")}>✏️ Type</button>
              <button className={`btn ${dailyInputMode === "voice" ? "bp" : "bs"}`}
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => setDailyInputMode("voice")}>🎤 Dictate</button>
            </div>
            {dailyInputMode === "text" ? (
              <NoPasteInput placeholder="Type your answer... (copy-paste disabled)"
                value={dailyAnswer} onChange={e => setDailyAnswer(e.target.value)}
                style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }} />
            ) : (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div className={`rec-ring ${dailyVoice.recording ? "active" : ""}`}
                  onClick={dailyVoice.recording ? dailyVoice.stop : dailyVoice.start}
                  style={{ margin: "0 auto 8px" }}>{dailyVoice.recording ? "⏹" : "🎤"}</div>
                <div style={{ fontSize: 12, color: dailyVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                  {dailyVoice.recording ? "🔴 Recording... will continue even if you pause" : "Tap to start dictating"}
                </div>
                {(dailyVoice.transcript || dailyVoice.recording) && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, textAlign: "left" }}>
                      💡 Tip: Edit the text below to fix any recognition errors
                    </div>
                    <NoPasteInput
                      value={dailyVoice.transcript}
                      onChange={e => dailyVoice.setTranscript(e.target.value)}
                      placeholder="Your dictated answer will appear here. Edit to fix errors..."
                      style={{ minHeight: 80, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 13, textAlign: "left", lineHeight: 1.6, width: "100%" }}
                    />
                  </div>
                )}
              </div>
            )}
            {dailyResult && (
              <div style={{
                padding: 12, borderRadius: 10, marginBottom: 12,
                background: dailyResult.score >= 60 ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)",
                border: `1px solid ${dailyResult.score >= 60 ? "rgba(0,224,150,.3)" : "rgba(255,82,82,.3)"}`
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: dailyResult.score >= 60 ? "var(--ok)" : "var(--dn)" }}>
                  Score: {dailyResult.score}/100 · {dailyResult.correct ? "✅ Correct!" : "❌ Needs improvement"}
                </div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>{dailyResult.feedback}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn bs" style={{ flex: 1 }} onClick={() => setShowDailyModal(false)}>Close</button>
              {!dailyAnswered && (
                <button className="btn bp" style={{ flex: 2 }}
                  disabled={(!dailyAnswer.trim() && !dailyVoice.transcript?.trim()) || dailyLoading}
                  onClick={async () => {
                    setDailyLoading(true);
                    try {
                      const token = localStorage.getItem('token');
                      const finalAnswer = dailyInputMode === "voice"
                        ? (dailyVoice.transcript || '').trim()
                        : (dailyAnswer || '').trim();
                      const res = await fetch('https://threatready-db.onrender.com/api/daily-challenge/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ challenge_id: dailyChallenge.id, answer: finalAnswer })
                      });
                      const data = await res.json();
                      if (data.result) {
                        setDailyResult(data.result);
                        setDailyAnswered(true);
                        setXp(p => p + (data.result.points_earned || 0));
                        showToast(`+${data.result.points_earned} XP earned!`, 'success');
                      } else {
                        showToast(data.error || 'Submit failed', 'error');
                      }
                    } catch (e) { showToast('Error: ' + e.message, 'error'); }
                    setDailyLoading(false);
                  }}>
                  {dailyLoading ? 'Evaluating...' : 'Submit Answer →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
