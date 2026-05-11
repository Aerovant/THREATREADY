// ═══════════════════════════════════════════════════════════════
// INTERVIEW SESSION — Panel UI + TTS + Voice + Report generation
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { showToast } from "../components/helpers.js";
import InterviewReport from "./InterviewReport.jsx";

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

// ═══════════════════════════════════════════════════════════════
// PANELISTS — 6 interviewers, one per cybersecurity module
// ═══════════════════════════════════════════════════════════════

// Unsplash professional business portraits (best-effort placeholder URLs).
// IF any of these 404 in your browser, the fallback shows colored initials.
// For production: swap these `avatarUrl` values to licensed photos you control,
// or use a service like generated.photos (AI faces with "business attire" filter).
const PANELISTS = [
  {
    id: "maya",
    name: "Maya Chen",
    title: "Security Architect",
    specialty: "Architecture & Defense",
    initials: "MC",
    color: "#14b8a6",
    gender: "female",
    avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: "marcus",
    name: "Marcus Rodriguez",
    title: "IR Lead",
    specialty: "Incident Response",
    initials: "MR",
    color: "#f97316",
    gender: "male",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: "sarah",
    name: "Sarah Okonkwo",
    title: "CISO",
    specialty: "Strategy & Communication",
    initials: "SO",
    color: "#a855f7",
    gender: "female",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: "aiden",
    name: "Aiden Wright",
    title: "Threat Hunter",
    specialty: "Threat Hunting & Detection",
    initials: "AW",
    color: "#3b82f6",
    gender: "male",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: "priya",
    name: "Priya Subramanian",
    title: "AppSec Engineer",
    specialty: "Vulnerability & Code Security",
    initials: "PS",
    color: "#22c55e",
    gender: "female",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: "raj",
    name: "Raj Patel",
    title: "Red Team Lead",
    specialty: "Adversarial Reasoning",
    initials: "RP",
    color: "#06b6d4",
    gender: "male",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
  },
];

// Original simple picker: gender-matched English voice. This is the version
// that was producing audio (British accent) before. Indian preference removed
// per user request — they want audio working first, will revisit accent later.
const pickVoiceForPanelist = (panelist, voices) => {
  if (!voices || voices.length === 0) return null;
  const isFemale = panelist.gender === "female";
  const femaleKeywords = ["female", "zira", "samantha", "victoria", "karen", "moira", "tessa", "fiona", "veena", "kathy", "shelley", "sandy", "vicki", "allison"];
  const maleKeywords = ["male", "david", "alex", "daniel", "fred", "ralph", "tom", "aaron", "bruce", "george"];
  const englishVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;
  const matchedByGender = pool.filter(v => {
    const nameLower = v.name.toLowerCase();
    const keywords = isFemale ? femaleKeywords : maleKeywords;
    return keywords.some(k => nameLower.includes(k));
  });
  if (matchedByGender.length > 0) {
    const idx = PANELISTS.filter(p => p.gender === panelist.gender).indexOf(panelist);
    return matchedByGender[idx % matchedByGender.length];
  }
  const panelistIdx = PANELISTS.indexOf(panelist);
  return pool[panelistIdx % pool.length];
};

// Split an AI response into [feedback, nextQuestion] when the AI used the
// "===" separator we instructed in the prompt. Used so the previous panelist
// delivers the feedback and the NEXT panelist asks the new question.
// Returns { feedback: string|null, question: string }
const splitAIResponse = (text) => {
  if (!text) return { feedback: null, question: "" };
  // Match `===` on its own line (with optional whitespace around it).
  const m = text.match(/\n\s*={3,}\s*\n/);
  if (m && m.index !== undefined) {
    const feedback = text.slice(0, m.index).trim();
    const question = text.slice(m.index + m[0].length).trim();
    if (feedback.length > 0 && question.length > 0) {
      return { feedback, question };
    }
  }
  return { feedback: null, question: text.trim() };
};

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
  // Stage: 'active' | 'completed' | 'loading-report' | 'viewing-report' | 'report-error'
  const [stage, setStage] = useState("active");
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [showScenarioPopup, setShowScenarioPopup] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [shownScenarios, setShownScenarios] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const [activePanelistIdx, setActivePanelistIdx] = useState(0);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const baseTextBeforeRecord = useRef("");

  const textareaRef = useRef(null);
  const historyEndRef = useRef(null);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const sessionEndedAtRef = useRef(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load TTS voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) { setTtsAvailable(false); return; }
    setTtsAvailable(true);
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) voicesRef.current = voices;
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      // NOTE: Do NOT call speechSynthesis.cancel() here. In React Strict Mode
      // (dev default), this cleanup fires between two mounts of the component
      // and would cancel our welcome-primer speech, causing the first question
      // to silently fail to auto-play (Chrome considers the engine idle by the
      // time speakText is called). We only clear the voiceschanged listener.
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = (text, panelistIdx) => {
    if (!ttsAvailable || ttsMuted || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const panelist = PANELISTS[panelistIdx % PANELISTS.length];
      const voice = pickVoiceForPanelist(panelist, voicesRef.current);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = panelist.gender === "female" ? 1.05 : 0.95;
      utterance.volume = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    try { window.speechSynthesis.cancel(); } catch (_) {}
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    if (!ttsMuted) stopSpeaking();
    setTtsMuted((m) => !m);
  };


  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      const newText = baseTextBeforeRecord.current + final + interim;
      setCurrentAnswer(newText);
    };

    recognition.onend = () => {
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
      try { recognition.stop(); } catch (_) {}
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast("Voice dictation not supported. Try Chrome.", "warning");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      stopSpeaking();
      // When resuming dictation after previous speech, ensure new words don't
      // stick to the previous text without a space.
      let base = currentAnswer;
      if (base.length > 0 && !/\s$/.test(base)) {
        base = base + " ";
        setCurrentAnswer(base);
      }
      baseTextBeforeRecord.current = base;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        showToast("Could not start voice. Try again.", "error");
      }
    }
  };

  // Timer
  useEffect(() => {
    if (stage !== "active") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSessionEnd("Time's up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Scenario popup trigger
  useEffect(() => {
    const userAnswerCount = messages.filter((m) => m.role === "user").length;
    if (userAnswerCount > 0 && userAnswerCount % 4 === 0 &&
        shownScenarios.length < 3 && !showScenarioPopup && stage === "active") {
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

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animates typing + speaks the text. Returns a Promise that resolves when
  // BOTH typing animation AND speech have finished. Used so we can chain a
  // feedback bubble (from previous panelist) followed by a question bubble
  // (from new panelist) in sequence.
  const animateTyping = (fullText, panelistIdx) => {
    return new Promise((resolve) => {
      setTypingText("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullText.length) {
          setTypingText(fullText.slice(0, i + 1));
          i += 2;
        } else {
          clearInterval(interval);
          setTypingText("");
          setMessages((prev) => [...prev, { role: "assistant", content: fullText, panelistIdx }]);

          // Speak and resolve when speech finishes (or if TTS unavailable, resolve now).
          if (!ttsAvailable || ttsMuted || !fullText) {
            resolve();
            return;
          }
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(fullText);
            const panelist = PANELISTS[panelistIdx % PANELISTS.length];
            const voice = pickVoiceForPanelist(panelist, voicesRef.current);
            if (voice) utterance.voice = voice;
            utterance.rate = 1.0;
            utterance.pitch = panelist.gender === "female" ? 1.05 : 0.95;
            utterance.volume = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => { setIsSpeaking(false); resolve(); };
            utterance.onerror = () => { setIsSpeaking(false); resolve(); };
            window.speechSynthesis.speak(utterance);
            // Safety: resolve after a max timeout even if onend never fires.
            setTimeout(() => resolve(), Math.max(3000, fullText.length * 80));
          } catch (e) {
            setIsSpeaking(false);
            resolve();
          }
        }
      }, 18);
    });
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
    sessionStartedAtRef.current = new Date().toISOString();
    setIsLoading(true);
    setError(null);

    // Prime the speech engine while we're still in user-gesture context.
    // Without this, Chrome blocks the first auto-play because the backend call
    // takes several seconds — by then Chrome thinks the user gesture is "stale"
    // and silently refuses to speak. The Replay button works because clicking
    // it counts as a fresh user gesture. This silent primer unlocks TTS for
    // the rest of the session.
    if ("speechSynthesis" in window) {
      try {
        const primer = new SpeechSynthesisUtterance(" ");
        primer.volume = 0;
        primer.rate = 10;
        window.speechSynthesis.speak(primer);
      } catch (_) { /* ignore */ }
    }

    try {
      const reply = await callAI(
        [{
          role: "user",
          content: "Begin the interview now. Start with a short, friendly welcome greeting (ONE line, under 10 words), then immediately ask your first technical question.\n\nIMPORTANT FORMATTING RULES for this entire interview:\n- The opening welcome must be ONE short line under 10 words. Example: \"Hi, welcome to the panel — let's get started.\"\n- After I provide each answer, you MUST format your response in TWO PARTS separated by a line containing only `===` (three equals signs):\n  Part 1 (above ===): a SHORT acknowledgment of my answer (under 10 words, e.g. \"Solid reasoning.\" \"Good point.\" \"Let's move on.\")\n  Part 2 (below ===): a SHORT greeting from the next panelist (under 10 words, e.g. \"Hi, I'll take it from here.\") followed by the next technical question.\n- Example response format after my answer:\n  ```\n  Solid reasoning on identity boundaries.\n  ===\n  My turn now. How would you architect zero-trust for a hybrid cloud workload?\n  ```\n- For the VERY FIRST message (welcome + first question), do NOT use the separator — just welcome + first question.\n- Never explain at length why an answer was good or bad."
        }],
        true
      );
      setIsLoading(false);
      setActivePanelistIdx(0);
      animateTyping(reply, 0);
    } catch (e) {
      console.error("Start session error:", e);
      setError(e.message);
      setIsLoading(false);
      showToast("Could not start: " + e.message, "error");
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || isLoading || stage !== "active") return;
    stopSpeaking();
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch (_) {}
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

      // Try to split the AI response on the `===` separator we instructed
      // the AI to use. If split succeeds:
      //   - feedback is delivered by the CURRENT panelist (who asked the question I just answered)
      //   - question is delivered by the NEXT panelist (taking over for the new question)
      // If no split (e.g. AI didn't follow the format), fall back to one bubble from next panelist.
      const { feedback, question } = splitAIResponse(reply);
      const prevIdx = activePanelistIdx;
      const nextIdx = (prevIdx + 1) % PANELISTS.length;

      if (feedback) {
        // STEP 1: Same avatar (prev) gives feedback on the answer
        await animateTyping(feedback, prevIdx);
        // brief pause so it feels natural
        await new Promise((r) => setTimeout(r, 400));
        // STEP 2: Next avatar asks the next question
        setActivePanelistIdx(nextIdx);
        animateTyping(question, nextIdx);
      } else {
        // No separator detected — just show one bubble from the next panelist
        setActivePanelistIdx(nextIdx);
        animateTyping(reply, nextIdx);
      }
    } catch (e) {
      console.error("Submit error:", e);
      setError(e.message);
      setIsLoading(false);
      showToast("Error: " + e.message, "error");
    }
  };

  // ─── Session end → goes to "completed" stage (NOT closing) ───
  const handleSessionEnd = (reason = "Session ended") => {
    if (stage !== "active") return;
    sessionEndedAtRef.current = new Date().toISOString();
    setStage("completed");
    stopSpeaking();
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch (_) {}
    }
    showToast(reason, "info");
  };

  // ─── Manual "End Session" button ───
  const handleExit = () => {
    if (stage === "active") {
      setShowExitConfirm(true);
      return;
    }
    handleSessionEnd("Interview ended");
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    handleSessionEnd("Interview ended");
  };

  // ─── Generate the report (called when user clicks View Report) ───
  const generateReport = async () => {
    setStage("loading-report");
    setReportError(null);
    const token = localStorage.getItem("token");

    const startedAt = sessionStartedAtRef.current;
    const endedAt = sessionEndedAtRef.current || new Date().toISOString();
    const durationSeconds = Math.floor((new Date(endedAt) - new Date(startedAt)) / 1000);
    const questionsAnswered = messages.filter((m) => m.role === "user").length;

    // Tag each assistant message with the panelist name for backend use
    const tagged = messages.map((m, i) => {
      if (m.role === "assistant") {
        const p = PANELISTS[(m.panelistIdx ?? 0) % PANELISTS.length];
        return { ...m, panelistName: p.name, panelistTitle: p.title };
      }
      return m;
    });

    try {
      const res = await fetch(`${API_BASE}/api/interview/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: tagged,
          jdText: jdFile ? await readFileAsText(jdFile) : "",
          resumeText: resumeFile ? await readFileAsText(resumeFile) : "",
          level,
          durationMinutes,
          durationSeconds,
          questionsAnswered,
          startedAt,
          completedAt: endedAt,
          panelists: PANELISTS.map((p) => ({
            id: p.id, name: p.name, title: p.title, specialty: p.specialty,
          })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend error (${res.status}): ${errText.substring(0, 300)}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.report) throw new Error("Empty report from server");

      setReport(data.report);
      setStage("viewing-report");
    } catch (e) {
      console.error("Report generation error:", e);
      setReportError(e.message);
      setStage("report-error");
    }
  };

  const restartSession = () => {
    stopSpeaking();
    // Long persistent primer keeps the speech engine continuously running
    // through the backend wait, so the welcome auto-plays on restart.
    // speakText() calls cancel() before the real welcome, stopping this primer.
    if ("speechSynthesis" in window) {
      try {
        const primer = new SpeechSynthesisUtterance(
          "preparing your next interview session please wait one moment"
        );
        primer.volume = 0;
        primer.rate = 0.5;
        window.speechSynthesis.speak(primer);
      } catch (_) { /* ignore */ }
    }
    setMessages([]);
    setCurrentAnswer("");
    setTimeRemaining(durationMinutes * 60);
    setIsLoading(true);
    setError(null);
    setTypingText("");
    setShowScenarioPopup(false);
    setActiveScenario(null);
    setShownScenarios([]);
    setActivePanelistIdx(0);
    setReport(null);
    setReportError(null);
    setStage("active");
    // Re-fire the initial question fetch
    setTimeout(() => startSession(), 50);
  };

  const goHome = () => {
    stopSpeaking();
    onEnd?.("home");
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

  const replayCurrentQuestion = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        speakText(messages[i].content, messages[i].panelistIdx ?? 0);
        return;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // STAGE: viewing-report → show full report
  // ═══════════════════════════════════════════════════════════════
  if (stage === "viewing-report" && report) {
    return <InterviewReport report={report} onRestart={restartSession} onHome={goHome} />;
  }

  // ═══════════════════════════════════════════════════════════════
  // STAGE: loading-report → spinner
  // ═══════════════════════════════════════════════════════════════
  if (stage === "loading-report") {
    return (
      <div className="fadeUp" style={{ maxWidth: 700, margin: "60px auto", padding: 20 }}>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div className="loader" style={{ margin: "0 auto 20px", width: 40, height: 40 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Generating your report…</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 0, lineHeight: 1.6 }}>
            Our AI is scoring your answers across {messages.filter(m => m.role === "user").length} questions,
            analyzing your strengths and growth areas, and preparing your full report.
            <br />
            <span style={{ fontSize: 11, fontStyle: "italic", marginTop: 8, display: "inline-block" }}>
              This usually takes 15–30 seconds.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STAGE: report-error → show error + retry
  // ═══════════════════════════════════════════════════════════════
  if (stage === "report-error") {
    return (
      <div className="fadeUp" style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Report could not be generated</h2>
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: 12, color: "#ef4444",
            fontSize: 12, textAlign: "left", margin: "12px 0", fontFamily: "monospace",
          }}>
            {reportError}
          </div>
          <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.6 }}>
            Your interview transcript is safe. You can retry — if the issue persists,
            the backend endpoint <code>/api/interview/generate-report</code> may not be deployed yet.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn bs" onClick={() => setStage("completed")}>
              ← Back
            </button>
            <button className="btn bp" onClick={generateReport} style={{ fontWeight: 700 }}>
              🔄 Retry
            </button>
            <button className="btn bs" onClick={goHome}>
              🏠 Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STAGE: completed → show "Session Complete" + View Report button
  // ═══════════════════════════════════════════════════════════════
  if (stage === "completed") {
    const userAnswers = messages.filter((m) => m.role === "user").length;
    return (
      <div className="fadeUp" style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Session Complete</h2>
          <p style={{ fontSize: 14, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.6 }}>
            You answered <strong style={{ color: "var(--ac)" }}>{userAnswers}</strong> question
            {userAnswers === 1 ? "" : "s"} from a panel of {PANELISTS.length} interviewers.
            <br />
            View your detailed report with scores, feedback, and topics to study next.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <button
              className="btn bp"
              onClick={generateReport}
              disabled={userAnswers === 0}
              style={{
                padding: "14px 32px", fontSize: 15, fontWeight: 700,
                opacity: userAnswers === 0 ? 0.5 : 1,
              }}
            >
              📊 View Report →
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn bs" onClick={restartSession} style={{ fontSize: 12, padding: "8px 14px" }}>
              🔄 Start Interview Again
            </button>
            <button className="btn bs" onClick={goHome} style={{ fontSize: 12, padding: "8px 14px" }}>
              🏠 Go to Home
            </button>
          </div>
          {userAnswers === 0 && (
            <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 16, fontStyle: "italic" }}>
              You didn't answer any questions, so no report can be generated.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Helpers for active interview rendering
  // ═══════════════════════════════════════════════════════════════
  let lastAiIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") { lastAiIdx = i; break; }
  }
  const currentQuestion = typingText
    ? { content: typingText, panelistIdx: activePanelistIdx, isTyping: true }
    : (lastAiIdx >= 0 ? messages[lastAiIdx] : null);
  const historyMessages = typingText
    ? messages
    : (lastAiIdx >= 0 ? messages.slice(0, lastAiIdx) : []);

  const activePanelist = PANELISTS[activePanelistIdx % PANELISTS.length];
  const questionPanelist = currentQuestion
    ? PANELISTS[(currentQuestion.panelistIdx ?? 0) % PANELISTS.length]
    : activePanelist;

  const Avatar = ({ panelist, isActive, size = 88 }) => {
    const errored = imgErrors[panelist.id];
    return (
      <div style={{
        position: "relative",
        width: size, height: size, minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: `${panelist.color}15`,
        border: `3px solid ${isActive ? panelist.color : "rgba(255,255,255,0.15)"}`,
        boxShadow: isActive
          ? `0 0 0 4px ${panelist.color}33, 0 8px 24px ${panelist.color}66`
          : "0 2px 8px rgba(0,0,0,0.25)",
        transform: isActive ? "scale(1.06)" : "scale(1)",
        transition: "all 0.35s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!errored ? (
          <img
            src={panelist.avatarUrl}
            alt={panelist.name}
            onError={() => setImgErrors((p) => ({ ...p, [panelist.id]: true }))}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${panelist.color}, ${panelist.color}aa)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: size * 0.32, letterSpacing: 1,
          }}>
            {panelist.initials}
          </div>
        )}
        {isActive && isSpeaking && (
          <div style={{
            position: "absolute", bottom: 2, right: 2,
            width: 20, height: 20, borderRadius: "50%",
            background: "#22c55e",
            border: `2px solid #fff`,
            animation: "pulse-green 1s infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10,
          }}>
            🔊
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // STAGE: active → main interview UI
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="fadeUp">
      {/* Header */}
      <div className="card" style={{
        padding: 14, marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div className="lbl" style={{ marginBottom: 2 }}>LIVE INTERVIEW · {PANELISTS.length}-PERSON PANEL</div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>
            {messages.filter((m) => m.role === "user").length} answered · {level} level
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {ttsAvailable && (
            <>
              <button
                className="btn bs"
                onClick={replayCurrentQuestion}
                disabled={messages.length === 0 || isLoading}
                title="Replay last question"
                style={{ fontSize: 12, padding: "6px 10px" }}
              >
                🔁 Replay
              </button>
              <button
                className="btn bs"
                onClick={toggleMute}
                title={ttsMuted ? "Unmute panel voice" : "Mute panel voice"}
                style={{
                  fontSize: 12, padding: "6px 10px",
                  background: ttsMuted ? "rgba(239,68,68,0.15)" : undefined,
                  borderColor: ttsMuted ? "#ef4444" : undefined,
                  color: ttsMuted ? "#ef4444" : undefined,
                }}
              >
                {ttsMuted ? "🔇 Muted" : "🔊 Voice"}
              </button>
            </>
          )}
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
            End & View Report
          </button>
        </div>
      </div>

      {/* PANEL */}
      <div className="card" style={{
        padding: 0, marginBottom: 12, overflow: "hidden",
      }}>
        <div style={{
          padding: "24px 20px 16px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-around", alignItems: "flex-start",
            gap: 14, flexWrap: "wrap",
          }}>
            {PANELISTS.map((p, i) => {
              const isActive = i === (activePanelistIdx % PANELISTS.length);
              return (
                <div key={p.id} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, flex: "1 1 110px", minWidth: 90, maxWidth: 160,
                  opacity: isActive ? 1 : 0.55,
                  transition: "opacity 0.35s ease",
                }}>
                  <Avatar panelist={p} isActive={isActive} size={76} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? "var(--tx1)" : "var(--tx2)",
                      marginBottom: 2,
                    }}>{p.name}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                      color: isActive ? p.color : "var(--tx2)",
                    }}>{p.title}</div>
                    <div style={{
                      fontSize: 9, marginTop: 3,
                      color: "var(--tx2)", letterSpacing: 0.3, opacity: 0.7,
                    }}>{p.specialty}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${questionPanelist.color}55, transparent)`,
          margin: "0 24px",
        }} />

        <div style={{ padding: "18px 24px 22px" }}>
          {!currentQuestion && isLoading && (
            <div style={{ textAlign: "center", padding: 30, color: "var(--tx2)" }}>
              <div className="loader" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13 }}>The panel is preparing your first question…</div>
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

          {currentQuestion && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 11px",
                  background: "rgba(0,229,255,0.08)",
                  border: "1px solid rgba(0,229,255,0.3)",
                  borderRadius: 20,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  color: "var(--ac)",
                }}>
                  {isSpeaking ? "🔊" : "💬"} ASKED BY {questionPanelist.name.toUpperCase()} · {questionPanelist.title.toUpperCase()}
                </span>
                {currentQuestion.isTyping && (
                  <span style={{ fontSize: 10, color: "var(--tx2)" }}>typing…</span>
                )}
              </div>
              <div style={{
                background: "rgba(0,229,255,0.04)",
                border: "1px solid rgba(0,229,255,0.15)",
                borderLeft: `4px solid ${questionPanelist.color}`,
                borderRadius: 10,
                padding: "14px 18px",
                fontSize: 14, lineHeight: 1.65,
                color: "var(--tx1)", whiteSpace: "pre-wrap",
              }}>
                {currentQuestion.content}
                {currentQuestion.isTyping && (
                  <span style={{
                    display: "inline-block", width: 6, height: 14,
                    background: "var(--ac)",
                    verticalAlign: "-2px", marginLeft: 3,
                    animation: "blink 1s infinite",
                  }} />
                )}
              </div>
            </>
          )}

          {isLoading && messages.length > 0 && !typingText && (
            <div style={{
              marginTop: 12, display: "flex", gap: 10, alignItems: "center",
              color: "var(--tx2)", fontSize: 12,
            }}>
              <div className="loader" style={{ width: 14, height: 14 }} />
              {activePanelist.name} is preparing the next question…
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {historyMessages.length > 0 && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div
            onClick={() => setHistoryExpanded((e) => !e)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", padding: "4px 4px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx2)", letterSpacing: 0.5 }}>
              CONVERSATION HISTORY · {historyMessages.length} MESSAGE{historyMessages.length === 1 ? "" : "S"}
            </div>
            <div style={{ fontSize: 11, color: "var(--tx2)" }}>
              {historyExpanded ? "▲ Hide" : "▼ Show"}
            </div>
          </div>
          {historyExpanded && (
            <div style={{
              marginTop: 12, maxHeight: "35vh", overflowY: "auto",
              borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12,
            }}>
              {historyMessages.map((msg, i) => {
                const panelist = msg.role === "assistant"
                  ? PANELISTS[(msg.panelistIdx ?? 0) % PANELISTS.length]
                  : null;
                return (
                  <div key={i} style={{
                    marginBottom: 12, display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: 10,
                  }}>
                    {msg.role === "user" ? (
                      <div style={{
                        width: 30, height: 30, minWidth: 30, borderRadius: "50%",
                        background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>👤</div>
                    ) : (
                      <Avatar panelist={panelist} isActive={false} size={30} />
                    )}
                    <div style={{
                      flex: 1, padding: "8px 12px",
                      background: msg.role === "user" ? "rgba(34,197,94,0.05)" : "rgba(0,229,255,0.04)",
                      border: `1px solid ${msg.role === "user" ? "rgba(34,197,94,0.2)" : "rgba(0,229,255,0.15)"}`,
                      borderLeft: msg.role === "user" ? undefined : `3px solid ${panelist.color}`,
                      borderRadius: 8, fontSize: 12, lineHeight: 1.55,
                      whiteSpace: "pre-wrap", color: "var(--tx1)", maxWidth: "85%",
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                        color: msg.role === "user" ? "#22c55e" : "var(--ac)",
                        marginBottom: 3,
                      }}>
                        {msg.role === "user" ? "YOU" : `${panelist.name.toUpperCase()} · ${panelist.title.toUpperCase()}`}
                      </div>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={historyEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Input */}
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
            placeholder="Type your answer to the panel… (Ctrl+Enter to submit) · or click 🎤 to dictate"
            disabled={isLoading || stage !== "active"}
            style={{ width: "100%", minHeight: 100, fontSize: 13, resize: "vertical", paddingLeft: 56 }}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || stage !== "active"}
              title={isRecording ? "Stop dictation" : "Start dictation"}
              style={{
                position: "absolute", top: 8, left: 8,
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
            disabled={!currentAnswer.trim() || isLoading || stage !== "active"}
            onClick={submitAnswer}
            style={{
              padding: "10px 24px", fontSize: 13, fontWeight: 700,
              opacity: !currentAnswer.trim() || isLoading || stage !== "active" ? 0.5 : 1,
              cursor: !currentAnswer.trim() || isLoading || stage !== "active" ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Sending…" : "Submit Answer →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
      `}</style>

      {/* Scenario popup */}
      {showExitConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f1420",
              border: "1px solid var(--ac)",
              borderRadius: 12,
              maxWidth: 440, width: "100%",
              padding: 28,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <span style={{
                background: "rgba(168,85,247,0.15)",
                color: "#a855f7",
                padding: "4px 12px", borderRadius: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              }}>
                END INTERVIEW
              </span>
            </div>
            <h3 style={{
              fontSize: 20, fontWeight: 800, color: "#fff",
              margin: "0 0 10px", letterSpacing: -0.3,
            }}>
              End interview and view your report?
            </h3>
            <p style={{
              fontSize: 13, color: "var(--tx2)",
              lineHeight: 1.6, margin: "0 0 22px",
            }}>
              Your session will be wrapped up and your AI panel will compile your performance report. You won't be able to continue this interview after ending it.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn bs"
                onClick={() => setShowExitConfirm(false)}
                style={{ padding: "10px 18px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={confirmExit}
                style={{
                  padding: "10px 20px", fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  color: "#fff", border: "none",
                }}
              >
                End & View Report
              </button>
            </div>
          </div>
        </div>
      )}

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
              recent threat reports. <strong>For assessment only.</strong>
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
          </div>
        </div>
      )}
    </div>
  );
}
