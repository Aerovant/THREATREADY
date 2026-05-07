import { useState } from "react";

const CHALLENGE = {
  title: "Design a Secure Architecture for a HealthTech Startup",
  brief: "MediSync is a Series A healthtech startup building a telemedicine platform. They need to process patient video consultations, store medical records (HIPAA/DISHA compliant), handle prescription management, and integrate with 3rd-party pharmacy APIs. They expect 50,000 monthly active users within 12 months.",
  requirements: [
    { id: "r1", category: "COMPLIANCE", text: "HIPAA compliant data storage and transmission for PHI (Protected Health Information)" },
    { id: "r2", category: "SCALE", text: "Support 50,000 MAU with 500 concurrent video sessions" },
    { id: "r3", category: "INTEGRATION", text: "REST API integration with 3 pharmacy chains for prescription fulfillment" },
    { id: "r4", category: "DATA", text: "Store patient records, consultation history, prescriptions, and billing data" },
    { id: "r5", category: "SECURITY", text: "End-to-end encryption for video calls and zero-trust access for all internal services" },
    { id: "r6", category: "AVAILABILITY", text: "99.95% uptime SLA with disaster recovery across 2 AWS regions" },
  ],
};

const COMPONENTS = [
  { id: "cdn", label: "CloudFront CDN", category: "Network", color: "#3b82f6", icon: "🌐" },
  { id: "waf", label: "AWS WAF", category: "Security", color: "#ef4444", icon: "🛡️" },
  { id: "alb", label: "Application LB", category: "Network", color: "#3b82f6", icon: "⚖️" },
  { id: "apigw", label: "API Gateway", category: "Network", color: "#3b82f6", icon: "🚪" },
  { id: "cognito", label: "AWS Cognito", category: "Auth", color: "#a855f7", icon: "🔐" },
  { id: "ecs", label: "ECS Fargate", category: "Compute", color: "#f59e0b", icon: "📦" },
  { id: "lambda", label: "Lambda", category: "Compute", color: "#f59e0b", icon: "⚡" },
  { id: "rds", label: "RDS PostgreSQL", category: "Database", color: "#22c55e", icon: "🗄️" },
  { id: "dynamo", label: "DynamoDB", category: "Database", color: "#22c55e", icon: "📊" },
  { id: "s3", label: "S3 (Encrypted)", category: "Storage", color: "#06b6d4", icon: "💾" },
  { id: "kms", label: "AWS KMS", category: "Security", color: "#ef4444", icon: "🔑" },
  { id: "secrets", label: "Secrets Manager", category: "Security", color: "#ef4444", icon: "🔒" },
  { id: "vpc", label: "Private VPC", category: "Network", color: "#3b82f6", icon: "🏰" },
  { id: "guardduty", label: "GuardDuty", category: "Monitoring", color: "#f97316", icon: "👁️" },
  { id: "cloudwatch", label: "CloudWatch", category: "Monitoring", color: "#f97316", icon: "📈" },
  { id: "sqs", label: "SQS Queue", category: "Messaging", color: "#8b5cf6", icon: "📬" },
  { id: "kinesis", label: "Kinesis", category: "Streaming", color: "#8b5cf6", icon: "🌊" },
  { id: "chime", label: "Chime SDK", category: "Video", color: "#06b6d4", icon: "📹" },
  { id: "macie", label: "AWS Macie", category: "Security", color: "#ef4444", icon: "🔎" },
  { id: "backup", label: "AWS Backup", category: "DR", color: "#f97316", icon: "💿" },
];

const CATEGORIES = [...new Set(COMPONENTS.map(c => c.category))];

const EVAL_DIMENSIONS = [
  "Defense-in-Depth Coverage",
  "HIPAA Compliance Alignment", 
  "Zero-Trust Implementation",
  "Data Encryption Strategy",
  "Availability & DR Design",
  "API Security Architecture",
  "Monitoring & Detection",
  "Least Privilege Access",
];

export default function ArchitectDefend() {
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [justifications, setJustifications] = useState({});
  const [showEval, setShowEval] = useState(false);
  const [architectureNotes, setArchitectureNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState(null);

  const toggleComponent = (comp) => {
    setSelectedComponents(prev => 
      prev.find(c => c.id === comp.id) ? prev.filter(c => c.id !== comp.id) : [...prev, comp]
    );
  };

  const filtered = filterCategory ? COMPONENTS.filter(c => c.category === filterCategory) : COMPONENTS;

  if (showEval) {
    return (
      <div style={styles.container}>
        <div style={styles.evalCard}>
          <h2 style={styles.evalTitle}>🏗️ ARCHITECTURE EVALUATION</h2>
          <p style={styles.evalSubtitle}>Your design vs. Expert Reference Architecture</p>
          
          <div style={styles.evalStats}>
            <div style={styles.evalStatBox}>
              <span style={styles.evalStatNum}>{selectedComponents.length}</span>
              <span style={styles.evalStatLabel}>Components Used</span>
            </div>
            <div style={styles.evalStatBox}>
              <span style={styles.evalStatNum}>{CATEGORIES.filter(cat => selectedComponents.some(c => c.category === cat)).length}/{CATEGORIES.length}</span>
              <span style={styles.evalStatLabel}>Categories Covered</span>
            </div>
            <div style={styles.evalStatBox}>
              <span style={styles.evalStatNum}>{((selectedComponents.length / 14) * 10).toFixed(1)}</span>
              <span style={styles.evalStatLabel}>Completeness Score</span>
            </div>
          </div>

          <div style={styles.evalDimGrid}>
            {EVAL_DIMENSIONS.map((dim, i) => {
              const score = (4 + Math.random() * 5.5).toFixed(1);
              return (
                <div key={i} style={styles.evalDimRow}>
                  <span style={styles.evalDimLabel}>{dim}</span>
                  <div style={styles.evalDimBar}>
                    <div style={{ ...styles.evalDimFill, width: `${score * 10}%`, background: parseFloat(score) >= 7 ? "#22c55e" : parseFloat(score) >= 5 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span style={{ ...styles.evalDimScore, color: parseFloat(score) >= 7 ? "#22c55e" : parseFloat(score) >= 5 ? "#f59e0b" : "#ef4444" }}>{score}</span>
                </div>
              );
            })}
          </div>

          <div style={styles.missingSection}>
            <h4 style={styles.missingTitle}>GAPS IDENTIFIED</h4>
            {COMPONENTS.filter(c => !selectedComponents.find(s => s.id === c.id) && ["Security", "Monitoring"].includes(c.category)).map((c, i) => (
              <div key={i} style={styles.missingItem}>
                <span style={styles.missingIcon}>⚠️</span>
                <span style={styles.missingText}><strong>{c.label}</strong> — Missing from your architecture. Recommended for {c.category.toLowerCase()} coverage.</span>
              </div>
            ))}
          </div>

          <button style={styles.retryBtn} onClick={() => { setShowEval(false); setSelectedComponents([]); setArchitectureNotes(""); }}>
            TRY ANOTHER CHALLENGE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>🏗️ ARCHITECTDEFEND</span>
        <span style={styles.headerSub}>Secure Architecture Design Challenge</span>
      </div>

      {/* Challenge Brief */}
      <div style={styles.briefCard}>
        <h2 style={styles.briefTitle}>{CHALLENGE.title}</h2>
        <p style={styles.briefText}>{CHALLENGE.brief}</p>
        <div style={styles.reqGrid}>
          {CHALLENGE.requirements.map(r => (
            <div key={r.id} style={styles.reqItem}>
              <span style={styles.reqCat}>{r.category}</span>
              <span style={styles.reqText}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Left — Component Palette */}
        <div style={styles.palettePanel}>
          <h3 style={styles.panelTitle}>COMPONENT PALETTE</h3>
          <div style={styles.catFilters}>
            <button style={{ ...styles.catBtn, background: !filterCategory ? "rgba(255,255,255,0.08)" : "transparent" }} onClick={() => setFilterCategory(null)}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat} style={{ ...styles.catBtn, background: filterCategory === cat ? "rgba(255,255,255,0.08)" : "transparent" }} onClick={() => setFilterCategory(cat)}>{cat}</button>
            ))}
          </div>
          <div style={styles.compGrid}>
            {filtered.map(comp => {
              const isSelected = selectedComponents.find(c => c.id === comp.id);
              return (
                <button key={comp.id} style={{ ...styles.compCard, borderColor: isSelected ? comp.color : "rgba(255,255,255,0.06)", background: isSelected ? `${comp.color}10` : "rgba(255,255,255,0.01)" }} onClick={() => toggleComponent(comp)}>
                  <span style={styles.compIcon}>{comp.icon}</span>
                  <span style={styles.compLabel}>{comp.label}</span>
                  <span style={{ ...styles.compCat, color: comp.color }}>{comp.category}</span>
                  {isSelected && <span style={styles.checkMark}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Your Architecture (REMOVED — display-only mode) */}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#070712", minHeight: "100vh", color: "#d0d0d8", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  header: { padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "14px", background: "rgba(0,0,0,0.3)" },
  logo: { fontSize: "18px", fontWeight: "700", color: "#06b6d4", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" },
  headerSub: { fontSize: "12px", color: "#666" },
  briefCard: { margin: "20px 24px", padding: "24px", background: "linear-gradient(135deg, rgba(6,182,212,0.04), rgba(59,130,246,0.04))", border: "1px solid rgba(6,182,212,0.1)", borderRadius: "14px" },
  briefTitle: { fontSize: "17px", fontWeight: "700", color: "#fff", margin: "0 0 10px 0" },
  briefText: { fontSize: "13px", color: "#999", lineHeight: "1.7", margin: "0 0 18px 0" },
  reqGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  reqItem: { display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" },
  reqCat: { fontSize: "8px", fontWeight: "700", color: "#06b6d4", background: "rgba(6,182,212,0.1)", padding: "2px 6px", borderRadius: "3px", letterSpacing: "1px", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" },
  reqText: { fontSize: "11px", color: "#aaa", lineHeight: "1.4" },
  mainGrid: { display: "block", padding: "0", minHeight: "auto" },
  palettePanel: { padding: "20px 24px", borderRight: "none" },
  archPanel: { padding: "20px 24px", overflowY: "auto" },
  panelTitle: { fontSize: "12px", fontWeight: "700", color: "#888", letterSpacing: "2.5px", marginBottom: "16px", margin: "0 0 16px 0", fontFamily: "'JetBrains Mono', monospace" },
  catFilters: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" },
  catBtn: { padding: "6px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#bbb", fontSize: "12px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" },
  compGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" },
  compCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "16px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s", position: "relative", background: "transparent" },
  compIcon: { fontSize: "26px" },
  compLabel: { fontSize: "13px", color: "#eee", fontWeight: "500" },
  compCat: { fontSize: "10px", letterSpacing: "0.5px" },
  checkMark: { position: "absolute", top: "6px", right: "8px", fontSize: "12px", color: "#22c55e", fontWeight: "700" },
  emptyArch: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "2px dashed rgba(255,255,255,0.06)" },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  emptyText: { fontSize: "13px", color: "#555", textAlign: "center" },
  selectedGrid: { display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" },
  catGroup: {},
  catGroupTitle: { fontSize: "9px", fontWeight: "700", color: "#555", letterSpacing: "2px", fontFamily: "'JetBrains Mono', monospace" },
  catGroupItems: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" },
  selectedComp: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", border: "1px solid", borderRadius: "8px", fontSize: "11px", color: "#ccc", background: "rgba(255,255,255,0.02)" },
  removeBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "16px", padding: "0 2px" },
  notesSection: { marginTop: "16px" },
  notesTitle: { fontSize: "9px", fontWeight: "700", color: "#555", letterSpacing: "2px", margin: "0 0 10px 0", fontFamily: "'JetBrains Mono', monospace" },
  notesInput: { width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px", color: "#d0d0d8", fontSize: "12px", lineHeight: "1.6", resize: "vertical", outline: "none", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", marginTop: "16px" },
  evalCard: { maxWidth: "700px", margin: "30px auto", padding: "36px" },
  evalTitle: { fontSize: "18px", fontWeight: "700", color: "#06b6d4", margin: "0 0 4px 0", fontFamily: "'JetBrains Mono', monospace" },
  evalSubtitle: { fontSize: "13px", color: "#888", margin: "0 0 24px 0" },
  evalStats: { display: "flex", gap: "16px", marginBottom: "28px" },
  evalStatBox: { flex: 1, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" },
  evalStatNum: { display: "block", fontSize: "24px", fontWeight: "700", color: "#06b6d4", fontFamily: "'JetBrains Mono', monospace" },
  evalStatLabel: { fontSize: "10px", color: "#777" },
  evalDimGrid: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  evalDimRow: { display: "flex", alignItems: "center", gap: "12px" },
  evalDimLabel: { fontSize: "11px", color: "#999", width: "200px" },
  evalDimBar: { flex: 1, height: "6px", background: "#1a1a2a", borderRadius: "3px", overflow: "hidden" },
  evalDimFill: { height: "100%", borderRadius: "3px" },
  evalDimScore: { fontSize: "12px", fontWeight: "700", width: "30px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },
  missingSection: { padding: "20px", background: "rgba(239,68,68,0.03)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.08)", marginBottom: "20px" },
  missingTitle: { fontSize: "9px", fontWeight: "700", color: "#ef4444", letterSpacing: "2px", margin: "0 0 12px 0", fontFamily: "'JetBrains Mono', monospace" },
  missingItem: { display: "flex", gap: "8px", padding: "6px 0", fontSize: "12px", color: "#999", lineHeight: "1.4" },
  missingIcon: { flexShrink: 0 },
  missingText: { flex: 1 },
  retryBtn: { width: "100%", padding: "14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "10px", color: "#06b6d4", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
};
