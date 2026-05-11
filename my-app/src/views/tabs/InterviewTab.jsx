// ═══════════════════════════════════════════════════════════════
// INTERVIEW TAB — v5: Levels + Detailed Popups + Preset Timing
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { showToast } from "../../components/helpers.js";
import InterviewSession from "../InterviewSession.jsx";
import ArchitectDefend from "./modules/ArchitectDefend.jsx";
import IncidentSim from "./modules/IncidentSim.jsx";
import ThreatBrief from "./modules/ThreatBrief.jsx";
import ThreatHunt from "./modules/ThreatHunt.jsx";
import VulnVerdict from "./modules/VulnVerdict.jsx";

const API_BASE = "https://threatready-db.onrender.com";

// Timing presets
const MINUTE_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

// Difficulty levels
const LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    icon: "🌱",
    color: "#22c55e",
    desc: "Foundational concepts, basic scenarios",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    icon: "⚡",
    color: "#3b82f6",
    desc: "Multi-step problems, real-world tradeoffs",
  },
  {
    id: "expert",
    name: "Expert",
    icon: "🔥",
    color: "#ef4444",
    desc: "Advanced architecture, edge cases, depth",
  },
  {
    id: "collaborate",
    name: "Collaborate",
    icon: "🤝",
    color: "#a855f7",
    desc: "Mixed difficulty across all 6 modules",
  },
];

// 5 modules — each renders its full UI inside the popup
const MODULE_INFO = [
  {
    id: "architectdefend",
    name: "Architect & Defend",
    icon: "🏛️",
    color: "#3b82f6",
    topic: "Architecture design",
    Component: ArchitectDefend,
  },
  {
    id: "incidentsim",
    name: "Incident Simulator",
    icon: "🚨",
    color: "#ef4444",
    topic: "Incident response",
    Component: IncidentSim,
  },
  {
    id: "threatbrief",
    name: "Threat Brief",
    icon: "📢",
    color: "#a855f7",
    topic: "Crisis communication",
    Component: ThreatBrief,
  },
  {
    id: "threathunt",
    name: "Threat Hunt",
    icon: "🔍",
    color: "#22c55e",
    topic: "Log analysis",
    Component: ThreatHunt,
  },
  {
    id: "vulnverdict",
    name: "Vuln Verdict",
    icon: "⚖️",
    color: "#f59e0b",
    topic: "Vuln prioritization",
    Component: VulnVerdict,
  },
];

export default function InterviewTab({
  subscribedRoles,
  activeRole,
  setActiveRole,
  interviewPersona,
  setInterviewPersona,
  isPaid,
  setDashTab,
  setView,
}) {
  // Session prep state
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [durationValue, setDurationValue] = useState(30); // default 30 min
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // UI state
  const [popupModule, setPopupModule] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  // Handler for dropdown change — switches to custom input when "custom" selected
  const handleDurationChange = (e) => {
    const v = e.target.value;
    if (v === "custom") {
      setIsCustomDuration(true);
      setCustomDuration(String(durationValue));
    } else {
      setIsCustomDuration(false);
      setDurationValue(parseInt(v, 10));
    }
  };

  // Resolve the actual minutes value used everywhere
  const effectiveMinutes = () => {
    if (isCustomDuration) {
      const n = parseInt(customDuration, 10);
      return isNaN(n) ? 30 : n;
    }
    return durationValue;
  };

  const handleFileUpload = (e, setter, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${label} too large (max 5MB)`, "error");
      return;
    }
    setter(file);
    setAnalysisResult(null);
    showToast(`${label} uploaded`, "success");
  };

  const handleAnalyze = async () => {
    if (!jdFile && !resumeFile) {
      showToast("Upload at least JD or resume to analyze", "warning");
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const readText = (f) => new Promise((res, rej) => {
        if (!f) return res("");
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = rej;
        r.readAsText(f);
      });

      const jdText = await readText(jdFile);
      const resumeText = await readText(resumeFile);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/interview/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jdText, resumeText }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Backend error (${res.status}): ${err.substring(0, 200)}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data.analysis || "Analysis complete");
      showToast("Analysis complete!", "success");
    } catch (e) {
      console.error("Analyze error:", e);
      showToast("Analysis failed: " + e.message, "error");
      setAnalysisResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartSession = () => {
    const minutes = effectiveMinutes();
    if (!minutes || minutes < 5) {
      showToast("Please select a valid duration (minimum 5 minutes)", "error");
      return;
    }
    // Unlock the browser's speech engine RIGHT NOW, inside the user-gesture
    // (click) context. Chrome silently refuses speechSynthesis.speak() if
    // the user gesture is stale. We speak a LONG silent utterance at slow
    // rate so the engine keeps running through the 5–15s backend wait —
    // when the real welcome arrives, speakText() calls cancel() to stop the
    // primer and play the welcome. Without this continuous "keep-alive",
    // Chrome considers the engine idle by the time we want to speak.
    if ("speechSynthesis" in window) {
      try {
        const primer = new SpeechSynthesisUtterance(
          "preparing your interview session please wait one moment"
        );
        primer.volume = 0;
        primer.rate = 0.5;
        window.speechSynthesis.speak(primer);
      } catch (_) { /* ignore */ }
    }
    setSessionActive(true);
  };

  // ── If session is active, show the chat UI ──
  if (sessionActive) {
    const totalMinutes = effectiveMinutes();
    return (
      <InterviewSession
        jdFile={jdFile}
        resumeFile={resumeFile}
        durationMinutes={totalMinutes}
        level={level}
        onEnd={(action) => {
          setSessionActive(false);
          // Allow App-level navigation when user clicks "Go to Home" in the report.
          // App.jsx can listen for this event and switch to the Home tab.
          if (action === "home") {
            try {
              window.dispatchEvent(new CustomEvent("threatready:navigate", { detail: { to: "home" } }));
            } catch (_) { /* ignore */ }
          }
        }}
      />
    );
  }

  return (
    <div className="fadeUp">
      <div className="card" style={{ padding: 36, marginBottom: 16 }}>
        <div className="lbl" style={{ marginBottom: 4 }}>INTERVIEW PREP SESSION</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          Personalized AI Interview Practice
        </h3>
        <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.6 }}>
          Upload your JD or resume for tailored questions — or skip and start with default content.
        </p>

        {/* Upload row with OR divider */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 12,
          alignItems: "stretch",
          marginBottom: 32,
        }}>
          {/* JD Upload */}
          <div className="card card-glow" style={{ padding: 14, borderTop: "3px solid #06b6d4" }}>
            <div className="lbl" style={{ marginBottom: 6 }}>📄 Job Description</div>
            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 10 }}>
              Optional · PDF, DOC, or TXT (max 5MB)
            </div>
            <label style={{
              display: "block", padding: 14, textAlign: "center",
              background: jdFile ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.02)",
              border: jdFile ? "1px dashed #06b6d4" : "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 8, cursor: "pointer", fontSize: 12,
            }}>
              {jdFile ? (
                <>
                  <div style={{ color: "var(--ok)", fontWeight: 700, marginBottom: 3 }}>
                    ✓ {jdFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                    {(jdFile.size / 1024).toFixed(1)} KB · Click to replace
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>📤 Click to upload JD</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>Drop the role description</div>
                </>
              )}
              <input type="file" accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e, setJdFile, "Job description")}
                style={{ display: "none" }} />
            </label>
          </div>

          {/* OR divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--s2)",
              border: "1px solid var(--bd)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "var(--tx2)",
              letterSpacing: 0.5,
            }}>
              OR
            </div>
          </div>

          {/* Resume Upload */}
          <div className="card card-glow" style={{ padding: 14, borderTop: "3px solid #22c55e" }}>
            <div className="lbl" style={{ marginBottom: 6 }}>📋 Your Resume</div>
            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 10 }}>
              Optional · PDF, DOC, or TXT (max 5MB)
            </div>
            <label style={{
              display: "block", padding: 14, textAlign: "center",
              background: resumeFile ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
              border: resumeFile ? "1px dashed #22c55e" : "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 8, cursor: "pointer", fontSize: 12,
            }}>
              {resumeFile ? (
                <>
                  <div style={{ color: "var(--ok)", fontWeight: 700, marginBottom: 3 }}>
                    ✓ {resumeFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                    {(resumeFile.size / 1024).toFixed(1)} KB · Click to replace
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>📤 Click to upload resume</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>Your CV or experience</div>
                </>
              )}
              <input type="file" accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e, setResumeFile, "Resume")}
                style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {/* Analyze Button */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <button
            className="btn bs"
            onClick={handleAnalyze}
            disabled={analyzing || (!jdFile && !resumeFile)}
            style={{
              padding: "8px 22px",
              fontSize: 12,
              fontWeight: 700,
              opacity: analyzing || (!jdFile && !resumeFile) ? 0.5 : 1,
              cursor: analyzing || (!jdFile && !resumeFile) ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "🤖 Analyzing…" : "🤖 Analyze with AI"}
          </button>
        </div>

        {/* Analysis result */}
        {analysisResult && (
          <div style={{
            padding: 12, marginBottom: 32,
            background: "rgba(0,229,255,0.04)",
            border: "1px solid rgba(0,229,255,0.2)",
            borderRadius: 8,
            fontSize: 12, color: "var(--tx1)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}>
            <div className="lbl" style={{ marginBottom: 6 }}>🤖 AI ANALYSIS</div>
            {analysisResult}
          </div>
        )}

        {/* ─── Session Duration (minutes only, preset or custom) ─── */}
        <div
          className="card"
          style={{
            padding: 22,
            marginBottom: 32,
            background: "var(--s2)",
            borderTop: "3px solid #a855f7",
          }}
        >
          <div className="lbl" style={{ marginBottom: 12 }}>⏱️ Session Duration</div>

          {/* Preset dropdown — last option opens custom number input */}
          <select
            value={isCustomDuration ? "custom" : String(durationValue)}
            onChange={handleDurationChange}
            className="input"
            style={{ width: "100%", fontSize: 14, padding: "12px 14px" }}
          >
            {MINUTE_PRESETS.map((v) => (
              <option key={v} value={v}>
                {v} minutes
              </option>
            ))}
            <option value="custom">Custom…</option>
          </select>

          {/* Custom number input — appears only when "Custom…" is selected */}
          {isCustomDuration && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Enter minutes (5–240)"
                className="input"
                style={{ flex: 1, fontSize: 14, padding: "12px 14px" }}
                autoFocus
              />
              <span style={{ fontSize: 12, color: "var(--tx2)", whiteSpace: "nowrap" }}>minutes</span>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 12 }}>
            Total: <strong style={{ color: "var(--tx1)" }}>{effectiveMinutes()} minutes</strong>
            {isCustomDuration && effectiveMinutes() < 5 && (
              <span style={{ color: "#f59e0b", marginLeft: 8 }}>
                · minimum 5 minutes required
              </span>
            )}
          </div>
        </div>

        {/* ─── Difficulty Level Selector ─── */}
        <div style={{ marginBottom: 32 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>🎯 Difficulty Level</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}>
            {LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                onClick={() => setLevel(lvl.id)}
                className="card card-glow"
                style={{
                  padding: 12,
                  cursor: "pointer",
                  textAlign: "center",
                  borderColor: level === lvl.id ? lvl.color : "var(--bd)",
                  background: level === lvl.id ? `${lvl.color}15` : "var(--s2)",
                  transition: "all .2s",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{lvl.icon}</div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: level === lvl.id ? lvl.color : "var(--tx1)",
                  marginBottom: 3,
                }}>
                  {lvl.name}
                </div>
                <div style={{ fontSize: 10, color: "var(--tx2)", lineHeight: 1.4 }}>
                  {lvl.desc}
                </div>
                {level === lvl.id && (
                  <div style={{
                    fontSize: 10, color: lvl.color, marginTop: 5, fontWeight: 700,
                  }}>
                    ✓ SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modules — clickable for detailed info */}
        <div style={{ marginBottom: 32 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>📚 This Session Covers (click any for details)</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 8,
          }}>
            {MODULE_INFO.map((m) => (
              <div
                key={m.id}
                onClick={() => setPopupModule(m)}
                style={{
                  padding: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${m.color}33`,
                  borderLeft: `3px solid ${m.color}`,
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${m.color}11`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 16, marginRight: 6 }}>{m.icon}</span>
                  <span style={{ fontWeight: 700, color: m.color }}>{m.name}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--tx2)", paddingLeft: 22 }}>{m.topic}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="btn bp"
          onClick={handleStartSession}
          style={{
            width: "100%",
            padding: 16,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          🚀 Start Interview Session
        </button>

        {/* Disclaimer */}
        <div style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 8,
          fontSize: 11,
          color: "var(--tx2)",
          lineHeight: 1.5,
        }}>
          <strong style={{ color: "#f59e0b" }}>ℹ️ Note:</strong> The AI may present scenarios based
          on real-world security incidents for assessment. Educational use only.
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* MODULE FULL-UI POPUP — renders the actual module     */}
      {/* ════════════════════════════════════════════════════ */}
      {popupModule && (() => {
        const ModuleComponent = popupModule.Component;
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 12,
            }}
            onClick={() => setPopupModule(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0a0e1a",
                border: `1px solid ${popupModule.color}`,
                borderRadius: 12,
                width: "96vw",
                height: "94vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 30px ${popupModule.color}33`,
              }}
            >
              {/* Header */}
              <div style={{
                padding: "12px 18px",
                borderBottom: `1px solid ${popupModule.color}33`,
                background: `${popupModule.color}10`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}>
                <div>
                  <div className="lbl" style={{ marginBottom: 0 }}>
                    <span style={{ color: popupModule.color, fontWeight: 800, letterSpacing: 1 }}>
                      {popupModule.icon} {popupModule.name.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--tx2)", marginLeft: 8, fontWeight: 400 }}>
                      · {popupModule.topic}
                    </span>
                  </div>
                </div>
                <button
                  className="btn bs"
                  onClick={() => setPopupModule(null)}
                  style={{ fontSize: 14, padding: "4px 12px", flexShrink: 0 }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Module body — renders the actual interactive module */}
              <div style={{
                flex: 1,
                overflow: "auto",
                padding: 0,
              }}>
                <ModuleComponent />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
