// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS STRING
// Imported by App.jsx and injected into the document via a <style> tag.
// ═══════════════════════════════════════════════════════════════

// ── CSS ──
export const CSS = `
:root{--bg:#0a0e1a;--s1:#111827;--s2:#1a1f2e;--s3:#252b3b;--ac:#00e5ff;--ok:#00e096;--wn:#ffab40;--dn:#ff5252;--tx1:#e8eaf6;--tx2:#b8c0dc;--tx3:#9098b8;--bd:#1e2536}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx1);font-family:'Inter','Segoe UI',system-ui,sans-serif;overflow-x:hidden;font-size:15px}
.app{min-height:100vh;position:relative;overflow-x:hidden;width:100%}
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
/* Scale up tiny inline fonts (8-11px) for readability — React outputs 'font-size: 8px' style */
[style*="font-size: 8px"]{font-size:11px !important}
[style*="font-size: 9px"]{font-size:11px !important}
[style*="font-size: 10px"]{font-size:12px !important}
[style*="font-size: 11px"]{font-size:13px !important}
.gridbg{position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
.scanbar{position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac),transparent);animation:scan 4s infinite;z-index:100;opacity:.6}
@keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}


@keyframes avatarRing{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.7}}
@keyframes talking{0%{height:4px;width:20px}100%{height:10px;width:26px}}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
@keyframes soundBar{from{height:20%}to{height:100%}}

@keyframes soundBar1{from{height:3px}to{height:16px}}
@keyframes soundBar2{from{height:5px}to{height:20px}}
@keyframes soundBar3{from{height:4px}to{height:14px}}

.orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(60px)}
.page{position:relative;z-index:1;min-height:100vh;padding:20px 0;width:100%}
.cnt{width:100%;padding:0 24px;box-sizing:border-box}
.hero{text-align:center;padding:80px 0 40px}
.hero h1{font-size:clamp(36px,7vw,72px);font-weight:900;line-height:1.1;background:linear-gradient(135deg,#fff,var(--ac));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:14px}
.hero p{font-size:17px;color:var(--tx2);max-width:760px;margin:0 auto;line-height:1.7}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:20px;position:relative;transition:all .3s}
.card-glow:hover{border-color:var(--ac);box-shadow:0 0 20px rgba(0,229,255,.08)}
.btn{border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:all .2s;font-size:15px;padding:10px 20px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.bp{background:var(--ac);color:#000}.bp:hover{opacity:.85}.bp:disabled{opacity:.4;cursor:not-allowed}
.bs{background:transparent;border:1px solid var(--bd);color:var(--tx1)}.bs:hover{border-color:var(--ac)}
.bdn{background:var(--dn);color:#fff}
.bok{background:var(--ok);color:#000}
.input{width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;color:var(--tx1);font-size:15px;outline:none;transition:border .2s;resize:vertical;font-family:inherit}
.input:focus{border-color:var(--ac)}
.input[data-nopaste]{-webkit-user-select:text;user-select:text}
.lbl{font-size:12px;letter-spacing:2px;color:var(--ac);text-transform:uppercase;font-weight:700}
.tag{display:inline-block;padding:3px 10px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.15);border-radius:20px;font-size:11px;color:var(--ac);font-weight:600}
.mono{font-family:'JetBrains Mono','Fira Code',monospace}
.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:640px){.rgrid{grid-template-columns:repeat(2,1fr)}}
.sgrid{display:grid;gap:12px}
.sub-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:20px;cursor:pointer;transition:all .2s;position:relative;text-align:center}
.sub-card:hover,.sub-card.sel{border-color:var(--ac);background:rgba(0,229,255,.02)}
.statbox{background:var(--s2);border-radius:12px;padding:14px;text-align:center}
.statval{font-size:26px;font-weight:800;font-family:'JetBrains Mono',monospace}
.statlbl{font-size:11px;color:var(--tx3);margin-top:3px;text-transform:uppercase;letter-spacing:1px}
.pbar{height:4px;background:var(--s3);border-radius:4px;overflow:hidden}.pfill{height:100%;border-radius:4px;transition:width .6s}
.diff{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px}
.diff-beginner,.diff-Beginner{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.diff-intermediate,.diff-Intermediate{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2)}
.diff-advanced,.diff-Advanced{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.diff-expert,.diff-Expert{background:rgba(139,92,246,.1);color:#8b5cf6;border:1px solid rgba(139,92,246,.2)}
.eval-card{background:var(--s2);border-radius:10px;padding:12px;margin-bottom:10px;border-left:3px solid var(--ac)}
.badge-card{border:2px solid;border-radius:12px;padding:8px 16px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:2px;text-align:center;font-family:'JetBrains Mono',monospace}
.loader{width:18px;height:18px;border:2px solid transparent;border-top-color:currentColor;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.rec-ring{width:56px;height:56px;border-radius:50%;border:2px solid var(--tx3);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .2s}
.rec-ring.active{border-color:var(--dn);animation:pulse 1.2s infinite;background:rgba(255,82,82,.1)}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,82,82,.4)}50%{box-shadow:0 0 0 12px rgba(255,82,82,0)}}
.home-btn{position:fixed;top:14px;left:14px;z-index:50;background:var(--s2);border:1px solid var(--bd);color:var(--tx2);padding:6px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;transition:all .2s}
.home-btn:hover{border-color:var(--ac);color:var(--ac)}
.fadeUp{animation:fadeUp .5s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.heatmap-cell{width:100%;aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace}
.nav-tabs{display:flex;gap:4px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px}
.nav-tab{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;background:var(--s2);color:var(--tx2);border:1px solid var(--bd)}
.nav-tab.active{background:rgba(0,229,255,.1);color:var(--ac);border-color:var(--ac)}
.nav-tab:hover{border-color:var(--ac)}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:220px;background:var(--s1);border-right:1px solid var(--bd);padding:20px 0;z-index:40;overflow-y:auto}
.sidebar-item{padding:10px 20px;font-size:14px;color:var(--tx2);cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .15s}
.sidebar-item:hover{background:rgba(0,229,255,.05);color:var(--tx1)}
.sidebar-item.active{color:var(--ac);background:rgba(0,229,255,.08);border-right:2px solid var(--ac)}
.main-with-sidebar{margin-left:220px}
@media(max-width:768px){.sidebar{display:none}.main-with-sidebar{margin-left:0}}
.tooltip{position:relative;cursor:help}.tooltip:hover::after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--s3);color:var(--tx1);padding:6px 10px;border-radius:6px;font-size:10px;white-space:nowrap;z-index:99}
.strength-bar{height:4px;border-radius:4px;transition:all .3s}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:60;display:flex;align-items:center;justify-content:center}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:32px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}

/* ── TOAST NOTIFICATIONS ── */
.toast-wrap{position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:360px;pointer-events:none}
.toast{display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:14px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:toastIn .35s cubic-bezier(.34,1.56,.64,1) both;pointer-events:all;cursor:default;font-size:13px;font-weight:600;color:#e8eaf6}
.toast-success{background:rgba(0,224,150,.13);border:1px solid rgba(0,224,150,.4);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(0,224,150,.1)}
.toast-error{background:rgba(255,82,82,.13);border:1px solid rgba(255,82,82,.4);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(255,82,82,.1)}
.toast-warning{background:rgba(255,171,64,.13);border:1px solid rgba(255,171,64,.4);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(255,171,64,.1)}
.toast-info{background:rgba(0,229,255,.10);border:1px solid rgba(0,229,255,.35);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(0,229,255,.08)}
.toast-icon{font-size:18px;flex-shrink:0}
.toast-msg{flex:1;line-height:1.4}
.toast-close{font-size:18px;opacity:.45;transition:opacity .15s;flex-shrink:0;background:none;border:none;color:#e8eaf6;cursor:pointer;padding:0 2px;line-height:1}
.toast-close:hover{opacity:1}
@keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastOut{to{opacity:0;transform:translateX(60px) scale(.9)}}

/* ── CONFIRM DIALOG ── */
.confirm-backdrop{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeUp .2s ease}
.confirm-box{background:linear-gradient(145deg,#111827,#0a0e1a);border:1px solid #1e2536;border-radius:22px;padding:40px 36px;max-width:420px;width:90%;box-shadow:0 32px 80px rgba(0,0,0,.7),0 0 0 1px rgba(0,229,255,.06),inset 0 1px 0 rgba(255,255,255,.04);text-align:center;animation:confirmPop .3s cubic-bezier(.34,1.56,.64,1) both}
.confirm-emoji{font-size:48px;margin-bottom:16px;display:block}
.confirm-title{font-size:18px;font-weight:800;color:#e8eaf6;margin-bottom:8px;line-height:1.3}
.confirm-sub{font-size:12px;color:#5a6380;margin-bottom:28px;line-height:1.6}
.confirm-btns{display:flex;gap:12px}
.confirm-cancel{flex:1;padding:13px 0;font-size:13px;font-weight:700;border-radius:12px;background:var(--s2);border:1px solid var(--bd);color:var(--tx2);cursor:pointer;transition:all .2s}
.confirm-cancel:hover{border-color:var(--ac);color:var(--ac)}
.confirm-ok{flex:1;padding:13px 0;font-size:13px;font-weight:700;border-radius:12px;border:none;cursor:pointer;transition:all .2s}
.confirm-ok-logout{background:linear-gradient(135deg,#00e5ff,#00b4cc);color:#000;box-shadow:0 4px 20px rgba(0,229,255,.35)}
.confirm-ok-logout:hover{box-shadow:0 6px 28px rgba(0,229,255,.5);transform:translateY(-1px)}
.confirm-ok-delete{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 4px 20px rgba(239,68,68,.35)}
.confirm-ok-delete:hover{box-shadow:0 6px 28px rgba(239,68,68,.5);transform:translateY(-1px)}
.confirm-ok-default{background:linear-gradient(135deg,#00e5ff,#00b4cc);color:#000;box-shadow:0 4px 20px rgba(0,229,255,.35)}
@keyframes confirmPop{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
`;
