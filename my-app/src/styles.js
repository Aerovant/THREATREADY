// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS STRING
// Imported by App.jsx and injected into the document via a <style> tag.
//
// PRINCIPLES:
//  1. WCAG AA contrast (4.5:1 minimum) in BOTH light + dark modes.
//  2. Every color is a CSS variable so themes swap cleanly via [data-theme="dark"].
//  3. Comprehensive responsive base rules at the bottom cascade to every tab.
// ═══════════════════════════════════════════════════════════════

// ── CSS ──
export const CSS = `
:root{
  /* ── Backgrounds (light) ── */
  --bg:#fbfaff;
  --s1:#ffffff;
  --s2:#f6f3ff;
  --s3:#ebe5fe;

  /* ── Accents (light) ── */
  --ac:#6d28d9;        /* primary — 9:1 on bg */
  --ac2:#7c3aed;       /* primary alt */
  --ac3:#a78bfa;       /* soft accent (decorative) */
  --ac4:#ddd6fe;       /* tint */

  /* ── States ── */
  --ok:#047857;        /* darker green for AA */
  --wn:#b45309;        /* darker amber for AA */
  --dn:#b91c1c;        /* darker red for AA */

  /* ── Text (light) — verified WCAG AA on --bg ── */
  --tx1:#0f0a1f;       /* primary — 19:1 */
  --tx2:#3d3656;       /* muted   — 10:1 (was #4b5563 7.5:1) */
  --tx3:#5b5475;       /* dim     — 7:1  (was #9ca3af 2.9:1 — FAILED AA) */

  /* ── Borders ── */
  --bd:#e3dcf2;
  --bd2:#c8bce8;

  /* ── Shadows ── */
  --shadow-sm:0 1px 2px rgba(15,10,31,.04),0 1px 3px rgba(124,58,237,.06);
  --shadow-md:0 4px 6px rgba(15,10,31,.04),0 10px 25px rgba(124,58,237,.10);
  --shadow-lg:0 10px 15px rgba(15,10,31,.05),0 25px 50px rgba(124,58,237,.15);
  --shadow-xl:0 20px 25px rgba(15,10,31,.08),0 40px 80px rgba(124,58,237,.20);

  --backdrop:rgba(15,10,31,.5);
  --grad-primary:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  --grad-soft:linear-gradient(135deg,#f6f3ff 0%,#ebe5fe 100%);
  --grad-text:linear-gradient(135deg,#0f0a1f 0%,#7c3aed 100%);
}

[data-theme="dark"]{
  --bg:#0a0712;
  --s1:#14111f;
  --s2:#1a1626;
  --s3:#2a2238;

  --ac:#c4b5fd;        /* primary — 11:1 on bg (was #a78bfa 7:1) */
  --ac2:#a78bfa;
  --ac3:#7c3aed;
  --ac4:#3b2566;

  --ok:#34d399;
  --wn:#fbbf24;
  --dn:#f87171;

  --tx1:#f8fafc;       /* 18:1 */
  --tx2:#d4cce8;       /* 13:1 */
  --tx3:#a8a0c4;       /* 7:1  (was #94a3b8 — themed purple) */

  --bd:#2a2240;
  --bd2:#3b2566;

  --shadow-sm:0 1px 3px rgba(0,0,0,.40);
  --shadow-md:0 4px 20px rgba(0,0,0,.50);
  --shadow-lg:0 12px 40px rgba(0,0,0,.60);
  --shadow-xl:0 20px 60px rgba(0,0,0,.70);

  --backdrop:rgba(0,0,0,.75);
  --grad-primary:linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%);
  --grad-soft:linear-gradient(135deg,#1a1626 0%,#2a2238 100%);
  --grad-text:linear-gradient(135deg,#f8fafc 0%,#c4b5fd 100%);
}

*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx1);font-family:'Inter','Segoe UI',system-ui,sans-serif;overflow-x:hidden;font-size:15px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;transition: background .3s ease, color .3s ease}
.app{min-height:100vh;position:relative;overflow-x:hidden;width:100%}

.breadcrumb,.crumb,.crumbs,nav.breadcrumb,[class*="breadcrumb"],[class*="crumb"]{display:none !important}

.lbl{font-size:13px !important;letter-spacing:1.5px}
.tag{font-size:12px !important}
.statlbl{font-size:12px !important}
.diff{font-size:12px !important}
.badge-card{font-size:12px !important}
.nav-tab{font-size:14px !important}
.sidebar-item{font-size:15px !important}
.heatmap-cell{font-size:11px !important}
.toast{font-size:14px !important}
[style*="font-size: 8px"]{font-size:11px !important}
[style*="font-size: 9px"]{font-size:11px !important}
[style*="font-size: 10px"]{font-size:12px !important}
[style*="font-size: 11px"]{font-size:13px !important}

.gridbg{position:fixed;inset:0;background-image:linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
[data-theme="dark"] .gridbg{background-image:linear-gradient(rgba(167,139,250,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,.04) 1px,transparent 1px)}

.scanbar{position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac2),transparent);animation:scan 4s infinite;z-index:100;opacity:.5}
@keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

@keyframes avatarRing{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.7}}
@keyframes talking{0%{height:4px;width:20px}100%{height:10px;width:26px}}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
@keyframes soundBar{from{height:20%}to{height:100%}}
@keyframes soundBar1{from{height:3px}to{height:16px}}
@keyframes soundBar2{from{height:5px}to{height:20px}}
@keyframes soundBar3{from{height:4px}to{height:14px}}

.orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px);opacity:.4}
[data-theme="dark"] .orb{opacity:.6}
.page{position:relative;z-index:1;min-height:100vh;padding:20px 0;width:100%}
.cnt{width:100%;padding:0 24px;box-sizing:border-box;max-width:1400px;margin:0 auto}
.hero{text-align:center;padding:80px 0 40px}
.hero h1{font-size:clamp(40px,7vw,76px);font-weight:900;line-height:1.05;letter-spacing:-.03em;background:var(--grad-text);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:18px}
.hero p{font-size:18px;color:var(--tx2);max-width:760px;margin:0 auto;line-height:1.7}

.card{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:24px;position:relative;transition:all .25s cubic-bezier(.4,0,.2,1);box-shadow:var(--shadow-sm)}
.card-glow:hover{border-color:var(--ac3);box-shadow:var(--shadow-md);transform:translateY(-2px)}

.btn{border:none;border-radius:10px;font-weight:600;cursor:pointer;transition:all .2s cubic-bezier(.4,0,.2,1);font-size:15px;padding:11px 22px;display:inline-flex;align-items:center;justify-content:center;gap:8px;letter-spacing:-.01em}
.bp{background:var(--grad-primary);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.35),inset 0 1px 0 rgba(255,255,255,.15)}
.bp:hover{box-shadow:0 8px 24px rgba(124,58,237,.45),inset 0 1px 0 rgba(255,255,255,.2);transform:translateY(-1px)}
.bp:active{transform:translateY(0)}
.bp:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.bs{background:var(--s1);border:1px solid var(--bd2);color:var(--tx1);box-shadow:var(--shadow-sm)}
.bs:hover{border-color:var(--ac2);color:var(--ac);background:var(--s2);box-shadow:var(--shadow-md)}
.bdn{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.3)}
.bok{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 14px rgba(16,185,129,.3)}

.input{width:100%;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;color:var(--tx1);font-size:15px;outline:none;transition:all .2s;resize:vertical;font-family:inherit}
.input:focus{border-color:var(--ac2);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
[data-theme="dark"] .input:focus{box-shadow:0 0 0 3px rgba(167,139,250,.20)}
.input[data-nopaste]{-webkit-user-select:text;user-select:text}
.input::placeholder{color:var(--tx3)}

.lbl{font-size:12px;letter-spacing:2px;color:var(--ac);text-transform:uppercase;font-weight:700}
.tag{display:inline-block;padding:4px 12px;background:var(--s3);border:1px solid var(--ac4);border-radius:20px;font-size:11px;color:var(--ac);font-weight:600}
.mono{font-family:'JetBrains Mono','Fira Code',monospace}

.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:640px){.rgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:420px){.rgrid{grid-template-columns:1fr}}
.sgrid{display:grid;gap:14px}

.sub-card{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:24px;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1);position:relative;text-align:center;box-shadow:var(--shadow-sm)}
.sub-card:hover,.sub-card.sel{border-color:var(--ac2);background:var(--s2);box-shadow:var(--shadow-md);transform:translateY(-3px)}

.statbox{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:18px;text-align:center;box-shadow:var(--shadow-sm);transition:all .2s}
.statbox:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.statval{font-size:28px;font-weight:800;font-family:'JetBrains Mono',monospace;background:var(--grad-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.02em}
.statlbl{font-size:11px;color:var(--tx3);margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600}

.pbar{height:6px;background:var(--s3);border-radius:6px;overflow:hidden}
.pfill{height:100%;border-radius:6px;transition:width .8s cubic-bezier(.4,0,.2,1);background:var(--grad-primary)}

.diff{font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px}
.diff-beginner,.diff-Beginner{background:rgba(16,185,129,.10);color:#047857;border:1px solid rgba(16,185,129,.30)}
.diff-intermediate,.diff-Intermediate{background:rgba(245,158,11,.10);color:#b45309;border:1px solid rgba(245,158,11,.30)}
.diff-advanced,.diff-Advanced{background:rgba(239,68,68,.10);color:#b91c1c;border:1px solid rgba(239,68,68,.30)}
.diff-expert,.diff-Expert{background:rgba(124,58,237,.10);color:var(--ac);border:1px solid rgba(124,58,237,.30)}
[data-theme="dark"] .diff-beginner,[data-theme="dark"] .diff-Beginner{background:rgba(52,211,153,.15);color:#6ee7b7;border-color:rgba(52,211,153,.35)}
[data-theme="dark"] .diff-intermediate,[data-theme="dark"] .diff-Intermediate{background:rgba(251,191,36,.15);color:#fcd34d;border-color:rgba(251,191,36,.35)}
[data-theme="dark"] .diff-advanced,[data-theme="dark"] .diff-Advanced{background:rgba(248,113,113,.15);color:#fca5a5;border-color:rgba(248,113,113,.35)}
[data-theme="dark"] .diff-expert,[data-theme="dark"] .diff-Expert{background:rgba(196,181,253,.15);color:#c4b5fd;border-color:rgba(196,181,253,.35)}

.eval-card{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:16px;margin-bottom:12px;border-left:3px solid var(--ac2);box-shadow:var(--shadow-sm)}
.badge-card{border:2px solid;border-radius:14px;padding:10px 18px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:2px;text-align:center;font-family:'JetBrains Mono',monospace}

.loader{width:18px;height:18px;border:2px solid transparent;border-top-color:currentColor;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}

.rec-ring{width:56px;height:56px;border-radius:50%;border:2px solid var(--bd2);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .2s;background:var(--s1);box-shadow:var(--shadow-sm)}
.rec-ring:hover{border-color:var(--ac2);color:var(--ac);box-shadow:var(--shadow-md)}
.rec-ring.active{border-color:var(--dn);animation:pulse 1.2s infinite;background:rgba(220,38,38,.08)}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 14px rgba(220,38,38,0)}}

.home-btn{position:fixed;top:14px;right:14px;z-index:50;background:var(--s1);border:1px solid var(--bd2);color:var(--tx2);padding:8px 16px;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600;transition:all .2s;box-shadow:var(--shadow-sm)}
.home-btn:hover{border-color:var(--ac2);color:var(--ac);box-shadow:var(--shadow-md);transform:translateY(-1px)}

.theme-toggle{position:fixed;top:14px;right:120px;z-index:50;width:40px;height:40px;border-radius:10px;background:var(--s1);border:1px solid var(--bd2);color:var(--tx2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all .2s;box-shadow:var(--shadow-sm)}
.theme-toggle:hover{border-color:var(--ac2);color:var(--ac);box-shadow:var(--shadow-md);transform:translateY(-1px) rotate(20deg)}

.fadeUp{animation:fadeUp .5s cubic-bezier(.4,0,.2,1) both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

.heatmap-cell{width:100%;aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace}

.nav-tabs{display:flex;gap:6px;margin-bottom:24px;overflow-x:auto;padding:4px;background:var(--s2);border-radius:12px;border:1px solid var(--bd)}
.nav-tab{padding:9px 18px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;background:transparent;color:var(--tx2);border:none}
.nav-tab.active{background:var(--s1);color:var(--ac);box-shadow:var(--shadow-sm);font-weight:700}
.nav-tab:hover:not(.active){color:var(--tx1);background:var(--s1)}

.sidebar{position:fixed;left:0;top:0;bottom:0;width:240px;background:var(--s1);border-right:1px solid var(--bd);padding:24px 0;z-index:40;overflow-y:auto;box-shadow:var(--shadow-sm)}
.sidebar-item{padding:11px 24px;font-size:14px;color:var(--tx2);cursor:pointer;display:flex;align-items:center;gap:12px;transition:all .15s;font-weight:500;border-left:3px solid transparent}
.sidebar-item:hover{background:var(--s2);color:var(--tx1)}
.sidebar-item.active{color:var(--ac);background:var(--s3);border-left-color:var(--ac);font-weight:700}
.main-with-sidebar{margin-left:240px}
@media(max-width:768px){.sidebar{display:none}.main-with-sidebar{margin-left:0}}

.tooltip{position:relative;cursor:help}
.tooltip:hover::after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--tx1);color:var(--s1);padding:8px 12px;border-radius:8px;font-size:11px;white-space:nowrap;z-index:99;box-shadow:var(--shadow-md)}

.strength-bar{height:6px;border-radius:6px;transition:all .3s}

.overlay{position:fixed;inset:0;background:var(--backdrop);z-index:60;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:20px;padding:36px;max-width:520px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:var(--shadow-xl)}

.toast-wrap{position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px;pointer-events:none}
.toast{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:14px;backdrop-filter:blur(20px);box-shadow:var(--shadow-lg);animation:toastIn .35s cubic-bezier(.34,1.56,.64,1) both;pointer-events:all;cursor:default;font-size:13px;font-weight:600;background:var(--s1);border:1px solid var(--bd);color:var(--tx1)}
.toast-success{background:rgba(16,185,129,.10);border:1px solid rgba(16,185,129,.40);color:#047857}
.toast-error{background:rgba(239,68,68,.10);border:1px solid rgba(239,68,68,.40);color:#b91c1c}
.toast-warning{background:rgba(245,158,11,.10);border:1px solid rgba(245,158,11,.40);color:#b45309}
.toast-info{background:rgba(124,58,237,.10);border:1px solid rgba(124,58,237,.40);color:var(--ac)}
[data-theme="dark"] .toast-success{background:rgba(52,211,153,.15);color:#6ee7b7;border-color:rgba(52,211,153,.40)}
[data-theme="dark"] .toast-error{background:rgba(248,113,113,.15);color:#fca5a5;border-color:rgba(248,113,113,.40)}
[data-theme="dark"] .toast-warning{background:rgba(251,191,36,.15);color:#fcd34d;border-color:rgba(251,191,36,.40)}
[data-theme="dark"] .toast-info{background:rgba(196,181,253,.15);color:#c4b5fd;border-color:rgba(196,181,253,.40)}
.toast-icon{font-size:20px;flex-shrink:0}
.toast-msg{flex:1;line-height:1.4}
.toast-close{font-size:18px;opacity:.45;transition:opacity .15s;flex-shrink:0;background:none;border:none;color:inherit;cursor:pointer;padding:0 2px;line-height:1}
.toast-close:hover{opacity:1}
@keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastOut{to{opacity:0;transform:translateX(60px) scale(.9)}}

.confirm-backdrop{position:fixed;inset:0;z-index:100000;background:var(--backdrop);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:fadeUp .25s ease}
.confirm-box{background:var(--s1);border:1px solid var(--bd);border-radius:24px;padding:44px 40px;max-width:440px;width:90%;box-shadow:var(--shadow-xl);text-align:center;animation:confirmPop .35s cubic-bezier(.34,1.56,.64,1) both}
.confirm-emoji{font-size:52px;margin-bottom:18px;display:block}
.confirm-title{font-size:20px;font-weight:800;color:var(--tx1);margin-bottom:10px;line-height:1.3;letter-spacing:-.01em}
.confirm-sub{font-size:13px;color:var(--tx2);margin-bottom:32px;line-height:1.6}
.confirm-btns{display:flex;gap:12px}
.confirm-cancel{flex:1;padding:14px 0;font-size:13px;font-weight:700;border-radius:12px;background:var(--s2);border:1px solid var(--bd2);color:var(--tx2);cursor:pointer;transition:all .2s}
.confirm-cancel:hover{border-color:var(--ac2);color:var(--ac);background:var(--s3)}
.confirm-ok{flex:1;padding:14px 0;font-size:13px;font-weight:700;border-radius:12px;border:none;cursor:pointer;transition:all .2s}
.confirm-ok-logout,.confirm-ok-default{background:var(--grad-primary);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.35)}
.confirm-ok-logout:hover,.confirm-ok-default:hover{box-shadow:0 8px 24px rgba(124,58,237,.5);transform:translateY(-1px)}
.confirm-ok-delete{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.35)}
.confirm-ok-delete:hover{box-shadow:0 8px 24px rgba(239,68,68,.5);transform:translateY(-1px)}
@keyframes confirmPop{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}

/* ═══════════════════════════════════════════════════════════════
   COMPREHENSIVE DARK-MODE COVERAGE
   Catches inline white/grey/black backgrounds + text in tabs
   that have hardcoded values not yet migrated to tokens.
   ═══════════════════════════════════════════════════════════════ */
[data-theme="dark"] [style*="background: #fff"],
[data-theme="dark"] [style*="background:#fff"],
[data-theme="dark"] [style*="background: #ffffff"],
[data-theme="dark"] [style*="background:#ffffff"],
[data-theme="dark"] [style*="background: white"],
[data-theme="dark"] [style*="background:white"],
[data-theme="dark"] [style*="background-color: #fff"],
[data-theme="dark"] [style*="background-color:#fff"]{
  background: var(--s1) !important;
}
[data-theme="dark"] [style*="background: #f6"],
[data-theme="dark"] [style*="background:#f6"],
[data-theme="dark"] [style*="background: #f8"],
[data-theme="dark"] [style*="background:#f8"],
[data-theme="dark"] [style*="background: #fafafa"],
[data-theme="dark"] [style*="background:#fafafa"]{
  background: var(--s2) !important;
}
[data-theme="dark"] [style*="background: #eee"],
[data-theme="dark"] [style*="background:#eee"],
[data-theme="dark"] [style*="background: #f0f"],
[data-theme="dark"] [style*="background:#f0f"]{
  background: var(--s3) !important;
}
[data-theme="dark"] [style*="color: #000"],
[data-theme="dark"] [style*="color:#000"],
[data-theme="dark"] [style*="color: black"],
[data-theme="dark"] [style*="color:black"]{
  color: var(--tx1) !important;
}
[data-theme="dark"] [style*="color: #333"],
[data-theme="dark"] [style*="color:#333"],
[data-theme="dark"] [style*="color: #444"],
[data-theme="dark"] [style*="color:#444"],
[data-theme="dark"] [style*="color: #4b5563"],
[data-theme="dark"] [style*="color:#4b5563"]{
  color: var(--tx2) !important;
}
[data-theme="dark"] [style*="color: #6b"],
[data-theme="dark"] [style*="color:#6b"],
[data-theme="dark"] [style*="color: #9ca3af"],
[data-theme="dark"] [style*="color:#9ca3af"],
[data-theme="dark"] [style*="color: #94a3b8"],
[data-theme="dark"] [style*="color:#94a3b8"]{
  color: var(--tx3) !important;
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL TEXT VISIBILITY — applied across every page in dark mode
   Force baseline legibility on common patterns so no text disappears.
   ═══════════════════════════════════════════════════════════════ */
[data-theme="dark"] {
  color-scheme: dark;
}
/* Default body text in dark mode stays bright */
[data-theme="dark"] body { color: var(--tx1); }

/* Every heading is bright white-ish in dark mode */
[data-theme="dark"] h1,[data-theme="dark"] h2,[data-theme="dark"] h3,
[data-theme="dark"] h4,[data-theme="dark"] h5,[data-theme="dark"] h6{
  color: #ffffff;
}

/* Paragraphs + spans + divs without explicit color inherit a strong color */
[data-theme="dark"] p,[data-theme="dark"] li,[data-theme="dark"] dt,[data-theme="dark"] dd{
  color: var(--tx1);
}

/* Strong + b stay bright */
[data-theme="dark"] strong,[data-theme="dark"] b{ color: #ffffff; font-weight: 700; }

/* Small + sub elements */
[data-theme="dark"] small,[data-theme="dark"] .text-muted,[data-theme="dark"] .muted{
  color: var(--tx2) !important;
}

/* Common label classes — force readable color */
[data-theme="dark"] label,
[data-theme="dark"] .label,
[data-theme="dark"] .form-label,
[data-theme="dark"] [class*="-label"]:not([class*="badge"]):not([class*="pill"]){
  color: var(--tx2);
}

/* Links — bright lavender in dark mode (good 9:1 contrast) */
[data-theme="dark"] a:not(.btn):not([class*="btn"]):not([class*="bp"]){
  color: var(--ac);
}
[data-theme="dark"] a:not(.btn):not([class*="btn"]):not([class*="bp"]):hover{
  color: #ddd6fe;
}

/* Common text-emphasis classes */
[data-theme="dark"] .tx-strong,[data-theme="dark"] .strong-text{ color: #ffffff !important; }
[data-theme="dark"] .tx-muted{ color: var(--tx2) !important; }
[data-theme="dark"] .tx-dim,[data-theme="dark"] .text-dim{ color: var(--tx3) !important; }

/* Card titles / values across tab CSS systems — force visible */
[data-theme="dark"] [class*="-title"]:not([class*="bp"]):not([class*="btn"]),
[data-theme="dark"] [class*="-name"]:not([class*="btn"]),
[data-theme="dark"] [class*="-value"]:not([class*="btn"]),
[data-theme="dark"] [class*="-num"]:not([class*="btn"]),
[data-theme="dark"] [class*="-heading"]:not([class*="btn"]){
  color: var(--tx1);
}
[data-theme="dark"] [class*="-meta"],
[data-theme="dark"] [class*="-desc"]:not([class*="btn"]),
[data-theme="dark"] [class*="-sub"]:not([class*="btn"]):not([class*="submit"]){
  color: var(--tx2);
}
[data-theme="dark"] [class*="-hint"],
[data-theme="dark"] [class*="-caption"]{
  color: var(--tx3);
}

/* Tables in dark mode */
[data-theme="dark"] table{ color: var(--tx1); }
[data-theme="dark"] th{ color: #ffffff; border-color: var(--bd); }
[data-theme="dark"] td{ color: var(--tx1); border-color: var(--bd); }

/* ═══════════════════════════════════════════════════════════════
   GLOBAL RESPONSIVE BASE — cascades to every tab and view
   ═══════════════════════════════════════════════════════════════ */

/* Tablet (≤960px) */
@media (max-width: 960px){
  .cnt{padding:0 18px}
  .hero{padding:48px 0 28px}
  .hero h1{font-size:clamp(32px,6vw,52px)}
  .hero p{font-size:16px}
  .card{padding:18px;border-radius:14px}
  .sub-card{padding:18px}
  .statbox{padding:14px}
  .statval{font-size:24px}
  .modal{padding:28px;border-radius:16px}
  .confirm-box{padding:32px 24px}
  .home-btn{top:10px;right:10px;padding:7px 12px;font-size:12px}
  .theme-toggle{top:10px;right:96px;width:36px;height:36px}
  .btn{font-size:14px;padding:10px 18px}
}

/* Mobile phones (≤640px) */
@media (max-width: 640px){
  .cnt{padding:0 14px}
  .page{padding:14px 0}
  .hero{padding:32px 0 20px}
  .hero h1{font-size:clamp(26px,7vw,40px);margin-bottom:14px}
  .hero p{font-size:15px;line-height:1.6}
  .card{padding:16px;border-radius:12px}
  .sub-card{padding:16px}
  .statbox{padding:12px}
  .statval{font-size:22px}
  .statlbl{font-size:10.5px;letter-spacing:.6px}
  .input{padding:10px 12px;font-size:14px}
  .btn{font-size:13.5px;padding:9px 16px;border-radius:9px}
  .modal{padding:22px;border-radius:14px;max-height:88vh}
  .confirm-box{padding:24px 18px;border-radius:16px}
  .confirm-emoji{font-size:42px;margin-bottom:12px}
  .confirm-title{font-size:17px}
  .confirm-sub{font-size:12.5px;margin-bottom:20px}
  .nav-tabs{margin-bottom:16px;padding:3px}
  .nav-tab{padding:7px 13px;font-size:13px !important}
  .home-btn{top:8px;right:8px;padding:6px 11px;font-size:11.5px;border-radius:8px}
  .theme-toggle{top:8px;right:78px;width:32px;height:32px;font-size:16px;border-radius:8px}
  .toast-wrap{top:10px;right:10px;left:10px;max-width:none}
  .toast{padding:11px 14px;font-size:12.5px !important;border-radius:11px}
  .lbl{font-size:11px !important;letter-spacing:1.2px}
  .tag{padding:3px 9px;font-size:10.5px !important}
}

/* ═══════════════════════════════════════════════════════════════
   AGGRESSIVE DARK-MODE OVERRIDES — Class-level patches
   Tabs use scoped classes like .tr-prof-input, .tr-set-input, .tr-home-*
   with hardcoded white backgrounds in their CSS. The inline-catch above
   doesn't reach these. These rules force class-level conversions.
   ═══════════════════════════════════════════════════════════════ */

/* Form controls — every tab's input/select/textarea must have proper bg in dark mode */
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea{
  background-color: var(--s2) !important;
  color: var(--tx1) !important;
  border-color: var(--bd) !important;
}
[data-theme="dark"] input::placeholder,
[data-theme="dark"] textarea::placeholder{
  color: var(--tx3) !important;
  opacity: 1;
}
[data-theme="dark"] input:disabled,
[data-theme="dark"] select:disabled,
[data-theme="dark"] textarea:disabled{
  background-color: var(--s1) !important;
  color: var(--tx3) !important;
  opacity: 0.65;
}

/* Force scoped tab classes that hardcode white/light bg → use tokens */
[data-theme="dark"] [class*="tr-prof-input"],
[data-theme="dark"] [class*="tr-set-input"],
[data-theme="dark"] [class*="tr-home-input"],
[data-theme="dark"] [class*="tr-bill-input"],
[data-theme="dark"] [class*="tr-help-input"],
[data-theme="dark"] [class*="tr-int-input"],
[data-theme="dark"] [class*="tr-score-input"],
[data-theme="dark"] [class*="tr-bdg-input"]{
  background: var(--s2) !important;
  color: var(--tx1) !important;
  border-color: var(--bd) !important;
}

/* Card-style class patterns — many tabs use tr-*-card with hardcoded #fff */
[data-theme="dark"] [class*="tr-prof-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-set-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-home-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-bill-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-help-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-int-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-score-card"]:not([class*="btn"]),
[data-theme="dark"] [class*="tr-bdg-card"]:not([class*="btn"]){
  background: var(--s1) !important;
  color: var(--tx1) !important;
  border-color: var(--bd) !important;
}

/* FAQ / accordion items — Help Center uses hardcoded light backgrounds */
[data-theme="dark"] [class*="tr-help-faq"],
[data-theme="dark"] [class*="tr-help-q"],
[data-theme="dark"] [class*="tr-help-a"]{
  background: var(--s1) !important;
  color: var(--tx1) !important;
  border-color: var(--bd) !important;
}
[data-theme="dark"] [class*="tr-help-faq"] *,
[data-theme="dark"] [class*="tr-help-q"] *{
  color: var(--tx1) !important;
}
[data-theme="dark"] [class*="tr-help-a"] *,
[data-theme="dark"] [class*="tr-help-desc"]{
  color: var(--tx2) !important;
}

/* Daily challenge time badges (HRS/MIN/SEC chips) — were invisible */
[data-theme="dark"] [class*="tr-home-time"],
[data-theme="dark"] [class*="tr-home-chip"],
[data-theme="dark"] [class*="tr-home-counter"],
[data-theme="dark"] [class*="tr-home-clock"]{
  background: rgba(255,255,255,.08) !important;
  color: var(--tx1) !important;
  border-color: rgba(255,255,255,.14) !important;
}

/* Panelist name labels in Live Interview — were faded */
[data-theme="dark"] [class*="panelist-name"],
[data-theme="dark"] [class*="panel-name"],
[data-theme="dark"] [class*="tr-int-name"]{
  color: var(--tx1) !important;
  opacity: 1 !important;
}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE VISUAL DEPTH — multi-layered surface system
   Previously dark mode was too flat. Add subtle elevation hierarchy.
   ═══════════════════════════════════════════════════════════════ */

[data-theme="dark"] .card,
[data-theme="dark"] [class*="tr-prof-card"],
[data-theme="dark"] [class*="tr-set-card"],
[data-theme="dark"] [class*="tr-home-card"],
[data-theme="dark"] [class*="tr-bill-card"],
[data-theme="dark"] [class*="tr-help-card"],
[data-theme="dark"] [class*="tr-int-card"],
[data-theme="dark"] [class*="tr-score-card"]{
  background: linear-gradient(180deg, rgba(255,255,255,.025) 0%, rgba(255,255,255,0) 100%), var(--s1) !important;
  border: 1px solid rgba(255,255,255,.06) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,.03) inset, 0 8px 24px rgba(0,0,0,.30) !important;
}
[data-theme="dark"] .card:hover,
[data-theme="dark"] [class*="tr-home-card"]:hover,
[data-theme="dark"] [class*="tr-bill-card"]:hover{
  background: linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,0) 100%), var(--s1) !important;
  border-color: rgba(167,139,250,.20) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 16px 36px rgba(0,0,0,.40), 0 0 0 1px rgba(167,139,250,.08) !important;
}

/* Small phones (≤420px) */
@media (max-width: 420px){
  .cnt{padding:0 10px}
  .card{padding:14px;border-radius:11px}
  .sub-card{padding:14px}
  .statbox{padding:10px}
  .statval{font-size:20px}
  .home-btn{padding:5px 9px;font-size:11px}
  .theme-toggle{right:68px;width:30px;height:30px}
  .confirm-box{padding:20px 14px}
  .modal{padding:18px}
  .hero h1{font-size:26px}
}
`;
