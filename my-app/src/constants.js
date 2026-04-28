// ═══════════════════════════════════════════════════════════════
// SHARED CONSTANTS
// All static data used throughout the app.
// Imported by App.jsx and any pages/components that need it.
// ═══════════════════════════════════════════════════════════════
import { SCENARIOS } from './cyberprep-database.js';

// ── ROLES ──
export const ROLES = [
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

export const DIFFICULTIES = [
  { id: "beginner", name: "Beginner", color: "#22c55e", icon: "🌱", hints: true, time: "5-8 min", questions: 5 },
  { id: "intermediate", name: "Intermediate", color: "#f59e0b", icon: "⚡", hints: "reduced", time: "10-14 min", questions: 5 },
  { id: "advanced", name: "Advanced", color: "#ef4444", icon: "🔥", hints: "minimal", time: "12-18 min", questions: 5 },
  { id: "expert", name: "Expert", color: "#8b5cf6", icon: "💎", hints: false, time: "15-20 min", questions: 5 }
];

// ── HOOK COPY POOL (Randomized on each refresh) ──
export const HOOK_HEADLINES = [
  "Your Attack Reasoning Matters More Than Your Certifications",
  "Prove How You Think Under Fire — Not Just What You Know",
  "Decision-Making Under Attack. That's What Gets You Hired.",
  "Stop Memorizing Frameworks. Start Reasoning Through Attacks.",
  "The Interview That Tests What Certifications Can't Measure"
];

export const HOOK_SUBLINES = [
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
export const NT = { threat: { bg: "#3a1a2a", bd: "#f44336", ic: "☠️" }, cloud: { bg: "#0d2137", bd: "#4FC3F7", ic: "☁️" }, iam: { bg: "#3a1a1a", bd: "#ff5252", ic: "🔐" }, vault: { bg: "#1a3a3a", bd: "#00BCD4", ic: "🔒" }, db: { bg: "#1a2a3a", bd: "#9C27B0", ic: "🗄️" }, storage: { bg: "#2a2a1a", bd: "#FF9800", ic: "📦" }, siem: { bg: "#2a1a3a", bd: "#7C4DFF", ic: "📊" }, user: { bg: "#1a2a2a", bd: "#00BCD4", ic: "👤" }, api: { bg: "#2a1a2a", bd: "#AB47BC", ic: "🔌" }, waf: { bg: "#1a2a1a", bd: "#4CAF50", ic: "🛡️" }, lambda: { bg: "#1a2a1a", bd: "#FF9800", ic: "⚡" }, compute: { bg: "#1a3a2a", bd: "#66BB6A", ic: "💻" }, k8s: { bg: "#0d1f3c", bd: "#326CE5", ic: "☸️" }, pam: { bg: "#3a1a2a", bd: "#E91E63", ic: "🔑" }, cicd: { bg: "#1a3a5c", bd: "#2196F3", ic: "⚙️" }, registry: { bg: "#1a2a2a", bd: "#26A69A", ic: "📋" }, policy: { bg: "#2a2a1a", bd: "#FFCA28", ic: "📜" }, monitor: { bg: "#1a1a2a", bd: "#7E57C2", ic: "👁️" }, network: { bg: "#1a1a3a", bd: "#5C6BC0", ic: "🔗" }, firewall: { bg: "#2a2a1a", bd: "#FF6F00", ic: "🧱" }, dns: { bg: "#1a3a1a", bd: "#43A047", ic: "🌐" }, c2: { bg: "#3a0a0a", bd: "#D50000", ic: "💀" }, vpn: { bg: "#1a2a2a", bd: "#0288D1", ic: "🔒" }, endpoint: { bg: "#2a2a2a", bd: "#78909C", ic: "🖥️" }, ad: { bg: "#2a1a1a", bd: "#EF5350", ic: "🏛️" }, container: { bg: "#0d2137", bd: "#0097A7", ic: "🐳" } };

// ── DEMO QUESTIONS (Randomized) ──
export const DEMO_QUESTIONS = [
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

export const TOTAL_SC = Object.values(SCENARIOS).reduce((s, a) => s + a.length, 0);

// Re-export SCENARIOS so other files can import everything from one place
export { SCENARIOS };
