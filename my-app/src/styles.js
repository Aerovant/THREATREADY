// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS STRING
// Imported by App.jsx and injected into the document via a <style> tag.
// ═══════════════════════════════════════════════════════════════

// ── CSS ──
export const CSS = `
:root{
  --bg:#fbfaff;
  --s1:#ffffff;
  --s2:#f6f3ff;
  --s3:#ebe5fe;
  --ac:#6d28d9;
  --ac2:#7c3aed;
  --ac3:#a78bfa;
  --ac4:#ddd6fe;
  --ok:#059669;
  --wn:#d97706;
  --dn:#dc2626;
  --tx1:#0f0a1f;
  --tx2:#4b5563;
  --tx3:#9ca3af;
  --bd:#e9e5f3;
  --bd2:#d4cce8;
  --shadow-sm:0 1px 2px rgba(15,10,31,.04),0 1px 3px rgba(124,58,237,.06);
  --shadow-md:0 4px 6px rgba(15,10,31,.04),0 10px 25px rgba(124,58,237,.1);
  --shadow-lg:0 10px 15px rgba(15,10,31,.05),0 25px 50px rgba(124,58,237,.15);
  --shadow-xl:0 20px 25px rgba(15,10,31,.08),0 40px 80px rgba(124,58,237,.2);
  --backdrop:rgba(15,10,31,.5);
  --grad-primary:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  --grad-soft:linear-gradient(135deg,#f6f3ff 0%,#ebe5fe 100%);
  --grad-text:linear-gradient(135deg,#0f0a1f 0%,#7c3aed 100%)
}
[data-theme="dark"]{
  --bg:#0a0712;
  --s1:#13101e;
  --s2:#1a1626;
  --s3:#2a2238;
  --ac:#a78bfa;
  --ac2:#c4b5fd;
  --ac3:#7c3aed;
  --ac4:#3b2566;
  --ok:#10b981;
  --wn:#f59e0b;
  --dn:#ef4444;
  --tx1:#f8fafc;
  --tx2:#cbd5e1;
  --tx3:#94a3b8;
  --bd:#2a2240;
  --bd2:#3b2566;
  --shadow-sm:0 1px 3px rgba(0,0,0,.4);
  --shadow-md:0 4px 20px rgba(0,0,0,.5);
  --shadow-lg:0 12px 40px rgba(0,0,0,.6);
  --shadow-xl:0 20px 60px rgba(0,0,0,.7);
  --backdrop:rgba(0,0,0,.75);
  --grad-primary:linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%);
  --grad-soft:linear-gradient(135deg,#1a1626 0%,#2a2238 100%);
  --grad-text:linear-gradient(135deg,#f8fafc 0%,#a78bfa 100%)
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx1);font-family:'Inter','Segoe UI',system-ui,sans-serif;overflow-x:hidden;font-size:15px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.app{min-height:100vh;position:relative;overflow-x:hidden;width:100%}

/* HIDE BREADCRUMB BAR */
.breadcrumb,.crumb,.crumbs,nav.breadcrumb,[class*="breadcrumb"],[class*="crumb"]{display:none !important}

/* Readability: bump up very small fonts across the app */
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
.page{position:relative;z-index:1;min-height:100vh;padding:20px 0;width:100%}
.cnt{width:100%;padding:0 24px;box-sizing:border-box;max-width:1400px;margin:0 auto}
.hero{text-align:center;padding:80px 0 40px}
.hero h1{font-size:clamp(40px,7vw,76px);font-weight:900;line-height:1.05;letter-spacing:-.03em;color:var(--ac);margin-bottom:18px}
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
.input[data-nopaste]{-webkit-user-select:text;user-select:text}
.input::placeholder{color:var(--tx3)}

.lbl{font-size:12px;letter-spacing:2px;color:var(--ac);text-transform:uppercase;font-weight:700}
.tag{display:inline-block;padding:4px 12px;background:var(--s3);border:1px solid var(--ac4);border-radius:20px;font-size:11px;color:var(--ac);font-weight:600}
.mono{font-family:'JetBrains Mono','Fira Code',monospace}

.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:640px){.rgrid{grid-template-columns:repeat(2,1fr)}}
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
.diff-beginner,.diff-Beginner{background:rgba(16,185,129,.1);color:#059669;border:1px solid rgba(16,185,129,.25)}
.diff-intermediate,.diff-Intermediate{background:rgba(245,158,11,.1);color:#d97706;border:1px solid rgba(245,158,11,.25)}
.diff-advanced,.diff-Advanced{background:rgba(239,68,68,.1);color:#dc2626;border:1px solid rgba(239,68,68,.25)}
.diff-expert,.diff-Expert{background:rgba(124,58,237,.1);color:var(--ac);border:1px solid rgba(124,58,237,.25)}

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

/* THEME TOGGLE BUTTON */
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

/* ── TOAST NOTIFICATIONS ── */
.toast-wrap{position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px;pointer-events:none}
.toast{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:14px;backdrop-filter:blur(20px);box-shadow:var(--shadow-lg);animation:toastIn .35s cubic-bezier(.34,1.56,.64,1) both;pointer-events:all;cursor:default;font-size:13px;font-weight:600;background:var(--s1);border:1px solid var(--bd);color:var(--tx1)}
.toast-success{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.4);color:#047857}
.toast-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.4);color:#b91c1c}
.toast-warning{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.4);color:#b45309}
.toast-info{background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.4);color:var(--ac)}
.toast-icon{font-size:20px;flex-shrink:0}
.toast-msg{flex:1;line-height:1.4}
.toast-close{font-size:18px;opacity:.45;transition:opacity .15s;flex-shrink:0;background:none;border:none;color:inherit;cursor:pointer;padding:0 2px;line-height:1}
.toast-close:hover{opacity:1}
@keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastOut{to{opacity:0;transform:translateX(60px) scale(.9)}}

/* ── CONFIRM DIALOG ── */
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
`;