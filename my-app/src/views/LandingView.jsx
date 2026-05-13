// ═══════════════════════════════════════════════════════════════
// LANDING VIEW — PREMIUM REDESIGN
// Light-default theme + dark toggle (cyberprep_theme localStorage,
// shared with AuthView so the toggle state syncs across pages).
// All props/handlers preserved — pure visual layer rewrite.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";
import NoPasteInput from "../components/NoPasteInput.jsx";

// ── Scoped CSS (tr-land-* prefix — won't leak into other pages) ──
const LANDING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap');

/* ─── THEME TOKENS (light default — premium purple+white) ─── */
.tr-land-root{
  --tl-bg-base: #f8f5ff;
  --tl-bg-base-2: #f0eafa;
  --tl-bg-grad-1: rgba(124,58,237,.10);
  --tl-bg-grad-2: rgba(139,92,246,.08);
  --tl-bg-grad-3: rgba(167,139,250,.06);

  --tl-orb-1: rgba(167,139,250,.35);
  --tl-orb-2: rgba(124,58,237,.25);
  --tl-orb-3: rgba(196,181,253,.20);

  --tl-grid: rgba(124,58,237,.06);

  /* Text tokens — verified WCAG AA contrast on --tl-bg-base */
  --tl-fg: #0f0a24;         /* primary body — 17:1 contrast */
  --tl-fg-muted: #3d3656;   /* muted body  — 11:1 contrast (was #4a4365 8.5:1) */
  --tl-fg-dim: #5b5475;     /* dim/labels  — 7.5:1 contrast (was #6f6792 5:1) */
  --tl-fg-strong: #0a0618;  /* headings    — 19:1 contrast */

  --tl-accent: #7c3aed;
  --tl-accent-strong: #6d28d9;
  --tl-accent-soft: #a78bfa;
  --tl-accent-glow: rgba(124,58,237,.25);
  --tl-accent-tint: rgba(124,58,237,.08);
  --tl-accent-tint-2: rgba(124,58,237,.14);

  --tl-card-bg: #ffffff;
  --tl-card-border: #e3dcf2;
  --tl-card-shadow: 0 1px 2px rgba(78,40,148,.04), 0 12px 28px rgba(78,40,148,.08), 0 20px 48px rgba(78,40,148,.06);
  --tl-card-hover-shadow: 0 1px 2px rgba(78,40,148,.06), 0 18px 36px rgba(78,40,148,.14), 0 32px 64px rgba(78,40,148,.10);

  --tl-input-bg: #ffffff;
  --tl-input-border: #ddd4ef;
  --tl-input-fg: #0f0a24;
  --tl-input-placeholder: #8b85a4;

  --tl-divider: #e3dcf2;
  --tl-ghost-bg: #ffffff;
  --tl-ghost-bg-hover: #faf7ff;

  min-height:100vh;
  background: var(--tl-bg-base);
  color: var(--tl-fg);
  font-family:'Inter','Segoe UI',system-ui,sans-serif;
  position:relative;
  overflow-x:hidden;
  transition: background .35s ease, color .35s ease;
}

/* ─── DARK MODE OVERRIDES ─── */
.tr-land-root[data-theme="dark"]{
  --tl-bg-base: #0a0618;
  --tl-bg-base-2: #0d0820;
  --tl-bg-grad-1: rgba(124,58,237,.22);
  --tl-bg-grad-2: rgba(139,92,246,.18);
  --tl-bg-grad-3: rgba(67,56,202,.14);

  --tl-orb-1: rgba(124,58,237,.55);
  --tl-orb-2: rgba(99,102,241,.45);
  --tl-orb-3: rgba(167,139,250,.40);

  --tl-grid: rgba(196,181,253,.05);

  /* Text tokens — verified WCAG AA contrast on dark bg */
  --tl-fg: #f0eefa;         /* primary body — 16:1 contrast (was #e8e6f5) */
  --tl-fg-muted: #c8c2dc;   /* muted body  — 11:1 contrast (was #a8a0c4 8:1) */
  --tl-fg-dim: #a8a0c4;     /* dim/labels  — 7:1 contrast (was #6f6792 3.5:1 — FAILED AA) */
  --tl-fg-strong: #ffffff;  /* headings    — 19:1 contrast */

  --tl-accent: #c4b5fd;     /* lighter purple on dark — 9:1 contrast */
  --tl-accent-strong: #a78bfa;
  --tl-accent-soft: #ddd6fe;
  --tl-accent-glow: rgba(167,139,250,.35);
  --tl-accent-tint: rgba(167,139,250,.10);
  --tl-accent-tint-2: rgba(167,139,250,.18);

  --tl-card-bg: rgba(20,14,38,.65);
  --tl-card-border: rgba(255,255,255,.10);
  --tl-card-shadow: 0 16px 40px rgba(0,0,0,.40), 0 1px 0 rgba(255,255,255,.04) inset;
  --tl-card-hover-shadow: 0 24px 60px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.06) inset;

  --tl-input-bg: rgba(255,255,255,.06);
  --tl-input-border: rgba(255,255,255,.12);
  --tl-input-fg: #fff;
  --tl-input-placeholder: #8a82a8;

  --tl-divider: rgba(255,255,255,.10);
  --tl-ghost-bg: rgba(255,255,255,.05);
  --tl-ghost-bg-hover: rgba(255,255,255,.08);
}

/* ─── Atmospheric background ─── */
.tr-land-bg{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.tr-land-bg::before{
  content:"";position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 15% 20%, var(--tl-bg-grad-1) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, var(--tl-bg-grad-2) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, var(--tl-bg-grad-3) 0%, transparent 70%),
    linear-gradient(180deg, var(--tl-bg-base) 0%, var(--tl-bg-base-2) 50%, var(--tl-bg-base) 100%);
  transition: background .35s ease;
}
.tr-land-orb{position:absolute;border-radius:50%;filter:blur(80px);will-change:transform;opacity:.55}
.tr-land-orb.o1{width:620px;height:620px;background:radial-gradient(circle, var(--tl-orb-1) 0%, transparent 65%);top:-180px;left:-160px;animation:tr-land-drift1 24s ease-in-out infinite}
.tr-land-orb.o2{width:540px;height:540px;background:radial-gradient(circle, var(--tl-orb-2) 0%, transparent 65%);bottom:-160px;right:-140px;animation:tr-land-drift2 30s ease-in-out infinite}
.tr-land-orb.o3{width:420px;height:420px;background:radial-gradient(circle, var(--tl-orb-3) 0%, transparent 65%);top:50%;left:55%;animation:tr-land-drift3 26s ease-in-out infinite;opacity:.35}
@keyframes tr-land-drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(80px,60px) scale(1.1)}}
@keyframes tr-land-drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-60px,-80px) scale(1.15)}}
@keyframes tr-land-drift3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,40px) scale(.9)}66%{transform:translate(40px,-30px) scale(1.05)}}

/* ─── Theme toggle (top-right) ─── */
.tr-land-themebtn{
  position:fixed;top:20px;right:24px;z-index:50;
  width:42px;height:42px;
  display:grid;place-items:center;
  background: var(--tl-ghost-bg);
  border:1px solid var(--tl-card-border);
  color: var(--tl-fg);
  border-radius:10px;cursor:pointer;
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  transition:all .2s ease;
  box-shadow: 0 4px 12px rgba(78,40,148,.08);
}
.tr-land-themebtn:hover{
  border-color: var(--tl-accent);
  color: var(--tl-accent);
  transform:translateY(-1px);
  box-shadow: 0 6px 16px var(--tl-accent-glow);
}
.tr-land-themebtn svg{width:18px;height:18px}

/* ─── Page container ─── */
.tr-land-page{
  position:relative;z-index:2;
  max-width:1280px;margin:0 auto;
  padding:48px 32px 56px;
}
@media (max-width:1024px){.tr-land-page{padding:44px 24px 48px}}
@media (max-width:640px){.tr-land-page{padding:36px 16px 40px}}

/* ─── HERO ─── */
.tr-land-hero{text-align:center;animation:tr-land-fadeup .6s ease-out both}
@keyframes tr-land-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.tr-land-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'JetBrains Mono',monospace;
  font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;
  color: var(--tl-accent);
  padding:6px 14px;
  background: var(--tl-accent-tint);
  border:1px solid var(--tl-accent-tint-2);
  border-radius:100px;
  margin-bottom:24px;
}
.tr-land-eyebrow-dot{
  width:6px;height:6px;border-radius:50%;
  background: var(--tl-accent);
  animation:tr-land-pulse 2s ease-in-out infinite;
}
@keyframes tr-land-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.85)}}

.tr-land-h1{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(36px, 5.5vw, 64px);
  font-weight:600;line-height:1.05;letter-spacing:-1.5px;
  color: var(--tl-fg-strong);
  max-width:880px;margin:0 auto 18px;
}
.tr-land-h1-accent{
  background:linear-gradient(120deg, var(--tl-accent-soft) 0%, var(--tl-accent) 60%, var(--tl-accent-strong) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  font-style:italic;
}
.tr-land-sub{
  font-size:clamp(15px, 1.4vw, 17px);
  color: var(--tl-fg-muted);
  line-height:1.6;max-width:680px;
  margin:0 auto 32px;
}

/* ─── Premium buttons ─── */
.tr-land-cta-row{
  display:flex;gap:14px;justify-content:center;flex-wrap:wrap;
  margin-bottom:36px;
}
.tr-land-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  padding:14px 32px;
  border-radius:11px;
  font-family:'Inter',sans-serif;
  font-size:15px;font-weight:600;letter-spacing:.2px;
  cursor:pointer;
  border:none;
  transition:all .25s cubic-bezier(.4,0,.2,1);
  position:relative;
  text-decoration:none;
}
.tr-land-btn-primary{
  background:linear-gradient(135deg, var(--tl-accent-soft) 0%, var(--tl-accent) 50%, var(--tl-accent-strong) 100%);
  color:#fff;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:
    0 10px 28px var(--tl-accent-glow),
    0 2px 4px var(--tl-accent-glow),
    0 1px 0 rgba(255,255,255,.22) inset;
  padding:16px 40px;
  font-size:16px;font-weight:700;
}
.tr-land-btn-primary::before{
  content:"";position:absolute;inset:-2px;border-radius:13px;z-index:-1;
  background:linear-gradient(135deg, var(--tl-accent-soft), var(--tl-accent), var(--tl-accent-strong));
  filter:blur(14px);opacity:.35;
  transition:opacity .25s ease;
}
.tr-land-btn-primary:hover{
  transform:translateY(-2px);
  box-shadow:
    0 16px 36px var(--tl-accent-glow),
    0 4px 8px var(--tl-accent-glow),
    0 1px 0 rgba(255,255,255,.28) inset;
}
.tr-land-btn-primary:hover::before{opacity:.55}
.tr-land-btn-primary:active{transform:translateY(-1px)}

.tr-land-btn-ghost{
  background: var(--tl-ghost-bg);
  color: var(--tl-fg);
  border:1px solid var(--tl-card-border);
  padding:14px 30px;
}
.tr-land-btn-ghost:hover{
  background: var(--tl-ghost-bg-hover);
  border-color: var(--tl-accent);
  color: var(--tl-accent);
  transform:translateY(-1px);
  box-shadow:0 6px 16px var(--tl-accent-glow);
}

/* ─── Demo card ─── */
.tr-land-demo{
  background: var(--tl-card-bg);
  border:1.5px solid var(--tl-accent-tint-2);
  border-radius:18px;
  padding:32px;
  box-shadow: var(--tl-card-shadow);
  position:relative;overflow:hidden;
  animation:tr-land-fadeup .7s ease-out .1s both;
  transition: background .35s ease, border-color .35s ease;
}
.tr-land-demo::before{
  content:"";position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent 0%, var(--tl-accent) 50%, transparent 100%);
  opacity:.6;
}
.tr-land-demo-head{text-align:center;margin-bottom:20px}
.tr-land-demo-lbl{
  font-family:'JetBrains Mono',monospace;
  font-size:10.5px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;
  color: var(--tl-accent);
  margin-bottom:10px;
}
.tr-land-demo-title{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:22px;font-weight:600;letter-spacing:-.4px;
  color: var(--tl-fg-strong);
  margin-bottom:5px;
}
.tr-land-demo-meta{font-size:12.5px;color: var(--tl-fg-dim)}

.tr-land-demo-tag{
  display:inline-block;
  padding:5px 12px;
  background: var(--tl-accent-tint);
  border:1px solid var(--tl-accent-tint-2);
  border-radius:7px;
  font-family:'JetBrains Mono',monospace;
  font-size:11px;font-weight:600;letter-spacing:.5px;
  color: var(--tl-accent);
  margin-bottom:12px;
}
.tr-land-demo-q{
  font-size:14px;font-weight:600;line-height:1.65;
  color: var(--tl-fg);
  margin-bottom:16px;
}

.tr-land-mode-row{display:flex;gap:6px;margin-bottom:12px}
.tr-land-mode-btn{
  padding:6px 14px;
  background: var(--tl-ghost-bg);
  border:1px solid var(--tl-card-border);
  border-radius:8px;
  font-size:12px;font-weight:600;color: var(--tl-fg-muted);
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
  display:inline-flex;align-items:center;gap:5px;
}
.tr-land-mode-btn:hover{border-color: var(--tl-accent); color: var(--tl-accent)}
.tr-land-mode-btn.active{
  background:linear-gradient(135deg, var(--tl-accent) 0%, var(--tl-accent-strong) 100%);
  color:#fff;border-color:transparent;
  box-shadow:0 4px 10px var(--tl-accent-glow);
}

.tr-land-demo-input{
  width:100%;min-height:90px;
  padding:12px 14px;
  background: var(--tl-input-bg);
  border:1px solid var(--tl-input-border);
  border-radius:10px;
  color: var(--tl-input-fg);
  font-family:inherit;font-size:13.5px;line-height:1.55;
  outline:none;resize:vertical;
  margin-bottom:14px;
  transition:all .2s ease;
}
.tr-land-demo-input::placeholder{color: var(--tl-input-placeholder)}
.tr-land-demo-input:focus{
  border-color: var(--tl-accent);
  box-shadow:0 0 0 3px var(--tl-accent-tint-2);
}

.tr-land-demo-submit{
  width:100%;padding:13px 24px;
  background:linear-gradient(135deg, var(--tl-accent-soft) 0%, var(--tl-accent) 50%, var(--tl-accent-strong) 100%);
  color:#fff;
  border:1px solid rgba(255,255,255,.10);
  border-radius:10px;
  font-family:inherit;font-size:14px;font-weight:700;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 8px 24px var(--tl-accent-glow), 0 1px 0 rgba(255,255,255,.22) inset;
  transition:all .22s cubic-bezier(.4,0,.2,1);
}
.tr-land-demo-submit:hover:not(:disabled){
  transform:translateY(-1px);
  box-shadow:0 12px 32px var(--tl-accent-glow), 0 1px 0 rgba(255,255,255,.28) inset;
}
.tr-land-demo-submit:disabled{opacity:.55;cursor:not-allowed;transform:none}

/* Voice rec ring */
.tr-land-rec{
  width:84px;height:84px;border-radius:50%;
  background: var(--tl-accent-tint);
  border:2px solid var(--tl-accent-tint-2);
  display:grid;place-items:center;
  font-size:34px;cursor:pointer;
  margin:0 auto 10px;
  transition:all .3s ease;
}
.tr-land-rec.active{
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color:#fff;border-color:#fca5a5;
  animation: tr-land-pulse-rec 1.4s ease-in-out infinite;
}
@keyframes tr-land-pulse-rec{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 16px rgba(239,68,68,0)}}
.tr-land-rec-hint{font-size:12.5px;text-align:center;color: var(--tl-fg-muted); margin-bottom:14px}
.tr-land-rec-hint.recording{color:#dc2626;font-weight:600}
.tr-land-rec-transcript{
  margin-top:10px;padding:11px 13px;
  background: var(--tl-input-bg);
  border:1px solid var(--tl-input-border);
  border-radius:8px;font-size:12.5px;line-height:1.6;
  text-align:left;color: var(--tl-fg);
}

/* Demo result */
.tr-land-demo-result{text-align:center;padding:12px 0 6px}
.tr-land-demo-score{
  font-family:'JetBrains Mono',monospace;
  font-size:56px;font-weight:800;letter-spacing:-2px;
  line-height:1;margin-bottom:10px;
}
.tr-land-demo-score.good{color:#10b981}
.tr-land-demo-score.warn{color:#f59e0b}
.tr-land-demo-score.bad{color:#ef4444}
.tr-land-demo-level{
  display:inline-block;padding:5px 14px;border-radius:8px;
  background: var(--tl-accent-tint);color: var(--tl-accent);
  font-size:12px;font-weight:700;letter-spacing:.5px;
  margin-bottom:10px;
}
.tr-land-demo-feedback{font-size:13px;color: var(--tl-fg-muted); line-height:1.55; max-width:480px; margin:0 auto 16px}
.tr-land-demo-tease{font-size:13px;color: var(--tl-fg); line-height:1.55; max-width:480px; margin:0 auto 14px}

/* Spinner */
.tr-land-loader{
  width:16px;height:16px;border-radius:50%;
  border:2px solid rgba(255,255,255,.30);
  border-top-color:#fff;
  animation:tr-land-spin .7s linear infinite;
}
@keyframes tr-land-spin{to{transform:rotate(360deg)}}

/* ─── Value Pills (3-up) ─── */
.tr-land-values{
  display:grid;grid-template-columns:repeat(3,1fr);gap:14px;
  margin-top:32px;
}
@media (max-width:880px){.tr-land-values{grid-template-columns:1fr}}
.tr-land-value{
  padding:22px;
  background: var(--tl-card-bg);
  border:1px solid var(--tl-card-border);
  border-radius:14px;
  box-shadow: var(--tl-card-shadow);
  transition:all .25s ease;
  animation:tr-land-fadeup .6s ease-out both;
}
.tr-land-value:hover{
  transform:translateY(-3px);
  box-shadow: var(--tl-card-hover-shadow);
  border-color: var(--tl-accent-tint-2);
}
.tr-land-value-icon{font-size:24px;margin-bottom:10px;display:block}
.tr-land-value-title{
  font-size:14.5px;font-weight:700;
  color: var(--tl-fg-strong);
  margin-bottom:7px;letter-spacing:-.2px;
}
.tr-land-value-desc{font-size:13px;color: var(--tl-fg-muted); line-height:1.6}

/* ─── Trust Signals ─── */
.tr-land-trust{
  text-align:center;margin-top:36px;
  padding:24px;
  background: var(--tl-card-bg);
  border:1px solid var(--tl-card-border);
  border-radius:12px;
}
.tr-land-trust-lbl{
  font-family:'JetBrains Mono',monospace;
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color: var(--tl-accent);
  margin-bottom:14px;
}
.tr-land-trust-items{
  display:flex;justify-content:center;align-items:center;gap:18px;
  flex-wrap:wrap;font-size:12.5px;font-weight:500;
  color: var(--tl-fg-muted);
}
.tr-land-trust-items .dot{color: var(--tl-accent); font-weight:700}

/* ─── Role Grid ─── */
.tr-land-roles-section{margin-top:40px;text-align:center}
.tr-land-roles-lbl{
  font-family:'JetBrains Mono',monospace;
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color: var(--tl-accent);
  margin-bottom:24px;
}
.tr-land-roles{
  display:grid;grid-template-columns:repeat(4,1fr);gap:14px;
  text-align:left;
}
@media (max-width:1024px){.tr-land-roles{grid-template-columns:repeat(3,1fr)}}
@media (max-width:760px){.tr-land-roles{grid-template-columns:repeat(2,1fr)}}
@media (max-width:480px){.tr-land-roles{grid-template-columns:1fr}}

.tr-land-role{
  padding:18px;
  background: var(--tl-card-bg);
  border:1px solid var(--tl-card-border);
  border-radius:13px;
  box-shadow: var(--tl-card-shadow);
  text-align:center;
  transition:all .28s cubic-bezier(.4,0,.2,1);
  animation:tr-land-fadeup .5s ease-out both;
  position:relative;overflow:hidden;
}
.tr-land-role::before{
  content:"";position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent 0%, var(--tl-accent) 50%, transparent 100%);
  opacity:0;transition:opacity .28s ease;
}
.tr-land-role:hover{
  transform:translateY(-4px) scale(1.02);
  box-shadow: var(--tl-card-hover-shadow);
  border-color: var(--tl-accent-tint-2);
}
.tr-land-role:hover::before{opacity:1}
.tr-land-role-icon{
  font-size:28px;margin-bottom:8px;display:block;
  filter:drop-shadow(0 2px 6px var(--tl-accent-glow));
}
.tr-land-role-name{
  font-size:13.5px;font-weight:700;
  color: var(--tl-fg-strong);
  margin-bottom:4px;letter-spacing:-.1px;
}
.tr-land-role-desc{font-size:12px;color: var(--tl-fg-muted); line-height:1.5}

/* ─── Stats (4-up) ─── */
.tr-land-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
  margin-top:32px;
}
@media (max-width:760px){.tr-land-stats{grid-template-columns:repeat(2,1fr)}}
.tr-land-stat{
  padding:22px 16px;
  background: var(--tl-card-bg);
  border:1px solid var(--tl-card-border);
  border-radius:13px;
  box-shadow: var(--tl-card-shadow);
  text-align:center;
  transition:all .25s ease;
  animation:tr-land-fadeup .5s ease-out both;
}
.tr-land-stat:hover{
  transform:translateY(-2px);
  box-shadow: var(--tl-card-hover-shadow);
  border-color: var(--tl-accent-tint-2);
}
.tr-land-stat-val{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:32px;font-weight:700;letter-spacing:-1px;line-height:1;
  background:linear-gradient(135deg, var(--tl-accent) 0%, var(--tl-accent-strong) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  margin-bottom:6px;
}
.tr-land-stat-lbl{
  font-size:11.5px;font-weight:600;letter-spacing:.5px;
  color: var(--tl-fg-dim);
  text-transform:uppercase;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — tablet (≤960px) and mobile (≤640px / ≤420px)
   ═══════════════════════════════════════════════════════════════ */

/* Tablet — small laptops, large tablets */
@media (max-width: 960px){
  .tr-land-h1{font-size:clamp(30px, 5vw, 44px)}
  .tr-land-sub{font-size:14.5px}
  .tr-land-demo{padding:24px}
  .tr-land-themebtn{top:14px;right:16px;width:38px;height:38px}
  .tr-land-stats{grid-template-columns:repeat(2,1fr)}
  .tr-land-stat-val{font-size:28px}
}

/* Mobile — phones (portrait + landscape) */
@media (max-width: 640px){
  .tr-land-themebtn{top:12px;right:12px;width:36px;height:36px;border-radius:9px}
  .tr-land-themebtn svg{width:16px;height:16px}

  .tr-land-eyebrow{font-size:10px;padding:5px 11px;margin-bottom:18px;letter-spacing:1.8px}
  .tr-land-h1{font-size:clamp(26px, 7vw, 36px);letter-spacing:-1px;margin-bottom:14px}
  .tr-land-sub{font-size:14px;margin-bottom:24px;padding:0 4px}

  /* Stack CTAs on phones — full width per button */
  .tr-land-cta-row{flex-direction:column;gap:10px;margin-bottom:28px}
  .tr-land-cta-row .tr-land-btn{width:100%;padding:14px 24px;font-size:14.5px}
  .tr-land-cta-row .tr-land-btn-primary{padding:14px 24px;font-size:15px}

  /* Demo card on mobile — less padding, smaller font */
  .tr-land-demo{padding:18px 16px;border-radius:14px}
  .tr-land-demo-title{font-size:18px}
  .tr-land-demo-meta{font-size:11.5px}
  .tr-land-demo-q{font-size:13.5px;line-height:1.6}
  .tr-land-demo-input{min-height:84px;font-size:13px}
  .tr-land-demo-score{font-size:44px}

  /* Value pills — single column with tighter padding */
  .tr-land-values{grid-template-columns:1fr;gap:12px}
  .tr-land-value{padding:18px}
  .tr-land-value-title{font-size:14px}
  .tr-land-value-desc{font-size:12.5px}

  /* Trust strip — smaller, allow tighter wrapping */
  .tr-land-trust{padding:18px;margin-top:28px}
  .tr-land-trust-lbl{font-size:10px;letter-spacing:2px;margin-bottom:10px}
  .tr-land-trust-items{font-size:11.5px;gap:10px}

  /* Role grid — already 2-col at 760px, single col at 480px */
  .tr-land-roles-section{margin-top:32px}
  .tr-land-roles-lbl{font-size:10px;letter-spacing:2px;margin-bottom:18px}
  .tr-land-role{padding:14px}
  .tr-land-role-icon{font-size:24px;margin-bottom:6px}
  .tr-land-role-name{font-size:13px}
  .tr-land-role-desc{font-size:11.5px}

  /* Stats — 2-col, smaller text */
  .tr-land-stats{margin-top:26px;gap:10px}
  .tr-land-stat{padding:18px 12px}
  .tr-land-stat-val{font-size:24px;letter-spacing:-.6px}
  .tr-land-stat-lbl{font-size:10.5px;letter-spacing:.3px}
}

/* Small phones (≤420px) — extra compression */
@media (max-width: 420px){
  .tr-land-page{padding:32px 12px 32px}
  .tr-land-h1{font-size:26px}
  .tr-land-demo{padding:16px 14px}
  .tr-land-mode-row{gap:5px}
  .tr-land-mode-btn{padding:6px 10px;font-size:11.5px}
  .tr-land-role{padding:12px}
}
`;

export default function LandingView({
  // ── STATE ──
  hookHeadline,
  hookSubline,
  demoQ,
  demoAnswer,
  demoScore,
  demoLoading,
  demoInputMode,
  demoVoice,
  // ── SETTERS ──
  setDemoAnswer,
  setDemoInputMode,
  setView,
  setAuthMode,
  setIsPaid,
  setFreeAttempts,
  setUser,
  setSubscribedRoles,
  setSelectedRoles,
  setTrialRoles,
  // ── HANDLERS ──
  runDemo,
}) {
  // ── Theme state — synced with AuthView via cyberprep_theme localStorage ──
  const [landTheme, setLandTheme] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cyberprep_theme") : null;
      return saved === "dark" ? "dark" : "light";
    } catch (_) { return "light"; }
  });
  useEffect(() => {
    try { localStorage.setItem("cyberprep_theme", landTheme); } catch (_) {}
  }, [landTheme]);
  const toggleTheme = () => setLandTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleStartTrial = () => {
    setIsPaid(false);
    setFreeAttempts(2);
    setUser(null);
    setSubscribedRoles([]);
    setSelectedRoles([]);
    setTrialRoles([]);
    localStorage.removeItem('token');
    localStorage.removeItem('cyberprep_user');
    localStorage.removeItem('cyberprep_usertype');
    localStorage.removeItem('cyberprep_freetrial');
    localStorage.removeItem('trialRoles');
    localStorage.removeItem('subscribedRoles');
    localStorage.removeItem('roleAttempts');
    setView("trial-role-select");
  };

  const scoreClass = !demoScore ? "" : demoScore.score >= 7 ? "good" : demoScore.score >= 5 ? "warn" : "bad";

  return (
    <div className="app">
      <style>{CSS}</style>
      <style>{LANDING_CSS}</style>
      <ToastContainer />

      <div className="tr-land-root" data-theme={landTheme}>
        {/* Atmospheric background */}
        <div className="tr-land-bg" aria-hidden="true">
          <div className="tr-land-orb o1" />
          <div className="tr-land-orb o2" />
          <div className="tr-land-orb o3" />
        </div>

        {/* Theme toggle */}
        <button
          className="tr-land-themebtn"
          onClick={toggleTheme}
          type="button"
          aria-label={landTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={landTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {landTheme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>

        <div className="tr-land-page">
          {/* ════════ HERO ════════ */}
          <div className="tr-land-hero">
            <div className="tr-land-eyebrow">
              <span className="tr-land-eyebrow-dot" />
              Attack Reasoning Lab
            </div>
            <h1 className="tr-land-h1">{hookHeadline}</h1>
            <p className="tr-land-sub">
              A real-world cybersecurity assessment platform. Validate security decision-making through
              adaptive attack simulations. For engineers proving skills and hiring managers validating talent.
            </p>
            <div className="tr-land-cta-row">
              <button type="button" className="tr-land-btn tr-land-btn-primary" onClick={handleStartTrial}>
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <button type="button" className="tr-land-btn tr-land-btn-ghost"
                onClick={() => { setAuthMode("login"); setView("auth"); }}>
                Sign In
              </button>
            </div>
          </div>

          {/* ════════ INSTANT DEMO ════════ */}
          <div className="tr-land-demo">
            <div className="tr-land-demo-head">
              <div className="tr-land-demo-lbl">Try a real attack scenario in 2 minutes</div>
              <div className="tr-land-demo-title">{hookSubline}</div>
              <div className="tr-land-demo-meta">No signup required. Type or dictate your answer. Instant AI score.</div>
            </div>

            {!demoScore ? (
              <>
                <div className="tr-land-demo-tag">{demoQ.ca}</div>
                <div className="tr-land-demo-q">{demoQ.q}</div>

                <div className="tr-land-mode-row">
                  <button type="button"
                    className={`tr-land-mode-btn ${demoInputMode === "text" ? "active" : ""}`}
                    onClick={() => setDemoInputMode("text")}>
                    ✏️ Type
                  </button>
                  <button type="button"
                    className={`tr-land-mode-btn ${demoInputMode === "voice" ? "active" : ""}`}
                    onClick={() => setDemoInputMode("voice")}>
                    🎤 Dictate
                  </button>
                </div>

                {demoInputMode === "text" ? (
                  <NoPasteInput
                    placeholder="Type your answer here..."
                    value={demoAnswer}
                    onChange={(e) => setDemoAnswer(e.target.value)}
                    className="tr-land-demo-input"
                  />
                ) : (
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div
                      className={`tr-land-rec ${demoVoice.recording ? "active" : ""}`}
                      onClick={demoVoice.recording ? demoVoice.stop : demoVoice.start}
                    >
                      {demoVoice.recording ? "⏹" : "🎤"}
                    </div>
                    <div className={`tr-land-rec-hint ${demoVoice.recording ? "recording" : ""}`}>
                      {demoVoice.recording ? "Recording… tap to stop" : "Tap to start dictating"}
                    </div>
                    {demoVoice.transcript && (
                      <div className="tr-land-rec-transcript">{demoVoice.transcript}</div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="tr-land-demo-submit"
                  disabled={demoLoading || (!(demoAnswer?.trim()) && !(demoVoice.transcript?.trim()))}
                  onClick={runDemo}
                >
                  {demoLoading ? <span className="tr-land-loader" /> : (
                    <>
                      Get My Score
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="tr-land-demo-result">
                <div className={`tr-land-demo-score ${scoreClass}`}>{demoScore.score}/10</div>
                <div className="tr-land-demo-level">{demoScore.level}</div>
                <div className="tr-land-demo-feedback">{demoScore.feedback}</div>
                <div className="tr-land-demo-tease">
                  Your full Skills Score (0-500) + benchmarking + role readiness badges require a free account.
                </div>
                <button
                  type="button"
                  className="tr-land-btn tr-land-btn-primary"
                  style={{ padding: "12px 28px", fontSize: 14 }}
                  onClick={() => { setAuthMode("signup"); setView("auth"); }}
                >
                  Create Free Account
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* ════════ VALUE PILLS ════════ */}
          <div className="tr-land-values">
            {[
              { icon: "🎯", title: "Replace 2-3 Interview Rounds", desc: "Pre-validate attack reasoning. Companies save 20+ hours per hire." },
              { icon: "🏗️", title: "Real Architecture Reasoning", desc: "Not theory. Not certifications. Real attack scenarios with real architectures." },
              { icon: "📊", title: "Team Skill Visibility", desc: "CISOs see team gaps across security domains. Measurable improvement." },
            ].map((v, i) => (
              <div key={i} className="tr-land-value" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="tr-land-value-icon">{v.icon}</span>
                <div className="tr-land-value-title">{v.title}</div>
                <div className="tr-land-value-desc">{v.desc}</div>
              </div>
            ))}
          </div>

          {/* ════════ TRUST SIGNALS ════════ */}
          <div className="tr-land-trust">
            <div className="tr-land-trust-lbl">Trusted by 500+ Security Engineers</div>
            <div className="tr-land-trust-items">
              <span>Based on real CVEs</span>
              <span className="dot">·</span>
              <span>MITRE ATT&amp;CK mapped</span>
              <span className="dot">·</span>
              <span>AI-powered evaluation</span>
              <span className="dot">·</span>
              <span>Designed by security engineers</span>
            </div>
          </div>

          {/* ════════ ROLE GRID ════════ */}
          <div className="tr-land-roles-section">
            <div className="tr-land-roles-lbl">12 Security Tracks · 4 Difficulty Levels · Adaptive AI</div>
            <div className="tr-land-roles">
              {ROLES.map((r, i) => (
                <div key={r.id} className="tr-land-role" style={{ animationDelay: `${i * 0.04}s` }}>
                  <span className="tr-land-role-icon">{r.icon}</span>
                  <div className="tr-land-role-name">{r.name}</div>
                  <div className="tr-land-role-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════ STATS ════════ */}
          <div className="tr-land-stats">
            {[
              ["12", "Roles"],
              ["4", "Difficulty Levels"],
              ["0-500", "Skills Score"],
              ["AI", "Adaptive Questions"],
            ].map(([v, l], i) => (
              <div key={i} className="tr-land-stat" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="tr-land-stat-val">{v}</div>
                <div className="tr-land-stat-lbl">{l}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
