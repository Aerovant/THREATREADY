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

// ─── Panelist directory ─────────────────────────────────────────────────
// Each panelist's photo loads from your React app's public/panelists/ folder.
//
// Photos in use (must exist at these exact paths):
//   D:\cyberprep-api\my-app\public\panelists\maya.jpg
//   D:\cyberprep-api\my-app\public\panelists\marcus.jpg
//   D:\cyberprep-api\my-app\public\panelists\sarah.jpg
//   D:\cyberprep-api\my-app\public\panelists\aiden.jpg
//   D:\cyberprep-api\my-app\public\panelists\priya.jpg
//   D:\cyberprep-api\my-app\public\panelists\raj.jpg
//
// Policy:
//   - The app displays ONLY the literal image file at the URL — no proxying,
//     no transformation, no AI regeneration, no placeholder substitution.
//   - If any file is missing, that panelist falls back to colored initials.
//     The app never requests an external image service or generated face.
//   - To replace any panelist photo: just overwrite the file in
//     public/panelists/ with a new image (same filename) and hard-refresh.

// Resolve avatar URLs against Vite's base URL so they work in both dev (/) and prod (/app/).
const A = (file) => `${import.meta.env.BASE_URL}panelists/${file}`.replace(/\/{2,}/g, '/');

const PANELISTS = [
  {
    id: "maya",
    name: "Maya Chen",
    title: "Security Architect",
    specialty: "Architecture & Defense",
    initials: "MC",
    color: "#14b8a6",
    gender: "female",
    avatarUrl: A("maya.jpg"),
  },
  {
    id: "marcus",
    name: "Marcus Rodriguez",
    title: "IR Lead",
    specialty: "Incident Response",
    initials: "MR",
    color: "#f97316",
    gender: "male",
    avatarUrl: A("marcus.jpg"),
  },
  {
    id: "sarah",
    name: "Sarah Okonkwo",
    title: "CISO",
    specialty: "Strategy & Communication",
    initials: "SO",
    color: "#a855f7",
    gender: "female",
    avatarUrl: A("sarah.jpg"),
  },
  {
    id: "aiden",
    name: "Aiden Wright",
    title: "Threat Hunter",
    specialty: "Threat Hunting & Detection",
    initials: "AW",
    color: "#3b82f6",
    gender: "male",
    avatarUrl: A("aiden.jpg"),
  },
  {
    id: "priya",
    name: "Priya Subramanian",
    title: "AppSec Engineer",
    specialty: "Vulnerability & Code Security",
    initials: "PS",
    color: "#22c55e",
    gender: "female",
    avatarUrl: A("priya.jpg"),
  },
  {
    id: "raj",
    name: "Raj Patel",
    title: "Red Team Lead",
    specialty: "Adversarial Reasoning",
    initials: "RP",
    color: "#06b6d4",
    gender: "male",
    avatarUrl: A("raj.jpg"),
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
  // Refs that mirror the React state, so async callbacks read the current value
  // not a stale closure. Critical for the first-question TTS path.
  const ttsAvailableRef = useRef(false);
  const ttsMutedRef = useRef(false);

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
    if (!("speechSynthesis" in window)) { setTtsAvailable(false); ttsAvailableRef.current = false; return; }
    setTtsAvailable(true);
    ttsAvailableRef.current = true;
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
    if (!ttsAvailableRef.current || ttsMutedRef.current || !text) return;
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
    setTtsMuted((m) => { ttsMutedRef.current = !m; return !m; });
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
          // Use refs (not state) to read CURRENT values, since this function may have
          // been captured from a render where ttsAvailable was still false.
          if (!ttsAvailableRef.current || ttsMutedRef.current || !fullText) {
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
        // LONG persistent primer keeps the speech engine continuously running
        // through the backend wait (10-15s), so the welcome auto-plays.
        // Without this, Chrome blocks the first auto-play because the user-gesture
        // context is considered stale by the time speakText is called.
        // animateTyping() calls cancel() before the real welcome, stopping this primer.
        const primer = new SpeechSynthesisUtterance(
          "preparing your interview session please wait one moment"
        );
        primer.volume = 0;
        primer.rate = 0.5;
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
    // Notify the InterviewTab reports widget to refresh
    try { window.dispatchEvent(new CustomEvent('threatready:interview-complete')); } catch (_) {}
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

      // ─── Persist this real, completed interview to local history ───
      // This is the ONLY place that writes to cyberprep_interview_history.
      // The InterviewTab's "Interview History" widget reads from this store.
      // No dummy/sample data — only entries written here, one per real completed interview.
      try {
        const r = data.report || {};
        const historyEntry = {
          id: `INT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          completed_at: endedAt,
          started_at: startedAt,
          difficulty: level,
          duration_minutes: durationMinutes,
          duration_seconds: durationSeconds,
          questions_answered: questionsAnswered,
          panel_size: PANELISTS.length,
          // Score & badge fields (mapped to common shapes the report may return)
          overall_score: r.overall_score ?? r.overallScore ?? r.score ?? null,
          skills_score: r.skills_score ?? r.skillsScore ?? null,
          attack_score: r.attack_score ?? r.attackScore ?? r.communication_score ?? null,
          badge: r.badge ?? r.badge_level ?? null,
          earned_xp: r.earned_xp ?? r.earnedXp ?? r.xp ?? 0,
          verdict: r.verdict ?? r.summary ?? r.overall_verdict ?? null,
          // Full report payload preserved so the history "View Full Report" can re-render it later
          report: r,
        };
        const stored = localStorage.getItem("cyberprep_interview_history");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(historyEntry); // newest first
        // Cap at 100 entries
        if (list.length > 100) list.length = 100;
        localStorage.setItem("cyberprep_interview_history", JSON.stringify(list));
        // Notify InterviewTab to refresh its widget
        window.dispatchEvent(new CustomEvent("threatready:interview-complete", { detail: { entry: historyEntry } }));
      } catch (storeErr) {
        console.error("Failed to persist interview report:", storeErr);
      }
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
      <div className="fadeUp" style={{ maxWidth: 700, margin: "140px auto 40px", padding: 20, paddingTop: 0 }}>
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
      <div className="fadeUp" style={{ maxWidth: 700, margin: "140px auto 40px", padding: 20, paddingTop: 0 }}>
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
      <div className="fadeUp" style={{ maxWidth: 700, margin: "140px auto 40px", padding: 20, paddingTop: 0 }}>
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
    // POLICY: only render an image when a real, explicit avatarUrl is provided
    // (no AI-generated faces, no placeholder portrait services). If avatarUrl
    // is null/empty OR a previously-set URL failed to load, we render the
    // colored initials badge instead — never a generated face.
    const hasRealImage = !!panelist.avatarUrl && !errored;
    return (
      <div style={{
        position: "relative",
        width: size, height: size, minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: `${panelist.color}15`,
        border: `3px solid ${isActive ? panelist.color : "rgba(0,0,0,0.05)"}`,
        boxShadow: isActive
          ? `0 0 0 4px ${panelist.color}25, 0 8px 20px ${panelist.color}40`
          : "0 2px 8px rgba(0,0,0,0.08)",
        transform: isActive ? "scale(1.04)" : "scale(1)",
        transition: "all 0.35s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {hasRealImage ? (
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
  // STAGE: active → main interview UI (REDESIGNED — light theme, modern)
  // ═══════════════════════════════════════════════════════════════
  const SI = {
    replay: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
    mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    micBig: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    micOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
    timer: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M9 1h6"/><polyline points="12 9 12 13 14 14"/></svg>,
    chevD: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    chat: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  const userAnsweredCount = messages.filter((m) => m.role === "user").length;
  const timeIsLow = timeRemaining < 300;

  return (
    <div className="tr-is-root">
      {/* ─── Header ─── */}
      <div className="tr-is-header">
        <div className="tr-is-header-left">
          <div className="tr-is-header-lbl">
            LIVE INTERVIEW · {PANELISTS.length}-PERSON PANEL
          </div>
          <div className="tr-is-header-sub">
            {userAnsweredCount} answered · {level} level
          </div>
        </div>
        <div className="tr-is-header-right">
          {ttsAvailable && (
            <>
              <button
                type="button"
                className="tr-is-btn"
                onClick={replayCurrentQuestion}
                disabled={messages.length === 0 || isLoading}
                title="Replay last question"
              >
                {SI.replay} Replay
              </button>
              <button
                type="button"
                className={`tr-is-btn${ttsMuted ? " muted" : ""}`}
                onClick={toggleMute}
                title={ttsMuted ? "Unmute panel voice" : "Mute panel voice"}
              >
                {ttsMuted ? SI.micOff : SI.mic} {ttsMuted ? "Muted" : "Voice"}
              </button>
            </>
          )}
          <div className={`tr-is-timer${timeIsLow ? " low" : ""}`}>
            {SI.timer} <span>{formatTime(timeRemaining)}</span>
          </div>
          <button
            type="button"
            className="tr-is-btn end"
            onClick={handleExit}
          >
            End &amp; View Report
          </button>
        </div>
      </div>

      {/* ─── Panel Grid + Current Question (single card) ─── */}
      <div className="tr-is-panel">
        <div className="tr-is-panel-grid">
          {PANELISTS.map((p, i) => {
            const isActive = i === (activePanelistIdx % PANELISTS.length);
            return (
              <div
                key={p.id}
                className={`tr-is-pcard${isActive ? " active" : ""}`}
              >
                <div className="tr-is-pcard-top" style={{ background: p.color }} />
                <div className="tr-is-pcard-photo">
                  <Avatar panelist={p} isActive={isActive} size={120} />
                  <span className="tr-is-pcard-dot" />
                </div>
                <div className="tr-is-pcard-name">{p.name}</div>
                <div className="tr-is-pcard-title" style={{ color: isActive ? p.color : "var(--tx2, #8890b0)" }}>
                  {p.title}
                </div>
                <div className="tr-is-pcard-specialty">{p.specialty}</div>
              </div>
            );
          })}
        </div>

        <div className="tr-is-question-zone">
          {!currentQuestion && isLoading && (
            <div className="tr-is-preparing">
              <div className="loader" />
              <div>The panel is preparing your first question…</div>
            </div>
          )}

          {error && (
            <div className="tr-is-error">
              {SI.alert} {error}
            </div>
          )}

          {currentQuestion && (
            <>
              <div className="tr-is-asked-row">
                <span className="tr-is-asked-pill">
                  {SI.chat} ASKED BY {questionPanelist.name.toUpperCase()} · {questionPanelist.title.toUpperCase()}
                </span>
                {currentQuestion.isTyping && (
                  <span className="tr-is-typing">typing…</span>
                )}
              </div>
              <div
                className="tr-is-question"
                style={{ borderLeftColor: questionPanelist.color }}
              >
                {currentQuestion.content}
                {currentQuestion.isTyping && (
                  <span className="tr-is-caret" />
                )}
                <span className="tr-is-question-decor" aria-hidden="true" />
              </div>
            </>
          )}

          {isLoading && messages.length > 0 && !typingText && (
            <div className="tr-is-loading-next">
              <div className="loader" style={{ width: 14, height: 14 }} />
              {activePanelist.name} is preparing the next question…
            </div>
          )}
        </div>
      </div>

      {/* ─── Conversation History ─── */}
      {historyMessages.length > 0 && (
        <div className="tr-is-history">
          <div
            className="tr-is-history-head"
            onClick={() => setHistoryExpanded((e) => !e)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHistoryExpanded((x) => !x); } }}
          >
            <div className="tr-is-history-lbl">
              CONVERSATION HISTORY · {historyMessages.length} MESSAGE{historyMessages.length === 1 ? "" : "S"}
            </div>
            <div className={`tr-is-history-toggle${historyExpanded ? " open" : ""}`}>
              {historyExpanded ? "Hide" : "Show"} {SI.chevD}
            </div>
          </div>
          {historyExpanded && (
            <div className="tr-is-history-list">
              {historyMessages.map((msg, i) => {
                const panelist = msg.role === "assistant"
                  ? PANELISTS[(msg.panelistIdx ?? 0) % PANELISTS.length]
                  : null;
                const isUser = msg.role === "user";
                return (
                  <div
                    key={i}
                    className={`tr-is-msg-row ${isUser ? "user" : "assistant"}`}
                  >
                    {isUser ? (
                      <div className="tr-is-msg-avatar user-av">YOU</div>
                    ) : (
                      <Avatar panelist={panelist} isActive={false} size={36} />
                    )}
                    <div
                      className={`tr-is-msg-bubble${isUser ? " user" : ""}`}
                      style={!isUser ? { borderLeft: `3px solid ${panelist.color}` } : undefined}
                    >
                      <div className={`tr-is-msg-from${isUser ? " user" : ""}`}>
                        {isUser
                          ? "YOU"
                          : `${panelist.name.toUpperCase()} · ${panelist.title.toUpperCase()}`}
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

      {/* ─── Answer Input ─── */}
      <div className="tr-is-input-card">
        <div className="tr-is-textarea-wrap">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || stage !== "active"}
              title={isRecording ? "Stop dictation" : "Start dictation"}
              className={`tr-is-mic-btn${isRecording ? " active" : ""}`}
            >
              {SI.micBig}
            </button>
          )}
          <textarea
            ref={textareaRef}
            className="tr-is-textarea"
            value={currentAnswer}
            onChange={(e) => {
              setCurrentAnswer(e.target.value);
              if (!isRecording) baseTextBeforeRecord.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitAnswer();
            }}
            placeholder={`Type your answer to the panel… (Ctrl+Enter to submit)${voiceSupported ? " · or click 🎤 to dictate" : ""}`}
            disabled={isLoading || stage !== "active"}
            style={voiceSupported ? { paddingLeft: 56 } : undefined}
          />
        </div>
        <div className="tr-is-input-footer">
          <div className={`tr-is-input-meta${isRecording ? " rec" : ""}`}>
            {isRecording ? (
              <>
                <span className="tr-is-rec-dot" />
                <strong>Recording…</strong> · click mic to pause · text editable manually
              </>
            ) : (
              <>{currentAnswer.length} chars · Ctrl+Enter to submit{voiceSupported ? " · mic for voice" : ""}</>
            )}
          </div>
          <button
            type="button"
            className="tr-is-submit-btn"
            disabled={!currentAnswer.trim() || isLoading || stage !== "active"}
            onClick={submitAnswer}
          >
            {isLoading ? "Sending…" : <>Submit Answer {SI.send}</>}
          </button>
        </div>
      </div>

      <style>{`
/* ─── Active Interview UI (light theme redesign) ─── */
.tr-is-root{
  font-family:'Inter','Segoe UI',sans-serif;
  color:var(--tx1,#1a1a2e);
  padding-top:56px;
  display:flex;flex-direction:column;gap:16px;
}
.tr-is-root svg:not([width]){width:14px;height:14px;flex-shrink:0}

/* ── Header ── */
.tr-is-header{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px 24px;
  display:flex;justify-content:space-between;align-items:center;
  gap:14px;flex-wrap:wrap;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-is-header-lbl{
  font-size:13px;font-weight:800;color:#7c3aed;
  letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;
}
.tr-is-header-sub{font-size:12.5px;color:var(--tx2,#8890b0)}
.tr-is-header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.tr-is-btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:8px 14px;
  background:var(--s1);border:1px solid var(--bd,#e9e5f3);
  border-radius:9px;
  font-size:12.5px;font-weight:600;color:var(--tx1,#1a1a2e);
  cursor:pointer;font-family:inherit;
  transition:all .15s ease;
}
.tr-is-btn:hover:not(:disabled){border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04)}
.tr-is-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-is-btn.muted{background:rgba(239,68,68,.08);border-color:#ef4444;color:#ef4444}
.tr-is-btn.end{font-weight:700}
.tr-is-btn.end:hover:not(:disabled){border-color:#dc2626;color:#dc2626;background:#fef2f2}

.tr-is-timer{
  display:inline-flex;align-items:center;gap:7px;
  padding:8px 16px;
  background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);
  border-radius:9px;
  font-size:15px;font-weight:800;font-family:'Inter','SF Mono',monospace;
  color:#7c3aed;letter-spacing:.5px;
}
.tr-is-timer.low{background:rgba(239,68,68,.10);border-color:rgba(239,68,68,.40);color:#dc2626}

/* ── Panel card (panelist grid + question zone) ── */
.tr-is-panel{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-is-panel-grid{
  display:grid;
  grid-template-columns:repeat(6,1fr);
  gap:14px;
  padding:22px 22px 14px;
}
@media (max-width:1200px){.tr-is-panel-grid{grid-template-columns:repeat(3,1fr)}}
@media (max-width:600px){.tr-is-panel-grid{grid-template-columns:repeat(2,1fr)}}

/* Panelist card */
.tr-is-pcard{
  background:var(--s1);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:12px;
  padding:0;
  overflow:hidden;
  text-align:center;
  display:flex;flex-direction:column;
  transition:opacity .35s ease, transform .35s ease, box-shadow .35s ease;
  opacity:.55;
}
.tr-is-pcard.active{opacity:1;box-shadow:0 6px 18px rgba(124,58,237,.10);transform:translateY(-1px)}
.tr-is-pcard-top{height:5px;width:100%}
.tr-is-pcard-photo{
  position:relative;padding:14px 14px 8px;
  display:flex;justify-content:center;
}
.tr-is-pcard-photo > div{
  border-radius:12px !important;
  width:120px !important;height:120px !important;
  min-width:120px !important;min-height:120px !important;
  overflow:hidden;
  border:none !important;
  box-shadow:0 4px 10px rgba(0,0,0,.06);
}
.tr-is-pcard-photo > div img{
  width:100% !important;height:100% !important;object-fit:cover !important;
}
.tr-is-pcard-dot{
  position:absolute;right:22px;bottom:14px;
  width:14px;height:14px;border-radius:50%;
  background:#22c55e;border:2.5px solid #fff;
  box-shadow:0 0 0 0 rgba(34,197,94,.6);
  animation:trIsPulseDot 2.4s ease-in-out infinite;
}
@keyframes trIsPulseDot{
  0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}
  50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}
}
.tr-is-pcard-name{
  font-size:14px;font-weight:800;color:var(--tx1,#1a1a2e);
  margin:6px 10px 2px;letter-spacing:-.2px;
}
.tr-is-pcard-title{
  font-size:12.5px;font-weight:700;
  margin:0 10px 2px;
}
.tr-is-pcard-specialty{
  font-size:11px;color:var(--tx2,#8890b0);
  margin:0 10px 16px;line-height:1.4;
}

/* ── Question zone ── */
.tr-is-question-zone{
  padding:18px 24px 22px;
  border-top:1px solid var(--bd,#e9e5f3);
  background:linear-gradient(180deg,#fafafa 0%,#fff 100%);
}
.tr-is-preparing{
  text-align:center;padding:30px;color:var(--tx2,#8890b0);font-size:13px;
}
.tr-is-preparing .loader{margin:0 auto 12px}
.tr-is-error{
  display:flex;align-items:center;gap:8px;
  background:rgba(239,68,68,.06);
  border:1px solid rgba(239,68,68,.25);
  border-radius:9px;padding:11px 14px;
  color:#dc2626;font-size:12.5px;margin-bottom:12px;
}
.tr-is-asked-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.tr-is-asked-pill{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 12px;
  background:rgba(124,58,237,.08);
  border:1px solid rgba(124,58,237,.20);
  border-radius:20px;
  font-size:10.5px;font-weight:800;letter-spacing:.6px;
  color:#7c3aed;
}
.tr-is-typing{font-size:11px;color:var(--tx2,#8890b0);font-style:italic}
.tr-is-question{
  position:relative;
  background:rgba(124,58,237,.03);
  border:1px solid rgba(124,58,237,.10);
  border-left:4px solid;
  border-radius:10px;
  padding:18px 22px;
  font-size:14.5px;line-height:1.7;
  color:var(--tx1,#1a1a2e);
  white-space:pre-wrap;
  overflow:hidden;
}
.tr-is-question-decor{
  position:absolute;top:14px;right:14px;
  width:60px;height:60px;
  background-image:radial-gradient(circle,#7c3aed 1px,transparent 1.5px);
  background-size:8px 8px;
  opacity:.15;
  pointer-events:none;
}
.tr-is-caret{
  display:inline-block;width:7px;height:16px;
  background:#7c3aed;vertical-align:-3px;margin-left:3px;
  animation:trIsBlink 1s infinite;
}
@keyframes trIsBlink{0%,50%{opacity:1}51%,100%{opacity:0}}
.tr-is-loading-next{
  margin-top:14px;display:flex;gap:10px;align-items:center;
  color:var(--tx2,#8890b0);font-size:12.5px;
}

/* ── Conversation History ── */
.tr-is-history{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-is-history-head{
  padding:14px 22px;
  display:flex;justify-content:space-between;align-items:center;
  cursor:pointer;outline:none;
  transition:background .15s ease;
}
.tr-is-history-head:hover{background:var(--s2)}
.tr-is-history-head:focus-visible{background:rgba(124,58,237,.04)}
.tr-is-history-lbl{
  font-size:11.5px;font-weight:800;color:#7c3aed;
  letter-spacing:1.8px;
}
.tr-is-history-toggle{
  display:inline-flex;align-items:center;gap:5px;
  font-size:12px;font-weight:600;color:var(--tx2,#8890b0);
  transition:color .15s ease;
}
.tr-is-history-head:hover .tr-is-history-toggle{color:#7c3aed}
.tr-is-history-toggle svg{transition:transform .2s ease}
.tr-is-history-toggle.open svg{transform:rotate(180deg)}
.tr-is-history-list{
  padding:0 22px 18px;
  max-height:38vh;overflow-y:auto;
  border-top:1px solid var(--bd,#e9e5f3);
}
.tr-is-history-list::-webkit-scrollbar{width:7px}
.tr-is-history-list::-webkit-scrollbar-thumb{background:#d4ccea;border-radius:4px}
.tr-is-msg-row{
  display:flex;gap:11px;
  margin-top:14px;
}
.tr-is-msg-row.user{flex-direction:row-reverse}
.tr-is-msg-avatar.user-av{
  width:36px;height:36px;flex-shrink:0;
  border-radius:50%;
  background:linear-gradient(135deg,#22c55e,#16a34a);
  color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:10.5px;font-weight:800;letter-spacing:.5px;
  box-shadow:0 2px 6px rgba(34,197,94,.25);
}
.tr-is-msg-bubble{
  flex:1;max-width:80%;
  padding:11px 14px;
  background:rgba(124,58,237,.03);
  border:1px solid rgba(124,58,237,.12);
  border-radius:11px;
  font-size:13px;line-height:1.6;color:var(--tx1,#1a1a2e);
  white-space:pre-wrap;
}
.tr-is-msg-bubble.user{
  background:rgba(34,197,94,.06);
  border-color:rgba(34,197,94,.22);
}
.tr-is-msg-from{
  font-size:9.5px;font-weight:800;letter-spacing:.6px;
  color:#7c3aed;margin-bottom:4px;
}
.tr-is-msg-from.user{color:#16a34a}

/* ── Input ── */
.tr-is-input-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px 22px;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-is-textarea-wrap{position:relative;margin-bottom:14px}
.tr-is-textarea{
  width:100%;min-height:110px;
  padding:14px 16px;
  background:var(--s2);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;
  font-size:13.5px;line-height:1.6;
  color:var(--tx1,#1a1a2e);
  font-family:inherit;
  resize:vertical;outline:none;
  transition:border-color .15s,box-shadow .15s;
  box-sizing:border-box;
}
.tr-is-textarea:focus{
  border-color:#7c3aed;
  box-shadow:0 0 0 3px rgba(124,58,237,.08);
  background:var(--s1);
}
.tr-is-textarea::placeholder{color:var(--tx2,#8890b0)}
.tr-is-textarea:disabled{opacity:.6;cursor:not-allowed}

.tr-is-mic-btn{
  position:absolute;top:10px;left:10px;
  width:42px;height:42px;
  border-radius:50%;
  background:rgba(124,58,237,.08);
  border:1px solid rgba(124,58,237,.20);
  color:#7c3aed;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s ease;
  z-index:1;
}
.tr-is-mic-btn:hover:not(:disabled){background:rgba(124,58,237,.12);transform:scale(1.05)}
.tr-is-mic-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-is-mic-btn.active{
  background:#dc2626;border-color:#dc2626;color:#fff;
  animation:trIsPulseRed 1.2s infinite;
}
@keyframes trIsPulseRed{
  0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}
  50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}
}

.tr-is-input-footer{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  flex-wrap:wrap;
}
.tr-is-input-meta{font-size:11.5px;color:var(--tx2,#8890b0)}
.tr-is-input-meta.rec{color:#dc2626;font-weight:600}
.tr-is-rec-dot{
  display:inline-block;width:8px;height:8px;border-radius:50%;
  background:#dc2626;margin-right:6px;
  animation:trIsPulseRed 1.2s infinite;
}

.tr-is-submit-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:11px 24px;
  background:#7c3aed;
  border:none;
  border-radius:9px;
  color:#fff;
  font-size:13.5px;font-weight:700;
  cursor:pointer;font-family:inherit;
  box-shadow:0 4px 12px rgba(124,58,237,.25);
  transition:all .15s ease;
}
.tr-is-submit-btn:hover:not(:disabled){background:#6d28d9;transform:translateY(-1px);box-shadow:0 6px 18px rgba(124,58,237,.35)}
.tr-is-submit-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none;transform:none}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE OVERRIDES — InterviewSession (light-theme by default)
   The token swaps above handle solid surfaces; these patch:
    • panelist card visibility (opacity:.55 → .72 in dark mode so names stay readable)
    • title color (was hardcoded color from p.color, but inactive needs override)
    • shadows + borders
    • input + answer textarea
   ═══════════════════════════════════════════════════════════════ */

[data-theme="dark"] .tr-is-pcard{
  background: linear-gradient(180deg, rgba(255,255,255,.025) 0%, var(--s1) 100%);
  border-color: rgba(255,255,255,.10);
  /* Bump inactive opacity so names remain legible in dark mode */
  opacity: .72;
}
[data-theme="dark"] .tr-is-pcard.active{
  opacity: 1;
  background: linear-gradient(180deg, rgba(255,255,255,.06) 0%, var(--s1) 100%);
  border-color: rgba(167,139,250,.30);
  box-shadow: 0 8px 22px rgba(0,0,0,.40), 0 0 0 1px rgba(167,139,250,.10);
}
[data-theme="dark"] .tr-is-pcard-name{
  color: #f0eefa;
}
[data-theme="dark"] .tr-is-pcard-specialty{
  color: var(--tx3);
}
[data-theme="dark"] .tr-is-pcard-dot{
  border-color: var(--s1);
}

/* Question zone + active stage in dark */
[data-theme="dark"] .tr-is-question-zone,
[data-theme="dark"] .tr-is-question-area,
[data-theme="dark"] .tr-is-active-stage{
  background: var(--s1);
  border-color: rgba(255,255,255,.08);
}
[data-theme="dark"] .tr-is-asked-by{
  background: rgba(167,139,250,.10);
  color: #c4b5fd;
  border-color: rgba(167,139,250,.25);
}

/* Conversation history in dark mode */
[data-theme="dark"] .tr-is-history-head{
  background: var(--s2);
  border-color: var(--bd);
}
[data-theme="dark"] .tr-is-history-head:hover{
  background: rgba(255,255,255,.05);
}
[data-theme="dark"] .tr-is-history-body{
  background: var(--s1);
  border-color: var(--bd);
}
[data-theme="dark"] .tr-is-history-msg-user,
[data-theme="dark"] .tr-is-history-msg-ai{
  background: var(--s2);
  border-color: rgba(255,255,255,.08);
  color: var(--tx1);
}

/* Answer input area */
[data-theme="dark"] .tr-is-answer-area,
[data-theme="dark"] .tr-is-input-area,
[data-theme="dark"] textarea.tr-is-textarea{
  background: var(--s2);
  border-color: var(--bd);
  color: var(--tx1);
}
[data-theme="dark"] textarea.tr-is-textarea::placeholder{
  color: var(--tx3);
}

/* Typing indicator */
[data-theme="dark"] .tr-is-typing{
  color: var(--tx3);
}

/* Mode buttons (Type / Voice) */
[data-theme="dark"] .tr-is-mode-btn{
  background: var(--s2);
  border-color: var(--bd);
  color: var(--tx2);
}
[data-theme="dark"] .tr-is-mode-btn.active{
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  color: #fff;
  border-color: transparent;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — InterviewSession (tablet + phone)
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 960px){
  .tr-is-panel{padding:14px}
  .tr-is-pcard-photo > div{width:96px !important;height:96px !important;min-width:96px !important;min-height:96px !important}
  .tr-is-pcard-name{font-size:13px}
  .tr-is-pcard-title{font-size:11.5px}
  .tr-is-pcard-specialty{font-size:10.5px}
  .tr-is-question-zone{padding:14px 16px 18px}
}

@media (max-width: 640px){
  .tr-is-panel{padding:10px}
  .tr-is-panel-grid{gap:8px}
  .tr-is-pcard{border-radius:10px}
  .tr-is-pcard-photo{padding:10px 10px 6px}
  .tr-is-pcard-photo > div{width:74px !important;height:74px !important;min-width:74px !important;min-height:74px !important}
  .tr-is-pcard-name{font-size:11.5px;margin:4px 6px 1px}
  .tr-is-pcard-title{font-size:10.5px;margin:0 6px 1px}
  .tr-is-pcard-specialty{font-size:10px;margin:0 6px 10px}
  .tr-is-pcard-dot{width:11px;height:11px;right:16px;bottom:10px}
  .tr-is-question-zone{padding:12px 12px 14px}
  .tr-is-asked-by{font-size:10px;padding:3px 9px}
  .tr-is-history-head{padding:10px 12px;font-size:12px}
  .tr-is-textarea{min-height:80px;font-size:13.5px;padding:10px 12px}
  .tr-is-mode-btn{padding:6px 11px;font-size:12px}
  .tr-is-submit-btn{padding:10px 18px;font-size:13px}
}

@media (max-width: 420px){
  .tr-is-panel-grid{grid-template-columns:repeat(2,1fr)}
  .tr-is-pcard-photo > div{width:62px !important;height:62px !important;min-width:62px !important;min-height:62px !important}
  .tr-is-pcard-name{font-size:11px}
  .tr-is-pcard-title{font-size:10px}
  .tr-is-pcard-specialty{display:none}
}
      `}</style>

      {/* End Interview confirm — clean floating card, NO dark backdrop */}
      {showExitConfirm && (
        <EndInterviewConfirm
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={confirmExit}
        />
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

/* ─────────────────────────────────────────────────────────────────
 * End-Interview Confirm
 * Clean floating card, no dark backdrop, no scroll lock.
 * Esc key cancels. Matches the redesigned light UI.
 * ───────────────────────────────────────────────────────────────── */
function EndInterviewConfirm({ onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tr-end-interview-title"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        background: "var(--s1)",
        border: "1px solid var(--bd)",
        borderRadius: 14,
        maxWidth: 440,
        width: "calc(100% - 40px)",
        padding: 26,
        boxShadow:
          "0 24px 64px rgba(20, 14, 50, 0.18), 0 6px 20px rgba(124,58,237,0.10)",
        animation: "trEndPopIn .25s cubic-bezier(0.16, 1, 0.3, 1) both",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        color: "var(--tx1)",
      }}
    >
      <style>{`
        @keyframes trEndPopIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            display: "inline-block",
            background: "rgba(124,58,237,0.10)",
            color: "#7c3aed",
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          END INTERVIEW
        </span>
      </div>
      <h3
        id="tr-end-interview-title"
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: "var(--tx1)",
          margin: "0 0 10px",
          letterSpacing: -0.2,
        }}
      >
        End interview and view your report?
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--tx2)",
          lineHeight: 1.6,
          margin: "0 0 22px",
        }}
      >
        Your session will be wrapped up and your AI panel will compile your
        performance report. You won't be able to continue this interview after
        ending it.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 600,
            background: "transparent",
            border: "1px solid var(--bd)",
            color: "var(--tx1)",
            borderRadius: 9,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.color = "#7c3aed";
            e.currentTarget.style.background = "rgba(124,58,237,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--bd)";
            e.currentTarget.style.color = "var(--tx1)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: "9px 20px",
            fontSize: 13,
            fontWeight: 700,
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
            transition: "all .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#6d28d9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#7c3aed";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          End & View Report
        </button>
      </div>
    </div>
  );
}
