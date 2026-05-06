import { useState } from "react";

const LOG_SOURCES = [
  { id: "cloudtrail", name: "CloudTrail", icon: "☁️", count: 2847, color: "#f59e0b" },
  { id: "vpcflow", name: "VPC Flow Logs", icon: "🔀", count: 15420, color: "#3b82f6" },
  { id: "dns", name: "DNS Query Logs", icon: "🌐", count: 8932, color: "#22c55e" },
  { id: "waf", name: "WAF Logs", icon: "🛡️", count: 4210, color: "#ef4444" },
  { id: "lambda", name: "Lambda Logs", icon: "⚡", count: 6118, color: "#a855f7" },
];

const SAMPLE_LOGS = {
  cloudtrail: [
    { time: "2026-04-14T02:14:33Z", level: "INFO", msg: 'AssumeRole by arn:aws:iam::123456:user/jenkins-deploy to role/prod-admin-access from IP 10.0.4.22' },
    { time: "2026-04-14T02:14:35Z", level: "INFO", msg: 'ListBuckets by role/prod-admin-access — returned 47 buckets' },
    { time: "2026-04-14T02:15:01Z", level: "WARN", msg: 'GetBucketPolicy on s3://customer-pii-backup by role/prod-admin-access — FIRST TIME ACCESS' },
    { time: "2026-04-14T02:15:44Z", level: "INFO", msg: 'PutObject to s3://internal-logs/exports/data_export_041426.tar.gz — 2.3GB — role/prod-admin-access' },
    { time: "2026-04-14T02:16:02Z", level: "INFO", msg: 'CreateAccessKey for user/temp-analytics — by role/prod-admin-access' },
    { time: "2026-04-14T02:16:18Z", level: "WARN", msg: 'DisableCloudTrailLogging attempted by role/prod-admin-access — DENIED by SCP' },
    { time: "2026-04-14T02:17:33Z", level: "INFO", msg: 'DescribeInstances by role/prod-admin-access — returned 234 instances across us-east-1' },
    { time: "2026-04-14T02:18:01Z", level: "INFO", msg: 'ModifySecurityGroup sg-0a4f2e — added ingress rule 0.0.0.0/0:22 — role/prod-admin-access' },
  ],
  vpcflow: [
    { time: "2026-04-14T02:10:00Z", level: "INFO", msg: '10.0.4.22 → 10.0.1.15:443 ACCEPT 340 bytes (normal API traffic)' },
    { time: "2026-04-14T02:14:30Z", level: "INFO", msg: '10.0.4.22 → 10.0.2.50:5432 ACCEPT 128 bytes (database query)' },
    { time: "2026-04-14T02:15:50Z", level: "WARN", msg: '10.0.4.22 → 185.234.72.11:443 ACCEPT 2,478,432,256 bytes (2.3GB outbound)' },
    { time: "2026-04-14T02:16:30Z", level: "INFO", msg: '10.0.4.22 → 10.0.3.100:22 ACCEPT (SSH to prod jump host)' },
    { time: "2026-04-14T02:17:00Z", level: "WARN", msg: '10.0.4.22 → 10.0.3.101:22 ACCEPT, 10.0.3.102:22 ACCEPT, 10.0.3.103:22 ACCEPT (rapid sequential SSH)' },
  ],
  dns: [
    { time: "2026-04-14T02:13:55Z", level: "INFO", msg: 'QUERY: api.internal.company.com → 10.0.1.15 (A record)' },
    { time: "2026-04-14T02:15:45Z", level: "WARN", msg: 'QUERY: data-sync-cdn.cloud-backup-service.xyz → 185.234.72.11 (A record) — FIRST SEEN DOMAIN' },
    { time: "2026-04-14T02:15:46Z", level: "WARN", msg: 'QUERY: c2-node-7.cloud-backup-service.xyz → 185.234.72.14 (A record) — FIRST SEEN DOMAIN' },
    { time: "2026-04-14T02:16:40Z", level: "INFO", msg: 'QUERY: updates.jenkins.io → 52.167.144.177 (A record)' },
    { time: "2026-04-14T02:17:45Z", level: "WARN", msg: 'TXT QUERY: aW5zdHJ1Y3Rpb25z.cloud-backup-service.xyz — possible DNS tunneling (encoded payload in subdomain)' },
  ],
  waf: [
    { time: "2026-04-14T02:10:15Z", level: "INFO", msg: 'ALLOW GET /api/v2/dashboard from 10.0.4.22 — rule: default-allow' },
    { time: "2026-04-14T02:12:00Z", level: "INFO", msg: 'ALLOW POST /api/v2/reports/generate from 10.0.4.22 — rule: authenticated-api' },
  ],
  lambda: [
    { time: "2026-04-14T02:14:40Z", level: "INFO", msg: 'data-export-handler invoked by role/prod-admin-access — first invocation in 90 days' },
    { time: "2026-04-14T02:14:42Z", level: "WARN", msg: 'data-export-handler: environment variable modified — EXFIL_ENDPOINT added at runtime' },
    { time: "2026-04-14T02:15:30Z", level: "INFO", msg: 'data-export-handler: execution completed — 2.3GB written to s3://internal-logs/exports/' },
  ],
};

const HUNT_QUESTIONS = [
  { id: "h1", text: "Based on the logs across all sources, identify the threat actor's complete kill chain. What happened, in what order, and what was the objective?" },
  { id: "h2", text: "What are the 3 strongest Indicators of Compromise (IOCs) in this data? Map each to MITRE ATT&CK techniques." },
  { id: "h3", text: "The attacker tried to disable CloudTrail logging but was blocked by SCP. What does this tell you about the attacker's sophistication and what additional defensive gaps should you investigate?" },
  { id: "h4", text: "Design 3 detection rules (in plain English) that would have caught this attack earlier. For each rule, specify the data source, the condition, and the alert severity." },
];

export default function ThreatHunt() {
  const [activeSource, setActiveSource] = useState("cloudtrail");
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showTimeline, setShowTimeline] = useState(false);

  const toggleLog = (idx) => {
    setSelectedLogs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const logs = SAMPLE_LOGS[activeSource] || [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🔍 THREATHUNT</span>
          <span style={styles.headerBadge}>HUNT MODE</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.totalLogs}>37,527 log entries</span>
          <span style={styles.timeRange}>Last 24 hours</span>
        </div>
      </div>

      {/* Mission Brief */}
      <div style={styles.missionCard}>
        <h2 style={styles.missionTitle}>MISSION: Something is wrong. Find it.</h2>
        <p style={styles.missionDesc}>Your AWS environment generated 37,527 log entries in the last 24 hours. Automated alerts caught nothing. But your threat intel feed flagged IP 185.234.72.11 as associated with APT-41. Investigate the logs, identify the threat, and document the attack chain.</p>
        <div style={styles.missionMeta}>
          <span style={styles.metaItem}>🎯 Objective: Identify threat actor activity</span>
          <span style={styles.metaItem}>⏱️ Time window: 02:00 - 03:00 AM IST</span>
          <span style={styles.metaItem}>📊 Scored on: Detection accuracy, methodology, false positive reasoning</span>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Left - Log Sources & Viewer */}
        <div style={styles.leftPanel}>
          {/* Source Tabs */}
          <div style={styles.sourceTabs}>
            {LOG_SOURCES.map(src => (
              <button key={src.id} style={{ ...styles.sourceTab, borderBottomColor: activeSource === src.id ? src.color : "transparent", color: activeSource === src.id ? "#fff" : "#666" }} onClick={() => setActiveSource(src.id)}>
                <span>{src.icon}</span>
                <span style={styles.srcName}>{src.name}</span>
                <span style={{ ...styles.srcCount, color: src.color }}>{src.count.toLocaleString()}</span>
              </button>
            ))}
          </div>

          {/* Log Viewer */}
          <div style={styles.logViewer}>
            <div style={styles.logToolbar}>
              <span style={styles.logToolTitle}>LOG ENTRIES — {activeSource.toUpperCase()}</span>
              <span style={styles.logHint}>Click suspicious entries to mark as evidence</span>
            </div>
            <div style={styles.logScroll}>
              {logs.map((log, i) => (
                <div key={i} style={{ ...styles.logLine, background: selectedLogs.includes(`${activeSource}-${i}`) ? "rgba(239,68,68,0.08)" : "transparent", borderLeftColor: log.level === "WARN" ? "#f59e0b" : "#333" }} onClick={() => toggleLog(`${activeSource}-${i}`)}>
                  <span style={styles.logTime}>{log.time.split("T")[1].replace("Z", "")}</span>
                  <span style={{ ...styles.logLevel, color: log.level === "WARN" ? "#f59e0b" : "#555" }}>[{log.level}]</span>
                  <span style={styles.logMsg}>{log.msg}</span>
                  {selectedLogs.includes(`${activeSource}-${i}`) && <span style={styles.evidenceTag}>📌 EVIDENCE</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Basket */}
          <div style={styles.evidenceBox}>
            <h4 style={styles.evidenceTitle}>EVIDENCE COLLECTED ({selectedLogs.length} items)</h4>
            {selectedLogs.length === 0 ? (
              <p style={styles.evidenceEmpty}>Click log entries above to mark them as evidence for your investigation</p>
            ) : (
              <div style={styles.evidenceList}>
                {selectedLogs.map((key, i) => {
                  const [src, idx] = key.split("-");
                  const log = SAMPLE_LOGS[src]?.[parseInt(idx)];
                  return log ? (
                    <div key={i} style={styles.evidenceItem}>
                      <span style={styles.evidenceSrc}>{src}</span>
                      <span style={styles.evidenceMsg}>{log.msg.substring(0, 80)}...</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right - Hunt Questions REMOVED — display-only mode */}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#060610", minHeight: "100vh", color: "#d0d0d8", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "18px", fontWeight: "700", color: "#22c55e", letterSpacing: "1.5px" },
  headerBadge: { fontSize: "9px", padding: "3px 10px", borderRadius: "4px", background: "rgba(34,197,94,0.12)", color: "#4ade80", letterSpacing: "2px", fontWeight: "600" },
  headerRight: { display: "flex", gap: "16px", alignItems: "center" },
  totalLogs: { fontSize: "12px", color: "#888" },
  timeRange: { fontSize: "10px", padding: "3px 10px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", color: "#666" },
  missionCard: { margin: "20px 24px", padding: "24px", background: "linear-gradient(135deg, rgba(34,197,94,0.04), rgba(59,130,246,0.04))", border: "1px solid rgba(34,197,94,0.1)", borderRadius: "14px" },
  missionTitle: { fontSize: "16px", fontWeight: "700", color: "#22c55e", margin: "0 0 10px 0", fontFamily: "'Inter', sans-serif" },
  missionDesc: { fontSize: "13px", color: "#999", lineHeight: "1.7", margin: "0 0 14px 0", fontFamily: "'Inter', sans-serif" },
  missionMeta: { display: "flex", gap: "20px", flexWrap: "wrap" },
  metaItem: { fontSize: "11px", color: "#777" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "0", minHeight: "calc(100vh - 220px)" },
  leftPanel: { padding: "0 24px 24px", borderRight: "1px solid rgba(255,255,255,0.04)" },
  rightPanel: { padding: "20px", overflowY: "auto" },
  sourceTabs: { display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto" },
  sourceTab: { display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  srcName: { fontSize: "11px" },
  srcCount: { fontSize: "10px", fontWeight: "700" },
  logViewer: { background: "rgba(0,0,0,0.3)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" },
  logToolbar: { display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  logToolTitle: { fontSize: "9px", fontWeight: "700", color: "#555", letterSpacing: "2px" },
  logHint: { fontSize: "10px", color: "#444" },
  logScroll: { maxHeight: "300px", overflowY: "auto" },
  logLine: { display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 16px", borderLeft: "3px solid #333", cursor: "pointer", transition: "background 0.15s", fontSize: "11px", lineHeight: "1.5", borderBottom: "1px solid rgba(255,255,255,0.02)" },
  logTime: { color: "#555", flexShrink: 0, fontSize: "10px" },
  logLevel: { flexShrink: 0, fontSize: "10px", fontWeight: "700" },
  logMsg: { color: "#bbb", flex: 1, wordBreak: "break-all" },
  evidenceTag: { fontSize: "9px", color: "#ef4444", flexShrink: 0, fontWeight: "700" },
  evidenceBox: { marginTop: "16px", padding: "16px", background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: "10px" },
  evidenceTitle: { fontSize: "10px", fontWeight: "700", color: "#ef4444", letterSpacing: "1.5px", margin: "0 0 10px 0" },
  evidenceEmpty: { fontSize: "11px", color: "#555", margin: 0, fontFamily: "'Inter', sans-serif" },
  evidenceList: { display: "flex", flexDirection: "column", gap: "6px" },
  evidenceItem: { display: "flex", gap: "8px", alignItems: "center" },
  evidenceSrc: { fontSize: "9px", fontWeight: "700", color: "#888", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: "3px" },
  evidenceMsg: { fontSize: "10px", color: "#999" },
  rightTitle: { fontSize: "10px", fontWeight: "700", color: "#555", letterSpacing: "2.5px", marginBottom: "16px", margin: "0 0 16px 0" },
  huntQuestion: { marginBottom: "8px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" },
  hqHeader: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", cursor: "pointer", background: "rgba(255,255,255,0.01)" },
  hqNum: { fontSize: "11px", fontWeight: "700", color: "#22c55e" },
  hqText: { fontSize: "11px", color: "#999", flex: 1, fontFamily: "'Inter', sans-serif" },
  hqArrow: { fontSize: "10px", color: "#555" },
  hqBody: { padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" },
  hqFullText: { fontSize: "12px", color: "#ccc", lineHeight: "1.6", margin: "0 0 12px 0", fontFamily: "'Inter', sans-serif" },
  hqInput: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", color: "#d0d0d8", fontSize: "12px", fontFamily: "'Inter', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", marginTop: "16px" },
};
