// ═══════════════════════════════════════════════════════════════
// AUTH VIEW — REDESIGNED (Login / Signup + email verify + B2C/B2B + forgot flow)
// 8 sub-states preserved: form · verify · detect · company-info · roleselect ·
//                          forgot · resetcode · resetdone
// All props, handlers, OAuth, PasswordStrength left untouched — visual layer only.
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES, SCENARIOS } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";

// ── Scoped CSS (prefix tr-auth- so it can't leak into other pages) ──
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap');

.tr-auth-root{
  position:fixed;inset:0;min-height:100vh;width:100%;
  background:#0a0618;
  color:#e8e6f5;
  font-family:'Inter','Segoe UI',system-ui,sans-serif;
  overflow:hidden;
  z-index:1;
}

/* Atmospheric background — sits behind everything */
.tr-auth-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.tr-auth-bg::before{
  content:"";position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(124,58,237,.22) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(139,92,246,.18) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(67,56,202,.14) 0%, transparent 70%),
    linear-gradient(180deg, #0a0618 0%, #0d0820 50%, #0a0618 100%);
}
/* Floating orbs */
.tr-auth-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.6;will-change:transform}
.tr-auth-orb.o1{width:520px;height:520px;background:radial-gradient(circle, #7c3aed 0%, transparent 65%);top:-120px;left:-120px;animation:tr-drift1 22s ease-in-out infinite}
.tr-auth-orb.o2{width:480px;height:480px;background:radial-gradient(circle, #6366f1 0%, transparent 65%);bottom:-140px;right:-120px;animation:tr-drift2 28s ease-in-out infinite}
.tr-auth-orb.o3{width:380px;height:380px;background:radial-gradient(circle, #a78bfa 0%, transparent 65%);top:40%;left:55%;animation:tr-drift3 25s ease-in-out infinite;opacity:.4}
@keyframes tr-drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(80px,60px) scale(1.1)}}
@keyframes tr-drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-60px,-80px) scale(1.15)}}
@keyframes tr-drift3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,40px) scale(.9)}66%{transform:translate(40px,-30px) scale(1.05)}}

/* Fine grid overlay */
.tr-auth-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(196,181,253,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(196,181,253,.04) 1px, transparent 1px);
  background-size:48px 48px;
  mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
  pointer-events:none;
}
/* Subtle grain */
.tr-auth-grain{
  position:absolute;inset:0;opacity:.04;pointer-events:none;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Top bar — back button */
.tr-auth-back{
  position:absolute;top:18px;right:22px;z-index:10;
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 12px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  color:#cdc6e5;
  border-radius:8px;
  font-size:13px;font-weight:500;
  cursor:pointer;
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  transition:all .2s ease;
}
.tr-auth-back:hover{background:rgba(255,255,255,.07);border-color:rgba(196,181,253,.25);color:#fff;transform:translateX(-2px)}

/* Main split-screen layout */
.tr-auth-shell{
  position:relative;z-index:2;
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  width:100%;height:100vh;height:100dvh;
}
@media (max-width: 980px){
  .tr-auth-shell{grid-template-columns:1fr;height:auto;min-height:100vh;padding-top:72px;padding-bottom:40px}
  .tr-auth-brand{display:none}
}

/* ── LEFT: Brand panel ── */
.tr-auth-brand{
  padding:28px 48px 24px;
  display:flex;flex-direction:column;justify-content:space-between;gap:18px;
  height:100%;min-width:0;
  overflow-y:auto;overflow-x:hidden;
  position:relative;
}
.tr-auth-brand::after{
  content:"";position:absolute;top:0;right:0;bottom:0;width:1px;
  background:linear-gradient(180deg,transparent 0%,rgba(167,139,250,.18) 30%,rgba(167,139,250,.18) 70%,transparent 100%);
  pointer-events:none;
}
.tr-auth-brand::-webkit-scrollbar{width:6px}
.tr-auth-brand::-webkit-scrollbar-thumb{background:rgba(167,139,250,.2);border-radius:3px}
.tr-auth-wordmark{
  font-family:'Bricolage Grotesque',sans-serif;
  font-weight:700;font-size:20px;letter-spacing:-.5px;
  color:#fff;display:inline-flex;align-items:center;gap:10px;
}
.tr-auth-bolt{
  width:30px;height:30px;display:grid;place-items:center;
  position:relative;
  color:#a78bfa;
  filter:drop-shadow(0 0 12px rgba(134,59,255,.55));
}
.tr-auth-bolt svg{width:22px;height:21px;display:block}
.tr-auth-bolt::before{
  content:"";position:absolute;inset:-4px;border-radius:50%;
  background:radial-gradient(circle, rgba(134,59,255,.25) 0%, transparent 70%);
  z-index:-1;
}
.tr-auth-hero{margin-top:0;flex:1;display:flex;flex-direction:column;min-height:0;justify-content:center}
.tr-auth-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'JetBrains Mono',monospace;
  font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;
  color:#a78bfa;
  padding:6px 12px;
  background:rgba(167,139,250,.08);
  border:1px solid rgba(167,139,250,.2);
  border-radius:100px;
  margin-bottom:14px;
  align-self:flex-start;
}
.tr-auth-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#a78bfa;animation:tr-pulse 2s ease-in-out infinite}
@keyframes tr-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}

.tr-auth-headline{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(28px,3vw,42px);
  font-weight:600;line-height:1.05;letter-spacing:-1px;
  color:#fff;margin-bottom:12px;
}
.tr-auth-headline-accent{
  background:linear-gradient(120deg,#c4b5fd 0%,#a78bfa 40%,#8b5cf6 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  font-style:italic;
}
.tr-auth-sub{
  color:#a8a0c4;font-size:15px;line-height:1.55;max-width:460px;
  margin-bottom:20px;
}

/* Feature pills */
.tr-auth-features{display:flex;flex-direction:column;gap:9px}
.tr-auth-feature{
  display:flex;align-items:center;gap:11px;
  padding:10px 13px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.06);
  border-radius:10px;
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  transition:all .25s ease;
}
.tr-auth-feature:hover{
  background:rgba(255,255,255,.045);
  border-color:rgba(167,139,250,.25);
  transform:translateX(4px);
}
.tr-auth-feature-icon{
  width:30px;height:30px;flex-shrink:0;
  display:grid;place-items:center;
  background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(124,58,237,.1));
  border:1px solid rgba(167,139,250,.25);
  border-radius:8px;color:#c4b5fd;
}
.tr-auth-feature-icon svg{width:15px;height:15px}
.tr-auth-feature-text{font-size:13.5px;color:#e8e6f5;font-weight:500;line-height:1.3}
.tr-auth-feature-sub{font-size:12px;color:#8a82a8;margin-top:2px}

/* Brand footer stats */
.tr-auth-stats{
  display:flex;gap:26px;padding-top:14px;
  border-top:1px solid rgba(255,255,255,.06);
}
.tr-auth-stat-num{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px;line-height:1;
}
.tr-auth-stat-lbl{font-size:11px;color:#8a82a8;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px}

/* ── RIGHT: Form panel ── */
.tr-auth-formpanel{
  padding:20px 32px;
  display:flex;align-items:center;justify-content:center;
  height:100%;min-width:0;
  overflow-y:auto;overflow-x:hidden;
}
.tr-auth-formpanel::-webkit-scrollbar{width:6px}
.tr-auth-formpanel::-webkit-scrollbar-thumb{background:rgba(167,139,250,.2);border-radius:3px}
.tr-auth-card{
  width:100%;max-width:400px;
  padding:24px 26px;
  background:rgba(20,14,38,.6);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  backdrop-filter:blur(24px) saturate(140%);
  -webkit-backdrop-filter:blur(24px) saturate(140%);
  box-shadow:
    0 24px 80px rgba(0,0,0,.45),
    0 1px 0 rgba(255,255,255,.06) inset;
  position:relative;
  animation:tr-fade-up .55s cubic-bezier(.16,1,.3,1) both;
}
.tr-auth-card::before{
  content:"";position:absolute;inset:-1px;border-radius:16px;padding:1px;
  background:linear-gradient(135deg,rgba(167,139,250,.4),transparent 40%,transparent 60%,rgba(124,58,237,.3));
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  pointer-events:none;
}
@keyframes tr-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* Card header — logo above title */
.tr-auth-card-logo{
  display:flex;justify-content:center;margin-bottom:12px;
}
.tr-auth-card-logo .tr-auth-bolt{
  width:38px;height:38px;
  background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(124,58,237,.1));
  border:1px solid rgba(167,139,250,.25);
  border-radius:10px;
}
.tr-auth-card-logo .tr-auth-bolt svg{width:18px;height:17px}

/* Step header */
.tr-auth-step-label{
  font-family:'JetBrains Mono',monospace;
  font-size:11px;letter-spacing:2.5px;text-transform:uppercase;
  color:#a78bfa;
  margin-bottom:5px;
  text-align:center;
}
.tr-auth-title{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:24px;font-weight:600;letter-spacing:-.5px;line-height:1.2;
  color:#fff;margin-bottom:5px;text-align:center;
}
.tr-auth-desc{font-size:13.5px;color:#9c95bf;line-height:1.45;margin-bottom:14px;text-align:center}

/* Login / Signup toggle */
.tr-auth-toggle{
  display:grid;grid-template-columns:1fr 1fr;gap:4px;
  padding:3px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.06);
  border-radius:10px;
  margin-bottom:14px;
}
.tr-auth-toggle-btn{
  padding:8px 14px;
  background:transparent;
  color:#9c95bf;
  border:none;
  border-radius:7px;
  font-size:13px;font-weight:600;letter-spacing:.2px;
  cursor:pointer;
  transition:all .25s cubic-bezier(.4,0,.2,1);
}
.tr-auth-toggle-btn:hover{color:#cdc6e5}
.tr-auth-toggle-btn.active{
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff;
  box-shadow:0 6px 18px rgba(124,58,237,.35), 0 1px 0 rgba(255,255,255,.18) inset;
}

/* Inputs */
.tr-auth-field{margin-bottom:10px;position:relative}
.tr-auth-label{
  display:block;
  font-size:12px;font-weight:500;
  color:#a8a0c4;margin-bottom:5px;letter-spacing:.2px;
}
.tr-auth-input{
  width:100%;
  padding:10px 13px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.08);
  border-radius:9px;
  color:#fff;
  font-size:14px;font-family:inherit;
  transition:all .2s ease;
  outline:none;
}
.tr-auth-input::placeholder{color:#6f6792}
.tr-auth-input:hover{border-color:rgba(255,255,255,.14)}
.tr-auth-input:focus{
  border-color:rgba(167,139,250,.55);
  background:rgba(255,255,255,.055);
  box-shadow:0 0 0 3px rgba(167,139,250,.12);
}
.tr-auth-input.with-eye{padding-right:40px}

.tr-auth-eye{
  position:absolute;right:6px;top:50%;transform:translateY(-50%);
  width:30px;height:30px;
  display:grid;place-items:center;
  background:transparent;border:none;cursor:pointer;
  color:#8a82a8;border-radius:7px;
  transition:all .15s ease;
}
.tr-auth-eye:hover{color:#c4b5fd;background:rgba(255,255,255,.04)}
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
  font-size:12.5px;color:#9c95bf;line-height:1.45;cursor:pointer;
  margin-bottom:10px;
}
.tr-auth-checkbox input{
  width:15px;height:15px;flex-shrink:0;margin-top:1px;
  accent-color:#7c3aed;cursor:pointer;
}
.tr-auth-checkbox a, .tr-auth-checkbox-link{color:#c4b5fd;text-decoration:none;font-weight:500;cursor:pointer}
.tr-auth-checkbox a:hover, .tr-auth-checkbox-link:hover{color:#fff;text-decoration:underline}

/* Forgot link */
.tr-auth-forgot{
  display:flex;justify-content:flex-end;margin-bottom:10px;
}
.tr-auth-forgot-link{
  font-size:13px;color:#c4b5fd;cursor:pointer;font-weight:500;
  transition:color .15s ease;
}
.tr-auth-forgot-link:hover{color:#fff}

/* Buttons */
.tr-auth-btn{
  width:100%;
  padding:11px 16px;
  border-radius:10px;
  font-size:14px;font-weight:600;letter-spacing:.2px;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  font-family:inherit;
}
.tr-auth-btn-primary{
  background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 50%,#6d28d9 100%);
  color:#fff;
  border:1px solid rgba(255,255,255,.1);
  box-shadow:
    0 8px 24px rgba(124,58,237,.35),
    0 1px 0 rgba(255,255,255,.22) inset;
}
.tr-auth-btn-primary:hover{
  transform:translateY(-1px);
  box-shadow:0 12px 32px rgba(124,58,237,.5), 0 1px 0 rgba(255,255,255,.25) inset;
}
.tr-auth-btn-primary:active{transform:translateY(0)}
.tr-auth-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}

.tr-auth-btn-ghost{
  background:rgba(255,255,255,.035);
  color:#cdc6e5;
  border:1px solid rgba(255,255,255,.1);
}
.tr-auth-btn-ghost:hover{background:rgba(255,255,255,.06);border-color:rgba(196,181,253,.3);color:#fff}

.tr-auth-btn-text{
  width:100%;padding:8px;background:transparent;border:none;
  color:#9c95bf;font-size:13px;cursor:pointer;font-family:inherit;
  transition:color .15s ease;
}
.tr-auth-btn-text:hover{color:#fff}

/* OAuth divider */
.tr-auth-divider{
  display:flex;align-items:center;gap:11px;
  margin:11px 0;
  font-size:11px;color:#6f6792;
  text-transform:uppercase;letter-spacing:1.8px;
}
.tr-auth-divider::before,.tr-auth-divider::after{
  content:"";flex:1;height:1px;background:rgba(255,255,255,.08);
}

/* OAuth buttons grid */
.tr-auth-oauth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.tr-auth-oauth-btn{
  padding:9px 12px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.1);
  border-radius:9px;
  color:#e8e6f5;font-size:13px;font-weight:500;
  display:flex;align-items:center;justify-content:center;gap:8px;
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-auth-oauth-btn:hover{background:rgba(255,255,255,.07);border-color:rgba(196,181,253,.25);transform:translateY(-1px)}

/* Switch login/signup at bottom */
.tr-auth-switch{
  text-align:center;font-size:13px;color:#9c95bf;margin-top:0;
}
.tr-auth-switch-link{
  color:#c4b5fd;cursor:pointer;font-weight:600;
  background:none;border:none;padding:0;font-family:inherit;font-size:inherit;
}
.tr-auth-switch-link:hover{color:#fff}

/* Alerts */
.tr-auth-alert{
  padding:9px 12px;border-radius:8px;
  font-size:13px;line-height:1.4;
  margin-bottom:10px;
  display:flex;align-items:flex-start;gap:8px;
  border:1px solid;
}
.tr-auth-alert-error{
  background:rgba(239,68,68,.08);
  border-color:rgba(239,68,68,.25);
  color:#fca5a5;
}
.tr-auth-alert-success{
  background:rgba(34,197,94,.08);
  border-color:rgba(34,197,94,.25);
  color:#86efac;
}
.tr-auth-alert-icon{flex-shrink:0;margin-top:1px}

/* Detect step — choice cards */
.tr-auth-emoji{font-size:64px;text-align:center;margin-bottom:12px;line-height:1;
  filter:drop-shadow(0 4px 16px rgba(167,139,250,.4));}
.tr-auth-choices{display:flex;flex-direction:column;gap:10px}

/* Role select grid */
.tr-auth-roles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tr-auth-role{
  padding:14px;text-align:left;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.08);
  border-radius:11px;
  cursor:pointer;font-family:inherit;color:#e8e6f5;
  transition:all .2s ease;
  display:flex;flex-direction:column;gap:8px;
}
.tr-auth-role:hover{background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.3);transform:translateY(-1px)}
.tr-auth-role-icon{font-size:22px}
.tr-auth-role-name{font-size:13px;font-weight:500}

/* Reset done — celebration */
.tr-auth-celebrate{font-size:64px;text-align:center;line-height:1;margin-bottom:14px;
  animation:tr-celebrate 1.2s cubic-bezier(.34,1.56,.64,1) both;}
@keyframes tr-celebrate{from{transform:scale(0) rotate(-12deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}

/* Spinner */
.tr-auth-spinner{
  width:16px;height:16px;border-radius:50%;
  border:2px solid rgba(255,255,255,.25);
  border-top-color:#fff;
  animation:tr-spin .7s linear infinite;
}
@keyframes tr-spin{to{transform:rotate(360deg)}}

/* Select (company size) */
.tr-auth-select{
  width:100%;
  padding:13px 14px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.08);
  border-radius:11px;
  color:#fff;font-size:14px;font-family:inherit;
  outline:none;cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23a78bfa' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 14px center;
  padding-right:36px;
}
.tr-auth-select option{background:#140e26;color:#fff}
.tr-auth-select:focus{border-color:rgba(167,139,250,.55);box-shadow:0 0 0 4px rgba(167,139,250,.12)}

/* Override password strength colors when nested inside auth card (best-effort) */
.tr-auth-card .pwd-strength, .tr-auth-card .password-strength{margin-bottom:14px}
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

  return (
    <div className="app">
      <style>{CSS}</style>
      <style>{AUTH_CSS}</style>
      <ToastContainer />

      <div className="tr-auth-root">
        {/* Atmospheric background */}
        <div className="tr-auth-bg" aria-hidden="true">
          <div className="tr-auth-orb o1" />
          <div className="tr-auth-orb o2" />
          <div className="tr-auth-orb o3" />
          <div className="tr-auth-grid" />
          <div className="tr-auth-grain" />
        </div>

        {/* Back button */}
        <button className="tr-auth-back" onClick={goBack} type="button">
          {Icon.Back()} Back
        </button>

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

              <div className="tr-auth-card-logo">
                <span className="tr-auth-bolt"><BoltLogo size={22} /></span>
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
