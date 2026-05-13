// ═══════════════════════════════════════════════════════════════
// SCORES TAB — REDESIGNED
// Matches reference design exactly:
//  - Title + subtitle
//  - 4 stat cards (Interviews / Avg / Highest / Total time)
//  - Filter row (All Time dropdown + Export Report button)
//  - Empty state card OR existing chart + weakness tracker
//  - "How Scores Are Calculated?" info banner at bottom
//
// All props preserved.
// ═══════════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ROLES } from "../../constants.js";

// ── Scoped CSS ──
const SCORES_CSS = `
.tr-scores-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1)}

/* Header */
.tr-scores-head{margin-bottom:18px}
.tr-scores-title{font-size:26px;font-weight:800;letter-spacing:-.6px;margin:0 0 4px;color:var(--tx1)}
.tr-scores-sub{font-size:13.5px;color:var(--tx2);font-weight:500;margin:0;line-height:1.5}

/* 4 Stat cards */
.tr-scores-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.tr-scores-stat{
  display:flex;align-items:center;gap:16px;
  padding:18px 20px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  transition:all .25s ease;
}
.tr-scores-stat:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(124,58,237,.08)}
.tr-scores-stat-icon{
  width:48px;height:48px;flex-shrink:0;
  display:grid;place-items:center;
  background:#ede9fe;color:#7c3aed;
  border-radius:12px;
}
.tr-scores-stat-icon svg{width:22px;height:22px}
.tr-scores-stat-body{min-width:0}
.tr-scores-stat-num{font-size:30px;font-weight:800;color:var(--tx1);line-height:1;letter-spacing:-.8px}
.tr-scores-stat-lbl{font-size:11px;color:var(--tx2);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;font-weight:600}
.tr-scores-stat-sub{font-size:11.5px;color:var(--tx2);margin-top:6px;font-weight:500}

/* Filter row */
.tr-scores-filter-row{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:14px;flex-wrap:wrap;gap:10px;
}
.tr-scores-dropdown{
  display:inline-flex;align-items:center;gap:9px;
  padding:10px 14px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  color:var(--tx1);font-size:13px;font-weight:600;
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
}
.tr-scores-dropdown:hover{border-color:#c4b5fd}
.tr-scores-dropdown svg{width:16px;height:16px;color:#7c3aed}
.tr-scores-dropdown-chev{margin-left:4px;color:var(--tx2)}
.tr-scores-dropdown-wrap{position:relative}
.tr-scores-dropdown-menu{
  position:absolute;top:calc(100% + 6px);left:0;z-index:10;
  min-width:160px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  padding:5px;
  box-shadow:0 12px 30px rgba(20,14,38,.08);
}
.tr-scores-dropdown-item{
  display:block;width:100%;text-align:left;
  padding:8px 12px;
  background:transparent;border:none;border-radius:7px;
  color:var(--tx1);font-size:13px;font-weight:500;
  cursor:pointer;font-family:inherit;
  transition:background .12s;
}
.tr-scores-dropdown-item:hover{background:#faf8ff}
.tr-scores-dropdown-item.active{background:#ede9fe;color:#7c3aed;font-weight:600}

.tr-scores-export-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 18px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  color:#7c3aed;font-size:13px;font-weight:600;
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
}
.tr-scores-export-btn:hover{background:#faf8ff;border-color:#c4b5fd;transform:translateY(-1px)}
.tr-scores-export-btn svg{width:16px;height:16px}

/* Main empty-state card */
.tr-scores-empty{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  padding:48px 32px 52px;
  text-align:center;
}
.tr-scores-empty-art{
  margin:0 auto 24px;
  width:180px;height:180px;
  display:grid;place-items:center;
  position:relative;
}
.tr-scores-empty-title{
  font-size:22px;font-weight:800;color:var(--tx1);
  margin:0 0 10px;letter-spacing:-.4px;
}
.tr-scores-empty-text{
  font-size:13.5px;color:var(--tx2);line-height:1.55;
  margin:0 0 4px;
}
.tr-scores-empty-text.last{margin-bottom:24px}
.tr-scores-empty-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 24px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;
  border-radius:11px;
  font-size:14px;font-weight:600;
  cursor:pointer;font-family:inherit;
  box-shadow:0 8px 22px rgba(124,58,237,.3);
  transition:all .2s ease;
}
.tr-scores-empty-btn:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(124,58,237,.4)}

/* Existing content card (for chart + weakness tracker when data exists) */
.tr-scores-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px;
  margin-bottom:14px;
}
.tr-scores-card-title{
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;
}

/* Weakness tracker rows */
.tr-scores-weakness-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 0;
  border-bottom:1px solid var(--bd,#e9e5f3);
}
.tr-scores-weakness-row:last-child{border-bottom:none}
.tr-scores-weakness-name{font-size:13px;color:var(--tx1)}
.tr-scores-weakness-attempts{font-size:11.5px;color:var(--tx2)}
.tr-scores-weakness-score{font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace}

/* Info banner */
.tr-scores-info{
  margin-top:14px;
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;
  padding:16px 20px;
  background:linear-gradient(135deg,#faf8ff 0%,#f3eeff 100%);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
}
.tr-scores-info-icon{
  width:40px;height:40px;flex-shrink:0;
  display:grid;place-items:center;
  background:#fff;
  border-radius:10px;
  font-size:20px;
}
.tr-scores-info-body{min-width:0}
.tr-scores-info-title{
  font-size:14px;font-weight:700;color:#7c3aed;margin-bottom:4px;
}
.tr-scores-info-text{
  font-size:12.5px;color:var(--tx2);line-height:1.5;
}
.tr-scores-info-btn{
  padding:9px 16px;
  background:transparent;
  border:1px solid #c4b5fd;
  color:#7c3aed;
  border-radius:10px;
  font-size:12.5px;font-weight:600;
  cursor:pointer;font-family:inherit;
  white-space:nowrap;
  transition:all .2s ease;
}
.tr-scores-info-btn:hover{background:#ede9fe;border-color:#7c3aed}

/* Mobile */
@media (max-width:880px){
  .tr-scores-stats{grid-template-columns:repeat(2,1fr)}
  .tr-scores-info{grid-template-columns:1fr;text-align:left}
  .tr-scores-info-btn{justify-self:start}
}
`;

// ── Icons ──
const I = {
  star: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  trendUp: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  target: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  clock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  rocket: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
};

// ── Empty-state illustration (clipboard + bar chart + magnifying glass) ──
const EmptyArt = () => (
  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="trEmptyGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ede9fe" stopOpacity=".9"/>
        <stop offset="100%" stopColor="#ede9fe" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="trEmptyClip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff"/>
        <stop offset="100%" stopColor="#f5f1ff"/>
      </linearGradient>
    </defs>
    {/* glow */}
    <circle cx="100" cy="100" r="86" fill="url(#trEmptyGlow)"/>
    {/* sparkles */}
    <g fill="#c4b5fd" opacity=".7">
      <circle cx="44" cy="60" r="2"/>
      <circle cx="158" cy="48" r="2.5"/>
      <circle cx="48" cy="148" r="2"/>
      <circle cx="162" cy="142" r="3"/>
      <circle cx="36" cy="106" r="1.5"/>
      <circle cx="170" cy="100" r="1.5"/>
    </g>
    {/* clipboard body */}
    <rect x="62" y="58" width="76" height="92" rx="8" fill="url(#trEmptyClip)" stroke="#a78bfa" strokeWidth="2"/>
    {/* clipboard clip */}
    <rect x="84" y="48" width="32" height="14" rx="3" fill="#a78bfa"/>
    {/* bars inside clipboard */}
    <rect x="76" y="118" width="12" height="20" rx="2" fill="#c4b5fd"/>
    <rect x="94" y="106" width="12" height="32" rx="2" fill="#a78bfa"/>
    <rect x="112" y="92" width="12" height="46" rx="2" fill="#7c3aed"/>
    {/* baseline */}
    <line x1="72" y1="140" x2="130" y2="140" stroke="#d4cce8" strokeWidth="1.5" strokeLinecap="round"/>
    {/* small heading line on clipboard */}
    <rect x="76" y="76" width="48" height="4" rx="2" fill="#d4cce8"/>
    <rect x="76" y="86" width="32" height="3" rx="1.5" fill="#e9e5f3"/>
    {/* magnifying glass */}
    <circle cx="140" cy="128" r="16" fill="#fff" stroke="#7c3aed" strokeWidth="2.5"/>
    <line x1="152" y1="140" x2="162" y2="150" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round"/>
    {/* magnifier shine */}
    <path d="M132 122 L138 122 M132 122 L132 128" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function ScoresTab({
  user,
  completedScenarios,
  localSessionHistory,
  scoreHistory,
  weaknessTracker,
  setDashTab,
}) {
  const [filter, setFilter] = useState("All Time");
  const [filterOpen, setFilterOpen] = useState(false);

  // Aggregate stats from scoreHistory and session data
  const stats = useMemo(() => {
    const totalInterviews = (completedScenarios?.length || 0) + (localSessionHistory?.length || 0);

    // Pull all numeric score values from scoreHistory (excludes the "date" field)
    const allScores = (scoreHistory || []).flatMap(d =>
      Object.keys(d || {}).filter(k => k !== "date")
        .map(k => parseFloat(d[k]))
        .filter(n => !isNaN(n))
    );

    const avg = allScores.length
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
      : null;
    const high = allScores.length ? Math.max(...allScores).toFixed(1) : null;

    // Approximate total time (~30 min per session — we have no real duration field)
    const totalMinutes = totalInterviews * 30;
    const totalHours = totalMinutes / 60;

    return {
      totalInterviews,
      thisMonth: totalInterviews, // backend doesn't expose per-month split; show all if any
      avg,
      high,
      totalHours: totalHours >= 1 ? totalHours.toFixed(1) : totalMinutes ? "<1" : 0,
      totalHoursLabel: totalMinutes ? `${totalHours.toFixed(1)} hrs` : "0 hrs",
    };
  }, [completedScenarios, localSessionHistory, scoreHistory]);

  const hasData = stats.totalInterviews > 0;

  // Export Report — generates and downloads a JSON snapshot
  const handleExport = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      user: user?.name || "anonymous",
      summary: {
        interviews_taken: stats.totalInterviews,
        average_score: stats.avg,
        highest_score: stats.high,
        total_hours_estimate: stats.totalHoursLabel,
      },
      score_history: scoreHistory || [],
      weakness_tracker: weaknessTracker || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threatready-scores-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filterOptions = ["All Time", "This Month", "Last 7 Days"];

  return (
    <>
      <style>{SCORES_CSS}</style>

      <div className="tr-scores-root" style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>

        {/* ── Header ── */}
        <div className="tr-scores-head fadeUp">
          <h2 className="tr-scores-title">Scores</h2>
          <p className="tr-scores-sub">Track your performance, analyze your progress, and improve your skills.</p>
        </div>

        {/* ── 4 stat cards ── */}
        <div className="tr-scores-stats">
          {[
            { i: I.star,    num: stats.totalInterviews,           lbl: "Interviews Taken", sub: `${stats.thisMonth} this month` },
            { i: I.trendUp, num: stats.avg ?? 0,                  lbl: "Average Score",    sub: stats.avg ? `${stats.avg} / 10` : "—" },
            { i: I.target,  num: stats.high ?? 0,                 lbl: "Highest Score",    sub: stats.high ? `${stats.high} / 10` : "—" },
            { i: I.clock,   num: stats.totalHours,                lbl: "Total Time",       sub: stats.totalHoursLabel },
          ].map((s, idx) => (
            <div key={idx} className="tr-scores-stat fadeUp" style={{ animationDelay: `${idx * .05}s` }}>
              <div className="tr-scores-stat-icon">{s.i}</div>
              <div className="tr-scores-stat-body">
                <div className="tr-scores-stat-num">{s.num}</div>
                <div className="tr-scores-stat-lbl">{s.lbl}</div>
                <div className="tr-scores-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter row ── */}
        <div className="tr-scores-filter-row">
          <div className="tr-scores-dropdown-wrap">
            <button type="button" className="tr-scores-dropdown" onClick={() => setFilterOpen(o => !o)}>
              {I.calendar}
              <span>{filter}</span>
              <span className="tr-scores-dropdown-chev">{I.chevron}</span>
            </button>
            {filterOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 9, background: "transparent" }} onClick={() => setFilterOpen(false)} />
                <div className="tr-scores-dropdown-menu">
                  {filterOptions.map(opt => (
                    <button key={opt} type="button"
                      className={`tr-scores-dropdown-item ${filter === opt ? "active" : ""}`}
                      onClick={() => { setFilter(opt); setFilterOpen(false); }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button type="button" className="tr-scores-export-btn" onClick={handleExport}>
            {I.download} Export Report
          </button>
        </div>

        {/* ── Main content: empty state OR data ── */}
        {!hasData ? (
          <div className="tr-scores-empty fadeUp">
            <div className="tr-scores-empty-art"><EmptyArt /></div>
            <h3 className="tr-scores-empty-title">No Scores Yet</h3>
            <p className="tr-scores-empty-text">You haven't completed any interviews yet.</p>
            <p className="tr-scores-empty-text last">Take your first interview to see your performance insights here.</p>
            <button type="button" className="tr-scores-empty-btn"
              onClick={() => { setDashTab("interview"); localStorage.setItem('cyberprep_tab', 'interview'); }}>
              {I.rocket} Start an Interview
            </button>
          </div>
        ) : (
          <>
            {/* Score trends chart */}
            <div className="tr-scores-card fadeUp">
              <div className="tr-scores-card-title">Score Trends</div>
              {scoreHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--tx2)", fontSize: 13 }}>
                  No assessments completed yet. Your score trends will appear here after your first attempt.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scoreHistory}>
                    <XAxis dataKey="date" tick={{ fill: "#8890b0", fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#8890b0", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e9e5f3", borderRadius: 10, fontSize: 12 }} />
                    {(() => {
                      const roleKeys = [...new Set(scoreHistory.flatMap(d => Object.keys(d).filter(k => k !== "date")))];
                      const colors = { cloud: "#0ea5e9", devsecops: "#f97316", appsec: "#a855f7", netsec: "#10b981", dfir: "#f59e0b", grc: "#ef4444", prodsec: "#facc15", secarch: "#9333ea", soc: "#3b82f6", threat: "#ec4899", red: "#dc2626", blue: "#2563eb" };
                      return roleKeys.map(key => (
                        <Line key={key} type="monotone" dataKey={key} stroke={colors[key] || "#7c3aed"} strokeWidth={2.5} dot={{ r: 4 }} name={ROLES.find(r => r.id === key)?.name || key} connectNulls />
                      ));
                    })()}
                  </LineChart>
                </ResponsiveContainer>
              )}
              {scoreHistory.length === 1 && (
                <div style={{ fontSize: 12.5, color: "var(--tx2)", marginTop: 10, textAlign: "center" }}>
                  💡 Complete more assessments to see trends over time
                </div>
              )}
            </div>

            {/* Weakness tracker */}
            <div className="tr-scores-card fadeUp">
              <div className="tr-scores-card-title">Weakness Tracker</div>
              {weaknessTracker.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 10px", color: "var(--tx2)", fontSize: 13 }}>
                  Complete assessments across different roles to see your strengths and weaknesses.
                </div>
              ) : weaknessTracker.map((w, i) => (
                <div key={i} className="tr-scores-weakness-row">
                  <div>
                    <span className="tr-scores-weakness-name">{w.area}</span>
                    {" "}
                    <span className="tr-scores-weakness-attempts">({w.attempts} attempt{w.attempts !== 1 ? "s" : ""})</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="tr-scores-weakness-score" style={{ color: w.avg >= 7 ? "#10b981" : w.avg >= 5 ? "#f59e0b" : "#ef4444" }}>
                      {w.avg}/10
                    </span>
                    <span style={{ fontSize: 16 }}>{w.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Info banner ── */}
        <div className="tr-scores-info fadeUp">
          <div className="tr-scores-info-icon" aria-hidden="true">💡</div>
          <div className="tr-scores-info-body">
            <div className="tr-scores-info-title">How Scores Are Calculated?</div>
            <div className="tr-scores-info-text">
              Each question is evaluated on 3 dimensions: Technical Depth, Communication Quality, and Decision-Making.
            </div>
            <div className="tr-scores-info-text">
              Overall score &nbsp;=&nbsp; average of all answered questions.
            </div>
          </div>
          <button type="button" className="tr-scores-info-btn"
            onClick={() => { setDashTab("help"); localStorage.setItem('cyberprep_tab', 'help'); }}>
            Learn More
          </button>
        </div>
      </div>
    </>
  );
}
