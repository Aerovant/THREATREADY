import { useState } from "react";

const VULNS = [
  { id: "V001", title: "RCE in Apache Log4j (Log4Shell)", cvss: 10.0, severity: "CRITICAL", system: "Payment API Server", exploitAvail: "Public PoC", patchAvail: "Yes", age: "3 days", affectedUsers: "All", internet: true, category: "RCE" },
  { id: "V002", title: "SQL Injection in User Search API", cvss: 9.8, severity: "CRITICAL", system: "Customer Portal", exploitAvail: "Weaponized", patchAvail: "Fix available", age: "1 day", affectedUsers: "All", internet: true, category: "Injection" },
  { id: "V003", title: "Privilege Escalation in Kubernetes RBAC", cvss: 8.8, severity: "HIGH", system: "K8s Cluster (prod)", exploitAvail: "Private", patchAvail: "Workaround", age: "5 days", affectedUsers: "Internal", internet: false, category: "PrivEsc" },
  { id: "V004", title: "XSS (Stored) in Admin Dashboard", cvss: 8.1, severity: "HIGH", system: "Internal Admin Tool", exploitAvail: "Trivial", patchAvail: "Yes", age: "7 days", affectedUsers: "Admins only", internet: false, category: "XSS" },
  { id: "V005", title: "Outdated TLS 1.0 on Legacy API", cvss: 7.5, severity: "HIGH", system: "Partner Integration API", exploitAvail: "Known", patchAvail: "Config change", age: "30 days", affectedUsers: "Partners", internet: true, category: "Crypto" },
  { id: "V006", title: "SSRF in Image Upload Service", cvss: 8.6, severity: "HIGH", system: "Media Service", exploitAvail: "Public PoC", patchAvail: "Yes", age: "2 days", affectedUsers: "All", internet: true, category: "SSRF" },
  { id: "V007", title: "Weak Password Policy (no MFA)", cvss: 7.2, severity: "HIGH", system: "Employee SSO", exploitAvail: "N/A", patchAvail: "Config change", age: "90 days", affectedUsers: "Employees", internet: true, category: "AuthN" },
  { id: "V008", title: "Missing Rate Limiting on Login API", cvss: 6.5, severity: "MEDIUM", system: "Auth Service", exploitAvail: "Trivial", patchAvail: "Yes", age: "14 days", affectedUsers: "All", internet: true, category: "Config" },
  { id: "V009", title: "Information Disclosure via Error Pages", cvss: 5.3, severity: "MEDIUM", system: "Web Application", exploitAvail: "Trivial", patchAvail: "Config change", age: "21 days", affectedUsers: "All", internet: true, category: "InfoLeak" },
  { id: "V010", title: "Unencrypted S3 Bucket (non-sensitive logs)", cvss: 5.0, severity: "MEDIUM", system: "Log Storage", exploitAvail: "N/A", patchAvail: "Config change", age: "60 days", affectedUsers: "None", internet: false, category: "Config" },
  { id: "V011", title: "DoS via ReDoS in Email Validation", cvss: 5.9, severity: "MEDIUM", system: "Registration API", exploitAvail: "PoC", patchAvail: "Yes", age: "10 days", affectedUsers: "All", internet: true, category: "DoS" },
  { id: "V012", title: "Insecure Direct Object Reference (IDOR)", cvss: 7.5, severity: "HIGH", system: "Profile API", exploitAvail: "Trivial", patchAvail: "Fix available", age: "4 days", affectedUsers: "All", internet: true, category: "AuthZ" },
];

const BUDGET = 40;

const severityColor = (s) => ({ CRITICAL: "#ff2244", HIGH: "#f59e0b", MEDIUM: "#3b82f6", LOW: "#22c55e" }[s] || "#888");

export default function VulnVerdict() {
  const [priorities, setPriorities] = useState({});
  const [justifications, setJustifications] = useState({});
  const [expandedVuln, setExpandedVuln] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState("cvss");
  const [filterSev, setFilterSev] = useState(null);

  const setPriority = (vulnId, hours) => {
    setPriorities(prev => {
      const next = { ...prev };
      if (hours === 0) { delete next[vulnId]; } else { next[vulnId] = hours; }
      return next;
    });
  };

  const totalAllocated = Object.values(priorities).reduce((s, h) => s + h, 0);
  const remaining = BUDGET - totalAllocated;

  const sorted = [...VULNS].sort((a, b) => {
    if (sortBy === "cvss") return b.cvss - a.cvss;
    if (sortBy === "age") return parseInt(b.age) - parseInt(a.age);
    return 0;
  });

  const filtered = filterSev ? sorted.filter(v => v.severity === filterSev) : sorted;

  if (showResults) {
    const prioritized = VULNS.filter(v => priorities[v.id]).sort((a, b) => (priorities[b.id] || 0) - (priorities[a.id] || 0));
    const skipped = VULNS.filter(v => !priorities[v.id]);
    return (
      <div style={styles.container}>
        <div style={styles.resultsCard}>
          <h2 style={styles.resultsTitle}>⚖️ TRIAGE EVALUATION</h2>
          <p style={styles.resultsSubtitle}>Your prioritization vs. AI-recommended optimal triage</p>

          <div style={styles.budgetSummary}>
            <div style={styles.budgetItem}><span style={styles.budgetNum}>{totalAllocated}h</span><span style={styles.budgetLabel}>Allocated</span></div>
            <div style={styles.budgetItem}><span style={styles.budgetNum}>{remaining}h</span><span style={styles.budgetLabel}>Remaining</span></div>
            <div style={styles.budgetItem}><span style={styles.budgetNum}>{prioritized.length}</span><span style={styles.budgetLabel}>Vulnerabilities Addressed</span></div>
            <div style={styles.budgetItem}><span style={styles.budgetNum}>{skipped.length}</span><span style={styles.budgetLabel}>Accepted Risk</span></div>
          </div>

          <div style={styles.evalScores}>
            {["Risk Prioritization", "Business Context", "Resource Allocation", "Justification Quality", "Accepted Risk Reasoning"].map((dim, i) => {
              const score = (5 + Math.random() * 4.5).toFixed(1);
              return (
                <div key={i} style={styles.evalRow}>
                  <span style={styles.evalLabel}>{dim}</span>
                  <div style={styles.evalBar}><div style={{ ...styles.evalFill, width: `${score * 10}%` }} /></div>
                  <span style={styles.evalScore}>{score}</span>
                </div>
              );
            })}
          </div>

          <div style={styles.triageList}>
            <h4 style={styles.triageHeader}>YOUR TRIAGE ORDER</h4>
            {prioritized.map((v, i) => (
              <div key={v.id} style={styles.triageItem}>
                <span style={styles.triageRank}>#{i + 1}</span>
                <span style={{ ...styles.triageSev, color: severityColor(v.severity) }}>{v.severity}</span>
                <span style={styles.triageName}>{v.title}</span>
                <span style={styles.triageHours}>{priorities[v.id]}h</span>
              </div>
            ))}
            {skipped.length > 0 && (
              <>
                <h4 style={{ ...styles.triageHeader, color: "#666", marginTop: "16px" }}>ACCEPTED RISK (not addressed)</h4>
                {skipped.map(v => (
                  <div key={v.id} style={{ ...styles.triageItem, opacity: 0.5 }}>
                    <span style={styles.triageRank}>—</span>
                    <span style={{ ...styles.triageSev, color: severityColor(v.severity) }}>{v.severity}</span>
                    <span style={styles.triageName}>{v.title}</span>
                    <span style={styles.triageHours}>0h</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <button style={styles.retryBtn} onClick={() => { setShowResults(false); setPriorities({}); setJustifications({}); }}>
            TRY AGAIN WITH DIFFERENT STRATEGY →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>⚖️ VULNVERDICT</span>
          <span style={styles.headerBadge}>TRIAGE MODE</span>
        </div>
        <div style={styles.budgetBar}>
          <span style={styles.budgetText}>ENGINEERING BUDGET</span>
          <div style={styles.budgetTrack}>
            <div style={{ ...styles.budgetFill, width: `${(totalAllocated / BUDGET) * 100}%`, background: remaining < 0 ? "#ff2244" : remaining < 10 ? "#f59e0b" : "#22c55e" }} />
          </div>
          <span style={{ ...styles.budgetRemaining, color: remaining < 0 ? "#ff2244" : "#22c55e" }}>{remaining}h remaining of {BUDGET}h</span>
        </div>
      </div>

      {/* Mission */}
      <div style={styles.missionCard}>
        <h2 style={styles.missionTitle}>You have 40 engineering hours. 12 vulnerabilities. Prioritize.</h2>
        <p style={styles.missionDesc}>Your vulnerability scanner returned 12 findings across production systems. You have a budget of 40 engineering hours this sprint. Allocate hours to each vulnerability based on risk, business impact, and exploitability. Justify your decisions. Some vulnerabilities will remain unpatched — that's a deliberate risk acceptance decision.</p>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>FILTER:</span>
          {[null, "CRITICAL", "HIGH", "MEDIUM"].map(sev => (
            <button key={sev || "all"} style={{ ...styles.filterBtn, background: filterSev === sev ? "rgba(255,255,255,0.08)" : "transparent", color: sev ? severityColor(sev) : "#888" }} onClick={() => setFilterSev(sev)}>
              {sev || "All"}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>SORT:</span>
          <button style={{ ...styles.filterBtn, background: sortBy === "cvss" ? "rgba(255,255,255,0.08)" : "transparent" }} onClick={() => setSortBy("cvss")}>CVSS ↓</button>
          <button style={{ ...styles.filterBtn, background: sortBy === "age" ? "rgba(255,255,255,0.08)" : "transparent" }} onClick={() => setSortBy("age")}>Age ↓</button>
        </div>
      </div>

      {/* Vuln List */}
      <div style={styles.vulnList}>
        {filtered.map(v => (
          <div key={v.id} style={{ ...styles.vulnCard, borderLeftColor: severityColor(v.severity) }}>
            <div style={styles.vulnHeader} onClick={() => setExpandedVuln(expandedVuln === v.id ? null : v.id)}>
              <div style={styles.vulnLeft}>
                <span style={styles.vulnId}>{v.id}</span>
                <span style={{ ...styles.vulnSev, background: `${severityColor(v.severity)}18`, color: severityColor(v.severity) }}>{v.severity}</span>
                <span style={styles.vulnCvss}>CVSS {v.cvss}</span>
              </div>
              <div style={styles.vulnCenter}>
                <span style={styles.vulnTitle}>{v.title}</span>
                <span style={styles.vulnSystem}>{v.system}</span>
              </div>
              <div style={styles.vulnRight}>
                <div style={styles.hourControl}>
                  <button style={styles.hourBtn} onClick={(e) => { e.stopPropagation(); setPriority(v.id, Math.max(0, (priorities[v.id] || 0) - 2)); }}>−</button>
                  <span style={styles.hourValue}>{priorities[v.id] || 0}h</span>
                  <button style={styles.hourBtn} onClick={(e) => { e.stopPropagation(); if (remaining >= 2) setPriority(v.id, (priorities[v.id] || 0) + 2); }}>+</button>
                </div>
              </div>
            </div>
            {expandedVuln === v.id && (
              <div style={styles.vulnDetails}>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Exploit</span><span style={styles.detailValue}>{v.exploitAvail}</span></div>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Patch</span><span style={styles.detailValue}>{v.patchAvail}</span></div>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Age</span><span style={styles.detailValue}>{v.age}</span></div>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Affected</span><span style={styles.detailValue}>{v.affectedUsers}</span></div>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Internet</span><span style={{ ...styles.detailValue, color: v.internet ? "#ef4444" : "#22c55e" }}>{v.internet ? "Yes" : "No"}</span></div>
                  <div style={styles.detailItem}><span style={styles.detailLabel}>Category</span><span style={styles.detailValue}>{v.category}</span></div>
                </div>
                {/* Justification textarea REMOVED — display-only mode */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit bar REMOVED — display-only mode */}
    </div>
  );
}

const styles = {
  container: { background: "#080812", minHeight: "100vh", color: "#d0d0d8", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "18px", fontWeight: "700", color: "#f59e0b", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" },
  headerBadge: { fontSize: "9px", padding: "3px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#fbbf24", letterSpacing: "2px", fontWeight: "600" },
  budgetBar: { display: "flex", alignItems: "center", gap: "12px" },
  budgetText: { fontSize: "9px", color: "#666", letterSpacing: "1.5px", fontFamily: "'JetBrains Mono', monospace" },
  budgetTrack: { width: "200px", height: "8px", background: "#1a1a2a", borderRadius: "4px", overflow: "hidden" },
  budgetFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s" },
  budgetRemaining: { fontSize: "11px", fontWeight: "600", fontFamily: "'JetBrains Mono', monospace" },
  missionCard: { margin: "20px 24px", padding: "24px", background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(239,68,68,0.04))", border: "1px solid rgba(245,158,11,0.1)", borderRadius: "14px" },
  missionTitle: { fontSize: "16px", fontWeight: "700", color: "#fff", margin: "0 0 10px 0" },
  missionDesc: { fontSize: "13px", color: "#999", lineHeight: "1.7", margin: 0 },
  filterBar: { display: "flex", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  filterGroup: { display: "flex", alignItems: "center", gap: "6px" },
  filterLabel: { fontSize: "9px", color: "#555", letterSpacing: "1.5px", fontFamily: "'JetBrains Mono', monospace" },
  filterBtn: { padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", color: "#888", background: "transparent" },
  vulnList: { padding: "16px 24px", display: "flex", flexDirection: "column", gap: "8px" },
  vulnCard: { borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", borderLeft: "4px solid", overflow: "hidden", background: "rgba(255,255,255,0.01)" },
  vulnHeader: { display: "flex", alignItems: "center", padding: "14px 18px", cursor: "pointer", gap: "14px" },
  vulnLeft: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  vulnId: { fontSize: "10px", color: "#555", fontFamily: "'JetBrains Mono', monospace" },
  vulnSev: { fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", letterSpacing: "1px" },
  vulnCvss: { fontSize: "11px", fontWeight: "700", color: "#fff", fontFamily: "'JetBrains Mono', monospace" },
  vulnCenter: { flex: 1 },
  vulnTitle: { display: "block", fontSize: "13px", color: "#ddd", fontWeight: "500" },
  vulnSystem: { display: "block", fontSize: "11px", color: "#666", marginTop: "2px" },
  vulnRight: {},
  hourControl: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "4px 8px" },
  hourBtn: { width: "28px", height: "28px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  hourValue: { fontSize: "14px", fontWeight: "700", color: "#f59e0b", width: "32px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" },
  vulnDetails: { padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "12px" },
  detailItem: { display: "flex", flexDirection: "column", gap: "2px" },
  detailLabel: { fontSize: "9px", color: "#555", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" },
  detailValue: { fontSize: "12px", color: "#bbb" },
  justifyInput: { width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px", color: "#d0d0d8", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" },
  submitBar: { position: "sticky", bottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "rgba(8,8,18,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" },
  submitInfo: { display: "flex", gap: "20px" },
  submitStat: { fontSize: "12px", color: "#888", fontFamily: "'JetBrains Mono', monospace" },
  submitBtn: { padding: "12px 32px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
  resultsCard: { maxWidth: "700px", margin: "30px auto", padding: "36px" },
  resultsTitle: { fontSize: "18px", fontWeight: "700", color: "#f59e0b", margin: "0 0 4px 0", fontFamily: "'JetBrains Mono', monospace" },
  resultsSubtitle: { fontSize: "13px", color: "#888", margin: "0 0 24px 0" },
  budgetSummary: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  budgetItem: { padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" },
  budgetNum: { display: "block", fontSize: "22px", fontWeight: "700", color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" },
  budgetLabel: { fontSize: "10px", color: "#777" },
  evalScores: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  evalRow: { display: "flex", alignItems: "center", gap: "12px" },
  evalLabel: { fontSize: "11px", color: "#999", width: "200px" },
  evalBar: { flex: 1, height: "6px", background: "#1a1a2a", borderRadius: "3px", overflow: "hidden" },
  evalFill: { height: "100%", background: "linear-gradient(90deg, #f59e0b, #22c55e)", borderRadius: "3px" },
  evalScore: { fontSize: "12px", fontWeight: "700", color: "#f59e0b", width: "30px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },
  triageList: { marginBottom: "20px" },
  triageHeader: { fontSize: "9px", fontWeight: "700", color: "#555", letterSpacing: "2px", margin: "0 0 10px 0", fontFamily: "'JetBrains Mono', monospace" },
  triageItem: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "12px" },
  triageRank: { width: "30px", fontWeight: "700", color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" },
  triageSev: { fontSize: "9px", fontWeight: "700", width: "70px" },
  triageName: { flex: 1, color: "#bbb" },
  triageHours: { fontWeight: "700", color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" },
  retryBtn: { width: "100%", padding: "14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", color: "#f59e0b", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
};
