import { useState } from "react";

const SCENARIO_CONTEXT = {
  incident: "Ransomware Attack — Manufacturing Company",
  details: "LockBit 3.0 ransomware encrypted 340 production servers across 3 factories. Backup systems partially compromised. Ransom demand: $2.5M in Bitcoin. Production halted for 18 hours. No confirmed data exfiltration yet. CERT-In notified. Insurance carrier engaged.",
  audience: null,
  timeLimit: 300,
};

const AUDIENCES = [
  { id: "board", label: "Board of Directors", icon: "🏛️", desc: "Non-technical. Want business impact, risk, and decision points.", color: "#a855f7" },
  { id: "ceo", label: "CEO & C-Suite", icon: "👔", desc: "Semi-technical. Want status, timeline, financial exposure.", color: "#3b82f6" },
  { id: "media", label: "Press / Media", icon: "📰", desc: "Public-facing. Must be careful, factual, non-speculative.", color: "#f59e0b" },
  { id: "customers", label: "Affected Customers", icon: "👥", desc: "Want reassurance, transparency, and clear next steps.", color: "#22c55e" },
  { id: "regulator", label: "Regulatory Body", icon: "⚖️", desc: "Formal. Need timeline, scope, containment status, compliance.", color: "#ef4444" },
  { id: "internal", label: "All Employees", icon: "🏢", desc: "Need calm, clear guidance. Avoid panic, give action items.", color: "#06b6d4" },
];

const SCORING_DIMS = [
  { dim: "Clarity", desc: "Can the audience understand this without security expertise?", icon: "💎" },
  { dim: "Accuracy", desc: "Are technical facts correct without oversimplification?", icon: "🎯" },
  { dim: "Tone", desc: "Is the tone appropriate for this specific audience?", icon: "🎨" },
  { dim: "Actionability", desc: "Does it tell the audience what happens next?", icon: "⚡" },
  { dim: "Brevity", desc: "Is it concise enough for a crisis situation?", icon: "✂️" },
  { dim: "Risk Framing", desc: "Is risk communicated responsibly without causing panic?", icon: "🛡️" },
];

export default function ThreatBrief() {
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [briefText, setBriefText] = useState("");
  const [timeLeft, setTimeLeft] = useState(SCENARIO_CONTEXT.timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useState(() => {
    if (isRunning && timeLeft > 0) {
      const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(t);
    }
  }, [isRunning, timeLeft]);

  const handleTextChange = (e) => {
    setBriefText(e.target.value);
    setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
  };

  const startBrief = (audience) => {
    setSelectedAudience(audience);
    setIsRunning(true);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (showScoring) {
    const scores = SCORING_DIMS.map(d => ({ ...d, score: (5 + Math.random() * 4.5).toFixed(1) }));
    const avg = (scores.reduce((s, d) => s + parseFloat(d.score), 0) / scores.length).toFixed(1);
    return (
      <div style={styles.container}>
        <div style={styles.scoreCard}>
          <div style={styles.scoreHeader}>
            <span style={styles.scoreLogo}>📝 THREATBRIEF</span>
            <h2 style={styles.scoreMainTitle}>Communication Assessment Results</h2>
            <p style={styles.scoreContext}>Audience: <strong style={{ color: selectedAudience.color }}>{selectedAudience.label}</strong> — {wordCount} words</p>
          </div>

          <div style={styles.avgCircleWrap}>
            <div style={styles.avgCircle}>
              <span style={styles.avgNum}>{avg}</span>
              <span style={styles.avgMax}>/10</span>
            </div>
            <p style={styles.avgLabel}>Overall Communication Score</p>
          </div>

          <div style={styles.dimScoreGrid}>
            {scores.map((s, i) => (
              <div key={i} style={styles.dimScoreCard}>
                <div style={styles.dimScoreTop}>
                  <span style={styles.dimIcon}>{s.icon}</span>
                  <span style={styles.dimScoreNum}>{s.score}</span>
                </div>
                <span style={styles.dimName}>{s.dim}</span>
                <span style={styles.dimDesc}>{s.desc}</span>
              </div>
            ))}
          </div>

          <div style={styles.briefPreview}>
            <h4 style={styles.previewTitle}>YOUR BRIEF</h4>
            <p style={styles.previewText}>{briefText || "(No content submitted)"}</p>
          </div>

          <div style={styles.aiSuggestion}>
            <h4 style={styles.suggTitle}>AI MODEL BRIEF (for comparison)</h4>
            <p style={styles.suggText}>
              {selectedAudience.id === "board" 
                ? "We experienced a ransomware incident affecting our manufacturing systems. Production was halted for 18 hours but is now being restored from backups. Our cybersecurity insurance has been activated, and external incident response specialists are engaged. No customer data exfiltration has been confirmed. We will provide a full impact assessment within 48 hours with recommendations for the board's consideration."
                : "We are writing to inform you of a cybersecurity incident that affected some of our internal systems. Our customer-facing services were temporarily impacted but are being restored. Based on our investigation so far, there is no evidence that your personal data was accessed or compromised. We are working with leading cybersecurity experts and will provide updates as our investigation progresses."}
            </p>
          </div>

          <button style={styles.retryBtn} onClick={() => { setShowScoring(false); setSelectedAudience(null); setBriefText(""); setWordCount(0); setIsRunning(false); setTimeLeft(300); }}>
            TRY ANOTHER AUDIENCE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>📝 THREATBRIEF</span>
        <span style={styles.subtitle}>Executive Communication Scoring Engine</span>
      </div>

      {/* Incident Context */}
      <div style={styles.contextCard}>
        <div style={styles.contextHeader}>
          <span style={styles.contextBadge}>ACTIVE INCIDENT</span>
          <h2 style={styles.contextTitle}>{SCENARIO_CONTEXT.incident}</h2>
        </div>
        <p style={styles.contextDetails}>{SCENARIO_CONTEXT.details}</p>
        <div style={styles.contextStats}>
          <div style={styles.stat}><span style={styles.statNum}>340</span><span style={styles.statLabel}>Servers Encrypted</span></div>
          <div style={styles.stat}><span style={styles.statNum}>18h</span><span style={styles.statLabel}>Downtime</span></div>
          <div style={styles.stat}><span style={styles.statNum}>$2.5M</span><span style={styles.statLabel}>Ransom Demand</span></div>
          <div style={styles.stat}><span style={styles.statNum}>3</span><span style={styles.statLabel}>Factories Hit</span></div>
        </div>
      </div>

      {!selectedAudience ? (
        <>
          <div style={styles.audienceSection}>
            <h3 style={styles.sectionTitle}>SELECT YOUR AUDIENCE</h3>
            <p style={styles.sectionDesc}>You must write a crisis communication brief. The same incident — but each audience needs a completely different message. Pick who you're writing to.</p>
            <div style={styles.audienceGrid}>
              {AUDIENCES.map(a => (
                <button key={a.id} style={styles.audienceCard} onClick={() => startBrief(a)}>
                  <span style={styles.audienceIcon}>{a.icon}</span>
                  <span style={{ ...styles.audienceLabel, color: a.color }}>{a.label}</span>
                  <span style={styles.audienceDesc}>{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={styles.writeSection}>
          <div style={styles.writeHeader}>
            <div>
              <span style={{ ...styles.writingFor, color: selectedAudience.color }}>WRITING FOR: {selectedAudience.label.toUpperCase()}</span>
              <p style={styles.writeHint}>{selectedAudience.desc}</p>
            </div>
            <div style={styles.timerBox}>
              <span style={styles.timerLabel}>TIME LIMIT</span>
              <span style={{ ...styles.timerValue, color: timeLeft < 60 ? "#ff4444" : "#00ff88" }}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div style={styles.constraints}>
            <span style={styles.constraintItem}>📏 Max 200 words</span>
            <span style={styles.constraintItem}>⏱️ 5 minutes</span>
            <span style={styles.constraintItem}>🎯 Scored on 6 dimensions</span>
          </div>

          {/* Brief input REMOVED — display-only mode */}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#0b0b14", minHeight: "100vh", color: "#d0d0d8", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  header: { padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "14px" },
  logo: { fontSize: "18px", fontWeight: "700", color: "#a855f7", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" },
  subtitle: { fontSize: "12px", color: "#666", letterSpacing: "0.5px" },
  contextCard: { margin: "24px 28px", padding: "24px", background: "linear-gradient(135deg, rgba(168,85,247,0.04), rgba(239,68,68,0.04))", border: "1px solid rgba(168,85,247,0.12)", borderRadius: "14px" },
  contextHeader: { marginBottom: "12px" },
  contextBadge: { fontSize: "9px", fontWeight: "700", padding: "3px 12px", borderRadius: "4px", background: "rgba(239,68,68,0.12)", color: "#ef4444", letterSpacing: "2px" },
  contextTitle: { fontSize: "18px", fontWeight: "700", color: "#fff", margin: "10px 0 0 0" },
  contextDetails: { fontSize: "13px", color: "#999", lineHeight: "1.7", margin: "0 0 16px 0" },
  contextStats: { display: "flex", gap: "24px" },
  stat: { display: "flex", flexDirection: "column" },
  statNum: { fontSize: "22px", fontWeight: "700", color: "#fff", fontFamily: "'JetBrains Mono', monospace" },
  statLabel: { fontSize: "10px", color: "#666", letterSpacing: "0.5px" },
  audienceSection: { padding: "0 28px 28px" },
  sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#555", letterSpacing: "2.5px", marginBottom: "8px" },
  sectionDesc: { fontSize: "13px", color: "#888", marginBottom: "20px", lineHeight: "1.5" },
  audienceGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
  audienceCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "24px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" },
  audienceIcon: { fontSize: "32px" },
  audienceLabel: { fontSize: "13px", fontWeight: "700" },
  audienceDesc: { fontSize: "11px", color: "#777", lineHeight: "1.4" },
  writeSection: { padding: "0 28px 28px" },
  writeHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  writingFor: { fontSize: "11px", fontWeight: "700", letterSpacing: "2px" },
  writeHint: { fontSize: "12px", color: "#888", margin: "4px 0 0 0" },
  timerBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", background: "rgba(0,0,0,0.3)", borderRadius: "10px" },
  timerLabel: { fontSize: "8px", color: "#666", letterSpacing: "1.5px" },
  timerValue: { fontSize: "28px", fontWeight: "700", fontFamily: "'JetBrains Mono', monospace" },
  constraints: { display: "flex", gap: "16px", marginBottom: "16px" },
  constraintItem: { fontSize: "11px", color: "#666", padding: "4px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" },
  briefInput: { width: "100%", minHeight: "250px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px", color: "#e0e0e8", fontSize: "14px", lineHeight: "1.8", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" },
  writeFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" },
  wordCounter: { fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" },
  submitBtn: { padding: "12px 32px", background: "linear-gradient(135deg, #a855f7, #7c3aed)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
  scoreCard: { maxWidth: "750px", margin: "30px auto", padding: "36px" },
  scoreHeader: { marginBottom: "24px" },
  scoreLogo: { fontSize: "14px", fontWeight: "700", color: "#a855f7", fontFamily: "'JetBrains Mono', monospace" },
  scoreMainTitle: { fontSize: "20px", fontWeight: "700", color: "#fff", margin: "10px 0 6px 0" },
  scoreContext: { fontSize: "13px", color: "#888", margin: 0 },
  avgCircleWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" },
  avgCircle: { width: "90px", height: "90px", borderRadius: "50%", border: "3px solid #a855f7", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(168,85,247,0.06)" },
  avgNum: { fontSize: "28px", fontWeight: "700", color: "#a855f7" },
  avgMax: { fontSize: "12px", color: "#666" },
  avgLabel: { fontSize: "11px", color: "#888", marginTop: "8px", letterSpacing: "0.5px" },
  dimScoreGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" },
  dimScoreCard: { padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "4px" },
  dimScoreTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  dimIcon: { fontSize: "18px" },
  dimScoreNum: { fontSize: "18px", fontWeight: "700", color: "#a855f7", fontFamily: "'JetBrains Mono', monospace" },
  dimName: { fontSize: "12px", fontWeight: "600", color: "#ddd" },
  dimDesc: { fontSize: "10px", color: "#777", lineHeight: "1.3" },
  briefPreview: { padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", marginBottom: "16px" },
  previewTitle: { fontSize: "9px", fontWeight: "700", color: "#555", letterSpacing: "2px", margin: "0 0 10px 0" },
  previewText: { fontSize: "13px", color: "#bbb", lineHeight: "1.7", margin: 0 },
  aiSuggestion: { padding: "20px", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: "10px", marginBottom: "20px" },
  suggTitle: { fontSize: "9px", fontWeight: "700", color: "#a855f7", letterSpacing: "2px", margin: "0 0 10px 0" },
  suggText: { fontSize: "13px", color: "#aaa", lineHeight: "1.7", margin: 0, fontStyle: "italic" },
  retryBtn: { width: "100%", padding: "14px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", color: "#a855f7", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
};
