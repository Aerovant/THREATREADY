// ═══════════════════════════════════════════════════════════════
// INTERVIEW SESSION — Voice + Typing Animation + Scenario Popup
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { showToast } from "../components/helpers.js";

const API_BASE = "https://threatready-db.onrender.com";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const readFileAsText = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsText(file);
});

// Real-world attack scenarios (rotated through during session)
const REAL_WORLD_SCENARIOS = [
  {
    title: "Volt Typhoon — OT Network Living-off-the-Land",
    sector: "Energy / Critical Infrastructure",
    timeframe: "Active threat 2024-2026",
    text: "A North American oil & gas company's OT network was breached via a Volt Typhoon-style living-off-the-land attack. Attackers used legitimate Windows tools (wmic, PowerShell) to move laterally from IT into ICS/SCADA systems over 8 months. Detection was missed because no malware signatures triggered.",
    question: "If you owned the SOC, what 3 detection strategies would you prioritize tomorrow morning to catch this kind of attack at your own org?",
  },
  {
    title: "MOVEit Transfer SQL Injection",
    sector: "File Transfer / Supply Chain",
    timeframe: "CVE-2023-34362",
    text: "Cl0p ransomware group exploited a SQL injection in MOVEit Transfer, hitting 2,600+ organizations and exposing 90M+ records. Attack vector was a single unauthenticated SQL injection allowing arbitrary file access on the server.",
    question: "You're the CISO of a mid-size company that uses MOVEit. You learn about this CVE 30 minutes before it goes public. What are your first 5 actions in priority order?",
  },
  {
    title: "Snowflake Customer Compromise",
    sector: "Cloud Data Warehouse",
    timeframe: "Mid-2024",
    text: "165+ Snowflake customers (AT&T, Ticketmaster, Santander) were breached via stolen credentials of users who had MFA disabled. Attackers used UNC5537 toolset to enumerate and exfiltrate data. Snowflake itself wasn't breached — the customers' credential hygiene was.",
    question: "Your CTO says 'we're a Snowflake customer, are we exposed?' You have 10 minutes to give an honest answer. How do you investigate, and what's your reply?",
  },
  {
    title: "XZ Utils Backdoor (CVE-2024-3094)",
    sector: "Open Source Supply Chain",
    timeframe: "March 2024",
    text: "A multi-year social engineering attack placed a backdoor in xz-utils, a compression library used in nearly every Linux distro. The backdoor bypassed sshd authentication. Discovery happened 2 weeks before the backdoored version reached stable releases.",
    question: "Your security team needs a strategy for catching the next xz-utils-style supply chain attack. What concrete controls would you implement, and what would you tell leadership about residual risk?",
  },
  {
    title: "LockBit 3.0 Ransomware",
    sector: "Multi-industry",
    timeframe: "Disrupted Feb 2024 by law enforcement",
    text: "LockBit hit 2,000+ organizations globally before takedown. Notable: their affiliate model meant inconsistent TTPs, but common entry was VPN brute-force, exposed RDP, and unpatched edge devices (Citrix, Fortinet, ESXi).",
    question: "Walk through how you'd build a 90-day program to harden your edge attack surface against LockBit-style affiliates, given a budget of one engineer's time and zero new tools.",
  },
];

export default function InterviewSession({
  jdFile,
  resumeFile,
  durationMinutes,
  level = "intermediate",
  onEnd,
}) {
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [showScenarioPopup, setShowScenarioPopup] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [shownScenarios, setShownScenarios] = useState([]);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const baseTextBeforeRecord = useRef("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Init speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      // Append to whatever was there before recording started
      const newText = baseTextBeforeRecord.current + final + interim;
      setCurrentAnswer(newText);
    };

    recognition.onend = () => {
      // Save the final state into baseText so resume continues from here
      setCurrentAnswer((current) => {
        baseTextBeforeRecord.current = current;
        return current;
      });
      setIsRecording(false);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      if (e.error !== "no-speech" && e.error !== "aborted") {
        showToast("Voice error: " + e.error, "error");
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (_) { /* ignore */ }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast("Voice dictation not supported in this browser. Try Chrome.", "warning");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Save current text as base — new dictation appends to it
      baseTextBeforeRecord.current = currentAnswer;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Start recognition error:", e);
        showToast("Could not start voice. Try again.", "error");
      }
    }
  };

  // Timer countdown
  useEffect(() => {
    if (sessionEnded) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndSession("Time's up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded]);

  // Trigger scenario popup periodically (every 4-5 questions, max 3 times per session)
  useEffect(() => {
    const userAnswerCount = messages.filter((m) => m.role === "user").length;
    if (
      userAnswerCount > 0 &&
      userAnswerCount % 4 === 0 &&
      shownScenarios.length < 3 &&
      !showScenarioPopup
    ) {
      const remaining = REAL_WORLD_SCENARIOS.filter((s) => !shownScenarios.includes(s.title));
      if (remaining.length > 0) {
        const next = remaining[Math.floor(Math.random() * remaining.length)];
        setActiveScenario(next);
        setShowScenarioPopup(true);
        setShownScenarios([...shownScenarios, next.title]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Start session on mount
  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate AI message typing
  const animateTyping = (fullText) => {
    setTypingText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTypingText(fullText.slice(0, i + 1));
        i += 2; // 2 chars at a time for speed
      } else {
        clearInterval(interval);
        setTypingText("");
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      }
    }, 18);
  };

  const callAI = async (msgs, isFirst = false) => {
    const token = localStorage.getItem("token");
    const body = isFirst
      ? {
          messages: msgs,
          jdText: jdFile ? await readFileAsText(jdFile) : "",
          resumeText: resumeFile ? await readFileAsText(resumeFile) : "",
          durationMinutes,
          level,
        }
      : { messages: msgs, timeRemaining, level };

    const res = await fetch(`${API_BASE}/api/interview/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend error (${res.status}): ${errText.substring(0, 200)}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.reply;
  };

  const startSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reply = await callAI(
        [{ role: "user", content: "Begin the interview now. Ask your first question." }],
        true
      );
      setIsLoading(false);
      animateTyping(reply);
    } catch (e) {
      console.error("Start session error:", e);
      setError(e.message);
      setIsLoading(false);
      showToast("Could not start: " + e.message, "error");
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || isLoading || sessionEnded) return;
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
    }

    const userMessage = { role: "user", content: currentAnswer.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentAnswer("");
    baseTextBeforeRecord.current = "";
    setIsLoading(true);
    setError(null);

    try {
      const reply = await callAI(newMessages);
      setIsLoading(false);
      animateTyping(reply);
    } catch (e) {
      console.error("Submit error:", e);
      setError(e.message);
      setIsLoading(false);
      showToast("Error: " + e.message, "error");
    }
  };

  const handleEndSession = (reason = "Session ended") => {
    setSessionEnded(true);
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
    }
    showToast(reason, "info");
  };

  const handleExit = () => {
    if (!sessionEnded && !confirm("Exit session? Progress will be lost.")) return;
    onEnd?.(messages);
  };

  const attemptScenario = () => {
    setCurrentAnswer(`[Real-world scenario: ${activeScenario.title}]\n\n${activeScenario.question}\n\nMy approach: `);
    setShowScenarioPopup(false);
    setActiveScenario(null);
    textareaRef.current?.focus();
  };

  const skipScenario = () => {
    setShowScenarioPopup(false);
    setActiveScenario(null);
  };

  // ── End screen ──
  if (sessionEnded) {
    const userAnswers = messages.filter((m) => m.role === "user").length;
    return (
      <div className="fadeUp" style={{ maxWidth: 700, margin: "20px auto", padding: 20 }}>
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Session Complete</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20 }}>
            You answered <strong style={{ color: "var(--ac)" }}>{userAnswers}</strong> question
            {userAnswers === 1 ? "" : "s"}.
          </p>
          <button className="btn bp" style={{ padding: "12px 32px", fontSize: 14 }} onClick={handleExit}>
            Back to Interview Tab →
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ──
  return (
    <div className="fadeUp">
      {/* Header */}
      <div className="card" style={{
        padding: 14, marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div className="lbl" style={{ marginBottom: 2 }}>LIVE INTERVIEW SESSION</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>
            {messages.filter((m) => m.role === "user").length} questions answered · {level} level
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            padding: "8px 14px",
            background: timeRemaining < 300 ? "rgba(239,68,68,0.1)" : "rgba(0,229,255,0.06)",
            border: `1px solid ${timeRemaining < 300 ? "#ef4444" : "var(--ac)"}`,
            borderRadius: 8,
            fontSize: 18, fontWeight: 800, fontFamily: "monospace",
            color: timeRemaining < 300 ? "#ef4444" : "var(--ac)",
            minWidth: 90, textAlign: "center",
          }}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
          <button className="btn bs" style={{ fontSize: 12, padding: "6px 12px" }} onClick={handleExit}>
            End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="card" style={{
        padding: 16, marginBottom: 12, minHeight: 400, maxHeight: "60vh", overflowY: "auto",
      }}>
        {messages.length === 0 && isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--tx2)" }}>
            <div className="loader" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Preparing your interview…</div>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: 12, color: "#ef4444",
            fontSize: 12, marginBottom: 12,
          }}>
            ⚠️ {error}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 16, display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, minWidth: 36, borderRadius: "50%",
              background: msg.role === "user" ? "rgba(34,197,94,0.15)" : "rgba(0,229,255,0.15)",
              border: `1px solid ${msg.role === "user" ? "#22c55e" : "var(--ac)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div style={{
              flex: 1,
              padding: "10px 14px",
              background: msg.role === "user" ? "rgba(34,197,94,0.05)" : "rgba(0,229,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "rgba(34,197,94,0.2)" : "rgba(0,229,255,0.15)"}`,
              borderRadius: 10, fontSize: 13, lineHeight: 1.6,
              whiteSpace: "pre-wrap", color: "var(--tx1)", maxWidth: "85%",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: msg.role === "user" ? "#22c55e" : "var(--ac)",
                marginBottom: 4, letterSpacing: 0.5,
              }}>
                {msg.role === "user" ? "YOU" : "INTERVIEWER"}
              </div>
              {msg.content}
            </div>
          </div>
        ))}

        {/* AI typing animation */}
        {typingText && (
          <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
            <div style={{
              width: 36, height: 36, minWidth: 36, borderRadius: "50%",
              background: "rgba(0,229,255,0.15)", border: "1px solid var(--ac)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🤖</div>
            <div style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(0,229,255,0.04)",
              border: "1px solid rgba(0,229,255,0.15)",
              borderRadius: 10, fontSize: 13, lineHeight: 1.6,
              whiteSpace: "pre-wrap", color: "var(--tx1)", maxWidth: "85%",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "var(--ac)",
                marginBottom: 4, letterSpacing: 0.5,
              }}>
                INTERVIEWER · TYPING…
              </div>
              {typingText}
              <span style={{
                display: "inline-block", width: 6, height: 14,
                background: "var(--ac)", verticalAlign: "-2px", marginLeft: 2,
                animation: "blink 1s infinite",
              }} />
            </div>
          </div>
        )}

        {isLoading && messages.length > 0 && !typingText && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--tx2)", fontSize: 12 }}>
            <div className="loader" style={{ width: 16, height: 16 }} />
            Interviewer is thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area with voice */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <textarea
            ref={textareaRef}
            className="input"
            value={currentAnswer}
            onChange={(e) => {
              setCurrentAnswer(e.target.value);
              if (!isRecording) baseTextBeforeRecord.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitAnswer();
            }}
            placeholder="Type your answer… (Ctrl+Enter to submit) · or click 🎤 to dictate"
            disabled={isLoading || sessionEnded}
            style={{
              width: "100%", minHeight: 100, fontSize: 13,
              resize: "vertical", paddingRight: 56,
            }}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || sessionEnded}
              title={isRecording ? "Stop dictation" : "Start dictation"}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 40, height: 40, borderRadius: "50%",
                background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isRecording ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                color: isRecording ? "#ef4444" : "var(--tx1)",
                cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: isRecording ? "pulse-red 1.2s infinite" : "none",
              }}
            >
              🎤
            </button>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: isRecording ? "#ef4444" : "var(--tx2)" }}>
            {isRecording ? (
              <>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444", marginRight: 6,
                  animation: "pulse-red 1.2s infinite",
                }} />
                <strong>Recording…</strong> · click 🎤 to pause · text editable manually
              </>
            ) : (
              <>{currentAnswer.length} chars · Ctrl+Enter to submit{voiceSupported ? " · 🎤 for voice" : ""}</>
            )}
          </div>
          <button
            className="btn bp"
            disabled={!currentAnswer.trim() || isLoading || sessionEnded}
            onClick={submitAnswer}
            style={{
              padding: "10px 24px", fontSize: 13, fontWeight: 700,
              opacity: !currentAnswer.trim() || isLoading || sessionEnded ? 0.5 : 1,
              cursor: !currentAnswer.trim() || isLoading || sessionEnded ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Sending…" : "Submit Answer →"}
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>

      {/* ═══ Real-world scenario popup ═══ */}
      {showScenarioPopup && activeScenario && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={skipScenario}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f1420", border: "1px solid #f59e0b",
              borderRadius: 12, maxWidth: 580, width: "100%",
              padding: 24, maxHeight: "92vh", overflowY: "auto",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{
                background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                padding: "3px 10px", borderRadius: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
              }}>
                REAL-WORLD ATTACK · ASSESSMENT
              </span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
              {activeScenario.title}
            </h3>
            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 14 }}>
              {activeScenario.sector} · {activeScenario.timeframe}
            </div>

            <div style={{
              padding: "10px 12px", background: "rgba(245,158,11,0.06)",
              borderLeft: "3px solid #f59e0b",
              fontSize: 12, color: "var(--tx1)", lineHeight: 1.6, marginBottom: 14,
            }}>
              <strong style={{ color: "#f59e0b" }}>Disclaimer:</strong> Real-world incident from
              recent threat reports. <strong>For assessment only.</strong> Your interview is still
              ongoing — attempt this scenario or skip and continue.
            </div>

            <div style={{
              padding: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8, marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: "var(--tx1)", lineHeight: 1.6, marginBottom: 12 }}>
                {activeScenario.text}
              </div>
              <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6, fontWeight: 600 }}>
                Q: {activeScenario.question}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={attemptScenario}
                style={{
                  flex: 1, padding: 11,
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid #f59e0b", borderRadius: 6,
                  color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                → Attempt this scenario
              </button>
              <button
                onClick={skipScenario}
                style={{
                  flex: 1, padding: 11,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
                  color: "var(--tx2)", fontSize: 12, cursor: "pointer",
                }}
              >
                Skip · continue
              </button>
            </div>

            <div style={{
              marginTop: 10, fontSize: 10, color: "var(--tx2)",
              textAlign: "center", fontStyle: "italic",
            }}>
              Skipping does not affect your score. The timer keeps running.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
