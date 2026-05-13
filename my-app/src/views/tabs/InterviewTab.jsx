// ═══════════════════════════════════════════════════════════════
// INTERVIEW TAB — REDESIGNED
// Matches reference design:
//  - 2-column layout (main prep card + sidebar with 3 cards)
//  - Main: JD/Resume upload + Analyze + Duration + Difficulty + Modules + Start
//  - Sidebar: Interview Readiness gauge + Recent Activity + Tips to Improve
//
// All original functionality preserved: 8 props, all state, all handlers,
// sessionActive flow, popupModule flow, /api/interview/analyze,
// speech-synthesis primer.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { showToast } from "../../components/helpers.js";
import InterviewSession from "../InterviewSession.jsx";
import InterviewReport from "../InterviewReport.jsx";
import ArchitectDefend from "./modules/ArchitectDefend.jsx";
import IncidentSim from "./modules/IncidentSim.jsx";
import ThreatBrief from "./modules/ThreatBrief.jsx";
import ThreatHunt from "./modules/ThreatHunt.jsx";
import VulnVerdict from "./modules/VulnVerdict.jsx";

const API_BASE = "https://threatready-db.onrender.com";

const MINUTE_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

const LEVELS = [
  { id: "beginner",     name: "Beginner",     icon: "🌱", color: "#22c55e", desc: "Foundation concepts, basic scenarios" },
  { id: "intermediate", name: "Intermediate", icon: "⚡",  color: "#f59e0b", desc: "Multi-step problems, real-world tradeoffs" },
  { id: "expert",       name: "Expert",       icon: "🔥", color: "#ef4444", desc: "Advanced architectures, edge cases, depth" },
  { id: "collaborate",  name: "Custom",       icon: "👑", color: "#7c3aed", desc: "Mixed difficulty across all domains" },
];

const MODULE_INFO = [
  { id: "architectdefend", name: "Architecture & Design", icon: "👤", color: "#3b82f6", topic: "Architecture design",   Component: ArchitectDefend },
  { id: "incidentsim",     name: "Incident Simulator",    icon: "🚨", color: "#ef4444", topic: "Incident response",     Component: IncidentSim },
  { id: "threatbrief",     name: "Threat Brief",          icon: "📡", color: "#a855f7", topic: "Crisis communication",  Component: ThreatBrief },
  { id: "threathunt",      name: "Threat Hunt",           icon: "🔍", color: "#22c55e", topic: "Log analysis",          Component: ThreatHunt },
  { id: "vulnverdict",     name: "Vuln Vault",            icon: "⚠️", color: "#f59e0b", topic: "Vuln prioritization",   Component: VulnVerdict },
];

// ── Scoped CSS ──
const IV_CSS = `
.tr-iv-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1);padding-top:56px}

/* Defensive: any svg without explicit dimensions stays small (prevents 300x150 balloon) */
.tr-iv-root svg:not([width]){width:16px;height:16px;flex-shrink:0}

/* 2-column layout */
.tr-iv-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}
@media (max-width:1100px){.tr-iv-layout{grid-template-columns:1fr}}

/* Main card */
.tr-iv-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:16px;
  padding:28px;
}
.tr-iv-card-label{
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;
}
.tr-iv-card-title{font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.4px;color:var(--tx1)}
.tr-iv-card-desc{font-size:13px;color:var(--tx2);line-height:1.55;margin:0 0 22px}

/* Upload row */
.tr-iv-uploads{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:stretch;margin-bottom:18px}
.tr-iv-upload{
  display:flex;flex-direction:column;
  background:var(--bg,#faf8ff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
  padding:16px;
  transition:border-color .2s ease;
}
.tr-iv-upload:hover{border-color:#c4b5fd}
.tr-iv-upload-head{
  display:flex;align-items:center;gap:8px;
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;
}
.tr-iv-upload-head svg{width:14px;height:14px}
.tr-iv-upload-sub{font-size:11.5px;color:var(--tx2);margin-bottom:12px;font-weight:500}
.tr-iv-upload-zone{
  flex:1;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  padding:18px 12px;
  background:#fff;
  border:1.5px dashed #d4cce8;
  border-radius:10px;
  cursor:pointer;
  text-align:center;
  transition:all .2s ease;
}
.tr-iv-upload-zone:hover{background:#faf8ff;border-color:#a78bfa}
.tr-iv-upload-zone.active{background:rgba(124,58,237,.05);border-color:#7c3aed;border-style:solid}
.tr-iv-upload-zone svg.upload-icon{width:24px;height:24px;color:#7c3aed;margin-bottom:2px}
.tr-iv-upload-main{font-size:13px;font-weight:600;color:var(--tx1)}
.tr-iv-upload-hint{font-size:11.5px;color:var(--tx2)}
.tr-iv-upload-hint .browse{color:#7c3aed;font-weight:600;text-decoration:underline}
.tr-iv-upload-active-name{font-size:12.5px;font-weight:700;color:#10b981;word-break:break-all}
.tr-iv-upload-active-sub{font-size:11px;color:var(--tx2)}
.tr-iv-upload input[type=file]{display:none}
.tr-iv-or{
  display:grid;place-items:center;
  align-self:center;
}
.tr-iv-or-circle{
  width:38px;height:38px;border-radius:50%;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  display:grid;place-items:center;
  font-size:11.5px;font-weight:800;color:var(--tx2);letter-spacing:1px;
}

/* Analyze button */
.tr-iv-analyze-row{display:flex;justify-content:center;margin-bottom:22px}
.tr-iv-analyze-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:9px 22px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  font-size:13px;font-weight:600;color:var(--tx1);
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-iv-analyze-btn:hover:not(:disabled){border-color:#a78bfa;background:#faf8ff;transform:translateY(-1px)}
.tr-iv-analyze-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-iv-analyze-result{
  margin:0 0 22px;padding:14px 16px;
  background:linear-gradient(135deg,#faf8ff,#f3eeff);
  border:1px solid #c4b5fd;border-radius:10px;
  font-size:12.5px;color:var(--tx1);line-height:1.55;white-space:pre-wrap;
}
.tr-iv-analyze-result-label{
  font-size:11px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;
}

/* Section blocks (duration, difficulty, modules) */
.tr-iv-block{margin-bottom:22px}
.tr-iv-block-label{
  display:flex;align-items:center;gap:7px;
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:1.8px;margin-bottom:10px;
}
.tr-iv-block-label svg{width:14px;height:14px}

/* Duration block */
.tr-iv-duration-card{
  padding:18px;
  background:var(--bg,#faf8ff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
}
.tr-iv-select{
  width:100%;
  padding:11px 14px;
  background:#fff;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  font-size:13.5px;color:var(--tx1);font-weight:500;
  font-family:inherit;
  cursor:pointer;
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237c3aed' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;
}
.tr-iv-select:hover{border-color:#c4b5fd}
.tr-iv-duration-custom{margin-top:12px;display:flex;align-items:center;gap:10px}
.tr-iv-duration-custom input{
  flex:1;padding:11px 14px;
  background:#fff;border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;font-size:13.5px;color:var(--tx1);font-family:inherit;
}
.tr-iv-duration-total{font-size:12px;color:var(--tx2);margin-top:10px;font-weight:500}
.tr-iv-duration-total strong{color:var(--tx1);font-weight:700}

/* Difficulty grid (4 cards) */
.tr-iv-levels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.tr-iv-level{
  position:relative;
  display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;
  padding:16px 12px 14px;
  background:var(--s1,#fff);
  border:1.5px solid var(--bd,#e9e5f3);
  border-radius:12px;
  cursor:pointer;
  transition:all .2s ease;
}
.tr-iv-level:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(124,58,237,.08)}
.tr-iv-level.sel{
  border-color:#7c3aed;background:rgba(124,58,237,.04);
  box-shadow:0 6px 18px rgba(124,58,237,.12);
}
.tr-iv-level-icon{font-size:22px;line-height:1}
.tr-iv-level-name{font-size:13.5px;font-weight:700;color:var(--tx1)}
.tr-iv-level-desc{font-size:11px;color:var(--tx2);line-height:1.4;font-weight:500}
.tr-iv-level-check{
  position:absolute;top:8px;left:8px;
  width:18px;height:18px;border-radius:50%;
  background:#7c3aed;color:#fff;
  display:grid;place-items:center;
}
.tr-iv-level-check svg{width:10px;height:10px}
.tr-iv-level-sel-tag{
  margin-top:3px;
  display:inline-flex;align-items:center;gap:4px;
  font-size:10px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:.5px;
}
.tr-iv-level-sel-tag svg{width:10px;height:10px}

/* Modules grid (5 pills) */
.tr-iv-modules{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
@media (max-width:880px){.tr-iv-modules{grid-template-columns:repeat(2,1fr)}}
.tr-iv-module{
  padding:12px;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;
  cursor:pointer;
  transition:all .2s ease;
}
.tr-iv-module:hover{transform:translateY(-1px);border-color:#c4b5fd;box-shadow:0 6px 16px rgba(124,58,237,.08)}
.tr-iv-module-head{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.tr-iv-module-icon{font-size:16px;line-height:1}
.tr-iv-module-name{font-size:12.5px;font-weight:700;color:var(--tx1);line-height:1.2}
.tr-iv-module-topic{font-size:11px;color:var(--tx2);line-height:1.4}

/* Start button */
.tr-iv-start{
  width:100%;
  padding:15px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;
  border-radius:12px;
  font-size:14.5px;font-weight:700;letter-spacing:.3px;
  cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 10px 26px rgba(124,58,237,.3);
  transition:all .2s ease;
  margin-top:6px;
}
.tr-iv-start:hover{transform:translateY(-1px);box-shadow:0 14px 32px rgba(124,58,237,.42)}

/* Note */
.tr-iv-note{
  margin-top:14px;padding:12px 14px;
  background:#fffbe6;
  border:1px solid #fde68a;
  border-radius:10px;
  font-size:12px;color:#7c5f0e;line-height:1.5;
  display:flex;align-items:flex-start;gap:8px;
}
.tr-iv-note strong{color:#92400e;font-weight:700}

/* Sidebar */
.tr-iv-sidebar{display:flex;flex-direction:column;gap:14px}
.tr-iv-side-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px;
}
.tr-iv-side-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;
}
.tr-iv-side-title{font-size:14px;font-weight:700;color:var(--tx1);margin:0}
.tr-iv-side-info{
  width:18px;height:18px;border-radius:50%;
  display:grid;place-items:center;
  color:var(--tx2);cursor:help;
}
.tr-iv-side-info svg{width:14px;height:14px}

/* Readiness gauge */
.tr-iv-gauge{display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0 4px}
.tr-iv-gauge-label{font-size:13px;color:var(--tx2);font-weight:600;margin-top:-4px}
.tr-iv-gauge-desc{font-size:11.5px;color:var(--tx2);text-align:center;line-height:1.45;margin:4px 0 14px;padding:0 6px}
.tr-iv-side-btn{
  width:100%;padding:11px 14px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;border:none;border-radius:10px;
  font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-iv-side-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.3)}

/* Recent activity empty */
.tr-iv-activity-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 4px 4px;text-align:center}
.tr-iv-activity-icon{
  width:54px;height:54px;
  display:grid;place-items:center;
  background:#ede9fe;color:#7c3aed;
  border-radius:14px;margin-bottom:4px;
}
.tr-iv-activity-icon svg{width:26px;height:26px}
.tr-iv-activity-title{font-size:13px;font-weight:600;color:var(--tx1)}
.tr-iv-activity-sub{font-size:11.5px;color:var(--tx2);line-height:1.45}

/* Tips list */
.tr-iv-tips{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.tr-iv-tip{
  display:flex;align-items:center;gap:9px;
  font-size:13px;color:var(--tx1);font-weight:500;
}
.tr-iv-tip-check{
  width:18px;height:18px;flex-shrink:0;
  display:grid;place-items:center;
  color:#10b981;
}
.tr-iv-tip-check svg{width:16px;height:16px}
.tr-iv-tips-link{
  font-size:12.5px;color:#7c3aed;font-weight:600;
  text-decoration:none;
  display:inline-flex;align-items:center;gap:4px;cursor:pointer;
  background:transparent;border:none;padding:0;font-family:inherit;
}
.tr-iv-tips-link:hover{text-decoration:underline}

/* ─────────────────────────────────────────────────────────────
   INTERVIEW HISTORY — entry-point card + full modal + detail view
   ───────────────────────────────────────────────────────────── */

/* Entry-point card (sidebar) — larger, shows recent report preview */
.tr-iv-history-card{padding:18px;display:flex;flex-direction:column;gap:14px;transition:border-color .15s ease}
.tr-iv-history-card:hover{border-color:#d4ccea}

.tr-iv-history-card-head{display:flex;justify-content:space-between;align-items:center}
.tr-iv-history-card-head-left{display:flex;align-items:center;gap:11px;min-width:0}
.tr-iv-history-card-icon{
  width:40px;height:40px;flex-shrink:0;
  border-radius:10px;
  background:linear-gradient(135deg,#7c3aed,#a855f7);
  color:#fff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 10px rgba(124,58,237,.22);
}
.tr-iv-history-card-icon svg{width:18px;height:18px}
.tr-iv-history-card-count{font-size:11.5px;color:var(--tx2,#8890b0);margin-top:2px}

/* Recent-report preview */
.tr-iv-history-latest{
  padding:13px 14px;
  background:linear-gradient(180deg,#faf8ff 0%,#fff 100%);
  border:1px solid #ece5fa;
  border-radius:11px;
}
.tr-iv-history-latest-meta-row{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:6px;flex-wrap:wrap;gap:6px;
}
.tr-iv-history-latest-badge{
  display:inline-block;padding:2px 8px;
  background:rgba(124,58,237,.12);color:#7c3aed;
  border-radius:6px;font-size:9.5px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;
}
.tr-iv-history-latest-status{
  display:inline-block;padding:2px 8px;
  border-radius:6px;font-size:9.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;
}
.tr-iv-history-latest-status.ok{background:rgba(16,185,129,.12);color:#059669}
.tr-iv-history-latest-status.pending{background:rgba(245,158,11,.12);color:#b45309}
.tr-iv-history-latest-title{
  font-size:12.5px;font-weight:700;color:var(--tx1,#1a1a2e);
  line-height:1.35;margin-bottom:5px;
}
.tr-iv-history-latest-meta{
  display:flex;justify-content:space-between;align-items:center;
  font-size:11px;color:var(--tx2,#8890b0);
  margin-bottom:10px;flex-wrap:wrap;gap:6px;
}
.tr-iv-history-latest-diff{
  padding:1px 7px;background:rgba(124,58,237,.08);color:#7c3aed;
  border-radius:5px;font-size:10px;font-weight:700;
}
.tr-iv-history-latest-actions{display:flex;gap:6px}
.tr-iv-history-latest-btn{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;
  padding:7px 10px;
  border-radius:8px;
  font-size:11.5px;font-weight:700;
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
  border:none;
}
.tr-iv-history-latest-btn.primary{background:#7c3aed;color:#fff;box-shadow:0 2px 6px rgba(124,58,237,.20)}
.tr-iv-history-latest-btn.primary:hover{background:#6d28d9;transform:translateY(-1px)}
.tr-iv-history-latest-btn.outline{background:#fff;border:1px solid var(--bd,#e9e5f3);color:var(--tx1,#1a1a2e)}
.tr-iv-history-latest-btn.outline:hover{border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04)}

/* Empty preview */
.tr-iv-history-empty-preview{
  padding:18px 12px;text-align:center;
  background:#fafafa;
  border:1px dashed var(--bd,#e9e5f3);
  border-radius:11px;
}
.tr-iv-history-empty-icon{
  display:inline-flex;width:36px;height:36px;border-radius:9px;
  background:rgba(124,58,237,.08);color:#7c3aed;
  align-items:center;justify-content:center;margin:0 auto 8px;
}
.tr-iv-history-empty-icon svg{width:18px;height:18px}
.tr-iv-history-empty-title{font-size:12.5px;font-weight:700;color:var(--tx1,#1a1a2e);margin-bottom:3px}
.tr-iv-history-empty-sub{font-size:11px;color:var(--tx2,#8890b0);line-height:1.45}

/* View all button at card footer */
.tr-iv-history-view-all{
  display:flex;align-items:center;justify-content:center;gap:5px;
  padding:9px 12px;
  background:rgba(124,58,237,.06);
  border:none;border-radius:9px;
  font-size:12px;font-weight:700;color:#7c3aed;
  cursor:pointer;font-family:inherit;
  transition:background .15s ease;
}
.tr-iv-history-view-all:hover{background:rgba(124,58,237,.12)}

/* ── Modal backdrop ── */
.tr-iv-modal-backdrop{
  position:fixed;inset:0;z-index:10000;
  background:rgba(20,14,50,0.55);
  backdrop-filter:blur(4px);
  -webkit-backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;
  padding:24px;
  animation:trIvFadeBg .2s ease both;
}
@keyframes trIvFadeBg{from{opacity:0}to{opacity:1}}

/* ── Modal container ── */
.tr-iv-modal{
  background:#fff;
  border-radius:16px;
  width:100%;
  max-width:920px;
  max-height:88vh;
  overflow:hidden;
  display:flex;flex-direction:column;
  box-shadow:0 32px 80px rgba(20,14,50,0.30), 0 8px 24px rgba(124,58,237,0.12);
  animation:trIvPopIn .28s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes trIvPopIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}

/* Modal header */
.tr-iv-modal-head{
  display:flex;justify-content:space-between;align-items:flex-start;gap:14px;
  padding:24px 28px 18px;border-bottom:1px solid var(--bd,#e9e5f3);
  flex-shrink:0;
}
.tr-iv-modal-title{font-size:22px;font-weight:800;margin:0 0 4px;color:var(--tx1,#1a1a2e);letter-spacing:-.3px}
.tr-iv-modal-sub{font-size:13px;color:var(--tx2,#8890b0);margin:0}
.tr-iv-modal-actions{display:flex;gap:8px;flex-shrink:0}
.tr-iv-modal-refresh,.tr-iv-modal-close{
  width:36px;height:36px;
  background:transparent;border:1px solid var(--bd,#e9e5f3);
  border-radius:9px;color:var(--tx2,#8890b0);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .15s ease;
}
.tr-iv-modal-refresh:hover:not(:disabled){border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04)}
.tr-iv-modal-refresh:disabled{opacity:.5;cursor:not-allowed}
.tr-iv-modal-close:hover{border-color:#dc2626;color:#dc2626;background:#fef2f2}

/* Stats grid */
.tr-iv-modal-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
  padding:18px 28px;
  background:linear-gradient(180deg,#faf8ff 0%,#fff 100%);
  border-bottom:1px solid var(--bd,#e9e5f3);
  flex-shrink:0;
}
@media (max-width:740px){.tr-iv-modal-stats{grid-template-columns:repeat(2,1fr)}}
.tr-iv-modal-stat{
  display:flex;align-items:center;gap:11px;
  padding:12px 14px;
  background:#fff;border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;
}
.tr-iv-modal-stat-icon{
  width:36px;height:36px;flex-shrink:0;
  border-radius:9px;
  background:rgba(124,58,237,.10);
  color:#7c3aed;
  display:flex;align-items:center;justify-content:center;
}
.tr-iv-modal-stat-icon.ok{background:rgba(16,185,129,.12);color:#059669}
.tr-iv-modal-stat-icon.warn{background:rgba(245,158,11,.12);color:#b45309}
.tr-iv-modal-stat-icon.trend{background:rgba(59,130,246,.12);color:#2563eb}
.tr-iv-modal-stat-num{font-size:20px;font-weight:800;color:var(--tx1,#1a1a2e);line-height:1.1;font-family:'Inter','Segoe UI',monospace}
.tr-iv-modal-stat-lbl{font-size:11px;color:var(--tx2,#8890b0);margin-top:2px;display:flex;align-items:center;gap:5px}
.tr-iv-trend{font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px}
.tr-iv-trend.up{background:rgba(16,185,129,.12);color:#059669}
.tr-iv-trend.down{background:rgba(239,68,68,.12);color:#dc2626}

/* Search + Filters */
.tr-iv-modal-controls{
  display:flex;gap:10px;flex-wrap:wrap;
  padding:16px 28px;
  border-bottom:1px solid var(--bd,#e9e5f3);
  background:#fff;
  flex-shrink:0;
}
.tr-iv-modal-search{
  position:relative;flex:1;min-width:240px;
  display:flex;align-items:center;
  background:#fafafa;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  padding:9px 36px 9px 38px;
  transition:border-color .15s,box-shadow .15s;
}
.tr-iv-modal-search:focus-within{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.08);background:#fff}
.tr-iv-modal-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--tx2,#8890b0);display:inline-flex}
.tr-iv-modal-search input{flex:1;border:none;background:transparent;outline:none;font-size:13px;color:var(--tx1,#1a1a2e);font-family:inherit;width:100%}
.tr-iv-modal-search input::placeholder{color:var(--tx2,#8890b0)}
.tr-iv-modal-search-clear{
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  width:22px;height:22px;
  background:transparent;border:none;color:var(--tx2,#8890b0);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  border-radius:5px;
}
.tr-iv-modal-search-clear:hover{background:rgba(0,0,0,.04);color:#dc2626}
.tr-iv-modal-filter{
  padding:9px 14px;
  background:#fafafa;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  font-size:12.5px;font-weight:600;color:var(--tx1,#1a1a2e);
  font-family:inherit;cursor:pointer;outline:none;
}
.tr-iv-modal-filter:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.08)}

/* Result count */
.tr-iv-modal-count{
  padding:10px 28px;
  font-size:12px;color:var(--tx2,#8890b0);
  background:#fafafa;border-bottom:1px solid var(--bd,#e9e5f3);
  flex-shrink:0;
}
.tr-iv-modal-count strong{color:#7c3aed;font-weight:800}

/* List (scrollable) */
.tr-iv-modal-list{
  flex:1;overflow-y:auto;
  padding:18px 28px;
  display:flex;flex-direction:column;gap:12px;
}
.tr-iv-modal-list::-webkit-scrollbar{width:8px}
.tr-iv-modal-list::-webkit-scrollbar-thumb{background:#d4ccea;border-radius:4px}
.tr-iv-modal-list::-webkit-scrollbar-thumb:hover{background:#7c3aed}

.tr-iv-modal-empty{padding:48px 16px;text-align:center;color:var(--tx2,#8890b0);font-size:13px}
.tr-iv-modal-empty-icon{
  display:inline-flex;width:54px;height:54px;border-radius:13px;
  background:rgba(124,58,237,.08);color:#7c3aed;
  align-items:center;justify-content:center;margin:0 auto 14px;
}
.tr-iv-modal-empty-title{font-size:15px;font-weight:700;color:var(--tx1,#1a1a2e);margin-bottom:5px}
.tr-iv-modal-empty-sub{font-size:13px;color:var(--tx2,#8890b0)}

/* History item */
.tr-iv-history-item{
  display:flex;gap:16px;
  background:#fff;border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
  padding:16px 18px;
  transition:all .15s ease;
  animation:trIvSlideIn .35s ease both;
}
@keyframes trIvSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.tr-iv-history-item:hover{border-color:#7c3aed;box-shadow:0 6px 18px rgba(124,58,237,.10)}
.tr-iv-history-item-main{flex:1;min-width:0}
.tr-iv-history-item-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.tr-iv-history-item-title{font-size:14.5px;font-weight:700;color:var(--tx1,#1a1a2e);line-height:1.3}
.tr-iv-history-item-status{
  padding:3px 10px;border-radius:7px;
  font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
}
.tr-iv-history-item-status.ok{background:rgba(16,185,129,.12);color:#059669}
.tr-iv-history-item-status.pending{background:rgba(245,158,11,.12);color:#b45309}
.tr-iv-history-item-grid{
  display:grid;grid-template-columns:repeat(4,1fr);gap:10px 16px;
  margin-bottom:10px;
}
@media (max-width:740px){.tr-iv-history-item-grid{grid-template-columns:repeat(2,1fr)}}
.tr-iv-history-item-cell .lbl{font-size:10.5px;color:var(--tx2,#8890b0);text-transform:uppercase;letter-spacing:.6px;font-weight:600;margin-bottom:3px}
.tr-iv-history-item-cell .val{font-size:13px;color:var(--tx1,#1a1a2e);font-weight:600}
.tr-iv-history-pill{
  display:inline-block;padding:2px 9px;
  background:rgba(124,58,237,.10);color:#7c3aed;
  border-radius:6px;font-size:11px;font-weight:700;
}
.tr-iv-history-badge{color:#b45309;font-weight:700;font-size:11px}
.tr-iv-history-item-id{font-size:10.5px;color:var(--tx2,#8890b0);font-family:monospace}
.tr-iv-history-item-id code{background:#fafafa;padding:1px 6px;border-radius:4px;border:1px solid var(--bd,#e9e5f3);color:#7c3aed;font-size:10px}

.tr-iv-history-item-actions{display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:170px;flex-shrink:0}

/* Modal buttons */
.tr-iv-modal-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 16px;
  border-radius:9px;
  font-size:12.5px;font-weight:700;
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
  border:none;white-space:nowrap;
}
.tr-iv-modal-btn.primary{background:#7c3aed;color:#fff;box-shadow:0 4px 12px rgba(124,58,237,.20)}
.tr-iv-modal-btn.primary:hover{background:#6d28d9;transform:translateY(-1px);box-shadow:0 6px 16px rgba(124,58,237,.30)}
.tr-iv-modal-btn.outline{background:#fff;border:1px solid var(--bd,#e9e5f3);color:var(--tx1,#1a1a2e)}
.tr-iv-modal-btn.outline:hover{border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04)}
.tr-iv-modal-btn.small{padding:6px 10px;font-size:11.5px;flex:1}
.tr-iv-modal-btn.big{padding:12px 22px;font-size:14px;flex:1}

/* ── Detail modal ── */
.tr-iv-detail-modal{max-width:760px}
.tr-iv-detail-head{
  display:flex;justify-content:space-between;align-items:center;
  padding:18px 28px;border-bottom:1px solid var(--bd,#e9e5f3);
  flex-shrink:0;
}
.tr-iv-detail-back{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 12px;
  background:transparent;border:1px solid var(--bd,#e9e5f3);
  border-radius:8px;
  font-size:12.5px;font-weight:600;color:var(--tx1,#1a1a2e);
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
}
.tr-iv-detail-back:hover{border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04)}

.tr-iv-detail-modal-inner-scroll{overflow-y:auto;flex:1}
.tr-iv-detail-modal{overflow-y:auto}

.tr-iv-detail-hero{
  padding:28px 28px 22px;
  background:linear-gradient(135deg,#faf8ff 0%,#f3eaff 100%);
  border-bottom:1px solid var(--bd,#e9e5f3);
  text-align:center;
}
.tr-iv-detail-pill{
  display:inline-block;
  padding:5px 14px;
  background:rgba(124,58,237,.12);
  color:#7c3aed;
  border-radius:8px;
  font-size:10.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
  margin-bottom:10px;
}
.tr-iv-detail-title{font-size:28px;font-weight:800;color:var(--tx1,#1a1a2e);margin:0 0 6px;letter-spacing:-.5px}
.tr-iv-detail-subtitle{font-size:13px;color:var(--tx2,#8890b0);margin-bottom:14px}
.tr-iv-detail-tags{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.tr-iv-detail-tag{
  display:inline-flex;align-items:center;gap:4px;
  padding:4px 11px;background:#fff;border:1px solid var(--bd,#e9e5f3);
  border-radius:7px;font-size:11px;font-weight:700;color:var(--tx1,#1a1a2e);
}
.tr-iv-detail-tag.ok{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.25);color:#059669}
.tr-iv-detail-tag.pending{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.25);color:#b45309}
.tr-iv-detail-tag.purple{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.25);color:#7c3aed}
.tr-iv-detail-tag.gold{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.25);color:#b45309}

.tr-iv-detail-score-card{
  display:flex;align-items:center;gap:24px;
  padding:22px 28px;
  border-bottom:1px solid var(--bd,#e9e5f3);
  background:#fff;
}
@media (max-width:600px){.tr-iv-detail-score-card{flex-direction:column;align-items:stretch}}
.tr-iv-detail-score-left{flex-shrink:0}
.tr-iv-detail-score-lbl{font-size:11px;color:var(--tx2,#8890b0);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px}
.tr-iv-detail-score-big{font-size:44px;font-weight:900;line-height:1;font-family:'Inter','Segoe UI',monospace;letter-spacing:-1px}
.tr-iv-detail-score-big .suffix{font-size:18px;font-weight:600;color:var(--tx2,#8890b0);margin-left:3px}
.tr-iv-detail-score-verdict{font-size:13px;font-weight:700;margin-top:4px}
.tr-iv-detail-score-bar-wrap{flex:1;min-width:0}
.tr-iv-detail-score-bar{
  width:100%;height:14px;
  background:#f1edfa;
  border-radius:7px;
  overflow:hidden;
}
.tr-iv-detail-score-bar-fill{
  height:100%;
  border-radius:7px;
  transition:width .8s cubic-bezier(.16,1,.3,1);
}
.tr-iv-detail-score-bar-marks{display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:var(--tx2,#8890b0);font-weight:600}

.tr-iv-detail-grid{
  display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
  padding:18px 28px;
  border-bottom:1px solid var(--bd,#e9e5f3);
}
@media (max-width:600px){.tr-iv-detail-grid{grid-template-columns:repeat(2,1fr)}}
.tr-iv-detail-cell{
  padding:14px;background:#fafafa;border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;text-align:center;
  transition:all .15s ease;
}
.tr-iv-detail-cell:hover{border-color:#7c3aed;background:#fff;transform:translateY(-1px)}
.tr-iv-detail-cell-icon{
  width:32px;height:32px;
  border-radius:9px;
  background:rgba(124,58,237,.10);
  color:#7c3aed;
  display:inline-flex;align-items:center;justify-content:center;
  margin-bottom:8px;
}
.tr-iv-detail-cell-lbl{font-size:10.5px;color:var(--tx2,#8890b0);text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:4px}
.tr-iv-detail-cell-val{font-size:18px;font-weight:800;color:var(--tx1,#1a1a2e);font-family:'Inter','Segoe UI',monospace}
.tr-iv-detail-cell-val.sm{font-size:13px;font-family:inherit}
.tr-iv-detail-cell-val.accent{color:#f59e0b}
.tr-iv-detail-cell-val span{font-size:11px;color:var(--tx2,#8890b0);font-weight:600}

.tr-iv-detail-meta{padding:20px 28px;border-bottom:1px solid var(--bd,#e9e5f3)}
.tr-iv-detail-section-title{font-size:12px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px}
.tr-iv-detail-meta-row{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:9px 0;
  border-bottom:1px solid #f3f0fa;
  font-size:13px;
}
.tr-iv-detail-meta-row:last-child{border-bottom:none}
.tr-iv-detail-meta-row .lbl{color:var(--tx2,#8890b0);font-weight:600}
.tr-iv-detail-meta-row .val{color:var(--tx1,#1a1a2e);font-weight:700;text-align:right;word-break:break-all}
.tr-iv-detail-meta-row .val.mono{font-family:monospace;font-size:11.5px}

.tr-iv-detail-actions{
  display:flex;gap:10px;
  padding:20px 28px;
  background:#fafafa;
  flex-wrap:wrap;
}

/* ── Full saved-report overlay (renders InterviewReport from saved payload) ── */
.tr-iv-full-report-overlay{
  position:fixed;inset:0;z-index:10001;
  background:#fff;
  display:flex;flex-direction:column;
  overflow:hidden;
  animation:trIvFadeBg .25s ease both;
}
.tr-iv-full-report-nav{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:12px 24px;
  background:#fff;
  border-bottom:1px solid var(--bd,#e9e5f3);
  box-shadow:0 1px 2px rgba(0,0,0,.02);
  flex-shrink:0;z-index:2;
}
.tr-iv-full-report-id{
  display:inline-flex;align-items:center;gap:10px;
  font-size:13.5px;font-weight:700;color:var(--tx1,#1a1a2e);
}
.tr-iv-full-report-id-pill{
  display:inline-block;padding:3px 10px;
  background:rgba(124,58,237,.10);color:#7c3aed;
  border-radius:7px;font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;
}
.tr-iv-full-report-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tr-iv-full-report-body{
  flex:1;
  overflow-y:auto;
  background:#fafafa;
}
.tr-iv-full-report-body::-webkit-scrollbar{width:10px}
.tr-iv-full-report-body::-webkit-scrollbar-thumb{background:#d4ccea;border-radius:5px}
.tr-iv-full-report-body::-webkit-scrollbar-thumb:hover{background:#7c3aed}
/* InterviewReport inside the overlay should not duplicate the topbar clearance */
.tr-iv-full-report-body > .fadeUp{padding-top:24px !important}
`;

// ── Icons (all sized explicitly so they can't balloon) ──
const I = {
  doc: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  resume: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/></svg>,
  upload: <svg width="24" height="24" className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  brain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-5 0V18A4 4 0 0 1 3 14v-1a3 3 0 0 1 0-6A2.5 2.5 0 0 1 5 4a2.5 2.5 0 0 1 4.5-2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 5 0V18a4 4 0 0 0 4-4v-1a3 3 0 0 0 0-6A2.5 2.5 0 0 0 19 4a2.5 2.5 0 0 0-4.5-2z"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  bars: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>,
  layers: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  rocket: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  clipboard: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="18" rx="2"/><path d="M9 4V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/></svg>,
  arrow: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  bulb: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6v3h8v-3c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>,
  tipCheck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  pdf: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  excel: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>,
  archive: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  xCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  arrowLeft: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  trophy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  trend: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

// ── Readiness gauge (semicircle) ──
function ReadinessGauge({ value }) {
  // value 0..100 or null for "Not Assessed"
  const v = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;
  const angle = (v / 100) * 180; // 0..180
  const cx = 80, cy = 80, r = 64;
  const rad = (180 - angle) * Math.PI / 180;
  const dotX = cx + r * Math.cos(rad);
  const dotY = cy - r * Math.sin(rad);

  return (
    <svg width="160" height="92" viewBox="0 0 160 92">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke="#e9e5f3" strokeWidth="10" fill="none" strokeLinecap="round" />
      {v > 0 && (() => {
        const endRad = (180 - angle) * Math.PI / 180;
        const ex = cx + r * Math.cos(endRad);
        const ey = cy - r * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;
        return (
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
                stroke="#7c3aed" strokeWidth="10" fill="none" strokeLinecap="round"/>
        );
      })()}
      <circle cx={dotX} cy={dotY} r="7" fill="#7c3aed"/>
      <circle cx={dotX} cy={dotY} r="3.5" fill="#fff"/>
    </svg>
  );
}

export default function InterviewTab({
  subscribedRoles,
  activeRole,
  setActiveRole,
  interviewPersona,
  setInterviewPersona,
  isPaid,
  setDashTab,
  setView,
}) {
  // Same state as before
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [durationValue, setDurationValue] = useState(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [popupModule, setPopupModule] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  // ─── INTERVIEW REPORTS (sidebar widget) ───────────────────────
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  const fetchReports = async () => {
    // ─── Read ONLY real, attended interviews ───
    // Data source: localStorage `cyberprep_interview_history`
    // Written to exactly once per completed interview by InterviewSession.jsx
    // (right after `/api/interview/generate-report` returns successfully).
    // No dummy/sample/scenario data is ever inserted here.
    setReportsLoading(true);
    try {
      const stored = localStorage.getItem("cyberprep_interview_history");
      const list = stored ? JSON.parse(stored) : [];
      // Defensive: filter out anything that doesn't look like a real interview entry
      const real = Array.isArray(list)
        ? list.filter(s => s && s.id && (s.completed_at || s.started_at))
        : [];
      // Newest first
      real.sort((a, b) => {
        const ta = a.completed_at || a.started_at || 0;
        const tb = b.completed_at || b.started_at || 0;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
      setReports(real);
    } catch (e) {
      console.error("Failed to read interview history:", e);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch on mount and whenever an interview session ends (sessionActive → false)
  useEffect(() => {
    if (sessionActive) return;
    fetchReports();
    const onComplete = () => fetchReports();
    window.addEventListener('threatready:interview-complete', onComplete);
    return () => window.removeEventListener('threatready:interview-complete', onComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive]);

  const reportShortId = (id) => String(id || '').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() || '0000';
  const reportDifficulty = (r) => {
    // Real difficulty stored by InterviewSession at completion time
    const d = String(r.difficulty || '').toLowerCase();
    if (d === 'beginner') return 'Beginner';
    if (d === 'expert') return 'Expert';
    if (d === 'collaborate' || d === 'custom' || d === 'mixed') return 'Custom';
    if (d === 'intermediate') return 'Intermediate';
    // Fallback only for any unexpected value
    return d ? (d.charAt(0).toUpperCase() + d.slice(1)) : 'Intermediate';
  };

  const filteredReports = reports.filter(r => {
    // Status filter
    if (filterStatus === 'completed' && !r.completed_at) return false;
    if (filterStatus === 'in-progress' && r.completed_at) return false;
    // Difficulty filter
    if (filterDifficulty !== 'all') {
      if (reportDifficulty(r).toLowerCase() !== filterDifficulty.toLowerCase()) return false;
    }
    // Free-text search
    const q = reportSearch.trim().toLowerCase();
    if (!q) return true;
    const shortId = reportShortId(r.id);
    const fullId = String(r.id || '').toLowerCase();
    const title = `interview report session #${shortId}`.toLowerCase();
    const dateLong = r.completed_at
      ? new Date(r.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).toLowerCase()
      : '';
    const dateShort = r.completed_at
      ? new Date(r.completed_at).toLocaleDateString('en-GB').toLowerCase()
      : '';
    const time = r.completed_at
      ? new Date(r.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
      : '';
    const diff = reportDifficulty(r).toLowerCase();
    const scenario = String(r.scenario_id || '').toLowerCase();
    const status = (r.completed_at ? 'completed' : 'in progress');
    return (
      title.includes(q) || fullId.includes(q) || shortId.toLowerCase().includes(q) ||
      dateLong.includes(q) || dateShort.includes(q) || time.includes(q) ||
      diff.includes(q) || scenario.includes(q) || status.includes(q)
    );
  });

  // Stats summary for History header
  const historyStats = {
    total: reports.length,
    completed: reports.filter(r => r.completed_at).length,
    inProgress: reports.filter(r => !r.completed_at).length,
    avgScore: (() => {
      const arr = reports.filter(r => r.completed_at && r.overall_score != null);
      if (arr.length === 0) return '—';
      const s = arr.reduce((a, r) => a + parseFloat(r.overall_score), 0);
      return (s / arr.length).toFixed(1);
    })(),
    totalXP: reports.reduce((a, r) => a + (parseInt(r.earned_xp) || 0), 0),
    trend: (() => {
      const completed = reports.filter(r => r.completed_at && r.overall_score != null);
      if (completed.length < 2) return null;
      const recent = completed.slice(0, Math.ceil(completed.length / 2));
      const older = completed.slice(Math.ceil(completed.length / 2));
      const a = recent.reduce((s, r) => s + parseFloat(r.overall_score), 0) / recent.length;
      const b = older.reduce((s, r) => s + parseFloat(r.overall_score), 0) / older.length;
      return (a - b).toFixed(1);
    })(),
  };

  const downloadReportPDF = (entry) => {
    // ─── Generates a SELF-CONTAINED, isolated PDF (via new-tab + print) ───
    // Uses the FULL saved report payload (entry.report), exactly matching
    // what the on-screen InterviewReport view shows. Never falls back to
    // generic metadata. Each PDF is unique to its session, no duplicates,
    // no bleed-through from the surrounding overlay or dashboard.
    if (!entry || !entry.id) { showToast('Report missing — cannot download.', 'error'); return; }
    const r = entry.report || {};
    const shortId = reportShortId(entry.id);
    const candidate = r.candidate || {};
    const overall = r.overall || {};
    const session = r.session || {};
    const categoryScores = Array.isArray(r.categoryScores) ? r.categoryScores : [];
    const skillsRadar = Array.isArray(r.skillsRadar) ? r.skillsRadar : [];
    const strengths = Array.isArray(r.strengths) ? r.strengths : [];
    const growthAreas = Array.isArray(r.growthAreas) ? r.growthAreas : [];
    const topicsToStudy = Array.isArray(r.topicsToStudy) ? r.topicsToStudy : [];
    const questions = Array.isArray(r.questions) ? r.questions : [];

    const startedAt = entry.started_at ? new Date(entry.started_at).toLocaleString() : '—';
    const completedAt = entry.completed_at ? new Date(entry.completed_at).toLocaleString() : '—';
    const diff = reportDifficulty(entry);
    const candidateName = candidate.name || 'Candidate';
    const candidateRole = candidate.role || 'Cybersecurity Candidate';
    const overallScore = overall.score != null ? overall.score : (entry.overall_score != null ? Math.round(parseFloat(entry.overall_score) * 10) : '—');
    const badge = overall.badge || entry.badge || 'Not Ready';
    const badgeColor = overall.badgeColor || (badge.includes('Gold') ? '#f59e0b' : badge.includes('Silver') ? '#94a3b8' : badge.includes('Bronze') ? '#b45309' : badge.includes('Platinum') ? '#7c3aed' : '#94a3b8');
    const verdict = overall.verdict || 'Session evaluated';
    const summary = r.summary || 'No summary available.';
    const suggestedFocus = r.suggestedFocus || '';

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const scoreColor = (n) => n == null ? '#8890b0' : n >= 80 || n >= 7.5 ? '#10b981' : n >= 60 || n >= 5 ? '#f59e0b' : '#ef4444';

    const catRows = categoryScores.length === 0 ? '' : categoryScores.map(c => {
      const sc = c.score != null ? parseFloat(c.score).toFixed(1) : '—';
      return `<tr>
        <td><strong>${esc(c.name || '')}</strong>${c.weight ? `<div class="muted">Weight: ${esc(c.weight)}</div>` : ''}</td>
        <td class="num" style="color:${scoreColor(c.score)}">${sc}<span class="suffix">/10</span></td>
      </tr>`;
    }).join('');

    const skillsRows = skillsRadar.length === 0 ? '' : skillsRadar.map(s => {
      const sc = s.score != null ? parseFloat(s.score).toFixed(1) : '—';
      return `<tr>
        <td><strong>${esc(s.skill || '')}</strong></td>
        <td class="num" style="color:${scoreColor(s.score)}">${sc}<span class="suffix">/10</span></td>
      </tr>`;
    }).join('');

    const strengthsHtml = strengths.length === 0 ? '<li class="muted">None recorded.</li>' :
      strengths.map(s => `<li>${esc(s)}</li>`).join('');
    const growthHtml = growthAreas.length === 0 ? '<li class="muted">None recorded.</li>' :
      growthAreas.map(s => `<li>${esc(s)}</li>`).join('');
    const topicsHtml = topicsToStudy.length === 0 ? '<span class="muted">None suggested.</span>' :
      topicsToStudy.map(t => `<span class="tag">${esc(t)}</span>`).join(' ');

    const questionsHtml = questions.length === 0 ? '' :
      questions.map((q, i) => {
        const scores = q.scores || {};
        const scList = Object.keys(scores).map(k => {
          const v = scores[k];
          return `<span class="qscore">${esc(k)}: <strong style="color:${scoreColor(v)}">${typeof v === 'number' ? v.toFixed(1) : esc(v)}</strong></span>`;
        }).join(' · ');
        return `<div class="q">
          <div class="q-head">Q${i + 1}${q.module ? ' · ' + esc(q.module) : ''}${q.askedBy ? ' · Asked by ' + esc(q.askedBy) : ''}</div>
          <div class="q-text">${esc(q.question || '')}</div>
          ${q.answer ? `<div class="q-ans"><strong>Your answer:</strong> ${esc(q.answer)}</div>` : ''}
          ${scList ? `<div class="q-scores">${scList}</div>` : ''}
          ${q.feedback ? `<div class="q-fb"><strong>Feedback:</strong> ${esc(q.feedback)}</div>` : ''}
        </div>`;
      }).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Interview Report — Session #${esc(shortId)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#fff;color:#1a1a2e;font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.55}
  body{padding:36px 44px;max-width:840px;margin:0 auto;font-size:13px}
  .head{border-bottom:2px solid #7c3aed;padding-bottom:14px;margin-bottom:22px}
  .head .pill{display:inline-block;padding:4px 11px;background:rgba(124,58,237,.10);color:#7c3aed;border-radius:7px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px}
  .head h1{font-size:24px;font-weight:800;margin:0 0 4px;letter-spacing:-.3px}
  .head .sub{color:#8890b0;font-size:12px}
  .head .id{margin-top:6px;font-family:monospace;font-size:10.5px;color:#8890b0}
  .grid2{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center;margin-bottom:22px;padding:18px 22px;background:linear-gradient(135deg,#faf8ff,#fff);border:1px solid #e9e5f3;border-radius:12px}
  .score-box{text-align:center}
  .score-big{font-size:48px;font-weight:900;font-family:'Inter',monospace;line-height:1;color:${scoreColor(typeof overallScore === 'number' ? overallScore / 10 : null)};letter-spacing:-1px}
  .score-suffix{font-size:18px;color:#8890b0;font-weight:600}
  .score-label{font-size:10px;color:#8890b0;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-top:4px}
  .candidate-info h2{font-size:18px;font-weight:800;margin-bottom:4px}
  .candidate-info .role{color:#8890b0;font-size:12.5px;margin-bottom:8px}
  .candidate-info .tags{display:flex;gap:6px;flex-wrap:wrap}
  .candidate-info .tag-pill{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(124,58,237,.08);color:#7c3aed}
  .badge-pill{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:700;background:${badgeColor}15;color:${badgeColor};border:1px solid ${badgeColor}40}
  .verdict{margin-top:10px;padding:10px 14px;background:rgba(16,185,129,.06);border-left:3px solid #10b981;border-radius:6px;font-size:12.5px;color:#1a1a2e;font-weight:600;font-style:italic}
  h3{font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #e9e5f3}
  p{margin-bottom:10px;line-height:1.6}
  .muted{color:#8890b0;font-size:11.5px;font-style:italic}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  table td{padding:9px 12px;border-bottom:1px solid #f1edfa;font-size:12.5px;vertical-align:middle}
  table td:last-child{text-align:right;font-family:'Inter',monospace;font-weight:800;font-size:14px}
  table .num{white-space:nowrap}
  table .num .suffix{color:#8890b0;font-size:11px;font-weight:600;margin-left:2px}
  table tr:last-child td{border-bottom:none}
  ul.bullets{list-style:none;padding-left:0}
  ul.bullets li{padding:5px 0 5px 18px;position:relative;font-size:12.5px}
  ul.bullets li::before{content:"✓";position:absolute;left:0;color:#10b981;font-weight:800}
  ul.growth li::before{content:"→";color:#f59e0b}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .tag{display:inline-block;padding:4px 10px;background:rgba(124,58,237,.08);color:#7c3aed;border-radius:7px;font-size:11px;font-weight:600}
  .q{padding:12px 14px;background:#fafafa;border:1px solid #e9e5f3;border-radius:9px;margin-bottom:10px;page-break-inside:avoid}
  .q-head{font-size:10.5px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
  .q-text{font-weight:600;margin-bottom:6px;font-size:12.5px}
  .q-ans{font-size:12px;color:#1a1a2e;background:#fff;padding:8px 10px;border-radius:6px;border-left:3px solid #22c55e;margin-bottom:6px;white-space:pre-wrap}
  .q-scores{font-size:11px;color:#8890b0}
  .qscore{margin-right:6px}
  .q-fb{font-size:11.5px;color:#1a1a2e;margin-top:6px;padding:6px 10px;border-left:3px solid #7c3aed;background:rgba(124,58,237,.04);border-radius:6px}
  .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 22px}
  .meta-cell{padding:11px;background:#fafafa;border:1px solid #e9e5f3;border-radius:8px;text-align:center}
  .meta-lbl{font-size:9.5px;color:#8890b0;text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin-bottom:3px}
  .meta-val{font-size:12.5px;font-weight:700}
  .foot{margin-top:32px;padding-top:14px;border-top:1px solid #e9e5f3;text-align:center;font-size:10.5px;color:#8890b0}
  @media print{
    @page{margin:14mm 12mm;size:A4 portrait}
    body{padding:0;max-width:none}
    .q{page-break-inside:avoid}
    h3{page-break-after:avoid}
    table{page-break-inside:auto}
    tr{page-break-inside:avoid}
  }
</style>
</head><body>
  <div class="head">
    <div class="pill">Interview Report</div>
    <h1>Session #${esc(shortId)}</h1>
    <div class="sub">Generated ${esc(new Date().toLocaleString())} · ${esc(diff)} Level</div>
    <div class="id">Session ID: ${esc(entry.id)}</div>
  </div>

  <div class="grid2">
    <div class="score-box">
      <div class="score-big">${typeof overallScore === 'number' ? overallScore : esc(overallScore)}<span class="score-suffix">/100</span></div>
      <div class="score-label">Overall Score</div>
    </div>
    <div class="candidate-info">
      <h2>${esc(candidateName)}</h2>
      <div class="role">${esc(candidateRole)} · ${esc(diff)}</div>
      <div class="tags">
        <span class="tag-pill">${entry.completed_at ? '✓ Completed' : '⌛ In Progress'}</span>
        <span class="tag-pill">${esc(entry.questions_answered || 0)} Question${entry.questions_answered === 1 ? '' : 's'}</span>
        <span class="badge-pill">${esc(badge)}</span>
      </div>
      <div class="verdict">${esc(verdict)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell"><div class="meta-lbl">Started</div><div class="meta-val">${esc(startedAt)}</div></div>
    <div class="meta-cell"><div class="meta-lbl">Completed</div><div class="meta-val">${esc(completedAt)}</div></div>
    <div class="meta-cell"><div class="meta-lbl">Duration</div><div class="meta-val">${esc(entry.duration_minutes != null ? entry.duration_minutes + ' min' : '—')}</div></div>
    <div class="meta-cell"><div class="meta-lbl">Questions</div><div class="meta-val">${esc(entry.questions_answered != null ? entry.questions_answered : (questions.length || '—'))}</div></div>
  </div>

  ${catRows ? `<h3>Category Scores</h3><table>${catRows}</table>` : ''}

  ${skillsRows ? `<h3>Skills Breakdown</h3><table>${skillsRows}</table>` : ''}

  <h3>Recommendation &amp; Summary</h3>
  <p>${esc(summary)}</p>

  <h3>Strengths</h3>
  <ul class="bullets">${strengthsHtml}</ul>

  <h3>Growth Areas</h3>
  <ul class="bullets growth">${growthHtml}</ul>

  ${suggestedFocus ? `<h3>Suggested Next Interview Focus</h3><p>${esc(suggestedFocus)}</p>` : ''}

  ${topicsToStudy.length > 0 ? `<h3>Topics to Study Next</h3><div class="tags">${topicsHtml}</div>` : ''}

  ${questionsHtml ? `<h3>Question-by-Question Breakdown</h3>${questionsHtml}` : ''}

  <div class="foot">ThreatReady · Session #${esc(shortId)} · Generated ${esc(new Date().toLocaleString())} · Confidential</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) { showToast('Pop-up blocked. Please allow pop-ups to download the PDF.', 'error'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Give the new tab a moment to layout, then trigger print
    setTimeout(() => { try { w.focus(); w.print(); } catch (_) { /* ignore */ } }, 500);
    showToast('Report opened in a new tab — use Save as PDF', 'success');
  };

  // Same handlers as before
  const handleDurationChange = (e) => {
    const v = e.target.value;
    if (v === "custom") { setIsCustomDuration(true); setCustomDuration(String(durationValue)); }
    else { setIsCustomDuration(false); setDurationValue(parseInt(v, 10)); }
  };

  const effectiveMinutes = () => {
    if (isCustomDuration) {
      const n = parseInt(customDuration, 10);
      return isNaN(n) ? 30 : n;
    }
    return durationValue;
  };

  const handleFileUpload = (e, setter, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast(`${label} too large (max 5MB)`, "error"); return; }
    setter(file);
    setAnalysisResult(null);
    showToast(`${label} uploaded`, "success");
  };

  const handleAnalyze = async () => {
    if (!jdFile && !resumeFile) { showToast("Upload at least JD or resume to analyze", "warning"); return; }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const readText = (f) => new Promise((res, rej) => {
        if (!f) return res("");
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = rej;
        r.readAsText(f);
      });
      const jdText = await readText(jdFile);
      const resumeText = await readText(resumeFile);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/interview/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jdText, resumeText }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Backend error (${res.status}): ${err.substring(0, 200)}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data.analysis || "Analysis complete");
      showToast("Analysis complete!", "success");
    } catch (e) {
      console.error("Analyze error:", e);
      showToast("Analysis failed: " + e.message, "error");
      setAnalysisResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartSession = () => {
    const minutes = effectiveMinutes();
    if (!minutes || minutes < 5) { showToast("Please select a valid duration (minimum 5 minutes)", "error"); return; }
    // Speech-synthesis primer (same as before — keeps Chrome's engine warm during backend wait)
    if ("speechSynthesis" in window) {
      try {
        const primer = new SpeechSynthesisUtterance("preparing your interview session please wait one moment");
        primer.volume = 0;
        primer.rate = 0.5;
        window.speechSynthesis.speak(primer);
      } catch (_) {}
    }
    setSessionActive(true);
  };

  // If session is active → render InterviewSession (unchanged flow)
  if (sessionActive) {
    return (
      <InterviewSession
        jdFile={jdFile}
        resumeFile={resumeFile}
        durationMinutes={effectiveMinutes()}
        level={level}
        onEnd={(action) => {
          setSessionActive(false);
          if (action === "home") {
            try { window.dispatchEvent(new CustomEvent("threatready:navigate", { detail: { to: "home" } })); }
            catch (_) {}
          }
        }}
      />
    );
  }

  return (
    <>
      <style>{IV_CSS}</style>

      <div className="tr-iv-root">

        {/* ── 2-column layout ── */}
        <div className="tr-iv-layout">

          {/* ── MAIN CARD ── */}
          <div className="tr-iv-main">
            <div className="tr-iv-card fadeUp">
              <div className="tr-iv-card-label">Interview Prep Session</div>
              <h3 className="tr-iv-card-title">Personalized AI Interview Practice</h3>
              <p className="tr-iv-card-desc">Upload your JD or resume for tailored questions — or skip and start with default content.</p>

              {/* Upload row */}
              <div className="tr-iv-uploads">
                {/* JD */}
                <label className="tr-iv-upload">
                  <div className="tr-iv-upload-head">{I.doc} Job Description</div>
                  <div className="tr-iv-upload-sub">Optional · PDF, DOC, or TXT (max 5MB)</div>
                  <div className={`tr-iv-upload-zone${jdFile ? " active" : ""}`}>
                    {jdFile ? (
                      <>
                        <div className="tr-iv-upload-active-name">✓ {jdFile.name}</div>
                        <div className="tr-iv-upload-active-sub">{(jdFile.size / 1024).toFixed(1)} KB · Click to replace</div>
                      </>
                    ) : (
                      <>
                        {I.upload}
                        <div className="tr-iv-upload-main">Click to upload JD</div>
                        <div className="tr-iv-upload-hint">Drop file here or <span className="browse">browse</span></div>
                      </>
                    )}
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e, setJdFile, "Job description")} />
                </label>

                {/* OR */}
                <div className="tr-iv-or"><div className="tr-iv-or-circle">OR</div></div>

                {/* Resume */}
                <label className="tr-iv-upload">
                  <div className="tr-iv-upload-head">{I.resume} Your Resume</div>
                  <div className="tr-iv-upload-sub">Optional · PDF, DOC, or TXT (max 5MB)</div>
                  <div className={`tr-iv-upload-zone${resumeFile ? " active" : ""}`}>
                    {resumeFile ? (
                      <>
                        <div className="tr-iv-upload-active-name">✓ {resumeFile.name}</div>
                        <div className="tr-iv-upload-active-sub">{(resumeFile.size / 1024).toFixed(1)} KB · Click to replace</div>
                      </>
                    ) : (
                      <>
                        {I.upload}
                        <div className="tr-iv-upload-main">Click to upload resume</div>
                        <div className="tr-iv-upload-hint">Your CV or experience</div>
                      </>
                    )}
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e, setResumeFile, "Resume")} />
                </label>
              </div>

              {/* Analyze with AI */}
              <div className="tr-iv-analyze-row">
                <button type="button" className="tr-iv-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing || (!jdFile && !resumeFile)}>
                  {I.brain}
                  {analyzing ? "Analyzing…" : "Analyze with AI"}
                </button>
              </div>

              {/* Analysis result */}
              {analysisResult && (
                <div className="tr-iv-analyze-result">
                  <div className="tr-iv-analyze-result-label">AI Analysis</div>
                  {analysisResult}
                </div>
              )}

              {/* Session Duration */}
              <div className="tr-iv-block">
                <div className="tr-iv-block-label">{I.clock} Session Duration</div>
                <div className="tr-iv-duration-card">
                  <select className="tr-iv-select"
                    value={isCustomDuration ? "custom" : String(durationValue)}
                    onChange={handleDurationChange}>
                    {MINUTE_PRESETS.map((v) => <option key={v} value={v}>{v} minutes</option>)}
                    <option value="custom">Custom…</option>
                  </select>
                  {isCustomDuration && (
                    <div className="tr-iv-duration-custom">
                      <input type="number" min={5} max={240} step={5}
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        placeholder="Enter minutes (5–240)"
                        autoFocus />
                      <span style={{ fontSize: 12, color: "var(--tx2)", whiteSpace: "nowrap" }}>minutes</span>
                    </div>
                  )}
                  <div className="tr-iv-duration-total">
                    Total: <strong>{effectiveMinutes()} minutes</strong>
                    {isCustomDuration && effectiveMinutes() < 5 && (
                      <span style={{ color: "#f59e0b", marginLeft: 8 }}>· minimum 5 minutes required</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="tr-iv-block">
                <div className="tr-iv-block-label">{I.bars} Difficulty Level</div>
                <div className="tr-iv-levels">
                  {LEVELS.map((lvl) => {
                    const sel = level === lvl.id;
                    return (
                      <div key={lvl.id}
                        onClick={() => setLevel(lvl.id)}
                        className={`tr-iv-level${sel ? " sel" : ""}`}>
                        {sel && <span className="tr-iv-level-check">{I.check}</span>}
                        <div className="tr-iv-level-icon">{lvl.icon}</div>
                        <div className="tr-iv-level-name">{lvl.name}</div>
                        <div className="tr-iv-level-desc">{lvl.desc}</div>
                        {sel && <span className="tr-iv-level-sel-tag">{I.check} SELECTED</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* This Session Covers */}
              <div className="tr-iv-block">
                <div className="tr-iv-block-label">{I.layers} This Session Covers (click any for details)</div>
                <div className="tr-iv-modules">
                  {MODULE_INFO.map((m) => (
                    <div key={m.id} onClick={() => setPopupModule(m)} className="tr-iv-module">
                      <div className="tr-iv-module-head">
                        <span className="tr-iv-module-icon">{m.icon}</span>
                        <span className="tr-iv-module-name" style={{ color: m.color }}>{m.name}</span>
                      </div>
                      <div className="tr-iv-module-topic">{m.topic}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button type="button" className="tr-iv-start" onClick={handleStartSession}>
                {I.rocket} Start Interview Session
              </button>

              {/* Note */}
              <div className="tr-iv-note">
                {I.bulb}
                <div>
                  <strong>Note:</strong> The AI may present scenarios based on real-world security incidents for assessment. Educational use only.
                </div>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="tr-iv-sidebar">

            {/* Interview Readiness */}
            <div className="tr-iv-side-card fadeUp">
              <div className="tr-iv-side-head">
                <h4 className="tr-iv-side-title">Interview Readiness</h4>
                <span className="tr-iv-side-info" title="Score appears after you complete an interview">{I.info}</span>
              </div>
              <div className="tr-iv-gauge"><ReadinessGauge value={null} /></div>
              <div className="tr-iv-gauge-label">Not Assessed</div>
              <div className="tr-iv-gauge-desc">Complete interviews to get your readiness score.</div>
              <button type="button" className="tr-iv-side-btn" onClick={handleStartSession}>Start Interview</button>
            </div>

            {/* Recent Activity */}
            <div className="tr-iv-side-card fadeUp">
              <div className="tr-iv-side-head"><h4 className="tr-iv-side-title">Recent Activity</h4></div>
              <div className="tr-iv-activity-empty">
                <div className="tr-iv-activity-icon">{I.clipboard}</div>
                <div className="tr-iv-activity-title">No recent interviews yet.</div>
                <div className="tr-iv-activity-sub">Start your first interview to see your activity here.</div>
              </div>
            </div>

            {/* Tips to Improve */}
            <div className="tr-iv-side-card fadeUp">
              <div className="tr-iv-side-head"><h4 className="tr-iv-side-title">Tips to Improve</h4></div>
              <div className="tr-iv-tips">
                {["Practice regularly","Review explanations","Focus on weak areas","Track your progress"].map(t => (
                  <div key={t} className="tr-iv-tip">
                    <span className="tr-iv-tip-check">{I.tipCheck}</span>{t}
                  </div>
                ))}
              </div>
              <button type="button" className="tr-iv-tips-link"
                onClick={() => { setDashTab("help"); localStorage.setItem('cyberprep_tab', 'help'); }}>
                View All Tips {I.arrow}
              </button>
            </div>

            {/* Interview History — entry-point card with recent report preview */}
            <div className="tr-iv-side-card tr-iv-history-card fadeUp">
              <div className="tr-iv-history-card-head">
                <div className="tr-iv-history-card-head-left">
                  <div className="tr-iv-history-card-icon">{I.archive}</div>
                  <div>
                    <h4 className="tr-iv-side-title">Interview History</h4>
                    <div className="tr-iv-history-card-count">
                      {reportsLoading && reports.length === 0
                        ? "Loading…"
                        : reports.length === 0
                          ? "No reports yet"
                          : `${reports.length} report${reports.length === 1 ? '' : 's'} saved`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Most-recent report preview */}
              {reports.length === 0 ? (
                <div className="tr-iv-history-empty-preview">
                  <div className="tr-iv-history-empty-icon">{I.clipboard}</div>
                  <div className="tr-iv-history-empty-title">No interviews yet</div>
                  <div className="tr-iv-history-empty-sub">Complete an interview to save your first report here.</div>
                </div>
              ) : (() => {
                const latest = reports[0];
                const shortId = reportShortId(latest.id);
                const date = latest.completed_at
                  ? new Date(latest.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—';
                const time = latest.completed_at
                  ? new Date(latest.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '';
                const isCompleted = !!latest.completed_at;
                return (
                  <div className="tr-iv-history-latest">
                    <div className="tr-iv-history-latest-meta-row">
                      <span className="tr-iv-history-latest-badge">Most Recent</span>
                      <span className={`tr-iv-history-latest-status ${isCompleted ? 'ok' : 'pending'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="tr-iv-history-latest-title">Interview Report – Session #{shortId}</div>
                    <div className="tr-iv-history-latest-meta">
                      <span>{date}{time ? ` · ${time}` : ''}</span>
                      <span className="tr-iv-history-latest-diff">{reportDifficulty(latest)}</span>
                    </div>
                    <div className="tr-iv-history-latest-actions">
                      <button type="button" className="tr-iv-history-latest-btn primary"
                        onClick={() => setDetailReport(latest)}>
                        {I.eye} Quick View
                      </button>
                      <button type="button" className="tr-iv-history-latest-btn outline"
                        onClick={() => downloadReportPDF(latest)}
                        title="Download PDF">
                        {I.pdf} PDF
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* View all */}
              <button type="button" className="tr-iv-history-view-all"
                onClick={() => setHistoryOpen(true)}>
                View All History {I.arrow}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Interview History Modal (list view) ── */}
      {historyOpen && !detailReport && (
        <div className="tr-iv-modal-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="tr-iv-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="tr-iv-modal-head">
              <div>
                <h2 className="tr-iv-modal-title">Interview History</h2>
                <p className="tr-iv-modal-sub">Browse, search, and download all your past interview reports.</p>
              </div>
              <div className="tr-iv-modal-actions">
                <button type="button" className="tr-iv-modal-refresh"
                  onClick={fetchReports} disabled={reportsLoading}
                  title="Refresh">
                  {I.refresh}
                </button>
                <button type="button" className="tr-iv-modal-close"
                  onClick={() => setHistoryOpen(false)} aria-label="Close history">
                  {I.xCircle}
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="tr-iv-modal-stats">
              <div className="tr-iv-modal-stat">
                <div className="tr-iv-modal-stat-icon">{I.clipboard}</div>
                <div>
                  <div className="tr-iv-modal-stat-num">{historyStats.total}</div>
                  <div className="tr-iv-modal-stat-lbl">Total Reports</div>
                </div>
              </div>
              <div className="tr-iv-modal-stat">
                <div className="tr-iv-modal-stat-icon ok">{I.tipCheck}</div>
                <div>
                  <div className="tr-iv-modal-stat-num">{historyStats.completed}</div>
                  <div className="tr-iv-modal-stat-lbl">Completed</div>
                </div>
              </div>
              <div className="tr-iv-modal-stat">
                <div className="tr-iv-modal-stat-icon warn">{I.trophy}</div>
                <div>
                  <div className="tr-iv-modal-stat-num">{historyStats.avgScore}</div>
                  <div className="tr-iv-modal-stat-lbl">Avg Score</div>
                </div>
              </div>
              <div className="tr-iv-modal-stat">
                <div className="tr-iv-modal-stat-icon trend">{I.trend}</div>
                <div>
                  <div className="tr-iv-modal-stat-num">{historyStats.totalXP}</div>
                  <div className="tr-iv-modal-stat-lbl">
                    Total XP
                    {historyStats.trend != null && (
                      <span className={`tr-iv-trend ${parseFloat(historyStats.trend) >= 0 ? 'up' : 'down'}`}>
                        {parseFloat(historyStats.trend) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(historyStats.trend))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="tr-iv-modal-controls">
              <div className="tr-iv-modal-search">
                <span className="tr-iv-modal-search-icon">{I.search}</span>
                <input
                  type="text"
                  placeholder="Search by session #, date, time, difficulty, status, title..."
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  autoFocus
                />
                {reportSearch && (
                  <button type="button" className="tr-iv-modal-search-clear"
                    onClick={() => setReportSearch("")}
                    title="Clear search">{I.xCircle}</button>
                )}
              </div>
              <select className="tr-iv-modal-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
              <select className="tr-iv-modal-filter" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                <option value="all">All Difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Results count */}
            <div className="tr-iv-modal-count">
              Showing <strong>{filteredReports.length}</strong> of {reports.length} report{reports.length === 1 ? '' : 's'}
            </div>

            {/* List */}
            <div className="tr-iv-modal-list">
              {reportsLoading && reports.length === 0 ? (
                <div className="tr-iv-modal-empty">Loading reports…</div>
              ) : reports.length === 0 ? (
                <div className="tr-iv-modal-empty">
                  <div className="tr-iv-modal-empty-icon">{I.clipboard}</div>
                  <div className="tr-iv-modal-empty-title">No interview history yet</div>
                  <div className="tr-iv-modal-empty-sub">
                    Reports appear here automatically after you complete an interview session.
                    <br />Start an interview from this page, finish it, and view your report — it will be saved here for you to revisit anytime.
                  </div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="tr-iv-modal-empty">
                  <div className="tr-iv-modal-empty-title">No reports match your filters.</div>
                  <div className="tr-iv-modal-empty-sub">Try a different search term or reset your filters.</div>
                </div>
              ) : (
                filteredReports.map((r, idx) => {
                  const shortId = reportShortId(r.id);
                  const date = r.completed_at
                    ? new Date(r.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : (r.started_at ? new Date(r.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
                  const time = r.completed_at
                    ? new Date(r.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const sc = r.overall_score != null ? parseFloat(r.overall_score) : null;
                  const scoreStr = sc != null ? sc.toFixed(1) : '—';
                  const scoreColor = sc == null ? '#8890b0' : sc >= 7 ? '#10b981' : sc >= 5 ? '#f59e0b' : '#ef4444';
                  const diff = reportDifficulty(r);
                  const isCompleted = !!r.completed_at;
                  return (
                    <div key={r.id} className="tr-iv-history-item" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>
                      <div className="tr-iv-history-item-main">
                        <div className="tr-iv-history-item-head">
                          <div className="tr-iv-history-item-title">Interview Report – Session #{shortId}</div>
                          <span className={`tr-iv-history-item-status ${isCompleted ? 'ok' : 'pending'}`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        <div className="tr-iv-history-item-grid">
                          <div className="tr-iv-history-item-cell">
                            <div className="lbl">Date & Time</div>
                            <div className="val">{date}{time ? ` · ${time}` : ''}</div>
                          </div>
                          <div className="tr-iv-history-item-cell">
                            <div className="lbl">Difficulty</div>
                            <div className="val"><span className="tr-iv-history-pill">{diff}</span></div>
                          </div>
                          <div className="tr-iv-history-item-cell">
                            <div className="lbl">Overall Score</div>
                            <div className="val" style={{ color: scoreColor, fontWeight: 800, fontSize: 16 }}>{scoreStr}<span style={{fontSize:11, color:'var(--tx2)', fontWeight:600}}>/10</span></div>
                          </div>
                          <div className="tr-iv-history-item-cell">
                            <div className="lbl">XP Earned</div>
                            <div className="val">+{r.earned_xp || 0} XP{r.badge && <span className="tr-iv-history-badge"> · {r.badge}</span>}</div>
                          </div>
                        </div>
                        <div className="tr-iv-history-item-id">ID: <code>{r.id}</code></div>
                      </div>
                      <div className="tr-iv-history-item-actions">
                        <button type="button" className="tr-iv-modal-btn primary"
                          onClick={() => setDetailReport(r)}
                          title="View full report">
                          {I.eye} View Full Report
                        </button>
                        <button type="button" className="tr-iv-modal-btn outline small"
                          onClick={() => downloadReportPDF(r)} title="Download PDF">
                          {I.pdf} Download PDF
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Full Saved Report — renders the EXACT report the user saw after completion ── */}
      {detailReport && (
        <div className="tr-iv-full-report-overlay" role="dialog" aria-modal="true">
          <div className="tr-iv-full-report-nav">
            <button type="button" className="tr-iv-detail-back" onClick={() => setDetailReport(null)}>
              {I.arrowLeft} Back to History
            </button>
            <div className="tr-iv-full-report-id">
              <span className="tr-iv-full-report-id-pill">Saved Report</span>
              Session #{reportShortId(detailReport.id)}
            </div>
            <div className="tr-iv-full-report-actions">
              <button type="button" className="tr-iv-modal-btn outline small"
                onClick={() => downloadReportPDF(detailReport)}>
                {I.pdf} Download PDF
              </button>
              <button type="button" className="tr-iv-modal-close"
                onClick={() => { setDetailReport(null); setHistoryOpen(false); }}
                aria-label="Close report">
                {I.xCircle}
              </button>
            </div>
          </div>
          <div className="tr-iv-full-report-body">
            {detailReport.report ? (
              <InterviewReport
                report={detailReport.report}
                onHome={() => { setDetailReport(null); setHistoryOpen(false); }}
                onRestart={() => { setDetailReport(null); setHistoryOpen(false); }}
              />
            ) : (
              <div className="tr-iv-modal-empty" style={{ padding: 80 }}>
                <div className="tr-iv-modal-empty-icon">{I.clipboard}</div>
                <div className="tr-iv-modal-empty-title">Report payload not available.</div>
                <div className="tr-iv-modal-empty-sub">
                  This interview was completed in an older version that did not save the full report payload.
                  Only the summary metadata is available.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      

      {/* ── Module full-UI popup (unchanged) ── */}
      {popupModule && (() => {
        const ModuleComponent = popupModule.Component;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
               onClick={() => setPopupModule(null)}>
            <div onClick={(e) => e.stopPropagation()}
                 style={{ background: "#0a0e1a", border: `1px solid ${popupModule.color}`, borderRadius: 12, width: "96vw", height: "94vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 30px ${popupModule.color}33` }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${popupModule.color}33`, background: `${popupModule.color}10`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div className="lbl" style={{ marginBottom: 0 }}>
                    <span style={{ color: popupModule.color, fontWeight: 800, letterSpacing: 1 }}>
                      {popupModule.icon} {popupModule.name.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--tx2)", marginLeft: 8, fontWeight: 400 }}>· {popupModule.topic}</span>
                  </div>
                </div>
                <button className="btn bs" onClick={() => setPopupModule(null)} style={{ fontSize: 14, padding: "4px 12px", flexShrink: 0 }}>✕ Close</button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 0 }}>
                <ModuleComponent />
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
