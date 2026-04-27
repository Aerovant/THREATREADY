import { useState, useEffect, useRef, useCallback } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { SCENARIOS } from './cyberprep-database.js';
import.meta.env.VITE_ANTHROPIC_API_KEY

/* ═══════════════════════════════════════════════════════════════
   CYBERPREP v4 — Attack Reasoning Lab (COMPLETE)
   12 Roles · 4 Difficulty Levels · Adaptive AI · B2C + B2B
   Dynamic Hooks · Anti-Gaming · Full Dashboard Suite
   ═══════════════════════════════════════════════════════════════ */

// ── ROLES ──
const ROLES = [
  { id: "cloud", name: "Cloud Security", icon: "☁️", color: "#00d4ff", desc: "AWS/Azure/GCP security, cloud-native defense, multi-cloud IR", price: 399 },
  { id: "devsecops", name: "DevSecOps", icon: "🔧", color: "#ff6b35", desc: "CI/CD pipeline security, container hardening, IaC scanning", price: 399 },
  { id: "appsec", name: "Application Security", icon: "🛡️", color: "#a855f7", desc: "OWASP Top 10, secure code review, API security, threat modeling", price: 399 },
  { id: "netsec", name: "Network Security", icon: "🌐", color: "#22c55e", desc: "Zero trust networking, firewall architecture, IDS/IPS, forensics", price: 399 },
  { id: "prodsec", name: "Product Security", icon: "📦", color: "#f59e0b", desc: "Security design reviews, SDL lifecycle, risk assessment", price: 399 },
  { id: "secarch", name: "Security Architect", icon: "🏗️", color: "#ec4899", desc: "Enterprise security design, zero trust, frameworks, governance", price: 399 },
  { id: "dfir", name: "DFIR & Incident Response", icon: "🔍", color: "#ef4444", desc: "Digital forensics, malware analysis, incident handling", price: 399 },
  { id: "grc", name: "GRC & Compliance", icon: "📋", color: "#06b6d4", desc: "ISO 27001, SOC2, NIST, PCI-DSS, risk management", price: 399 },
  { id: "soc", name: "SOC Analyst", icon: "📡", color: "#8b5cf6", desc: "SIEM triage, alert analysis, threat detection, log correlation", price: 399 },
  { id: "threat", name: "Threat Hunter", icon: "🎯", color: "#f97316", desc: "Proactive threat detection, hypothesis-driven hunting", price: 399 },
  { id: "red", name: "Red Team", icon: "🔴", color: "#dc2626", desc: "Adversary simulation, exploitation, privilege escalation", price: 399 },
  { id: "blue", name: "Blue Team", icon: "🔵", color: "#2563eb", desc: "Detection engineering, SOAR, threat response automation", price: 399 }
];

const DIFFICULTIES = [
  { id: "beginner", name: "Beginner", color: "#22c55e", icon: "🌱", hints: true, time: "5-8 min", questions: 5 },
  { id: "intermediate", name: "Intermediate", color: "#f59e0b", icon: "⚡", hints: "reduced", time: "10-14 min", questions: 5 },
  { id: "advanced", name: "Advanced", color: "#ef4444", icon: "🔥", hints: "minimal", time: "12-18 min", questions: 5 },
  { id: "expert", name: "Expert", color: "#8b5cf6", icon: "💎", hints: false, time: "15-20 min", questions: 5 }
];

// ── HOOK COPY POOL (Randomized on each refresh) ──
const HOOK_HEADLINES = [
  "Your Attack Reasoning Matters More Than Your Certifications",
  "Prove How You Think Under Fire — Not Just What You Know",
  "Decision-Making Under Attack. That's What Gets You Hired.",
  "Stop Memorizing Frameworks. Start Reasoning Through Attacks.",
  "The Interview That Tests What Certifications Can't Measure"
];

const HOOK_SUBLINES = [
  "You Have 2 Minutes. What's Your Move?",
  "Show Us How You'd Stop This Attack",
  "What Would You Do in the First 60 Seconds?",
  "Prove Your Attack Reasoning Right Now",
  "Real Attack. Real Decision. 2 Minutes.",
  "How Would You Contain This?",
  "Your Next Interview Starts Here",
  "Think Like They're Already Inside",
  "Can You See What They See?",
  "One Scenario. One Chance. Go."
];

// ── NODE TYPES ──
const NT = { threat: { bg: "#3a1a2a", bd: "#f44336", ic: "☠️" }, cloud: { bg: "#0d2137", bd: "#4FC3F7", ic: "☁️" }, iam: { bg: "#3a1a1a", bd: "#ff5252", ic: "🔐" }, vault: { bg: "#1a3a3a", bd: "#00BCD4", ic: "🔒" }, db: { bg: "#1a2a3a", bd: "#9C27B0", ic: "🗄️" }, storage: { bg: "#2a2a1a", bd: "#FF9800", ic: "📦" }, siem: { bg: "#2a1a3a", bd: "#7C4DFF", ic: "📊" }, user: { bg: "#1a2a2a", bd: "#00BCD4", ic: "👤" }, api: { bg: "#2a1a2a", bd: "#AB47BC", ic: "🔌" }, waf: { bg: "#1a2a1a", bd: "#4CAF50", ic: "🛡️" }, lambda: { bg: "#1a2a1a", bd: "#FF9800", ic: "⚡" }, compute: { bg: "#1a3a2a", bd: "#66BB6A", ic: "💻" }, k8s: { bg: "#0d1f3c", bd: "#326CE5", ic: "☸️" }, pam: { bg: "#3a1a2a", bd: "#E91E63", ic: "🔑" }, cicd: { bg: "#1a3a5c", bd: "#2196F3", ic: "⚙️" }, registry: { bg: "#1a2a2a", bd: "#26A69A", ic: "📋" }, policy: { bg: "#2a2a1a", bd: "#FFCA28", ic: "📜" }, monitor: { bg: "#1a1a2a", bd: "#7E57C2", ic: "👁️" }, network: { bg: "#1a1a3a", bd: "#5C6BC0", ic: "🔗" }, firewall: { bg: "#2a2a1a", bd: "#FF6F00", ic: "🧱" }, dns: { bg: "#1a3a1a", bd: "#43A047", ic: "🌐" }, c2: { bg: "#3a0a0a", bd: "#D50000", ic: "💀" }, vpn: { bg: "#1a2a2a", bd: "#0288D1", ic: "🔒" }, endpoint: { bg: "#2a2a2a", bd: "#78909C", ic: "🖥️" }, ad: { bg: "#2a1a1a", bd: "#EF5350", ic: "🏛️" }, container: { bg: "#0d2137", bd: "#0097A7", ic: "🐳" } };

// ── DEMO QUESTIONS (Randomized) ──
const DEMO_QUESTIONS = [
  { q: "An attacker has stolen AWS STS tokens from a developer's laptop. What's your first containment action and why?", ca: "Cloud Security · Incident Response" },
  { q: "50,000 failed logins in 1 hour from 200 unique IPs. Is this credential stuffing or password spraying? How do you tell?", ca: "SOC Analysis · Threat Detection" },
  { q: "Ransomware is actively encrypting file shares. What are your first 3 actions in the next 60 seconds?", ca: "DFIR · Incident Response" },
  { q: "A CI/CD pipeline has been compromised via a poisoned GitHub Actions workflow. How does this bypass code review?", ca: "DevSecOps · Supply Chain" },
  { q: "Your GraphQL API has introspection enabled in production. An attacker just discovered your full schema. What's the risk?", ca: "Application Security · API" },
  { q: "Terraform state file in S3 contains plaintext database passwords. How did this happen and what's your remediation plan?", ca: "DevSecOps · IaC Security" },
  { q: "An OAuth redirect_uri validation flaw allows authorization code interception. Walk through the attack chain.", ca: "Application Security · OAuth" },
  { q: "SSRF in a microservice reaches internal admin APIs via service mesh localhost trust. How do you prevent lateral movement?", ca: "Network Security · Zero Trust" },
  { q: "A container image from Docker Hub contains a cryptominer. It passed your Trivy scan. Why?", ca: "DevSecOps · Container Security" },
  { q: "CloudTrail shows AssumeRole calls from an OIDC provider you don't recognize. What's happening?", ca: "Cloud Security · IAM" }
];


const TOTAL_SC = Object.values(SCENARIOS).reduce((s, a) => s + a.length, 0);
// ── CSS ──
const CSS = `
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
// ── TOAST & CONFIRM SYSTEM ──
let _showToast = null;
let _showConfirm = null;
const showToast = (msg, type = 'info') => _showToast && _showToast(msg, type);
const showConfirm = (msg, onYes, onNo) => _showConfirm && _showConfirm(msg, onYes, onNo);

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  _showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  _showConfirm = (msg, onYes, onNo) => setConfirm({ msg, onYes, onNo });

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const isLogout = (msg) => msg.toLowerCase().includes('logout');
  const isDelete = (msg) => msg.toLowerCase().includes('delete');

  return (
    <>
      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type || 'info'}`}>
            <span className="toast-icon">{icons[t.type] || 'ℹ️'}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>

      {/* ── CONFIRM DIALOG ── */}
      {confirm && (
        <div className="confirm-backdrop"
          onClick={e => e.target === e.currentTarget && (confirm.onNo?.(), setConfirm(null))}>
          <div className="confirm-box">
            <span className="confirm-emoji">
              {isLogout(confirm.msg) ? '👋' : isDelete(confirm.msg) ? '🗑️' : '⚠️'}
            </span>
            <div className="confirm-title">{confirm.msg}</div>
            <div className="confirm-sub">
              {isLogout(confirm.msg)
                ? 'You will be signed out and redirected to the home page.'
                : isDelete(confirm.msg)
                  ? 'This action is permanent and cannot be undone.'
                  : 'Please confirm to proceed with this action.'}
            </div>
            <div className="confirm-btns">
              <button className="confirm-cancel"
                onClick={() => { confirm.onNo?.(); setConfirm(null); }}>
                Cancel
              </button>
              <button className={`confirm-ok ${isDelete(confirm.msg) ? 'confirm-ok-delete' : 'confirm-ok-logout'}`}
                onClick={() => { confirm.onYes?.(); setConfirm(null); }}>
                {isLogout(confirm.msg) ? 'Yes, Logout'
                  : isDelete(confirm.msg) ? 'Yes, Delete'
                    : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── VOICE HOOK ──
function useVoice() {
  const [recording, setRec] = useState(false);
  const [transcript, setTr] = useState("");
  const recRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const manuallyStopped = useRef(false);

  const startRecognition = useCallback(() => {
    if (manuallyStopped.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.log("Speech recognition not supported"); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';  // Explicit language for better accuracy
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += text + ' ';
        } else {
          interim += text;
        }
      }
      setTr(finalTranscriptRef.current + interim);
    };

    r.onend = () => {
      // Auto-restart on silence (browsers auto-stop after ~10sec of silence)
      // Only restart if user hasn't manually clicked stop
      if (!manuallyStopped.current) {
        setTimeout(() => {
          if (!manuallyStopped.current) {
            startRecognition();
          }
        }, 100);
      } else {
        setRec(false);
        recRef.current = null;
      }
    };

    r.onerror = (e) => {
      console.log("Speech error:", e.error);
      // Permission denied or service unavailable - stop completely
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        manuallyStopped.current = true;
        setRec(false);
        recRef.current = null;
      }
      // For 'no-speech', 'aborted', or 'network' - let onend handle restart
    };

    try {
      r.start();
      recRef.current = r;
    } catch (err) {
      console.log("Failed to start recognition:", err.message);
    }
  }, []);

  const start = useCallback(() => {
    manuallyStopped.current = false;
    setRec(true);
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    manuallyStopped.current = true;
    setRec(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    manuallyStopped.current = true;
    finalTranscriptRef.current = "";
    setTr("");
    setRec(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
      recRef.current = null;
    }
  }, []);

  // Allow user to manually edit the transcript (fix recognition errors)
  const setTranscript = useCallback((text) => {
    finalTranscriptRef.current = text + ' ';  // sync internal ref so voice continues from edit point
    setTr(text);
  }, []);

  return { recording, transcript, start, stop, reset, setTranscript };
}

// ── DISABLE COPY PASTE ──
function noPaste(e) { e.preventDefault(); }
function NoPasteInput({ value, onChange, ...props }) {
  return <textarea className="input" value={value} onChange={onChange} onPaste={noPaste} onCopy={noPaste} onCut={noPaste} {...props} />;
}

// ── FILE UPLOAD ──
function FileUpload({ onUpload, label }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const extractPdfText = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
          }
          resolve(fullText);
        } catch (err) {
          resolve('');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handle = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);

    try {
      let extractedText = '';

      if (f.type === 'application/pdf') {
        extractedText = await extractPdfText(f);
      } else if (f.name.endsWith('.txt')) {
        extractedText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result);
          reader.readAsText(f);
        });
      } else {
        // DOC/DOCX - send to backend
        const formData = new FormData();
        formData.append('resume', f);
        const token = localStorage.getItem('token');
        const res = await fetch('https://threatready-db.onrender.com/api/resume/extract', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        extractedText = data.text || '';
      }

      if (!extractedText.trim()) {
        showToast('Could not read file. Try PDF or TXT format.', 'warning');
        setUploading(false);
        return;
      }

      // Send to backend for AI extraction
      const resumeToken = localStorage.getItem('token');
      const resumeResp = await fetch("https://threatready-db.onrender.com/api/resume/parse-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (resumeToken || '')
        },
        body: JSON.stringify({ text: extractedText })
      });
      const resumeData = await resumeResp.json();
      const keyPoints = resumeData.key_points || extractedText.substring(0, 500);
      // Pass full AI data so parent can display skills, recommendations, etc.
      onUpload(keyPoints, resumeData);

    } catch (err) {
      console.error(err);
      showToast('Upload failed: ' + err.message, 'error');
    }
    setUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <button
        className="btn bs"
        style={{ fontSize: 12, padding: "6px 12px" }}
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        {uploading ? '⏳ Analyzing...' : `📎 ${label || "Upload File"}`}
      </button>
      <span style={{ fontSize: 12, color: "var(--tx2)", fontWeight: 600 }}>PDF · TXT · DOC</span>
      <input ref={ref} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={handle} />
    </div>
  );
}
// ── ARCHITECTURE DIAGRAM ──
function ArchDiagram({ nodes, edges, zoom = 1 }) {
  const [z, setZ] = useState(zoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  if (!nodes?.length) return null;
  const maxX = Math.max(...nodes.map(n => n.x)) + 120;
  const maxY = Math.max(...nodes.map(n => n.y)) + 80;

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setZ(p => Math.min(2, p + 0.2))}>+</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setZ(p => Math.max(0.5, p - 0.2))}>-</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => { setZ(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        <span style={{ fontSize: 11, color: "var(--tx2)", marginLeft: 4 }}>{Math.round(z * 100)}%</span>
      </div>
      <div style={{ overflow: "hidden", borderRadius: 10, background: "var(--s2)", border: "1px solid var(--bd)", cursor: "grab" }}
        onMouseDown={e => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={e => { if (!dragging.current) return; setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y })); lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}>
        <svg viewBox={`0 0 ${maxX} ${maxY}`} style={{ width: "100%", height: 200, transform: `scale(${z}) translate(${pan.x / z}px, ${pan.y / z}px)`, transformOrigin: "center" }}>
          <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#ff5252" /></marker></defs>

          {/* PASS 1: Draw edge lines (connecting nodes) */}
          {edges?.map((e, i) => {
            const from = nodes.find(n => n.id === e.f), to = nodes.find(n => n.id === e.t);
            if (!from || !to) return null;
            return (
              <line key={`line-${i}`}
                x1={from.x + 50} y1={from.y + 25}
                x2={to.x + 50} y2={to.y + 25}
                stroke={e.a ? "#ff5252b0" : "#ffffff30"}
                strokeWidth={e.a ? 2 : 1}
                markerEnd={e.a ? "url(#ah)" : ""}
              />
            );
          })}

          {/* PASS 2: Draw nodes (boxes with icon and label) */}
          {nodes.map(n => {
            const t = NT[n.t] || NT.compute;
            return <g key={n.id}>
              <rect x={n.x} y={n.y} width={100} height={50} rx={6} fill={t.bg} stroke={t.bd} strokeWidth={1.5} />
              <text x={n.x + 50} y={n.y + 20} fill="#fff" fontSize="16" textAnchor="middle">{t.ic}</text>
              <text x={n.x + 50} y={n.y + 38} fill="#e8eaf6" fontSize="11" fontWeight="600" textAnchor="middle">{n.l}</text>
            </g>;
          })}

          {/* PASS 3: Draw edge LABELS LAST — text only with outline, no box */}
          {edges?.map((e, i) => {
            const from = nodes.find(n => n.id === e.f), to = nodes.find(n => n.id === e.t);
            if (!from || !to) return null;
            const label = e.l || '';
            if (!label) return null;

            // Node centers
            const fromCx = from.x + 50;
            const fromCy = from.y + 25;
            const toCx = to.x + 50;
            const toCy = to.y + 25;

            // Midpoint of the connecting line
            const mx = (fromCx + toCx) / 2;
            const my = (fromCy + toCy) / 2;

            // Calculate perpendicular offset to push label OFF the line and away from boxes
            const dx = toCx - fromCx;
            const dy = toCy - fromCy;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            // Perpendicular unit vector (90° rotation)
            let perpX = -dy / len;
            let perpY = dx / len;

            // Always position label "above" the line in screen coordinates
            if (perpY > 0) {
              perpX = -perpX;
              perpY = -perpY;
            }

            // Offset distance — push label away from line
            const offsetDistance = 18;
            const labelX = mx + perpX * offsetDistance;
            const labelY = my + perpY * offsetDistance;

            return (
              <text
                key={`label-${i}`}
                x={labelX}
                y={labelY}
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  paintOrder: 'stroke',
                  stroke: '#0a0e1a',
                  strokeWidth: '4px',
                  strokeLinejoin: 'round',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >{label}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── PASSWORD STRENGTH ──
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = (password.length >= 8 ? 1 : 0) + (password.length >= 12 ? 1 : 0) + (/[A-Z]/.test(password) ? 1 : 0) + (/[0-9]/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const levels = [{ l: "Weak", c: "#ff5252" }, { l: "Fair", c: "#ffab40" }, { l: "Good", c: "#f59e0b" }, { l: "Strong", c: "#22c55e" }, { l: "Very Strong", c: "#00e096" }];
  const level = levels[Math.min(score - 1, 4)] || levels[0];
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="strength-bar" style={{ width: "100%", background: "var(--s3)" }}>
        <div className="strength-bar" style={{ width: `${score * 20}%`, background: level.c }} />
      </div>
      <div style={{ fontSize: 11, color: level.c, marginTop: 3 }}>{level.l}</div>
    </div>
  );
}

// ── TIME FORMAT ──
const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// ── AI AVATAR COMPONENT — Static Avatar with Audio Wave Visualizer ──
function AIAvatar({ isSpeaking, isMuted, qIndex }) {
  const isFemale = qIndex % 2 === 0;
  const accentColor = isFemale ? "#ff6b9d" : "#00e5ff";
  const name = isFemale ? "ARIA" : "NEXUS";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 0 }}>
      <div style={{ position: "relative", width: 150, height: 170 }}>

        {/* Outer pulse ring when speaking */}
        {isSpeaking && !isMuted && (
          <>
            <div style={{
              position: "absolute", inset: -10, borderRadius: 16,
              border: `2px solid ${accentColor}`,
              animation: "avatarRing 1s ease-in-out infinite",
              opacity: 0.6, pointerEvents: "none"
            }} />
            <div style={{
              position: "absolute", inset: -20, borderRadius: 20,
              border: `1px solid ${accentColor}`,
              animation: "avatarRing 1s ease-in-out infinite 0.3s",
              opacity: 0.3, pointerEvents: "none"
            }} />
          </>
        )}

        {/* Static Avatar Card */}
        <div style={{
          width: 150, height: 170, borderRadius: 12,
          overflow: "hidden", position: "relative",
          border: `2px solid ${isSpeaking ? accentColor : "#1e2536"}`,
          transition: "border-color 0.3s, box-shadow 0.3s",
          background: `linear-gradient(135deg, ${isFemale ? "rgba(255,107,157,0.08)" : "rgba(0,229,255,0.08)"}, rgba(10,14,26,0.9))`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: isSpeaking && !isMuted
            ? `0 0 30px ${isFemale ? "rgba(255,107,157,0.4)" : "rgba(0,229,255,0.4)"}`
            : "0 4px 20px rgba(0,0,0,0.5)"
        }}>

          {/* Avatar Icon (static) */}
          <div style={{
            fontSize: 50, marginBottom: 6,
            opacity: isMuted ? 0.3 : 1,
            filter: isSpeaking && !isMuted ? "none" : "grayscale(0.2)"
          }}>
            {isFemale ? "👩‍💼" : "👨‍💼"}
          </div>

          {/* Name */}
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
            color: isSpeaking && !isMuted ? accentColor : "#8890b0",
            marginBottom: 8, transition: "color 0.3s"
          }}>
            {name}
          </div>

          {/* Status / Audio Wave */}
          <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            {isSpeaking && !isMuted ? (
              // Active audio waves (larger, more prominent)
              [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} style={{
                  width: 3, borderRadius: 3,
                  background: accentColor,
                  animation: `soundBar${i % 3 + 1} ${0.35 + (i % 4) * 0.08}s ease-in-out infinite alternate`,
                  height: 14
                }} />
              ))
            ) : (
              // Idle state
              <div style={{ fontSize: 11, color: "#5a6380", letterSpacing: 1 }}>
                {isMuted ? "MUTED" : "READY"}
              </div>
            )}
          </div>

          {/* Dark overlay when muted */}
          {isMuted && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, pointerEvents: "none"
            }}>🔇</div>
          )}
        </div>

        {/* Muted badge */}
        {isMuted && (
          <div style={{
            position: "absolute", top: -8, right: -8,
            width: 26, height: 26, borderRadius: "50%",
            background: "#ff5252", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 12, border: "2px solid #0a0e1a"
          }}>🔇</div>
        )}
      </div>
    </div>
  );
}
// ── RANDOM PICK ──
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ThreatReady() {
  // ── CORE STATE ──

  const [view, setViewState] = useState(() => {
    // ── CANDIDATE ASSESSMENT LINK — check FIRST before any other routing ──
    // Handles all these URL formats:
    //   /?assess_token=xxx              (current server format)
    //   /?token=xxx                     (on /assess path)
    //   /assess?token=xxx               (old format)
    //   /?redirect=/assess?token=xxx    (GitHub Pages 404 fallback)
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    // Check redirect param from GitHub Pages 404 fallback
    const redirect = params.get('redirect');
    if (redirect) {
      const redirectParams = new URLSearchParams(redirect.split('?')[1] || '');
      const tokenFromRedirect = redirectParams.get("assess_token") || redirectParams.get("token");
      if (tokenFromRedirect && (redirect.includes('/assess') || redirectParams.get("assess_token"))) {
        return 'candidate-assess';
      }
    }

    const assessToken = params.get("assess_token") || (path.includes('/assess') ? params.get("token") : null);
    if (assessToken) return 'candidate-assess';

    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('cyberprep_user');
    const savedUserType = localStorage.getItem('cyberprep_usertype');
    const isFreeTrial = localStorage.getItem('cyberprep_freetrial') === 'true';

    if (token && savedUser) {
      const savedView = localStorage.getItem('cyberprep_view');
      if (savedView && !['interview', 'results', 'auth', 'landing'].includes(savedView)) {
        return savedView;
      }
      return savedUserType === 'b2b' ? 'b2b-dashboard' : 'dashboard';
    }

    // Free trial user — no token but has trial flag
    if (isFreeTrial) {
      const savedView = localStorage.getItem('cyberprep_view');
      if (savedView && !['interview', 'results', 'auth', 'landing'].includes(savedView)) {
        return savedView;
      }
      return 'dashboard';
    }

    return 'landing';
  });

  const setView = (newView) => {
    // Don't save interview/results to localStorage - can't restore these
    if (!['interview', 'results'].includes(newView)) {
      localStorage.setItem('cyberprep_view', newView);
    }
    setViewState(newView);
  };


  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cyberprep_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userType, setUserType] = useState(() => localStorage.getItem('cyberprep_usertype') || "b2c");
  const [authMode, setAuthMode] = useState("signup");
  const [authStep, setAuthStep] = useState("form"); // form, verify, detect, roleselect, forgot, resetcode, resetdone
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // ── SUBSCRIPTION ──
  const [subscribedRoles, setSubscribedRoles] = useState(() => {
    const saved = localStorage.getItem('subscribedRoles');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isPaid, setIsPaid] = useState(() => {
    // If user is on free trial, they're NEVER paid (regardless of stale localStorage)
    if (localStorage.getItem('cyberprep_freetrial') === 'true') {
      localStorage.removeItem('isPaid'); // clean up stale flag
      return false;
    }
    return localStorage.getItem('isPaid') === 'true';
  });
  const [freeAttempts, setFreeAttempts] = useState(2);
  // Per-role attempts tracking for free trial (2 attempts per role)
  const [roleAttempts, setRoleAttempts] = useState(() => {
    const saved = localStorage.getItem('roleAttempts');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem('roleAttempts', JSON.stringify(roleAttempts));
  }, [roleAttempts]);
  const getTotalUsedAttempts = () => Object.values(roleAttempts).reduce((sum, v) => sum + v, 0);
  const getRemainingAttempts = (roleId) => {
    const totalUsed = getTotalUsedAttempts();
    const totalRemaining = Math.max(0, 2 - totalUsed);
    return totalRemaining;
  };
  const isTrialExhausted = () => {
    if (isPaid || subscribedRoles.length === 0) return false;
    return getTotalUsedAttempts() >= 2;
  };
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [trialRoles, setTrialRoles] = useState(() => {
    const saved = localStorage.getItem('trialRoles');
    return saved ? JSON.parse(saved) : [];
  });

  // ── SCENARIO STATE ──
  const [activeRole, setActiveRole] = useState(null);
  const [interviewPersona, setInterviewPersona] = useState('standard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);  const [dailyAnswered, setDailyAnswered] = useState(false);
  const [dailyChallengeError, setDailyChallengeError] = useState(false);
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [dailyResult, setDailyResult] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [scenarioHistory, setScenarioHistory] = useState([]);
  // Local in-memory session history (works for free trial users who have no backend account)
  // Persisted to localStorage so data survives refresh
  const [localSessionHistory, setLocalSessionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_local_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('cyberprep_local_sessions', JSON.stringify(localSessionHistory));
  }, [localSessionHistory]);
  const [activeDifficulty, setActiveDifficulty] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [askedQs, setAskedQs] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showChain, setShowChain] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [elapsed, setElapsed] = useState(0);
  // Tab switch / focus loss tracking (anti-cheating)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showEjectedModal, setShowEjectedModal] = useState(false);
  const timerRef = useRef(null);
  const voice = useVoice();

  // ── DEMO STATE ──
  const [demoQ] = useState(() => pick(DEMO_QUESTIONS));
  const [demoAnswer, setDemoAnswer] = useState("");
  const [demoScore, setDemoScore] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoInputMode, setDemoInputMode] = useState("text");

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackInputMode, setFeedbackInputMode] = useState("text");
  const feedbackVoice = useVoice();

  const demoVoice = useVoice();
  // Daily challenge voice + input mode
  const dailyVoice = useVoice();
  const [dailyInputMode, setDailyInputMode] = useState("text");
  // ---------------Mute------------------
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── DYNAMIC HOOKS ──
  const [hookHeadline] = useState(() => pick(HOOK_HEADLINES));
  const [hookSubline] = useState(() => pick(HOOK_SUBLINES));

  // ── PROFILE STATE ──
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeAiData, setResumeAiData] = useState(null); // {skills, recommended_difficulty, weak_areas, recommended_roles}
  const [readiness, setReadiness] = useState(null); // {overall_readiness, technical, communication, decision, total_sessions, has_data}
  const [jdText, setJdText] = useState("");
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('cyberprep_xp') || '0'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('cyberprep_streak') || '0'));
  const [completedScenarios, setCompletedScenarios] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_completed_scenarios');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // Persist stats to localStorage
  useEffect(() => { localStorage.setItem('cyberprep_xp', String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem('cyberprep_streak', String(streak)); }, [streak]);
  useEffect(() => {
    localStorage.setItem('cyberprep_completed_scenarios', JSON.stringify(completedScenarios));
  }, [completedScenarios]);

  // ── AUTH STATE ──
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ── DASHBOARD TABS ──
  const [dashTab, setDashTab] = useState(() => localStorage.getItem('cyberprep_tab') || "home");
  const [b2bTab, setB2bTab] = useState(() => localStorage.getItem('cyberprep_b2btab') || "overview");
  const [settingsName, setSettingsName] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [inLeaderboard, setInLeaderboard] = useState(true);
  const [allowBenchmarking, setAllowBenchmarking] = useState(false);

  // ── B2B STATE ──
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [b2bStats, setB2bStats] = useState({ total_candidates: 0, assessed: 0, total_assessments: 0, avg_score: 0 });
  const [b2bLoading, setB2bLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('cloud');
  const [inviteDiff, setInviteDiff] = useState('intermediate');
  const [inviteAssessmentId, setInviteAssessmentId] = useState('');
  const [inviteMode, setInviteMode] = useState('individual'); // 'individual' | 'multiple' | 'csv'
  const [inviteMultipleEmails, setInviteMultipleEmails] = useState('');
  const [inviteCsvFile, setInviteCsvFile] = useState(null);
  const [inviteParsedEmails, setInviteParsedEmails] = useState([]);
  // Search states
  const [candidatesSearch, setCandidatesSearch] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [reportModal, setReportModal] = useState(null); // holds candidate report data
  const [teamSkillsSearch, setTeamSkillsSearch] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  // Filter helper
  const filterBySearch = (items, search, getName, getEmail, getDate) => {
    if (!search?.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(item => {
      const name = (getName(item) || '').toLowerCase();
      const email = (getEmail(item) || '').toLowerCase();
      const date = (getDate(item) || '').toLowerCase();
      return name.includes(q) || email.includes(q) || date.includes(q);
    });
  };
  const [inviteMsg, setInviteMsg] = useState('');
  const [newAssessName, setNewAssessName] = useState('');
  const [newAssessRole, setNewAssessRole] = useState('cloud');
  const [newAssessDiff, setNewAssessDiff] = useState('intermediate');
  const [newAssessType, setNewAssessType] = useState('standard');
  const [newAssessQuestionCount, setNewAssessQuestionCount] = useState(5);
  const [assessMsg, setAssessMsg] = useState('');
  // ── CANDIDATE ASSESSMENT STATE ──
  const [candidateToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    // Check redirect param (GitHub Pages 404 fallback)
    const redirect = params.get('redirect');
    if (redirect) {
      const redirectParams = new URLSearchParams(redirect.split('?')[1] || '');
      const t = redirectParams.get("assess_token") || redirectParams.get("token");
      if (t) return t;
    }

    return params.get("assess_token") || (path.includes('/assess') ? params.get("token") : "") || "";
  });
  const [candidateAssessState, setCandidateAssessState] = useState('loading');
  const [candidateAssessData, setCandidateAssessData] = useState(null);
  const [candidateAssessError, setCandidateAssessError] = useState('');
  const [candidateQIndex, setCandidateQIndex] = useState(0);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [candidateResult, setCandidateResult] = useState(null);
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('5-10');
  const [companySettingsMsg, setCompanySettingsMsg] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [integrationMsg, setIntegrationMsg] = useState('');

  // ═══════════════════════════════════════════════════════════════
  // B2B HR SUBSCRIPTION STATE (separate from B2C isPaid)
  // ═══════════════════════════════════════════════════════════════
  const [isHrPaid, setIsHrPaid] = useState(() => localStorage.getItem('cyberprep_hr_paid') === 'true');
  const [showHrSubscribeModal, setShowHrSubscribeModal] = useState(false);
  const [hrBillingPeriod, setHrBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [hrModalCompanyName, setHrModalCompanyName] = useState('');
  const [hrModalTeamSize, setHrModalTeamSize] = useState('11-50');

  // HR pricing tiers (FINALIZED)
  // Team Starter: 5-10 people  → ₹2,999/mo
  // Team Pro:     11-50 people → ₹7,999/mo
  // Enterprise:   50+ people   → Custom pricing (Contact Sales)
  // Yearly = Monthly × 12 × 0.8 (20% discount)
  const HR_PRICING = {
    '5-10':    { monthly: 2999,  yearly: 28790,  label: 'Team Starter · 5-10 people', planName: 'Team Starter' },
    '11-50':   { monthly: 7999,  yearly: 76790,  label: 'Team Pro · 11-50 people',    planName: 'Team Pro' },
    '50+':     { monthly: 0,     yearly: 0,      label: 'Enterprise · 50+ people (Contact Sales)', planName: 'Enterprise', contactSales: true }
  };
  const [newAssessJD, setNewAssessJD] = useState('');
  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  // teamMembers is derived from real candidates data
  const teamMembers = candidates
    .filter(c => c.status === 'completed' && c.overall_score)
    .map(c => ({
      id: c.id,
      name: c.candidate_name || c.candidate_email,
      role: c.role_id,
      score: parseFloat(c.overall_score) || 0,
      difficulty: c.difficulty,
      completed_at: c.completed_at
    }));

  // ── SCORE HISTORY (computed from real session history in useEffect) ──
  const [scoreHistory, setScoreHistory] = useState([]);
  const [weaknessTracker, setWeaknessTracker] = useState([]);

  // ── BADGES ──
  // Badges are earned per role by completing assessments with Bronze+ score
  // Computed from backend session history (see useEffect below)
  const [badges, setBadges] = useState([]);



  /// ── LOAD DASHBOARD DATA FROM BACKEND ──
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

// Check subscription on restore
    fetch('https://threatready-db.onrender.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      // Safe parser: subscribed_roles may be a string OR already an array (jsonb)
      const raw = data.user?.subscribed_roles;
      let roles = [];
      if (Array.isArray(raw)) roles = raw;
      else if (typeof raw === 'string') {
        try { const v = JSON.parse(raw); roles = Array.isArray(v) ? v : []; } catch (e) { roles = []; }
      }
      const isActivePaid = data.user?.plan === 'paid' && data.user?.status === 'active';
      if (isActivePaid && roles.length > 0) {
        setIsPaid(true);
        setSubscribedRoles(roles);
        localStorage.setItem('subscribedRoles', JSON.stringify(roles));
        localStorage.setItem('isPaid', 'true');
      } else {
        setIsPaid(false);
        setSubscribedRoles([]);
        localStorage.removeItem('subscribedRoles');
        localStorage.removeItem('isPaid');
      }
      // HR subscription (separate from B2C)
      if (data.user?.hr_subscription_active === true || data.user?.hr_paid === true) {
        setIsHrPaid(true);
        localStorage.setItem('cyberprep_hr_paid', 'true');
      }
    }).catch(err => {
      console.log('Subscription refresh failed, keeping cached values:', err?.message);
    });

    fetch('https://threatready-db.onrender.com/api/scores', {

      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.stats) {
          setXp(data.stats.total_xp || 0);
          setStreak(data.stats.streak || 0);
          try {
            const sc = typeof data.stats.completed_scenarios === 'string'
              ? JSON.parse(data.stats.completed_scenarios)
              : data.stats.completed_scenarios || [];
            setCompletedScenarios(sc);
          } catch (e) { }
        }
      })


      .catch(err => console.log('Dashboard load error:', err));

    // Load profile data — RESUME IS NEVER AUTO-LOADED
    // User must re-upload or re-enter resume each session for fresh start
    // (Career goals like target_role/experience_level are still auto-loaded since they're profile setup)
    fetch('https://threatready-db.onrender.com/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        // Only restore career goals — resume stays empty for fresh experience
        if (data.user?.target_role) setTargetRole(data.user.target_role);
        if (data.user?.experience_level) setExperienceLevel(data.user.experience_level);
        // Resume is intentionally NOT loaded — keeps Profile tab clean on each login
      })
      .catch(err => console.log('Profile load error:', err));

    // Load Interview Readiness Score (real, computed from completed sessions)
    fetch('https://threatready-db.onrender.com/api/readiness', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setReadiness(data);
      })
      .catch(err => console.log('Readiness load error:', err));
  }, [user]);

  // ── B2B DATA LOADER ──
  const loadB2bData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setB2bLoading(true);
    try {
      const [sr, cr, ar] = await Promise.all([
        fetch('https://threatready-db.onrender.com/api/b2b/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://threatready-db.onrender.com/api/b2b/candidates', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://threatready-db.onrender.com/api/b2b/assessments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const stats = await sr.json(); if (!stats.error) setB2bStats(stats);
      const cands = await cr.json(); if (cands.candidates) setCandidates(cands.candidates);
      const assess = await ar.json(); if (assess.assessments) setAssessments(assess.assessments);
    } catch (e) { console.log('B2B load error:', e.message); }
    setB2bLoading(false);
  };
  useEffect(() => {
    if (view === 'b2b-dashboard') {
      loadB2bData();
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://threatready-db.onrender.com/api/b2b/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (data.settings) {
            setCompanyName(data.settings.company_name || '');
            setTeamSize(data.settings.team_size || '5-10');
            setSlackWebhook(data.settings.slack_webhook || '');
            setZapierWebhook(data.settings.zapier_webhook || '');
          }
        }).catch(e => console.log('B2B settings load:', e.message));
      }
    }
  }, [view]);

  // Load leaderboard, notifications, daily challenge, scenario history
  const loadDashboardExtras = async () => {
    const token = localStorage.getItem('token');
    // Only fetch backend data if logged in
    if (token) {
      try {
        const [lbRes, notifRes, dcRes, histRes] = await Promise.all([
          fetch('https://threatready-db.onrender.com/api/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/daily-challenge', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/scenario-history', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const lb = await lbRes.json();
        const notif = await notifRes.json();
        const dc = await dcRes.json();
        const hist = await histRes.json();
        if (lb.leaderboard) { setLeaderboard(lb.leaderboard); setMyRank(lb.my_rank); }
        if (notif.notifications) { setNotifications(notif.notifications); setUnreadCount(notif.unread_count || 0); }
        if (dc.challenge) {
          setDailyChallenge(dc.challenge);
          setDailyAnswered(dc.already_answered);
          setDailyChallengeError(false);
          if (dc.response) setDailyResult(dc.response);
        } else if (dc.error || !dc.challenge) {
          // Backend returned error or no challenge → show error state
          setDailyChallengeError(true);
        }
        if (hist.history) {
          setScenarioHistory(hist.history.map(h => h.scenario_id));
        }
      } catch (e) {
        console.log('Dashboard extras load error:', e.message);
        setDailyChallengeError(true); // Network/fetch failure
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPUTE STATS (badges, score trends, weakness tracker)
  // Works for BOTH logged-in users (backend history) AND free trial users (local history)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Pick whichever history source has data — logged in users get backend, free trial get local
    const token = localStorage.getItem('token');
    let sourceHistory = [];

    if (token) {
      // For logged-in users: ALWAYS fetch fresh history from backend
      fetch('https://threatready-db.onrender.com/api/scenario-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        if (data.history && data.history.length > 0) {
          computeStats(data.history);
        } else {
          // Backend returned empty - fall back to local session history
          computeStats(localSessionHistory);
        }
      }).catch(() => computeStats(localSessionHistory));
    } else {
      // Free trial user (no token): use local session history
      computeStats(localSessionHistory);
    }

    function computeStats(history) {
      if (!history || history.length === 0) {
        setBadges([]);
        setScoreHistory([]);
        setWeaknessTracker([]);
        return;
      }

      // ── Badges ──
      const bestByRole = {};
      history.forEach(h => {
        const score = parseFloat(h.score) || 0;
        if (score < 4) return;
        if (!bestByRole[h.role_id] || score > bestByRole[h.role_id].score) {
          bestByRole[h.role_id] = { score, completed_at: h.completed_at };
        }
      });
      const computedBadges = Object.entries(bestByRole).map(([role_id, data]) => {
        const tier = data.score >= 8 ? "platinum"
                   : data.score >= 7 ? "gold"
                   : data.score >= 6 ? "silver"
                   : "bronze";
        const roleName = ROLES.find(r => r.id === role_id)?.name || role_id;
        const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
        return {
          role: role_id, tier,
          name: `${tierLabel} ${roleName}`,
          earned: data.completed_at ? String(data.completed_at).substring(0, 10) : ''
        };
      });
      setBadges(computedBadges);

      // ── Score Trends ──
      const sortedHistory = [...history].sort((a, b) =>
        new Date(a.completed_at || 0) - new Date(b.completed_at || 0)
      );
      const trendsData = sortedHistory.map((h, i) => {
        const point = { date: `Attempt ${i + 1}` };
        point[h.role_id] = parseFloat(h.score) || 0;
        return point;
      });
      setScoreHistory(trendsData);

      // ── Weakness Tracker ──
      const scoresByRole = {};
      history.forEach(h => {
        const score = parseFloat(h.score) || 0;
        if (!scoresByRole[h.role_id]) scoresByRole[h.role_id] = [];
        scoresByRole[h.role_id].push({ score, completed_at: h.completed_at });
      });
      const weaknesses = Object.entries(scoresByRole).map(([roleId, attempts]) => {
        const avg = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
        let trend = "→";
        if (attempts.length >= 2) {
          const sorted = [...attempts].sort((a, b) => new Date(a.completed_at || 0) - new Date(b.completed_at || 0));
          const first = sorted[0].score;
          const last = sorted[sorted.length - 1].score;
          if (last > first + 0.5) trend = "↑";
          else if (last < first - 0.5) trend = "↓";
        }
        const roleName = ROLES.find(r => r.id === roleId)?.name || roleId;
        return { area: roleName, avg: Math.round(avg * 10) / 10, trend, attempts: attempts.length };
      }).sort((a, b) => a.avg - b.avg);
      setWeaknessTracker(weaknesses);
    }
  }, [localSessionHistory, scenarioHistory, user]);

  useEffect(() => {
    if (view === 'dashboard' || view === 'b2b-dashboard') {
      loadDashboardExtras();
      // Load user settings (privacy preferences)
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://threatready-db.onrender.com/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (data.settings) {
            if (data.settings.profile_public !== undefined) setProfilePublic(data.settings.profile_public);
            if (data.settings.in_leaderboard !== undefined) setInLeaderboard(data.settings.in_leaderboard);
            if (data.settings.allow_benchmarking !== undefined) setAllowBenchmarking(data.settings.allow_benchmarking);
            if (data.settings.name) setSettingsName(data.settings.name);
          }
        }).catch(e => console.log('Settings load:', e.message));
      }

      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        const t = localStorage.getItem('token');
        if (!t) return;
        fetch('https://threatready-db.onrender.com/api/notifications', { headers: { 'Authorization': `Bearer ${t}` } })
          .then(r => r.json())
          .then(data => {
            if (data.notifications) {
              setNotifications(data.notifications);
              setUnreadCount(data.unread_count || 0);
            }
          }).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // ── STOP VOICE ON REFRESH/UNLOAD ──
  useEffect(() => {
    const handleUnload = () => {
      window.speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);


  // ── CANDIDATE ASSESSMENT LOADER ──
  useEffect(() => {
    if (view !== 'candidate-assess' || !candidateToken) return;
    fetch(`https://threatready-db.onrender.com/api/candidate/assessment?token=${candidateToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.error === "already_completed") {
          setCandidateAssessState("already_done");
        } else if (data.error) {
          setCandidateAssessState("error");
          setCandidateAssessError(data.error);
        } else {
          setCandidateAssessData(data);
          setCandidateAssessState("intro");
        }
      })
      .catch(() => {
        setCandidateAssessState("error");
        setCandidateAssessError("Cannot connect to server. Please try again.");
      });
  }, []);

  // ── GITHUB PAGES 404 REDIRECT HANDLER ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.history.replaceState(null, '', redirect);
    }
  }, []);

  // ── OAUTH CALLBACK HANDLER ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");
    const error = params.get("error");
    const provider = params.get("provider") || "google";

    // Skip if this is a candidate assessment link, not OAuth
    if (params.get("assess_token")) return;

    // Only run if URL has OAuth params - ignore on normal refresh
    if (!token && !error) return;

    if (error) {
      setAuthError("Google sign in failed. Please try again.");
      setView("auth");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (token && email) {
      localStorage.setItem("token", token);
      localStorage.setItem('cyberprep_session_start', Date.now().toString());
      const newUser = { name, email };
      localStorage.setItem('cyberprep_user', JSON.stringify(newUser));
      setUser(newUser);
      setSettingsName("");    // ← ADD THIS LINE HERE
      const type = detectUserType(email);

      setUserType(type);
      localStorage.setItem('cyberprep_usertype', type);
      localStorage.setItem('cyberprep_user', JSON.stringify({ name, email }));

      // Clean URL first
      window.history.replaceState({}, "", "/");

      // Show toast
      const toast = document.createElement("div");

      toast.innerHTML = `
      <div style="
        position:fixed; top:24px; left:50%; transform:translateX(-50%);
        background:#111827; border:1px solid #00e5ff;
        border-radius:12px; padding:16px 24px;
        display:flex; align-items:center; gap:12px;
        z-index:9999; box-shadow:0 0 30px rgba(0,229,255,0.2);
        overflow:hidden; min-width:280px;
      ">
        <img src="${provider === 'github' ? 'https://github.com/favicon.ico' : 'https://www.google.com/favicon.ico'}" width="20" height="20" />
        <div>
          <div style="color:#00e5ff;font-weight:700;font-size:13px">${provider === 'github' ? 'GitHub' : 'Google'} Sign In Successful</div>
          <div style="color:#8890b0;font-size:11px;margin-top:2px">Welcome, ${name}!</div>
        </div>

        <div style="color:#00e096;font-size:20px position:absolute; bottom:0; left:0;
          height:3px; background:#00e5ff; border-radius:0 0 12px 12px;
          animation:progress 2s linear forwards;" >✓</div>
        </div>
    `;
      document.body.appendChild(toast);

      // Go to dashboard immediately, toast shows on top
      if (type === "b2b") { setView("b2b-dashboard"); } else { setView("dashboard"); }

      // Remove toast after 2 seconds
      setTimeout(() => {
        toast.remove();
      }, 2000);
    }
  }, []);

  // ── TIMER ──
  useEffect(() => {
    if (view === "interview") {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      return () => {
        clearInterval(timerRef.current);
        window.speechSynthesis.cancel();
      };
    }
    return () => {
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [view]);

  // ── ANTI-CHEAT: Tab Switch / Focus Loss Detection ──
  useEffect(() => {
    if (view !== "interview") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized the window
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 4) {
            // 4th tab switch → eject from attempt
            setShowEjectedModal(true);
            // Auto-redirect to dashboard after showing modal
            setTimeout(() => {
              setShowEjectedModal(false);
              setShowTabWarning(false);
              setView('dashboard');
              setTabSwitchCount(0);
            }, 4000);
          } else {
            // 1st, 2nd, 3rd tab switch → just warning
            setShowTabWarning(true);
            showToast(`⚠️ Tab switch detected! (${newCount}/3) — One more switch will exit your attempt`, "error");
          }
          return newCount;
        });
      }
    };

    const handleBlur = () => {
      // User clicked outside the window (different app)
      if (!document.hidden) {
        showToast("⚠️ Window focus lost — keep this window active during your attempt", "warning");
      }
    };

    // Block right-click context menu (prevents inspect element / save / copy options)
    const handleContextMenu = (e) => { e.preventDefault(); return false; };

    // Block keyboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, F12, Ctrl+Shift+I
    const handleKeyDown = (e) => {
      // Allow typing in input fields
      const tag = e.target.tagName;
      const isInputField = tag === 'TEXTAREA' || tag === 'INPUT';

      // Block dev tools (F12 + Ctrl+Shift+I + Ctrl+Shift+J + Ctrl+U)
      if (e.key === 'F12') { e.preventDefault(); showToast("Dev tools blocked during attempt", "warning"); return; }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        showToast("Dev tools blocked during attempt", "warning");
        return;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return; }

      // Block copy/paste/cut/select-all OUTSIDE input fields (questions can't be copied)
      if (!isInputField && e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [view]);

  // Reset tab switch count when leaving interview
  useEffect(() => {
    if (view !== "interview") {
      setTabSwitchCount(0);
      setShowTabWarning(false);
      setShowEjectedModal(false);
    }
  }, [view]);

  // ── DETECT B2C/B2B ──

  const detectUserType = (email, userFromDB) => {
    console.log('detectUserType called:', email, 'userFromDB:', userFromDB);
    if (userFromDB?.user_type) {
      console.log('Using DB user_type:', userFromDB.user_type);
      return userFromDB.user_type;
    }

    // Check if user has access to a specific role
    const hasRoleAccess = (roleId) => {
      if (subscribedRoles.includes(roleId)) return true;   // paid for this role
      if (freeAttempts > 0 && !isPaid) return true;        // free trial
      return false;
    };

    const personalDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
      "protonmail.com", "icloud.com", "aol.com", "mail.com",
      "yahoo.in", "rediffmail.com", "live.com", "msn.com"
    ];
    const domain = email.split("@")[1]?.toLowerCase();
    console.log('Domain detected:', domain, 'Result:', personalDomains.includes(domain) ? "b2c" : "b2b");
    return personalDomains.includes(domain) ? "b2c" : "b2b";
  };


  // ── AUTH HANDLER ──
  const handleAuth = async (e) => {
    e?.preventDefault();
    setAuthError("");

    if (authMode === "signup") {
      if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }
      if (authPassword.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
      if (!agreeTerms) { setAuthError("Please accept Terms and Privacy Policy"); return; }

      setIsAuthenticating(true);
      try {
        const res = await fetch("https://threatready-db.onrender.com/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || "Signup failed"); return; }

        // OTP will be sent when user picks user type (Hiring/Preparing) — not here
        // This avoids sending OTP twice

        // Go to hiring or preparing choice first
        const detectedType = detectUserType(authEmail, null);
        setUserType(detectedType);
        setAuthStep("detect");

      } catch (err) {
        setAuthError("Cannot connect to server.");
      } finally {
        setIsAuthenticating(false);
      }

    } else {
      // LOGIN
      if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }

      setIsAuthenticating(true);
      try {
        const res = await fetch("https://threatready-db.onrender.com/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || "Login failed"); return; }

        // Save token
        // Clear old user data first
        localStorage.removeItem('cyberprep_user');
        localStorage.removeItem('cyberprep_usertype');

        // Reset all state
        setSettingsName('');
        setResumeText('');
        setTargetRole('');
        setExperienceLevel('');
        setXp(0);
        setStreak(0);
        setCompletedScenarios([]);
        setIsPaid(false);
        setFreeAttempts(2);

        // Save new user
        localStorage.setItem("token", data.token);
        localStorage.setItem('cyberprep_session_start', Date.now().toString());
        localStorage.setItem('cyberprep_user', JSON.stringify(data.user));
        setUser(data.user);
        setSettingsName(data.user.name || '');

        // Check subscription status
        fetch('https://threatready-db.onrender.com/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        }).then(r => r.json()).then(meData => {
          // Only set isPaid TRUE if user actually has active paid plan (not free trial)
          if (meData.user?.plan === 'paid' && meData.user?.status === 'active') {
            setIsPaid(true);
            setUser(data.user);
            setSettingsName(data.user.name || '');
            setSubscribedRoles(JSON.parse(meData.user.subscribed_roles || '[]'));
          } else {
            setIsPaid(false);
            setFreeAttempts(2);
          }
        }).catch(() => { });

        // After login, load subscription data
        const meRes = await fetch("https://threatready-db.onrender.com/api/auth/me", {
          headers: { "Authorization": `Bearer ${data.token}` }
        });
        const meData = await meRes.json();
        if (meData.user?.subscribed_roles) {
          const roles = typeof meData.user.subscribed_roles === 'string'
            ? JSON.parse(meData.user.subscribed_roles)
            : meData.user.subscribed_roles || [];
          setSubscribedRoles(roles);
          // CRITICAL: Only set isPaid TRUE if user has paid plan (NOT just because they have roles)
          // Free trial users also have roles in subscribed_roles, but they are NOT paid
          const isActivelyPaid = meData.user?.plan === 'paid' && meData.user?.status === 'active';
          setIsPaid(isActivelyPaid);
          if (isActivelyPaid) {
            localStorage.setItem('isPaid', 'true');
          } else {
            localStorage.removeItem('isPaid');
          }
        }
        setSettingsName(data.user.name || '');

        const type = detectUserType(authEmail);
        console.log('TYPE DETECTED:', type);
        setUserType(type);
        localStorage.setItem('cyberprep_usertype', type);

        // If user signed up as B2B and entered company info, save it now
        const pendingCompanyName = localStorage.getItem('cyberprep_company_name');
        const pendingTeamSize = localStorage.getItem('cyberprep_team_size');
        if (type === 'b2b' && pendingCompanyName && pendingTeamSize) {
          try {
            await fetch('https://threatready-db.onrender.com/api/settings/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
              body: JSON.stringify({
                name: data.user.name || '',
                company_name: pendingCompanyName,
                team_size: pendingTeamSize
              })
            });
            setCompanyName(pendingCompanyName);
            setTeamSize(pendingTeamSize);
            localStorage.removeItem('cyberprep_company_name');
            localStorage.removeItem('cyberprep_team_size');
            console.log('HR company info saved on login:', pendingCompanyName, pendingTeamSize);
          } catch (e) { console.log('Save company info failed:', e.message); }
        }

        console.log('SETTING VIEW TO:', type === "b2b" ? "b2b-dashboard" : "dashboard");
        if (type === "b2b") { setView("b2b-dashboard"); } else { setView("dashboard"); }

      } catch (err) {
        setAuthError("Cannot connect to server. Is backend running on port 4000?");
      } finally {
        setIsAuthenticating(false);
      }
    }
  };




  // ── VERIFY EMAIL ──
  const verifyEmail = async () => {
    // Send OTP immediately after signup - no detect step needed
    try {
      await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
    } catch (e) {
      console.log('OTP send error:', e.message);
    }
    setOtpCode("");
    setOtpError("");
    setAuthStep("verify");
  };

  // ── CONFIRM USER TYPE ──
 const confirmUserType = async (type) => {
  setUserType(type);
  localStorage.setItem('cyberprep_usertype', type);

  if (type === 'b2b') {
    // B2B Flow: Go to Company Name + Team Size step BEFORE sending OTP
    // Pre-fill if we already have values
    if (!hrModalCompanyName) setHrModalCompanyName(companyName || '');
    if (!hrModalTeamSize) setHrModalTeamSize(teamSize || '5-10');
    setAuthStep("company-info");
    return;
  }

  // B2C Flow: Send OTP directly and go to verify
  try {
    await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: authEmail })
    });
  } catch(e) {}
  setOtpCode("");
  setOtpError("");
  setAuthStep("verify");
};

  // ── CONFIRM COMPANY INFO (B2B step) ──
  const confirmCompanyInfo = async () => {
    if (!hrModalCompanyName.trim()) {
      showToast('Please enter your company name', 'error');
      return;
    }
    if (!hrModalTeamSize) {
      showToast('Please select team size', 'error');
      return;
    }
    // Save to state and localStorage so HR dashboard knows company info
    setCompanyName(hrModalCompanyName);
    setTeamSize(hrModalTeamSize);
    localStorage.setItem('cyberprep_company_name', hrModalCompanyName);
    localStorage.setItem('cyberprep_team_size', hrModalTeamSize);

    // Send OTP and go to verify step
    try {
      await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
    } catch(e) {}
    setOtpCode("");
    setOtpError("");
    setAuthStep("verify");
  };

  // ── SCENARIO LOGIC ──

  const startScenario = async (sc, diff) => {
    // ── ROLE ACCESS CHECK ──
    const roleInTrial = subscribedRoles.includes(activeRole);
    const remaining = getRemainingAttempts(activeRole);
    const hasAccess = isPaid || (roleInTrial && remaining > 0);
    if (!hasAccess) {
      if (roleInTrial && remaining === 0) {
        setView("trial-complete");
        return;
      }
      showToast('Subscribe to ' + (ROLES.find(r => r.id === activeRole)?.name || activeRole) + ' to unlock access.', 'warning');
      setView("dashboard");
      setDashTab("billing");
      return;
    }

    // Create session in backend FIRST to get session_id
    let newSessionId = null;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('https://threatready-db.onrender.com/api/session/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ scenario_id: sc.id, interview_mode: false, role_id: activeRole || 'cloud' })
        });
        const data = await res.json();
        newSessionId = data.session_id;
        setSessionId(data.session_id);
        window.__sessionId = data.session_id;
      }
    } catch (e) {
      console.log('Session start error:', e);
    }

    // Then set all state and show interview
    const first = sc.po[0];
    setScenario(sc);
    setActiveDifficulty(diff || "beginner");
    setEvaluations([]); setAnswers({}); setQIndex(0);
    setElapsed(0); setShowHint(false); setShowChain(false);
    setCurrentQ(first); setAskedQs([first.id]);
    voice.reset();
    setView("interview");
    setTimeout(() => speakQuestion(first.t, 0), 800);

    // Decrement per-role attempt (only for trial users)
    if (!isPaid) {
      setRoleAttempts(prev => ({ ...prev, [activeRole]: (prev[activeRole] || 0) + 1 }));
    }
  };

  // ── SPEAK QUESTION ──

  const speakQuestion = (text, forceIndex) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    // ARIA = female voice (even qIndex: 0,2,4)
    // NEXUS = male voice (odd qIndex: 1,3)
    const idx = forceIndex !== undefined ? forceIndex : qIndex;
    const useFemale = idx % 2 === 0;

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // HIGH-QUALITY voice priority list (ordered best → fallback)
      // These are the clearest, most natural voices across browsers/OS
      // Premium "neural" / "natural" voices come first
      const femalePriority = [
        'Google UK English Female',        // Chrome — very clear
        'Microsoft Aria Online (Natural)', // Edge — neural, premium
        'Microsoft Jenny Online (Natural)',// Edge — neural, professional
        'Microsoft Zira',                   // Windows — clear
        'Samantha',                         // macOS — natural, clear
        'Karen',                            // macOS (Australian) — professional
        'Victoria',                         // macOS — clear
        'Tessa',                            // macOS — clear
        'Moira',                            // macOS (Irish) — clear
        'Google US English'                 // Chrome — female US
      ];

      const malePriority = [
        'Google UK English Male',          // Chrome — very clear
        'Microsoft Guy Online (Natural)',  // Edge — neural, premium
        'Microsoft Davis Online (Natural)',// Edge — neural, professional
        'Microsoft David',                  // Windows — clear
        'Daniel',                           // macOS (British) — very clear
        'Alex',                             // macOS — natural, professional
        'Fred',                             // macOS — clear
        'Oliver',                           // macOS (British)
        'Aaron'                             // macOS
      ];

      // Find the best voice by priority — match partial name
      const findBestVoice = (priorityList) => {
        for (const preferredName of priorityList) {
          const match = voices.find(v => v.name.includes(preferredName) && v.lang.startsWith('en'));
          if (match) return match;
        }
        return null;
      };

      // Generic English fallback (any English voice)
      const englishFallback = voices.find(v =>
        v.lang === 'en-US' || v.lang === 'en-GB' || v.lang === 'en-IN' || v.lang.startsWith('en')
      );

      let selectedVoice = null;
      if (useFemale) {
        selectedVoice = findBestVoice(femalePriority) || englishFallback || voices[0];
      } else {
        selectedVoice = findBestVoice(malePriority) || englishFallback || voices[0];
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      // Speech parameters — tuned for MAXIMUM CLARITY
      // Slower rate = easier for beginners to understand
      // Natural pitch (not too high/low) = professional sound
      utterance.rate = 0.85;   // Slower than default for clarity (was 0.88-0.92)
      utterance.pitch = 1.0;   // Natural pitch for both (was 0.8-1.2 — sounded robotic)
      utterance.volume = 1.0;  // Full volume

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      console.log(useFemale ? 'ARIA speaking (female)' : 'NEXUS speaking (male)', '—', selectedVoice?.name || 'default voice');
    };

    // Wait for voices to load if not ready yet
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    } else {
      doSpeak();
    }
  };
  // ── AI EVALUATION ──
  const evaluateAnswer = async (question, answer, sc) => {
    try {
      const token = localStorage.getItem('token');
      // Use window.__sessionId as fallback in case React state hasn't updated yet
      const sid = sessionId || window.__sessionId || null;
      console.log('[EVAL] session_id:', sid, 'question_id:', question.id);
      const r = await fetch("https://threatready-db.onrender.com/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (token || '')
        },
        body: JSON.stringify({
          question: question.t,
          answer: answer,
          difficulty: activeDifficulty,
          session_id: sid,
          question_id: String(question.id),
          resume_context: resumeText || '',
          jd_context: jdAnalysis?.assessment_context || '',
          scenario_context: {
            title: sc.ti,
            description: sc.de,
            category: question.ca
          }
        })
      });

      const result = await r.json();
      console.log('[EVAL]', r.status, result.score, result.strengths?.substring(0, 40));

      // Server returned an error
      if (result.error || r.status >= 400) {
        console.error('[EVAL ERROR]', result.error);
        return {
          score: 5, category: question.ca,
          strengths: "Evaluation failed",
          weaknesses: "Server error: " + (result.error || "Unknown"),
          improved_answer: "-",
          communication_score: 5, depth_score: 5, decision_score: 5,
          follow_up_question: "What additional considerations would you factor in?",
          follow_up_category: question.ca
        };
      }

      return {
        score: result.score ?? 5,
        category: result.category || question.ca,
        strengths: result.strengths || "",
        weaknesses: result.weaknesses || "",
        improved_answer: result.improved_answer || "",
        communication_score: result.communication_score ?? 5,
        depth_score: result.depth_score ?? 5,
        decision_score: result.decision_score ?? 5,
        // 5 skill scores for radar chart
        iam_score: result.iam_score ?? result.score ?? 5,
        detection_score: result.detection_score ?? result.score ?? 5,
        remediation_score: result.remediation_score ?? result.score ?? 5,
        architecture_score: result.architecture_score ?? result.score ?? 5,
        communication_skill_score: result.communication_skill_score ?? result.communication_score ?? result.score ?? 5,
        follow_up_question: result.follow_up_topic || "What additional considerations would you factor in?",
        follow_up_category: result.follow_up_category || question.ca
      };

    } catch (e) {
      console.error("[EVAL NETWORK ERROR]", e.message);
      return {
        score: 5, category: question.ca,
        strengths: "Network error",
        weaknesses: "Cannot reach server: " + e.message,
        improved_answer: "-",
        communication_score: 5, depth_score: 5, decision_score: 5,
        follow_up_question: "What additional considerations would you factor in?",
        follow_up_category: question.ca
      };
    }
  };

  // ── SUBMIT ANSWER ──
  const submitAnswer = async () => {
    const ans = answers[currentQ.id] || voice.transcript;
    if (!ans?.trim()) return;
    setLoading(true);
    const ev = await evaluateAnswer(currentQ, ans, scenario);
    const newEvals = [...evaluations, { ...ev, question_id: currentQ.id, user_answer: ans, question_text: currentQ.t }];
    setEvaluations(newEvals);

    if (askedQs.length < 5) {
      // Adaptive: use AI's follow-up question
      const nextQ = {
        id: `adaptive_${askedQs.length + 1}`,
        ca: ev.follow_up_category || currentQ.ca,
        t: ev.follow_up_question || scenario.po[Math.min(askedQs.length, scenario.po.length - 1)]?.t,
        h: "",
        dp: Math.min(3, currentQ.dp + 1)
      };
      setCurrentQ(nextQ); setAskedQs(p => [...p, nextQ.id]); setQIndex(p => p + 1);
      setShowHint(false); voice.reset(); setAnswers(p => ({ ...p, [currentQ.id]: ans }));
      setLoading(false);
      setTimeout(() => speakQuestion(nextQ.t, qIndex + 1), 300);
    } else {
      // Complete - calculate scores
      const avg = (arr, k) => arr.reduce((s, e) => s + (e[k] ?? 5), 0) / arr.length;
      const score = Math.round(avg(newEvals, "score") * 10) / 10;
      const earned = Math.round(score * 50);
      const skillsScore = Math.min(500, Math.round(score * 50));
      const attackScore = Math.min(100, Math.round(avg(newEvals, "decision_score") * 10));
      setResults({
        overall_score: score,
        communication: Math.round(avg(newEvals, "communication_score") * 10) / 10,
        depth: Math.round(avg(newEvals, "depth_score") * 10) / 10,
        decision: Math.round(avg(newEvals, "decision_score") * 10) / 10,
        // 5 skill averages for radar
        iam: Math.round(avg(newEvals, "iam_score") * 10) / 10,
        detection: Math.round(avg(newEvals, "detection_score") * 10) / 10,
        remediation: Math.round(avg(newEvals, "remediation_score") * 10) / 10,
        architecture: Math.round(avg(newEvals, "architecture_score") * 10) / 10,
        communication_skill: Math.round(avg(newEvals, "communication_skill_score") * 10) / 10,
        earned, time: elapsed, evaluations: newEvals, questions_asked: askedQs.length,
        skillsScore, attackScore,
        percentile: Math.min(99, Math.round(score * 10)),
        badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready",
        difficulty: activeDifficulty
      });
      setXp(p => p + earned);
      setCompletedScenarios(p => [...new Set([...p, scenario.id])]);
      setStreak(p => p + 1);

      // Save to local session history (works for free trial users without backend account)
      setLocalSessionHistory(p => [...p, {
        scenario_id: scenario.id,
        role_id: activeRole,
        score: score,
        communication_score: Math.round(avg(newEvals, "communication_score") * 10) / 10,
        depth_score: Math.round(avg(newEvals, "depth_score") * 10) / 10,
        decision_score: Math.round(avg(newEvals, "decision_score") * 10) / 10,
        completed_at: new Date().toISOString(),
        difficulty: activeDifficulty,
        badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready"
      }]);

      setLoading(false);
      // Always show results page first — even for trial-exhausted users
      // They can then click "View Subscription Options" button to go to trial-complete popup
      setView("results");

      // Save completed session to backend
      try {
        const token = localStorage.getItem('token');
        // Save scenario history
        fetch('https://threatready-db.onrender.com/api/scenario-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ scenario_id: scenario.id, role_id: activeRole, score })
        }).catch(e => console.log('Scenario history:', e.message));
        const finalSessionId = sessionId || window.__sessionId;
        if (token && finalSessionId) {
          console.log('[SESSION COMPLETE] session_id:', finalSessionId, 'score:', score);
          await fetch('https://threatready-db.onrender.com/api/session/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              session_id: sessionId,
              scenario_id: scenario.id,
              role_id: activeRole,
              overall_score: score,
              skills_score: skillsScore,
              attack_score: attackScore,
              badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready",
              earned_xp: earned
            })
          });
        }
      } catch (e) {
        console.log('Session complete error:', e);
      }
    }
  };

  const runDemo = async () => {
    const ans = demoAnswer || demoVoice.transcript;
    if (!ans || !ans.trim()) return;
    setDemoLoading(true);
    try {
      const r = await fetch("https://threatready-db.onrender.com/api/demo/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: demoQ && demoQ.q, answer: ans })
      });
      const result = await r.json();
      setDemoScore(result);
    } catch (e) {
      setDemoScore({ score: 5, feedback: "Cannot connect to server.", level: "Intermediate" });
    }
    setDemoLoading(false);
  };

  // ── PRICING CALC ──
  const toggleRole = id => setSelectedRoles(p => {
    if (p.includes(id)) return p.filter(r => r !== id);
    return [...p, id]; // no cap — billing tab allows selecting any number of roles
  });


  const getDiscount = () => selectedRoles.length >= 3 ? 30 : selectedRoles.length >= 2 ? 18 : 0;
  const getPrice = () => { const base = selectedRoles.length * 399; return Math.round(base * (1 - getDiscount() / 100)); };
  const subscribe = async () => {
    if (!selectedRoles.length) return;
    if (!user) { setAuthMode('signup'); setView('auth'); showToast('Create an account to subscribe', 'info'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://threatready-db.onrender.com/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roles: selectedRoles, billing_period: billingPeriod })
      });
      const order = await res.json();
      if (!res.ok) { showToast(order.error || 'Payment error', 'error'); return; }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ThreatReady',
        description: `${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''} · ${billingPeriod}`,
        order_id: order.order_id,
        handler: async (response) => {
          const verifyRes = await fetch('https://threatready-db.onrender.com/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              roles: selectedRoles,
              billing_period: billingPeriod
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            const allRoles = [...new Set([...subscribedRoles, ...selectedRoles])];
            setSubscribedRoles(allRoles);
            setIsPaid(true);
            setFreeAttempts(0);
            setSelectedRoles([]);
            setView("dashboard");
            setDashTab("home");
            showToast(`Payment successful! All levels unlocked for ${allRoles.length} role${allRoles.length > 1 ? 's' : ''}.`, 'success');
          } else {
            showToast('Payment verification failed. Contact support.', 'error');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''  // Leave empty so user enters their own number
        },
        remember_customer: false,  // Don't save number for next visit
        theme: { color: '#00e5ff' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      showToast('Payment failed: ' + e.message, 'error');
    }
  };

  const goHome = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setView(userType === "b2b" ? "b2b-dashboard" : "dashboard");
    setScenario(null);
    setResults(null);
  };

  const exitScenario = () => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setScenario(null);
    setCurrentQ(null);
    setResults(null);
    setView("dashboard");
  };

  const HomeBtn = ({ label = "← Home" }) => <button className="home-btn" onClick={goHome}>{label}</button>;
  const doLogout = () => {
    // Mark that user logged out → next login won't auto-load resume/career data
    localStorage.setItem('cyberprep_just_logged_out', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('cyberprep_user');
    localStorage.removeItem('cyberprep_usertype');
    localStorage.removeItem('cyberprep_view');
    localStorage.removeItem('cyberprep_tab');
    localStorage.removeItem('cyberprep_b2btab');
    localStorage.removeItem('subscribedRoles');
    localStorage.removeItem('freeAttempts');
    localStorage.removeItem('roleAttempts');
    localStorage.removeItem('cyberprep_freetrial');
    localStorage.removeItem('trialRoles');
    localStorage.removeItem('cyberprep_session_start');
    localStorage.removeItem('cyberprep_xp');
    localStorage.removeItem('cyberprep_streak');
    localStorage.removeItem('cyberprep_completed_scenarios');
    localStorage.removeItem('cyberprep_local_sessions');
    localStorage.removeItem('cyberprep_hr_paid');
    setUser(null); setUserType('b2c'); setSettingsName('');
    setResumeText(''); setTargetRole(''); setExperienceLevel('');
    setResumeAiData(null); setReadiness(null);
    setXp(0); setStreak(0); setCompletedScenarios([]);
    setBadges([]); setScoreHistory([]); setWeaknessTracker([]);
    setLocalSessionHistory([]);
    setIsPaid(false); setFreeAttempts(2); setRoleAttempts({});
    setSubscribedRoles([]); setTrialRoles([]);
    setIsHrPaid(false);
    setView("landing");
  };
  const logout = () => showConfirm('Are you sure you want to logout?', doLogout);

  // ═══════════════════════════════════════════════════════════════
  // 1-HOUR SESSION TIMEOUT
  // ═══════════════════════════════════════════════════════════════
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

  const expireSession = useCallback(() => {
    console.log('Session expired — auto-logout');
    doLogout();
    showToast('Session expired, please login again', 'warning');
  }, []);

  // Check on app load + every 30 seconds while app is running
  useEffect(() => {
    const checkExpiry = () => {
      const sessionStart = localStorage.getItem('cyberprep_session_start');
      if (!sessionStart) return; // not logged in
      const elapsed = Date.now() - parseInt(sessionStart, 10);
      if (elapsed >= SESSION_TIMEOUT_MS) {
        expireSession();
      }
    };
    checkExpiry(); // run once immediately
    const timer = setInterval(checkExpiry, 30 * 1000); // every 30 seconds
    return () => clearInterval(timer);
  }, [expireSession]);

  const radarData = results ? [
    { s: "IAM", v: (results.iam ?? 0) * 10 },
    { s: "Detection", v: (results.detection ?? 0) * 10 },
    { s: "Remediation", v: (results.remediation ?? 0) * 10 },
    { s: "Architecture", v: (results.architecture ?? 0) * 10 },
    { s: "Communication", v: (results.communication_skill ?? results.communication ?? 0) * 10 }
  ] : [];


  // ═══════════════════════════════════════════════════════════
  // PAGE 1: LANDING PAGE (Dynamic Hooks + Random Demo)
  // ═══════════════════════════════════════════════════════════
  if (view === "landing") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="orb" style={{ width: 600, height: 600, background: "radial-gradient(circle,rgba(0,229,255,.15),transparent)", top: -200, right: 0 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(255,61,113,.1),transparent)", bottom: -100, left: 0 }} />
      <div className="page"><div className="cnt">
        {/* HERO */}
        <div className="hero fadeUp">
          <div className="lbl" style={{ marginBottom: 14 }}>ATTACK REASONING LAB</div>
          <h1>{hookHeadline}</h1>
          <p>A real-world cybersecurity assessment platform. Validate security decision-making through adaptive attack simulations. For engineers proving skills and hiring managers validating talent.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <button className="btn bp" onClick={() => {
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
            }} style={{ fontSize: 18, padding: "18px 48px" }}>Start Free Trial</button>
            <button className="btn bs" onClick={() => { setAuthMode("login"); setView("auth"); }} style={{ fontSize: 15, padding: "14px 32px" }}>Sign In</button>
          </div>
        </div>

        {/* INSTANT DEMO */}
        <div className="card fadeUp" style={{ marginTop: 36, padding: 28, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="lbl" style={{ marginBottom: 8 }}>TRY A REAL ATTACK SCENARIO IN 2 MINUTES</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{hookSubline}</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>No signup required. Type or dictate your answer. Instant AI score.</div>

            {/* <div style={{ fontSize: 12, color: "var(--dn)", marginTop: 6, fontWeight: 600 }}>
              ⚠️ This assessment is evaluated by AI
            </div> */}

          </div>
          {!demoScore ? (
            <div>
              <div className="tag" style={{ marginBottom: 10 }}>{demoQ.ca}</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{demoQ.q}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button className={`btn ${demoInputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setDemoInputMode("text")}>✏️ Type</button>
                <button className={`btn ${demoInputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setDemoInputMode("voice")}>🎤 Dictate</button>
              </div>
              {demoInputMode === "text" ? (
                <NoPasteInput placeholder="Type your answer here..." value={demoAnswer} onChange={e => setDemoAnswer(e.target.value)} style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }} />
              ) : (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div className={`rec-ring ${demoVoice.recording ? "active" : ""}`}
                    onClick={demoVoice.recording ? demoVoice.stop : demoVoice.start}
                    style={{ margin: "0 auto 8px" }}>{demoVoice.recording ? "⏹" : "🎤"}</div>
                  <div style={{ fontSize: 12, color: demoVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                    {demoVoice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
                  </div>
                  {demoVoice.transcript && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6 }}>{demoVoice.transcript}</div>}
                </div>
              )}
              <button className="btn bp" style={{ width: "100%", padding: 11 }}
                disabled={demoLoading || (!(demoAnswer?.trim()) && !(demoVoice.transcript?.trim()))}
                onClick={runDemo}>
                {demoLoading ? <span className="loader" /> : "Get My Score →"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 48, fontWeight: 700, color: demoScore.score >= 7 ? "var(--ok)" : demoScore.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{demoScore.score}/10</div>
              <div className="tag" style={{ marginBottom: 8 }}>{demoScore.level}</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 14 }}>{demoScore.feedback}</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12 }}>Your full Skills Score (0-500) + benchmarking + role readiness badges require a free account.</div>
              <button className="btn bp" onClick={() => { setAuthMode("signup"); setView("auth"); }} style={{ padding: "10px 28px" }}>Create Free Account →</button>
            </div>
          )}
        </div>

        {/* BUSINESS VALUE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 28, textAlign: "center" }}>
          {[
            ["🎯 Replace 2-3 Interview Rounds", "Pre-validate attack reasoning. Companies save 20+ hours per hire."],
            ["🏗️ Real Architecture Reasoning", "Not theory. Not certifications. Real attack scenarios with real architectures."],
            ["📊 Team Skill Visibility", "CISOs see team gaps across security domains. Measurable improvement."]
          ].map(([t, d], i) => (
            <div key={i} className="card fadeUp" style={{ padding: 18, animationDelay: `${i * .05}s` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)", marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* TRUST SIGNALS */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--tx2)", letterSpacing: 2, fontWeight: 600 }}>TRUSTED BY 500+ SECURITY ENGINEERS</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 13, color: "var(--tx2)", flexWrap: "wrap", fontWeight: 500 }}>
            <span>Based on real CVEs</span><span>·</span>
            <span>MITRE ATT&CK mapped</span><span>·</span>
            <span>AI-powered evaluation</span><span>·</span>
            <span>Designed by security engineers</span>
          </div>
        </div>

        {/* ROLE GRID */}
        <div style={{ marginTop: 36 }}>
          <div className="lbl" style={{ textAlign: "center", marginBottom: 16 }}>12 SECURITY TRACKS · 4 DIFFICULTY LEVELS · ADAPTIVE AI</div>
          <div className="rgrid">
            {ROLES.map((r, i) => (
              <div key={r.id} className="card card-glow fadeUp" style={{ animationDelay: `${i * .04}s`, textAlign: "center", padding: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, fontWeight: 500 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 28 }}>
          {[["12", "Roles"], ["4", "Difficulty Levels"], ["0-500", "Skills Score"], ["AI", "Adaptive Questions"]].map(([v, l], i) => (
            <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .06}s` }}>
              <div className="statval" style={{ color: "var(--ac)" }}>{v}</div>
              <div className="statlbl">{l}</div>
            </div>
          ))}
        </div>
      </div></div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE: TRIAL ROLE SELECT (Free Trial Entry — Pick exactly 2 roles)
  // ═══════════════════════════════════════════════════════════
  if (view === "trial-role-select") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <button className="home-btn" onClick={() => setView("landing")}>← Back</button>
      <div className="page"><div className="cnt" style={{ paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="fadeUp">
          <div className="lbl" style={{ marginBottom: 10 }}>FREE TRIAL</div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Select 1 or 2 Roles to Try</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.7, maxWidth: 500, margin: "8px auto 0" }}>
            Pick 1 or 2 security roles. You'll get 2 beginner-level interview attempts — no credit card needed.
          </p>
          <div style={{ background: "rgba(0,229,255,.06)", border: "1px solid rgba(0,229,255,.2)", borderRadius: 10, padding: "10px 16px", marginTop: 14, fontSize: 13, color: "var(--ac)", display: "inline-block" }}>
            🎯 Beginner difficulty only &nbsp;·&nbsp; 2 total attempts &nbsp;·&nbsp; No signup to start
          </div>
        </div>

        <div className="rgrid">
          {ROLES.map((r, i) => {
            const sel = trialRoles.includes(r.id);
            const disabled = !sel && trialRoles.length >= 2;
            return (
              <div key={r.id} className={`sub-card fadeUp ${sel ? "sel" : ""}`}
                style={{
                  animationDelay: `${i * .04}s`,
                  borderColor: sel ? r.color : undefined,
                  opacity: disabled ? 0.3 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  pointerEvents: disabled ? "none" : "auto"
                }}
                onClick={() => setTrialRoles(p => sel ? p.filter(x => x !== r.id) : [...p, r.id])}>
                {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: r.color, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10, fontWeight: 500 }}>{r.desc}</div>
                <div className="tag" style={{ fontSize: 11 }}>Beginner Free</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          {trialRoles.length >= 1 && (
            <div className="card fadeUp" style={{ padding: 24, borderColor: "var(--ac)", maxWidth: 480, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {trialRoles.map(rid => {
                  const role = ROLES.find(r => r.id === rid);
                  return (
                    <div key={rid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,229,255,.06)", borderRadius: 20, border: "1px solid rgba(0,229,255,.2)" }}>
                      <span>{role?.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ac)" }}>{role?.name}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>
                {trialRoles.length} role{trialRoles.length > 1 ? "s" : ""} selected · Beginner difficulty · 2 total attempts
              </div>
              <button className="btn bp" style={{ width: "100%", padding: "14px 0", fontSize: 15 }}
                onClick={() => {
                  const init = {};
                  trialRoles.forEach(rid => { init[rid] = 0; });
                  setRoleAttempts(init);
                  setSubscribedRoles(trialRoles);
                  setIsPaid(false);
                  localStorage.setItem('subscribedRoles', JSON.stringify(trialRoles));
                  localStorage.setItem('trialRoles', JSON.stringify(trialRoles));
                  localStorage.setItem('roleAttempts', JSON.stringify(init));
                  localStorage.setItem('cyberprep_freetrial', 'true');
                  localStorage.setItem('cyberprep_usertype', 'b2c');
                  localStorage.setItem('cyberprep_session_start', Date.now().toString());
                  // CRITICAL: Clear any leftover isPaid flag from previous sessions
                  localStorage.removeItem('isPaid');
                  setView("dashboard");
                  setDashTab("home");
                  showToast("Free trial started! 2 total attempts on Beginner only.", "success");
                }}>
                Start Free Trial →
              </button>
            </div>
          )}
        </div>
      </div></div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE: TRIAL COMPLETE (Shown after 2 trial attempts are used)
  // ═══════════════════════════════════════════════════════════
  if (view === "trial-complete") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card fadeUp" style={{ maxWidth: 520, width: "90%", padding: 40, textAlign: "center", borderColor: "var(--ac)" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <div className="lbl" style={{ marginBottom: 8, color: "var(--ok)" }}>FREE TRIAL COMPLETE</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>You've Used All Your Free Attempts</h2>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>
            Sign up and subscribe to any roles you want — pick as many as you need.
          </p>

          {results && (
            <div style={{ background: "var(--s2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 4 }}>Last Assessment Score</div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                {results.overall_score}<span style={{ fontSize: 18, color: "var(--tx2)" }}>/10</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                {results.badge} · {ROLES.find(r => r.id === activeRole)?.name || activeRole}
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7, marginBottom: 24 }}>
            Subscribe to unlock <strong style={{ color: "var(--tx1)" }}>all 4 difficulty levels</strong> — Beginner, Intermediate, Advanced, Expert — for every role, with unlimited attempts and full performance tracking.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24, textAlign: "left" }}>
            {[
              ["🔓", "All 4 difficulty levels"],
              ["♾️", "Unlimited attempts"],
              ["📊", "Full score history"],
              ["🏅", "Verified badges"]
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>

          <button className="btn bp" style={{ width: "100%", padding: 16, fontSize: 15, marginBottom: 10 }}
            onClick={() => {
              if (user) {
                setDashTab("billing");
                setView("dashboard");
              } else {
                setAuthMode("signup");
                setView("auth");
              }
            }}>
            {user ? "Go to Subscription →" : "Create Account & Subscribe →"}
          </button>

          <button className="btn bs" style={{ width: "100%", padding: 12, fontSize: 12 }}
            onClick={() => setView("dashboard")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 2: AUTH (Signup/Login + Email Verification + B2C/B2B Detection)
  // ═══════════════════════════════════════════════════════════
  if (view === "auth") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <button className="home-btn" onClick={() => {
        // Go back to previous view (e.g., if came from difficulty page, return there)
        const prevView = localStorage.getItem('cyberprep_prev_view');
        const isFreeTrialUser = localStorage.getItem('cyberprep_freetrial') === 'true';

        setAuthStep("form");
        setAuthError("");

        if (prevView && prevView !== 'auth') {
          // Return to whatever page user came from (e.g., difficulty)
          setView(prevView);
          localStorage.removeItem('cyberprep_prev_view');
        } else if (isFreeTrialUser) {
          setView("dashboard");
        } else {
          setView("landing");
        }
      }}>← Back</button>
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card fadeUp" style={{ width: "100%", maxWidth: 420, padding: 36 }}>

          {/* STEP 1: SIGNUP/LOGIN FORM */}
          {authStep === "form" && (<>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔐</div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
              {authMode === "signup" && <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 6 }}>2 free attempts · No credit card required</p>}
            </div>
            {authError && <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 13, color: "var(--dn)", marginBottom: 14 }}>{authError}</div>}
            {authMode === "signup" && <input className="input" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} style={{ marginBottom: 10 }} />}
            <input className="input" type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ position: "relative", marginBottom: 4 }}>
              <input
                className="input"
                type={showAuthPassword ? "text" : "password"}
                placeholder="Password (min 8 characters)"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowAuthPassword(v => !v)}
                aria-label={showAuthPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: 6, color: "var(--tx2)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                {showAuthPassword ? (
                  /* Eye with slash = hide */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Open eye = show */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {authMode === "signup" && <PasswordStrength password={authPassword} />}
            {authMode === "signup" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--tx2)", marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                I agree to the Terms of Service and Privacy Policy
              </label>
            )}
            {authMode === "login" && <div style={{ textAlign: "right", marginBottom: 10 }}><span style={{ fontSize: 13, color: "var(--ac)", cursor: "pointer" }} onClick={() => { setAuthStep("forgot"); setForgotEmail(authEmail || ""); setForgotMsg(""); }}>Forgot Password?</span></div>}
            <button
              className="btn bp"
              style={{
                width: "100%",
                padding: 13,
                fontSize: 14,
                opacity: isAuthenticating ? 0.7 : 1,
                cursor: isAuthenticating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onClick={handleAuth}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <span style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(0,0,0,0.3)",
                    borderTopColor: "#000",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite"
                  }} />
                  {authMode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                authMode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/google"}>
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg> Google</button>

              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/github?prompt=login"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg> GitHub</button>

            </div>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--tx2)" }}>
              {authMode === "login" ? "No account? " : "Have an account? "}
              <span style={{ color: "var(--ac)", cursor: "pointer" }} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </span>
            </div>
          </>)}

          {/* STEP 2: EMAIL VERIFICATION */}
          {authStep === "verify" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Check Your Email</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>
                We sent a 6-digit code to{" "}
                <span style={{ color: "var(--ac)", fontWeight: 600 }}>{authEmail}</span>
              </p>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20 }}>
                Enter the code below. Expires in 15 minutes.
              </p>

              {otpError && (
                <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 13, color: "var(--dn)", marginBottom: 14 }}>
                  {otpError}
                </div>
              )}

              <input
                className="input"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, marginBottom: 14, fontFamily: "monospace" }}
                maxLength={6}
              />

              <button
                className="btn bp"
                style={{ width: "100%", padding: 13, marginBottom: 10 }}
                disabled={otpCode.length !== 6}

                onClick={async () => {
                  setOtpError("");
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/verify-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: authEmail, otp: otpCode })
                    });
                    const data = await res.json();
                    if (!res.ok) { setOtpError(data.error || "Invalid code"); return; }

                    // OTP verified — go to sign in page
                    setOtpCode("");
                    setAuthPassword("");
                    setAuthMode("login");
                    setAuthStep("form");
                    setAuthError("✅ Email verified! Please sign in.");
                    showToast("Email verified! Now sign in to continue.", "success");
                  } catch (err) {
                    setOtpError("Cannot connect to server");
                  }
                }}>
                Verify Email ✓
              </button>

              <button
                className="btn bs"
                style={{ width: "100%", padding: 10, fontSize: 13 }}
                onClick={async () => {
                  setOtpError("");
                  setOtpCode("");
                  await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: authEmail })
                  });
                  showToast('New verification code sent to your email!', 'success');
                }}
              >
                Didn't get it? Resend Code
              </button>
            </div>
          )}


          {/* STEP 3: B2C/B2B DETECTION */}
          {authStep === "detect" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{userType === "b2b" ? "🏢" : "👤"}</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                {userType === "b2b" ? "Looks Like You're Hiring" : "Ready to Prepare?"}
              </h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20 }}>
                {userType === "b2b"
                  ? "We detected a company email. Are you here to assess candidates or teams?"
                  : "Are you preparing for security interviews?"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn bp" style={{ padding: 14 }} onClick={() => confirmUserType(userType)}>
                  {userType === "b2b" ? "Yes, I'm Hiring / Assessing →" : "Yes, I'm Preparing →"}
                </button>
                <button className="btn bs" style={{ padding: 12, fontSize: 13 }} onClick={() => confirmUserType(userType === "b2b" ? "b2c" : "b2b")}>
                  {userType === "b2b" ? "Actually, I'm a candidate preparing" : "Actually, I'm hiring / assessing"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3.5: COMPANY INFO (B2B only — between Hiring/Preparing and OTP) */}
          {authStep === "company-info" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Tell us about your team</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)" }}>
                  This helps us set up your hiring dashboard
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--tx2)", display: "block", marginBottom: 6 }}>
                  Company Name *
                </label>
                <input className="input"
                  placeholder="e.g., Acme Corp"
                  value={hrModalCompanyName}
                  onChange={e => setHrModalCompanyName(e.target.value)}
                  style={{ fontSize: 14, padding: "12px 14px" }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--tx2)", display: "block", marginBottom: 6 }}>
                  Team Size *
                </label>
                <select className="input"
                  value={hrModalTeamSize}
                  onChange={e => setHrModalTeamSize(e.target.value)}
                  style={{ fontSize: 14, padding: "12px 14px", cursor: "pointer" }}
                >
                  <option value="5-10">5-10 people (Team Starter)</option>
                  <option value="11-50">11-50 people (Team Pro)</option>
                  <option value="50+">50+ people (Enterprise)</option>
                </select>
              </div>

              <button className="btn bp" style={{ width: "100%", padding: 14, fontSize: 14, fontWeight: 700 }}
                onClick={confirmCompanyInfo}>
                Continue → Send OTP
              </button>

              <button className="btn bs" style={{ width: "100%", padding: 10, fontSize: 12, marginTop: 10, color: "var(--tx2)" }}
                onClick={() => setAuthStep("detect")}>
                ← Back
              </button>
            </div>
          )}

          {/* STEP 4: ROLE SELECTION (B2C only) */}
          {authStep === "roleselect" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Choose Your First Role</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>You have 2 free attempts across all roles</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {ROLES.map(r => (
                  <div key={r.id} className="card card-glow" style={{ padding: 12, textAlign: "center", cursor: "pointer" }}
                    onClick={() => {
                      setActiveRole(r.id);
                      setSubscribedRoles([r.id]);
                      const scs = SCENARIOS[r.id];
                      if (scs?.length) { startScenario(scs[0], "beginner"); }
                      else { setView("dashboard"); }
                    }}>
                    <div style={{ fontSize: 24 }}>{r.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{r.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD: Step 1 - Enter Email ── */}
          {authStep === "forgot" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Forgot Password?</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                Enter your email address and we'll send you a 6-digit reset code.
              </p>
              {forgotMsg && (
                <div style={{
                  padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12,
                  background: forgotMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)",
                  border: forgotMsg.includes("✅") ? "1px solid rgba(0,224,150,.3)" : "1px solid rgba(255,82,82,.3)",
                  color: forgotMsg.includes("✅") ? "var(--ok)" : "var(--dn)"
                }}>
                  {forgotMsg}
                </div>
              )}
              <input className="input" type="email" placeholder="Your registered email address"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                style={{ marginBottom: 14 }}
                onKeyDown={e => e.key === "Enter" && !forgotLoading && document.getElementById("forgot-send-btn").click()}
              />
              <button id="forgot-send-btn" className="btn bp" style={{ width: "100%", padding: 13 }}
                disabled={!forgotEmail.trim() || forgotLoading}
                onClick={async () => {
                  setForgotLoading(true);
                  setForgotMsg("");
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail.trim() })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setForgotMsg("✅ Reset code sent! Check your email inbox.");
                      setTimeout(() => { setAuthStep("resetcode"); setForgotMsg(""); }, 1800);
                    } else {
                      setForgotMsg("❌ " + (data.error || "Failed to send reset code"));
                    }
                  } catch (e) {
                    setForgotMsg("❌ Server error: " + e.message);
                  }
                  setForgotLoading(false);
                }}>
                {forgotLoading ? "Sending..." : "Send Reset Code →"}
              </button>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, color: "var(--ac)", cursor: "pointer" }}
                  onClick={() => { setAuthStep("form"); setForgotMsg(""); }}>
                  ← Back to Login
                </span>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD: Step 2 - Enter Code + New Password ── */}
          {authStep === "resetcode" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Reset Password</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>Code sent to</p>
              <p style={{ fontSize: 13, color: "var(--ac)", fontWeight: 700, marginBottom: 20 }}>{forgotEmail}</p>
              {forgotMsg && (
                <div style={{
                  padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12,
                  background: forgotMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)",
                  border: forgotMsg.includes("✅") ? "1px solid rgba(0,224,150,.3)" : "1px solid rgba(255,82,82,.3)",
                  color: forgotMsg.includes("✅") ? "var(--ok)" : "var(--dn)"
                }}>
                  {forgotMsg}
                </div>
              )}
              <input className="input" placeholder="Enter 6-digit code" maxLength={6}
                value={forgotCode}
                onChange={e => setForgotCode(e.target.value.replace(/\D/g, ""))}
                style={{ marginBottom: 10, textAlign: "center", fontSize: 22, letterSpacing: 10, fontFamily: "monospace", fontWeight: 700 }}
              />
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  className="input"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password (min 8 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(v => !v)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", cursor: "pointer",
                    padding: 6, color: "var(--tx2)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                  {showNewPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button className="btn bp" style={{ width: "100%", padding: 13 }}
                disabled={forgotCode.length < 6 || newPassword.length < 8 || forgotLoading}
                onClick={async () => {
                  setForgotLoading(true);
                  setForgotMsg("");
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/reset-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail, code: forgotCode, new_password: newPassword })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setAuthStep("resetdone");
                    } else {
                      setForgotMsg("❌ " + (data.error || "Reset failed. Check your code."));
                    }
                  } catch (e) {
                    setForgotMsg("❌ Server error: " + e.message);
                  }
                  setForgotLoading(false);
                }}>
                {forgotLoading ? "Resetting..." : "Reset Password →"}
              </button>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--ac)", cursor: "pointer" }}
                  onClick={() => { setAuthStep("forgot"); setForgotMsg(""); setForgotCode(""); }}>
                  ← Resend Code
                </span>
                <span style={{ fontSize: 12, color: "var(--ac)", cursor: "pointer" }}
                  onClick={() => { setAuthStep("form"); setForgotMsg(""); }}>
                  Back to Login
                </span>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD: Step 3 - Success ── */}
          {authStep === "resetdone" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.8 }}>
                Your password has been updated successfully.<br />
                You can now login with your new password.
              </p>
              <button className="btn bp" style={{ width: "100%", padding: 13 }}
                onClick={() => {
                  setAuthStep("form");
                  setForgotCode("");
                  setForgotEmail("");
                  setNewPassword("");
                  setForgotMsg("");
                  setAuthMode("login");
                }}>
                Go to Login →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
  // ═══════════════════════════════════════════════════════════
  // DIFFICULTY SELECTION
  // ═══════════════════════════════════════════════════════════
  if (view === "difficulty") {
    const role = ROLES.find(r => r.id === activeRole);
    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <HomeBtn />
        <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
          <div className="fadeUp" style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 48 }}>{role?.icon}</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{role?.name}</h2>
            <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>Select difficulty level</p>
            {!isPaid && (
              <div style={{ fontSize: 13, color: "var(--wn)", marginTop: 8 }}>
                ⚠️ Free trial: {getRemainingAttempts(activeRole)} attempt{getRemainingAttempts(activeRole) !== 1 ? "s" : ""} remaining for {ROLES.find(r => r.id === activeRole)?.name} (Beginner only)
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {DIFFICULTIES.map((d, i) => {
              // In free trial: ONLY beginner unlocked. Paid: all levels unlocked
              const locked = !isPaid && d.id !== "beginner";
              const trialExhausted = !isPaid && d.id === "beginner" && getRemainingAttempts(activeRole) === 0;
              const disabled = locked || trialExhausted;
              return (
                <div key={d.id} className={`card fadeUp ${disabled ? "" : "card-glow"}`}
                  style={{ padding: 20, textAlign: "center", animationDelay: `${i * .08}s`, opacity: disabled ? 0.6 : 1, cursor: locked ? "default" : (disabled ? "not-allowed" : "pointer"), borderColor: disabled ? "var(--bd)" : d.color + "40" }}
                  onClick={() => {
                    if (locked) return; // button inside handles this
                    if (trialExhausted) { setView("trial-complete"); return; }
                    const scs = SCENARIOS[activeRole];
                    if (scs?.length) startScenario(scs[Math.floor(Math.random() * scs.length)], d.id);
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>{d.questions} adaptive questions · {d.time}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                    Hints: {d.hints === true ? "Full" : d.hints === "reduced" ? "Reduced" : d.hints === "minimal" ? "Minimal" : "None"}
                  </div>
                  {locked && (
                    <button
                      className="btn bp"
                      style={{ marginTop: 12, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          // Save current view so Back button on auth page returns here
                          localStorage.setItem('cyberprep_prev_view', 'difficulty');
                          // Free trial guest → send to signup
                          setAuthMode("signup");
                          setView("auth");
                          showToast("Create an account to subscribe", "info");
                        } else {
                          // Logged in but not paid → send to Billing tab
                          setView("dashboard");
                          setDashTab("billing");
                        }
                      }}>
                      🔒 Subscribe to Unlock
                    </button>
                  )}
                  {trialExhausted && <div style={{ fontSize: 12, color: "var(--dn)", marginTop: 8 }}>⚠️ No attempts left — subscribe</div>}
                  {!locked && !trialExhausted && !isPaid && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 8 }}>🆓 {getRemainingAttempts(activeRole)} free attempt{getRemainingAttempts(activeRole) !== 1 ? "s" : ""} left</div>}
                  {!locked && !trialExhausted && isPaid && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 8 }}>🔓 Unlocked</div>}
                </div>
              );
            })}
          </div>
        </div></div>
      </div>
    );
  }



  // ═══════════════════════════════════════════════════════════
  // PAGE 3: SCENARIO INTERFACE (Adaptive + Anti-Gaming)
  // ═══════════════════════════════════════════════════════════
  if (view === "interview" && scenario && currentQ) return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      {/* Tab Switch Warning Modal (1st, 2nd, 3rd switch) */}
      {showTabWarning && !showEjectedModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <div style={{ background: "var(--bg)", border: "2px solid var(--dn)", borderRadius: 16, padding: 32, maxWidth: 480, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--dn)" }}>Tab Switch Detected!</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16, lineHeight: 1.6 }}>
              You switched tabs or minimized the window during your attempt.
              <br />
              <strong style={{ color: "var(--wn)" }}>Warning {tabSwitchCount}/3</strong>
            </div>
            {tabSwitchCount >= 3 ? (
              <div style={{ fontSize: 12, color: "var(--dn)", marginBottom: 16, padding: 12, background: "rgba(255,82,82,.15)", borderRadius: 8, fontWeight: 700 }}>
                🚨 FINAL WARNING: One more tab switch and you will be EXITED from this attempt.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>
                Please stay on this tab. After 3 warnings, the next switch will exit your attempt.
              </div>
            )}
            <button className="btn bp" style={{ width: "100%", padding: 12 }}
              onClick={() => setShowTabWarning(false)}>
              I Understand · Continue
            </button>
          </div>
        </div>
      )}

      {/* EJECTED Modal (4th tab switch — auto-exit) */}
      {showEjectedModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}>
          <div style={{ background: "var(--bg)", border: "3px solid var(--dn)", borderRadius: 16, padding: 36, maxWidth: 520, width: "90%", textAlign: "center", boxShadow: "0 0 60px rgba(255,82,82,.4)" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🚫</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: "var(--dn)" }}>Attempt Exited</div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
              You left the attempt window <strong style={{ color: "var(--dn)" }}>{tabSwitchCount} times</strong>.
              <br /><br />
              For test integrity, your attempt has been <strong style={{ color: "var(--dn)" }}>automatically ended</strong>.
              <br /><br />
              Please complete your attempts in a single focused session without switching tabs.
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)", padding: 10, background: "var(--s2)", borderRadius: 8 }}>
              Returning to dashboard in a moment...
            </div>
          </div>
        </div>
      )}

      <div className="page"><div className="cnt" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div className="fadeUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{scenario.ti}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span className={`diff diff-${activeDifficulty}`}>{activeDifficulty}</span>
              <span className="tag">Q{qIndex + 1}/5</span>
              {tabSwitchCount > 0 && (
                <span className="tag" style={{ color: "var(--dn)", borderColor: "var(--dn)" }}>
                  ⚠️ {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: elapsed > 600 ? "var(--dn)" : "var(--ac)" }}>⏱ {fmt(elapsed)}</span>
              <button className="btn bs" style={{ padding: "5px 16px", fontSize: 13, color: "var(--dn)", borderColor: "var(--dn)", fontWeight: 700 }} onClick={exitScenario}>Exit</button>
            </div>
        </div>

        {/* Architecture Diagram (Zoomable + Pannable) with Avatar */}
        <div style={{ position: "relative" }}>
          <ArchDiagram nodes={scenario.no} edges={scenario.ed} />
          <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 10 }}>
            <AIAvatar isSpeaking={isSpeaking} isMuted={isMuted} qIndex={qIndex} />
          </div>
        </div>

        {/* Current Question */}


        <div className="card fadeUp" style={{ marginBottom: 14, padding: 18, borderColor: "var(--ac)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="tag">{currentQ.ca}</div>
            <button
              className="btn bs"
              style={{ padding: "3px 10px", fontSize: 12, marginLeft: 8 }}

              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  // Speak directly without going through speakQuestion (bypasses isMuted check)
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(currentQ.t);
                  const voices = window.speechSynthesis.getVoices();
                  const femaleVoices = voices.filter(v =>
                    v.name.includes('Female') || v.name.includes('Zira') ||
                    v.name.includes('Samantha') || v.name.includes('Google UK English Female')
                  );
                  const maleVoices = voices.filter(v =>
                    v.name.includes('Male') || v.name.includes('Daniel') ||
                    v.name.includes('Google UK English Male') || v.name.includes('Microsoft David')
                  );
                  const useFemale = qIndex % 2 === 0;
                  const preferred = (useFemale ? femaleVoices[0] : maleVoices[0]) ||
                    voices.find(v => v.lang === 'en-US');
                  if (preferred) utterance.voice = preferred;
                  utterance.rate = 0.9;
                  utterance.pitch = useFemale ? 1.1 : 0.85;

                  utterance.volume = 1.0;
                  window.speechSynthesis.speak(utterance);
                } else {
                  setIsMuted(true);
                  window.speechSynthesis.cancel();
                }
              }}
            >
              {isMuted ? "🔊 Unmute" : "🔇 Mute"}
            </button>
          </div>
          <div
            style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
          >{currentQ.t}</div>
          {showHint && currentQ.h && activeDifficulty === "beginner" && (
            <div style={{ marginTop: 8, padding: 8, background: "rgba(0,229,255,.05)", borderRadius: 6, fontSize: 12, color: "var(--ac)" }}>💡 Hint: {currentQ.h}</div>
          )}
          {activeDifficulty === "beginner" && !showHint && currentQ.h && (
            <button className="btn bs" style={{ marginTop: 8, fontSize: 11, padding: "3px 10px" }} onClick={() => setShowHint(true)}>Show Hint</button>
          )}
        </div>

        {/* Answer Input (No Copy-Paste) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button className={`btn ${inputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setInputMode("text")}>✏️ Type</button>
          <button className={`btn ${inputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setInputMode("voice")}>🎤 Dictate</button>
        </div>
        {inputMode === "text" ? (
          <NoPasteInput placeholder="Type your answer... (copy-paste disabled)" value={answers[currentQ.id] || ""}
            onChange={e => setAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
            style={{ minHeight: 100, marginBottom: 12, fontSize: 13 }} />
        ) : (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div className={`rec-ring ${voice.recording ? "active" : ""}`}
              onClick={voice.recording ? voice.stop : voice.start}
              style={{ margin: "0 auto 8px" }}>{voice.recording ? "⏹" : "🎤"}</div>
            <div style={{ fontSize: 12, color: voice.recording ? "var(--dn)" : "var(--tx2)" }}>
              {voice.recording ? "🔴 Recording... will continue even if you pause" : "Tap to start dictating"}
            </div>
            {(voice.transcript || voice.recording) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, textAlign: "left" }}>
                  💡 Tip: You can edit the text below to fix any recognition errors
                </div>
                <NoPasteInput
                  value={voice.transcript}
                  onChange={e => voice.setTranscript(e.target.value)}
                  placeholder="Your dictated answer will appear here. Edit to fix errors..."
                  style={{ minHeight: 80, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, width: "100%" }}
                />
              </div>
            )}
          </div>
        )}

        <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 13 }}
          disabled={loading || (!(answers[currentQ.id]?.trim()) && !(voice.transcript?.trim()))}
          onClick={submitAnswer}>
          {loading ? <span className="loader" /> : qIndex < 4 ? `Submit & Next (Q${qIndex + 2}/5) →` : "Finish Assessment →"}
        </button>
      </div></div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 4: RESULTS (Transparent Scoring + Badges + CTAs)
  // ═══════════════════════════════════════════════════════════
  if (view === "results" && results) return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <HomeBtn />
      <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
        {/* Score Card */}
        <div className="card fadeUp" style={{ textAlign: "center", padding: 36, marginBottom: 20, borderColor: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>
          <div className="lbl" style={{ marginBottom: 6 }}>ASSESSMENT COMPLETE · {(activeDifficulty || "").toUpperCase()}</div>
          <div className="mono" style={{ fontSize: 56, fontWeight: 700, color: results.overall_score >= 7 ? "var(--ok)" : results.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>{results.overall_score}</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 14 }}>out of 10 · {results.questions_asked} adaptive questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[["Technical Depth", `${results.depth}/10`], ["Communication", `${results.communication}/10`], ["Decision-Making", `${results.decision}/10`]].map(([l, v], i) => (
              <div key={i} className="statbox"><div className="statval" style={{ color: "var(--ac)", fontSize: 16 }}>{v}</div><div className="statlbl">{l}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            {[["Skills Score", `${results.skillsScore}/500`], ["Attack Thinking", `${results.attackScore}/100`], ["Percentile", `Top ${100 - results.percentile}%`], ["Duration", fmt(results.time)]].map(([l, v], i) => (
              <div key={i}><div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)" }}>{v}</div><div style={{ fontSize: 11, color: "var(--tx2)" }}>{l}</div></div>
            ))}
          </div>
          <div className="badge-card" style={{ margin: "0 auto", maxWidth: 200, borderColor: results.badge === "Platinum" ? "#8b5cf6" : results.badge === "Gold" ? "#f59e0b" : results.badge === "Silver" ? "#94a3b8" : results.badge === "Bronze" ? "#cd7f32" : "var(--dn)", color: results.badge === "Platinum" ? "#8b5cf6" : results.badge === "Gold" ? "#f59e0b" : results.badge === "Silver" ? "#94a3b8" : results.badge === "Bronze" ? "#cd7f32" : "var(--dn)" }}>
            {results.badge === "Not Ready" ? "NOT READY" : `${results.badge.toUpperCase()} · ${(activeDifficulty || "").toUpperCase()}`}
          </div>
          <div className="tag" style={{ marginTop: 14, padding: "5px 12px" }}>+{results.earned} XP</div>
        </div>

        {/* Radar Chart */}
        <div className="card fadeUp" style={{ marginBottom: 20, padding: 20 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>SKILL RADAR</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,229,255,.15)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: "#8890b0", fontSize: 12 }} />
              <Radar name="Score" dataKey="v" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Percentile Bar */}
        <div className="card fadeUp" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="lbl">YOUR RANKING</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)" }}>Top {100 - results.percentile}%</div>
          </div>
          <div style={{ position: "relative", height: 14, background: "rgba(255,255,255,.04)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,229,255,.15)" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${results.percentile}%`,
              background: `linear-gradient(90deg, ${results.percentile >= 70 ? "#00e096" : results.percentile >= 50 ? "#ffab40" : "#ff5252"}, ${results.percentile >= 70 ? "#00e5ff" : results.percentile >= 50 ? "#ffab40" : "#ff5252"})`,
              borderRadius: 8,
              transition: "width 1s ease-out"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--tx2)" }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 10, textAlign: "center" }}>
            You scored better than {results.percentile}% of candidates at {activeDifficulty} level
          </div>
        </div>

        {/* Scoring Transparency */}
        <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>HOW YOUR SCORE WAS CALCULATED</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>
            Each question scored on 3 dimensions: Technical Depth (thoroughness), Communication Quality (clarity), and Decision-Making (soundness).
            Overall score = average across all 5 questions. Percentile calculated against all users at {activeDifficulty} difficulty.
            {activeDifficulty === "beginner" && " Beginner rubric: encouraging, credit for partial understanding."}
            {activeDifficulty === "intermediate" && " Intermediate rubric: balanced, credit reasoning but penalize gaps."}
            {activeDifficulty === "advanced" && " Advanced rubric: strict, interview-grade standards."}
            {activeDifficulty === "expert" && " Expert rubric: rigorous, challenges assumptions."}
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="lbl" style={{ marginBottom: 10 }}>QUESTION-BY-QUESTION BREAKDOWN</div>
        {results.evaluations.map((ev, i) => (
          <div key={i} className="eval-card fadeUp" style={{ animationDelay: `${i * .05}s`, borderLeftColor: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="tag">Q{i + 1} · {ev.category}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{ev.score}/10</span>
            </div>

            {/* Question text */}
            {ev.question_text && (
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", marginBottom: 8, lineHeight: 1.5 }}>
                {ev.question_text}
              </div>
            )}

            <div style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--ok)" }}>✓</span> <span style={{ color: "var(--tx2)" }}>{ev.strengths}</span></div>
            <div style={{ fontSize: 13, marginBottom: 8 }}><span style={{ color: "var(--dn)" }}>✗</span> <span style={{ color: "var(--tx2)" }}>{ev.weaknesses}</span></div>

            {/* Side-by-side: Your Answer vs Model Answer */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div style={{ padding: 10, background: "rgba(255,171,64,.06)", border: "1px solid rgba(255,171,64,.2)", borderRadius: 6 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--wn)", marginBottom: 4, fontWeight: 700, letterSpacing: 0.5 }}>YOUR ANSWER</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{ev.user_answer || "— (no answer recorded)"}</div>
              </div>
              <div style={{ padding: 10, background: "rgba(0,224,150,.06)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 6 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ok)", marginBottom: 4, fontWeight: 700, letterSpacing: 0.5 }}>MODEL ANSWER</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6 }}>{ev.improved_answer || "—"}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Improvement Path */}
        {results.evaluations.some(e => e.score < 7) && (
          <div className="card fadeUp" style={{ marginTop: 16, padding: 18, borderColor: "var(--wn)" }}>
            <div className="lbl" style={{ marginBottom: 8 }}>RECOMMENDED IMPROVEMENT PATH</div>
            {results.evaluations.filter(e => e.score < 7).slice(0, 3).map((ev, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--wn)", marginBottom: 3 }}>Weak: {ev.category}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)" }}>{ev.weaknesses}</div>
                <div style={{ fontSize: 12, color: "var(--ac)", marginTop: 4 }}>→ Try a {activeDifficulty === "beginner" ? "Beginner" : "harder"} scenario focusing on {ev.category}</div>
              </div>
            ))}
          </div>
        )}

        {/* Interview Mode Callout */}
        <div className="card fadeUp" style={{ marginTop: 16, padding: 16, borderColor: "#8b5cf6", background: "rgba(139,92,246,.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 4 }}>💎 Want real interview pressure?</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8 }}>Try Interview Mode: AI acts as your interviewer with follow-up probes, time pressure, and debrief feedback.</div>
          <button className="btn bs" style={{ fontSize: 12, padding: "6px 14px", borderColor: "#8b5cf6", color: "#8b5cf6" }}>Unlock Interview Mode →</button>
        </div>

        {/* B2B Hook */}
        {userType === "b2b" && (
          <div className="card fadeUp" style={{ marginTop: 16, padding: 16, borderColor: "var(--ok)", background: "rgba(0,224,150,.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)", marginBottom: 4 }}>🏢 Hiring for this role?</div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8 }}>Create a custom assessment using this exact scenario for your candidates.</div>
            <button className="btn bok" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setView("b2b-dashboard")}>Create Assessment →</button>
          </div>
        )}

        {/* ALL CTAs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 20 }}>
          <button className="btn bp" onClick={() => { const scs = SCENARIOS[activeRole]; if (scs?.length) startScenario(scs[Math.floor(Math.random() * scs.length)], activeDifficulty); }}>
            🔄 Retry (New Architecture)
          </button>
          <button className="btn bs" onClick={() => { setActiveDifficulty(null); setView("difficulty"); }}>
            ⬆️ Try Next Difficulty
          </button>
          <button className="btn bs" onClick={() => { setActiveRole(null); setView("dashboard"); }}>
            🔀 Try Different Role
          </button>
          <button className="btn bs" style={{ borderColor: "var(--ok)", color: "var(--ok)" }}>
            📤 Share Score on LinkedIn
          </button>
        </div>
        {!isPaid && isTrialExhausted() && (
          <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14 }} onClick={() => setView("trial-complete")}>
            🔓 View Subscription Options →
          </button>
        )}
      </div></div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // ROLE SELECTION (Pricing)
  // ═══════════════════════════════════════════════════════════
  if (view === "roles") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <HomeBtn />
      <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="fadeUp">
          <div className="lbl" style={{ marginBottom: 10 }}>CHOOSE YOUR TRACKS</div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Select Security Roles</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 6 }}>
            {isPaid ? "2 roles = 18% off · 3+ roles = 30% off" : "Free trial · Select up to 2 roles"}
          </p>
          {!isPaid && (
            <div style={{ background: "rgba(0,229,255,.06)", border: "1px solid rgba(0,229,255,.2)", borderRadius: 10, padding: "10px 16px", marginTop: 12, fontSize: 13, color: "var(--ac)" }}>
              🎯 Free Trial — Select up to 2 roles · Beginner difficulty only · 2 attempts total
            </div>
          )}
        </div>
        <div className="rgrid">
          {ROLES.map((r, i) => {
            const sel = selectedRoles.includes(r.id);
            return (
              <div key={r.id} className={`sub-card fadeUp ${sel ? "sel" : ""}`}
                style={{
                  animationDelay: `${i * .04}s`,
                  borderColor: sel ? r.color : undefined,
                  opacity: 1,
                  cursor: "pointer",
                  pointerEvents: "auto"
                }}
                onClick={() => toggleRole(r.id)}>

                {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "var(--ac)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10, fontWeight: 500 }}>{r.desc}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: sel ? r.color : "var(--tx2)" }}>₹{r.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
              </div>
            );
          })}
        </div>
        {selectedRoles.length > 0 && (
          <div className="card fadeUp" style={{ marginTop: 20, padding: 20, textAlign: "center", borderColor: "var(--ac)" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--tx2)" }}>{selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""}</span>
              {getDiscount() > 0 && <span className="tag" style={{ background: "rgba(0,224,150,.1)", color: "var(--ok)", borderColor: "rgba(0,224,150,.2)" }}>{getDiscount()}% OFF</span>}
              <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--ac)" }}>₹{getPrice()}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--tx2)" }}>/mo</span></span>

              <button className="btn bp" onClick={() => {
                if (!isPaid && selectedRoles.length > 0) {
                  // Free trial - no payment needed
                  setSubscribedRoles(selectedRoles);
                  setFreeAttempts(2);
                  setView("dashboard");
                } else {
                  subscribe();
                }
              }} style={{ padding: "10px 28px" }}>
                {isPaid ? "Subscribe →" : "Start Free Trial →"}
              </button>

            </div>
          </div>
        )}
      </div></div>
    </div>
  );
  // ═══════════════════════════════════════════════════════════
  // PAGE 5: B2C ENGINEER DASHBOARD (C1-C8 via tabs)
  // ═══════════════════════════════════════════════════════════
  if (view === "dashboard") {
    const tabs = [
      { id: "home", label: "🏠 Home", icon: "🏠" },
      { id: "scores", label: "📊 Scores", icon: "📊" },
      { id: "badges", label: "🏆 Badges", icon: "🏆" },
      { id: "profile", label: "👤 Profile", icon: "👤" },
      { id: "interview", label: "💎 Interview", icon: "💎" },
      { id: "billing", label: "💳 Billing", icon: "💳" },
      { id: "settings", label: "⚙️ Settings", icon: "⚙️" },
      { id: "help", label: "❓ Help", icon: "❓" }
    ];

    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <ToastContainer />
        <div className="page"><div className="cnt">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome, {user?.name || "Agent"}</h2>
              <div style={{ fontSize: 14, color: "var(--tx2)", marginTop: 4, fontWeight: 500 }}>
                {isPaid ? `${subscribedRoles.length} tracks` : `Free trial · ${subscribedRoles.reduce((s, rid) => s + getRemainingAttempts(rid), 0)} attempts left`} · {completedScenarios.length} completed · {streak} day streak
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="tag" style={{ padding: "5px 12px" }}>⚡ {xp} XP</span>

              {/* Notification Bell */}

              <div style={{ position: "relative" }}>
                <button className="btn bs" style={{ padding: "5px 10px", fontSize: 13 }}
                  onClick={async () => {
                    setShowNotifs(p => !p);
                    if (unreadCount > 0) {
                      const token = localStorage.getItem('token');
                      await fetch('https://threatready-db.onrender.com/api/notifications/read', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      setUnreadCount(0);
                      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
                    }
                  }}>

                  🔔{unreadCount > 0 && <span style={{ background: "var(--dn)", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: "50%", padding: "1px 4px", marginLeft: 3 }}>{unreadCount}</span>}
                </button>

                {showNotifs && (
                  <div style={{ position: "absolute", zIndex: 1000, right: 0, top: 36, width: 280,  background: "#111827", border: "1px solid #1e2536", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.6)", maxHeight: 300, overflowY: "auto" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e2536", fontSize: 13, fontWeight: 700, color: "var(--ac)", display: "flex", justifyContent: "space-between" }}>
                      <span>NOTIFICATIONS</span>
                      <span style={{ cursor: "pointer", opacity: 1 }} onClick={() => setShowNotifs(false)}>×</span>
                    </div>

                    {notifications.length === 0
                      ? <div style={{ padding: 16, fontSize: 13, color: "var(--tx2)", textAlign: "center" }}>No notifications yet</div>
                      : notifications.map((n, i) => (
                        <div key={n.id || i} style={{ padding: "10px 14px", borderBottom: i < notifications.length - 1 ? "1px solid #1e2536" : "none", background: n.is_read ? "transparent" : "rgba(0,229,255,.04)" }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 12 }} onClick={logout}>Logout</button>
            </div>
          </div>

         {/* Nav Tabs */}
          <div className="nav-tabs">
            {tabs.map(t => (
              <div key={t.id}
                className={`nav-tab ${dashTab === t.id ? "active" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => { setDashTab(t.id); localStorage.setItem('cyberprep_tab', t.id); }}>
                {t.label}
              </div>
            ))}
          </div>


          {/* ── C1: HOME ── */}
          {dashTab === "home" && (<>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[[completedScenarios.length, "Completed"], [xp, "Total XP"], [subscribedRoles.length || 1, "Tracks"], [streak, "Streak"]].map(([v, l], i) => (
                <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .05}s` }}>
                  <div className="statval" style={{ color: "var(--ac)", fontSize: 20 }}>{v}</div>
                  <div className="statlbl">{l}</div>
                </div>
              ))}
            </div>

            {/* Daily Challenge */}
            <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: dailyAnswered ? "var(--ok)" : dailyChallengeError ? "var(--dn)" : "var(--wn)", background: dailyAnswered ? "rgba(0,224,150,.03)" : dailyChallengeError ? "rgba(255,82,82,.03)" : "rgba(255,171,64,.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dailyAnswered ? "var(--ok)" : dailyChallengeError ? "var(--dn)" : "var(--wn)" }}>
                    {dailyAnswered ? "✅ Daily Challenge Complete!" : dailyChallengeError ? "⚠️ Daily Challenge Unavailable" : "🎯 Daily Challenge"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                    {dailyChallenge
                      ? `${dailyChallenge.role_id?.toUpperCase()} · ${dailyChallenge.difficulty} · +${dailyChallenge.points} XP`
                      : dailyChallengeError
                        ? "Could not load today's challenge. Please try again."
                        : "Loading today's challenge..."}
                  </div>
                  {dailyAnswered && dailyResult && (
                    <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 2 }}>
                      Score: {dailyResult.score}/100 · +{dailyResult.points_earned} XP earned
                    </div>
                  )}
                </div>
                {!dailyAnswered && dailyChallenge && (
                  <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => setShowDailyModal(true)}>
                    Start →
                  </button>
                )}
                {dailyChallengeError && (
                  <button className="btn bs" style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => { setDailyChallengeError(false); loadDashboardExtras(); }}>
                    🔄 Retry
                  </button>
                )}
              </div>
            </div>

            {/* Daily Challenge Modal */}
            {showDailyModal && dailyChallenge && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
                onClick={e => e.target === e.currentTarget && setShowDailyModal(false)}>
                <div style={{ background: "#111827", border: "1px solid #1e2536", borderRadius: 20, padding: 32, maxWidth: 520, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>
                  <div style={{ fontSize: 13, color: "var(--wn)", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🎯 DAILY CHALLENGE · +{dailyChallenge.points} XP</div>
                  <div
                    style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, lineHeight: 1.5, userSelect: "none", WebkitUserSelect: "none" }}
                    onCopy={e => e.preventDefault()}
                    onCut={e => e.preventDefault()}
                    onContextMenu={e => e.preventDefault()}
                  >{dailyChallenge.question}</div>
                  {dailyChallenge.hint && (
                    <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 12, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                      💡 Hint: {dailyChallenge.hint}
                    </div>
                  )}
                  {/* Type / Dictate Toggle */}
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
                      style={{ minHeight: 80, marginBottom: 12, fontSize: 12 }} />
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
                            style={{ minHeight: 80, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, width: "100%" }}
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
                            // Use voice transcript if in voice mode, otherwise text
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

            {/* Learning Path */}
            <div className="lbl" style={{ marginBottom: 8 }}>LEARNING PATHS</div>
            {subscribedRoles.length > 0 ? (
              subscribedRoles.map(rid => {
                const role = ROLES.find(r => r.id === rid);
                if (!role) return null;
                const completed = completedScenarios.filter(s => s?.startsWith(rid[0])).length;
                return (
                  <div key={rid} className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, cursor: "pointer" }}
                    onClick={() => { setActiveRole(rid); setView("difficulty"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{role.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{role.name}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{completed} completed</div>
                        </div>
                      </div>
                      <span style={{ color: "var(--ac)", fontSize: 12, fontWeight: 600 }}>Open →</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isPaid ? "repeat(4,1fr)" : "repeat(1,1fr)", gap: 6, marginTop: 10 }}>
                      {(isPaid ? ["Beginner", "Intermediate", "Advanced", "Expert"] : ["Beginner"]).map((d, i) => (
                        <div key={i} style={{ background: "var(--s2)", borderRadius: 6, padding: "4px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "var(--ac)" }}>
                            {d}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card fadeUp" style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10 }}>No roles selected yet</div>
                <button className="btn bp" style={{ fontSize: 13 }} onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
                  + Select Roles
                </button>
              </div>
            )}

            {!isPaid && <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>+ Add More Tracks</button>}

            {/* Leaderboard Preview */}
            <div className="card fadeUp" style={{ marginTop: 16, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="lbl">WEEKLY LEADERBOARD</div>
                {myRank && <span style={{ fontSize: 12, color: "var(--ac)" }}>Your rank: #{myRank}</span>}
              </div>
              {leaderboard.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--tx2)", textAlign: "center", padding: 12 }}>
                  Complete assessments this week to appear on the leaderboard!
                </div>
              ) : (
                leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < leaderboard.slice(0, 5).length - 1 ? "1px solid var(--bd)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mono" style={{
                        fontSize: 12, fontWeight: 700,
                        color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--tx2)"
                      }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <span style={{ fontSize: 12, color: p.id === user?.id ? "var(--ac)" : "var(--tx1)", fontWeight: p.id === user?.id ? 700 : 400 }}>
                        {p.id === user?.id ? "You" : p.name || "Anonymous"}
                      </span>
                      {p.badge && <span style={{ fontSize: 11, color: "var(--wn)" }}>{p.badge}</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {(() => {
                        const score = p.best_score ?? p.avg_score ?? p.score;
                        const numScore = parseFloat(score);
                        const isValid = score != null && !isNaN(numScore);
                        return (
                          <>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: isValid && numScore >= 7 ? "var(--ok)" : "var(--wn)" }}>
                              {isValid ? numScore.toFixed(1) : "—"}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--tx2)" }}>/10</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>)}

          {/* ── C2: SCORES & HISTORY ── */}
          {dashTab === "scores" && (<>
            <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
            {(completedScenarios.length === 0 && localSessionHistory.length === 0) ? (
              <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Scores Yet</h3>
                <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                  Complete your first interview to start seeing performance data, score trends, and skill benchmarks here.
                </p>
                <button className="btn bp" style={{ padding: "10px 28px" }} onClick={() => { setDashTab("interview"); localStorage.setItem('cyberprep_tab', 'interview'); }}>
                  Start an Interview →
                </button>
              </div>
            ) : (<>
              <div className="lbl" style={{ marginBottom: 12 }}>SCORE TRENDS</div>
              <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
                {scoreHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tx2)", fontSize: 12 }}>
                    No assessments completed yet. Your score trends will appear here after your first attempt.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={scoreHistory}>
                      <XAxis dataKey="date" tick={{ fill: "#8890b0", fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#8890b0", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #252b3b", borderRadius: 8 }} />
                      {(() => {
                        // Dynamically build lines for each role the user has attempted
                        const roleKeys = [...new Set(scoreHistory.flatMap(d => Object.keys(d).filter(k => k !== 'date')))];
                        const colors = { cloud: "#00d4ff", devsecops: "#ff6b35", appsec: "#a855f7", netsec: "#00e096", dfir: "#ffab40", grc: "#ff5252", prodsec: "#ffc107", secarch: "#9c27b0", soc: "#2196f3", threat: "#e91e63", red: "#f44336", blue: "#4caf50" };
                        return roleKeys.map(key => (
                          <Line key={key} type="monotone" dataKey={key} stroke={colors[key] || "#00d4ff"} strokeWidth={2} dot={{ r: 4 }} name={ROLES.find(r => r.id === key)?.name || key} connectNulls />
                        ));
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {scoreHistory.length === 1 && (
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 8, textAlign: "center" }}>
                    💡 Complete more assessments to see trends over time
                  </div>
                )}
              </div>
              <div className="lbl" style={{ marginBottom: 8 }}>WEAKNESS TRACKER</div>
              <div className="card fadeUp" style={{ padding: 16 }}>
                {weaknessTracker.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--tx2)", fontSize: 12 }}>
                    Complete assessments across different roles to see your strengths and weaknesses.
                  </div>
                ) : weaknessTracker.map((w, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < weaknessTracker.length - 1 ? "1px solid var(--bd)" : "none" }}>
                    <span style={{ fontSize: 12 }}>{w.area} <span style={{ fontSize: 11, color: "var(--tx2)" }}>({w.attempts} attempt{w.attempts !== 1 ? "s" : ""})</span></span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="mono" style={{ fontSize: 12, color: w.avg >= 7 ? "var(--ok)" : w.avg >= 5 ? "var(--wn)" : "var(--dn)" }}>{w.avg}/10</span>
                      <span style={{ fontSize: 14 }}>{w.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
            </div>
          </>)}

          {/* ── C3: BADGES ── */}
          {dashTab === "badges" && (<>
            <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
            <div className="lbl" style={{ marginBottom: 12 }}>YOUR BADGES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {ROLES.map(r => {
                const badge = badges.find(b => b.role === r.id);
                return (
                  <div key={r.id} className="card fadeUp" style={{ padding: 16, textAlign: "center", opacity: badge ? 1 : 0.4 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                    {badge ? (
                      <>
                        <div className="badge-card" style={{ marginTop: 8, fontSize: 8, padding: "4px 8px", borderColor: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32", color: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32" }}>
                          {badge.tier.toUpperCase()}
                        </div>
                        <button className="btn bs" style={{ marginTop: 8, fontSize: 8, padding: "3px 8px" }}>📤 Share</button>
                      </>
                    ) : <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 8 }}>🔒 Not earned</div>}
                  </div>
                );
              })}
            </div>
            <div className="lbl" style={{ marginTop: 20, marginBottom: 8 }}>MILESTONES</div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              {[["🎯 First Scenario", completedScenarios.length >= 1], ["🔥 10 Scenarios", completedScenarios.length >= 10], ["🌟 All 12 Roles", false], ["💎 Expert Badge", false], ["📅 30-Day Streak", streak >= 30]].map(([m, done], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontSize: 12, color: done ? "var(--ok)" : "var(--tx2)" }}>{m}</span>
                  <span style={{ fontSize: 12 }}>{done ? "✅" : "⬜"}</span>
                </div>
              ))}
            </div>
            </div>
          </>)}

          {/* ── C4: PROFILE ── */}
          {dashTab === "profile" && (<>
            <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
            <div className="lbl" style={{ marginBottom: 10 }}>RESUME CONTEXT</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <textarea
                className="input"
                placeholder="Paste your resume here OR upload PDF/DOC/TXT below. AI extracts key points automatically."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ minHeight: 120, marginBottom: 10 }}
              />
              <FileUpload onUpload={(text, aiData) => { setResumeText(text); if (aiData) setResumeAiData(aiData); }} label="Upload Resume (PDF/DOC/TXT)" />
              {resumeText && <div style={{ marginTop: 8, fontSize: 12, color: "var(--ok)" }}>✓ Resume loaded · AI will personalize your scenarios</div>}
              <button className="btn bp" style={{ marginTop: 10, fontSize: 13, padding: "8px 20px" }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('https://threatready-db.onrender.com/api/resume/upload', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ resume_text: resumeText })
                    });
                    if (res.ok) showToast('Resume saved successfully!', 'success');
                  } catch (e) { showToast('Failed to save resume', 'error'); }
                }}>
                💾 Save Resume
              </button>
            </div>

            {/* AI-DETECTED SKILLS (shown after resume upload) */}
            {resumeAiData && (resumeAiData.skills?.length > 0 || resumeAiData.experience_years || resumeAiData.weak_areas?.length > 0) && (
              <>
                <div className="lbl" style={{ marginBottom: 10 }}>AI ANALYSIS OF YOUR RESUME</div>
                <div className="card fadeUp" style={{ padding: 16, marginBottom: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
                  {resumeAiData.skills?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ac)", marginBottom: 6, letterSpacing: 0.5 }}>✓ WE DETECTED</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {resumeAiData.skills.map((skill, i) => (
                          <span key={i} style={{ background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.3)", color: "var(--ac)", fontSize: 13, padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeAiData.experience_years > 0 && (
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>
                      <span style={{ color: "var(--tx2)" }}>Experience: </span>
                      <span style={{ color: "var(--tx)", fontWeight: 600 }}>{resumeAiData.experience_years} years</span>
                      {resumeAiData.top_role && <span> · Top strength: <span style={{ color: "var(--ok)" }}>{resumeAiData.top_role}</span></span>}
                    </div>
                  )}
                  {resumeAiData.weak_areas?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--wn)", marginBottom: 6, letterSpacing: 0.5 }}>⚠️ AREAS TO IMPROVE</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {resumeAiData.weak_areas.map((area, i) => (
                          <span key={i} style={{ background: "rgba(255,171,64,.08)", border: "1px solid rgba(255,171,64,.25)", color: "var(--wn)", fontSize: 12, padding: "3px 8px", borderRadius: 10 }}>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeAiData.recommended_difficulty && (
                    <div style={{ marginTop: 12, padding: 10, background: "rgba(0,224,150,.06)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, marginBottom: 3 }}>🎯 AI RECOMMENDS</div>
                      <div style={{ fontSize: 12, color: "var(--tx)" }}>
                        Start with <span style={{ color: "var(--ok)", fontWeight: 700, textTransform: "capitalize" }}>{resumeAiData.recommended_difficulty}</span> difficulty
                        {resumeAiData.recommended_roles?.length > 0 && (
                          <span> · focus on <span style={{ color: "var(--ac)" }}>{resumeAiData.recommended_roles.map(rid => ROLES.find(r => r.id === rid)?.name).filter(Boolean).join(", ")}</span></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="lbl" style={{ marginBottom: 10 }}>CAREER GOALS</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10 }}>Target role and experience level</div>
              <select className="input" style={{ marginBottom: 10 }} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                <option value="">Select target role...</option>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="input" style={{ marginBottom: 10 }} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                <option value="">Select experience level...</option>
                <option value="junior">Junior (0-2 years)</option>
                <option value="mid">Mid (2-5 years)</option>
                <option value="senior">Senior (5-8 years)</option>
                <option value="lead">Lead (8+ years)</option>
              </select>
              <button className="btn bp" style={{ fontSize: 13, padding: "8px 20px" }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('https://threatready-db.onrender.com/api/profile/goals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ target_role: targetRole, experience_level: experienceLevel })
                    });
                    if (res.ok) showToast('Career goals saved!', 'success');
                  } catch (e) { showToast('Failed to save goals', 'error'); }
                }}>
                💾 Save Goals
              </button>
            </div>

            <div className="lbl" style={{ marginBottom: 10 }}>INTERVIEW READINESS</div>
            <div className="card fadeUp" style={{ padding: 20, textAlign: "center" }}>
              {readiness && readiness.has_data ? (
                <>
                  <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: readiness.overall_readiness >= 70 ? "var(--ok)" : readiness.overall_readiness >= 50 ? "var(--ac)" : "var(--wn)" }}>
                    {readiness.overall_readiness}<span style={{ fontSize: 16, color: "var(--tx2)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                    Overall Interview Readiness · based on {readiness.total_sessions} assessment{readiness.total_sessions !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
                    {[["Technical", readiness.technical], ["Communication", readiness.communication], ["Decision", readiness.decision]].map(([l, v], i) => (
                      <div key={i}>
                        <div className="mono" style={{ fontSize: 14, color: v >= 70 ? "var(--ok)" : v >= 50 ? "var(--ac)" : "var(--wn)" }}>{v}</div>
                        <div style={{ fontSize: 11, color: "var(--tx2)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--tx2)" }}>—</div>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.6 }}>
                    Complete your first assessment to see your readiness score.
                    <br />
                    <span style={{ fontSize: 12, color: "var(--tx2)" }}>Score updates automatically after each session.</span>
                  </div>
                </>
              )}
            </div>
            </div>
          </>)}

          {/* ── C5: INTERVIEW MODE ── */}
          {dashTab === "interview" && (
            <div className="fadeUp">

              {/* NOT SUBSCRIBED — show lock screen */}
              {subscribedRoles.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Interview Mode is a Premium Feature</h3>
                  <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8, lineHeight: 1.8 }}>
                    Subscribe to a role to unlock Interview Simulation Mode.<br />
                    Practice with an AI interviewer, get scored, and receive detailed feedback.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, margin: "20px 0", textAlign: "left" }}>
                    {[
                      ["🎯", "Role-specific questions"],
                      ["🔄", "Adaptive AI follow-ups"],
                      ["⏱️", "Real interview time pressure"],
                      ["📊", "Detailed score & debrief"]
                    ].map(([icon, text], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--s2)", borderRadius: 8 }}>
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn bp" style={{ padding: "14px 40px", fontSize: 14, marginTop: 8 }}
                    onClick={() => { setDashTab("billing"); localStorage.setItem('cyberprep_tab', 'billing'); }}>
                    Subscribe to Unlock →
                  </button>
                </div>
              )}

              {/* SUBSCRIBED — show full interview mode */}
              {subscribedRoles.length > 0 && (<>
                <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Interview Simulation Mode</h3>
                  <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                    AI acts as your interviewer with adaptive follow-ups, time pressure, and detailed debrief.
                  </p>

                  {/* Persona Selection */}
                  <div className="lbl" style={{ marginBottom: 10, textAlign: "left" }}>SELECT INTERVIEWER PERSONA</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
                    {[["🙂", "Friendly", "Encouraging but thorough", "friendly"],
                    ["⚖️", "Standard", "Balanced and fair", "standard"],
                    ["😤", "Tough", "Challenges everything", "tough"]
                    ].map(([icon, label, desc, val]) => (
                      <div key={val} onClick={() => setInterviewPersona(val)}
                        className="card card-glow"
                        style={{
                          padding: 16, cursor: "pointer", textAlign: "center",
                          borderColor: interviewPersona === val ? "var(--ac)" : "var(--bd)",
                          background: interviewPersona === val ? "rgba(0,229,255,.06)" : undefined,
                          transition: "all .2s"
                        }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 12, color: "var(--tx2)" }}>{desc}</div>
                        {interviewPersona === val && <div style={{ fontSize: 11, color: "var(--ac)", marginTop: 6, fontWeight: 700 }}>✓ SELECTED</div>}
                      </div>
                    ))}
                  </div>

                  {/* Subscribed Roles — all difficulties unlocked */}
                  <div className="lbl" style={{ marginBottom: 10, textAlign: "left" }}>SELECT ROLE TO PRACTICE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 20 }}>
                    {ROLES.filter(r => subscribedRoles.includes(r.id)).map(role => (
                      <div key={role.id} onClick={() => setActiveRole(role.id)}
                        className="card card-glow"
                        style={{
                          padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                          borderColor: activeRole === role.id ? "var(--ac)" : "var(--bd)",
                          background: activeRole === role.id ? "rgba(0,229,255,.06)" : undefined
                        }}>
                        <span style={{ fontSize: 26 }}>{role.icon}</span>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{role.name}</div>
                          <div style={{ fontSize: 11, color: activeRole === role.id ? "var(--ac)" : (isPaid ? "var(--ok)" : "var(--wn)"), marginTop: 2, fontWeight: 600 }}>
                            {activeRole === role.id ? "✓ SELECTED" : (isPaid ? "🔓 All levels unlocked" : "🔒 Beginner only · Subscribe to unlock all")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn bp"
                    disabled={!activeRole}
                    title={!activeRole ? "Please select a role first" : ""}
                    style={{
                      width: "100%",
                      padding: 14,
                      fontSize: 14,
                      cursor: !activeRole ? "not-allowed" : "pointer",
                      opacity: !activeRole ? 0.5 : 1
                    }}
                    onClick={() => {
                      if (!activeRole) { showToast('Please select a role first', 'warning'); return; }
                      setView("difficulty");
                    }}>
                    {!activeRole ? "Select a role to continue" : `Start ${interviewPersona.charAt(0).toUpperCase() + interviewPersona.slice(1)} Interview →`}
                  </button>
                </div>

                {/* What to expect */}
                <div className="card" style={{ padding: 16 }}>
                  <div className="lbl" style={{ marginBottom: 10 }}>WHAT TO EXPECT</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                    {[["🎯", "Role-specific questions", "Tailored to your subscribed role"],
                    ["🔄", "Adaptive follow-ups", "AI digs deeper based on your answers"],
                    ["⏱️", "Time pressure", "Simulates real interview conditions"],
                    ["📊", "Detailed debrief", "Score, strengths, weaknesses, model answers"]
                    ].map(([icon, title, desc], i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--bd)" : "none" }}>
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)" }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}
            </div>
          )}

          {/* ── C6: BILLING ── */}
          {dashTab === "billing" && (<>
            <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
            {/* Monthly / Yearly Toggle */}
            <div style={{ display: "flex", background: "var(--s2)", borderRadius: 10, padding: 4, maxWidth: 300, margin: "0 auto 24px", gap: 4 }}>
              <button
                className={`btn ${billingPeriod === "monthly" ? "bp" : "bs"}`}
                style={{ flex: 1, padding: "8px 0", fontSize: 13, border: "none" }}
                onClick={() => setBillingPeriod("monthly")}>
                Monthly
              </button>
              <button
                className={`btn ${billingPeriod === "yearly" ? "bp" : "bs"}`}
                style={{ flex: 1, padding: "8px 0", fontSize: 13, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => setBillingPeriod("yearly")}>
                Yearly
                <span style={{ fontSize: 11, background: "rgba(0,224,150,.2)", color: "var(--ok)", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>-20%</span>
              </button>
            </div>

            {/* Current Plan Status */}
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>CURRENT PLAN</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {isPaid ? `${subscribedRoles.length} Role${subscribedRoles.length > 1 ? "s" : ""} · Active` : "Free Trial"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                    {isPaid
                      ? subscribedRoles.map(r => ROLES.find(x => x.id === r)?.name).filter(Boolean).join(", ")
                      : subscribedRoles.length > 0
                        ? subscribedRoles.map(r => `${ROLES.find(x => x.id === r)?.name}: ${getRemainingAttempts(r)}`).join(" · ") + " · Beginner only"
                        : "Select roles to start trial"}
                  </div>
                </div>
                {isPaid && <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700 }}>● Active</span>}
              </div>
            </div>

            {/* Role Selection Grid */}
            <div className="lbl" style={{ marginBottom: 12 }}>
              {isPaid ? "ADD MORE ROLES" : "SUBSCRIBE TO UNLOCK ALL LEVELS"}
            </div>
            <div className="rgrid">
              {ROLES.map((r, i) => {
                const sel = selectedRoles.includes(r.id);
                const subscribed = subscribedRoles.includes(r.id);
                const monthlyPrice = r.price;
                const yearlyPrice = Math.round(r.price * 12 * 0.8);
                const savings = r.price * 12 - yearlyPrice;
                return (
                  <div key={r.id} className={`sub-card fadeUp ${sel || subscribed ? "sel" : ""}`}
                    style={{
                      animationDelay: `${i * .03}s`,
                      borderColor: subscribed ? "var(--ok)" : sel ? r.color : undefined,
                      cursor: subscribed ? "default" : "pointer",
                      opacity: subscribed ? 1 : 1,
                      pointerEvents: subscribed ? "none" : "auto"
                    }}
                    onClick={() => { if (!subscribed) toggleRole(r.id); }}>
                    {subscribed && (
                      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 8, color: "var(--ok)", fontWeight: 800, background: "rgba(0,224,150,.1)", padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(0,224,150,.3)" }}>
                        ACTIVE
                      </div>
                    )}
                    {sel && !subscribed && (
                      <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: "var(--ac)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: subscribed ? "var(--ok)" : sel ? r.color : "var(--tx2)" }}>
                      {billingPeriod === "yearly" ? `₹${yearlyPrice}/yr` : `₹${monthlyPrice}/mo`}
                    </div>
                    {billingPeriod === "yearly" && !subscribed && (
                      <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 2 }}>Save ₹{savings}/yr</div>
                    )}
                    {subscribed && (
                      <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 2 }}>🔓 All levels unlocked</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bundle Discount Banner */}
            {selectedRoles.length >= 2 && (
              <div style={{ padding: "10px 16px", background: "rgba(0,224,150,.07)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 10, margin: "16px 0", fontSize: 12, color: "var(--ok)", textAlign: "center", fontWeight: 600 }}>
                {selectedRoles.length >= 3 ? "🎉 30% bundle discount applied!" : "🎉 18% bundle discount applied for 2+ roles!"}
              </div>
            )}

            {/* Checkout Summary */}
            {selectedRoles.length > 0 && (
              <div className="card fadeUp" style={{ padding: 20, textAlign: "center", borderColor: "var(--ac)", marginTop: 4 }}>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6 }}>
                  {selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected · {billingPeriod}
                </div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: "var(--ac)", marginBottom: 4 }}>
                  ₹{billingPeriod === "yearly" ? Math.round(getPrice() * 12 * 0.8) : getPrice()}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--tx2)" }}> /{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
                {(getDiscount() > 0 || billingPeriod === "yearly") && (
                  <div style={{ fontSize: 12, color: "var(--ok)", marginBottom: 16 }}>
                    {getDiscount() > 0 ? `${getDiscount()}% bundle discount` : ""}
                    {getDiscount() > 0 && billingPeriod === "yearly" ? " + " : ""}
                    {billingPeriod === "yearly" ? "20% yearly discount" : ""}
                    {" applied"}
                  </div>
                )}
                <button className="btn bp" style={{ width: "100%", padding: 14, fontSize: 14 }}
                  onClick={subscribe}>
                  Subscribe Now →
                </button>
              </div>
            )}

            {isPaid && (
              <button className="btn bs" style={{ width: "100%", marginTop: 12, fontSize: 13, color: "var(--wn)" }}>
                Pause Subscription
              </button>
            )}
            </div>
          </>)}

          {/* ── C7: SETTINGS ── */}
          {dashTab === "settings" && (<>
            <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>PROFILE SETTINGS</div>
              <input className="input" placeholder="Full Name"
                value={settingsName || user?.name || ''}
                onChange={e => setSettingsName(e.target.value)}
                style={{ marginBottom: 8 }} />
              <input className="input" placeholder="Email" value={user?.email || ''} disabled style={{ marginBottom: 8, opacity: 0.6 }} />
              <button className="btn bp" style={{ fontSize: 13 }}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const res = await fetch('https://threatready-db.onrender.com/api/settings/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name: settingsName || user?.name })
                  });
                  if (res.ok) {
                    const updated = { ...user, name: settingsName || user?.name };
                    setUser(updated);
                    localStorage.setItem('cyberprep_user', JSON.stringify(updated));
                    showToast('Profile updated successfully!', 'success');
                  }
                }}>Save Changes</button>
            </div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>PRIVACY</div>
              {[
                ["Make profile public", profilePublic, setProfilePublic],
                ["Include in leaderboard", inLeaderboard, setInLeaderboard],
                ["Allow benchmarking data", allowBenchmarking, setAllowBenchmarking]
              ].map(([l, val, setter], i) => (
                <label key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 12, color: "var(--tx2)" }}>
                  {l}
                  <input type="checkbox" checked={val} onChange={async e => {
                    setter(e.target.checked);
                    const token = localStorage.getItem('token');
                    try {
                      const res = await fetch('https://threatready-db.onrender.com/api/settings/privacy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                          profile_public: l === "Make profile public" ? e.target.checked : profilePublic,
                          in_leaderboard: l === "Include in leaderboard" ? e.target.checked : inLeaderboard,
                          allow_benchmarking: l === "Allow benchmarking data" ? e.target.checked : allowBenchmarking
                        })
                      });
                      if (res.ok) showToast('Privacy settings saved', 'success');
                      else showToast('Failed to save settings', 'error');
                    } catch (e) { showToast('Error: ' + e.message, 'error'); }
                  }} />
                </label>
              ))}
            </div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>DATA</div>
              <button className="btn bp" style={{ width: "100%", marginBottom: 8 }} onClick={async () => {
                showToast('Generating your report...', 'info');
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('https://threatready-db.onrender.com/api/settings/export', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const d = await res.json();

                  const u = d.user || {};
                  const st = d.stats || {};
                  const scores = d.skill_scores || [];
                  const sessions = d.sessions || [];
                  const bdgs = d.badges || [];

                  const avgScore = sessions.filter(s => s.overall_score).length > 0
                    ? (sessions.filter(s => s.overall_score).reduce((a, s) => a + parseFloat(s.overall_score || 0), 0) / sessions.filter(s => s.overall_score).length).toFixed(1)
                    : '—';

                  const bestScore = sessions.filter(s => s.overall_score).length > 0
                    ? Math.max(...sessions.filter(s => s.overall_score).map(s => parseFloat(s.overall_score || 0))).toFixed(1)
                    : '—';

                  const roleNames = { cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security', netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect', dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst', threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team' };

                  const scoreRows = scores.map(s => `
                    <tr>
                      <td style="padding:10px;font-weight:600">${roleNames[s.role_id] || s.role_id}</td>
                      <td style="padding:10px;font-weight:800;color:${s.total_score >= 7 ? '#00e096' : s.total_score >= 5 ? '#ffab40' : '#ff5252'}">${parseFloat(s.total_score || 0).toFixed(1)}/10</td>
                      <td style="padding:10px;color:${s.badge_level === 'Platinum' ? '#e2e8f0' : s.badge_level === 'Gold' ? '#f59e0b' : s.badge_level === 'Silver' ? '#94a3b8' : '#b45309'}">${s.badge_level || '—'}</td>
                      <td style="padding:10px">${s.percentile || 0}th percentile</td>
                      <td style="padding:10px;color:#8890b0">${new Date(s.updated_at).toLocaleDateString()}</td>
                    </tr>`).join('');

                  const sessionRows = sessions.slice(0, 10).map(s => `
                    <tr>
                      <td style="padding:8px;color:#8890b0">${s.scenario_id || '—'}</td>
                      <td style="padding:8px;font-weight:700;color:${parseFloat(s.overall_score || 0) >= 7 ? '#00e096' : parseFloat(s.overall_score || 0) >= 5 ? '#ffab40' : '#ff5252'}">${s.overall_score ? parseFloat(s.overall_score).toFixed(1) + '/10' : 'Incomplete'}</td>
                      <td style="padding:8px;color:${s.badge === 'Gold' ? '#f59e0b' : s.badge === 'Platinum' ? '#e2e8f0' : '#94a3b8'}">${s.badge || '—'}</td>
                      <td style="padding:8px;color:#ffab40">+${s.earned_xp || 0} XP</td>
                      <td style="padding:8px;color:#8890b0">${s.completed_at ? new Date(s.completed_at).toLocaleDateString() : 'In Progress'}</td>
                    </tr>`).join('');

                  const badgeItems = bdgs.map(b => `<span style="display:inline-block;margin:4px;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:#00e5ff">🏅 ${b.name}</span>`).join('');

                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
                    <title>ThreatReady Report - ${u.name || 'User'}</title>
                    <style>
                      *{box-sizing:border-box;margin:0;padding:0}
                      body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0e1a;color:#e8eaf6;padding:40px;line-height:1.6}
                      .header{text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #1e2536}
                      .logo{font-size:32px;font-weight:900;color:#00e5ff;letter-spacing:2px;margin-bottom:4px}
                      .subtitle{font-size:13px;color:#8890b0}
                      .name{font-size:22px;font-weight:800;margin:12px 0 4px}
                      .email{font-size:13px;color:#8890b0}
                      .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}
                      .stat{background:#111827;border:1px solid #1e2536;border-radius:12px;padding:16px;text-align:center}
                      .stat-val{font-size:28px;font-weight:900;color:#00e5ff;font-family:monospace}
                      .stat-lbl{font-size:10px;color:#8890b0;margin-top:4px;text-transform:uppercase;letter-spacing:1px}
                      .section{margin:28px 0}
                      .section-title{font-size:11px;font-weight:800;color:#00e5ff;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #1e2536}
                      table{width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden}
                      th{background:#1a1f2e;padding:10px;text-align:left;font-size:10px;color:#00e5ff;letter-spacing:1px;text-transform:uppercase}
                      tr{border-bottom:1px solid #1e2536}
                      tr:last-child{border-bottom:none}
                      tr:hover{background:#1a1f2e}
                      .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #1e2536;font-size:11px;color:#5a6380}
                      @media print{body{background:#fff;color:#000} .header,.stat,.section{border-color:#ddd} .stat-val,.logo{color:#0066cc} th{background:#f0f0f0;color:#333}}
                    </style></head><body>
                    <div class="header">
                      <div class="logo">⚡ THREATREADY</div>
                      <div class="subtitle">Cybersecurity Assessment Platform — Personal Report</div>
                      <div class="name">${u.name || 'User'}</div>
                      <div class="email">${u.email || ''} &nbsp;·&nbsp; Member since ${new Date(u.created_at).toLocaleDateString()}</div>
                    </div>

                    <div class="stats-grid">
                      <div class="stat"><div class="stat-val">${st.total_xp || 0}</div><div class="stat-lbl">Total XP</div></div>
                      <div class="stat"><div class="stat-val">${sessions.filter(s => s.completed_at).length}</div><div class="stat-lbl">Sessions Done</div></div>
                      <div class="stat"><div class="stat-val">${avgScore}</div><div class="stat-lbl">Avg Score</div></div>
                      <div class="stat"><div class="stat-val">${bestScore}</div><div class="stat-lbl">Best Score</div></div>
                    </div>

                    ${scores.length > 0 ? `
                    <div class="section">
                      <div class="section-title">Skill Scores by Role</div>
                      <table><thead><tr><th>Role</th><th>Score</th><th>Badge</th><th>Percentile</th><th>Last Updated</th></tr></thead>
                      <tbody>${scoreRows}</tbody></table>
                    </div>` : ''}

                    ${bdgs.length > 0 ? `
                    <div class="section">
                      <div class="section-title">Earned Badges (${bdgs.length})</div>
                      <div style="margin-top:8px">${badgeItems}</div>
                    </div>` : ''}

                    ${sessions.length > 0 ? `
                    <div class="section">
                      <div class="section-title">Recent Sessions (Last 10)</div>
                      <table><thead><tr><th>Scenario</th><th>Score</th><th>Badge</th><th>XP</th><th>Date</th></tr></thead>
                      <tbody>${sessionRows}</tbody></table>
                    </div>` : ''}

                    <div class="footer">
                      ThreatReady &nbsp;·&nbsp; Report generated on ${new Date().toLocaleString()} &nbsp;·&nbsp; Confidential
                    </div>
                  </body></html>`;

                  const w = window.open('', '_blank');
                  w.document.write(html);
                  w.document.close();
                  setTimeout(() => w.print(), 600);
                  showToast('Report ready — use Print → Save as PDF', 'success');
                } catch (e) { showToast('Report failed: ' + e.message, 'error'); }
              }}>📊 Download My Report (PDF)</button>
              <button className="btn bdn" style={{ fontSize: 13 }} onClick={() => showConfirm('Delete your account permanently? All data will be lost.', async () => { const token = localStorage.getItem('token'); const res = await fetch('https://threatready-db.onrender.com/api/settings/delete-account', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { localStorage.clear(); setUser(null); setView('landing'); showToast('Account deleted.', 'info'); } })}>🗑️ Delete Account</button>
            </div>
            
            </div>
          </>)}

          {/* ── C8: HELP ── */}
          {dashTab === "help" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>FREQUENTLY ASKED QUESTIONS</div>
            {[["How is my score calculated?", "Each question is scored on 3 dimensions: Technical Depth, Communication Quality, and Decision-Making. Overall = average of 5 questions."],
            ["Can I retake scenarios?", "Yes! Paid users get unlimited attempts. Each attempt loads a different architecture from our pool."],
            ["Are badges valid for hiring?", "Badges include a verification link (cyberprep.io/verify/[id]) that hiring managers can check."],
            ["Can I share my profile?", "Yes. Toggle your profile to public in Settings. Share your unique URL on LinkedIn."]
            ].map(([q, a], i) => (
              <div key={i} className="card fadeUp" style={{ padding: 14, marginBottom: 8, animationDelay: `${i * .05}s` }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{q}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
            <div className="card fadeUp" style={{ padding: 16, marginTop: 8 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>FEEDBACK</div>
              {feedbackSent ? (
                <div style={{ color: "var(--ok)", fontSize: 13, padding: "10px 0" }}>
                  ✅ Thank you! Your feedback has been submitted.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <button className={`btn ${feedbackInputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setFeedbackInputMode("text")}>✏️ Type</button>
                    <button className={`btn ${feedbackInputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setFeedbackInputMode("voice")}>🎤 Dictate</button>
                  </div>
                  {feedbackInputMode === "text" ? (
                    <textarea
                      className="input"
                      placeholder="Report a problem, suggest a feature, or share feedback..."
                      style={{ minHeight: 60, marginBottom: 10 }}
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                    />
                  ) : (
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <div className={`rec-ring ${feedbackVoice.recording ? "active" : ""}`}
                        onClick={() => {
                          if (feedbackVoice.recording) {
                            feedbackVoice.stop();
                            if (feedbackVoice.transcript?.trim()) {
                              setFeedbackText(prev => (prev ? prev + ' ' : '') + feedbackVoice.transcript.trim());
                              feedbackVoice.reset();
                            }
                          } else {
                            feedbackVoice.start();
                          }
                        }}
                        style={{ margin: "0 auto 8px" }}>{feedbackVoice.recording ? "⏹" : "🎤"}</div>
                      <div style={{ fontSize: 12, color: feedbackVoice.recording ? "var(--dn)" : "var(--tx2)" }}>
                        {feedbackVoice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
                      </div>
                      {feedbackVoice.transcript && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6 }}>{feedbackVoice.transcript}</div>}
                      {feedbackText && !feedbackVoice.recording && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6, border: "1px solid var(--bd)" }}>{feedbackText}</div>}
                    </div>
                  )}
                  <button
                    className="btn bp"
                    style={{ fontSize: 13 }}
                    disabled={!feedbackText.trim() && !feedbackVoice.transcript?.trim()}
                    onClick={async () => {
                      try {
                        const finalMessage = feedbackText.trim() || feedbackVoice.transcript?.trim() || "";
                        const token = localStorage.getItem('token');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        await fetch('https://threatready-db.onrender.com/api/feedback', {
                          method: 'POST',
                          headers,
                          body: JSON.stringify({ message: finalMessage })
                        });
                        setFeedbackSent(true);
                        setFeedbackText("");
                        feedbackVoice.reset();
                        setFeedbackInputMode("text");
                        setTimeout(() => setFeedbackSent(false), 4000);
                      } catch (e) {
                        showToast('Failed to submit. Please try again.', 'error');
                      }
                    }}
                  >
                    Submit Feedback
                  </button>
                </>
              )}
            </div>
          </>)}
        </div></div>
      </div>
    );
  }
  // ═══════════════════════════════════════════════════════════
  // PAGE 6: B2B HIRING MANAGER DASHBOARD (8 tabs — mirrors B2C)
  // ═══════════════════════════════════════════════════════════
  if (view === "b2b-dashboard") {
    const b2bTabs = [
      { id: "overview", label: "📊 Overview" },
      { id: "create", label: "📝 Create Assessment" },
      { id: "candidates", label: "👥 Candidates" },
      { id: "reports", label: "📄 Reports" },
      { id: "teamskills", label: "🏢 Team Skills" },

      { id: "library", label: "📚 Library" },
      { id: "settings", label: "⚙️ Settings" }
    ];

    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <ToastContainer />

        {/* ── REPORT MODAL ── */}
        {reportModal && (() => {
          const evals = reportModal.evaluations || [];
          const score = parseFloat(reportModal.overall_score) || 0;
          const avgStrength = evals.filter(e => e.score >= 7).length;
          const avgWeak = evals.filter(e => e.score < 5).length;
          const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
                         score >= 7 ? "Strong candidate — recommended for next round" :
                         score >= 6 ? "Good candidate — consider for interview" :
                         score >= 5 ? "Average — more assessment needed" :
                         score >= 4 ? "Below expectations — not recommended" :
                         "Not ready — significant skill gaps";
          const verdictColor = score >= 7 ? "var(--ok)" : score >= 5 ? "var(--wn)" : "var(--dn)";
          const badgeColor = score >= 8 ? "#e2e8f0" : score >= 7 ? "#f59e0b" : score >= 6 ? "#94a3b8" : score >= 4 ? "#cd7f32" : "#ff5252";

          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
              onClick={() => setReportModal(null)}>
              <div onClick={e => e.stopPropagation()}
                style={{ width: "92%", maxWidth: 900, maxHeight: "92vh", overflow: "hidden", background: "#0f1420", border: "1px solid var(--ac)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(0,229,255,0.25)", display: "flex", flexDirection: "column" }}>

                <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", background: "#0a0e1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ac)", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>📊 ASSESSMENT RESULTS</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{reportModal.name}</div>
                    <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 2 }}>{reportModal.email} · {reportModal.assessment_name || (ROLES.find(r => r.id === reportModal.role_id)?.name + ' Assessment')}</div>
                  </div>
                  <span style={{ cursor: "pointer", fontSize: 28, color: "var(--tx2)", padding: "0 8px" }} onClick={() => setReportModal(null)}>×</span>
                </div>

                <div style={{ overflow: "auto", flex: 1 }}>

                  <div style={{ padding: "32px 28px", textAlign: "center", borderBottom: "1px solid #1e2536", background: "linear-gradient(180deg, rgba(0,229,255,0.04) 0%, transparent 100%)" }}>
                    <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8, letterSpacing: 2, fontWeight: 700 }}>OVERALL SCORE</div>
                    <div className="mono" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, color: verdictColor, marginBottom: 8 }}>
                      {score.toFixed(1)}<span style={{ fontSize: 28, color: "var(--tx2)" }}>/10</span>
                    </div>
                    <div style={{ display: "inline-block", border: `2px solid ${badgeColor}`, color: badgeColor, padding: "6px 24px", borderRadius: 24, fontSize: 12, fontWeight: 800, letterSpacing: 2, marginTop: 8, marginBottom: 14 }}>
                      {(reportModal.badge || '').toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: verdictColor, fontWeight: 600, marginTop: 4 }}>
                      {verdict}
                    </div>
                  </div>

                  <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>ROLE</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{ROLES.find(r => r.id === reportModal.role_id)?.icon} {ROLES.find(r => r.id === reportModal.role_id)?.name || reportModal.role_id}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>DIFFICULTY</div>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{reportModal.difficulty}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>QUESTIONS</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{evals.length} answered</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>COMPLETED</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{reportModal.completed_at?.substring(0, 10) || '—'}</div>
                    </div>
                  </div>

                  <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: 14, background: "rgba(0,224,150,.05)", border: "1px solid rgba(0,224,150,.25)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>✓ STRONG ANSWERS</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ok)" }}>{avgStrength}</div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Questions scored 7+ / 10</div>
                    </div>
                    <div style={{ padding: 14, background: "rgba(255,82,82,.05)", border: "1px solid rgba(255,82,82,.25)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--dn)", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>✗ WEAK AREAS</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--dn)" }}>{avgWeak}</div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Questions scored below 5 / 10</div>
                    </div>
                  </div>

                  <div style={{ padding: "24px 28px" }}>
                    <div style={{ fontSize: 12, color: "var(--ac)", fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>📝 DETAILED QUESTION BREAKDOWN</div>
                    {evals.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 30, color: "var(--tx2)", fontSize: 12 }}>No evaluation data available</div>
                    ) : (
                      evals.map((ev, i) => (
                        <div key={i} style={{ marginBottom: 18, padding: 18, background: "var(--s2)", borderRadius: 12, border: `1px solid ${ev.score >= 7 ? "rgba(0,224,150,.3)" : ev.score >= 5 ? "rgba(245,158,11,.3)" : "rgba(255,82,82,.3)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--bd)" }}>
                            <span style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 700, letterSpacing: 1 }}>QUESTION {i + 1} · {ev.category || 'General'}</span>
                            <span className="mono" style={{ fontSize: 16, fontWeight: 900, color: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{ev.score}/10</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--tx1)", lineHeight: 1.5 }}>❓ {ev.question}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 12, padding: 12, background: "var(--s1)", borderRadius: 8, lineHeight: 1.6, borderLeft: "3px solid var(--tx3)" }}>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>CANDIDATE'S ANSWER</div>
                            {ev.answer || '(No answer provided)'}
                          </div>
                          {ev.strengths && (
                            <div style={{ fontSize: 13, color: "var(--ok)", marginBottom: 8, padding: 10, background: "rgba(0,224,150,.05)", borderRadius: 8, borderLeft: "3px solid var(--ok)" }}>
                              <strong>✓ Strengths:</strong> {ev.strengths}
                            </div>
                          )}
                          {ev.weaknesses && (
                            <div style={{ fontSize: 13, color: "var(--dn)", marginBottom: 8, padding: 10, background: "rgba(255,82,82,.05)", borderRadius: 8, borderLeft: "3px solid var(--dn)" }}>
                              <strong>✗ Weaknesses:</strong> {ev.weaknesses}
                            </div>
                          )}
                          {ev.improved_answer && ev.improved_answer !== '-' && (
                            <div style={{ fontSize: 13, color: "var(--ac)", marginTop: 8, padding: 10, background: "rgba(0,229,255,.05)", borderRadius: 8, borderLeft: "3px solid var(--ac)" }}>
                              <strong>💡 Ideal Answer:</strong> {ev.improved_answer}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="page"><div className="cnt">

          {/* ── HEADER ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{companyName || user?.name || 'Hiring Dashboard'}</h2>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                {isHrPaid
                  ? `✓ ${HR_PRICING[teamSize]?.planName || 'Active subscription'} · ${teamSize} people`
                  : `Free trial · ${subscribedRoles.reduce((s, rid) => s + getRemainingAttempts(rid), 0)} attempts left`}
                {" · "}{candidates.length} candidates · {assessments.length} assessments
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
              {/* ═══ Subscribe to Unlock button (only for free trial HR users) ═══ */}
              {!isHrPaid && (
                <button
                  className="btn bp"
                  style={{ padding: "6px 14px", fontSize: 13, fontWeight: 700, marginRight: 4 }}
                  onClick={() => {
                    setHrModalCompanyName(companyName || '');
                    setHrModalTeamSize(teamSize || '11-50');
                    setShowHrSubscribeModal(true);
                  }}>
                  🔓 Subscribe to Unlock More Features
                </button>
              )}
              <span className="tag" style={{ padding: "5px 12px" }}>⚡ {xp} XP</span>

              {/* Notification Bell */}
              <div style={{ position: "relative" }}>
                <button className="btn bs" style={{ padding: "5px 10px", fontSize: 14, position: "relative" }}
                  onClick={async () => {
                    setShowNotifs(p => !p);
                    if (unreadCount > 0) {
                      const token = localStorage.getItem('token');
                      await fetch('https://threatready-db.onrender.com/api/notifications/read', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      setUnreadCount(0);
                    }
                  }}>
                  🔔{unreadCount > 0 && <span style={{ background: "var(--dn)", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: "50%", padding: "1px 4px", marginLeft: 3 }}>{unreadCount}</span>}
                </button>
                {showNotifs && (
                  <>
                    {/* Backdrop - dim everything else + click outside to close */}
                    <div
                      style={{
                        position: "absolute", zIndex: 1000,
                        inset: 0,
                        
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(2px)"
                      }}
                      onClick={() => setShowNotifs(false)}
                    />
                    {/* Dropdown panel */}
                    <div style={{
                      position: "absolute", zIndex: 1000,
                      top: 80,
                      right: 24,
                      width: 360,
                      maxHeight: "80vh",
                      overflow: "auto",
                      background: "#0f1420",
                      border: "1px solid var(--ac)",
                      borderRadius: 12,
                      boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 30px rgba(0,229,255,0.15)",
                      
                    }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2536", fontSize: 13, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0e1a", position: "sticky", top: 0 }}>
                        <span>NOTIFICATIONS ({notifications.length})</span>
                        <span style={{ cursor: "pointer", fontSize: 16, color: "var(--tx2)" }} onClick={() => setShowNotifs(false)}>×</span>
                      </div>
                      {notifications.length === 0
                        ? <div style={{ padding: 20, fontSize: 13, color: "var(--tx2)", textAlign: "center" }}>No notifications yet</div>
                        : notifications.map((n, i) => (
                          <div key={n.id || i} style={{ padding: "12px 16px", borderBottom: i < notifications.length - 1 ? "1px solid #1e2536" : "none", background: n.is_read ? "transparent" : "rgba(0,229,255,.04)" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx1)", lineHeight: 1.4 }}>{n.title || n.type}</div>
                            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 5 }}>{n.created_at?.substring(0, 16).replace('T', ' ')}</div>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )}
              </div>

              
              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 12 }} onClick={logout}>Logout</button>
            </div>
          </div>

          {/* ── NAV TABS ── */}
          <div className="nav-tabs">
            {b2bTabs.map(t => (
              <div key={t.id} className={`nav-tab ${b2bTab === t.id ? "active" : ""}`}
                onClick={() => { setB2bTab(t.id); localStorage.setItem('cyberprep_b2btab', t.id); }}>
                {t.label}
              </div>
            ))}
          </div>

          {/* ═══ FADE OVERLAY for free trial HR users ═══ */}
          <div style={{ opacity: isHrPaid ? 1 : 0.4, pointerEvents: isHrPaid ? "auto" : "none", transition: "opacity 0.3s" }}>

          {/* ── B1: HOME ── */}
          {b2bTab === "overview" && (<>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                [b2bStats.total_candidates, "Candidates"],
                [b2bStats.assessed, "Assessed"],
                [b2bStats.total_assessments, "Assessments"],
                [b2bStats.avg_score || "—", "Avg Score"]
              ].map(([v, l], i) => (
                <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .05}s` }}>
                  <div className="statval" style={{ color: "var(--ac)", fontSize: 20 }}>
                    {b2bLoading ? <span className="loader" style={{ width: 14, height: 14 }} /> : v}
                  </div>
                  <div className="statlbl">{l}</div>
                </div>
              ))}
            </div>

            {/* HR NOTIFICATIONS */}
            <div className="lbl" style={{ marginBottom: 10 }}>🔔 NOTIFICATIONS</div>
            {(() => {
              const completed = candidates.filter(c => c.status === "completed");
              const inProgress = candidates.filter(c => c.status === "in_progress");
              const pending = candidates.filter(c => c.status === "not_started" || !c.status);
              if (completed.length === 0 && inProgress.length === 0 && pending.length === 0) {
                return (
                  <div className="card fadeUp" style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--tx2)" }}>
                    No notifications yet. Invite candidates to get started.
                  </div>
                );
              }
              return (
                <div style={{ marginBottom: 20 }}>
                  {completed.slice(0, 3).map((c, i) => (
                    <div key={c.id} className="card fadeUp" style={{ padding: 14, marginBottom: 8, borderLeft: "3px solid var(--ok)", animationDelay: `${i * .04}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)" }}>✅ {c.candidate_name || c.candidate_email?.split("@")[0]} completed assessment</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                            {ROLES.find(r => r.id === c.role_id)?.name || c.role_id} · Score: <strong style={{ color: c.overall_score >= 7 ? "var(--ok)" : c.overall_score >= 5 ? "var(--wn)" : "var(--dn)" }}>{c.overall_score}/10</strong>
                          </div>
                        </div>
                        <button className="btn bs" style={{ fontSize: 11, padding: "4px 10px" }}
                          onClick={() => { setB2bTab("teamskills"); localStorage.setItem('cyberprep_b2btab', 'teamskills'); }}>
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                  {inProgress.slice(0, 2).map((c, i) => (
                    <div key={c.id} className="card fadeUp" style={{ padding: 14, marginBottom: 8, borderLeft: "3px solid var(--wn)", animationDelay: `${i * .04}s` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wn)" }}>● {c.candidate_name || c.candidate_email?.split("@")[0]} is taking the assessment now</div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>{ROLES.find(r => r.id === c.role_id)?.name || c.role_id}</div>
                    </div>
                  ))}
                  {pending.length > 0 && (
                    <div className="card fadeUp" style={{ padding: 14, borderLeft: "3px solid var(--tx3)" }}>
                      <div style={{ fontSize: 12, color: "var(--tx2)" }}>⏳ <strong>{pending.length}</strong> candidate(s) haven't started yet</div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 16 }}>
              <button className="btn bp" onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>+ Create Assessment</button>
              <button className="btn bs" onClick={() => { setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates'); }}>Invite Candidates →</button>
            </div>

          </>)}

          {/* ── B2: SCORES (Candidate skill scores — empty state guard) ── */}
          {b2bTab === "candidates" && (<>
            {/* ── INVITE CANDIDATE FORM ── */}
            <div className="card fadeUp" style={{ padding: 22, marginBottom: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
              <div className="lbl" style={{ marginBottom: 12 }}>📧 INVITE CANDIDATES</div>

              {/* Mode selector tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <button className={`btn ${inviteMode === "individual" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("individual"); setInviteMsg(''); }}>👤 Individual</button>
                <button className={`btn ${inviteMode === "multiple" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("multiple"); setInviteMsg(''); }}>👥 Paste Multiple</button>
                <button className={`btn ${inviteMode === "csv" ? "bp" : "bs"}`} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { setInviteMode("csv"); setInviteMsg(''); }}>📄 Upload CSV</button>
              </div>

              {/* MODE: Individual email */}
              {inviteMode === "individual" && (
                <input id="invite-email-input" className="input" type="email" placeholder="candidate@company.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ marginBottom: 10 }} />
              )}

              {/* MODE: Paste multiple emails */}
              {inviteMode === "multiple" && (
                <div style={{ marginBottom: 10 }}>
                  <textarea className="input" placeholder={"Paste emails (one per line OR comma-separated)\n\nExample:\njohn@company.com\njane@company.com\nbob@company.com"}
                    value={inviteMultipleEmails}
                    onChange={e => setInviteMultipleEmails(e.target.value)}
                    style={{ minHeight: 120, fontFamily: "monospace", fontSize: 13 }} />
                  {inviteMultipleEmails.trim() && (() => {
                    const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                    return (
                      <div style={{ fontSize: 12, color: emails.length > 0 ? "var(--ok)" : "var(--wn)", marginTop: 6 }}>
                        {emails.length > 0 ? `✓ ${emails.length} valid email${emails.length !== 1 ? "s" : ""} detected` : "⚠️ No valid emails detected yet"}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MODE: CSV upload */}
              {inviteMode === "csv" && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ padding: 14, border: "1px dashed var(--bd)", borderRadius: 8, background: "var(--s2)", textAlign: "center" }}>
                    <input type="file" id="csv-invite-upload" accept=".csv,.txt" style={{ display: "none" }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setInviteCsvFile(file);
                        const text = await file.text();
                        // Parse CSV — extract all valid email patterns from any column
                        const emailRegex = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                        const matches = text.match(emailRegex) || [];
                        const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))];
                        setInviteParsedEmails(uniqueEmails);
                        setInviteMsg(uniqueEmails.length > 0 ? `✅ Found ${uniqueEmails.length} email${uniqueEmails.length !== 1 ? "s" : ""} in file` : '❌ No valid emails found in file');
                        setTimeout(() => setInviteMsg(''), 3000);
                      }} />
                    <label htmlFor="csv-invite-upload" style={{ cursor: "pointer", display: "inline-block" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                      <div style={{ fontSize: 12, color: "var(--tx)", fontWeight: 600 }}>
                        {inviteCsvFile ? inviteCsvFile.name : "Click to upload CSV"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>
                        Any column with email addresses works · .csv or .txt
                      </div>
                    </label>
                  </div>
                  {inviteParsedEmails.length > 0 && (
                    <div style={{ marginTop: 10, padding: 10, background: "rgba(0,224,150,.04)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 6, maxHeight: 120, overflowY: "auto" }}>
                      <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700, marginBottom: 6 }}>
                        {inviteParsedEmails.length} EMAIL{inviteParsedEmails.length !== 1 ? "S" : ""} READY TO INVITE
                      </div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", fontFamily: "monospace", lineHeight: 1.6 }}>
                        {inviteParsedEmails.slice(0, 20).join(", ")}
                        {inviteParsedEmails.length > 20 && ` ... and ${inviteParsedEmails.length - 20} more`}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assessment Selector — links to saved assessment with custom questions */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ASSESSMENT (Optional — links to saved assessment)</div>
                <select className="input" value={inviteAssessmentId}
                  onChange={e => {
                    const id = e.target.value;
                    setInviteAssessmentId(id);
                    if (id) {
                      const a = assessments.find(x => String(x.id) === String(id));
                      if (a) {
                        setInviteRole(a.role_id);
                        setInviteDiff(a.difficulty);
                      }
                    }
                  }}>
                  <option value="">— Generate new questions (5 default) —</option>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {ROLES.find(r => r.id === a.role_id)?.name} · {a.difficulty} · {a.question_count || 5} Q
                    </option>
                  ))}
                </select>
                {inviteAssessmentId && (
                  <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 4 }}>
                    ✅ Candidates will receive the full set of questions from this assessment
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ROLE</div>
                  <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} disabled={!!inviteAssessmentId}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>DIFFICULTY</div>
                  <select className="input" value={inviteDiff} onChange={e => setInviteDiff(e.target.value)} disabled={!!inviteAssessmentId}>
                    {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {inviteMsg && (
                <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: inviteMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: inviteMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
                  {inviteMsg}
                </div>
              )}
              <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 14 }}
                disabled={(() => {
                  if (inviteMode === "individual") return !inviteEmail.trim();
                  if (inviteMode === "multiple") {
                    const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                    return emails.length === 0;
                  }
                  if (inviteMode === "csv") return inviteParsedEmails.length === 0;
                  return true;
                })()}
                onClick={async () => {
                  // Collect emails based on current mode
                  let emailsToSend = [];
                  if (inviteMode === "individual") {
                    if (!inviteEmail.trim()) return;
                    emailsToSend = [inviteEmail.trim()];
                  } else if (inviteMode === "multiple") {
                    emailsToSend = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                    if (emailsToSend.length === 0) { setInviteMsg('❌ No valid emails found'); return; }
                  } else if (inviteMode === "csv") {
                    emailsToSend = inviteParsedEmails;
                    if (emailsToSend.length === 0) { setInviteMsg('❌ Upload a CSV first'); return; }
                  }

                  setInviteMsg(`Sending invite${emailsToSend.length > 1 ? `s to ${emailsToSend.length} candidates` : ''}...`);
                  try {
                    const token = localStorage.getItem('token');
                    const payload = {
                      role_id: inviteRole,
                      difficulty: inviteDiff
                    };
                    if (emailsToSend.length === 1) {
                      payload.candidate_email = emailsToSend[0];
                    } else {
                      payload.candidate_emails = emailsToSend;
                    }
                    if (inviteAssessmentId) payload.assessment_id = parseInt(inviteAssessmentId);
                    const res = await fetch('https://threatready-db.onrender.com/api/b2b/invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.candidate || data.candidates) {
                      const sentCount = data.candidates ? data.candidates.length : 1;
                      setInviteMsg(`✅ Invite${sentCount > 1 ? `s` : ''} sent to ${sentCount} candidate${sentCount > 1 ? 's' : ''}`);
                      // Clear form
                      setInviteEmail('');
                      setInviteMultipleEmails('');
                      setInviteCsvFile(null);
                      setInviteParsedEmails([]);
                      loadB2bData();
                      setTimeout(() => setInviteMsg(''), 4000);
                    } else {
                      setInviteMsg('❌ ' + (data.error || 'Failed'));
                    }
                  } catch (e) { setInviteMsg('❌ ' + e.message); }
                }}>
                📧 {inviteMode === "individual" ? "Send Assessment Invite" :
                     inviteMode === "multiple" ? `Send Invites to All${(() => {
                       const emails = inviteMultipleEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                       return emails.length > 0 ? ` (${emails.length})` : '';
                     })()}` :
                     `Send Invites to All${inviteParsedEmails.length > 0 ? ` (${inviteParsedEmails.length})` : ''}`}
              </button>
            </div>

            {/* ── ALL CANDIDATES TABLE ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="lbl">ALL CANDIDATES ({filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length})</div>
                {selectedCandidates.length > 0 && (
                  <>
                    <button className="btn" style={{ fontSize: 12, padding: "4px 10px", background: "rgba(0,224,150,.15)", border: "1px solid var(--ok)", color: "var(--ok)" }}
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        const selectedCompleted = candidates.filter(c => selectedCandidates.includes(c.id) && c.status === 'completed');
                        if (selectedCompleted.length === 0) {
                          showToast('No completed assessments in selection', 'error');
                          return;
                        }
                        showToast(`Generating ${selectedCompleted.length} PDF(s)...`, 'info');
                        for (const c of selectedCompleted) {
                          try {
                            const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (!data.candidate) continue;
                            const cand = data.candidate;
                            const score = parseFloat(cand.overall_score) || 0;
                            const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#f59e0b' : '#ff5252';
                            const badgeColor = score >= 8 ? '#e2e8f0' : score >= 7 ? '#f59e0b' : score >= 6 ? '#94a3b8' : score >= 4 ? '#cd7f32' : '#ff5252';
                            const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
                                           score >= 7 ? "Strong candidate — recommended for next round" :
                                           score >= 6 ? "Good candidate — consider for interview" :
                                           score >= 5 ? "Average — more assessment needed" :
                                           score >= 4 ? "Below expectations — not recommended" :
                                           "Not ready — significant skill gaps";
                            const evals = cand.evaluations || [];
                            const strongCount = evals.filter(e => e.score >= 7).length;
                            const weakCount = evals.filter(e => e.score < 5).length;
                            const roleName = ROLES.find(r => r.id === cand.role_id)?.name || cand.role_id;
                            const escape = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
                            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report - ${escape(cand.name)}</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
.header { border-bottom: 3px solid #00b8d4; padding-bottom: 16px; margin-bottom: 24px; }
.brand { color: #00b8d4; font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
.subtitle { color: #666; font-size: 11px; margin-bottom: 12px; }
h1 { font-size: 20px; margin: 0 0 6px 0; }
.meta { color: #666; font-size: 12px; }
.score-card { background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%); color: #fff; padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0; }
.score-label { font-size: 11px; color: #8890b0; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px; }
.score-value { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; margin-bottom: 8px; }
.score-max { font-size: 22px; color: #8890b0; }
.badge { display: inline-block; border: 2px solid ${badgeColor}; color: ${badgeColor}; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 2px; margin: 12px 0; }
.verdict { font-size: 13px; color: ${scoreColor}; font-weight: 600; margin-top: 8px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
.stat { background: #f5f7fa; padding: 12px; border-radius: 8px; text-align: center; }
.stat-label { font-size: 9px; color: #666; letter-spacing: 1px; margin-bottom: 4px; font-weight: 700; }
.stat-val { font-size: 13px; font-weight: 700; }
.summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
.sum-box { padding: 14px; border-radius: 10px; border: 1px solid; }
.sum-strong { background: #e6faf1; border-color: #00c48a; }
.sum-weak { background: #fff0f0; border-color: #ff5252; }
.sum-count { font-size: 26px; font-weight: 900; }
.sum-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
.sum-desc { font-size: 10px; color: #666; margin-top: 2px; }
.section-title { font-size: 13px; color: #00b8d4; font-weight: 700; letter-spacing: 2px; margin: 28px 0 14px; text-transform: uppercase; border-bottom: 2px solid #00b8d4; padding-bottom: 6px; }
.q-block { margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #ccc; page-break-inside: avoid; }
.q-block.good { border-left-color: #00c48a; }
.q-block.avg { border-left-color: #f59e0b; }
.q-block.bad { border-left-color: #ff5252; }
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
.q-num { font-size: 10px; color: #666; font-weight: 700; letter-spacing: 1px; }
.q-score { font-size: 14px; font-weight: 900; }
.q-question { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.q-answer { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid #999; font-size: 11px; margin-bottom: 10px; color: #333; }
.q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
.q-str { background: #e6faf1; padding: 8px; border-radius: 6px; border-left: 3px solid #00c48a; font-size: 11px; margin-bottom: 6px; color: #1a5f3f; }
.q-wk { background: #fff0f0; padding: 8px; border-radius: 6px; border-left: 3px solid #ff5252; font-size: 11px; margin-bottom: 6px; color: #8b1a1a; }
.q-ideal { background: #e7f5ff; padding: 8px; border-radius: 6px; border-left: 3px solid #00b8d4; font-size: 11px; color: #0a4d68; }
.footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
<div class="brand">⚡ THREATREADY</div>
<div class="subtitle">Cybersecurity Assessment Platform · Candidate Report</div>
<h1>${escape(cand.name)}</h1>
<div class="meta">${escape(cand.email)} · ${escape(cand.assessment_name || roleName + ' Assessment')}</div>
</div>
<div class="score-card">
<div class="score-label">OVERALL SCORE</div>
<div class="score-value">${score.toFixed(1)}<span class="score-max">/10</span></div>
<div class="badge">${escape((cand.badge || '').toUpperCase())}</div>
<div class="verdict">${escape(verdict)}</div>
</div>
<div class="stats">
<div class="stat"><div class="stat-label">ROLE</div><div class="stat-val">${escape(roleName)}</div></div>
<div class="stat"><div class="stat-label">DIFFICULTY</div><div class="stat-val" style="text-transform:capitalize">${escape(cand.difficulty)}</div></div>
<div class="stat"><div class="stat-label">QUESTIONS</div><div class="stat-val">${evals.length} answered</div></div>
<div class="stat"><div class="stat-label">COMPLETED</div><div class="stat-val">${escape(cand.completed_at?.substring(0, 10) || '—')}</div></div>
</div>
<div class="summary">
<div class="sum-box sum-strong"><div class="sum-label" style="color:#00a878">✓ STRONG ANSWERS</div><div class="sum-count" style="color:#00a878">${strongCount}</div><div class="sum-desc">Questions scored 7+ / 10</div></div>
<div class="sum-box sum-weak"><div class="sum-label" style="color:#d32f2f">✗ WEAK AREAS</div><div class="sum-count" style="color:#d32f2f">${weakCount}</div><div class="sum-desc">Questions scored below 5 / 10</div></div>
</div>
<div class="section-title">📝 Detailed Question Breakdown</div>
${evals.map((ev, i) => {
  const cls = ev.score >= 7 ? 'good' : ev.score >= 5 ? 'avg' : 'bad';
  const col = ev.score >= 7 ? '#00a878' : ev.score >= 5 ? '#d97706' : '#d32f2f';
  return `<div class="q-block ${cls}">
    <div class="q-header"><span class="q-num">QUESTION ${i + 1} · ${escape(ev.category || 'General')}</span><span class="q-score" style="color:${col}">${ev.score}/10</span></div>
    <div class="q-question">❓ ${escape(ev.question)}</div>
    <div class="q-tag">CANDIDATE'S ANSWER</div>
    <div class="q-answer">${escape(ev.answer || '(No answer provided)')}</div>
    ${ev.strengths ? `<div class="q-str"><strong>✓ Strengths:</strong> ${escape(ev.strengths)}</div>` : ''}
    ${ev.weaknesses ? `<div class="q-wk"><strong>✗ Weaknesses:</strong> ${escape(ev.weaknesses)}</div>` : ''}
    ${ev.improved_answer && ev.improved_answer !== '-' ? `<div class="q-ideal"><strong>💡 Ideal Answer:</strong> ${escape(ev.improved_answer)}</div>` : ''}
  </div>`;
}).join('')}
<div class="footer">Generated by ThreatReady · ${new Date().toLocaleString()}</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body></html>`;
                            const w = window.open('', '_blank');
                            if (!w) { showToast('Please allow popups for bulk download', 'error'); return; }
                            w.document.write(html);
                            w.document.close();
                            await new Promise(r => setTimeout(r, 800));
                          } catch (e) { console.error('PDF error:', e); }
                        }
                        showToast(`${selectedCompleted.length} PDF(s) opened!`, 'success');
                      }}>📥 Download PDFs ({selectedCandidates.length})</button>
                    <button className="btn bdn" style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => {
                        showConfirm(`Delete ${selectedCandidates.length} selected candidate(s)?`, async () => {
                          const token = localStorage.getItem('token');
                          await Promise.all(selectedCandidates.map(id =>
                            fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${id}`, {
                              method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                            })
                          ));
                          setSelectedCandidates([]);
                          loadB2bData();
                          showToast(`${selectedCandidates.length} candidates deleted.`, 'success');
                        });
                      }}>🗑 Delete Selected ({selectedCandidates.length})</button>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
                <input className="input" type="text" placeholder="🔍 Search name, email, or date..."
                  value={candidatesSearch} onChange={e => setCandidatesSearch(e.target.value)}
                  style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
                {candidatesSearch && (
                  <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setCandidatesSearch('')}>✕</button>
                )}
              </div>
              <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => {
                  const filtered = filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at);
                  const csv = ['Name,Email,Role,Difficulty,Score,Status,Invited']
                    .concat(filtered.map(c => `${c.candidate_name || ''},${c.candidate_email || ''},${c.role_id || ''},${c.difficulty || ''},${c.overall_score || ''},${c.status || ''},${c.invited_at?.substring(0, 10) || ''}`))
                    .join('\n');
                  const a = document.createElement('a');
                  a.href = 'data:text/csv,' + encodeURIComponent(csv);
                  a.download = 'candidates.csv'; a.click();
                }}>📥 Export CSV</button>
            </div>
            {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
            <div className="card fadeUp" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "30px 2fr 2fr 1fr 1fr 1fr 1fr 0.5fr", padding: "10px 14px", background: "var(--s2)", fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, textTransform: "uppercase" }}>
                <span>
                  <input type="checkbox" style={{ cursor: "pointer" }}
                    checked={selectedCandidates.length === filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length && candidates.length > 0}
                    onChange={e => {
                      const filtered = filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at);
                      setSelectedCandidates(e.target.checked ? filtered.map(c => c.id) : []);
                    }} />
                </span>
                <span>Name</span><span>Email</span><span>Role</span><span>Score</span><span>Status</span><span>Report</span><span></span>
              </div>
              {candidates.length === 0 && !b2bLoading && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates yet. Use the invite form above.</div>
              )}
              {candidates.length > 0 && filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates match "{candidatesSearch}"</div>
              )}
              {filterBySearch(candidates, candidatesSearch, c => c.candidate_name, c => c.candidate_email, c => c.invited_at).map((c, i) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "30px 2fr 2fr 1fr 1fr 1fr 1fr 0.5fr", padding: "10px 14px", borderTop: "1px solid var(--bd)", fontSize: 13, alignItems: "center", background: selectedCandidates.includes(c.id) ? "rgba(0,229,255,0.05)" : undefined }}>
                  <span>
                    <input type="checkbox" style={{ cursor: "pointer" }}
                      checked={selectedCandidates.includes(c.id)}
                      onChange={e => setSelectedCandidates(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                  </span>
                  <span style={{ fontWeight: 600 }}>{c.candidate_name || c.candidate_email?.split("@")[0] || '—'}</span>
                  <span style={{ color: "var(--tx2)", fontSize: 12 }}>{c.candidate_email}</span>
                  <span>{c.role_id ? (ROLES.find(r => r.id === c.role_id)?.icon || c.role_id) : "—"}</span>
                  <span className="mono" style={{ fontWeight: 700, color: c.overall_score ? (c.overall_score >= 7 ? "var(--ok)" : c.overall_score >= 5 ? "var(--wn)" : "var(--dn)") : "var(--tx2)" }}>
                    {c.overall_score ? `${c.overall_score}/10` : "—"}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.status === "completed" ? "var(--ok)" : c.status === "in_progress" ? "var(--wn)" : "var(--tx2)" }}>
                    {c.status === "completed" ? "✓ Done" : c.status === "in_progress" ? "● Active" : "○ Pending"}
                  </span>
                  <span style={{ display: "flex", gap: 6 }}>
                    {c.status === "completed" ? (
                      <>
                        <button style={{ background: "rgba(0,229,255,.1)", border: "1px solid var(--ac)", cursor: "pointer", fontSize: 12, color: "var(--ac)", padding: "3px 8px", borderRadius: 4 }}
                          title="View Report"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const data = await res.json();
                              if (data.candidate) setReportModal(data.candidate);
                              else showToast('Report not available', 'error');
                            } catch (e) { showToast('Error loading report', 'error'); }
                          }}>👁 View</button>
                        <button style={{ background: "rgba(0,224,150,.1)", border: "1px solid var(--ok)", cursor: "pointer", fontSize: 12, color: "var(--ok)", padding: "3px 8px", borderRadius: 4 }}
                          title="Download PDF"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}/report`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const data = await res.json();
                              if (!data.candidate) { showToast('Report not available', 'error'); return; }
                              const cand = data.candidate;
                              const score = parseFloat(cand.overall_score) || 0;
                              const scoreColor = score >= 7 ? '#00e096' : score >= 5 ? '#f59e0b' : '#ff5252';
                              const badgeColor = score >= 8 ? '#e2e8f0' : score >= 7 ? '#f59e0b' : score >= 6 ? '#94a3b8' : score >= 4 ? '#cd7f32' : '#ff5252';
                              const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
                                             score >= 7 ? "Strong candidate — recommended for next round" :
                                             score >= 6 ? "Good candidate — consider for interview" :
                                             score >= 5 ? "Average — more assessment needed" :
                                             score >= 4 ? "Below expectations — not recommended" :
                                             "Not ready — significant skill gaps";
                              const evals = cand.evaluations || [];
                              const strongCount = evals.filter(e => e.score >= 7).length;
                              const weakCount = evals.filter(e => e.score < 5).length;
                              const roleName = ROLES.find(r => r.id === cand.role_id)?.name || cand.role_id;
                              const escape = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

                              const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Assessment Report - ${escape(cand.name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
  .header { border-bottom: 3px solid #00b8d4; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { color: #00b8d4; font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 11px; margin-bottom: 12px; }
  h1 { font-size: 20px; margin: 0 0 6px 0; color: #1a1a1a; }
  .meta { color: #666; font-size: 12px; }
  .score-card { background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%); color: #fff; padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0; }
  .score-label { font-size: 11px; color: #8890b0; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px; }
  .score-value { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; margin-bottom: 8px; }
  .score-max { font-size: 22px; color: #8890b0; }
  .badge { display: inline-block; border: 2px solid ${badgeColor}; color: ${badgeColor}; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 2px; margin: 12px 0; }
  .verdict { font-size: 13px; color: ${scoreColor}; font-weight: 600; margin-top: 8px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
  .stat { background: #f5f7fa; padding: 12px; border-radius: 8px; text-align: center; }
  .stat-label { font-size: 9px; color: #666; letter-spacing: 1px; margin-bottom: 4px; font-weight: 700; }
  .stat-val { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
  .sum-box { padding: 14px; border-radius: 10px; border: 1px solid; }
  .sum-strong { background: #e6faf1; border-color: #00c48a; }
  .sum-weak { background: #fff0f0; border-color: #ff5252; }
  .sum-count { font-size: 26px; font-weight: 900; }
  .sum-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
  .sum-desc { font-size: 10px; color: #666; margin-top: 2px; }
  .section-title { font-size: 13px; color: #00b8d4; font-weight: 700; letter-spacing: 2px; margin: 28px 0 14px; text-transform: uppercase; border-bottom: 2px solid #00b8d4; padding-bottom: 6px; }
  .q-block { margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #ccc; page-break-inside: avoid; }
  .q-block.good { border-left-color: #00c48a; }
  .q-block.avg { border-left-color: #f59e0b; }
  .q-block.bad { border-left-color: #ff5252; }
  .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .q-num { font-size: 10px; color: #666; font-weight: 700; letter-spacing: 1px; }
  .q-score { font-size: 14px; font-weight: 900; }
  .q-question { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
  .q-answer { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid #999; font-size: 11px; margin-bottom: 10px; color: #333; }
  .q-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
  .q-str { background: #e6faf1; padding: 8px; border-radius: 6px; border-left: 3px solid #00c48a; font-size: 11px; margin-bottom: 6px; color: #1a5f3f; }
  .q-wk { background: #fff0f0; padding: 8px; border-radius: 6px; border-left: 3px solid #ff5252; font-size: 11px; margin-bottom: 6px; color: #8b1a1a; }
  .q-ideal { background: #e7f5ff; padding: 8px; border-radius: 6px; border-left: 3px solid #00b8d4; font-size: 11px; color: #0a4d68; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
</style></head>
<body>
  <div class="header">
    <div class="brand">⚡ THREATREADY</div>
    <div class="subtitle">Cybersecurity Assessment Platform · Candidate Report</div>
    <h1>${escape(cand.name)}</h1>
    <div class="meta">${escape(cand.email)} · ${escape(cand.assessment_name || roleName + ' Assessment')}</div>
  </div>

  <div class="score-card">
    <div class="score-label">OVERALL SCORE</div>
    <div class="score-value">${score.toFixed(1)}<span class="score-max">/10</span></div>
    <div class="badge">${escape((cand.badge || '').toUpperCase())}</div>
    <div class="verdict">${escape(verdict)}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-label">ROLE</div><div class="stat-val">${escape(roleName)}</div></div>
    <div class="stat"><div class="stat-label">DIFFICULTY</div><div class="stat-val" style="text-transform:capitalize">${escape(cand.difficulty)}</div></div>
    <div class="stat"><div class="stat-label">QUESTIONS</div><div class="stat-val">${evals.length} answered</div></div>
    <div class="stat"><div class="stat-label">COMPLETED</div><div class="stat-val">${escape(cand.completed_at?.substring(0, 10) || '—')}</div></div>
  </div>

  <div class="summary">
    <div class="sum-box sum-strong">
      <div class="sum-label" style="color:#00a878">✓ STRONG ANSWERS</div>
      <div class="sum-count" style="color:#00a878">${strongCount}</div>
      <div class="sum-desc">Questions scored 7+ / 10</div>
    </div>
    <div class="sum-box sum-weak">
      <div class="sum-label" style="color:#d32f2f">✗ WEAK AREAS</div>
      <div class="sum-count" style="color:#d32f2f">${weakCount}</div>
      <div class="sum-desc">Questions scored below 5 / 10</div>
    </div>
  </div>

  <div class="section-title">📝 Detailed Question Breakdown</div>
  ${evals.map((ev, i) => {
    const cls = ev.score >= 7 ? 'good' : ev.score >= 5 ? 'avg' : 'bad';
    const col = ev.score >= 7 ? '#00a878' : ev.score >= 5 ? '#d97706' : '#d32f2f';
    return `<div class="q-block ${cls}">
      <div class="q-header">
        <span class="q-num">QUESTION ${i + 1} · ${escape(ev.category || 'General')}</span>
        <span class="q-score" style="color:${col}">${ev.score}/10</span>
      </div>
      <div class="q-question">❓ ${escape(ev.question)}</div>
      <div class="q-tag">CANDIDATE'S ANSWER</div>
      <div class="q-answer">${escape(ev.answer || '(No answer provided)')}</div>
      ${ev.strengths ? `<div class="q-str"><strong>✓ Strengths:</strong> ${escape(ev.strengths)}</div>` : ''}
      ${ev.weaknesses ? `<div class="q-wk"><strong>✗ Weaknesses:</strong> ${escape(ev.weaknesses)}</div>` : ''}
      ${ev.improved_answer && ev.improved_answer !== '-' ? `<div class="q-ideal"><strong>💡 Ideal Answer:</strong> ${escape(ev.improved_answer)}</div>` : ''}
    </div>`;
  }).join('')}

  <div class="footer">Generated by ThreatReady · ${new Date().toLocaleString()}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body></html>`;

                              const w = window.open('', '_blank');
                              if (!w) { showToast('Please allow popups for PDF download', 'error'); return; }
                              w.document.write(html);
                              w.document.close();
                              showToast("Opening PDF... use your browser's Save as PDF option", 'success');
                            } catch (e) { showToast('Error downloading: ' + e.message, 'error'); }
                          }}>📥</button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--tx2)" }}>—</span>
                    )}
                  </span>
                  <span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--dn)", padding: "2px 6px" }}
                      title="Delete"
                      onClick={() => {
                        showConfirm(`Delete ${c.candidate_name || c.candidate_email}? This cannot be undone.`, async () => {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`https://threatready-db.onrender.com/api/b2b/candidates/${c.id}`, {
                            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (data.success) { loadB2bData(); showToast('Deleted.', 'success'); }
                          else showToast('Delete failed', 'error');
                        });
                      }}>🗑</button>
                  </span>
                </div>
              ))}
            </div>
          </>)}

          {/* ── TEAM SKILLS TAB ── */}
          {b2bTab === "teamskills" && (<>
            {candidates.filter(c => c.status === "completed" && c.overall_score).length === 0 ? (
              <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Scores Yet</h3>
                <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                  Invite candidates and have them complete assessments to see scores here.
                </p>
                <button className="btn bp" style={{ padding: "10px 28px" }} onClick={() => { setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates'); }}>
                  Invite Candidates →
                </button>
              </div>
            ) : (<>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
                <div className="lbl">CANDIDATE SKILL SCORES ({filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).length})</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
                  <input className="input" type="text" placeholder="🔍 Search name, email, or date..."
                    value={teamSkillsSearch} onChange={e => setTeamSkillsSearch(e.target.value)}
                    style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
                  {teamSkillsSearch && (
                    <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setTeamSkillsSearch('')}>✕</button>
                  )}
                </div>
                <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={loadB2bData}>🔄 Refresh</button>
              </div>
              {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
              <div className="card fadeUp" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "10px 14px", background: "var(--s2)", fontSize: 11, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, textTransform: "uppercase" }}>
                  <span>Candidate</span><span style={{ textAlign: "center" }}>Role</span><span style={{ textAlign: "center" }}>Difficulty</span><span style={{ textAlign: "center" }}>Score</span><span style={{ textAlign: "center" }}>Badge</span>
                </div>
                {filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).length === 0 && teamSkillsSearch && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>No candidates match "{teamSkillsSearch}"</div>
                )}
                {filterBySearch(teamMembers, teamSkillsSearch, m => m.name, m => m.email, m => m.completed_at).map((m, i) => {
                  const score = m.score;
                  const badge = score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready";
                  const badgeColor = score >= 8 ? "#e2e8f0" : score >= 7 ? "#f59e0b" : score >= 6 ? "#94a3b8" : score >= 4 ? "#b45309" : "var(--dn)";
                  const role = ROLES.find(r => r.id === m.role);
                  return (
                    <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "12px 14px", borderTop: "1px solid var(--bd)", fontSize: 13, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>{m.completed_at?.substring(0, 10)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 16 }}>{role?.icon || "🔒"}</span>
                        <div style={{ fontSize: 11, color: "var(--tx2)" }}>{role?.name || m.role}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span className={`diff diff-${m.difficulty}`} style={{ fontSize: 8 }}>{m.difficulty}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: score >= 7 ? "var(--ok)" : score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                          {score.toFixed(1)}
                        </span>
                        <div style={{ fontSize: 11, color: "var(--tx2)" }}>/10</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor }}>{badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card fadeUp" style={{ padding: 14, fontSize: 13, lineHeight: 1.8, color: "var(--tx2)" }}>
                <div className="lbl" style={{ marginBottom: 8 }}>INSIGHTS</div>
                {teamMembers.filter(m => m.score >= 7).length > 0 && (
                  <div>✅ <strong style={{ color: "var(--ok)" }}>{teamMembers.filter(m => m.score >= 7).length} candidate(s)</strong> scored 7+ — strong hires</div>
                )}
                {teamMembers.filter(m => m.score >= 5 && m.score < 7).length > 0 && (
                  <div>⚡ <strong style={{ color: "var(--wn)" }}>{teamMembers.filter(m => m.score >= 5 && m.score < 7).length} candidate(s)</strong> scored 5–7 — needs more practice</div>
                )}
                {teamMembers.filter(m => m.score < 5).length > 0 && (
                  <div>❌ <strong style={{ color: "var(--dn)" }}>{teamMembers.filter(m => m.score < 5).length} candidate(s)</strong> scored below 5 — not ready</div>
                )}
              </div>
            </>)}
          </>)}


           
            
          {/* ── B3: BADGES (Reports) ── */}
          {b2bTab === "reports" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>ASSESSMENT REPORTS</div>

            {/* Hiring Report */}
            <div className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>📊 Hiring Report</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Top candidates ranked with scorecards</div>
                </div>
                <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => {
                    const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
                    if (completed.length === 0) { showToast('No completed assessments to report yet.', 'warning'); return; }
                    const rows = completed
                      .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
                      .map((c, i) => {
                        const score = parseFloat(c.overall_score || 0);
                        const badge = score >= 8 ? 'Platinum' : score >= 7 ? 'Gold' : score >= 6 ? 'Silver' : score >= 4 ? 'Bronze' : 'Not Ready';
                        const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id;
                        return `${i + 1},${c.candidate_name || c.candidate_email},${c.candidate_email},${role},${c.difficulty},${score}/10,${badge},${c.completed_at?.substring(0, 10) || ''}`;
                      });
                    const csv = ['Rank,Name,Email,Role,Difficulty,Score,Badge,Completed Date', ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `hiring-report-${new Date().toISOString().substring(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Hiring report downloaded!', 'success');
                  }}>
                  Download CSV
                </button>
              </div>
              {candidates.filter(c => c.status === 'completed').length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>TOP CANDIDATES</div>
                  {candidates
                    .filter(c => c.status === 'completed' && c.overall_score)
                    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
                    .slice(0, 3)
                    .map((c, i) => {
                      const score = parseFloat(c.overall_score || 0);
                      return (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--bd)' : 'none', fontSize: 13 }}>
                          <span><span style={{ color: 'var(--ac)', fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>{c.candidate_name || c.candidate_email}</span>
                          <span className="mono" style={{ fontWeight: 700, color: score >= 7 ? 'var(--ok)' : score >= 5 ? 'var(--wn)' : 'var(--dn)' }}>{score.toFixed(1)}/10</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Team Skills Report */}
            <div className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, animationDelay: "0.05s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>🏢 Team Skills Report</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Skill gap analysis across all candidates</div>
                </div>
                <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => {
                    if (candidates.length === 0) { showToast('No candidates data yet.', 'warning'); return; }
                    const roleGroups = {};
                    candidates.filter(c => c.status === 'completed' && c.overall_score).forEach(c => {
                      const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id || 'Unknown';
                      if (!roleGroups[role]) roleGroups[role] = [];
                      roleGroups[role].push(parseFloat(c.overall_score));
                    });
                    const rows = Object.entries(roleGroups).map(([role, scores]) => {
                      const avg = (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
                      return `${role},${scores.length},${avg}/10,${Math.max(...scores).toFixed(1)}/10,${Math.min(...scores).toFixed(1)}/10`;
                    });
                    const csv = ['Role,Candidates,Avg Score,Best,Lowest', ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `team-skills-${new Date().toISOString().substring(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Team skills report downloaded!', 'success');
                  }}>
                  Download CSV
                </button>
              </div>
            </div>

            {/* Benchmark Report */}
            <div className="card card-glow fadeUp" style={{ padding: 16, animationDelay: "0.1s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>📈 Benchmark Report</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>Your candidates vs. industry average (7.2/10)</div>
                </div>
                <button className="btn bp" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => {
                    const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
                    if (completed.length === 0) { showToast('No completed assessments yet.', 'warning'); return; }
                    const INDUSTRY_AVG = 7.2;
                    const rows = completed.map(c => {
                      const score = parseFloat(c.overall_score || 0);
                      const diff = (score - INDUSTRY_AVG).toFixed(1);
                      const role = ROLES.find(r => r.id === c.role_id)?.name || c.role_id;
                      return `${c.candidate_name || c.candidate_email},${role},${score}/10,${INDUSTRY_AVG}/10,${score >= INDUSTRY_AVG ? '+' + diff : diff} vs avg`;
                    });
                    const csv = ['Candidate,Role,Score,Industry Avg,Benchmark', ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `benchmark-${new Date().toISOString().substring(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Benchmark report downloaded!', 'success');
                  }}>
                  Download CSV
                </button>
              </div>
              {candidates.filter(c => c.status === 'completed' && c.overall_score).length > 0 && (() => {
                const completed = candidates.filter(c => c.status === 'completed' && c.overall_score);
                const avgScore = completed.reduce((s, c) => s + parseFloat(c.overall_score || 0), 0) / completed.length;
                const INDUSTRY_AVG = 7.2;
                const aboveAvg = completed.filter(c => parseFloat(c.overall_score) >= INDUSTRY_AVG).length;
                return (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      {[["Your Avg", avgScore.toFixed(1) + "/10", avgScore >= INDUSTRY_AVG ? "var(--ok)" : "var(--dn)"],
                      ["Industry", "7.2/10", "var(--ac)"],
                      ["Above Avg", aboveAvg + "/" + completed.length, "var(--wn)"]
                      ].map(([l, v, c], i) => (
                        <div key={i} className="statbox" style={{ padding: 10 }}>
                          <div className="statval" style={{ color: c, fontSize: 14 }}>{v}</div>
                          <div className="statlbl">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </>)}

          {/* ── B4: PROFILE ── */}

          {/* ── B5: INTERVIEW (Create Assessment + Invite Candidates) ── */}
          {b2bTab === "create" && (<>
            
            {/* Create Assessment form */}
            <div className="card fadeUp" style={{ padding: 20, marginBottom: 14, borderColor: jdAnalysis ? "var(--ok)" : "var(--bd)" }}>
              <div className="lbl" style={{ marginBottom: 8 }}>CREATE ASSESSMENT</div>

              {/* JD Upload */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8 }}>
                  Paste a job description — AI will auto-suggest the role and difficulty.
                </div>
                <input type="file" id="jd-file-input" accept=".pdf,.txt,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setJdAnalysis(null);
                    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                      const reader = new FileReader();
                      reader.onload = ev => { setNewAssessJD(ev.target.result); showToast('File loaded!', 'success'); };
                      reader.readAsText(file);
                    } else if (file.name.endsWith('.pdf')) {
                      showToast('Reading PDF...', 'info');
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                          const pdfjsLib = window['pdfjs-dist/build/pdf'];
                          if (pdfjsLib) {
                            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                            const pdf = await pdfjsLib.getDocument({ data: ev.target.result }).promise;
                            let text = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                              const page = await pdf.getPage(i);
                              const ct = await page.getTextContent();
                              text += ct.items.map(x => x.str).join(' ') + '\n';
                            }
                            setNewAssessJD(text.trim());
                            showToast('PDF loaded!', 'success');
                          }
                        } catch (err) { showToast('Could not read PDF. Paste text instead.', 'error'); }
                      };
                      reader.readAsArrayBuffer(file);
                    }
                    e.target.value = '';
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <button className="btn bs" style={{ fontSize: 13, padding: "6px 14px" }} onClick={() => document.getElementById('jd-file-input').click()}>📎 Upload JD</button>
                  <span style={{ fontSize: 12, color: "var(--tx2)", fontWeight: 600 }}>PDF · TXT · DOC</span>
                  {newAssessJD && <button className="btn bs" style={{ marginLeft: "auto", fontSize: 12, padding: "4px 8px", color: "var(--dn)", borderColor: "var(--dn)" }} onClick={() => { setNewAssessJD(''); setJdAnalysis(null); }}>✕ Clear</button>}
                </div>
                <textarea className="input" placeholder="Or paste job description text here..." value={newAssessJD}
                  onChange={e => { setNewAssessJD(e.target.value); setJdAnalysis(null); }}
                  style={{ minHeight: 80, marginBottom: 10, fontSize: 12 }} />
                <button className="btn bp" style={{ fontSize: 13, padding: "8px 20px" }}
                  disabled={!newAssessJD.trim() || jdAnalyzing}
                  onClick={async () => {
                    setJdAnalyzing(true); setJdAnalysis(null);
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('https://threatready-db.onrender.com/api/b2b/analyze-jd', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ jd_text: newAssessJD })
                      });
                      const data = await res.json();
                      if (data.analysis) {
                        setJdAnalysis(data.analysis);
                        if (data.analysis.recommended_role) setNewAssessRole(data.analysis.recommended_role);
                        if (data.analysis.recommended_difficulty) setNewAssessDiff(data.analysis.recommended_difficulty);
                        if (data.analysis.suggested_name) setNewAssessName(data.analysis.suggested_name);
                      }
                    } catch (e) { console.log('JD analyze error:', e.message); }
                    setJdAnalyzing(false);
                  }}>
                  {jdAnalyzing ? <><span className="loader" style={{ width: 12, height: 12 }} /> Analyzing...</> : "🤖 Analyze JD →"}
                </button>
                {jdAnalysis && (
                  <div style={{ marginTop: 10, padding: 12, background: "rgba(0,224,150,.07)", borderRadius: 10, border: "1px solid rgba(0,224,150,.2)", fontSize: 13 }}>
                    <div style={{ color: "var(--ok)", fontWeight: 700, marginBottom: 6 }}>✅ AI Analysis Complete</div>
                    {jdAnalysis.summary && <div style={{ color: "var(--tx2)", marginBottom: 4 }}>{jdAnalysis.summary}</div>}
                    {jdAnalysis.key_skills?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {jdAnalysis.key_skills.map((s, i) => <span key={i} className="tag" style={{ fontSize: 11 }}>{s}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Assessment Config */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ASSESSMENT NAME</div>
                  <input className="input" placeholder="e.g. Senior Cloud Engineer Q2" value={newAssessName} onChange={e => setNewAssessName(e.target.value)} style={{ fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ROLE</div>
                  <select className="input" value={newAssessRole} onChange={e => setNewAssessRole(e.target.value)} style={{ fontSize: 12 }}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>DIFFICULTY</div>
                  <select className="input" value={newAssessDiff} onChange={e => setNewAssessDiff(e.target.value)} style={{ fontSize: 12 }}>
                    {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>TYPE</div>
                  <select className="input" value={newAssessType} onChange={e => setNewAssessType(e.target.value)} style={{ fontSize: 12 }}>
                    <option value="standard">Standard</option>
                    <option value="timed">Timed Challenge</option>
                    <option value="take_home">Take Home</option>
                  </select>
                </div>
              </div>

              {/* Custom Question Count */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>NUMBER OF QUESTIONS</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {[5, 10, 15, 20, 25].map(n => (
                    <button key={n} type="button"
                      className={`btn ${newAssessQuestionCount === n ? 'bp' : 'bs'}`}
                      style={{ fontSize: 13, padding: "6px 14px" }}
                      onClick={() => setNewAssessQuestionCount(n)}>
                      {n} Q
                    </button>
                  ))}
                </div>
                <input type="number" className="input" min="1" max="50" value={newAssessQuestionCount}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 1;
                    setNewAssessQuestionCount(Math.max(1, Math.min(50, v)));
                  }}
                  placeholder="Or enter custom number (1-50)"
                  style={{ fontSize: 12 }} />
                <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 4 }}>
                  AI will generate exactly {newAssessQuestionCount} question{newAssessQuestionCount !== 1 ? 's' : ''} for this assessment
                </div>
              </div>

              {assessMsg && (
                <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: assessMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: assessMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>{assessMsg}</div>
              )}
              <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 13 }}
                disabled={!newAssessName.trim()}
                onClick={async () => {
                  setAssessMsg('Creating assessment with ' + newAssessQuestionCount + ' questions...');
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('https://threatready-db.onrender.com/api/b2b/assessments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        name: newAssessName,
                        role_id: newAssessRole,
                        difficulty: newAssessDiff,
                        assessment_type: newAssessType,
                        jd_text: newAssessJD,
                        question_count: newAssessQuestionCount
                      })
                    });
                    const data = await res.json();
                    if (data.assessment) {
                      setAssessMsg('✅ Assessment created with ' + newAssessQuestionCount + ' questions! Redirecting to Library...');
                      setNewAssessName(''); setNewAssessJD(''); setJdAnalysis(null);
                      setNewAssessQuestionCount(5);
                      loadB2bData();
                      setTimeout(() => {
                        setAssessMsg('');
                        setB2bTab("library");
                        localStorage.setItem('cyberprep_b2btab', 'library');
                      }, 1500);
                    } else {
                      setAssessMsg('❌ ' + (data.error || 'Failed to create assessment'));
                    }
                  } catch (e) { setAssessMsg('❌ ' + e.message); }
                }}>
                Create Assessment →
              </button>           
               </div>

          </>)}

          {/* ── B6: LIBRARY (Saved Assessments + Invite Candidate) ── */}
          {b2bTab === "library" && (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
              <div className="lbl">SAVED ASSESSMENTS ({filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).length})</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, maxWidth: 400, minWidth: 250 }}>
                <input className="input" type="text" placeholder="🔍 Search name or date..."
                  value={librarySearch} onChange={e => setLibrarySearch(e.target.value)}
                  style={{ fontSize: 13, padding: "6px 12px", flex: 1 }} />
                {librarySearch && (
                  <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setLibrarySearch('')}>✕</button>
                )}
              </div>
              <button className="btn bp" style={{ fontSize: 13, padding: "6px 14px" }}
                onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>
                + New Assessment
              </button>
            </div>
            {b2bLoading && <div style={{ textAlign: "center", padding: 20 }}><div className="loader" /></div>}
            {assessments.length === 0 && !b2bLoading && (
              <div className="card fadeUp" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No saved assessments yet</div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>Create an assessment and it will appear here.</div>
                <button className="btn bp" style={{ fontSize: 12, padding: "10px 24px" }}
                  onClick={() => { setB2bTab("create"); localStorage.setItem('cyberprep_b2btab', 'create'); }}>
                  Create First Assessment →
                </button>
              </div>
            )}
            {assessments.length > 0 && filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).length === 0 && (
              <div className="card fadeUp" style={{ padding: 20, textAlign: "center", color: "var(--tx2)", fontSize: 12 }}>
                No assessments match "{librarySearch}"
              </div>
            )}
            {filterBySearch(assessments, librarySearch, a => a.name, a => '', a => a.created_at).map((a, i) => (
              <div key={a.id} className="card card-glow fadeUp" style={{ padding: 14, marginBottom: 10, animationDelay: `${i * .04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                      {ROLES.find(r => r.id === a.role_id)?.name || a.role_id} · {a.difficulty} · {a.total_candidates || 0} candidates · {a.created_at?.substring(0, 10)}
                    </div>
                    {a.questions?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 4 }}>✅ {a.questions.length} questions generated</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn bs" style={{ fontSize: 11, padding: "4px 8px" }}
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`https://threatready-db.onrender.com/api/b2b/assessments/${a.id}/duplicate`, {
                          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.assessment) { loadB2bData(); showToast('Assessment duplicated!', 'success'); }
                        else showToast('Duplicate failed', 'error');
                      }}>Duplicate</button>
                    <button className="btn bp" style={{ fontSize: 11, padding: "4px 8px" }}
                      onClick={() => {
                        setInviteRole(a.role_id); setInviteDiff(a.difficulty);
                        setInviteAssessmentId(String(a.id));
                        setB2bTab("candidates"); localStorage.setItem('cyberprep_b2btab', 'candidates');
                        setTimeout(() => document.getElementById('invite-email-input')?.focus(), 300);
                        showToast(`Linked to "${a.name}" (${a.question_count || 5} questions). Enter email to invite.`, 'info');
                      }}>Invite →</button>
                    <button className="btn bs" style={{ fontSize: 11, padding: "4px 8px", color: "var(--dn)", borderColor: "var(--dn)" }}
                      onClick={() => {
                        showConfirm(`Delete "${a.name}"? This cannot be undone.`, async () => {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`https://threatready-db.onrender.com/api/b2b/assessments/${a.id}`, {
                            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (data.success) { loadB2bData(); showToast('Assessment deleted.', 'success'); }
                          else showToast('Delete failed: ' + (data.error || 'Error'), 'error');
                        });
                      }}>🗑 Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </>)}

          {/* ── B7: SETTINGS ── */}
          {b2bTab === "settings" && (<>
          <div className="lbl" style={{ marginBottom: 10 }}>COMPANY PROFILE</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              {companySettingsMsg && (
                <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: companySettingsMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: companySettingsMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
                  {companySettingsMsg}
                </div>
              )}
              <input className="input" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ marginBottom: 10 }} />
              <select className="input" value={teamSize} onChange={e => setTeamSize(e.target.value)} style={{ marginBottom: 14 }}>
                <option value="5-10">Team Starter · 5-10 people</option>
                <option value="11-50">Team Pro · 11-50 people</option>
                <option value="50+">Enterprise · 50+ people</option>
              </select>
              <button className="btn bp" style={{ fontSize: 12, padding: "10px 24px" }}
                onClick={async () => {
                  setCompanySettingsMsg('Saving...');
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ company_name: companyName, team_size: teamSize })
                    });
                    const data = await res.json();
                    if (data.success) { setCompanySettingsMsg('✅ Saved!'); setTimeout(() => setCompanySettingsMsg(''), 3000); }
                    else setCompanySettingsMsg('❌ ' + (data.error || 'Failed'));
                  } catch (e) { setCompanySettingsMsg('❌ ' + e.message); }
                }}>
                Save Profile
              </button>
            </div>

            {/* Integrations */}
            <div className="card fadeUp" style={{ padding: 18, marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>INTEGRATIONS</div>
              {integrationMsg && (
                <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: integrationMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: integrationMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
                  {integrationMsg}
                </div>
              )}
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--bd)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>💬 Slack Notifications</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Get notified when candidates complete assessments</div>
                  </div>
                  <span style={{ fontSize: 12, color: slackWebhook ? "var(--ok)" : "var(--tx2)", fontWeight: 600 }}>{slackWebhook ? "✅ Connected" : "Not connected"}</span>
                </div>
                <input className="input" placeholder="Slack Webhook URL (https://hooks.slack.com/...)" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
                <button className="btn bs" style={{ fontSize: 13, padding: "6px 16px" }}
                  onClick={async () => {
                    setIntegrationMsg('Saving...');
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ slack_webhook: slackWebhook }) });
                      const data = await res.json();
                      if (data.success) { setIntegrationMsg('✅ Slack webhook saved!'); setTimeout(() => setIntegrationMsg(''), 3000); }
                      else setIntegrationMsg('❌ ' + (data.error || 'Failed'));
                    } catch (e) { setIntegrationMsg('❌ ' + e.message); }
                  }}>Save Webhook</button>
              </div>
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--bd)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>⚡ ATS Integration (Zapier)</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Push candidate results to your ATS automatically</div>
                  </div>
                  <span style={{ fontSize: 12, color: zapierWebhook ? "var(--ok)" : "var(--tx2)", fontWeight: 600 }}>{zapierWebhook ? "✅ Connected" : "Not connected"}</span>
                </div>
                <input className="input" placeholder="Zapier Webhook URL (https://hooks.zapier.com/...)" value={zapierWebhook} onChange={e => setZapierWebhook(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
                <button className="btn bs" style={{ fontSize: 13, padding: "6px 16px" }}
                  onClick={async () => {
                    setIntegrationMsg('Saving...');
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ zapier_webhook: zapierWebhook }) });
                      const data = await res.json();
                      if (data.success) { setIntegrationMsg('✅ Zapier webhook saved!'); setTimeout(() => setIntegrationMsg(''), 3000); }
                      else setIntegrationMsg('❌ ' + (data.error || 'Failed'));
                    } catch (e) { setIntegrationMsg('❌ ' + e.message); }
                  }}>Save Webhook</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>🔐 Google Workspace SSO</div>
                  <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Let your team sign in with Google Workspace</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>✅ Available via Google Login</span>
              </div>
            </div>

            {/* Team Permissions */}
            <div className="card fadeUp" style={{ padding: 18 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>TEAM PERMISSIONS</div>
              {[
                ["👑 Admin", "Full access — manage everything", "#f59e0b"],
                ["👔 Hiring Manager", "Create assessments, view results, invite candidates", "var(--ac)"],
                ["📋 Recruiter", "Invite candidates only", "var(--ok)"],
                ["👁️ Viewer", "View results only, no actions", "var(--tx2)"]
              ].map(([role, desc, color], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--bd)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{role}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--tx2)", background: "var(--s2)", padding: "3px 10px", borderRadius: 20 }}>{i === 0 ? "You" : "Invite via email"}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 12, background: "rgba(0,229,255,.05)", borderRadius: 10, border: "1px solid rgba(0,229,255,.15)", fontSize: 13, color: "var(--tx2)" }}>
                💡 Invite team members as candidates with their work email — they'll appear after completing their assessment.
              </div>
            </div>
            
          </>)}

          {/* ── B8: HELP ── */}
          {b2bTab === "help" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>FREQUENTLY ASKED QUESTIONS</div>
            {[
              ["How are candidates assessed?", "Each candidate gets 5 adaptive AI questions for their role and difficulty. Scores are based on technical depth, communication quality, and decision-making."],
              ["Can I customise assessments?", "Yes — upload a job description and AI will tailor the scenario context. You can also set role, difficulty, and assessment type."],
              ["Are scores objective?", "AI evaluation is calibrated against industry benchmarks. Scores above 7/10 typically indicate strong candidates. All scores include a transparent breakdown."],
              ["How do I share results with my team?", "Download CSV reports from the Badges tab, or connect Slack/Zapier in Settings to push results automatically."],
              ["Can candidates retake assessments?", "By default, each invite is single-use. You can send new invites with different roles or difficulties for re-assessment."]
            ].map(([q, a], i) => (
              <div key={i} className="card fadeUp" style={{ padding: 14, marginBottom: 8, animationDelay: `${i * .05}s` }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{q}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
            <div className="card fadeUp" style={{ padding: 16, marginTop: 8 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>CONTACT SUPPORT</div>
              {feedbackSent ? (
                <div style={{ color: "var(--ok)", fontSize: 13, padding: "10px 0" }}>✅ Message sent! We'll respond within 24 hours.</div>
              ) : (
                <>
                  <textarea className="input" placeholder="Describe your issue or question..." style={{ minHeight: 60, marginBottom: 10 }}
                    value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                  <button className="btn bp" style={{ fontSize: 13 }} disabled={!feedbackText.trim()}
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        await fetch('https://threatready-db.onrender.com/api/feedback', {
                          method: 'POST',
                          headers,
                          body: JSON.stringify({ message: feedbackText })
                        });
                        setFeedbackSent(true);
                        setFeedbackText("");
                        setTimeout(() => setFeedbackSent(false), 4000);
                      } catch (e) { showToast('Failed to submit. Please try again.', 'error'); }
                    }}>
                    Submit Message
                  </button>
                </>
              )}
            </div>
          </>)}

          {/* ═══ CLOSE fade overlay wrapper ═══ */}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HR SUBSCRIBE MODAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {showHrSubscribeModal && (
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)", padding: 20
            }} onClick={() => setShowHrSubscribeModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: "#0f1420", border: "1px solid var(--ac)", borderRadius: 14,
                padding: 28, maxWidth: 540, width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(0,229,255,0.2)"
              }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Unlock Full HR Suite</h2>
                  <p style={{ fontSize: 12, color: "var(--tx2)" }}>
                    Create unlimited assessments, invite candidates, access team skill analytics and more.
                  </p>
                </div>

                {/* Company Name */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6, fontWeight: 600 }}>COMPANY NAME</div>
                  <input
                    className="input"
                    placeholder="e.g. Acme Security Inc."
                    value={hrModalCompanyName}
                    onChange={e => setHrModalCompanyName(e.target.value)}
                  />
                </div>

                {/* Team Size */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6, fontWeight: 600 }}>TEAM SIZE</div>
                  <select
                    className="input"
                    value={hrModalTeamSize}
                    onChange={e => setHrModalTeamSize(e.target.value)}>
                    {Object.entries(HR_PRICING).map(([key, v]) => (
                      <option key={key} value={key}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Billing Period Toggle */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6, fontWeight: 600 }}>BILLING CYCLE</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={`btn ${hrBillingPeriod === "monthly" ? "bp" : "bs"}`}
                      style={{ flex: 1, padding: "8px 14px", fontSize: 13 }}
                      onClick={() => setHrBillingPeriod("monthly")}>
                      Monthly
                    </button>
                    <button
                      className={`btn ${hrBillingPeriod === "yearly" ? "bp" : "bs"}`}
                      style={{ flex: 1, padding: "8px 14px", fontSize: 13 }}
                      onClick={() => setHrBillingPeriod("yearly")}>
                      Yearly <span style={{ fontSize: 11, color: "var(--ok)" }}>· SAVE 20%</span>
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                {(() => {
                  const tier = HR_PRICING[hrModalTeamSize];
                  if (!tier) return null;
                  if (tier.contactSales) {
                    return (
                      <div style={{ padding: 16, background: "rgba(255,171,64,.06)", border: "1px solid rgba(255,171,64,.3)", borderRadius: 10, marginBottom: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--wn)", marginBottom: 4 }}>Contact Sales</div>
                        <div style={{ fontSize: 12, color: "var(--tx2)" }}>We'll reach out with a custom quote for enterprise teams</div>
                      </div>
                    );
                  }
                  const price = hrBillingPeriod === "yearly" ? tier.yearly : tier.monthly;
                  const monthlyEquiv = hrBillingPeriod === "yearly" ? Math.round(tier.yearly / 12) : tier.monthly;
                  return (
                    <div style={{ padding: 16, background: "rgba(0,229,255,.05)", border: "1px solid var(--ac)", borderRadius: 10, marginBottom: 16, textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--ac)" }}>
                        ₹{price.toLocaleString('en-IN')}
                        <span style={{ fontSize: 12, color: "var(--tx2)", fontWeight: 600 }}>/{hrBillingPeriod === "yearly" ? "yr" : "mo"}</span>
                      </div>
                      {hrBillingPeriod === "yearly" && (
                        <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 4 }}>
                          That's ₹{monthlyEquiv.toLocaleString('en-IN')}/month effective
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Feature list */}
                <div style={{ marginBottom: 16, padding: "10px 12px", background: "rgba(0,224,150,.04)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700, marginBottom: 6 }}>INCLUDED</div>
                  <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.9 }}>
                    ✓ Unlimited candidate assessments<br/>
                    ✓ Bulk invites (CSV + paste multiple)<br/>
                    ✓ Team skill heatmap &amp; benchmarks<br/>
                    ✓ Full reports &amp; PDF exports<br/>
                    ✓ Integrations (Slack, Zapier)
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn bs" style={{ flex: 1, padding: 12 }} onClick={() => setShowHrSubscribeModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn bp"
                    style={{ flex: 2, padding: 12, fontWeight: 700 }}
                    disabled={!hrModalCompanyName.trim()}
                    onClick={async () => {
                      const tier = HR_PRICING[hrModalTeamSize];
                      if (!tier) return;

                      // Save company info to Settings-backed state for display
                      setCompanyName(hrModalCompanyName.trim());
                      setTeamSize(hrModalTeamSize);

                      // Contact Sales path
                      if (tier.contactSales) {
                        showToast('Thanks! Our team will reach out to ' + (user?.email || 'you') + ' within 24 hours.', 'info');
                        setShowHrSubscribeModal(false);
                        // Optional: call backend to notify sales
                        try {
                          const token = localStorage.getItem('token');
                          await fetch('https://threatready-db.onrender.com/api/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ message: `[HR ENTERPRISE LEAD] Company: ${hrModalCompanyName}, Team size: 50+, Contact: ${user?.email || 'N/A'}` })
                          });
                        } catch(e) {}
                        return;
                      }

                      // Razorpay payment path
                      const price = hrBillingPeriod === "yearly" ? tier.yearly : tier.monthly;
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('https://threatready-db.onrender.com/api/payment/create-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({
                            hr_subscription: true,
                            company_name: hrModalCompanyName.trim(),
                            team_size: hrModalTeamSize,
                            billing_period: hrBillingPeriod,
                            amount_override: price
                          })
                        });
                        const order = await res.json();
                        if (!res.ok) { showToast(order.error || 'Payment error', 'error'); return; }

                        const options = {
                          key: order.key_id,
                          amount: order.amount || (price * 100),
                          currency: order.currency || 'INR',
                          name: 'ThreatReady HR',
                          description: `${hrModalCompanyName} · ${tier.label} · ${hrBillingPeriod}`,
                          order_id: order.order_id,
                          handler: async (response) => {
                            const verifyRes = await fetch('https://threatready-db.onrender.com/api/payment/verify', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                hr_subscription: true,
                                company_name: hrModalCompanyName.trim(),
                                team_size: hrModalTeamSize,
                                billing_period: hrBillingPeriod
                              })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                              setIsHrPaid(true);
                              localStorage.setItem('cyberprep_hr_paid', 'true');
                              setShowHrSubscribeModal(false);
                              showToast('🎉 Subscription activated! All HR features unlocked.', 'success');
                            } else {
                              showToast('Payment verification failed. Contact support.', 'error');
                            }
                          },
                          prefill: {
                            name: hrModalCompanyName.trim() || user?.name || '',
                            email: user?.email || '',
                            contact: ''
                          },
                          remember_customer: false,
                          theme: { color: '#00e5ff' }
                        };
                        const rzp = new window.Razorpay(options);
                        rzp.open();
                      } catch (e) {
                        showToast('Payment failed: ' + e.message, 'error');
                      }
                    }}>
                    {HR_PRICING[hrModalTeamSize]?.contactSales ? '📧 Contact Sales' : '🔒 Subscribe & Pay'}
                  </button>
                </div>

                <div style={{ fontSize: 11, color: "var(--tx2)", textAlign: "center", marginTop: 10 }}>
                  Secure payment via Razorpay · Cancel anytime
                </div>
              </div>
            </div>
          )}

        </div></div>
      </div>
    );
  }


  // ═══════════════════════════════════════════════════════════
  // CANDIDATE ASSESSMENT PAGE (/assess?token=xxx)
  // ═══════════════════════════════════════════════════════════
  if (view === "candidate-assess") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 620, padding: "0 16px" }}>

          {candidateAssessState === "loading" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div className="loader" style={{ width: 36, height: 36, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 14, color: "var(--tx2)" }}>Loading your assessment...</div>
            </div>
          )}

          {candidateAssessState === "error" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invalid or Expired Link</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>{candidateAssessError || "This link is invalid or expired. Please contact the hiring team for a new link."}</p>
            </div>
          )}

          {candidateAssessState === "already_done" && (
            <div className="card fadeUp" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Already Completed</h2>
              <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>You have already completed this assessment. Check your email for your detailed results report.</p>
            </div>
          )}

          {candidateAssessState === "intro" && candidateAssessData && (
            <div className="card fadeUp" style={{ padding: 36, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ac)", letterSpacing: 2, marginBottom: 12 }}>⚡ THREATREADY ASSESSMENT</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                {candidateAssessData.candidate.assessment_name || `${ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.name} Assessment`}
              </h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.7 }}>
                Hello <strong style={{ color: "var(--tx1)" }}>{candidateAssessData.candidate.name}</strong>! You have been invited to complete a cybersecurity skills assessment.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
                {[["📋", "5 Questions", "Scenario-based"], ["🤖", "AI Evaluated", "Instant scoring"], ["📧", "Email Report", "Sent after submit"]].map(([icon, t, d], i) => (
                  <div key={i} className="card" style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)" }}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginBottom: 24, padding: "10px 16px", background: "var(--s2)", borderRadius: 10, fontSize: 12, color: "var(--tx2)" }}>
                <span style={{ fontSize: 20 }}>{ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.icon}</span>
                <span style={{ fontWeight: 700 }}>{ROLES.find(r => r.id === candidateAssessData.candidate.role_id)?.name}</span>
                <span>·</span>
                <span className={`diff diff-${candidateAssessData.candidate.difficulty}`}>{candidateAssessData.candidate.difficulty}</span>
              </div>
              <button className="btn bp" style={{ width: "100%", padding: 16, fontSize: 16, fontWeight: 800 }}
                onClick={() => { setCandidateAssessState("question"); setCandidateQIndex(0); setCandidateAnswers({}); }}>
                Start Assessment →
              </button>
            </div>
          )}

          {candidateAssessState === "question" && candidateAssessData && (() => {
            const q = candidateAssessData.questions[candidateQIndex];
            const total = candidateAssessData.questions.length;
            const ans = candidateAnswers[candidateQIndex] || "";

            // Auto-speak question once when index changes (tracked via window global)
            if (q?.question && window.__lastSpokenIdx !== candidateQIndex) {
              window.__lastSpokenIdx = candidateQIndex;
              setTimeout(() => {
                if (window.speechSynthesis && !isMuted) {
                  window.speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(q.question);
                  const voices = window.speechSynthesis.getVoices();
                  const useFemale = candidateQIndex % 2 === 0;
                  // Strict gender match: only names clearly indicating the gender
                  const femaleVoice = voices.find(v => /samantha|victoria|karen|moira|tessa|zira|susan|fiona|ava|allison/i.test(v.name) && !/male/i.test(v.name.replace(/female/i,'')) && v.lang.startsWith('en'))
                    || voices.find(v => /female/i.test(v.name) && v.lang.startsWith('en'));
                  const maleVoice = voices.find(v => /daniel|alex|fred|david|james|tom|oliver|aaron|arthur/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'))
                    || voices.find(v => /\bmale\b/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'));
                  const english = voices.filter(v => v.lang.startsWith('en'));
                  utt.voice = useFemale ? (femaleVoice || english[0]) : (maleVoice || english.find(v => v !== femaleVoice) || english[0]);
                  // Pitch differentiation — this GUARANTEES different gender sound even if same voice
                  utt.rate = useFemale ? 0.95 : 0.9;
                  utt.pitch = useFemale ? 1.4 : 0.6;
                  utt.onstart = () => setIsSpeaking(true);
                  utt.onend = () => setIsSpeaking(false);
                  utt.onerror = () => setIsSpeaking(false);
                  window.speechSynthesis.speak(utt);
                }
              }, 500);
            }

            const replayQuestion = () => {
              if (!window.speechSynthesis) { showToast('Voice not supported in this browser', 'error'); return; }
              window.speechSynthesis.cancel();
              const utt = new SpeechSynthesisUtterance(q.question);
              const voices = window.speechSynthesis.getVoices();
              const useFemale = candidateQIndex % 2 === 0;
              const femaleVoice = voices.find(v => /samantha|victoria|karen|moira|tessa|zira|susan|fiona|ava|allison/i.test(v.name) && !/male/i.test(v.name.replace(/female/i,'')) && v.lang.startsWith('en'))
                || voices.find(v => /female/i.test(v.name) && v.lang.startsWith('en'));
              const maleVoice = voices.find(v => /daniel|alex|fred|david|james|tom|oliver|aaron|arthur/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'))
                || voices.find(v => /\bmale\b/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith('en'));
              const english = voices.filter(v => v.lang.startsWith('en'));
              utt.voice = useFemale ? (femaleVoice || english[0]) : (maleVoice || english.find(v => v !== femaleVoice) || english[0]);
              utt.rate = useFemale ? 0.95 : 0.9;
              utt.pitch = useFemale ? 1.4 : 0.6;
              utt.onstart = () => setIsSpeaking(true);
              utt.onend = () => setIsSpeaking(false);
              utt.onerror = () => setIsSpeaking(false);
              window.speechSynthesis.speak(utt);
            };

            const toggleDictation = () => {
              const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
              if (!SR) { showToast('Voice input not supported. Use Chrome/Edge.', 'error'); return; }
              if (voice.recording) {
                voice.stop();
                if (voice.transcript?.trim()) {
                  setCandidateAnswers(p => ({
                    ...p,
                    [candidateQIndex]: (p[candidateQIndex] ? p[candidateQIndex] + ' ' : '') + voice.transcript.trim()
                  }));
                  voice.reset();
                }
              } else {
                voice.reset();
                voice.start();
              }
            };

            return (
              <div className="card fadeUp" style={{ padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span className="tag">Q{candidateQIndex + 1} of {total} · {q.category || "Security"}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {Array.from({ length: total }).map((_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < candidateQIndex ? "var(--ok)" : i === candidateQIndex ? "var(--ac)" : "var(--s3)", transition: "background .3s" }} />
                    ))}
                  </div>
                </div>

                {/* Avatar on top */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <AIAvatar isSpeaking={isSpeaking} isMuted={isMuted} qIndex={candidateQIndex} />
                </div>

                {/* Question box */}
                <div style={{ padding: "18px 22px", background: "var(--s2)", borderRadius: 10, border: "1px solid var(--bd)", marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7 }}>{q.question}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }} onClick={replayQuestion}>
                      🔊 Replay Question
                    </button>
                    <button className="btn bs" style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); setIsMuted(m => !m); }}>
                      {isMuted ? "🔇 Unmute" : "🔈 Mute"}
                    </button>
                  </div>
                </div>

                {candidateAssessData.candidate.difficulty === "beginner" && q.hint && (
                  <div style={{ padding: "8px 14px", background: "rgba(0,229,255,.05)", borderRadius: 8, border: "1px solid rgba(0,229,255,.15)", fontSize: 13, color: "var(--ac)", marginBottom: 14 }}>
                    💡 Hint: {q.hint}
                  </div>
                )}

                {/* Answer section with voice + text */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 700, letterSpacing: 1 }}>YOUR ANSWER</span>
                    <button className={`btn ${voice.recording ? 'bdn' : 'bs'}`}
                      style={{ fontSize: 13, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
                      onClick={toggleDictation}>
                      {voice.recording
                        ? <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5252", animation: "pulse 1s infinite" }} /> Stop Recording</>
                        : <>🎤 Speak Answer</>}
                    </button>
                  </div>
                  <textarea className="input" placeholder={voice.recording ? "🎤 Listening... speak your answer" : "Type your answer here, or click 🎤 to speak..."}
                    value={ans}
                    onChange={e => setCandidateAnswers(p => ({ ...p, [candidateQIndex]: e.target.value }))}
                    style={{ minHeight: 140, fontSize: 13, borderColor: voice.recording ? "#ff5252" : undefined }} />
                  {voice.recording && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,82,82,.08)", border: "1px solid rgba(255,82,82,.25)", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--dn)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5252", animation: "pulse 1s infinite" }} />
                        Recording — click "Stop Recording" to add to answer
                      </div>
                      {voice.transcript && (
                        <div style={{ fontSize: 12, color: "var(--tx2)", fontStyle: "italic" }}>{voice.transcript}</div>
                      )}
                    </div>
                  )}
                </div>

                <button className="btn bp" style={{ width: "100%", padding: 14, fontSize: 15 }}
                  disabled={!ans.trim() || candidateSubmitting}
                  onClick={async () => {
                    // Stop any voice
                    if (voice.recording) voice.stop();
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);

                    if (candidateQIndex < total - 1) {
                      setCandidateQIndex(p => p + 1);
                    } else {
                      setCandidateSubmitting(true);
                      setCandidateAssessState("submitting");
                      try {
                        const answers = candidateAssessData.questions.map((q, i) => ({
                          question: q.question,
                          answer: candidateAnswers[i] || "",
                          category: q.category || "Security"
                        }));
                        const res = await fetch("https://threatready-db.onrender.com/api/candidate/submit", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token: candidateToken, answers, role_id: candidateAssessData.candidate.role_id, difficulty: candidateAssessData.candidate.difficulty })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setCandidateResult(data);
                          setCandidateAssessState("done");
                        } else {
                          setCandidateAssessState("error");
                          setCandidateAssessError(data.error || "Submission failed. Please try again.");
                        }
                      } catch (e) {
                        setCandidateAssessState("error");
                        setCandidateAssessError("Network error: " + e.message);
                      }
                      setCandidateSubmitting(false);
                    }
                  }}>
                  {candidateQIndex < total - 1 ? `Next Question (${candidateQIndex + 2}/${total}) →` : "Submit Assessment →"}
                </button>
              </div>
            );
          })()}

          {candidateAssessState === "submitting" && (
            <div className="card fadeUp" style={{ padding: 56, textAlign: "center" }}>
              <div className="loader" style={{ width: 44, height: 44, margin: "0 auto 24px" }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Evaluating your answers...</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>
                AI is scoring your responses. This takes about 15–20 seconds.<br />Please keep this page open.
              </div>
            </div>
          )}

          {candidateAssessState === "done" && candidateResult && (
            <div className="card fadeUp" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>ASSESSMENT COMPLETE</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Well done!</h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.7 }}>
                Thank you for completing the assessment. Your results have been recorded.
              </p>
              <div style={{ background: "var(--s2)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>Your Score</div>
                <div className="mono" style={{ fontSize: 64, fontWeight: 900, color: candidateResult.score >= 7 ? "var(--ok)" : candidateResult.score >= 5 ? "var(--wn)" : "var(--dn)" }}>
                  {candidateResult.score}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 14 }}>out of 10</div>
                <div style={{ display: "inline-block", border: `2px solid ${candidateResult.score >= 8 ? "#e2e8f0" : candidateResult.score >= 7 ? "#f59e0b" : candidateResult.score >= 6 ? "#94a3b8" : candidateResult.score >= 4 ? "#cd7f32" : "#ff5252"}`, color: candidateResult.score >= 8 ? "#e2e8f0" : candidateResult.score >= 7 ? "#f59e0b" : candidateResult.score >= 6 ? "#94a3b8" : candidateResult.score >= 4 ? "#cd7f32" : "#ff5252", padding: "6px 24px", borderRadius: 24, fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
                  {(candidateResult.badge || "").toUpperCase()}
                </div>
              </div>
              <div style={{ padding: 16, background: "rgba(0,229,255,.05)", borderRadius: 12, border: "1px solid rgba(0,229,255,.15)", fontSize: 12, color: "var(--tx2)", lineHeight: 1.8 }}>
                📧 A detailed report with your scores, strengths, weaknesses and model answers has been sent to your email address.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  // ═══ LOADING FALLBACK ═══
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <div className="page"><div className="cnt"><div style={{ textAlign: "center", padding: 40 }}><div className="loader" /></div></div></div>
    </div>
  );
}



