import { useState, useEffect, useRef } from "react";

const STAGES = [
  {
    id: 1,
    title: "ALERT TRIGGERED",
    time: "02:47 AM IST",
    severity: "HIGH",
    alerts: [
      { type: "SIEM", msg: "47 failed SSH attempts from 10.0.3.142 → prod-db-01 in 12 minutes" },
      { type: "CloudTrail", msg: "IAM user 'svc-analytics' downloaded 3 S3 bucket policies at 02:51 AM" },
      { type: "GuardDuty", msg: "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS" },
    ],
    question: "You're the on-call Incident Commander. Based on these alerts, what is your FIRST action?",
    options: [
      { id: "a", text: "Immediately revoke the IAM user credentials and block the source IP", tag: "Contain First", score: 8 },
      { id: "b", text: "Open a war room call and notify the security team before taking action", tag: "Coordinate First", score: 6 },
      { id: "c", text: "Check CloudTrail logs for the full activity timeline of svc-analytics", tag: "Investigate First", score: 7 },
      { id: "d", text: "Shut down the prod-db-01 instance to prevent further access", tag: "Kill Switch", score: 4 },
    ],
    followUp: "Explain your reasoning. Why did you choose this over the other options?",
  },
  {
    id: 2,
    title: "ESCALATION — LATERAL MOVEMENT DETECTED",
    time: "03:14 AM IST",
    severity: "CRITICAL",
    alerts: [
      { type: "VPC Flow", msg: "Unusual outbound traffic: 2.3GB transferred to 185.234.xx.xx (Tor exit node)" },
      { type: "CloudTrail", msg: "AssumeRole calls from svc-analytics to 4 additional IAM roles in us-east-1" },
      { type: "Slack Bot", msg: "CEO just messaged: 'Why is our customer portal down? Board meeting in 6 hours.'" },
    ],
    question: "The attacker has pivoted. Data is actively exfiltrating. CEO is asking questions. What do you prioritize?",
    options: [
      { id: "a", text: "Focus on stopping exfiltration — block outbound to the Tor exit node at VPC level", tag: "Stop Bleeding", score: 9 },
      { id: "b", text: "Brief the CEO first — managing stakeholders prevents panic", tag: "Manage Up", score: 5 },
      { id: "c", text: "Revoke all 4 assumed roles and rotate every credential in the account", tag: "Full Lockdown", score: 7 },
      { id: "d", text: "Start forensic imaging of affected instances before evidence is destroyed", tag: "Preserve Evidence", score: 6 },
    ],
    followUp: "The CEO demands a status update RIGHT NOW. Write a 3-sentence executive brief.",
  },
  {
    id: 3,
    title: "FULL CRISIS — DATA BREACH CONFIRMED",
    time: "04:38 AM IST",
    severity: "CRITICAL",
    alerts: [
      { type: "Forensics", msg: "Confirmed: 340,000 customer records (PII + payment tokens) exfiltrated" },
      { type: "Legal", msg: "GDPR 72-hour notification clock starts NOW. CERT-In requires 6-hour reporting." },
      { type: "Attacker", msg: "Ransom note found: 'Pay 15 BTC or data goes public in 48 hours'" },
    ],
    question: "You now face a confirmed breach with ransom demand. What is your strategic decision?",
    options: [
      { id: "a", text: "Do not pay. Begin CERT-In notification, engage external IR firm, prepare customer notification", tag: "No Ransom + Comply", score: 9 },
      { id: "b", text: "Negotiate with attacker to buy time while forensics determines full scope", tag: "Buy Time", score: 6 },
      { id: "c", text: "Pay the ransom — customer data exposure is worse for the business", tag: "Pay & Contain", score: 3 },
      { id: "d", text: "Focus entirely on technical remediation — legal/compliance can wait until morning", tag: "Tech First", score: 4 },
    ],
    followUp: "Draft the CERT-In incident report summary in 5 sentences.",
  },
];

const TEAM_ROLES = [
  { role: "Incident Commander", icon: "⚔️", status: "YOU", color: "#ff4444" },
  { role: "Forensics Lead", icon: "🔬", status: "Active", color: "#00ddff" },
  { role: "Comms Lead", icon: "📡", status: "Active", color: "#ffaa00" },
  { role: "Infra Lead", icon: "🏗️", status: "Standby", color: "#88ff88" },
];

const METRICS = [
  { label: "Response Time", value: "4m 23s", benchmark: "< 5 min", status: "good" },
  { label: "Containment", value: "Pending", benchmark: "< 15 min", status: "warn" },
  { label: "Evidence", value: "Preserved", benchmark: "Yes", status: "good" },
  { label: "Escalation", value: "On Track", benchmark: "Protocol", status: "good" },
];

export default function IncidentSim() {
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [completedStages, setCompletedStages] = useState([]);
  const [showDebrief, setShowDebrief] = useState(false);
  const [clock, setClock] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    { from: "SOC Analyst", msg: "Anomalous activity detected on prod-db-01. Escalating to you.", time: "02:45 AM" },
    { from: "System", msg: "GuardDuty alert severity: HIGH. Auto-escalation triggered.", time: "02:47 AM" },
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setClock(c => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const formatClock = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const stage = STAGES[currentStage];

  const handleSelect = (opt) => {
    setSelectedOption(opt);
    setShowFollowUp(true);
    setChatMessages(prev => [...prev, {
      from: "You (IC)",
      msg: `Decision: ${opt.text}`,
      time: stage.time,
    }]);
  };

  const handleNext = () => {
    setCompletedStages(prev => [...prev, { stage: currentStage, option: selectedOption, followUp: followUpText }]);
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(currentStage + 1);
      setSelectedOption(null);
      setShowFollowUp(false);
      setFollowUpText("");
      setChatMessages(prev => [...prev, {
        from: "System",
        msg: `Stage ${currentStage + 2} — situation escalating...`,
        time: STAGES[currentStage + 1]?.time || "",
      }]);
    } else {
      setShowDebrief(true);
    }
  };

  const totalScore = completedStages.reduce((sum, s) => sum + (s.option?.score || 0), 0);

  if (showDebrief) {
    return (
      <div style={styles.container}>
        <div style={styles.debriefCard}>
          <div style={styles.debriefHeader}>
            <span style={styles.debriefIcon}>📊</span>
            <h2 style={styles.debriefTitle}>INCIDENT DEBRIEF — POST-MORTEM REPORT</h2>
          </div>
          <div style={styles.scoreCircleWrap}>
            <div style={styles.scoreCircle}>
              <span style={styles.scoreNum}>{totalScore}</span>
              <span style={styles.scoreMax}>/27</span>
            </div>
            <p style={styles.scoreLabel}>Overall IR Score</p>
          </div>
          <div style={styles.dimGrid}>
            {["Decision Speed", "Containment", "Communication", "Evidence Handling", "Regulatory", "Coordination"].map((dim, i) => (
              <div key={i} style={styles.dimItem}>
                <div style={styles.dimBar}>
                  <div style={{ ...styles.dimFill, width: `${50 + Math.random() * 45}%` }} />
                </div>
                <span style={styles.dimLabel}>{dim}</span>
              </div>
            ))}
          </div>
          <div style={styles.timelineSection}>
            <h3 style={styles.timelineTitle}>Decision Timeline</h3>
            {completedStages.map((cs, i) => (
              <div key={i} style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: cs.option?.score >= 7 ? "#00ff88" : cs.option?.score >= 5 ? "#ffaa00" : "#ff4444" }} />
                <div>
                  <p style={styles.timelineStage}>Stage {i + 1}: {STAGES[i].title}</p>
                  <p style={styles.timelineDecision}>{cs.option?.tag} — Score: {cs.option?.score}/9</p>
                </div>
              </div>
            ))}
          </div>
          <button style={styles.restartBtn} onClick={() => { setCurrentStage(0); setSelectedOption(null); setShowFollowUp(false); setFollowUpText(""); setCompletedStages([]); setShowDebrief(false); setClock(0); }}>
            Run Another Simulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.logo}>⚡ INCIDENTSIM</span>
          <span style={styles.badge}>LIVE EXERCISE</span>
        </div>
        <div style={styles.topRight}>
          <div style={styles.clockBox}>
            <span style={styles.clockLabel}>ELAPSED</span>
            <span style={styles.clockValue}>{formatClock(clock)}</span>
          </div>
          <div style={{ ...styles.sevBadge, background: stage.severity === "CRITICAL" ? "#ff2244" : "#ff8800" }}>
            {stage.severity}
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div style={styles.stageBar}>
        {STAGES.map((s, i) => (
          <div key={i} style={{ ...styles.stageStep, opacity: i <= currentStage ? 1 : 0.3 }}>
            <div style={{ ...styles.stageCircle, background: i < currentStage ? "#00ff88" : i === currentStage ? "#ff4444" : "#333", border: i === currentStage ? "2px solid #ff4444" : "2px solid #333" }}>
              {i < currentStage ? "✓" : i + 1}
            </div>
            <span style={styles.stageLabel}>{s.title.split("—")[0].trim()}</span>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        {/* Left Panel — Alerts & Scenario */}
        <div style={styles.leftPanel}>
          <div style={styles.stageHeader}>
            <h2 style={styles.stageTitle}>{stage.title}</h2>
            <span style={styles.stageTime}>{stage.time}</span>
          </div>

          {/* Alert Feed */}
          <div style={styles.alertBox}>
            {stage.alerts.map((alert, i) => (
              <div key={i} style={styles.alertItem}>
                <span style={styles.alertType}>{alert.type}</span>
                <span style={styles.alertMsg}>{alert.msg}</span>
              </div>
            ))}
          </div>

          {/* Decision Area */}
          <div style={styles.questionBox}>
            <p style={styles.questionText}>{stage.question}</p>
            <div style={styles.optionsGrid}>
              {stage.options.map((opt) => (
                <button
                  key={opt.id}
                  style={{ ...styles.optionBtn, borderColor: selectedOption?.id === opt.id ? "#00ff88" : "#2a2a3a", background: selectedOption?.id === opt.id ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.02)" }}
                  onClick={() => !selectedOption && handleSelect(opt)}
                  disabled={!!selectedOption}
                >
                  <span style={styles.optTag}>{opt.tag}</span>
                  <span style={styles.optText}>{opt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up REMOVED — display-only mode */}
        </div>

        {/* Right Panel — Team & Metrics */}
        <div style={styles.rightPanel}>
          {/* Team Status */}
          <div style={styles.teamBox}>
            <h3 style={styles.sideTitle}>TEAM STATUS</h3>
            {TEAM_ROLES.map((t, i) => (
              <div key={i} style={styles.teamMember}>
                <span style={styles.teamIcon}>{t.icon}</span>
                <div style={styles.teamInfo}>
                  <span style={styles.teamRole}>{t.role}</span>
                  <span style={{ ...styles.teamStatus, color: t.color }}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Metrics */}
          <div style={styles.metricsBox}>
            <h3 style={styles.sideTitle}>LIVE METRICS</h3>
            {METRICS.map((m, i) => (
              <div key={i} style={styles.metricRow}>
                <span style={styles.metricLabel}>{m.label}</span>
                <span style={{ ...styles.metricValue, color: m.status === "good" ? "#00ff88" : "#ffaa00" }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Chat Feed */}
          <div style={styles.chatBox}>
            <h3 style={styles.sideTitle}>WAR ROOM FEED</h3>
            <div ref={chatRef} style={styles.chatScroll}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={styles.chatMsg}>
                  <span style={styles.chatFrom}>{msg.from}</span>
                  <span style={styles.chatText}>{msg.msg}</span>
                  <span style={styles.chatTime}>{msg.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0a0a12", minHeight: "100vh", color: "#e0e0e8", fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", padding: "0" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" },
  topLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "18px", fontWeight: "700", color: "#ff4444", letterSpacing: "2px" },
  badge: { fontSize: "10px", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,68,68,0.15)", color: "#ff6666", letterSpacing: "1.5px", animation: "pulse 2s infinite" },
  topRight: { display: "flex", alignItems: "center", gap: "16px" },
  clockBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  clockLabel: { fontSize: "9px", color: "#666", letterSpacing: "1px" },
  clockValue: { fontSize: "20px", fontWeight: "700", color: "#ff4444", fontVariantNumeric: "tabular-nums" },
  sevBadge: { fontSize: "11px", fontWeight: "700", padding: "4px 14px", borderRadius: "4px", color: "#fff", letterSpacing: "1px" },
  stageBar: { display: "flex", justifyContent: "center", gap: "40px", padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  stageStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "opacity 0.3s" },
  stageCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff" },
  stageLabel: { fontSize: "9px", color: "#888", letterSpacing: "0.5px", textAlign: "center", maxWidth: "100px" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "0", minHeight: "calc(100vh - 130px)" },
  leftPanel: { padding: "24px", borderRight: "1px solid rgba(255,255,255,0.04)", overflowY: "auto" },
  rightPanel: { padding: "16px", background: "rgba(0,0,0,0.2)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  stageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  stageTitle: { fontSize: "16px", fontWeight: "700", color: "#ff4444", letterSpacing: "1px", margin: 0 },
  stageTime: { fontSize: "13px", color: "#666" },
  alertBox: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" },
  alertItem: { display: "flex", gap: "12px", padding: "12px 16px", background: "rgba(255,68,68,0.04)", border: "1px solid rgba(255,68,68,0.12)", borderRadius: "8px", alignItems: "flex-start" },
  alertType: { fontSize: "10px", fontWeight: "700", color: "#ff8888", background: "rgba(255,68,68,0.12)", padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap", letterSpacing: "0.5px" },
  alertMsg: { fontSize: "12px", color: "#ccc", lineHeight: "1.5" },
  questionBox: { marginBottom: "20px" },
  questionText: { fontSize: "14px", color: "#fff", lineHeight: "1.6", marginBottom: "16px", fontWeight: "500", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  optionsGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  optionBtn: { display: "flex", flexDirection: "column", gap: "4px", padding: "14px 18px", border: "1px solid #2a2a3a", borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", color: "#ddd", fontSize: "13px", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  optTag: { fontSize: "10px", fontWeight: "700", color: "#00ddff", letterSpacing: "1px", textTransform: "uppercase" },
  optText: { fontSize: "13px", color: "#ccc", lineHeight: "1.4" },
  followUpBox: { marginTop: "20px", padding: "20px", background: "rgba(0,221,255,0.03)", border: "1px solid rgba(0,221,255,0.1)", borderRadius: "10px" },
  followUpLabel: { fontSize: "13px", color: "#00ddff", marginBottom: "12px", fontWeight: "500", fontFamily: "'Inter', sans-serif" },
  followUpInput: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "12px", color: "#e0e0e8", fontSize: "13px", fontFamily: "'Inter', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" },
  nextBtn: { marginTop: "14px", padding: "12px 28px", background: "linear-gradient(135deg, #ff4444, #ff2244)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", width: "100%" },
  sideTitle: { fontSize: "10px", fontWeight: "700", color: "#666", letterSpacing: "2px", marginBottom: "12px", margin: "0 0 12px 0" },
  teamBox: { padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" },
  teamMember: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  teamIcon: { fontSize: "18px" },
  teamInfo: { display: "flex", flexDirection: "column" },
  teamRole: { fontSize: "11px", color: "#bbb" },
  teamStatus: { fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px" },
  metricsBox: { padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" },
  metricRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  metricLabel: { fontSize: "11px", color: "#888" },
  metricValue: { fontSize: "11px", fontWeight: "700" },
  chatBox: { padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", flex: 1 },
  chatScroll: { maxHeight: "200px", overflowY: "auto" },
  chatMsg: { display: "flex", flexDirection: "column", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", gap: "2px" },
  chatFrom: { fontSize: "10px", fontWeight: "700", color: "#00ddff" },
  chatText: { fontSize: "11px", color: "#bbb", lineHeight: "1.4" },
  chatTime: { fontSize: "9px", color: "#555" },
  debriefCard: { maxWidth: "700px", margin: "40px auto", padding: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" },
  debriefHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" },
  debriefIcon: { fontSize: "28px" },
  debriefTitle: { fontSize: "16px", fontWeight: "700", color: "#00ddff", letterSpacing: "1.5px", margin: 0 },
  scoreCircleWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" },
  scoreCircle: { width: "100px", height: "100px", borderRadius: "50%", border: "3px solid #00ff88", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,255,136,0.05)" },
  scoreNum: { fontSize: "32px", fontWeight: "700", color: "#00ff88" },
  scoreMax: { fontSize: "14px", color: "#666" },
  scoreLabel: { fontSize: "12px", color: "#888", marginTop: "8px", letterSpacing: "1px" },
  dimGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "30px" },
  dimItem: { display: "flex", flexDirection: "column", gap: "4px" },
  dimBar: { height: "6px", background: "#1a1a2a", borderRadius: "3px", overflow: "hidden" },
  dimFill: { height: "100%", background: "linear-gradient(90deg, #00ddff, #00ff88)", borderRadius: "3px", transition: "width 1s" },
  dimLabel: { fontSize: "10px", color: "#888" },
  timelineSection: { marginBottom: "24px" },
  timelineTitle: { fontSize: "12px", color: "#888", letterSpacing: "1px", marginBottom: "16px" },
  timelineItem: { display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  timelineDot: { width: "10px", height: "10px", borderRadius: "50%", marginTop: "4px", flexShrink: 0 },
  timelineStage: { fontSize: "12px", color: "#bbb", margin: 0 },
  timelineDecision: { fontSize: "11px", color: "#888", margin: 0 },
  restartBtn: { width: "100%", padding: "14px", background: "rgba(0,221,255,0.1)", border: "1px solid rgba(0,221,255,0.3)", borderRadius: "8px", color: "#00ddff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
};
