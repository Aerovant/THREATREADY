// ═══════════════════════════════════════════════════════════════
// AUTH VIEW — REDESIGNED (Login / Signup + email verify + B2C/B2B + forgot flow)
// 8 sub-states preserved: form · verify · detect · company-info · roleselect ·
//                          forgot · resetcode · resetdone
// All props, handlers, OAuth, PasswordStrength left untouched — visual layer only.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { CSS } from "../styles.js";
import { ROLES, SCENARIOS } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";

// ── Scoped CSS (prefix tr-auth- so it can't leak into other pages) ──
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap');

/* ───────── THEME TOKENS (light default — Sign In page is white+purple) ───────── */
.tr-auth-root{
  --ta-bg-grad-1: rgba(124,58,237,.06);
  --ta-bg-grad-2: rgba(139,92,246,.05);
  --ta-bg-grad-3: rgba(167,139,250,.04);
  --ta-bg-base: #fafaff;
  --ta-bg-base-2: #f4f1fa;

  --ta-orb-1: rgba(167,139,250,.22);
  --ta-orb-2: rgba(124,58,237,.16);
  --ta-orb-3: rgba(196,181,253,.14);

  --ta-grid: rgba(124,58,237,.06);

  /* Text tokens — verified WCAG AA contrast on --ta-bg-base */
  --ta-fg: #1a1530;          /* primary body — 14:1 contrast */
  --ta-fg-muted: #3d3656;    /* muted body  — 10:1 contrast (was #5b5475 7.5:1) */
  --ta-fg-dim: #5b5475;      /* dim/labels  — 7.5:1 contrast (was #8b85a4 4:1 — borderline) */
  --ta-fg-strong: #0d0a1e;   /* headings    — 18:1 contrast */

  --ta-accent: #7c3aed;
  --ta-accent-strong: #6d28d9;
  --ta-accent-soft: #a78bfa;
  --ta-accent-glow: rgba(124,58,237,.20);
  --ta-accent-tint: rgba(124,58,237,.08);
  --ta-accent-tint-2: rgba(124,58,237,.14);

  --ta-card-bg: #ffffff;
  --ta-card-border: #e9e2f6;
  --ta-card-shadow: 0 24px 48px rgba(78,40,148,.10), 0 2px 6px rgba(78,40,148,.05);
  --ta-card-divider: rgba(124,58,237,.10);

  --ta-input-bg: #ffffff;
  --ta-input-bg-hover: #fafafe;
  --ta-input-border: #e3dcf2;
  --ta-input-border-hover: #c8bce8;
  --ta-input-fg: #1a1530;
  --ta-input-placeholder: #8b85a4;
  --ta-input-focus-glow: rgba(124,58,237,.14);

  --ta-toggle-bg: #f3eefb;
  --ta-toggle-border: transparent;
  --ta-toggle-btn-fg: #5b5475;

  --ta-ghost-bg: #ffffff;
  --ta-ghost-bg-hover: #fafafe;
  --ta-ghost-fg: #1a1530;
  --ta-ghost-border: #e3dcf2;

  --ta-divider: #e9e2f6;

  --ta-alert-error-bg: #fef2f2;
  --ta-alert-error-border: #fecaca;
  --ta-alert-error-fg: #b91c1c;
  --ta-alert-success-bg: #f0fdf4;
  --ta-alert-success-border: #bbf7d0;
  --ta-alert-success-fg: #15803d;

  position:fixed;inset:0;min-height:100vh;width:100%;height:100vh;height:100dvh;
  background: var(--ta-bg-base);
  color: var(--ta-fg);
  font-family:'Inter','Segoe UI',system-ui,sans-serif;
  overflow:hidden;
  z-index:1;
  transition: background .35s ease, color .35s ease;
}

/* ───────── DARK MODE OVERRIDES ───────── */
.tr-auth-root[data-theme="dark"]{
  --ta-bg-base: #0a0618;
  --ta-bg-base-2: #0d0820;
  --ta-bg-grad-1: rgba(124,58,237,.22);
  --ta-bg-grad-2: rgba(139,92,246,.18);
  --ta-bg-grad-3: rgba(67,56,202,.14);

  --ta-orb-1: rgba(124,58,237,.55);
  --ta-orb-2: rgba(99,102,241,.45);
  --ta-orb-3: rgba(167,139,250,.40);

  --ta-grid: rgba(196,181,253,.05);

  /* Text tokens — verified WCAG AA contrast on dark bg */
  --ta-fg: #f0eefa;          /* primary body — 16:1 (was #e8e6f5) */
  --ta-fg-muted: #c8c2dc;    /* muted body  — 11:1 (was #a8a0c4 8:1) */
  --ta-fg-dim: #a8a0c4;      /* dim/labels  — 7:1 (was #6f6792 3.5:1 — FAILED AA) */
  --ta-fg-strong: #ffffff;   /* headings    — 19:1 */

  --ta-accent: #c4b5fd;      /* lighter purple on dark — 9:1 */
  --ta-accent-strong: #a78bfa;
  --ta-accent-soft: #ddd6fe;
  --ta-accent-glow: rgba(167,139,250,.30);
  --ta-accent-tint: rgba(167,139,250,.10);
  --ta-accent-tint-2: rgba(167,139,250,.20);

  --ta-card-bg: rgba(20,14,38,.65);
  --ta-card-border: rgba(255,255,255,.12);
  --ta-card-shadow: 0 24px 80px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06) inset;
  --ta-card-divider: rgba(255,255,255,.10);

  --ta-input-bg: rgba(255,255,255,.06);
  --ta-input-bg-hover: rgba(255,255,255,.08);
  --ta-input-border: rgba(255,255,255,.12);
  --ta-input-border-hover: rgba(167,139,250,.45);
  --ta-input-fg: #fff;
  --ta-input-placeholder: #8a82a8;
  --ta-input-focus-glow: rgba(167,139,250,.20);

  --ta-toggle-bg: rgba(255,255,255,.06);
  --ta-toggle-border: rgba(255,255,255,.08);
  --ta-toggle-btn-fg: #a8a0c4;

  --ta-ghost-bg: rgba(255,255,255,.05);
  --ta-ghost-bg-hover: rgba(255,255,255,.08);
  --ta-ghost-fg: #f0eefa;
  --ta-ghost-border: rgba(255,255,255,.12);

  --ta-divider: rgba(255,255,255,.10);

  --ta-alert-error-bg: rgba(239,68,68,.12);
  --ta-alert-error-border: rgba(239,68,68,.30);
  --ta-alert-error-fg: #fca5a5;
  --ta-alert-success-bg: rgba(34,197,94,.12);
  --ta-alert-success-border: rgba(34,197,94,.30);
  --ta-alert-success-fg: #86efac;
}

/* Atmospheric background — sits behind everything */
.tr-auth-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.tr-auth-bg::before{
  content:"";position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 15% 20%, var(--ta-bg-grad-1) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, var(--ta-bg-grad-2) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, var(--ta-bg-grad-3) 0%, transparent 70%),
    linear-gradient(180deg, var(--ta-bg-base) 0%, var(--ta-bg-base-2) 50%, var(--ta-bg-base) 100%);
  transition: background .35s ease;
}
/* Floating orbs — softer in light theme */
.tr-auth-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.6;will-change:transform}
.tr-auth-root[data-theme="dark"] .tr-auth-orb{opacity:.6}
.tr-auth-orb{opacity:.45}
.tr-auth-orb.o1{width:520px;height:520px;background:radial-gradient(circle, var(--ta-orb-1) 0%, transparent 65%);top:-120px;left:-120px;animation:tr-drift1 22s ease-in-out infinite}
.tr-auth-orb.o2{width:480px;height:480px;background:radial-gradient(circle, var(--ta-orb-2) 0%, transparent 65%);bottom:-140px;right:-120px;animation:tr-drift2 28s ease-in-out infinite}
.tr-auth-orb.o3{width:380px;height:380px;background:radial-gradient(circle, var(--ta-orb-3) 0%, transparent 65%);top:40%;left:55%;animation:tr-drift3 25s ease-in-out infinite;opacity:.3}
@keyframes tr-drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(80px,60px) scale(1.1)}}
@keyframes tr-drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-60px,-80px) scale(1.15)}}
@keyframes tr-drift3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,40px) scale(.9)}66%{transform:translate(40px,-30px) scale(1.05)}}

/* Fine grid overlay */
.tr-auth-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(var(--ta-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--ta-grid) 1px, transparent 1px);
  background-size:48px 48px;
  mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
  pointer-events:none;
}
/* Subtle grain — slightly stronger in light mode for paper feel */
.tr-auth-grain{
  position:absolute;inset:0;opacity:.025;pointer-events:none;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.tr-auth-root[data-theme="dark"] .tr-auth-grain{opacity:.04;mix-blend-mode:overlay}

/* In-card controls row — Back (left) + theme toggle (right) */
.tr-auth-card-controls{
  display:flex;justify-content:space-between;align-items:center;
  gap:8px;margin-bottom:10px;
}
.tr-auth-back, .tr-auth-themebtn{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 12px;
  background: var(--ta-ghost-bg);
  border:1px solid var(--ta-ghost-border);
  color: var(--ta-ghost-fg);
  border-radius:8px;
  font-size:13px;font-weight:500;
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-auth-back:hover, .tr-auth-themebtn:hover{
  background: var(--ta-ghost-bg-hover);
  border-color: var(--ta-accent);
  color: var(--ta-accent);
}
.tr-auth-themebtn{width:34px;height:34px;padding:0;justify-content:center;flex-shrink:0}
.tr-auth-themebtn svg{width:16px;height:16px}

/* Main split-screen layout — fits 100vh, no scroll
   Form column is sized to fit the card (~460px) so the brand panel
   naturally expands to fill all remaining horizontal space — no
   empty gap on either side of the card. */
.tr-auth-shell{
  position:relative;z-index:2;
  display:grid;grid-template-columns:minmax(0,1fr) 460px;
  width:100%;height:100vh;height:100dvh;
}
@media (max-width: 1280px){
  .tr-auth-shell{grid-template-columns:minmax(0,1fr) 440px}
}
@media (max-width: 980px){
  .tr-auth-shell{grid-template-columns:1fr;height:100vh;height:100dvh}
  .tr-auth-brand{display:none}
  .tr-auth-formpanel{padding:12px 14px}
}

/* Belt-and-braces: hide any residual scrollbars on the auth root */
.tr-auth-root, .tr-auth-root *{scrollbar-width:none;-ms-overflow-style:none}
.tr-auth-root *::-webkit-scrollbar{width:0;height:0;display:none}

/* ── LEFT: Brand panel ── */
.tr-auth-brand{
  padding:28px clamp(48px, 6vw, 96px) 24px;
  display:flex;flex-direction:column;justify-content:space-between;gap:14px;
  height:100%;min-width:0;min-height:0;
  overflow:hidden;
  position:relative;
}
.tr-auth-brand::after{
  content:"";position:absolute;top:0;right:0;bottom:0;width:1px;
  background:linear-gradient(180deg,transparent 0%, var(--ta-card-divider) 30%, var(--ta-card-divider) 70%, transparent 100%);
  pointer-events:none;
}
.tr-auth-wordmark{
  font-family:'Bricolage Grotesque',sans-serif;
  font-weight:700;font-size:20px;letter-spacing:-.5px;
  color: var(--ta-fg-strong); display:inline-flex; align-items:center; gap:10px;
}
.tr-auth-bolt{
  width:30px;height:30px;display:grid;place-items:center;
  position:relative;
  color: var(--ta-accent-soft);
  filter:drop-shadow(0 0 8px var(--ta-accent-glow));
}
.tr-auth-bolt svg{width:22px;height:21px;display:block}
.tr-auth-bolt::before{
  content:"";position:absolute;inset:-4px;border-radius:50%;
  background:radial-gradient(circle, var(--ta-accent-glow) 0%, transparent 70%);
  z-index:-1;
}
.tr-auth-hero{margin-top:0;flex:1;display:flex;flex-direction:column;min-height:0;justify-content:center}
.tr-auth-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'JetBrains Mono',monospace;
  font-size:10.5px;font-weight:500;letter-spacing:2px;text-transform:uppercase;
  color: var(--ta-accent);
  padding:5px 11px;
  background: var(--ta-accent-tint);
  border:1px solid var(--ta-accent-tint-2);
  border-radius:100px;
  margin-bottom:12px;
  align-self:flex-start;
}
.tr-auth-eyebrow-dot{width:6px;height:6px;border-radius:50%;background: var(--ta-accent); animation:tr-pulse 2s ease-in-out infinite}
@keyframes tr-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}

.tr-auth-headline{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(26px,2.7vw,38px);
  font-weight:600;line-height:1.05;letter-spacing:-1px;
  color: var(--ta-fg-strong); margin-bottom:10px;
}
.tr-auth-headline-accent{
  background:linear-gradient(120deg, var(--ta-accent-soft) 0%, var(--ta-accent) 60%, var(--ta-accent-strong) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  font-style:italic;
}
.tr-auth-sub{
  color: var(--ta-fg-muted); font-size:14px; line-height:1.55; max-width:560px;
  margin-bottom:16px;
}

/* Feature pills */
.tr-auth-features{display:flex;flex-direction:column;gap:8px}
.tr-auth-feature{
  display:flex;align-items:center;gap:11px;
  padding:9px 12px;
  background: var(--ta-card-bg);
  border:1px solid var(--ta-card-border);
  border-radius:10px;
  transition:all .25s ease;
}
.tr-auth-feature:hover{
  background: var(--ta-input-bg-hover);
  border-color: var(--ta-accent-tint-2);
  transform:translateX(4px);
}
.tr-auth-feature-icon{
  width:30px;height:30px;flex-shrink:0;
  display:grid;place-items:center;
  background: var(--ta-accent-tint);
  border:1px solid var(--ta-accent-tint-2);
  border-radius:8px;color: var(--ta-accent);
}
.tr-auth-feature-icon svg{width:15px;height:15px}
.tr-auth-feature-text{font-size:13px;color: var(--ta-fg); font-weight:600;line-height:1.3}
.tr-auth-feature-sub{font-size:11.5px;color: var(--ta-fg-dim); margin-top:2px}

/* Brand footer stats */
.tr-auth-stats{
  display:flex;gap:24px;padding-top:12px;
  border-top:1px solid var(--ta-divider);
}
.tr-auth-stat-num{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:20px;font-weight:700;color: var(--ta-fg-strong); letter-spacing:-.5px;line-height:1;
}
.tr-auth-stat-lbl{font-size:10.5px;color: var(--ta-fg-dim); text-transform:uppercase;letter-spacing:1.5px;margin-top:3px}

/* ── RIGHT: Form panel ── */
.tr-auth-formpanel{
  padding:18px 22px;
  display:flex;align-items:center;justify-content:center;
  height:100%;min-width:0;min-height:0;
  overflow:hidden;
}
.tr-auth-card{
  width:100%;max-width:400px;
  padding:16px 22px 18px;
  background: var(--ta-card-bg);
  border:1px solid var(--ta-card-border);
  border-radius:16px;
  box-shadow: var(--ta-card-shadow);
  position:relative;
  animation:tr-fade-up .55s cubic-bezier(.16,1,.3,1) both;
  transition: background .35s ease, border-color .35s ease;
}
.tr-auth-root[data-theme="dark"] .tr-auth-card{
  backdrop-filter:blur(24px) saturate(140%);
  -webkit-backdrop-filter:blur(24px) saturate(140%);
}
.tr-auth-card::before{
  content:"";position:absolute;inset:-1px;border-radius:16px;padding:1px;
  background:linear-gradient(135deg, var(--ta-accent-tint-2), transparent 40%, transparent 60%, var(--ta-accent-glow));
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  pointer-events:none;
}
@keyframes tr-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* Step header */
.tr-auth-step-label{
  font-family:'JetBrains Mono',monospace;
  font-size:10.5px;letter-spacing:2.5px;text-transform:uppercase;
  color: var(--ta-accent);
  margin-bottom:3px;
  text-align:center;
}
.tr-auth-title{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:20px;font-weight:600;letter-spacing:-.5px;line-height:1.2;
  color: var(--ta-fg-strong); margin-bottom:3px; text-align:center;
}
.tr-auth-desc{font-size:12.5px;color: var(--ta-fg-muted); line-height:1.4; margin-bottom:10px; text-align:center}

/* Login / Signup toggle */
.tr-auth-toggle{
  display:grid;grid-template-columns:1fr 1fr;gap:4px;
  padding:3px;
  background: var(--ta-toggle-bg);
  border:1px solid var(--ta-toggle-border);
  border-radius:10px;
  margin-bottom:10px;
}
.tr-auth-toggle-btn{
  padding:7px 14px;
  background:transparent;
  color: var(--ta-toggle-btn-fg);
  border:none;
  border-radius:7px;
  font-size:13px;font-weight:600;letter-spacing:.2px;
  cursor:pointer;font-family:inherit;
  transition:all .25s cubic-bezier(.4,0,.2,1);
}
.tr-auth-toggle-btn:hover{color: var(--ta-accent)}
.tr-auth-toggle-btn.active{
  background:linear-gradient(135deg, var(--ta-accent) 0%, var(--ta-accent-strong) 100%);
  color:#fff;
  box-shadow:0 6px 16px var(--ta-accent-glow), 0 1px 0 rgba(255,255,255,.18) inset;
}

/* Inputs */
.tr-auth-field{margin-bottom:8px;position:relative}
.tr-auth-label{
  display:block;
  font-size:11.5px;font-weight:600;
  color: var(--ta-fg-muted); margin-bottom:3px; letter-spacing:.2px;
}
.tr-auth-input{
  width:100%;
  padding:9px 12px;
  background: var(--ta-input-bg);
  border:1px solid var(--ta-input-border);
  border-radius:9px;
  color: var(--ta-input-fg);
  font-size:14px;font-family:inherit;
  transition:all .2s ease;
  outline:none;
}
.tr-auth-input::placeholder{color: var(--ta-input-placeholder)}
.tr-auth-input:hover{border-color: var(--ta-input-border-hover); background: var(--ta-input-bg-hover)}
.tr-auth-input:focus{
  border-color: var(--ta-accent);
  background: var(--ta-input-bg);
  box-shadow:0 0 0 3px var(--ta-input-focus-glow);
}
.tr-auth-input.with-eye{padding-right:40px}

.tr-auth-eye{
  position:absolute;right:6px;top:50%;transform:translateY(-50%);
  width:30px;height:30px;
  display:grid;place-items:center;
  background:transparent;border:none;cursor:pointer;
  color: var(--ta-fg-dim); border-radius:7px;
  transition:all .15s ease;
}
.tr-auth-eye:hover{color: var(--ta-accent); background: var(--ta-accent-tint)}
.tr-auth-eye-wrap{position:relative}
.tr-auth-eye svg{width:17px;height:17px}

/* OTP input — monospace + spaced */
.tr-auth-otp{
  text-align:center;font-family:'JetBrains Mono',monospace;
  font-size:18px;letter-spacing:8px;font-weight:500;
  padding:12px 13px;
}

/* Checkbox */
.tr-auth-checkbox{
  display:flex;align-items:flex-start;gap:8px;
  font-size:12px;color: var(--ta-fg-muted); line-height:1.4; cursor:pointer;
  margin-bottom:8px;
}
.tr-auth-checkbox input{
  width:15px;height:15px;flex-shrink:0;margin-top:1px;
  accent-color: var(--ta-accent); cursor:pointer;
}
.tr-auth-checkbox a, .tr-auth-checkbox-link{color: var(--ta-accent); text-decoration:none; font-weight:600; cursor:pointer}
.tr-auth-checkbox a:hover, .tr-auth-checkbox-link:hover{color: var(--ta-accent-strong); text-decoration:underline}

/* Forgot link */
.tr-auth-forgot{
  display:flex;justify-content:flex-end;margin-bottom:6px;
}
.tr-auth-forgot-link{
  font-size:13px;color: var(--ta-accent); cursor:pointer; font-weight:600;
  transition:color .15s ease;
}
.tr-auth-forgot-link:hover{color: var(--ta-accent-strong)}

/* Buttons */
.tr-auth-btn{
  width:100%;
  padding:10px 16px;
  border-radius:10px;
  font-size:14px;font-weight:600;letter-spacing:.2px;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  font-family:inherit;
}
.tr-auth-btn-primary{
  background:linear-gradient(135deg, var(--ta-accent-soft) 0%, var(--ta-accent) 50%, var(--ta-accent-strong) 100%);
  color:#fff;
  border:1px solid rgba(255,255,255,.10);
  box-shadow: 0 8px 20px var(--ta-accent-glow), 0 1px 0 rgba(255,255,255,.22) inset;
}
.tr-auth-btn-primary:hover{
  transform:translateY(-1px);
  box-shadow:0 12px 28px var(--ta-accent-glow), 0 1px 0 rgba(255,255,255,.25) inset;
}
.tr-auth-btn-primary:active{transform:translateY(0)}
.tr-auth-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}

.tr-auth-btn-ghost{
  background: var(--ta-ghost-bg);
  color: var(--ta-ghost-fg);
  border:1px solid var(--ta-ghost-border);
}
.tr-auth-btn-ghost:hover{background: var(--ta-ghost-bg-hover); border-color: var(--ta-accent); color: var(--ta-accent)}

.tr-auth-btn-text{
  width:100%;padding:8px;background:transparent;border:none;
  color: var(--ta-fg-muted); font-size:13px; cursor:pointer; font-family:inherit;
  transition:color .15s ease;
}
.tr-auth-btn-text:hover{color: var(--ta-accent)}

/* OAuth divider */
.tr-auth-divider{
  display:flex;align-items:center;gap:11px;
  margin:8px 0;
  font-size:11px;color: var(--ta-fg-dim);
  text-transform:uppercase;letter-spacing:1.8px;
}
.tr-auth-divider::before,.tr-auth-divider::after{
  content:"";flex:1;height:1px;background: var(--ta-divider);
}

/* OAuth buttons grid */
.tr-auth-oauth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px}
.tr-auth-oauth-btn{
  padding:8px 12px;
  background: var(--ta-ghost-bg);
  border:1px solid var(--ta-ghost-border);
  border-radius:9px;
  color: var(--ta-fg); font-size:13px; font-weight:500;
  display:flex;align-items:center;justify-content:center;gap:8px;
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-auth-oauth-btn:hover{background: var(--ta-ghost-bg-hover); border-color: var(--ta-accent); transform:translateY(-1px)}

/* Switch login/signup at bottom */
.tr-auth-switch{
  text-align:center;font-size:13px;color: var(--ta-fg-muted); margin-top:0;
}
.tr-auth-switch-link{
  color: var(--ta-accent); cursor:pointer; font-weight:700;
  background:none;border:none;padding:0;font-family:inherit;font-size:inherit;
}
.tr-auth-switch-link:hover{color: var(--ta-accent-strong); text-decoration:underline}

/* Alerts */
.tr-auth-alert{
  padding:9px 12px;border-radius:8px;
  font-size:13px;line-height:1.4;
  margin-bottom:10px;
  display:flex;align-items:flex-start;gap:8px;
  border:1px solid;
}
.tr-auth-alert-error{
  background: var(--ta-alert-error-bg);
  border-color: var(--ta-alert-error-border);
  color: var(--ta-alert-error-fg);
}
.tr-auth-alert-success{
  background: var(--ta-alert-success-bg);
  border-color: var(--ta-alert-success-border);
  color: var(--ta-alert-success-fg);
}
.tr-auth-alert-icon{flex-shrink:0;margin-top:1px}

/* Detect step — choice cards */
.tr-auth-emoji{font-size:60px;text-align:center;margin-bottom:10px;line-height:1;
  filter:drop-shadow(0 4px 14px var(--ta-accent-glow));}
.tr-auth-choices{display:flex;flex-direction:column;gap:10px}

/* Role select grid */
.tr-auth-roles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tr-auth-role{
  padding:14px;text-align:left;
  background: var(--ta-ghost-bg);
  border:1px solid var(--ta-ghost-border);
  border-radius:11px;
  cursor:pointer;font-family:inherit;color: var(--ta-fg);
  transition:all .2s ease;
  display:flex;flex-direction:column;gap:8px;
}
.tr-auth-role:hover{background: var(--ta-accent-tint); border-color: var(--ta-accent); transform:translateY(-1px)}
.tr-auth-role-icon{font-size:22px}
.tr-auth-role-name{font-size:13px;font-weight:600}

/* Reset done — celebration */
.tr-auth-celebrate{font-size:60px;text-align:center;line-height:1;margin-bottom:12px;
  animation:tr-celebrate 1.2s cubic-bezier(.34,1.56,.64,1) both;}
@keyframes tr-celebrate{from{transform:scale(0) rotate(-12deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}

/* Spinner */
.tr-auth-spinner{
  width:16px;height:16px;border-radius:50%;
  border:2px solid rgba(255,255,255,.30);
  border-top-color:#fff;
  animation:tr-spin .7s linear infinite;
}
@keyframes tr-spin{to{transform:rotate(360deg)}}

/* Select (company size) */
.tr-auth-select{
  width:100%;
  padding:11px 14px;
  background: var(--ta-input-bg);
  border:1px solid var(--ta-input-border);
  border-radius:10px;
  color: var(--ta-input-fg); font-size:14px; font-family:inherit;
  outline:none;cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237c3aed' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 14px center;
  padding-right:36px;
}
.tr-auth-select option{background: var(--ta-card-bg); color: var(--ta-fg)}
.tr-auth-select:focus{border-color: var(--ta-accent); box-shadow:0 0 0 3px var(--ta-input-focus-glow)}

/* Override password strength colors when nested inside auth card */
.tr-auth-card .pwd-strength, .tr-auth-card .password-strength{margin-bottom:8px}
/* Compress the global PasswordStrength component when nested in the auth card */
.tr-auth-card .strength-bar{height:4px !important;border-radius:3px;overflow:hidden}
.tr-auth-card > div > div[style*="marginBottom"]{margin-bottom:7px !important}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — mobile (≤640px) and small phones (≤420px)
   The 980px breakpoint above already collapses to single column.
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 640px){
  .tr-auth-formpanel{padding:10px 12px}
  .tr-auth-card{padding:18px 18px;border-radius:14px;max-width:100%}
  .tr-auth-card-controls{margin-bottom:12px}
  .tr-auth-card-controls .tr-auth-back{padding:6px 10px;font-size:12px}
  .tr-auth-themebtn{width:32px;height:32px}
  .tr-auth-themebtn svg{width:14px;height:14px}

  .tr-auth-step-label{font-size:10.5px;letter-spacing:2px}
  .tr-auth-title{font-size:19px;margin-bottom:4px}
  .tr-auth-desc{font-size:12.5px;margin-bottom:10px}

  .tr-auth-toggle{margin-bottom:11px}
  .tr-auth-toggle-btn{padding:7px 10px;font-size:12.5px}

  .tr-auth-field{margin-bottom:9px}
  .tr-auth-label{font-size:11.5px}
  .tr-auth-input{padding:9px 12px;font-size:13.5px}

  .tr-auth-btn{padding:10px 14px;font-size:13.5px}
  .tr-auth-checkbox{font-size:12px}
  .tr-auth-divider{margin:9px 0;font-size:10.5px;letter-spacing:1.4px}

  /* OAuth still 2-col but tighter */
  .tr-auth-oauth-btn{padding:8px 10px;font-size:12.5px}

  .tr-auth-switch{font-size:12.5px}

  /* Hide grain on mobile (perf + clarity) */
  .tr-auth-grain{display:none}
}

/* Small phones (≤420px) — OAuth stacks vertically, tighter everything */
@media (max-width: 420px){
  .tr-auth-formpanel{padding:8px 10px}
  .tr-auth-card{padding:16px 16px;border-radius:12px}
  .tr-auth-title{font-size:18px}
  .tr-auth-oauth{grid-template-columns:1fr;gap:7px}
  .tr-auth-eye{width:28px;height:28px;right:4px}
  .tr-auth-eye svg{width:15px;height:15px}
}
`;

// ── Tiny inline SVG icons (no external deps) ──
// BoltLogo is the actual ThreatReady mark (clean path from favicon.svg).
const BoltLogo = ({ size = 24 }) => (
  <svg width={size} height={size * (46 / 48)} viewBox="0 0 48 46" fill="none" aria-hidden="true">
    <path
      d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      fill="url(#tr-bolt-grad)"
    />
    <defs>
      <linearGradient id="tr-bolt-grad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c4b5fd" />
        <stop offset="55%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  </svg>
);

const Icon = {
  Shield: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Sparkle: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  Bolt: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  Eye: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Back: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Alert: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function AuthView({
  // ── STATE ──
  authMode,
  authStep,
  authEmail,
  authPassword,
  authName,
  authError,
  agreeTerms,
  showAuthPassword,
  showNewPassword,
  isAuthenticating,
  otpCode,
  otpError,
  forgotEmail,
  forgotCode,
  newPassword,
  forgotLoading,
  forgotMsg,
  userType,
  hrModalCompanyName,
  hrModalTeamSize,
  HR_PRICING,
  // ── SETTERS ──
  setAuthMode,
  setAuthStep,
  setAuthEmail,
  setAuthPassword,
  setAuthName,
  setAuthError,
  setAgreeTerms,
  setShowAuthPassword,
  setShowNewPassword,
  setOtpCode,
  setOtpError,
  setForgotEmail,
  setForgotCode,
  setNewPassword,
  setForgotLoading,
  setForgotMsg,
  setHrModalCompanyName,
  setHrModalTeamSize,
  setView,
  // ── HANDLERS ──
  handleAuth,
  verifyEmail,
  confirmUserType,
  confirmCompanyInfo,
  startScenario,
  goBack,
}) {
  const isLogin = authMode === "login";
  const successMsg = (typeof forgotMsg === "string" && forgotMsg.includes("✅"));

  // ── Theme state: light by default (Sign In page is white+purple), persisted to localStorage ──
  const [authTheme, setAuthTheme] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cyberprep_theme") : null;
      return saved === "dark" ? "dark" : "light";
    } catch (_) { return "light"; }
  });
  useEffect(() => {
    try { localStorage.setItem("cyberprep_theme", authTheme); } catch (_) {}
  }, [authTheme]);

  // ── Lock body/html scroll while AuthView is mounted (single-screen layout) ──
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight:   html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight:   body.style.height,
      bodyMargin:   body.style.margin,
    };
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.margin = "0";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      body.style.margin = prev.bodyMargin;
    };
  }, []);
  const toggleAuthTheme = () => setAuthTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="app">
      <style>{CSS}</style>
      <style>{AUTH_CSS}</style>
      <ToastContainer />

      <div className="tr-auth-root" data-theme={authTheme}>
        {/* Atmospheric background */}
        <div className="tr-auth-bg" aria-hidden="true">
          <div className="tr-auth-orb o1" />
          <div className="tr-auth-orb o2" />
          <div className="tr-auth-orb o3" />
          <div className="tr-auth-grid" />
          <div className="tr-auth-grain" />
        </div>

        <div className="tr-auth-shell">

          {/* ═══ LEFT: BRAND PANEL ═══ */}
          <div className="tr-auth-brand">
            <div className="tr-auth-wordmark">
              <span className="tr-auth-bolt"><BoltLogo size={24} /></span>
              ThreatReady
            </div>

            <div className="tr-auth-hero">
              <div className="tr-auth-eyebrow">
                <span className="tr-auth-eyebrow-dot" />
                AI-powered cybersecurity prep
              </div>
              <h1 className="tr-auth-headline">
                Train like an attacker.<br />
                Hire <span className="tr-auth-headline-accent">with confidence.</span>
              </h1>
              <p className="tr-auth-sub">
                Real attack scenarios. Adaptive AI panel interviews. Transparent scoring across
                technical reasoning, communication, and decision-making — built for security teams that care about depth.
              </p>

              <div className="tr-auth-features">
                <div className="tr-auth-feature">
                  <div className="tr-auth-feature-icon">{Icon.Shield(18)}</div>
                  <div>
                    <div className="tr-auth-feature-text">12 security domains, 4 difficulty tiers</div>
                    <div className="tr-auth-feature-sub">From SOC analyst to red team lead</div>
                  </div>
                </div>
                <div className="tr-auth-feature">
                  <div className="tr-auth-feature-icon">{Icon.Sparkle(18)}</div>
                  <div>
                    <div className="tr-auth-feature-text">6-person AI interview panel</div>
                    <div className="tr-auth-feature-sub">Adaptive questions, real-time feedback</div>
                  </div>
                </div>
                <div className="tr-auth-feature">
                  <div className="tr-auth-feature-icon">{Icon.Bolt(18)}</div>
                  <div>
                    <div className="tr-auth-feature-text">Detailed reports in minutes</div>
                    <div className="tr-auth-feature-sub">Strengths · gaps · MITRE ATT&amp;CK refs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tr-auth-stats">
              <div>
                <div className="tr-auth-stat-num">12+</div>
                <div className="tr-auth-stat-lbl">Security Roles</div>
              </div>
              <div>
                <div className="tr-auth-stat-num">30m</div>
                <div className="tr-auth-stat-lbl">Per Assessment</div>
              </div>
              <div>
                <div className="tr-auth-stat-num">AI</div>
                <div className="tr-auth-stat-lbl">Adaptive Scoring</div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT: FORM PANEL ═══ */}
          <div className="tr-auth-formpanel">
            <div className="tr-auth-card">

              {/* In-card controls — Back + theme toggle (replaces the old fixed top-right block) */}
              <div className="tr-auth-card-controls">
                <button
                  className="tr-auth-back tr-auth-back-incard"
                  onClick={goBack}
                  type="button"
                >
                  {Icon.Back()} Back
                </button>
                <button
                  className="tr-auth-themebtn"
                  onClick={toggleAuthTheme}
                  type="button"
                  aria-label={authTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  title={authTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {authTheme === "dark" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                </button>
              </div>

              {/* ───────── STEP: form (login / signup) ───────── */}
              {authStep === "form" && (
                <>
                  <div className="tr-auth-toggle" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isLogin}
                      className={"tr-auth-toggle-btn " + (isLogin ? "active" : "")}
                      onClick={() => setAuthMode("login")}
                    >Sign In</button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isLogin}
                      className={"tr-auth-toggle-btn " + (!isLogin ? "active" : "")}
                      onClick={() => setAuthMode("signup")}
                    >Create Account</button>
                  </div>

                  <div className="tr-auth-step-label">{isLogin ? "Welcome back" : "Get started"}</div>
                  <h2 className="tr-auth-title">{isLogin ? "Sign in to your account" : "Create your free account"}</h2>
                  <p className="tr-auth-desc">
                    {isLogin
                      ? "Continue your security prep journey."
                      : "2 free attempts · No credit card required"}
                  </p>

                  {authError && (
                    <div className={"tr-auth-alert " + (authError.startsWith("✅") ? "tr-auth-alert-success" : "tr-auth-alert-error")}>
                      <span className="tr-auth-alert-icon">{authError.startsWith("✅") ? Icon.Check(16) : Icon.Alert(16)}</span>
                      <span>{authError.replace(/^✅\s*/, "")}</span>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="tr-auth-field">
                      <label className="tr-auth-label">Full name</label>
                      <input
                        className="tr-auth-input"
                        placeholder="Your name"
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">Email</label>
                    <input
                      className="tr-auth-input"
                      placeholder="you@example.com"
                      type="email"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                    />
                  </div>

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">Password</label>
                    <div className="tr-auth-eye-wrap">
                      <input
                        className="tr-auth-input with-eye"
                        placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                        type={showAuthPassword ? "text" : "password"}
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="tr-auth-eye"
                        onClick={() => setShowAuthPassword(p => !p)}
                        aria-label={showAuthPassword ? "Hide password" : "Show password"}
                      >
                        {showAuthPassword ? Icon.EyeOff() : Icon.Eye()}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div style={{ marginTop: -4 }}>
                      <PasswordStrength password={authPassword} />
                    </div>
                  )}

                  {!isLogin && (
                    <label className="tr-auth-checkbox">
                      <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                      <span>
                        I agree to the{" "}
                        <span className="tr-auth-checkbox-link">Terms of Service</span>{" "}
                        and{" "}
                        <span className="tr-auth-checkbox-link">Privacy Policy</span>
                      </span>
                    </label>
                  )}

                  {isLogin && (
                    <div className="tr-auth-forgot">
                      <span
                        className="tr-auth-forgot-link"
                        onClick={() => { setAuthStep("forgot"); setForgotEmail(authEmail || ""); setForgotMsg(""); }}
                      >Forgot password?</span>
                    </div>
                  )}

                  <button
                    className="tr-auth-btn tr-auth-btn-primary"
                    onClick={handleAuth}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <span className="tr-auth-spinner" />
                        {isLogin ? "Signing in…" : "Creating account…"}
                      </>
                    ) : (
                      isLogin ? "Sign In" : "Create Account"
                    )}
                  </button>

                  <div className="tr-auth-divider">or continue with</div>

                  <div className="tr-auth-oauth">
                    <button
                      type="button"
                      className="tr-auth-oauth-btn"
                      onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/google"}
                    >
                      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="tr-auth-oauth-btn"
                      onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/github?prompt=login"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#e8e6f5" aria-hidden="true">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                      GitHub
                    </button>
                  </div>

                  <div className="tr-auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      className="tr-auth-switch-link"
                      onClick={() => setAuthMode(isLogin ? "signup" : "login")}
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </div>
                </>
              )}

              {/* ───────── STEP: verify (OTP) ───────── */}
              {authStep === "verify" && (
                <>
                  <div className="tr-auth-step-label">Verify email</div>
                  <h2 className="tr-auth-title">Check your inbox</h2>
                  <p className="tr-auth-desc">
                    We sent a 6-digit code to <strong style={{ color: "#c4b5fd" }}>{authEmail}</strong>
                  </p>

                  {otpError && (
                    <div className="tr-auth-alert tr-auth-alert-error">
                      <span className="tr-auth-alert-icon">{Icon.Alert(16)}</span>
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="tr-auth-field">
                    <input
                      className="tr-auth-input tr-auth-otp"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>

                  <button
                    className="tr-auth-btn tr-auth-btn-primary"
                    style={{ marginBottom: 10 }}
                    onClick={async () => {
                      if (otpCode.length !== 6) { setOtpError("Please enter 6-digit code"); return; }
                      try {
                        const res = await fetch("https://threatready-db.onrender.com/api/auth/verify-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: authEmail, otp: otpCode })
                        });
                        const data = await res.json();
                        if (!res.ok) { setOtpError(data.error || "Invalid code"); return; }

                        setAuthStep("form");
                        setAuthMode("login");
                        setOtpCode("");
                        setAuthError("✅ Email verified! Please sign in.");
                      } catch (e) { setOtpError("Network error"); }
                    }}
                  >
                    Verify Email
                  </button>
                  <button
                    className="tr-auth-btn tr-auth-btn-ghost"
                    onClick={async () => {
                      try {
                        await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: authEmail })
                        });
                      } catch (e) { }
                    }}
                  >
                    Resend code
                  </button>
                </>
              )}

              {/* ───────── STEP: detect (B2C/B2B) ───────── */}
              {authStep === "detect" && (
                <>
                  <div className="tr-auth-emoji">{userType === "b2b" ? "🏢" : "👤"}</div>
                  <h2 className="tr-auth-title" style={{ textAlign: "center" }}>
                    {userType === "b2b" ? "Looks like you're hiring" : "Ready to prepare?"}
                  </h2>
                  <p className="tr-auth-desc" style={{ textAlign: "center" }}>
                    {userType === "b2b"
                      ? "Your work email suggests you're at a company. Are you here to assess candidates?"
                      : "Are you preparing for security interviews?"}
                  </p>

                  <div className="tr-auth-choices">
                    <button className="tr-auth-btn tr-auth-btn-primary" onClick={() => confirmUserType(userType)}>
                      {userType === "b2b" ? "Yes, I'm Hiring / Assessing →" : "Yes, I'm Preparing →"}
                    </button>
                    <button className="tr-auth-btn tr-auth-btn-ghost" onClick={() => confirmUserType(userType === "b2b" ? "b2c" : "b2b")}>
                      {userType === "b2b" ? "Actually, I'm a candidate preparing" : "Actually, I'm hiring / assessing"}
                    </button>
                  </div>
                </>
              )}

              {/* ───────── STEP: company-info ───────── */}
              {authStep === "company-info" && (
                <>
                  <div className="tr-auth-step-label">Company details</div>
                  <h2 className="tr-auth-title">Tell us about your company</h2>
                  <p className="tr-auth-desc">This helps us set up your hiring dashboard.</p>

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">Company name</label>
                    <input
                      className="tr-auth-input"
                      placeholder="Acme Security Inc."
                      value={hrModalCompanyName}
                      onChange={e => setHrModalCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="tr-auth-field">
                    <label className="tr-auth-label">Team size</label>
                    <select
                      className="tr-auth-select"
                      value={hrModalTeamSize}
                      onChange={e => setHrModalTeamSize(e.target.value)}
                    >
                      {Object.entries(HR_PRICING).map(([key, v]) => (
                        <option key={key} value={key}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <button className="tr-auth-btn tr-auth-btn-primary" onClick={confirmCompanyInfo}>
                    Continue →
                  </button>
                </>
              )}

              {/* ───────── STEP: roleselect ───────── */}
              {authStep === "roleselect" && (
                <>
                  <div className="tr-auth-step-label">Quick start</div>
                  <h2 className="tr-auth-title">Pick your first role</h2>
                  <p className="tr-auth-desc">You can change this later.</p>
                  <div className="tr-auth-roles">
                    {ROLES.slice(0, 6).map(r => (
                      <button
                        key={r.id}
                        className="tr-auth-role"
                        onClick={() => {
                          const scs = SCENARIOS[r.id];
                          if (scs?.length) { startScenario(scs[0], "beginner"); }
                        }}
                      >
                        <span className="tr-auth-role-icon">{r.icon}</span>
                        <span className="tr-auth-role-name">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ───────── STEP: forgot ───────── */}
              {authStep === "forgot" && (
                <>
                  <div className="tr-auth-step-label">Reset password</div>
                  <h2 className="tr-auth-title">Forgot your password?</h2>
                  <p className="tr-auth-desc">Enter your email to receive a reset code.</p>

                  {forgotMsg && (
                    <div className={"tr-auth-alert " + (successMsg ? "tr-auth-alert-success" : "tr-auth-alert-error")}>
                      <span className="tr-auth-alert-icon">{successMsg ? Icon.Check(16) : Icon.Alert(16)}</span>
                      <span>{forgotMsg.replace(/^✅\s*/, "")}</span>
                    </div>
                  )}

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">Email</label>
                    <input
                      className="tr-auth-input"
                      placeholder="you@example.com"
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !forgotLoading && document.getElementById("forgot-send-btn").click()}
                    />
                  </div>

                  <button
                    id="forgot-send-btn"
                    className="tr-auth-btn tr-auth-btn-primary"
                    style={{ marginBottom: 10 }}
                    disabled={forgotLoading}
                    onClick={async () => {
                      if (!forgotEmail.trim()) { setForgotMsg("Please enter your email"); return; }
                      setForgotLoading(true); setForgotMsg("");
                      try {
                        const res = await fetch("https://threatready-db.onrender.com/api/auth/forgot-password", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: forgotEmail.trim() })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setForgotMsg("✅ Reset code sent! Check your email.");
                          setTimeout(() => { setAuthStep("resetcode"); setForgotMsg(""); }, 1500);
                        } else {
                          setForgotMsg(data.error || "Failed to send code");
                        }
                      } catch (e) { setForgotMsg("Network error"); }
                      setForgotLoading(false);
                    }}
                  >
                    {forgotLoading ? (<><span className="tr-auth-spinner" />Sending…</>) : "Send reset code"}
                  </button>
                  <button
                    className="tr-auth-btn tr-auth-btn-ghost"
                    onClick={() => { setAuthStep("form"); setForgotMsg(""); }}
                  >
                    ← Back to Sign In
                  </button>
                </>
              )}

              {/* ───────── STEP: resetcode ───────── */}
              {authStep === "resetcode" && (
                <>
                  <div className="tr-auth-step-label">Reset password</div>
                  <h2 className="tr-auth-title">Enter code &amp; new password</h2>
                  <p className="tr-auth-desc">
                    Code sent to <strong style={{ color: "#c4b5fd" }}>{forgotEmail}</strong>
                  </p>

                  {forgotMsg && (
                    <div className={"tr-auth-alert " + (successMsg ? "tr-auth-alert-success" : "tr-auth-alert-error")}>
                      <span className="tr-auth-alert-icon">{successMsg ? Icon.Check(16) : Icon.Alert(16)}</span>
                      <span>{forgotMsg.replace(/^✅\s*/, "")}</span>
                    </div>
                  )}

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">6-digit code</label>
                    <input
                      className="tr-auth-input tr-auth-otp"
                      placeholder="••••••"
                      value={forgotCode}
                      onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="tr-auth-field">
                    <label className="tr-auth-label">New password</label>
                    <div className="tr-auth-eye-wrap">
                      <input
                        className="tr-auth-input with-eye"
                        placeholder="At least 8 characters"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="tr-auth-eye"
                        onClick={() => setShowNewPassword(p => !p)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? Icon.EyeOff() : Icon.Eye()}
                      </button>
                    </div>
                  </div>

                  <PasswordStrength password={newPassword} />

                  <button
                    className="tr-auth-btn tr-auth-btn-primary"
                    style={{ marginBottom: 10 }}
                    disabled={forgotLoading}
                    onClick={async () => {
                      if (forgotCode.length !== 6) { setForgotMsg("Enter 6-digit code"); return; }
                      if (newPassword.length < 8) { setForgotMsg("Password min 8 characters"); return; }
                      setForgotLoading(true); setForgotMsg("");
                      try {
                        const res = await fetch("https://threatready-db.onrender.com/api/auth/reset-password", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: forgotEmail, code: forgotCode, new_password: newPassword })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setForgotMsg("✅ Password reset! You can now sign in.");
                          setTimeout(() => setAuthStep("resetdone"), 1200);
                        } else {
                          setForgotMsg(data.error || "Reset failed");
                        }
                      } catch (e) { setForgotMsg("Network error"); }
                      setForgotLoading(false);
                    }}
                  >
                    {forgotLoading ? (<><span className="tr-auth-spinner" />Resetting…</>) : "Reset password"}
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <button type="button" className="tr-auth-btn-text" style={{ width: "auto", padding: 0, color: "#c4b5fd" }} onClick={() => setAuthStep("forgot")}>
                      ← Resend code
                    </button>
                    <button type="button" className="tr-auth-btn-text" style={{ width: "auto", padding: 0 }} onClick={() => { setAuthStep("form"); setForgotMsg(""); }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* ───────── STEP: resetdone ───────── */}
              {authStep === "resetdone" && (
                <>
                  <div className="tr-auth-celebrate">🎉</div>
                  <h2 className="tr-auth-title" style={{ textAlign: "center" }}>Password reset!</h2>
                  <p className="tr-auth-desc" style={{ textAlign: "center" }}>
                    Your password has been changed successfully. You can now sign in with your new password.
                  </p>
                  <button
                    className="tr-auth-btn tr-auth-btn-primary"
                    onClick={() => {
                      setAuthStep("form");
                      setAuthMode("login");
                      setAuthPassword("");
                      setForgotMsg("");
                      setAuthError("");
                    }}
                  >
                    Sign In →
                  </button>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
