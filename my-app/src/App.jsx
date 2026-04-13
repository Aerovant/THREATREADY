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
:root{--bg:#0a0e1a;--s1:#111827;--s2:#1a1f2e;--s3:#252b3b;--ac:#00e5ff;--ok:#00e096;--wn:#ffab40;--dn:#ff5252;--tx1:#e8eaf6;--tx2:#8890b0;--tx3:#5a6380;--bd:#1e2536}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx1);font-family:'Inter','Segoe UI',system-ui,sans-serif;overflow-x:hidden}
.app{min-height:100vh;position:relative;overflow:hidden}
.gridbg{position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
.scanbar{position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac),transparent);animation:scan 4s infinite;z-index:100;opacity:.6}
@keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(60px)}
.page{position:relative;z-index:1;min-height:100vh;padding:20px 0}
.cnt{max-width:800px;margin:0 auto;padding:0 20px}
.hero{text-align:center;padding:40px 0 20px}
.hero h1{font-size:clamp(24px,5vw,42px);font-weight:900;line-height:1.15;background:linear-gradient(135deg,#fff,var(--ac));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:14px}
.hero p{font-size:14px;color:var(--tx2);max-width:560px;margin:0 auto;line-height:1.7}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:20px;position:relative;transition:all .3s}
.card-glow:hover{border-color:var(--ac);box-shadow:0 0 20px rgba(0,229,255,.08)}
.btn{border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:all .2s;font-size:12px;padding:10px 20px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.bp{background:var(--ac);color:#000}.bp:hover{opacity:.85}.bp:disabled{opacity:.4;cursor:not-allowed}
.bs{background:transparent;border:1px solid var(--bd);color:var(--tx1)}.bs:hover{border-color:var(--ac)}
.bdn{background:var(--dn);color:#fff}
.bok{background:var(--ok);color:#000}
.input{width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;color:var(--tx1);font-size:13px;outline:none;transition:border .2s;resize:vertical;font-family:inherit}
.input:focus{border-color:var(--ac)}
.input[data-nopaste]{-webkit-user-select:text;user-select:text}
.lbl{font-size:10px;letter-spacing:2px;color:var(--ac);text-transform:uppercase;font-weight:700}
.tag{display:inline-block;padding:3px 10px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.15);border-radius:20px;font-size:9px;color:var(--ac);font-weight:600}
.mono{font-family:'JetBrains Mono','Fira Code',monospace}
.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:640px){.rgrid{grid-template-columns:repeat(2,1fr)}}
.sgrid{display:grid;gap:12px}
.sub-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:20px;cursor:pointer;transition:all .2s;position:relative;text-align:center}
.sub-card:hover,.sub-card.sel{border-color:var(--ac);background:rgba(0,229,255,.02)}
.statbox{background:var(--s2);border-radius:12px;padding:14px;text-align:center}
.statval{font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace}
.statlbl{font-size:9px;color:var(--tx3);margin-top:3px;text-transform:uppercase;letter-spacing:1px}
.pbar{height:4px;background:var(--s3);border-radius:4px;overflow:hidden}.pfill{height:100%;border-radius:4px;transition:width .6s}
.diff{font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px}
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
.home-btn{position:fixed;top:14px;left:14px;z-index:50;background:var(--s2);border:1px solid var(--bd);color:var(--tx2);padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-weight:600;transition:all .2s}
.home-btn:hover{border-color:var(--ac);color:var(--ac)}
.fadeUp{animation:fadeUp .5s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.heatmap-cell{width:100%;aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace}
.nav-tabs{display:flex;gap:4px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px}
.nav-tab{padding:8px 16px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;background:var(--s2);color:var(--tx2);border:1px solid var(--bd)}
.nav-tab.active{background:rgba(0,229,255,.1);color:var(--ac);border-color:var(--ac)}
.nav-tab:hover{border-color:var(--ac)}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:220px;background:var(--s1);border-right:1px solid var(--bd);padding:20px 0;z-index:40;overflow-y:auto}
.sidebar-item{padding:10px 20px;font-size:12px;color:var(--tx2);cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .15s}
.sidebar-item:hover{background:rgba(0,229,255,.05);color:var(--tx1)}
.sidebar-item.active{color:var(--ac);background:rgba(0,229,255,.08);border-right:2px solid var(--ac)}
.main-with-sidebar{margin-left:220px}
@media(max-width:768px){.sidebar{display:none}.main-with-sidebar{margin-left:0}}
.tooltip{position:relative;cursor:help}.tooltip:hover::after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--s3);color:var(--tx1);padding:6px 10px;border-radius:6px;font-size:10px;white-space:nowrap;z-index:99}
.strength-bar{height:4px;border-radius:4px;transition:all .3s}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:60;display:flex;align-items:center;justify-content:center}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:32px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}
`;
// ── VOICE HOOK ──
function useVoice() {
  const [recording, setRec] = useState(false);
  const [transcript, setTr] = useState("");
  const recRef = useRef(null);
  const start = useCallback(() => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      const r = new SR(); r.continuous = true; r.interimResults = true;
      r.onresult = e => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setTr(t); };
      r.start(); recRef.current = r; setRec(true);
    } catch (e) { console.log("Voice not supported"); }
  }, []);
  const stop = useCallback(() => { recRef.current?.stop(); setRec(false); }, []);
  const reset = useCallback(() => { setTr(""); setRec(false); }, []);
  return { recording, transcript, start, stop, reset };
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
        const res = await fetch('http://localhost:4000/api/resume/extract', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        extractedText = data.text || '';
      }

      if (!extractedText.trim()) {
        alert('Could not read file. Try PDF or TXT format.');
        setUploading(false);
        return;
      }

      // Send to Claude AI to extract keywords
      // const r = await fetch("https://api.anthropic.com/v1/messages", {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: `Extract key skills and experience from this cybersecurity resume.
Return ONLY a clean 6-8 line summary: years of experience, key skills, certifications, tools, achievements.
No bullet points. Just clean lines.

RESUME:
${extractedText.substring(0, 3000)}

Return ONLY the summary.`
          }]
        })
      });

      const d = await r.json();
      const keyPoints = d.content?.[0]?.text || extractedText.substring(0, 500);
      onUpload(keyPoints);

    } catch (err) {
      console.error(err);
      alert('Failed: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <button
        className="btn bs"
        style={{ fontSize: 10, padding: "6px 12px" }}
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        {uploading ? '⏳ Analyzing...' : `📎 ${label || "Upload File"}`}
      </button>
      <span style={{ fontSize: 9, color: "var(--tx3)" }}>PDF · TXT · DOC</span>
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
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => setZ(p => Math.min(2, p + 0.2))}>+</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => setZ(p => Math.max(0.5, p - 0.2))}>-</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => { setZ(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        <span style={{ fontSize: 9, color: "var(--tx3)", marginLeft: 4 }}>{Math.round(z * 100)}%</span>
      </div>
      <div style={{ overflow: "hidden", borderRadius: 10, background: "var(--s2)", border: "1px solid var(--bd)", cursor: "grab" }}
        onMouseDown={e => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={e => { if (!dragging.current) return; setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y })); lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}>
        <svg viewBox={`0 0 ${maxX} ${maxY}`} style={{ width: "100%", height: 200, transform: `scale(${z}) translate(${pan.x / z}px, ${pan.y / z}px)`, transformOrigin: "center" }}>
          <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#ff5252" /></marker></defs>
          {edges?.map((e, i) => {
            const from = nodes.find(n => n.id === e.f), to = nodes.find(n => n.id === e.t);
            if (!from || !to) return null;
            return <g key={i}>
              <line x1={from.x + 40} y1={from.y + 20} x2={to.x + 40} y2={to.y + 20} stroke={e.a ? "#ff525280" : "#ffffff20"} strokeWidth={e.a ? 2 : 1} markerEnd={e.a ? "url(#ah)" : ""} />
              <text x={(from.x + to.x) / 2 + 40} y={(from.y + to.y) / 2 + 16} fill="#8890b0" fontSize="7" textAnchor="middle">{e.l}</text>
            </g>;
          })}
          {nodes.map(n => {
            const t = NT[n.t] || NT.compute;
            return <g key={n.id}>
              <rect x={n.x} y={n.y} width={80} height={40} rx={6} fill={t.bg} stroke={t.bd} strokeWidth={1.5} />
              <text x={n.x + 40} y={n.y + 16} fill="#fff" fontSize="12" textAnchor="middle">{t.ic}</text>
              <text x={n.x + 40} y={n.y + 30} fill="#ccc" fontSize="7" textAnchor="middle">{n.l}</text>
            </g>;
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
      <div style={{ fontSize: 9, color: level.c, marginTop: 3 }}>{level.l}</div>
    </div>
  );
}

// ── TIME FORMAT ──
const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// ── RANDOM PICK ──
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ThreatReady() {
  // ── CORE STATE ──

  const [view, setViewState] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('cyberprep_user');
    const savedUserType = localStorage.getItem('cyberprep_usertype');
    if (token && savedUser) {
      const savedView = localStorage.getItem('cyberprep_view');
      // Don't restore interview/results on refresh
      if (savedView && !['interview', 'results', 'auth', 'landing'].includes(savedView)) {
        return savedView;
      }
      return savedUserType === 'b2b' ? 'b2b-dashboard' : 'dashboard';
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
  const [authStep, setAuthStep] = useState("form"); // form, verify, detect, roleselect
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // ── SUBSCRIPTION ──
  const [subscribedRoles, setSubscribedRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [freeAttempts, setFreeAttempts] = useState(2);

  // ── SCENARIO STATE ──
  const [activeRole, setActiveRole] = useState(null);
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
  const timerRef = useRef(null);
  const voice = useVoice();

  // ── DEMO STATE ──
  const [demoQ] = useState(() => pick(DEMO_QUESTIONS));
  const [demoAnswer, setDemoAnswer] = useState("");
  const [demoScore, setDemoScore] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoInputMode, setDemoInputMode] = useState("text");
  const demoVoice = useVoice();
  // ---------------Mute------------------
  const [isMuted, setIsMuted] = useState(false);

  // ── DYNAMIC HOOKS ──
  const [hookHeadline] = useState(() => pick(HOOK_HEADLINES));
  const [hookSubline] = useState(() => pick(HOOK_SUBLINES));

  // ── PROFILE STATE ──
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState([]);

  // ── AUTH STATE ──
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // ── DASHBOARD TABS ──
  const [dashTab, setDashTab] = useState(() => localStorage.getItem('cyberprep_tab') || "home");
  const [b2bTab, setB2bTab] = useState(() => localStorage.getItem('cyberprep_b2btab') || "overview");
  const [settingsName, setSettingsName] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [inLeaderboard, setInLeaderboard] = useState(true);
  const [allowBenchmarking, setAllowBenchmarking] = useState(false);

  // ── B2B STATE ──
  const [candidates, setCandidates] = useState([
    { id: 1, name: "Alice Chen", email: "alice@techcorp.com", status: "completed", score: 8.2, role: "cloud", difficulty: "advanced", completedAt: "2026-04-06" },
    { id: 2, name: "Bob Singh", email: "bob@startup.io", status: "in_progress", score: null, role: "devsecops", difficulty: "intermediate", completedAt: null },
    { id: 3, name: "Carol Davis", email: "carol@bank.com", status: "completed", score: 6.8, role: "cloud", difficulty: "intermediate", completedAt: "2026-04-05" },
    { id: 4, name: "Dave Park", email: "dave@enterprise.co", status: "not_started", score: null, role: null, difficulty: null, completedAt: null }
  ]);
  const [assessments, setAssessments] = useState([
    { id: 1, name: "Cloud Security Engineer v1", roles: ["cloud"], difficulty: "advanced", candidates: 12, avgScore: 7.1, created: "2026-03-15" },
    { id: 2, name: "DevSecOps Pipeline Security", roles: ["devsecops"], difficulty: "intermediate", candidates: 8, avgScore: 6.5, created: "2026-03-28" }
  ]);
  const [teamMembers] = useState([
    { id: 1, name: "Priya Sharma", role: "Cloud Security", scores: { cloud: 7.5, devsecops: 6.2, appsec: 5.8, netsec: 7.0 } },
    { id: 2, name: "Raj Patel", role: "DevSecOps", scores: { cloud: 6.0, devsecops: 8.1, appsec: 7.2, netsec: 5.5 } },
    { id: 3, name: "Sarah Kim", role: "AppSec", scores: { cloud: 5.5, devsecops: 6.8, appsec: 8.5, netsec: 6.3 } },
    { id: 4, name: "James Liu", role: "SOC Analyst", scores: { cloud: 4.8, devsecops: 5.0, appsec: 6.0, netsec: 7.8 } }
  ]);

  // ── SCORE HISTORY (mock) ──
  const [scoreHistory] = useState([
    { date: "Week 1", cloud: 5.2, devsecops: 4.8, appsec: 5.0 },
    { date: "Week 2", cloud: 5.8, devsecops: 5.5, appsec: 5.3 },
    { date: "Week 3", cloud: 6.5, devsecops: 6.0, appsec: 6.1 },
    { date: "Week 4", cloud: 7.2, devsecops: 6.8, appsec: 6.5 },
    { date: "Week 5", cloud: 7.8, devsecops: 7.2, appsec: 7.0 }
  ]);

  // ── BADGES ──
  const [badges] = useState([
    { role: "cloud", tier: "gold", name: "Advanced Cloud Architect", earned: "2026-04-01" },
    { role: "devsecops", tier: "silver", name: "DevSecOps Practitioner", earned: "2026-03-28" }
  ]);



  /// ── LOAD DASHBOARD DATA FROM BACKEND ──
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check subscription on restore
    fetch('http://localhost:4000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.user?.plan === 'paid' && data.user?.status === 'active') {
        setIsPaid(true);
        setSubscribedRoles(JSON.parse(data.user.subscribed_roles || '[]'));
      }
    }).catch(() => { });

    fetch('http://localhost:4000/api/scores', {

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

    // Load profile data
    fetch('http://localhost:4000/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.resume_text) setResumeText(data.resume_text);
        if (data.user?.target_role) setTargetRole(data.user.target_role);
        if (data.user?.experience_level) setExperienceLevel(data.user.experience_level);
      })
      .catch(err => console.log('Profile load error:', err));
  }, [user]);

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


  // ── OAUTH CALLBACK HANDLER ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");
    const error = params.get("error");
    const provider = params.get("provider") || "google";

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

      try {
        const res = await fetch("http://localhost:4000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || "Signup failed"); return; }

        localStorage.setItem("token", data.token);
        setUser(data.user);
        localStorage.setItem('cyberprep_user', JSON.stringify(data.user));

        const type = detectUserType(authEmail, data.user);

        setUserType(type);
        localStorage.setItem('cyberprep_usertype', type);

        // Go to Ready to Prepare
        setAuthStep("detect");


      } catch (err) {
        setAuthError("Cannot connect to server. Is backend running on port 4000?");
      }

    } else {
      // LOGIN
      if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }

      try {
        const res = await fetch("http://localhost:4000/api/auth/login", {
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
        localStorage.setItem('cyberprep_user', JSON.stringify(data.user));
        setUser(data.user);
        setSettingsName(data.user.name || '');

        // Check subscription status
        fetch('http://localhost:4000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        }).then(r => r.json()).then(meData => {
          if (meData.user?.plan === 'paid' && meData.user?.status === 'active') {
            
            setIsPaid(true);
            setUser(data.user);
            setIsPaid(true); // ← ADD THIS
            setSettingsName(data.user.name || '');

            setSubscribedRoles(JSON.parse(meData.user.subscribed_roles || '[]'));
          } else {
            setIsPaid(false);
            setFreeAttempts(2);
          }
        }).catch(() => { });

        // After login, load subscription data
        const meRes = await fetch("http://localhost:4000/api/auth/me", {
          headers: { "Authorization": `Bearer ${data.token}` }
        });
        const meData = await meRes.json();
        if (meData.user?.subscribed_roles) {
          const roles = typeof meData.user.subscribed_roles === 'string'
            ? JSON.parse(meData.user.subscribed_roles)
            : meData.user.subscribed_roles || [];
          setSubscribedRoles(roles);
          setIsPaid(roles.length > 0);
        }
        setSettingsName(data.user.name || '');

        const type = detectUserType(authEmail, data.user);
        console.log('TYPE DETECTED:', type);
        setUserType(type);
        localStorage.setItem('cyberprep_usertype', type);
        console.log('SETTING VIEW TO:', type === "b2b" ? "b2b-dashboard" : "dashboard");
        if (type === "b2b") { setView("b2b-dashboard"); } else { setView("dashboard"); }

      } catch (err) {
        setAuthError("Cannot connect to server. Is backend running on port 4000?");
      }
    }
  };




  // ── VERIFY EMAIL ──
  const verifyEmail = () => {
    const detected = detectUserType(authEmail);
    setUserType(detected);
    setAuthStep("detect");
  };

  // ── CONFIRM USER TYPE ──

  const confirmUserType = async (type) => {
    setUserType(type);
    if (type === "b2b") {
      setView("b2b-dashboard");
    } else {
      // Send OTP now
      await fetch("http://localhost:4000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      setOtpCode("");
      setOtpError("");
      setAuthStep("verify");
    }
  };

  // ── SCENARIO LOGIC ──

  const startScenario = async (sc, diff) => {

    // ── ROLE ACCESS CHECK ──
    const hasAccess = subscribedRoles.includes(activeRole) || freeAttempts > 0;
    if (!hasAccess) {
      alert('❌ Your 2 free attempts are used up.\n\nSubscribe to unlock unlimited access.');
      setView("dashboard");
      setDashTab("upgrade");
      return;

    }

    if (!isPaid && freeAttempts <= 0) return;

    // Create session in backend FIRST to get session_id
    let newSessionId = null;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('http://localhost:4000/api/session/start', {
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
    setTimeout(() => speakQuestion(first.t), 800);
    if (!isPaid) setFreeAttempts(p => p - 1);
  };

  // ── SPEAK QUESTION ──

  const speakQuestion = (text, forceIndex) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      const femaleVoices = voices.filter(v =>
        v.name.includes('Female') || v.name.includes('Zira') ||
        v.name.includes('Samantha') || v.name.includes('Victoria') ||
        v.name.includes('Karen') || v.name.includes('Google UK English Female')
      );

      const maleVoices = voices.filter(v =>
        v.name.includes('Male') || v.name.includes('Daniel') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('Microsoft David') || v.name.includes('Fred')
      );

      // Alternating: odd index (1,3,5) = female, even index (2,4) = male
      // qIndex 0 = Q1, qIndex 1 = Q2, etc.
      const idx = forceIndex !== undefined ? forceIndex : qIndex;
      const useFemale = idx % 2 === 0; // 0,2,4 = female (Q1,Q3,Q5) | 1,3 = male (Q2,Q4)

      let selectedVoice = null;
      if (useFemale && femaleVoices.length > 0) {
        selectedVoice = femaleVoices[0];
      } else if (!useFemale && maleVoices.length > 0) {
        selectedVoice = maleVoices[0];
      } else {
        selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = useFemale ? 1.1 : 0.85;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    };

    // Wait for voices to load if not ready
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

      const r = await fetch("http://localhost:4000/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: question.t,
          answer: answer,
          difficulty: activeDifficulty,
          session_id: sessionId,
          question_id: question.id,
          scenario_context: {
            title: sc.ti,
            description: sc.de,
            category: question.ca
          }
        })
      });

      const result = await r.json();
      if (result.error) throw new Error(result.error);

      return {
        score: result.score || 5,
        category: result.category || question.ca,
        strengths: result.strengths || "",
        weaknesses: result.weaknesses || "",
        improved_answer: result.improved_answer || "",
        communication_score: result.communication_score || 5,
        depth_score: result.depth_score || 5,
        decision_score: result.decision_score || 5,
        follow_up_question: result.follow_up_topic || "What additional considerations would you factor in?",
        follow_up_category: result.follow_up_category || question.ca
      };

    } catch (e) {
      console.error("Evaluation error:", e);
      return {
        score: 5, category: question.ca,
        strengths: "Evaluation unavailable", weaknesses: e.message || "API connection issue",
        improved_answer: "-", communication_score: 5, depth_score: 5, decision_score: 5,
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
    const newEvals = [...evaluations, { ...ev, question_id: currentQ.id }];
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
      setTimeout(() => speakQuestion(nextQ.t), 300);
    } else {
      // Complete - calculate scores
      const avg = (arr, k) => arr.reduce((s, e) => s + (e[k] || 5), 0) / arr.length;
      const score = Math.round(avg(newEvals, "score") * 10) / 10;
      const earned = Math.round(score * 50);
      const skillsScore = Math.min(500, Math.round(score * 50));
      const attackScore = Math.min(100, Math.round(avg(newEvals, "decision_score") * 10));
      setResults({
        overall_score: score,
        communication: Math.round(avg(newEvals, "communication_score") * 10) / 10,
        depth: Math.round(avg(newEvals, "depth_score") * 10) / 10,
        decision: Math.round(avg(newEvals, "decision_score") * 10) / 10,
        earned, time: elapsed, evaluations: newEvals, questions_asked: askedQs.length,
        skillsScore, attackScore,
        percentile: Math.min(99, Math.round(score * 10)),
        badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready",
        difficulty: activeDifficulty
      });
      setXp(p => p + earned);
      setCompletedScenarios(p => [...new Set([...p, scenario.id])]);
      setStreak(p => p + 1);
      setLoading(false); setView("results");

      // Save completed session to backend
      try {
        const token = localStorage.getItem('token');
        if (token && sessionId) {
          await fetch('http://localhost:4000/api/session/complete', {
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
    if (!ans?.trim()) return;
    setDemoLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 500,
          messages: [{ role: "user", content: `Score this cybersecurity answer 1-10. Be strict.\nQ: ${demoQ.q}\nA: ${ans}\nJSON only: {"score":NUMBER_1_TO_10,"feedback":"1 sentence","level":"Beginner or Intermediate or Advanced or Expert"}` }]
        })
      });
      const d = await r.json();
      const t = d.content?.map(c => c.text || "").join("") || "";
      setDemoScore(JSON.parse(t.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setDemoScore({ score: 5, feedback: "Demo evaluation complete.", level: "Intermediate" });
    }
    setDemoLoading(false);
  };

  // ── PRICING CALC ──
  const toggleRole = id => setSelectedRoles(p => {
    if (p.includes(id)) return p.filter(r => r !== id);
    if (!isPaid && p.length >= 2) return p; // silently ignore
    return [...p, id];
  });


  const getDiscount = () => selectedRoles.length >= 3 ? 30 : selectedRoles.length >= 2 ? 18 : 0;
  const getPrice = () => { const base = selectedRoles.length * 399; return Math.round(base * (1 - getDiscount() / 100)); };
  const subscribe = async () => {
    if (!selectedRoles.length) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roles: selectedRoles })
      });
      const order = await res.json();
      if (!res.ok) { alert(order.error); return; }

      // Open Razorpay payment
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ThreatReady',
        description: `${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''} Subscription`,
        order_id: order.order_id,
        handler: async (response) => {
          // Verify payment
          const verifyRes = await fetch('http://localhost:4000/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              roles: selectedRoles
            })

          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSubscribedRoles(selectedRoles);
            setIsPaid(true);
            setView("dashboard");
            alert('✅ Payment successful! Roles unlocked.');
          } else {
            alert('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: { color: '#00e5ff' }
      };
      // After payment verified successfully
      const onPaymentSuccess = (roles) => {
        setSubscribedRoles(roles);
        setIsPaid(true);
        setFreeAttempts(0);
        setView("dashboard");
        setDashTab("home");
      };
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (e) {
      alert('Payment failed: ' + e.message);
    }
  };

  const goHome = () => {
    window.speechSynthesis.cancel();
    setView(userType === "b2b" ? "b2b-dashboard" : "dashboard");
    setScenario(null);
    setResults(null);
  };

  const exitScenario = () => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    setScenario(null);
    setCurrentQ(null);
    setResults(null);
    setView("dashboard");
  };

  const HomeBtn = ({ label = "← Home" }) => <button className="home-btn" onClick={goHome}>{label}</button>;
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cyberprep_user');
    localStorage.removeItem('cyberprep_usertype');

    localStorage.removeItem('cyberprep_view');
    localStorage.removeItem('cyberprep_tab');
    localStorage.removeItem('cyberprep_b2btab');

    setUser(null);
    setUserType('b2c');
    setSettingsName('');
    setResumeText('');
    setTargetRole('');
    setExperienceLevel('');
    setXp(0);
    setStreak(0);
    setCompletedScenarios([]);
    setIsPaid(false);
    setFreeAttempts(2);
    setView("landing");
  };

  const radarData = results ? [
    { s: "Threat ID", v: results.overall_score * 10 },
    { s: "Architecture", v: results.depth * 10 },
    { s: "Detection", v: results.communication * 10 },
    { s: "Decision", v: results.decision * 10 },
    { s: "Clarity", v: results.communication * 10 }
  ] : [];


  // ═══════════════════════════════════════════════════════════
  // PAGE 1: LANDING PAGE (Dynamic Hooks + Random Demo)
  // ═══════════════════════════════════════════════════════════
  if (view === "landing") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle,rgba(0,229,255,.2),transparent)", top: -100, right: -100 }} />
      <div className="orb" style={{ width: 300, height: 300, background: "radial-gradient(circle,rgba(255,61,113,.12),transparent)", bottom: -50, left: -50 }} />
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
              localStorage.removeItem('token');
              localStorage.removeItem('cyberprep_user');
              localStorage.removeItem('cyberprep_usertype');
              setView("roles");
            }} style={{ fontSize: 15, padding: "14px 32px" }}>Start Free Trial</button>
            <button className="btn bs" onClick={() => { setAuthMode("login"); setView("auth"); }} style={{ fontSize: 15, padding: "14px 32px" }}>Sign In</button>
          </div>
        </div>

        {/* INSTANT DEMO */}
        <div className="card fadeUp" style={{ marginTop: 36, padding: 28, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="lbl" style={{ marginBottom: 8 }}>TRY A REAL ATTACK SCENARIO IN 2 MINUTES</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{hookSubline}</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>No signup required. Type or dictate your answer. Instant AI score.</div>
            <div style={{ fontSize: 10, color: "var(--dn)", marginTop: 6, fontWeight: 600 }}>⚠️ This assessment is evaluated by AI</div>
          </div>
          {!demoScore ? (
            <div>
              <div className="tag" style={{ marginBottom: 10 }}>{demoQ.ca}</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{demoQ.q}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button className={`btn ${demoInputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => setDemoInputMode("text")}>✏️ Type</button>
                <button className={`btn ${demoInputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => setDemoInputMode("voice")}>🎤 Dictate</button>
              </div>
              {demoInputMode === "text" ? (
                <NoPasteInput placeholder="Type your answer here..." value={demoAnswer} onChange={e => setDemoAnswer(e.target.value)} style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }} />
              ) : (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div className={`rec-ring ${demoVoice.recording ? "active" : ""}`}
                    onClick={demoVoice.recording ? demoVoice.stop : demoVoice.start}
                    style={{ margin: "0 auto 8px" }}>{demoVoice.recording ? "⏹" : "🎤"}</div>
                  <div style={{ fontSize: 10, color: demoVoice.recording ? "var(--dn)" : "var(--tx3)" }}>
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
              <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 12 }}>Your full Skills Score (0-500) + benchmarking + role readiness badges require a free account.</div>
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
            <div key={i} className="card fadeUp" style={{ padding: 16, animationDelay: `${i * .05}s` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ac)", marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 10, color: "var(--tx3)", lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* TRUST SIGNALS */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--tx3)", letterSpacing: 2 }}>TRUSTED BY 500+ SECURITY ENGINEERS</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 10, color: "var(--tx3)", flexWrap: "wrap" }}>
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
                <div style={{ fontSize: 10, color: "var(--tx3)", lineHeight: 1.4 }}>{r.desc}</div>
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
  // PAGE 2: AUTH (Signup/Login + Email Verification + B2C/B2B Detection)
  // ═══════════════════════════════════════════════════════════
  if (view === "auth") return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <button className="home-btn" onClick={() => { setView("landing"); setAuthStep("form"); }}>← Back</button>
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card fadeUp" style={{ width: "100%", maxWidth: 420, padding: 36 }}>

          {/* STEP 1: SIGNUP/LOGIN FORM */}
          {authStep === "form" && (<>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔐</div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
              {authMode === "signup" && <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>2 free attempts · No credit card required</p>}
            </div>
            {authError && <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 11, color: "var(--dn)", marginBottom: 14 }}>{authError}</div>}
            {authMode === "signup" && <input className="input" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} style={{ marginBottom: 10 }} />}
            <input className="input" type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input" type="password" placeholder="Password (min 8 characters)" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ marginBottom: 4 }} />
            {authMode === "signup" && <PasswordStrength password={authPassword} />}
            {authMode === "signup" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--tx2)", marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                I agree to the Terms of Service and Privacy Policy
              </label>
            )}
            {authMode === "login" && <div style={{ textAlign: "right", marginBottom: 10 }}><span style={{ fontSize: 11, color: "var(--ac)", cursor: "pointer" }}>Forgot Password?</span></div>}
            <button className="btn bp" style={{ width: "100%", padding: 13, fontSize: 14 }} onClick={handleAuth}>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "http://localhost:4000/auth/google"}>
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg> Google</button>

              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "http://localhost:4000/auth/github?prompt=login"}>
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
              <p style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 20 }}>
                Enter the code below. Expires in 15 minutes.
              </p>

              {otpError && (
                <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 11, color: "var(--dn)", marginBottom: 14 }}>
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
                    const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: authEmail, otp: otpCode })
                    });
                    const data = await res.json();
                    if (!res.ok) { setOtpError(data.error || "Invalid code"); return; }
                    // Go to Sign In
                    localStorage.removeItem("token");
                    setUser(null);
                    setAuthPassword("");
                    setOtpCode("");
                    setAuthError("✅ Email verified! Please sign in.");
                    setAuthMode("login");
                    setAuthStep("form");
                  } catch (err) {
                    setOtpError("Cannot connect to server");
                  }
                }}>
                Verify Email ✓
              </button>

              <button
                className="btn bs"
                style={{ width: "100%", padding: 10, fontSize: 11 }}
                onClick={async () => {
                  setOtpError("");
                  setOtpCode("");
                  await fetch("http://localhost:4000/api/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: authEmail })
                  });
                  alert("New code sent!");
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
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20 }}>
                {userType === "b2b"
                  ? "We detected a company email. Are you here to assess candidates or teams?"
                  : "Are you preparing for security interviews?"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn bp" style={{ padding: 14 }} onClick={() => confirmUserType(userType)}>
                  {userType === "b2b" ? "Yes, I'm Hiring / Assessing →" : "Yes, I'm Preparing →"}
                </button>
                <button className="btn bs" style={{ padding: 12, fontSize: 12 }} onClick={() => confirmUserType(userType === "b2b" ? "b2c" : "b2b")}>
                  {userType === "b2b" ? "Actually, I'm a candidate preparing" : "Actually, I'm hiring / assessing"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ROLE SELECTION (B2C only) */}
          {authStep === "roleselect" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Choose Your First Role</h2>
                <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 4 }}>You have 2 free attempts across all roles</p>
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
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{r.name}</div>
                  </div>
                ))}
              </div>
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
            {!isPaid && <div style={{ fontSize: 11, color: "var(--wn)", marginTop: 8 }}>⚠️ Free trial: {freeAttempts} attempt{freeAttempts !== 1 ? "s" : ""} remaining (Beginner only)</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {DIFFICULTIES.map((d, i) => {
              const locked = !isPaid && d.id !== "beginner";
              return (
                <div key={d.id} className={`card fadeUp ${locked ? "" : "card-glow"}`}
                  style={{ padding: 20, textAlign: "center", animationDelay: `${i * .08}s`, opacity: locked ? 0.5 : 1, cursor: locked ? "not-allowed" : "pointer", borderColor: locked ? "var(--bd)" : d.color + "40" }}
                  onClick={() => {
                    if (locked) return;
                    if (!isPaid && freeAttempts <= 0) return;
                    const scs = SCENARIOS[activeRole];
                    if (scs?.length) startScenario(scs[Math.floor(Math.random() * scs.length)], d.id);
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: "var(--tx3)", marginBottom: 8 }}>{d.questions} adaptive questions · {d.time}</div>
                  <div style={{ fontSize: 9, color: "var(--tx3)" }}>
                    Hints: {d.hints === true ? "Full" : d.hints === "reduced" ? "Reduced" : d.hints === "minimal" ? "Minimal" : "None"}
                  </div>
                  {locked && <div style={{ fontSize: 10, color: "var(--wn)", marginTop: 8 }}>🔒 Subscribe to unlock</div>}
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
      <div className="page"><div className="cnt" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div className="fadeUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{scenario.ti}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span className={`diff diff-${activeDifficulty}`}>{activeDifficulty}</span>
              <span className="tag">Q{qIndex + 1}/5</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 14, color: elapsed > 600 ? "var(--dn)" : "var(--ac)" }}>⏱ {fmt(elapsed)}</span>
            ..
            <button className="btn bs" style={{ padding: "4px 10px", fontSize: 10, color: "var(--dn)", borderColor: "var(--dn)" }} onClick={exitScenario}>Exit</button>
          </div>
        </div>

        {/* Architecture Diagram (Zoomable + Pannable) */}
        <ArchDiagram nodes={scenario.no} edges={scenario.ed} />

        {/* Attack Chain */}
        <div style={{ marginBottom: 12 }}>
          <button className="btn bs" style={{ fontSize: 10, padding: "4px 12px" }} onClick={() => setShowChain(!showChain)}>
            {showChain ? "Hide" : "Show"} Attack Chain (MITRE)
          </button>
          {showChain && (
            <div style={{ marginTop: 8 }}>
              {scenario.ch?.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 8, color: "var(--dn)", minWidth: 70 }}>{c.m}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{c.s}:</span>
                  <span style={{ fontSize: 10, color: "var(--tx2)" }}>{c.d}</span>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Current Question */}
        <div className="card fadeUp" style={{ marginBottom: 14, padding: 18, borderColor: "var(--ac)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="tag">{currentQ.ca}</div>
            <button
              className="btn bs"
              style={{ padding: "3px 10px", fontSize: 10, marginLeft: 8 }}

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
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>{currentQ.t}</div>
          {showHint && currentQ.h && activeDifficulty === "beginner" && (
            <div style={{ marginTop: 8, padding: 8, background: "rgba(0,229,255,.05)", borderRadius: 6, fontSize: 10, color: "var(--ac)" }}>💡 Hint: {currentQ.h}</div>
          )}
          {activeDifficulty === "beginner" && !showHint && currentQ.h && (
            <button className="btn bs" style={{ marginTop: 8, fontSize: 9, padding: "3px 10px" }} onClick={() => setShowHint(true)}>Show Hint</button>
          )}
        </div>

        {/* Answer Input (No Copy-Paste) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button className={`btn ${inputMode === "text" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => setInputMode("text")}>✏️ Type</button>
          <button className={`btn ${inputMode === "voice" ? "bp" : "bs"}`} style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => setInputMode("voice")}>🎤 Dictate</button>
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
            <div style={{ fontSize: 10, color: voice.recording ? "var(--dn)" : "var(--tx3)" }}>
              {voice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
            </div>
            {voice.transcript && <div style={{ marginTop: 10, padding: 10, background: "var(--s2)", borderRadius: 8, fontSize: 12, textAlign: "left", lineHeight: 1.6 }}>{voice.transcript}</div>}
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
          <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 14 }}>out of 10 · {results.questions_asked} adaptive questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[["Technical Depth", `${results.depth}/10`], ["Communication", `${results.communication}/10`], ["Decision-Making", `${results.decision}/10`]].map(([l, v], i) => (
              <div key={i} className="statbox"><div className="statval" style={{ color: "var(--ac)", fontSize: 16 }}>{v}</div><div className="statlbl">{l}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            {[["Skills Score", `${results.skillsScore}/500`], ["Attack Thinking", `${results.attackScore}/100`], ["Percentile", `Top ${100 - results.percentile}%`], ["Duration", fmt(results.time)]].map(([l, v], i) => (
              <div key={i}><div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ac)" }}>{v}</div><div style={{ fontSize: 9, color: "var(--tx3)" }}>{l}</div></div>
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
              <PolarAngleAxis dataKey="s" tick={{ fill: "#8890b0", fontSize: 10 }} />
              <Radar name="Score" dataKey="v" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scoring Transparency */}
        <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>HOW YOUR SCORE WAS CALCULATED</div>
          <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.7 }}>
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
            <div style={{ fontSize: 11, marginBottom: 4 }}><span style={{ color: "var(--ok)" }}>✓</span> <span style={{ color: "var(--tx2)" }}>{ev.strengths}</span></div>
            <div style={{ fontSize: 11, marginBottom: 4 }}><span style={{ color: "var(--dn)" }}>✗</span> <span style={{ color: "var(--tx2)" }}>{ev.weaknesses}</span></div>
            <div style={{ marginTop: 6, padding: 8, background: "var(--s2)", borderRadius: 6, fontSize: 10, color: "var(--tx2)", lineHeight: 1.6 }}>
              <span className="mono" style={{ fontSize: 8, color: "var(--ac)" }}>MODEL ANSWER </span><br />{ev.improved_answer}
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
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>{ev.weaknesses}</div>
                <div style={{ fontSize: 10, color: "var(--ac)", marginTop: 4 }}>→ Try a {activeDifficulty === "beginner" ? "Beginner" : "harder"} scenario focusing on {ev.category}</div>
              </div>
            ))}
          </div>
        )}

        {/* Interview Mode Callout */}
        <div className="card fadeUp" style={{ marginTop: 16, padding: 16, borderColor: "#8b5cf6", background: "rgba(139,92,246,.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 4 }}>💎 Want real interview pressure?</div>
          <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 8 }}>Try Interview Mode: AI acts as your interviewer with follow-up probes, time pressure, and debrief feedback.</div>
          <button className="btn bs" style={{ fontSize: 10, padding: "6px 14px", borderColor: "#8b5cf6", color: "#8b5cf6" }}>Unlock Interview Mode →</button>
        </div>

        {/* B2B Hook */}
        {userType === "b2b" && (
          <div className="card fadeUp" style={{ marginTop: 16, padding: 16, borderColor: "var(--ok)", background: "rgba(0,224,150,.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)", marginBottom: 4 }}>🏢 Hiring for this role?</div>
            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 8 }}>Create a custom assessment using this exact scenario for your candidates.</div>
            <button className="btn bok" style={{ fontSize: 10, padding: "6px 14px" }} onClick={() => setView("b2b-dashboard")}>Create Assessment →</button>
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
        {!isPaid && freeAttempts <= 0 && (
          <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14 }} onClick={() => setView("roles")}>
            🔓 Subscribe to Unlock All Levels →
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
            <div style={{ background: "rgba(0,229,255,.06)", border: "1px solid rgba(0,229,255,.2)", borderRadius: 10, padding: "10px 16px", marginTop: 12, fontSize: 11, color: "var(--ac)" }}>
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
                  opacity: (!isPaid && selectedRoles.length >= 2 && !sel) ? 0.3 : 1,
                  cursor: (!isPaid && selectedRoles.length >= 2 && !sel) ? "not-allowed" : "pointer",
                  pointerEvents: (!isPaid && selectedRoles.length >= 2 && !sel) ? "none" : "auto"
                }}
                onClick={() => toggleRole(r.id)}>

                {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "var(--ac)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: "var(--tx3)", lineHeight: 1.4, marginBottom: 10 }}>{r.desc}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: sel ? r.color : "var(--tx2)" }}>₹{r.price}<span style={{ fontSize: 9, fontWeight: 400 }}>/mo</span></div>
              </div>
            );
          })}
        </div>
        {selectedRoles.length > 0 && (
          <div className="card fadeUp" style={{ marginTop: 20, padding: 20, textAlign: "center", borderColor: "var(--ac)" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--tx3)" }}>{selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""}</span>
              {getDiscount() > 0 && <span className="tag" style={{ background: "rgba(0,224,150,.1)", color: "var(--ok)", borderColor: "rgba(0,224,150,.2)" }}>{getDiscount()}% OFF</span>}
              <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--ac)" }}>₹{getPrice()}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--tx2)" }}>/mo</span></span>

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
        <div className="page"><div className="cnt">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome, {user?.name || "Agent"}</h2>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                {isPaid ? `${subscribedRoles.length} tracks` : `Free trial · ${freeAttempts} attempts left`} · {completedScenarios.length} completed · {streak} day streak
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="tag" style={{ padding: "5px 12px" }}>⚡ {xp} XP</span>
              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 10 }} onClick={logout}>Logout</button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="nav-tabs">
            {tabs.map(t => (
              <div key={t.id} className={`nav-tab ${dashTab === t.id ? "active" : ""}`} onClick={() => { setDashTab(t.id); localStorage.setItem('cyberprep_tab', t.id); }}>{t.label}</div>
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
            <div className="card fadeUp" style={{ marginBottom: 16, padding: 16, borderColor: "var(--wn)", background: "rgba(255,171,64,.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wn)" }}>🎯 Daily Challenge</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 4 }}>Today: SOC Analyst · 2 min quick question</div>
                </div>
                <button className="btn bp" style={{ fontSize: 10, padding: "6px 14px" }}>Start →</button>
              </div>
            </div>

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
                          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>{completed} completed</div>
                        </div>
                      </div>
                      <span style={{ color: "var(--ac)", fontSize: 12, fontWeight: 600 }}>Open →</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 10 }}>
                      {["Beginner", "Intermediate", "Advanced", "Expert"].map((d, i) => (
                        <div key={i} style={{ background: "var(--s2)", borderRadius: 6, padding: "4px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: (!isPaid && d !== "Beginner") ? "var(--tx3)" : "var(--ac)" }}>
                            {(!isPaid && d !== "Beginner") ? "🔒 " : ""}{d}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card fadeUp" style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 10 }}>No roles selected yet</div>
                <button className="btn bp" style={{ fontSize: 11 }} onClick={() => { setIsPaid(true); setView("roles"); }}>
                  + Select Roles
                </button>
              </div>
            )}

            {!isPaid && <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={() => { setIsPaid(true); setView("roles"); }}>+ Add More Tracks</button>}

            {/* Leaderboard Preview */}
            <div className="card fadeUp" style={{ marginTop: 16, padding: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>WEEKLY LEADERBOARD</div>
              {[{ rank: 1, name: "CyberNinja_42", score: 9.2 }, { rank: 2, name: "CloudDefender", score: 8.8 }, { rank: 3, name: user?.name || "You", score: 7.5 }].map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 2 ? "1px solid var(--bd)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "var(--ac)", fontWeight: 700 }}>#{p.rank}</span>
                    <span style={{ fontSize: 12, color: p.name === (user?.name || "You") ? "var(--ac)" : "var(--tx1)" }}>{p.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ac)" }}>{p.score}/10</span>
                </div>
              ))}
            </div>
          </>)}

          {/* ── C2: SCORES & HISTORY ── */}
          {dashTab === "scores" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>SCORE TRENDS</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="date" tick={{ fill: "#8890b0", fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#8890b0", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #252b3b", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="cloud" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} name="Cloud" />
                  <Line type="monotone" dataKey="devsecops" stroke="#ff6b35" strokeWidth={2} dot={{ r: 3 }} name="DevSecOps" />
                  <Line type="monotone" dataKey="appsec" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="AppSec" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="lbl" style={{ marginBottom: 8 }}>WEAKNESS TRACKER</div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              {[{ area: "Incident Response", avg: 5.2, trend: "↓" }, { area: "Detection Engineering", avg: 5.8, trend: "↑" }, { area: "IAM Security", avg: 7.5, trend: "→" }].map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontSize: 12 }}>{w.area}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 12, color: w.avg >= 7 ? "var(--ok)" : w.avg >= 5 ? "var(--wn)" : "var(--dn)" }}>{w.avg}/10</span>
                    <span style={{ fontSize: 14 }}>{w.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* ── C3: BADGES ── */}
          {dashTab === "badges" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>YOUR BADGES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {ROLES.map(r => {
                const badge = badges.find(b => b.role === r.id);
                return (
                  <div key={r.id} className="card fadeUp" style={{ padding: 16, textAlign: "center", opacity: badge ? 1 : 0.4 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{r.name}</div>
                    {badge ? (
                      <>
                        <div className="badge-card" style={{ marginTop: 8, fontSize: 8, padding: "4px 8px", borderColor: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32", color: badge.tier === "gold" ? "#f59e0b" : badge.tier === "silver" ? "#94a3b8" : badge.tier === "platinum" ? "#8b5cf6" : "#cd7f32" }}>
                          {badge.tier.toUpperCase()}
                        </div>
                        <button className="btn bs" style={{ marginTop: 8, fontSize: 8, padding: "3px 8px" }}>📤 Share</button>
                      </>
                    ) : <div style={{ fontSize: 9, color: "var(--tx3)", marginTop: 8 }}>🔒 Not earned</div>}
                  </div>
                );
              })}
            </div>
            <div className="lbl" style={{ marginTop: 20, marginBottom: 8 }}>MILESTONES</div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              {[["🎯 First Scenario", completedScenarios.length >= 1], ["🔥 10 Scenarios", completedScenarios.length >= 10], ["🌟 All 12 Roles", false], ["💎 Expert Badge", false], ["📅 30-Day Streak", streak >= 30]].map(([m, done], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontSize: 12, color: done ? "var(--ok)" : "var(--tx3)" }}>{m}</span>
                  <span style={{ fontSize: 12 }}>{done ? "✅" : "⬜"}</span>
                </div>
              ))}
            </div>
          </>)}

          {/* ── C4: PROFILE ── */}
          {dashTab === "profile" && (<>
            <div className="lbl" style={{ marginBottom: 10 }}>RESUME CONTEXT</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <textarea
                className="input"
                placeholder="Paste your resume here OR upload PDF/DOC/TXT below. AI extracts key points automatically."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ minHeight: 120, marginBottom: 10 }}
              />
              <FileUpload onUpload={text => { setResumeText(text); }} label="Upload Resume (PDF/DOC/TXT)" />
              {resumeText && <div style={{ marginTop: 8, fontSize: 10, color: "var(--ok)" }}>✓ Resume loaded · AI will personalize your scenarios</div>}
              <button className="btn bp" style={{ marginTop: 10, fontSize: 11, padding: "8px 20px" }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('http://localhost:4000/api/resume/upload', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ resume_text: resumeText })
                    });
                    if (res.ok) alert('✅ Resume saved!');
                  } catch (e) { alert('Failed to save resume'); }
                }}>
                💾 Save Resume
              </button>
            </div>
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
              <button className="btn bp" style={{ fontSize: 11, padding: "8px 20px" }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('http://localhost:4000/api/profile/goals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ target_role: targetRole, experience_level: experienceLevel })
                    });
                    if (res.ok) alert('✅ Career goals saved!');
                  } catch (e) { alert('Failed to save goals'); }
                }}>
                💾 Save Goals
              </button>
            </div>
            <div className="lbl" style={{ marginBottom: 10 }}>INTERVIEW READINESS</div>
            <div className="card fadeUp" style={{ padding: 20, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: "var(--ac)" }}>72<span style={{ fontSize: 16, color: "var(--tx3)" }}>/100</span></div>
              <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 4 }}>Overall Interview Readiness</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
                {[["Technical", 78], ["Communication", 65], ["Decision Speed", 74]].map(([l, v], i) => (
                  <div key={i}><div className="mono" style={{ fontSize: 14, color: v >= 70 ? "var(--ok)" : "var(--wn)" }}>{v}</div><div style={{ fontSize: 9, color: "var(--tx3)" }}>{l}</div></div>
                ))}
              </div>
            </div>
          </>)}

          {/* ── C5: INTERVIEW MODE ── */}
          {dashTab === "interview" && (
            <div className="card fadeUp" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💎</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Interview Simulation Mode</h3>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                AI acts as your interviewer. Adaptive follow-ups, time pressure, and detailed debrief. Choose your interviewer persona and difficulty level.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[["🙂 Friendly", "Encouraging but thorough"], ["⚖️ Standard", "Balanced and fair"], ["😤 Tough", "Challenges everything"]].map(([t, d], i) => (
                  <div key={i} className="card card-glow" style={{ padding: 14, cursor: "pointer" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t}</div>
                    <div style={{ fontSize: 9, color: "var(--tx3)" }}>{d}</div>
                  </div>
                ))}
              </div>
              {!isPaid && <button className="btn bp" style={{ padding: "12px 28px" }} onClick={() => setView("roles")}>Unlock Interview Mode · +₹199/mo →</button>}
              {isPaid && <button className="btn bp" style={{ padding: "12px 28px" }}>Start Interview →</button>}
            </div>
          )}

          {/* ── C6: BILLING ── */}
          {dashTab === "billing" && (<>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>CURRENT PLAN</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{isPaid ? `${subscribedRoles.length} Role${subscribedRoles.length > 1 ? "s" : ""} · Paid` : "Free Trial"}</div>
              <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 4 }}>
                {isPaid ? `₹${getPrice()}/month · Renews May 8, 2026` : `${freeAttempts} attempts remaining`}
              </div>
            </div>
            <button className="btn bp" style={{ width: "100%", marginBottom: 10 }} onClick={() => setView("roles")}>
              {isPaid ? "Add More Roles" : "Subscribe Now →"}
            </button>
            {isPaid && <button className="btn bs" style={{ width: "100%", fontSize: 11, color: "var(--wn)" }}>Pause Subscription</button>}
          </>)}

          {/* ── C7: SETTINGS ── */}
          {dashTab === "settings" && (<>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>PROFILE SETTINGS</div>
              <input className="input" placeholder="Full Name"
                value={settingsName || user?.name || ''}
                onChange={e => setSettingsName(e.target.value)}
                style={{ marginBottom: 8 }} />
              <input className="input" placeholder="Email" value={user?.email || ''} disabled style={{ marginBottom: 8, opacity: 0.6 }} />
              <button className="btn bp" style={{ fontSize: 11 }}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const res = await fetch('http://localhost:4000/api/settings/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name: settingsName || user?.name })
                  });
                  if (res.ok) {
                    const updated = { ...user, name: settingsName || user?.name };
                    setUser(updated);
                    localStorage.setItem('cyberprep_user', JSON.stringify(updated));
                    alert('✅ Profile updated!');
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
                    await fetch('http://localhost:4000/api/settings/privacy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        profile_public: l === "Make profile public" ? e.target.checked : profilePublic,
                        in_leaderboard: l === "Include in leaderboard" ? e.target.checked : inLeaderboard,
                        allow_benchmarking: l === "Allow benchmarking data" ? e.target.checked : allowBenchmarking
                      })
                    });

                  }} />
                </label>
              ))}
            </div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>DATA</div>
              <button className="btn bs" onClick={async () => {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:4000/api/settings/export', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'cyberprep-data.json'; a.click();
              }}>📥 Download All Data</button>
              <button className="btn bdn" style={{ fontSize: 11 }} onClick={async () => {
                if (!window.confirm('Are you sure? This will permanently delete your account and all data.')) return;
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:4000/api/settings/delete-account', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                  localStorage.clear();
                  setUser(null);
                  setView('landing');
                  alert('Account deleted.');
                }
              }}>🗑️ Delete Account</button>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn bs" style={{ fontSize: 11 }} onClick={() => { setUserType("b2b"); setView("b2b-dashboard"); }}>🏢 Switch to Hiring Manager Dashboard</button>
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
                <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
            <div className="card fadeUp" style={{ padding: 16, marginTop: 8 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>FEEDBACK</div>
              <NoPasteInput placeholder="Report a problem, suggest a feature, or share feedback..." style={{ minHeight: 60, marginBottom: 10 }} />
              <button className="btn bp" style={{ fontSize: 11 }}>Submit Feedback</button>
            </div>
          </>)}
        </div></div>
      </div>
    );
  }
  // ═══════════════════════════════════════════════════════════
  // PAGE 6: B2B HIRING MANAGER DASHBOARD (B1-B10 via tabs)
  // ═══════════════════════════════════════════════════════════
  if (view === "b2b-dashboard") {
    const b2bTabs = [
      { id: "overview", label: "📊 Overview" },
      { id: "create", label: "📝 Create Assessment" },
      { id: "candidates", label: "👥 Candidates" },
      { id: "team", label: "🏢 Team Skills" },
      { id: "reports", label: "📄 Reports" },
      { id: "library", label: "📚 Library" },
      { id: "settings", label: "⚙️ Settings" }
    ];

    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <div className="page"><div className="cnt">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>🏢 Hiring Dashboard</h2>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>
                {user?.email?.split("@")[1]} · {candidates.length} candidates · {assessments.length} assessments
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 10 }} onClick={() => { setUserType("b2c"); setView("dashboard"); }}>Switch to B2C</button>
              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 10 }} onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('cyberprep_user'); localStorage.removeItem('cyberprep_usertype'); setUser(null); setView("landing"); }}>Logout</button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="nav-tabs">
            {b2bTabs.map(t => (
              <div key={t.id} className={`nav-tab ${b2bTab === t.id ? "active" : ""}`} onClick={() => { setB2bTab(t.id); localStorage.setItem('cyberprep_b2btab', t.id); }}>{t.label}</div>
            ))}
          </div>

          {/* ── B1: OVERVIEW ── */}
          {b2bTab === "overview" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[[candidates.filter(c => c.status === "completed").length, "Assessed"], [candidates.length, "Total Candidates"], [assessments.length, "Assessments"], ["7.1", "Avg Score"]].map(([v, l], i) => (
                <div key={i} className="statbox fadeUp" style={{ animationDelay: `${i * .05}s` }}>
                  <div className="statval" style={{ color: "var(--ac)", fontSize: 20 }}>{v}</div>
                  <div className="statlbl">{l}</div>
                </div>
              ))}
            </div>

            {/* Recent Candidates */}
            <div className="lbl" style={{ marginBottom: 10 }}>RECENT CANDIDATES</div>
            {candidates.map((c, i) => (
              <div key={c.id} className="card card-glow fadeUp" style={{ padding: 14, marginBottom: 8, animationDelay: `${i * .04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "var(--tx3)" }}>{c.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {c.status === "completed" && <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: c.score >= 7 ? "var(--ok)" : c.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{c.score}/10</span>}
                    {c.status === "in_progress" && <span className="tag" style={{ background: "rgba(255,171,64,.1)", color: "var(--wn)", borderColor: "rgba(255,171,64,.2)" }}>In Progress</span>}
                    {c.status === "not_started" && <span className="tag" style={{ background: "rgba(90,99,128,.1)", color: "var(--tx3)" }}>Not Started</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 16 }}>
              <button className="btn bp" onClick={() => setB2bTab("create")}>+ Create Assessment</button>
              <button className="btn bs" onClick={() => setB2bTab("candidates")}>View All Candidates →</button>
            </div>
          </>)}

          {/* ── B2: CREATE ASSESSMENT ── */}
          {b2bTab === "create" && (<>
            <div className="card fadeUp" style={{ padding: 20, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>JD-BASED ASSESSMENT</div>
              <p style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 12 }}>Upload a job description and AI will extract competencies and recommend assessment roles.</p>
              <NoPasteInput placeholder="Paste job description here..." value={jdText} onChange={e => setJdText(e.target.value)} style={{ minHeight: 100, marginBottom: 10 }} />
              <FileUpload onUpload={setJdText} label="Upload JD File" />
              {jdText && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--s2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ok)", marginBottom: 6 }}>✓ AI Analysis Complete</div>
                  <div style={{ fontSize: 10, color: "var(--tx2)" }}>Detected competencies: IAM, Cloud Architecture, Incident Response, Threat Detection</div>
                  <div style={{ fontSize: 10, color: "var(--ac)", marginTop: 4 }}>Recommended: Cloud Security (Advanced) + DevSecOps (Intermediate)</div>
                </div>
              )}
            </div>

            <div className="card fadeUp" style={{ padding: 20, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>ASSESSMENT TYPE</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[["⚡ Quick Screen", "15 min · 1 scenario/role"], ["📋 Standard", "30 min · 2 scenarios/role"], ["🔬 Deep Dive", "45 min · 3 scenarios/role"]].map(([t, d], i) => (
                  <div key={i} className="card card-glow" style={{ padding: 14, cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 9, color: "var(--tx3)", marginTop: 4 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card fadeUp" style={{ padding: 20 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>SELECT ROLES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {ROLES.slice(0, 8).map(r => (
                  <div key={r.id} className="card card-glow" style={{ padding: 10, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 20 }}>{r.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, marginTop: 4 }}>{r.name}</div>
                  </div>
                ))}
              </div>
              <button className="btn bp" style={{ width: "100%", marginTop: 16, padding: 12 }}>Generate Assessment Link →</button>
            </div>
          </>)}

          {/* ── B3: CANDIDATES ── */}
          {b2bTab === "candidates" && (<>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="lbl">ALL CANDIDATES</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn bs" style={{ fontSize: 10, padding: "4px 10px" }}>📧 Invite Candidates</button>
                <button className="btn bs" style={{ fontSize: 10, padding: "4px 10px" }}>📥 Export CSV</button>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="card fadeUp" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "10px 14px", background: "var(--s2)", fontSize: 9, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, textTransform: "uppercase" }}>
                <span>Name</span><span>Email</span><span>Role</span><span>Score</span><span>Status</span>
              </div>
              {candidates.map((c, i) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "10px 14px", borderTop: "1px solid var(--bd)", fontSize: 11, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: "var(--tx3)" }}>{c.email}</span>
                  <span>{c.role ? ROLES.find(r => r.id === c.role)?.icon : "—"}</span>
                  <span className="mono" style={{ fontWeight: 700, color: c.score ? (c.score >= 7 ? "var(--ok)" : c.score >= 5 ? "var(--wn)" : "var(--dn)") : "var(--tx3)" }}>
                    {c.score ? `${c.score}/10` : "—"}
                  </span>
                  <span className={`diff diff-${c.status === "completed" ? "Beginner" : c.status === "in_progress" ? "Intermediate" : "Advanced"}`} style={{ fontSize: 8 }}>
                    {c.status === "completed" ? "Done" : c.status === "in_progress" ? "Active" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            {/* Candidate Detail (expandable) */}
            <div className="card fadeUp" style={{ padding: 16, marginTop: 12 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>CANDIDATE DETAIL: ALICE CHEN</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                {[["Score", "8.2/10"], ["Percentile", "Top 18%"], ["Duration", "14:32"], ["Badge", "Gold"]].map(([l, v], i) => (
                  <div key={i} className="statbox"><div className="statval" style={{ color: "var(--ac)", fontSize: 14 }}>{v}</div><div className="statlbl">{l}</div></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn bp" style={{ fontSize: 10 }}>📄 Download PDF Report</button>
                <button className="btn bs" style={{ fontSize: 10 }}>⭐ Shortlist</button>
                <button className="btn bs" style={{ fontSize: 10 }}>📤 Share with Panel</button>
              </div>
            </div>
          </>)}

          {/* ── B5: TEAM SKILLS ── */}
          {b2bTab === "team" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>TEAM SKILL HEATMAP</div>
            <div className="card fadeUp" style={{ padding: 16, overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4,1fr)", gap: 4, fontSize: 10 }}>
                <div></div>
                {["Cloud", "DevSecOps", "AppSec", "NetSec"].map(h => <div key={h} style={{ textAlign: "center", fontWeight: 700, color: "var(--ac)", padding: 4 }}>{h}</div>)}
                {teamMembers.map(m => (
                  <React.Fragment key={m.id}>
                    <div style={{ fontWeight: 600, padding: "8px 4px", display: "flex", alignItems: "center" }}>{m.name}</div>
                    {["cloud", "devsecops", "appsec", "netsec"].map(role => {
                      const s = m.scores[role] || 0;
                      const bg = s >= 7 ? "rgba(0,224,150,.2)" : s >= 5 ? "rgba(255,171,64,.2)" : "rgba(255,82,82,.2)";
                      const color = s >= 7 ? "var(--ok)" : s >= 5 ? "var(--wn)" : "var(--dn)";
                      return <div key={role} className="heatmap-cell" style={{ background: bg, color }}>{s.toFixed(1)}</div>;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="card fadeUp" style={{ padding: 16, marginTop: 12 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>TEAM INSIGHTS</div>
              <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.7 }}>
                Team average: <span className="mono" style={{ color: "var(--ac)" }}>6.5/10</span> (Industry avg: 7.2)<br />
                Strongest: <span style={{ color: "var(--ok)" }}>AppSec (7.2)</span><br />
                Weakest: <span style={{ color: "var(--dn)" }}>Cloud Security (5.5)</span> — 3/4 members below industry average<br />
                Recommendation: Assign Cloud Security scenarios to James and Sarah
              </div>
            </div>
          </>)}

          {/* ── B6: REPORTS ── */}
          {b2bTab === "reports" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>AVAILABLE REPORTS</div>
            {[
              ["📊 Hiring Report", "Top candidates ranked with scorecards", "Download PDF"],
              ["🏢 Team Skills Report", "Skill gaps analysis with training priorities", "Download PDF"],
              ["📈 Benchmark Report", "Team percentile vs. industry average", "Download PDF"]
            ].map(([t, d, a], i) => (
              <div key={i} className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, animationDelay: `${i * .05}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>{d}</div>
                  </div>
                  <button className="btn bp" style={{ fontSize: 10, padding: "6px 14px" }}>{a}</button>
                </div>
              </div>
            ))}
          </>)}

          {/* ── B7: LIBRARY ── */}
          {b2bTab === "library" && (<>
            <div className="lbl" style={{ marginBottom: 12 }}>SAVED ASSESSMENTS</div>
            {assessments.map((a, i) => (
              <div key={a.id} className="card card-glow fadeUp" style={{ padding: 16, marginBottom: 10, animationDelay: `${i * .05}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>
                      {a.candidates} candidates · Avg: {a.avgScore}/10 · Created: {a.created}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn bs" style={{ fontSize: 9, padding: "4px 8px" }}>Duplicate</button>
                    <button className="btn bs" style={{ fontSize: 9, padding: "4px 8px" }}>Reuse</button>
                  </div>
                </div>
              </div>
            ))}
          </>)}

          {/* ── B8: SETTINGS ── */}
          {b2bTab === "settings" && (<>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>COMPANY SETTINGS</div>
              <input className="input" placeholder="Company Name" defaultValue={user?.email?.split("@")[1]?.replace(".", " ")} style={{ marginBottom: 8 }} />
              <select className="input" style={{ marginBottom: 8 }}>
                <option>Team size: 5-10 engineers</option><option>11-50 engineers</option><option>50+ engineers</option>
              </select>
              <button className="btn bp" style={{ fontSize: 11 }}>Save</button>
            </div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>INTEGRATIONS</div>
              {[["Google Workspace SSO", "Not connected"], ["ATS (Zapier)", "Not connected"], ["Slack Notifications", "Not connected"]].map(([n, s], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontSize: 12 }}>{n}</span>
                  <button className="btn bs" style={{ fontSize: 9, padding: "3px 10px" }}>Connect</button>
                </div>
              ))}
            </div>
            <div className="card fadeUp" style={{ padding: 16 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>TEAM PERMISSIONS</div>
              {[["Admin", "Full access"], ["Hiring Manager", "Results + invites"], ["Recruiter", "Invites only"], ["Viewer", "Results only"]].map(([r, d], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, borderBottom: i < 3 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontWeight: 600 }}>{r}</span>
                  <span style={{ color: "var(--tx3)" }}>{d}</span>
                </div>
              ))}
            </div>
          </>)}
        </div></div>
      </div>
    );
  }

  // ═══ LOADING FALLBACK ═══
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <div className="page"><div className="cnt"><div style={{ textAlign: "center", padding: 40 }}><div className="loader" /></div></div></div>
    </div>
  );
}



