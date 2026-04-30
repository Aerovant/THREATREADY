// ═══════════════════════════════════════════════════════════════
// CYBERPREP v4 — Attack Reasoning Lab (COMPLETE)
// 12 Roles · 4 Difficulty Levels · Adaptive AI · B2C + B2B
// Dynamic Hooks · Anti-Gaming · Full Dashboard Suite
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

// ── Constants & data (extracted to constants.js) ──
import { SCENARIOS, ROLES, DIFFICULTIES, HOOK_HEADLINES, HOOK_SUBLINES, NT, DEMO_QUESTIONS, TOTAL_SC } from "./constants.js";

// ── CSS (extracted to styles.js) ──
import { CSS } from "./styles.js";

// ── Helpers and toast/confirm bridge (extracted to components/helpers.js) ──
import {
  showToast, showConfirm, noPaste, fmt, pick, useVoice
} from "./components/helpers.js";

// ── UI components (extracted to components/) ──
import ToastContainer from "./components/ToastContainer.jsx";
import NoPasteInput from "./components/NoPasteInput.jsx";
import FileUpload from "./components/FileUpload.jsx";
import ArchDiagram from "./components/ArchDiagram.jsx";
import PasswordStrength from "./components/PasswordStrength.jsx";
import AIAvatar from "./components/AIAvatar.jsx";

import HomeBtn from "./components/HomeBtn.jsx";

// ── Views (Phase 1: 5 simple views extracted) ──
import LandingView from "./views/LandingView.jsx";
import TrialRoleSelectView from "./views/TrialRoleSelectView.jsx";
import TrialCompleteView from "./views/TrialCompleteView.jsx";
import RolesView from "./views/RolesView.jsx";
import DifficultyView from "./views/DifficultyView.jsx";

import InterviewView from "./views/InterviewView.jsx";
import ResultsView from "./views/ResultsView.jsx";

import CandidateAssessView from "./views/CandidateAssessView.jsx";
import AuthView from "./views/AuthView.jsx";

import HelpTab from "./views/tabs/HelpTab.jsx";
import BadgesTab from "./views/tabs/BadgesTab.jsx";
import ScoresTab from "./views/tabs/ScoresTab.jsx";
import SettingsTab from "./views/tabs/SettingsTab.jsx";
import BillingTab from "./views/tabs/BillingTab.jsx";
import InterviewTab from "./views/tabs/InterviewTab.jsx";
import ProfileTab from "./views/tabs/ProfileTab.jsx";
import HomeTab from "./views/tabs/HomeTab.jsx";

//HR

import B2BOverviewTab from "./views/tabs/B2BOverviewTab.jsx";
import B2BCandidatesTab from "./views/tabs/B2BCandidatesTab.jsx";
import B2BTeamSkillsTab from "./views/tabs/B2BTeamSkillsTab.jsx";
import B2BReportsTab from "./views/tabs/B2BReportsTab.jsx";
import B2BCreateTab from "./views/tabs/B2BCreateTab.jsx";
import B2BLibraryTab from "./views/tabs/B2BLibraryTab.jsx";
import B2BSettingsTab from "./views/tabs/B2BSettingsTab.jsx";
import B2BHelpTab from "./views/tabs/B2BHelpTab.jsx";


// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ThreatReady() {
  // ── CORE STATE ──

  const [view, setViewState] = useState(() => {
    // ── CANDIDATE ASSESSMENT LINK — check FIRST before any other routing ──
    // Handles all these URL formats:
    //   /?assess_token=xxx              (current server format)
    //   /?token=xxx                     (on /assess path)
    //   /assess?token=xxx               (old format)
    //   /?redirect=/assess?token=xxx    (GitHub Pages 404 fallback)
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    // Check redirect param from GitHub Pages 404 fallback
    const redirect = params.get('redirect');
    if (redirect) {
      const redirectParams = new URLSearchParams(redirect.split('?')[1] || '');
      const tokenFromRedirect = redirectParams.get("assess_token") || redirectParams.get("token");
      if (tokenFromRedirect && (redirect.includes('/assess') || redirectParams.get("assess_token"))) {
        return 'candidate-assess';
      }
    }

    const assessToken = params.get("assess_token") || (path.includes('/assess') ? params.get("token") : null);
    if (assessToken) return 'candidate-assess';

    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('cyberprep_user');
    const savedUserType = localStorage.getItem('cyberprep_usertype');
    const isFreeTrial = localStorage.getItem('cyberprep_freetrial') === 'true';
    const savedView = localStorage.getItem('cyberprep_view');

    // ── UNIVERSAL REFRESH BEHAVIOR ──
    // If a saved view exists and is restorable, ALWAYS restore it.
    // Only interview/results can't be restored (they need scenario state).
    // This means refresh stays on the same page — landing, auth, trial-role-select,
    // dashboard, b2b-dashboard, etc. — without ever bouncing the user elsewhere.
    // Allow 'results' to restore if we have saved results data; 'interview' still excluded
    const hasSavedResults = !!localStorage.getItem('cyberprep_results');
    if (savedView && !(savedView === 'interview') && !(savedView === 'results' && !hasSavedResults)) {
      // Check that the view is appropriate for the current auth state
      // (e.g., logged-out users should not land on dashboard)
      if (token && savedUser) {
        // Logged-in: any view except 'landing' (logged-in users skip landing)
        if (savedView !== 'landing') return savedView;
      } else if (isFreeTrial) {
        // Free trial: any view except 'landing'
        if (savedView !== 'landing') return savedView;
      } else {
        // Not logged in, no trial: allow landing, auth, trial-role-select, candidate-assess
        if (['landing', 'auth', 'trial-role-select', 'candidate-assess'].includes(savedView)) {
          return savedView;
        }
      }
    }

    // ── FALLBACK based on auth state ──
    if (token && savedUser) {
      return savedUserType === 'b2b' ? 'b2b-dashboard' : 'dashboard';
    }
    if (isFreeTrial) return 'dashboard';
    return 'landing';
  });

  const setView = (newView) => {
    // Don't save interview to localStorage (mid-test state can't be restored).
    // Results CAN be saved now since we persist results data separately.
    if (newView !== 'interview') {
      localStorage.setItem('cyberprep_view', newView);
    }
    // Track navigation history for proper back button behavior
    setViewState(prevView => {
      if (prevView && prevView !== newView && !['interview', 'results'].includes(prevView)) {
        try {
          const histRaw = localStorage.getItem('cyberprep_nav_history');
          const hist = histRaw ? JSON.parse(histRaw) : [];
          // Avoid pushing duplicate consecutive entries
          if (hist[hist.length - 1] !== prevView) {
            hist.push(prevView);
            // Cap history to last 20 entries
            if (hist.length > 20) hist.shift();
            localStorage.setItem('cyberprep_nav_history', JSON.stringify(hist));
          }
        } catch (e) { }
      }
      return newView;
    });
  };

  // Universal "back" — pops navigation history; falls back to dashboard or landing
  const goBack = () => {
    try {
      const histRaw = localStorage.getItem('cyberprep_nav_history');
      const hist = histRaw ? JSON.parse(histRaw) : [];
      if (hist.length > 0) {
        const prevView = hist.pop();
        localStorage.setItem('cyberprep_nav_history', JSON.stringify(hist));
        if (prevView && !['interview', 'results'].includes(prevView)) {
          localStorage.setItem('cyberprep_view', prevView);
          setViewState(prevView);
          return;
        }

      }

    } catch (e) { }
    // Fallback: go to dashboard if logged-in/free-trial, else landing
    const token = localStorage.getItem('token');
    const isFreeTrial = localStorage.getItem('cyberprep_freetrial') === 'true';
    const userType = localStorage.getItem('cyberprep_usertype');
    if (token || isFreeTrial) {
      const fallback = userType === 'b2b' ? 'b2b-dashboard' : 'dashboard';
      localStorage.setItem('cyberprep_view', fallback);
      setViewState(fallback);
    } else {
      localStorage.setItem('cyberprep_view', 'landing');
      setViewState('landing');
    }
  };


  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cyberprep_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userType, setUserType] = useState(() => localStorage.getItem('cyberprep_usertype') || "b2c");
  const [authMode, setAuthMode] = useState("signup");
  const [authStep, setAuthStep] = useState("form"); // form, verify, detect, roleselect, forgot, resetcode, resetdone
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // ── SUBSCRIPTION ──
  const [subscribedRoles, setSubscribedRoles] = useState(() => {
    const saved = localStorage.getItem('subscribedRoles');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isPaid, setIsPaid] = useState(() => {
    // If user is on free trial, they're NEVER paid (regardless of stale localStorage)
    if (localStorage.getItem('cyberprep_freetrial') === 'true') {
      localStorage.removeItem('isPaid'); // clean up stale flag
      return false;
    }
    return localStorage.getItem('isPaid') === 'true';
  });
  const [freeAttempts, setFreeAttempts] = useState(2);
  // Per-role attempts tracking for free trial (2 attempts per role)
  const [roleAttempts, setRoleAttempts] = useState(() => {
    const saved = localStorage.getItem('roleAttempts');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem('roleAttempts', JSON.stringify(roleAttempts));
  }, [roleAttempts]);
  const getTotalUsedAttempts = () => Object.values(roleAttempts).reduce((sum, v) => sum + v, 0);
  const getRemainingAttempts = (roleId) => {
    const totalUsed = getTotalUsedAttempts();
    const totalRemaining = Math.max(0, 2 - totalUsed);
    return totalRemaining;
  };
  const isTrialExhausted = () => {
    if (isPaid || subscribedRoles.length === 0) return false;
    return getTotalUsedAttempts() >= 2;
  };

  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [trialRoles, setTrialRoles] = useState(() => {
    const saved = localStorage.getItem('trialRoles');
    return saved ? JSON.parse(saved) : [];
  });

  // ── SCENARIO STATE ──
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('cyberprep_active_role') || null;
  });

  const [interviewPersona, setInterviewPersona] = useState('standard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null); const [dailyAnswered, setDailyAnswered] = useState(false);
  const [dailyChallengeError, setDailyChallengeError] = useState(false);
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [dailyResult, setDailyResult] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [scenarioHistory, setScenarioHistory] = useState([]);
  // Local in-memory session history (works for free trial users who have no backend account)
  // Persisted to localStorage so data survives refresh
  const [localSessionHistory, setLocalSessionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_local_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('cyberprep_local_sessions', JSON.stringify(localSessionHistory));
  }, [localSessionHistory]);
  const [activeDifficulty, setActiveDifficulty] = useState(() => {
    return localStorage.getItem('cyberprep_active_difficulty') || null;
  });
  const [scenario, setScenario] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_scenario');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [currentQ, setCurrentQ] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [askedQs, setAskedQs] = useState([]);

  const [results, setResults] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_results');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showChain, setShowChain] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef(null);
  const voice = useVoice();

  // ── DEMO STATE ──
  const [demoQ] = useState(() => pick(DEMO_QUESTIONS));
  const [demoAnswer, setDemoAnswer] = useState("");
  const [demoScore, setDemoScore] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoInputMode, setDemoInputMode] = useState("text");

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackInputMode, setFeedbackInputMode] = useState("text");
  const feedbackVoice = useVoice();

  const demoVoice = useVoice();
  // Daily challenge voice + input mode
  const dailyVoice = useVoice();
  const [dailyInputMode, setDailyInputMode] = useState("text");
  // ---------------Mute------------------
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── DYNAMIC HOOKS ──
  const [hookHeadline] = useState(() => pick(HOOK_HEADLINES));
  const [hookSubline] = useState(() => pick(HOOK_SUBLINES));

  // ── PROFILE STATE ──
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeAiData, setResumeAiData] = useState(null); // {skills, recommended_difficulty, weak_areas, recommended_roles}
  const [readiness, setReadiness] = useState(null); // {overall_readiness, technical, communication, decision, total_sessions, has_data}
  const [jdText, setJdText] = useState("");
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('cyberprep_xp') || '0'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('cyberprep_streak') || '0'));
  const [completedScenarios, setCompletedScenarios] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberprep_completed_scenarios');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // Persist stats to localStorage

  useEffect(() => {
    if (activeRole) localStorage.setItem('cyberprep_active_role', activeRole);
    else localStorage.removeItem('cyberprep_active_role');
  }, [activeRole]);

  useEffect(() => {
    if (activeDifficulty) localStorage.setItem('cyberprep_active_difficulty', activeDifficulty);
    else localStorage.removeItem('cyberprep_active_difficulty');
  }, [activeDifficulty]);

  useEffect(() => {
    if (scenario) {
      try { localStorage.setItem('cyberprep_scenario', JSON.stringify(scenario)); } catch {}
    }
  }, [scenario]);

  useEffect(() => { localStorage.setItem('cyberprep_streak', String(streak)); }, [streak]);
  useEffect(() => {
    localStorage.setItem('cyberprep_completed_scenarios', JSON.stringify(completedScenarios));
  }, [completedScenarios]);

  // ── AUTH STATE ──
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ── DASHBOARD TABS ──
  const [dashTab, setDashTab] = useState(() => localStorage.getItem('cyberprep_tab') || "home");
  const [b2bTab, setB2bTab] = useState(() => localStorage.getItem('cyberprep_b2btab') || "overview");
  const [settingsName, setSettingsName] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [inLeaderboard, setInLeaderboard] = useState(true);
  const [allowBenchmarking, setAllowBenchmarking] = useState(false);

  // ── B2B STATE ──
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [b2bStats, setB2bStats] = useState({ total_candidates: 0, assessed: 0, total_assessments: 0, avg_score: 0 });
  const [b2bLoading, setB2bLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('cloud');
  const [inviteDiff, setInviteDiff] = useState('intermediate');
  const [inviteAssessmentId, setInviteAssessmentId] = useState('');
  const [inviteMode, setInviteMode] = useState('individual'); // 'individual' | 'multiple' | 'csv'
  const [inviteMultipleEmails, setInviteMultipleEmails] = useState('');
  const [inviteCsvFile, setInviteCsvFile] = useState(null);
  const [inviteParsedEmails, setInviteParsedEmails] = useState([]);
  // Search states
  const [candidatesSearch, setCandidatesSearch] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [reportModal, setReportModal] = useState(null); // holds candidate report data
  const [teamSkillsSearch, setTeamSkillsSearch] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  // Filter helper
  const filterBySearch = (items, search, getName, getEmail, getDate) => {
    if (!search?.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(item => {
      const name = (getName(item) || '').toLowerCase();
      const email = (getEmail(item) || '').toLowerCase();
      const date = (getDate(item) || '').toLowerCase();
      return name.includes(q) || email.includes(q) || date.includes(q);
    });
  };
  const [inviteMsg, setInviteMsg] = useState('');
  const [newAssessName, setNewAssessName] = useState('');
  const [newAssessRole, setNewAssessRole] = useState('cloud');
  const [newAssessDiff, setNewAssessDiff] = useState('intermediate');
  const [newAssessType, setNewAssessType] = useState('standard');
  const [newAssessQuestionCount, setNewAssessQuestionCount] = useState(5);
  const [assessMsg, setAssessMsg] = useState('');
  // ── CANDIDATE ASSESSMENT STATE ──
  const [candidateToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    // Check redirect param (GitHub Pages 404 fallback)
    const redirect = params.get('redirect');
    if (redirect) {
      const redirectParams = new URLSearchParams(redirect.split('?')[1] || '');
      const t = redirectParams.get("assess_token") || redirectParams.get("token");
      if (t) return t;
    }

    return params.get("assess_token") || (path.includes('/assess') ? params.get("token") : "") || "";
  });
  const [candidateAssessState, setCandidateAssessState] = useState('loading');
  const [candidateAssessData, setCandidateAssessData] = useState(null);
  const [candidateAssessError, setCandidateAssessError] = useState('');
  const [candidateQIndex, setCandidateQIndex] = useState(0);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [candidateResult, setCandidateResult] = useState(null);
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('5-10');
  const [companySettingsMsg, setCompanySettingsMsg] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [integrationMsg, setIntegrationMsg] = useState('');

  // ═══════════════════════════════════════════════════════════════
  // B2B HR SUBSCRIPTION STATE (separate from B2C isPaid)
  // ═══════════════════════════════════════════════════════════════
  const [isHrPaid, setIsHrPaid] = useState(() => localStorage.getItem('cyberprep_hr_paid') === 'true');
  const [showHrSubscribeModal, setShowHrSubscribeModal] = useState(false);
  const [hrBillingPeriod, setHrBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [hrModalCompanyName, setHrModalCompanyName] = useState('');
  const [hrModalTeamSize, setHrModalTeamSize] = useState('11-50');

  // HR pricing tiers (FINALIZED)
  // Team Starter: 5-10 people  → ₹2,999/mo
  // Team Pro:     11-50 people → ₹7,999/mo
  // Enterprise:   50+ people   → Custom pricing (Contact Sales)
  // Yearly = Monthly × 12 × 0.8 (20% discount)
  const HR_PRICING = {
    '5-10': { monthly: 2999, yearly: 28790, label: 'Team Starter · 5-10 people', planName: 'Team Starter' },
    '11-50': { monthly: 7999, yearly: 76790, label: 'Team Pro · 11-50 people', planName: 'Team Pro' },
    '50+': { monthly: 0, yearly: 0, label: 'Enterprise · 50+ people (Contact Sales)', planName: 'Enterprise', contactSales: true }
  };
  const [newAssessJD, setNewAssessJD] = useState('');
  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  // teamMembers is derived from real candidates data
  const teamMembers = candidates
    .filter(c => c.status === 'completed' && c.overall_score)
    .map(c => ({
      id: c.id,
      name: c.candidate_name || c.candidate_email,
      role: c.role_id,
      score: parseFloat(c.overall_score) || 0,
      difficulty: c.difficulty,
      completed_at: c.completed_at
    }));

  // ── SCORE HISTORY (computed from real session history in useEffect) ──
  const [scoreHistory, setScoreHistory] = useState([]);
  const [weaknessTracker, setWeaknessTracker] = useState([]);

  // ── BADGES ──
  // Badges are earned per role by completing assessments with Bronze+ score
  // Computed from backend session history (see useEffect below)
  const [badges, setBadges] = useState([]);



  /// ── LOAD DASHBOARD DATA FROM BACKEND ──
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check subscription on restore
    fetch('https://threatready-db.onrender.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      // Safe parser: subscribed_roles may be a string OR already an array (jsonb)
      const raw = data.user?.subscribed_roles;
      let roles = [];
      if (Array.isArray(raw)) roles = raw;
      else if (typeof raw === 'string') {
        try { const v = JSON.parse(raw); roles = Array.isArray(v) ? v : []; } catch (e) { roles = []; }
      }
      const isActivePaid = data.user?.plan === 'paid' && data.user?.status === 'active';
      if (isActivePaid && roles.length > 0) {
        setIsPaid(true);
        setSubscribedRoles(roles);
        localStorage.setItem('subscribedRoles', JSON.stringify(roles));
        localStorage.setItem('isPaid', 'true');
      } else {
        setIsPaid(false);
        setSubscribedRoles([]);
        localStorage.removeItem('subscribedRoles');
        localStorage.removeItem('isPaid');
      }
      // HR subscription (separate from B2C)
      if (data.user?.hr_subscription_active === true || data.user?.hr_paid === true) {
        setIsHrPaid(true);
        localStorage.setItem('cyberprep_hr_paid', 'true');
      }
    }).catch(err => {
      console.log('Subscription refresh failed, keeping cached values:', err?.message);
    });

    fetch('https://threatready-db.onrender.com/api/scores', {

      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.stats) {
          setXp(data.stats.total_xp || 0);
          setStreak(data.stats.streak || 0);
          try {
            const sc = typeof data.stats.completed_scenarios === 'string'
              ? JSON.parse(data.stats.completed_scenarios)
              : data.stats.completed_scenarios || [];
            setCompletedScenarios(sc);
          } catch (e) { }
        }
      })


      .catch(err => console.log('Dashboard load error:', err));

    // Load profile data — RESUME IS NEVER AUTO-LOADED
    // User must re-upload or re-enter resume each session for fresh start
    // (Career goals like target_role/experience_level are still auto-loaded since they're profile setup)
    fetch('https://threatready-db.onrender.com/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        // Only restore career goals — resume stays empty for fresh experience
        if (data.user?.target_role) setTargetRole(data.user.target_role);
        if (data.user?.experience_level) setExperienceLevel(data.user.experience_level);
        // Resume is intentionally NOT loaded — keeps Profile tab clean on each login
      })
      .catch(err => console.log('Profile load error:', err));

    // Load Interview Readiness Score (real, computed from completed sessions)
    fetch('https://threatready-db.onrender.com/api/readiness', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setReadiness(data);
      })
      .catch(err => console.log('Readiness load error:', err));
  }, [user]);

  // ── B2B DATA LOADER ──
  const loadB2bData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setB2bLoading(true);
    try {
      const [sr, cr, ar] = await Promise.all([
        fetch('https://threatready-db.onrender.com/api/b2b/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://threatready-db.onrender.com/api/b2b/candidates', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://threatready-db.onrender.com/api/b2b/assessments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const stats = await sr.json(); if (!stats.error) setB2bStats(stats);
      const cands = await cr.json(); if (cands.candidates) setCandidates(cands.candidates);
      const assess = await ar.json(); if (assess.assessments) setAssessments(assess.assessments);
    } catch (e) { console.log('B2B load error:', e.message); }
    setB2bLoading(false);
  };
  useEffect(() => {
    if (view === 'b2b-dashboard') {
      loadB2bData();
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://threatready-db.onrender.com/api/b2b/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (data.settings) {
            setCompanyName(data.settings.company_name || '');
            setTeamSize(data.settings.team_size || '5-10');
            setSlackWebhook(data.settings.slack_webhook || '');
            setZapierWebhook(data.settings.zapier_webhook || '');
          }
        }).catch(e => console.log('B2B settings load:', e.message));
      }
    }
  }, [view]);

  // Load leaderboard, notifications, daily challenge, scenario history
  const loadDashboardExtras = async () => {
    const token = localStorage.getItem('token');
    // Only fetch backend data if logged in
    if (token) {
      try {
        const [lbRes, notifRes, dcRes, histRes] = await Promise.all([
          fetch('https://threatready-db.onrender.com/api/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/daily-challenge', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://threatready-db.onrender.com/api/scenario-history', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const lb = await lbRes.json();
        const notif = await notifRes.json();
        const dc = await dcRes.json();
        const hist = await histRes.json();
        if (lb.leaderboard) { setLeaderboard(lb.leaderboard); setMyRank(lb.my_rank); }
        if (notif.notifications) { setNotifications(notif.notifications); setUnreadCount(notif.unread_count || 0); }
        if (dc.challenge) {
          setDailyChallenge(dc.challenge);
          setDailyAnswered(dc.already_answered);
          setDailyChallengeError(false);
          if (dc.response) setDailyResult(dc.response);
        } else if (dc.error || !dc.challenge) {
          // Backend returned error or no challenge → show error state
          setDailyChallengeError(true);
        }
        if (hist.history) {
          setScenarioHistory(hist.history.map(h => h.scenario_id));
        }
      } catch (e) {
        console.log('Dashboard extras load error:', e.message);
        setDailyChallengeError(true); // Network/fetch failure
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPUTE STATS (badges, score trends, weakness tracker)
  // Works for BOTH logged-in users (backend history) AND free trial users (local history)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Pick whichever history source has data — logged in users get backend, free trial get local
    const token = localStorage.getItem('token');
    let sourceHistory = [];

    if (token) {
      // For logged-in users: ALWAYS fetch fresh history from backend
      fetch('https://threatready-db.onrender.com/api/scenario-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        if (data.history && data.history.length > 0) {
          computeStats(data.history);
        } else {
          // Backend returned empty - fall back to local session history
          computeStats(localSessionHistory);
        }
      }).catch(() => computeStats(localSessionHistory));
    } else {
      // Free trial user (no token): use local session history
      computeStats(localSessionHistory);
    }

    function computeStats(history) {
      if (!history || history.length === 0) {
        setBadges([]);
        setScoreHistory([]);
        setWeaknessTracker([]);
        return;
      }

      // ── Badges ──
      const bestByRole = {};
      history.forEach(h => {
        const score = parseFloat(h.score) || 0;
        if (score < 4) return;
        if (!bestByRole[h.role_id] || score > bestByRole[h.role_id].score) {
          bestByRole[h.role_id] = { score, completed_at: h.completed_at };
        }
      });
      const computedBadges = Object.entries(bestByRole).map(([role_id, data]) => {
        const tier = data.score >= 8 ? "platinum"
          : data.score >= 7 ? "gold"
            : data.score >= 6 ? "silver"
              : "bronze";
        const roleName = ROLES.find(r => r.id === role_id)?.name || role_id;
        const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
        return {
          role: role_id, tier,
          name: `${tierLabel} ${roleName}`,
          earned: data.completed_at ? String(data.completed_at).substring(0, 10) : ''
        };
      });
      setBadges(computedBadges);

      // ── Score Trends ──
      const sortedHistory = [...history].sort((a, b) =>
        new Date(a.completed_at || 0) - new Date(b.completed_at || 0)
      );
      const trendsData = sortedHistory.map((h, i) => {
        const point = { date: `Attempt ${i + 1}` };
        point[h.role_id] = parseFloat(h.score) || 0;
        return point;
      });
      setScoreHistory(trendsData);

      // ── Weakness Tracker ──
      const scoresByRole = {};
      history.forEach(h => {
        const score = parseFloat(h.score) || 0;
        if (!scoresByRole[h.role_id]) scoresByRole[h.role_id] = [];
        scoresByRole[h.role_id].push({ score, completed_at: h.completed_at });
      });
      const weaknesses = Object.entries(scoresByRole).map(([roleId, attempts]) => {
        const avg = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
        let trend = "→";
        if (attempts.length >= 2) {
          const sorted = [...attempts].sort((a, b) => new Date(a.completed_at || 0) - new Date(b.completed_at || 0));
          const first = sorted[0].score;
          const last = sorted[sorted.length - 1].score;
          if (last > first + 0.5) trend = "↑";
          else if (last < first - 0.5) trend = "↓";
        }
        const roleName = ROLES.find(r => r.id === roleId)?.name || roleId;
        return { area: roleName, avg: Math.round(avg * 10) / 10, trend, attempts: attempts.length };
      }).sort((a, b) => a.avg - b.avg);
      setWeaknessTracker(weaknesses);
    }
  }, [localSessionHistory, scenarioHistory, user]);

  useEffect(() => {
    if (view === 'dashboard' || view === 'b2b-dashboard') {
      loadDashboardExtras();
      // Load user settings (privacy preferences)
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://threatready-db.onrender.com/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (data.settings) {
            if (data.settings.profile_public !== undefined) setProfilePublic(data.settings.profile_public);
            if (data.settings.in_leaderboard !== undefined) setInLeaderboard(data.settings.in_leaderboard);
            if (data.settings.allow_benchmarking !== undefined) setAllowBenchmarking(data.settings.allow_benchmarking);
            if (data.settings.name) setSettingsName(data.settings.name);
          }
        }).catch(e => console.log('Settings load:', e.message));
      }

      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        const t = localStorage.getItem('token');
        if (!t) return;
        fetch('https://threatready-db.onrender.com/api/notifications', { headers: { 'Authorization': `Bearer ${t}` } })
          .then(r => r.json())
          .then(data => {
            if (data.notifications) {
              setNotifications(data.notifications);
              setUnreadCount(data.unread_count || 0);
            }
          }).catch(() => { });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // ── STOP VOICE ON REFRESH/UNLOAD ──
  useEffect(() => {
    const handleUnload = () => {
      window.speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);


  // ── CANDIDATE ASSESSMENT LOADER ──
  useEffect(() => {
    if (view !== 'candidate-assess' || !candidateToken) return;
    fetch(`https://threatready-db.onrender.com/api/candidate/assessment?token=${candidateToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.error === "already_completed") {
          setCandidateAssessState("already_done");
        } else if (data.error) {
          setCandidateAssessState("error");
          setCandidateAssessError(data.error);
        } else {
          setCandidateAssessData(data);
          setCandidateAssessState("intro");
        }
      })
      .catch(() => {
        setCandidateAssessState("error");
        setCandidateAssessError("Cannot connect to server. Please try again.");
      });
  }, []);

  // ── GITHUB PAGES 404 REDIRECT HANDLER ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.history.replaceState(null, '', redirect);
    }
  }, []);

  // ── OAUTH CALLBACK HANDLER ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");
    const error = params.get("error");
    const provider = params.get("provider") || "google";

    // Skip if this is a candidate assessment link, not OAuth
    if (params.get("assess_token")) return;

    // Only run if URL has OAuth params - ignore on normal refresh
    if (!token && !error) return;

    if (error) {
      setAuthError("Google sign in failed. Please try again.");
      setView("auth");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (token && email) {
      localStorage.setItem("token", token);
      localStorage.setItem('cyberprep_session_start', Date.now().toString());
      const newUser = { name, email };
      localStorage.setItem('cyberprep_user', JSON.stringify(newUser));
      setUser(newUser);
      setSettingsName("");    // ← ADD THIS LINE HERE
      const type = detectUserType(email);

      setUserType(type);
      localStorage.setItem('cyberprep_usertype', type);
      localStorage.setItem('cyberprep_user', JSON.stringify({ name, email }));

      // Clean URL first
      window.history.replaceState({}, "", "/");

      // Show toast
      const toast = document.createElement("div");

      toast.innerHTML = `
      <div style="
        position:fixed; top:24px; left:50%; transform:translateX(-50%);
        background:#111827; border:1px solid #00e5ff;
        border-radius:12px; padding:16px 24px;
        display:flex; align-items:center; gap:12px;
        z-index:9999; box-shadow:0 0 30px rgba(0,229,255,0.2);
        overflow:hidden; min-width:280px;
      ">
        <img src="${provider === 'github' ? 'https://github.com/favicon.ico' : 'https://www.google.com/favicon.ico'}" width="20" height="20" />
        <div>
          <div style="color:#00e5ff;font-weight:700;font-size:13px">${provider === 'github' ? 'GitHub' : 'Google'} Sign In Successful</div>
          <div style="color:#8890b0;font-size:11px;margin-top:2px">Welcome, ${name}!</div>
        </div>

        <div style="color:#00e096;font-size:20px position:absolute; bottom:0; left:0;
          height:3px; background:#00e5ff; border-radius:0 0 12px 12px;
          animation:progress 2s linear forwards;" >✓</div>
        </div>
    `;
      document.body.appendChild(toast);

      // Go to dashboard immediately, toast shows on top
      if (type === "b2b") { setView("b2b-dashboard"); } else { setView("dashboard"); }

      // Remove toast after 2 seconds
      setTimeout(() => {
        toast.remove();
      }, 2000);
    }
  }, []);

  // ── TIMER ──
  useEffect(() => {
    if (view === "interview") {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      return () => {
        clearInterval(timerRef.current);
        window.speechSynthesis.cancel();
      };
    }
    return () => {
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [view]);

  // ── ANTI-CHEAT: Tab Switch / Focus Loss Detection ──
  useEffect(() => {
    if (view !== "interview") return;


    // Block right-click context menu (prevents inspect element / save / copy options)
    const handleContextMenu = (e) => { e.preventDefault(); return false; };

    // Block keyboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, F12, Ctrl+Shift+I
    const handleKeyDown = (e) => {
      // Allow typing in input fields
      const tag = e.target.tagName;
      const isInputField = tag === 'TEXTAREA' || tag === 'INPUT';

      // Block dev tools (F12 + Ctrl+Shift+I + Ctrl+Shift+J + Ctrl+U)
      if (e.key === 'F12') { e.preventDefault(); showToast("Dev tools blocked during attempt", "warning"); return; }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        showToast("Dev tools blocked during attempt", "warning");
        return;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return; }

      // Block copy/paste/cut/select-all OUTSIDE input fields (questions can't be copied)
      if (!isInputField && e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [view]);

  // ── DETECT B2C/B2B ──

  const detectUserType = (email, userFromDB) => {
    console.log('detectUserType called:', email, 'userFromDB:', userFromDB);
    if (userFromDB?.user_type) {
      console.log('Using DB user_type:', userFromDB.user_type);
      return userFromDB.user_type;
    }

    // Check if user has access to a specific role
    const hasRoleAccess = (roleId) => {
      if (subscribedRoles.includes(roleId)) return true;   // paid for this role
      if (freeAttempts > 0 && !isPaid) return true;        // free trial
      return false;
    };

    const personalDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
      "protonmail.com", "icloud.com", "aol.com", "mail.com",
      "yahoo.in", "rediffmail.com", "live.com", "msn.com"
    ];
    const domain = email.split("@")[1]?.toLowerCase();
    console.log('Domain detected:', domain, 'Result:', personalDomains.includes(domain) ? "b2c" : "b2b");
    return personalDomains.includes(domain) ? "b2c" : "b2b";
  };


  // ── AUTH HANDLER ──
  const handleAuth = async (e) => {
    e?.preventDefault();
    setAuthError("");

    if (authMode === "signup") {
      if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }
      if (authPassword.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
      if (!agreeTerms) { setAuthError("Please accept Terms and Privacy Policy"); return; }

      setIsAuthenticating(true);
      try {
        const res = await fetch("https://threatready-db.onrender.com/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || "Signup failed"); return; }

        // OTP will be sent when user picks user type (Hiring/Preparing) — not here
        // This avoids sending OTP twice

        // Go to hiring or preparing choice first
        const detectedType = detectUserType(authEmail, null);
        setUserType(detectedType);
        setAuthStep("detect");

      } catch (err) {
        setAuthError("Cannot connect to server.");
      } finally {
        setIsAuthenticating(false);
      }

    } else {
      // LOGIN
      if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }

      setIsAuthenticating(true);
      try {
        const res = await fetch("https://threatready-db.onrender.com/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || "Login failed"); return; }

        // Save token
        // Clear old user data first
        localStorage.removeItem('cyberprep_user');
        localStorage.removeItem('cyberprep_usertype');

        // Reset all state
        setSettingsName('');
        setResumeText('');
        setTargetRole('');
        setExperienceLevel('');
        setXp(0);
        setStreak(0);
        setCompletedScenarios([]);
        setIsPaid(false);
        setFreeAttempts(2);

        // Save new user
        localStorage.setItem("token", data.token);
        localStorage.setItem('cyberprep_session_start', Date.now().toString());
        localStorage.setItem('cyberprep_user', JSON.stringify(data.user));
        setUser(data.user);
        setSettingsName(data.user.name || '');

        // Check subscription status
        fetch('https://threatready-db.onrender.com/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        }).then(r => r.json()).then(meData => {
          // Only set isPaid TRUE if user actually has active paid plan (not free trial)
          if (meData.user?.plan === 'paid' && meData.user?.status === 'active') {
            setIsPaid(true);
            setUser(data.user);
            setSettingsName(data.user.name || '');
            setSubscribedRoles(JSON.parse(meData.user.subscribed_roles || '[]'));
          } else {
            setIsPaid(false);
            setFreeAttempts(2);
          }
        }).catch(() => { });

        // After login, load subscription data
        const meRes = await fetch("https://threatready-db.onrender.com/api/auth/me", {
          headers: { "Authorization": `Bearer ${data.token}` }
        });
        const meData = await meRes.json();
        if (meData.user?.subscribed_roles) {
          const roles = typeof meData.user.subscribed_roles === 'string'
            ? JSON.parse(meData.user.subscribed_roles)
            : meData.user.subscribed_roles || [];
          setSubscribedRoles(roles);
          // CRITICAL: Only set isPaid TRUE if user has paid plan (NOT just because they have roles)
          // Free trial users also have roles in subscribed_roles, but they are NOT paid
          const isActivelyPaid = meData.user?.plan === 'paid' && meData.user?.status === 'active';
          setIsPaid(isActivelyPaid);
          if (isActivelyPaid) {
            localStorage.setItem('isPaid', 'true');
          } else {
            localStorage.removeItem('isPaid');
          }
        }
        setSettingsName(data.user.name || '');

        const type = detectUserType(authEmail);
        console.log('TYPE DETECTED:', type);
        setUserType(type);
        localStorage.setItem('cyberprep_usertype', type);

        // If user signed up as B2B and entered company info, save it now
        const pendingCompanyName = localStorage.getItem('cyberprep_company_name');
        const pendingTeamSize = localStorage.getItem('cyberprep_team_size');
        if (type === 'b2b' && pendingCompanyName && pendingTeamSize) {
          try {
            await fetch('https://threatready-db.onrender.com/api/settings/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
              body: JSON.stringify({
                name: data.user.name || '',
                company_name: pendingCompanyName,
                team_size: pendingTeamSize
              })
            });
            setCompanyName(pendingCompanyName);
            setTeamSize(pendingTeamSize);
            localStorage.removeItem('cyberprep_company_name');
            localStorage.removeItem('cyberprep_team_size');
            console.log('HR company info saved on login:', pendingCompanyName, pendingTeamSize);
          } catch (e) { console.log('Save company info failed:', e.message); }
        }

        console.log('SETTING VIEW TO:', type === "b2b" ? "b2b-dashboard" : "dashboard");
        if (type === "b2b") { setView("b2b-dashboard"); } else { setView("dashboard"); }

      } catch (err) {
        setAuthError("Cannot connect to server. Is backend running on port 4000?");
      } finally {
        setIsAuthenticating(false);
      }
    }
  };




  // ── VERIFY EMAIL ──
  const verifyEmail = async () => {
    // Send OTP immediately after signup - no detect step needed
    try {
      await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
    } catch (e) {
      console.log('OTP send error:', e.message);
    }
    setOtpCode("");
    setOtpError("");
    setAuthStep("verify");
  };

  // ── CONFIRM USER TYPE ──
  const confirmUserType = async (type) => {
    setUserType(type);
    localStorage.setItem('cyberprep_usertype', type);

    if (type === 'b2b') {
      // B2B Flow: Go to Company Name + Team Size step BEFORE sending OTP
      // Pre-fill if we already have values
      if (!hrModalCompanyName) setHrModalCompanyName(companyName || '');
      if (!hrModalTeamSize) setHrModalTeamSize(teamSize || '5-10');
      setAuthStep("company-info");
      return;
    }

    // B2C Flow: Send OTP directly and go to verify
    try {
      await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
    } catch (e) { }
    setOtpCode("");
    setOtpError("");
    setAuthStep("verify");
  };

  // ── CONFIRM COMPANY INFO (B2B step) ──
  const confirmCompanyInfo = async () => {
    if (!hrModalCompanyName.trim()) {
      showToast('Please enter your company name', 'error');
      return;
    }
    if (!hrModalTeamSize) {
      showToast('Please select team size', 'error');
      return;
    }
    // Save to state and localStorage so HR dashboard knows company info
    setCompanyName(hrModalCompanyName);
    setTeamSize(hrModalTeamSize);
    localStorage.setItem('cyberprep_company_name', hrModalCompanyName);
    localStorage.setItem('cyberprep_team_size', hrModalTeamSize);

    // Send OTP and go to verify step
    try {
      await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
    } catch (e) { }
    setOtpCode("");
    setOtpError("");
    setAuthStep("verify");
  };

  // ── SCENARIO LOGIC ──

  const startScenario = async (sc, diff) => {
    // ── ROLE ACCESS CHECK ──
    const roleInTrial = subscribedRoles.includes(activeRole);
    const remaining = getRemainingAttempts(activeRole);
    const hasAccess = isPaid || (roleInTrial && remaining > 0);
    if (!hasAccess) {
      if (roleInTrial && remaining === 0) {
        setView("trial-complete");
        return;
      }
      showToast('Subscribe to ' + (ROLES.find(r => r.id === activeRole)?.name || activeRole) + ' to unlock access.', 'warning');
      setView("dashboard");
      setDashTab("billing");
      return;
    }

    // Create session in backend FIRST to get session_id
    // Create session in backend FIRST to get session_id (works for both logged-in and trial users)
    let newSessionId = null;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('https://threatready-db.onrender.com/api/session/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenario_id: sc.id,
          interview_mode: false,
          role_id: activeRole || 'cloud',
          difficulty: diff || 'beginner',
          is_trial: !token
        })
      });
      const data = await res.json();
      newSessionId = data.session_id;
      setSessionId(data.session_id);
      window.__sessionId = data.session_id;
    } catch (e) {
      console.log('Session start error:', e);
    }

    // Then set all state and show interview
    const first = sc.po[0];
    setScenario(sc);
    setActiveDifficulty(diff || "beginner");
    setEvaluations([]); setAnswers({}); setQIndex(0);
    setElapsed(0); setShowHint(false); setShowChain(false);
    setCurrentQ(first); setAskedQs([first.id]);
    voice.reset();
    setView("interview");
    setTimeout(() => speakQuestion(first.t, 0), 800);

    // Decrement per-role attempt (only for trial users)
    if (!isPaid) {
      setRoleAttempts(prev => ({ ...prev, [activeRole]: (prev[activeRole] || 0) + 1 }));
    }
  };

  // ── SPEAK QUESTION ──

  const speakQuestion = (text, forceIndex) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    // ARIA = female voice (even qIndex: 0,2,4)
    // NEXUS = male voice (odd qIndex: 1,3)
    const idx = forceIndex !== undefined ? forceIndex : qIndex;
    const useFemale = idx % 2 === 0;

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // HIGH-QUALITY voice priority list (ordered best → fallback)
      // These are the clearest, most natural voices across browsers/OS
      // Premium "neural" / "natural" voices come first
      const femalePriority = [
        'Google UK English Female',        // Chrome — very clear
        'Microsoft Aria Online (Natural)', // Edge — neural, premium
        'Microsoft Jenny Online (Natural)',// Edge — neural, professional
        'Microsoft Zira',                   // Windows — clear
        'Samantha',                         // macOS — natural, clear
        'Karen',                            // macOS (Australian) — professional
        'Victoria',                         // macOS — clear
        'Tessa',                            // macOS — clear
        'Moira',                            // macOS (Irish) — clear
        'Google US English'                 // Chrome — female US
      ];

      const malePriority = [
        'Google UK English Male',          // Chrome — very clear
        'Microsoft Guy Online (Natural)',  // Edge — neural, premium
        'Microsoft Davis Online (Natural)',// Edge — neural, professional
        'Microsoft David',                  // Windows — clear
        'Daniel',                           // macOS (British) — very clear
        'Alex',                             // macOS — natural, professional
        'Fred',                             // macOS — clear
        'Oliver',                           // macOS (British)
        'Aaron'                             // macOS
      ];

      // Find the best voice by priority — match partial name
      const findBestVoice = (priorityList) => {
        for (const preferredName of priorityList) {
          const match = voices.find(v => v.name.includes(preferredName) && v.lang.startsWith('en'));
          if (match) return match;
        }
        return null;
      };

      // Generic English fallback (any English voice)
      const englishFallback = voices.find(v =>
        v.lang === 'en-US' || v.lang === 'en-GB' || v.lang === 'en-IN' || v.lang.startsWith('en')
      );

      let selectedVoice = null;
      if (useFemale) {
        selectedVoice = findBestVoice(femalePriority) || englishFallback || voices[0];
      } else {
        selectedVoice = findBestVoice(malePriority) || englishFallback || voices[0];
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      // Speech parameters — tuned for MAXIMUM CLARITY
      // Slower rate = easier for beginners to understand
      // Natural pitch (not too high/low) = professional sound
      utterance.rate = 0.85;   // Slower than default for clarity (was 0.88-0.92)
      utterance.pitch = 1.0;   // Natural pitch for both (was 0.8-1.2 — sounded robotic)
      utterance.volume = 1.0;  // Full volume

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      console.log(useFemale ? 'ARIA speaking (female)' : 'NEXUS speaking (male)', '—', selectedVoice?.name || 'default voice');
    };

    // Wait for voices to load if not ready yet
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    } else {
      doSpeak();
    }
  };
  // ── AI EVALUATION ──
  const evaluateAnswer = async (question, answer, sc) => {
    try {
      const token = localStorage.getItem('token');
      // Use window.__sessionId as fallback in case React state hasn't updated yet
      const sid = sessionId || window.__sessionId || null;
      console.log('[EVAL] session_id:', sid, 'question_id:', question.id);
      const r = await fetch("https://threatready-db.onrender.com/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (token || '')
        },
        body: JSON.stringify({
          question: question.t,
          answer: answer,
          difficulty: activeDifficulty,
          session_id: sid,
          question_id: String(question.id),
          resume_context: resumeText || '',
          jd_context: jdAnalysis?.assessment_context || '',
          scenario_context: {
            title: sc.ti,
            description: sc.de,
            category: question.ca
          }
        })
      });

      const result = await r.json();
      console.log('[EVAL]', r.status, result.score, result.strengths?.substring(0, 40));

      // Server returned an error
      if (result.error || r.status >= 400) {
        console.error('[EVAL ERROR]', result.error);
        return {
          score: 5, category: question.ca,
          strengths: "Evaluation failed",
          weaknesses: "Server error: " + (result.error || "Unknown"),
          improved_answer: "-",
          communication_score: 5, depth_score: 5, decision_score: 5,
          follow_up_question: "What additional considerations would you factor in?",
          follow_up_category: question.ca
        };
      }

      return {
        score: result.score ?? 5,
        category: result.category || question.ca,
        strengths: result.strengths || "",
        weaknesses: result.weaknesses || "",
        improved_answer: result.improved_answer || "",
        communication_score: result.communication_score ?? 5,
        depth_score: result.depth_score ?? 5,
        decision_score: result.decision_score ?? 5,
        // 5 skill scores for radar chart
        iam_score: result.iam_score ?? result.score ?? 5,
        detection_score: result.detection_score ?? result.score ?? 5,
        remediation_score: result.remediation_score ?? result.score ?? 5,
        architecture_score: result.architecture_score ?? result.score ?? 5,
        communication_skill_score: result.communication_skill_score ?? result.communication_score ?? result.score ?? 5,
        follow_up_question: result.follow_up_topic || "What additional considerations would you factor in?",
        follow_up_category: result.follow_up_category || question.ca
      };

    } catch (e) {
      console.error("[EVAL NETWORK ERROR]", e.message);
      return {
        score: 5, category: question.ca,
        strengths: "Network error",
        weaknesses: "Cannot reach server: " + e.message,
        improved_answer: "-",
        communication_score: 5, depth_score: 5, decision_score: 5,
        follow_up_question: "What additional considerations would you factor in?",
        follow_up_category: question.ca
      };
    }
  };

  // ── SUBMIT ANSWER ──
  const submitAnswer = async () => {
    const ans = answers[currentQ.id] || voice.transcript;
    if (!ans?.trim()) return;
    setLoading(true);
    const ev = await evaluateAnswer(currentQ, ans, scenario);
    const newEvals = [...evaluations, { ...ev, question_id: currentQ.id, user_answer: ans, question_text: currentQ.t }];
    setEvaluations(newEvals);

    if (askedQs.length < 5) {
      // Adaptive: use AI's follow-up question
      const nextQ = {
        id: `adaptive_${askedQs.length + 1}`,
        ca: ev.follow_up_category || currentQ.ca,
        t: ev.follow_up_question || scenario.po[Math.min(askedQs.length, scenario.po.length - 1)]?.t,
        h: "",
        dp: Math.min(3, currentQ.dp + 1)
      };
      setCurrentQ(nextQ); setAskedQs(p => [...p, nextQ.id]); setQIndex(p => p + 1);
      setShowHint(false); voice.reset(); setAnswers(p => ({ ...p, [currentQ.id]: ans }));
      setLoading(false);
      setTimeout(() => speakQuestion(nextQ.t, qIndex + 1), 300);
    } else {
      // Complete - calculate scores
      const avg = (arr, k) => arr.reduce((s, e) => s + (e[k] ?? 5), 0) / arr.length;
      const score = Math.round(avg(newEvals, "score") * 10) / 10;
      const earned = Math.round(score * 50);
      const skillsScore = Math.min(500, Math.round(score * 50));
      const attackScore = Math.min(100, Math.round(avg(newEvals, "decision_score") * 10));
      setResults({
        overall_score: score,
        communication: Math.round(avg(newEvals, "communication_score") * 10) / 10,
        depth: Math.round(avg(newEvals, "depth_score") * 10) / 10,
        decision: Math.round(avg(newEvals, "decision_score") * 10) / 10,
        // 5 skill averages for radar
        iam: Math.round(avg(newEvals, "iam_score") * 10) / 10,
        detection: Math.round(avg(newEvals, "detection_score") * 10) / 10,
        remediation: Math.round(avg(newEvals, "remediation_score") * 10) / 10,
        architecture: Math.round(avg(newEvals, "architecture_score") * 10) / 10,
        communication_skill: Math.round(avg(newEvals, "communication_skill_score") * 10) / 10,
        earned, time: elapsed, evaluations: newEvals, questions_asked: askedQs.length,
        skillsScore, attackScore,
        percentile: Math.min(99, Math.round(score * 10)),
        badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready",
        difficulty: activeDifficulty
      });
      setXp(p => p + earned);
      setCompletedScenarios(p => [...new Set([...p, scenario.id])]);
      setStreak(p => p + 1);

      // Save to local session history (works for free trial users without backend account)
      setLocalSessionHistory(p => [...p, {
        scenario_id: scenario.id,
        role_id: activeRole,
        score: score,
        communication_score: Math.round(avg(newEvals, "communication_score") * 10) / 10,
        depth_score: Math.round(avg(newEvals, "depth_score") * 10) / 10,
        decision_score: Math.round(avg(newEvals, "decision_score") * 10) / 10,
        completed_at: new Date().toISOString(),
        difficulty: activeDifficulty,
        badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready"
      }]);

      setLoading(false);
      // Always show results page first — even for trial-exhausted users
      // They can then click "View Subscription Options" button to go to trial-complete popup
      setView("results");

      // Save completed session to backend
      try {
        const token = localStorage.getItem('token');
        // Save scenario history
        fetch('https://threatready-db.onrender.com/api/scenario-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ scenario_id: scenario.id, role_id: activeRole, score })
        }).catch(e => console.log('Scenario history:', e.message));
        const finalSessionId = sessionId || window.__sessionId;
        
        if (token && finalSessionId) {
          console.log('[SESSION COMPLETE] session_id:', finalSessionId, 'score:', score);
          const completeRes = await fetch('https://threatready-db.onrender.com/api/session/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              session_id: sessionId,
              scenario_id: scenario.id,
              role_id: activeRole,
              overall_score: score,
              skills_score: skillsScore,
              attack_score: attackScore,
              badge: score >= 8 ? "Platinum" : score >= 7 ? "Gold" : score >= 6 ? "Silver" : score >= 4 ? "Bronze" : "Not Ready",
              earned_xp: earned
            })
          });
          try {
            const completeData = await completeRes.json();
            if (completeData?.share_slug) {
              setResults(prev => ({ ...prev, share_slug: completeData.share_slug }));
              console.log('[SHARE SLUG]', completeData.share_slug);
            }
          } catch (e) { console.log('Share slug parse failed:', e.message); }
        }

      } catch (e) {
        console.log('Session complete error:', e);
      }
    }
  };

  const runDemo = async () => {
    const ans = demoAnswer || demoVoice.transcript;
    if (!ans || !ans.trim()) return;
    setDemoLoading(true);
    try {
      const r = await fetch("https://threatready-db.onrender.com/api/demo/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: demoQ && demoQ.q, answer: ans })
      });
      const result = await r.json();
      setDemoScore(result);
    } catch (e) {
      setDemoScore({ score: 5, feedback: "Cannot connect to server.", level: "Intermediate" });
    }
    setDemoLoading(false);
  };

  // ── PRICING CALC ──
  const toggleRole = id => setSelectedRoles(p => {
    if (p.includes(id)) return p.filter(r => r !== id);
    return [...p, id]; // no cap — billing tab allows selecting any number of roles
  });


  const getDiscount = () => selectedRoles.length >= 3 ? 30 : selectedRoles.length >= 2 ? 18 : 0;
  const getPrice = () => { const base = selectedRoles.length * 399; return Math.round(base * (1 - getDiscount() / 100)); };
  const subscribe = async () => {
    if (!selectedRoles.length) return;
    if (!user) { setAuthMode('signup'); setView('auth'); showToast('Create an account to subscribe', 'info'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://threatready-db.onrender.com/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roles: selectedRoles, billing_period: billingPeriod })
      });
      const order = await res.json();
      if (!res.ok) { showToast(order.error || 'Payment error', 'error'); return; }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ThreatReady',
        description: `${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''} · ${billingPeriod}`,
        order_id: order.order_id,
        handler: async (response) => {
          const verifyRes = await fetch('https://threatready-db.onrender.com/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              roles: selectedRoles,
              billing_period: billingPeriod
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            const allRoles = [...new Set([...subscribedRoles, ...selectedRoles])];
            setSubscribedRoles(allRoles);
            setIsPaid(true);
            setFreeAttempts(0);
            setSelectedRoles([]);
            setView("dashboard");
            setDashTab("home");
            showToast(`Payment successful! All levels unlocked for ${allRoles.length} role${allRoles.length > 1 ? 's' : ''}.`, 'success');
          } else {
            showToast('Payment verification failed. Contact support.', 'error');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''  // Leave empty so user enters their own number
        },
        remember_customer: false,  // Don't save number for next visit
        theme: { color: '#00e5ff' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      showToast('Payment failed: ' + e.message, 'error');
    }
  };

  const goHome = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setView(userType === "b2b" ? "b2b-dashboard" : "dashboard");
    setScenario(null);
    setResults(null);
    localStorage.removeItem('cyberprep_results');
    localStorage.removeItem('cyberprep_scenario');
  };

  const exitScenario = () => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setScenario(null);
    setCurrentQ(null);
    setResults(null);
    localStorage.removeItem('cyberprep_results');
    localStorage.removeItem('cyberprep_scenario');
    setView("dashboard");
  };


  const doLogout = () => {
    // Mark that user logged out → next login won't auto-load resume/career data
    localStorage.setItem('cyberprep_just_logged_out', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('cyberprep_user');
    localStorage.removeItem('cyberprep_usertype');
    localStorage.removeItem('cyberprep_view');
    localStorage.removeItem('cyberprep_tab');
    localStorage.removeItem('cyberprep_b2btab');
    localStorage.removeItem('cyberprep_nav_history');  // Clear nav history on logout
    localStorage.removeItem('subscribedRoles');
    localStorage.removeItem('freeAttempts');
    localStorage.removeItem('roleAttempts');
    localStorage.removeItem('cyberprep_freetrial');
    localStorage.removeItem('trialRoles');
    localStorage.removeItem('cyberprep_session_start');
    localStorage.removeItem('cyberprep_xp');
    localStorage.removeItem('cyberprep_streak');
    localStorage.removeItem('cyberprep_completed_scenarios');
    localStorage.removeItem('cyberprep_local_sessions');
    localStorage.removeItem('cyberprep_hr_paid');
    setUser(null); setUserType('b2c'); setSettingsName('');
    setResumeText(''); setTargetRole(''); setExperienceLevel('');
    setResumeAiData(null); setReadiness(null);
    setXp(0); setStreak(0); setCompletedScenarios([]);
    setBadges([]); setScoreHistory([]); setWeaknessTracker([]);
    setLocalSessionHistory([]);
    setIsPaid(false); setFreeAttempts(2); setRoleAttempts({});
    setSubscribedRoles([]); setTrialRoles([]);
    setIsHrPaid(false);
    // Clear all login form fields so next user doesn't see previous credentials
    setAuthEmail(''); setAuthPassword(''); setAuthName('');
    setAuthError(''); setOtpCode(''); setOtpError('');
    setAuthMode('login'); setAuthStep('form');
    setView("landing");
  };
  const logout = () => showConfirm('Are you sure you want to logout?', doLogout);

  // ═══════════════════════════════════════════════════════════════
  // 1-HOUR SESSION TIMEOUT
  // ═══════════════════════════════════════════════════════════════
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

  const expireSession = useCallback(() => {
    console.log('Session expired — auto-logout');
    doLogout();
    showToast('Session expired, please login again', 'warning');
  }, []);

  // Check on app load + every 30 seconds while app is running
  useEffect(() => {
    const checkExpiry = () => {
      const sessionStart = localStorage.getItem('cyberprep_session_start');
      if (!sessionStart) return; // not logged in
      const elapsed = Date.now() - parseInt(sessionStart, 10);
      if (elapsed >= SESSION_TIMEOUT_MS) {
        expireSession();
      }
    };
    checkExpiry(); // run once immediately
    const timer = setInterval(checkExpiry, 30 * 1000); // every 30 seconds
    return () => clearInterval(timer);
  }, [expireSession]);

  const radarData = results ? [
    { s: "IAM", v: (results.iam ?? 0) * 10 },
    { s: "Detection", v: (results.detection ?? 0) * 10 },
    { s: "Remediation", v: (results.remediation ?? 0) * 10 },
    { s: "Architecture", v: (results.architecture ?? 0) * 10 },
    { s: "Communication", v: (results.communication_skill ?? results.communication ?? 0) * 10 }
  ] : [];


  // ═══════════════════════════════════════════════════════════
  // PAGE 1: LANDING PAGE (Dynamic Hooks + Random Demo)
  // ═══════════════════════════════════════════════════════════


  if (view === "landing") return (
    <LandingView
      hookHeadline={hookHeadline}
      hookSubline={hookSubline}
      demoQ={demoQ}
      demoAnswer={demoAnswer}
      demoScore={demoScore}
      demoLoading={demoLoading}
      demoInputMode={demoInputMode}
      demoVoice={demoVoice}
      setDemoAnswer={setDemoAnswer}
      setDemoInputMode={setDemoInputMode}
      setView={setView}
      setAuthMode={setAuthMode}
      setIsPaid={setIsPaid}
      setFreeAttempts={setFreeAttempts}
      setUser={setUser}
      setSubscribedRoles={setSubscribedRoles}
      setSelectedRoles={setSelectedRoles}
      setTrialRoles={setTrialRoles}
      runDemo={runDemo}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE: TRIAL ROLE SELECT (Free Trial Entry — Pick exactly 2 roles)
  // ═══════════════════════════════════════════════════════════

  if (view === "trial-role-select") return (
    <TrialRoleSelectView
      trialRoles={trialRoles}
      setTrialRoles={setTrialRoles}
      setRoleAttempts={setRoleAttempts}
      setSubscribedRoles={setSubscribedRoles}
      setIsPaid={setIsPaid}
      setView={setView}
      setDashTab={setDashTab}
      goBack={goBack}
    />
  );


  // ═══════════════════════════════════════════════════════════
  // PAGE: TRIAL COMPLETE (Shown after 2 trial attempts are used)
  // ═══════════════════════════════════════════════════════════

  if (view === "trial-complete") return (
    <TrialCompleteView
      results={results}
      activeRole={activeRole}
      user={user}
      setView={setView}
      setDashTab={setDashTab}
      setAuthMode={setAuthMode}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 2: AUTH (Signup/Login + Email Verification + B2C/B2B Detection)
  // ═══════════════════════════════════════════════════════════

  if (view === "auth") return (
    <AuthView
      authMode={authMode}
      authStep={authStep}
      authEmail={authEmail}
      authPassword={authPassword}
      authName={authName}
      authError={authError}
      agreeTerms={agreeTerms}
      showAuthPassword={showAuthPassword}
      showNewPassword={showNewPassword}
      isAuthenticating={isAuthenticating}
      otpCode={otpCode}
      otpError={otpError}
      forgotEmail={forgotEmail}
      forgotCode={forgotCode}
      newPassword={newPassword}
      forgotLoading={forgotLoading}
      forgotMsg={forgotMsg}
      userType={userType}
      hrModalCompanyName={hrModalCompanyName}
      hrModalTeamSize={hrModalTeamSize}
      HR_PRICING={HR_PRICING}
      setAuthMode={setAuthMode}
      setAuthStep={setAuthStep}
      setAuthEmail={setAuthEmail}
      setAuthPassword={setAuthPassword}
      setAuthName={setAuthName}
      setAuthError={setAuthError}
      setAgreeTerms={setAgreeTerms}
      setShowAuthPassword={setShowAuthPassword}
      setShowNewPassword={setShowNewPassword}
      setOtpCode={setOtpCode}
      setOtpError={setOtpError}
      setForgotEmail={setForgotEmail}
      setForgotCode={setForgotCode}
      setNewPassword={setNewPassword}
      setForgotLoading={setForgotLoading}
      setForgotMsg={setForgotMsg}
      setHrModalCompanyName={setHrModalCompanyName}
      setHrModalTeamSize={setHrModalTeamSize}
      setView={setView}
      handleAuth={handleAuth}
      verifyEmail={verifyEmail}
      confirmUserType={confirmUserType}
      confirmCompanyInfo={confirmCompanyInfo}
      startScenario={startScenario}
      goBack={goBack}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // DIFFICULTY SELECTION
  // ═══════════════════════════════════════════════════════════

  if (view === "difficulty") return (
    <DifficultyView
      activeRole={activeRole}
      isPaid={isPaid}
      user={user}
      setView={setView}
      setDashTab={setDashTab}
      setAuthMode={setAuthMode}
      goHome={goHome}
      getRemainingAttempts={getRemainingAttempts}
      startScenario={startScenario}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 3: SCENARIO INTERFACE (Adaptive + Anti-Gaming)
  // ═══════════════════════════════════════════════════════════

  if (view === "interview" && scenario && currentQ) return (
    <InterviewView
      scenario={scenario}
      currentQ={currentQ}
      qIndex={qIndex}
      activeDifficulty={activeDifficulty}
      answers={answers}
      loading={loading}
      showHint={showHint}
      inputMode={inputMode}
      elapsed={elapsed}
      voice={voice}
      isMuted={isMuted}
      isSpeaking={isSpeaking}
      setAnswers={setAnswers}
      setShowHint={setShowHint}
      setInputMode={setInputMode}
      setIsMuted={setIsMuted}
      submitAnswer={submitAnswer}
      exitScenario={exitScenario}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 4: RESULTS (Transparent Scoring + Badges + CTAs)
  // ═══════════════════════════════════════════════════════════

  if (view === "results" && results) return (
    <ResultsView
      results={results}
      scenario={scenario}
      activeRole={activeRole}
      activeDifficulty={activeDifficulty}
      userType={userType}
      user={user}
      isPaid={isPaid}
      radarData={radarData}
      setView={setView}
      setActiveRole={setActiveRole}
      setActiveDifficulty={setActiveDifficulty}
      setResults={setResults}
      goHome={goHome}
      startScenario={startScenario}
      isTrialExhausted={isTrialExhausted}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // ROLE SELECTION (Pricing)
  // ═══════════════════════════════════════════════════════════

  if (view === "roles") return (
    <RolesView
      isPaid={isPaid}
      selectedRoles={selectedRoles}
      setSubscribedRoles={setSubscribedRoles}
      setFreeAttempts={setFreeAttempts}
      setView={setView}
      goHome={goHome}
      toggleRole={toggleRole}
      getDiscount={getDiscount}
      getPrice={getPrice}
      subscribe={subscribe}
    />
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE 5: B2C ENGINEER DASHBOARD (C1-C8 via tabs)
  // ═══════════════════════════════════════════════════════════
  if (view === "dashboard") {
    const tabs = [
      { id: "home", label: "🏠 Home", icon: "🏠" },
      { id: "scores", label: "📊 Scores", icon: "📊" },
      { id: "badges", label: "🏆 Badges", icon: "🏆" },
      { id: "profile", label: "👤 Profile", icon: "👤" },

      // { id: "interview", label: "💎 Interview", icon: "💎" },

      { id: "billing", label: "💳 Billing", icon: "💳" },
      { id: "settings", label: "⚙️ Settings", icon: "⚙️" },
      { id: "help", label: "❓ Help", icon: "❓" }
    ];

    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <ToastContainer />
        <div className="page"><div className="cnt">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome, {user?.name || "Agent"}</h2>
              <div style={{ fontSize: 14, color: "var(--tx2)", marginTop: 4, fontWeight: 500 }}>
                {isPaid ? `${subscribedRoles.length} tracks` : `Free trial · ${Math.max(0, 2 - getTotalUsedAttempts())} attempts left`} · {completedScenarios.length} completed · {streak} day streak
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="tag" style={{ padding: "5px 12px" }}>⚡ {xp} XP</span>

              {/* Notification Bell */}

              <div style={{ position: "relative" }}>
                <button className="btn bs" style={{ padding: "5px 10px", fontSize: 13 }}
                  onClick={async () => {
                    setShowNotifs(p => !p);
                    if (unreadCount > 0) {
                      const token = localStorage.getItem('token');
                      await fetch('https://threatready-db.onrender.com/api/notifications/read', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      setUnreadCount(0);
                      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
                    }
                  }}>

                  🔔{unreadCount > 0 && <span style={{ background: "var(--dn)", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: "50%", padding: "1px 4px", marginLeft: 3 }}>{unreadCount}</span>}
                </button>

                {showNotifs && (
                  <div style={{ position: "absolute", zIndex: 1000, right: 0, top: 36, width: 280, background: "#111827", border: "1px solid #1e2536", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.6)", maxHeight: 300, overflowY: "auto" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e2536", fontSize: 13, fontWeight: 700, color: "var(--ac)", display: "flex", justifyContent: "space-between" }}>
                      <span>NOTIFICATIONS</span>
                      <span style={{ cursor: "pointer", opacity: 1 }} onClick={() => setShowNotifs(false)}>×</span>
                    </div>

                    {notifications.length === 0
                      ? <div style={{ padding: 16, fontSize: 13, color: "var(--tx2)", textAlign: "center" }}>No notifications yet</div>
                      : notifications.map((n, i) => (
                        <div key={n.id || i} style={{ padding: "10px 14px", borderBottom: i < notifications.length - 1 ? "1px solid #1e2536" : "none", background: n.is_read ? "transparent" : "rgba(0,229,255,.04)" }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 12 }} onClick={logout}>Logout</button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="nav-tabs">
            {tabs.map(t => (
              <div key={t.id}
                className={`nav-tab ${dashTab === t.id ? "active" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => { setDashTab(t.id); localStorage.setItem('cyberprep_tab', t.id); }}>
                {t.label}
              </div>
            ))}
          </div>


          {/* ── C1: HOME ── */}

          {dashTab === "home" && (
            <HomeTab
              user={user}
              isPaid={isPaid}
              xp={xp}
              setXp={setXp}
              streak={streak}
              completedScenarios={completedScenarios}
              subscribedRoles={subscribedRoles}
              dailyChallenge={dailyChallenge}
              dailyAnswered={dailyAnswered}
              setDailyAnswered={setDailyAnswered}
              dailyResult={dailyResult}
              setDailyResult={setDailyResult}
              dailyChallengeError={dailyChallengeError}
              setDailyChallengeError={setDailyChallengeError}
              showDailyModal={showDailyModal}
              setShowDailyModal={setShowDailyModal}
              dailyAnswer={dailyAnswer}
              setDailyAnswer={setDailyAnswer}
              dailyVoice={dailyVoice}
              dailyInputMode={dailyInputMode}
              setDailyInputMode={setDailyInputMode}
              dailyLoading={dailyLoading}
              setDailyLoading={setDailyLoading}
              leaderboard={leaderboard}
              myRank={myRank}
              setActiveRole={setActiveRole}
              setView={setView}
              setDashTab={setDashTab}
              setAuthMode={setAuthMode}
              setAuthStep={setAuthStep}
              loadDashboardExtras={loadDashboardExtras}
            />
          )}

          {/* ── C2: SCORES & HISTORY ── */}

          {dashTab === "scores" && (
            <ScoresTab
              user={user}
              completedScenarios={completedScenarios}
              localSessionHistory={localSessionHistory}
              scoreHistory={scoreHistory}
              weaknessTracker={weaknessTracker}
              setDashTab={setDashTab}
            />
          )}

          {/* ── C3: BADGES ── */}

          {dashTab === "badges" && (
            <BadgesTab
              user={user}
              badges={badges}
              completedScenarios={completedScenarios}
              streak={streak}
            />
          )}

          {/* ── C4: PROFILE ── */}

          {dashTab === "profile" && (
            <ProfileTab
              user={user}
              resumeText={resumeText}
              setResumeText={setResumeText}
              resumeAiData={resumeAiData}
              setResumeAiData={setResumeAiData}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              readiness={readiness}
            />
          )}

          {/* ── C5: INTERVIEW MODE ── */}

          {dashTab === "interview" && (
            <InterviewTab
              subscribedRoles={subscribedRoles}
              activeRole={activeRole}
              setActiveRole={setActiveRole}
              interviewPersona={interviewPersona}
              setInterviewPersona={setInterviewPersona}
              isPaid={isPaid}
              setDashTab={setDashTab}
              setView={setView}
            />
          )}

          {/* ── C6: BILLING ── */}

          {dashTab === "billing" && (
            <BillingTab
              user={user}
              isPaid={isPaid}
              subscribedRoles={subscribedRoles}
              selectedRoles={selectedRoles}
              billingPeriod={billingPeriod}
              setBillingPeriod={setBillingPeriod}
              getRemainingAttempts={getRemainingAttempts}
              toggleRole={toggleRole}
              getPrice={getPrice}
              getDiscount={getDiscount}
              subscribe={subscribe}
            />
          )}

          {/* ── C7: SETTINGS ── */}

          {dashTab === "settings" && (
            <SettingsTab
              user={user}
              setUser={setUser}
              settingsName={settingsName}
              setSettingsName={setSettingsName}
              profilePublic={profilePublic}
              setProfilePublic={setProfilePublic}
              inLeaderboard={inLeaderboard}
              setInLeaderboard={setInLeaderboard}
              allowBenchmarking={allowBenchmarking}
              setAllowBenchmarking={setAllowBenchmarking}
              setView={setView}
              showConfirm={showConfirm}
            />
          )}

          {/* ── C8: HELP ── */}

          {dashTab === "help" && (
            <HelpTab
              feedbackText={feedbackText}
              feedbackSent={feedbackSent}
              feedbackInputMode={feedbackInputMode}
              feedbackVoice={feedbackVoice}
              setFeedbackText={setFeedbackText}
              setFeedbackSent={setFeedbackSent}
              setFeedbackInputMode={setFeedbackInputMode}
            />
          )}

        </div></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE 6: B2B HIRING MANAGER DASHBOARD (8 tabs — mirrors B2C)
  // ═══════════════════════════════════════════════════════════
  if (view === "b2b-dashboard") {
    const b2bTabs = [
      { id: "overview", label: "📊 Overview" },
      { id: "create", label: "📝 Create Assessment" },
      { id: "candidates", label: "👥 Candidates" },
      { id: "reports", label: "📄 Reports" },
      { id: "teamskills", label: "🏢 Team Skills" },

      { id: "library", label: "📚 Library" },
      { id: "settings", label: "⚙️ Settings" },
      { id: "help", label: "❓ Help" }
    ];

    return (
      <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
        <ToastContainer />

        {/* ── REPORT MODAL ── */}
        {reportModal && (() => {
          const evals = reportModal.evaluations || [];
          const score = parseFloat(reportModal.overall_score) || 0;
          const avgStrength = evals.filter(e => e.score >= 7).length;
          const avgWeak = evals.filter(e => e.score < 5).length;
          const verdict = score >= 8 ? "Excellent candidate — strongly recommended for interview" :
            score >= 7 ? "Strong candidate — recommended for next round" :
              score >= 6 ? "Good candidate — consider for interview" :
                score >= 5 ? "Average — more assessment needed" :
                  score >= 4 ? "Below expectations — not recommended" :
                    "Not ready — significant skill gaps";
          const verdictColor = score >= 7 ? "var(--ok)" : score >= 5 ? "var(--wn)" : "var(--dn)";
          const badgeColor = score >= 8 ? "#e2e8f0" : score >= 7 ? "#f59e0b" : score >= 6 ? "#94a3b8" : score >= 4 ? "#cd7f32" : "#ff5252";

          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
              onClick={() => setReportModal(null)}>
              <div onClick={e => e.stopPropagation()}
                style={{ width: "92%", maxWidth: 900, maxHeight: "92vh", overflow: "hidden", background: "#0f1420", border: "1px solid var(--ac)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(0,229,255,0.25)", display: "flex", flexDirection: "column" }}>

                <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", background: "#0a0e1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ac)", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>📊 ASSESSMENT RESULTS</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{reportModal.name}</div>
                    <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 2 }}>{reportModal.email} · {reportModal.assessment_name || (ROLES.find(r => r.id === reportModal.role_id)?.name + ' Assessment')}</div>
                  </div>
                  <span style={{ cursor: "pointer", fontSize: 28, color: "var(--tx2)", padding: "0 8px" }} onClick={() => setReportModal(null)}>×</span>
                </div>

                <div style={{ overflow: "auto", flex: 1 }}>

                  <div style={{ padding: "32px 28px", textAlign: "center", borderBottom: "1px solid #1e2536", background: "linear-gradient(180deg, rgba(0,229,255,0.04) 0%, transparent 100%)" }}>
                    <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8, letterSpacing: 2, fontWeight: 700 }}>OVERALL SCORE</div>
                    <div className="mono" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, color: verdictColor, marginBottom: 8 }}>
                      {score.toFixed(1)}<span style={{ fontSize: 28, color: "var(--tx2)" }}>/10</span>
                    </div>
                    <div style={{ display: "inline-block", border: `2px solid ${badgeColor}`, color: badgeColor, padding: "6px 24px", borderRadius: 24, fontSize: 12, fontWeight: 800, letterSpacing: 2, marginTop: 8, marginBottom: 14 }}>
                      {(reportModal.badge || '').toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: verdictColor, fontWeight: 600, marginTop: 4 }}>
                      {verdict}
                    </div>
                  </div>

                  <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>ROLE</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{ROLES.find(r => r.id === reportModal.role_id)?.icon} {ROLES.find(r => r.id === reportModal.role_id)?.name || reportModal.role_id}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>DIFFICULTY</div>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{reportModal.difficulty}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>QUESTIONS</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{evals.length} answered</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 14, background: "var(--s2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, letterSpacing: 1 }}>COMPLETED</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{reportModal.completed_at?.substring(0, 10) || '—'}</div>
                    </div>
                  </div>

                  <div style={{ padding: "20px 28px", borderBottom: "1px solid #1e2536", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: 14, background: "rgba(0,224,150,.05)", border: "1px solid rgba(0,224,150,.25)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>✓ STRONG ANSWERS</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ok)" }}>{avgStrength}</div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Questions scored 7+ / 10</div>
                    </div>
                    <div style={{ padding: 14, background: "rgba(255,82,82,.05)", border: "1px solid rgba(255,82,82,.25)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--dn)", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>✗ WEAK AREAS</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--dn)" }}>{avgWeak}</div>
                      <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Questions scored below 5 / 10</div>
                    </div>
                  </div>

                  <div style={{ padding: "24px 28px" }}>
                    <div style={{ fontSize: 12, color: "var(--ac)", fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>📝 DETAILED QUESTION BREAKDOWN</div>
                    {evals.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 30, color: "var(--tx2)", fontSize: 12 }}>No evaluation data available</div>
                    ) : (
                      evals.map((ev, i) => (
                        <div key={i} style={{ marginBottom: 18, padding: 18, background: "var(--s2)", borderRadius: 12, border: `1px solid ${ev.score >= 7 ? "rgba(0,224,150,.3)" : ev.score >= 5 ? "rgba(245,158,11,.3)" : "rgba(255,82,82,.3)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--bd)" }}>
                            <span style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 700, letterSpacing: 1 }}>QUESTION {i + 1} · {ev.category || 'General'}</span>
                            <span className="mono" style={{ fontSize: 16, fontWeight: 900, color: ev.score >= 7 ? "var(--ok)" : ev.score >= 5 ? "var(--wn)" : "var(--dn)" }}>{ev.score}/10</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--tx1)", lineHeight: 1.5 }}>❓ {ev.question}</div>
                          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 12, padding: 12, background: "var(--s1)", borderRadius: 8, lineHeight: 1.6, borderLeft: "3px solid var(--tx3)" }}>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>CANDIDATE'S ANSWER</div>
                            {ev.answer || '(No answer provided)'}
                          </div>
                          {ev.strengths && (
                            <div style={{ fontSize: 13, color: "var(--ok)", marginBottom: 8, padding: 10, background: "rgba(0,224,150,.05)", borderRadius: 8, borderLeft: "3px solid var(--ok)" }}>
                              <strong>✓ Strengths:</strong> {ev.strengths}
                            </div>
                          )}
                          {ev.weaknesses && (
                            <div style={{ fontSize: 13, color: "var(--dn)", marginBottom: 8, padding: 10, background: "rgba(255,82,82,.05)", borderRadius: 8, borderLeft: "3px solid var(--dn)" }}>
                              <strong>✗ Weaknesses:</strong> {ev.weaknesses}
                            </div>
                          )}
                          {ev.improved_answer && ev.improved_answer !== '-' && (
                            <div style={{ fontSize: 13, color: "var(--ac)", marginTop: 8, padding: 10, background: "rgba(0,229,255,.05)", borderRadius: 8, borderLeft: "3px solid var(--ac)" }}>
                              <strong>💡 Ideal Answer:</strong> {ev.improved_answer}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="page"><div className="cnt">

          {/* ── HEADER ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="fadeUp">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{companyName || user?.name || 'Hiring Dashboard'}</h2>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4, fontWeight: 500 }}>
                {isHrPaid
                  ? `✓ ${HR_PRICING[teamSize]?.planName || 'Active subscription'} · ${teamSize} people`
                  : `🔓 Free Plan · Subscribe to unlock`}
                {" · "}{candidates.length} candidates · {assessments.length} assessments
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
              {/* ═══ Subscribe to Unlock button (only for free trial HR users) ═══ */}
              {!isHrPaid && (
                <button
                  className="btn bp"
                  style={{ padding: "6px 14px", fontSize: 13, fontWeight: 700, marginRight: 4 }}
                  onClick={() => {
                    setHrModalCompanyName(companyName || '');
                    setHrModalTeamSize(teamSize || '11-50');
                    setShowHrSubscribeModal(true);
                  }}>
                  🔓 Subscribe to Unlock More Features
                </button>
              )}

              {/* Notification Bell */}
              <div style={{ position: "relative" }}>
                <button className="btn bs" style={{ padding: "5px 10px", fontSize: 14, position: "relative" }}
                  onClick={async () => {
                    setShowNotifs(p => !p);
                    if (unreadCount > 0) {
                      const token = localStorage.getItem('token');
                      await fetch('https://threatready-db.onrender.com/api/notifications/read', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      setUnreadCount(0);
                    }
                  }}>
                  🔔{unreadCount > 0 && <span style={{ background: "var(--dn)", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: "50%", padding: "1px 4px", marginLeft: 3 }}>{unreadCount}</span>}
                </button>
                {showNotifs && (
                  <>
                    {/* Backdrop - dim everything else + click outside to close */}
                    <div
                      style={{
                        position: "absolute", zIndex: 1000,
                        inset: 0,

                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(2px)"
                      }}
                      onClick={() => setShowNotifs(false)}
                    />
                    {/* Dropdown panel */}
                    <div style={{
                      position: "absolute", zIndex: 1000,
                      top: 80,
                      right: 24,
                      width: 360,
                      maxHeight: "80vh",
                      overflow: "auto",
                      background: "#0f1420",
                      border: "1px solid var(--ac)",
                      borderRadius: 12,
                      boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 30px rgba(0,229,255,0.15)",

                    }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2536", fontSize: 13, fontWeight: 700, color: "var(--ac)", letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0e1a", position: "sticky", top: 0 }}>
                        <span>NOTIFICATIONS ({notifications.length})</span>
                        <span style={{ cursor: "pointer", fontSize: 16, color: "var(--tx2)" }} onClick={() => setShowNotifs(false)}>×</span>
                      </div>
                      {notifications.length === 0
                        ? <div style={{ padding: 20, fontSize: 13, color: "var(--tx2)", textAlign: "center" }}>No notifications yet</div>
                        : notifications.map((n, i) => (
                          <div key={n.id || i} style={{ padding: "12px 16px", borderBottom: i < notifications.length - 1 ? "1px solid #1e2536" : "none", background: n.is_read ? "transparent" : "rgba(0,229,255,.04)" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx1)", lineHeight: 1.4 }}>{n.title || n.type}</div>
                            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 5 }}>{n.created_at?.substring(0, 16).replace('T', ' ')}</div>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )}
              </div>


              <button className="btn bs" style={{ padding: "5px 10px", fontSize: 12 }} onClick={logout}>Logout</button>
            </div>
          </div>

          {/* ── NAV TABS ── */}
          <div className="nav-tabs">
            {b2bTabs.map(t => (
              <div key={t.id} className={`nav-tab ${b2bTab === t.id ? "active" : ""}`}
                onClick={() => { setB2bTab(t.id); localStorage.setItem('cyberprep_b2btab', t.id); }}>
                {t.label}
              </div>
            ))}
          </div>

          {/* ═══ FADE OVERLAY for free trial HR users (Help tab is always accessible) ═══ */}
          <div style={{
            opacity: (isHrPaid || b2bTab === "help") ? 1 : 0.4,
            pointerEvents: (isHrPaid || b2bTab === "help") ? "auto" : "none",
            transition: "opacity 0.3s"
          }}>

            {/* ── B1: HOME ── */}

            {b2bTab === "overview" && (
              <B2BOverviewTab
                b2bStats={b2bStats}
                b2bLoading={b2bLoading}
                candidates={candidates}
                setB2bTab={setB2bTab}
              />
            )}

            {/* ── B2: SCORES (Candidate skill scores — empty state guard) ── */}

            {b2bTab === "candidates" && (
              <B2BCandidatesTab
                candidates={candidates}
                assessments={assessments}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                b2bLoading={b2bLoading}
                inviteMode={inviteMode}
                setInviteMode={setInviteMode}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                inviteMultipleEmails={inviteMultipleEmails}
                setInviteMultipleEmails={setInviteMultipleEmails}
                inviteCsvFile={inviteCsvFile}
                setInviteCsvFile={setInviteCsvFile}
                inviteParsedEmails={inviteParsedEmails}
                setInviteParsedEmails={setInviteParsedEmails}
                inviteAssessmentId={inviteAssessmentId}
                setInviteAssessmentId={setInviteAssessmentId}
                inviteRole={inviteRole}
                setInviteRole={setInviteRole}
                inviteDiff={inviteDiff}
                setInviteDiff={setInviteDiff}
                inviteMsg={inviteMsg}
                setInviteMsg={setInviteMsg}
                candidatesSearch={candidatesSearch}
                setCandidatesSearch={setCandidatesSearch}
                setReportModal={setReportModal}
                loadB2bData={loadB2bData}
                filterBySearch={filterBySearch}
                showConfirm={showConfirm}
              />
            )}

            {/* ── TEAM SKILLS TAB ── */}

            {b2bTab === "teamskills" && (
              <B2BTeamSkillsTab
                candidates={candidates}
                teamMembers={teamMembers}
                b2bLoading={b2bLoading}
                teamSkillsSearch={teamSkillsSearch}
                setTeamSkillsSearch={setTeamSkillsSearch}
                setB2bTab={setB2bTab}
                loadB2bData={loadB2bData}
                filterBySearch={filterBySearch}
              />
            )}


            {/* ── B3: BADGES (Reports) ── */}

            {b2bTab === "reports" && (
              <B2BReportsTab candidates={candidates} />
            )}

            {/* ── B4: PROFILE ── */}

            {/* ── B5: INTERVIEW (Create Assessment + Invite Candidates) ── */}

            {b2bTab === "create" && (
              <B2BCreateTab
                newAssessJD={newAssessJD}
                setNewAssessJD={setNewAssessJD}
                newAssessName={newAssessName}
                setNewAssessName={setNewAssessName}
                newAssessRole={newAssessRole}
                setNewAssessRole={setNewAssessRole}
                newAssessDiff={newAssessDiff}
                setNewAssessDiff={setNewAssessDiff}
                newAssessType={newAssessType}
                setNewAssessType={setNewAssessType}
                newAssessQuestionCount={newAssessQuestionCount}
                setNewAssessQuestionCount={setNewAssessQuestionCount}
                jdAnalysis={jdAnalysis}
                setJdAnalysis={setJdAnalysis}
                jdAnalyzing={jdAnalyzing}
                setJdAnalyzing={setJdAnalyzing}
                assessMsg={assessMsg}
                setAssessMsg={setAssessMsg}
                setB2bTab={setB2bTab}
                loadB2bData={loadB2bData}
              />
            )}

            {/* ── B6: LIBRARY (Saved Assessments + Invite Candidate) ── */}

            {b2bTab === "library" && (
              <B2BLibraryTab
                assessments={assessments}
                b2bLoading={b2bLoading}
                librarySearch={librarySearch}
                setLibrarySearch={setLibrarySearch}
                setB2bTab={setB2bTab}
                setInviteRole={setInviteRole}
                setInviteDiff={setInviteDiff}
                setInviteAssessmentId={setInviteAssessmentId}
                loadB2bData={loadB2bData}
                filterBySearch={filterBySearch}
                showConfirm={showConfirm}
              />
            )}

            {/* ── B7: SETTINGS ── */}

            {b2bTab === "settings" && (
              <B2BSettingsTab
                companyName={companyName}
                setCompanyName={setCompanyName}
                teamSize={teamSize}
                setTeamSize={setTeamSize}
                companySettingsMsg={companySettingsMsg}
                setCompanySettingsMsg={setCompanySettingsMsg}
                slackWebhook={slackWebhook}
                setSlackWebhook={setSlackWebhook}
                zapierWebhook={zapierWebhook}
                setZapierWebhook={setZapierWebhook}
                integrationMsg={integrationMsg}
                setIntegrationMsg={setIntegrationMsg}
              />
            )}

            {/* ── B8: HELP ── */}

            {b2bTab === "help" && (
              <B2BHelpTab
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                feedbackSent={feedbackSent}
                setFeedbackSent={setFeedbackSent}
              />
            )}

            {/* ═══ CLOSE fade overlay wrapper ═══ */}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HR SUBSCRIBE MODAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {showHrSubscribeModal && (
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)", padding: 16
            }} onClick={() => setShowHrSubscribeModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: "#0f1420", border: "1px solid var(--ac)", borderRadius: 14,
                padding: "20px 24px", maxWidth: 480, width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(0,229,255,0.2)"
              }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🚀 Unlock Full HR Suite</div>
                  <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.4 }}>
                    Unlimited assessments, candidate invites, team analytics
                  </p>
                </div>

                {/* Company Name */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>COMPANY NAME</div>
                  <input
                    className="input"
                    placeholder="e.g. Acme Security Inc."
                    value={hrModalCompanyName}
                    onChange={e => setHrModalCompanyName(e.target.value)}
                    style={{ fontSize: 13, padding: "8px 12px" }}
                  />
                </div>

                {/* Team Size */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>TEAM SIZE</div>
                  <select
                    className="input"
                    value={hrModalTeamSize}
                    onChange={e => setHrModalTeamSize(e.target.value)}
                    style={{ fontSize: 13, padding: "8px 12px" }}>
                    {Object.entries(HR_PRICING).map(([key, v]) => (
                      <option key={key} value={key}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Billing Period Toggle */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>BILLING CYCLE</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={`btn ${hrBillingPeriod === "monthly" ? "bp" : "bs"}`}
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12 }}
                      onClick={() => setHrBillingPeriod("monthly")}>
                      Monthly
                    </button>
                    <button
                      className={`btn ${hrBillingPeriod === "yearly" ? "bp" : "bs"}`}
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12 }}
                      onClick={() => setHrBillingPeriod("yearly")}>
                      Yearly <span style={{ fontSize: 10, color: "var(--ok)" }}>· SAVE 20%</span>
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                {(() => {
                  const tier = HR_PRICING[hrModalTeamSize];
                  if (!tier) return null;
                  if (tier.contactSales) {
                    return (
                      <div style={{ padding: 10, background: "rgba(255,171,64,.06)", border: "1px solid rgba(255,171,64,.3)", borderRadius: 8, marginBottom: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--wn)", marginBottom: 2 }}>Contact Sales</div>
                        <div style={{ fontSize: 11, color: "var(--tx2)" }}>Custom quote for enterprise teams</div>
                      </div>
                    );
                  }
                  const price = hrBillingPeriod === "yearly" ? tier.yearly : tier.monthly;
                  const monthlyEquiv = hrBillingPeriod === "yearly" ? Math.round(tier.yearly / 12) : tier.monthly;
                  return (
                    <div style={{ padding: 10, background: "rgba(0,229,255,.05)", border: "1px solid var(--ac)", borderRadius: 8, marginBottom: 10, textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--ac)" }}>
                        ₹{price.toLocaleString('en-IN')}
                        <span style={{ fontSize: 11, color: "var(--tx2)", fontWeight: 600 }}>/{hrBillingPeriod === "yearly" ? "yr" : "mo"}</span>
                      </div>
                      {hrBillingPeriod === "yearly" && (
                        <div style={{ fontSize: 10, color: "var(--ok)", marginTop: 2 }}>
                          ₹{monthlyEquiv.toLocaleString('en-IN')}/mo effective
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Feature list — 2 columns */}
                <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(0,224,150,.04)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--ok)", fontWeight: 700, marginBottom: 5, letterSpacing: 0.5 }}>INCLUDED</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px", fontSize: 11, color: "var(--tx2)", lineHeight: 1.4 }}>
                    <div>✓ Unlimited assessments</div>
                    <div>✓ Full reports & PDF exports</div>
                    <div>✓ Bulk invites (CSV + paste)</div>
                    <div>✓ Slack & Zapier integrations</div>
                    <div>✓ Team skill heatmap</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn bs" style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} onClick={() => setShowHrSubscribeModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn bp"
                    style={{ flex: 2, padding: "9px 12px", fontWeight: 700, fontSize: 13 }}
                    disabled={!hrModalCompanyName.trim()}
                    onClick={async () => {
                      const tier = HR_PRICING[hrModalTeamSize];
                      if (!tier) return;

                      // Save company info to Settings-backed state for display
                      setCompanyName(hrModalCompanyName.trim());
                      setTeamSize(hrModalTeamSize);

                      // Contact Sales path
                      if (tier.contactSales) {
                        showToast('Thanks! Our team will reach out to ' + (user?.email || 'you') + ' within 24 hours.', 'info');
                        setShowHrSubscribeModal(false);
                        // Optional: call backend to notify sales
                        try {
                          const token = localStorage.getItem('token');
                          await fetch('https://threatready-db.onrender.com/api/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ message: `[HR ENTERPRISE LEAD] Company: ${hrModalCompanyName}, Team size: 50+, Contact: ${user?.email || 'N/A'}` })
                          });
                        } catch (e) { }
                        return;
                      }

                      // Razorpay payment path
                      const price = hrBillingPeriod === "yearly" ? tier.yearly : tier.monthly;
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('https://threatready-db.onrender.com/api/payment/create-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({
                            hr_subscription: true,
                            company_name: hrModalCompanyName.trim(),
                            team_size: hrModalTeamSize,
                            billing_period: hrBillingPeriod,
                            amount_override: price
                          })
                        });
                        const order = await res.json();
                        if (!res.ok) { showToast(order.error || 'Payment error', 'error'); return; }

                        const options = {
                          key: order.key_id,
                          amount: order.amount || (price * 100),
                          currency: order.currency || 'INR',
                          name: 'ThreatReady HR',
                          description: `${hrModalCompanyName} · ${tier.label} · ${hrBillingPeriod}`,
                          order_id: order.order_id,
                          handler: async (response) => {
                            const verifyRes = await fetch('https://threatready-db.onrender.com/api/payment/verify', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                hr_subscription: true,
                                company_name: hrModalCompanyName.trim(),
                                team_size: hrModalTeamSize,
                                billing_period: hrBillingPeriod
                              })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                              setIsHrPaid(true);
                              localStorage.setItem('cyberprep_hr_paid', 'true');
                              setShowHrSubscribeModal(false);
                              showToast('🎉 Subscription activated! All HR features unlocked.', 'success');
                            } else {
                              showToast('Payment verification failed. Contact support.', 'error');
                            }
                          },
                          prefill: {
                            name: hrModalCompanyName.trim() || user?.name || '',
                            email: user?.email || '',
                            contact: ''
                          },
                          remember_customer: false,
                          theme: { color: '#00e5ff' }
                        };
                        const rzp = new window.Razorpay(options);
                        rzp.open();
                      } catch (e) {
                        showToast('Payment failed: ' + e.message, 'error');
                      }
                    }}>
                    {HR_PRICING[hrModalTeamSize]?.contactSales ? '📧 Contact Sales' : '🔒 Subscribe & Pay'}
                  </button>
                </div>

                <div style={{ fontSize: 10, color: "var(--tx2)", textAlign: "center", marginTop: 8 }}>
                  Secure payment via Razorpay · Cancel anytime
                </div>
              </div>
            </div>
          )}

        </div></div>
      </div>
    );
  }


  // ═══════════════════════════════════════════════════════════
  // CANDIDATE ASSESSMENT PAGE (/assess?token=xxx)
  // ═══════════════════════════════════════════════════════════

  if (view === "candidate-assess") return (
    <CandidateAssessView
      candidateAssessState={candidateAssessState}
      candidateAssessData={candidateAssessData}
      candidateAssessError={candidateAssessError}
      candidateQIndex={candidateQIndex}
      candidateAnswers={candidateAnswers}
      candidateResult={candidateResult}
      candidateSubmitting={candidateSubmitting}
      candidateToken={candidateToken}
      isMuted={isMuted}
      isSpeaking={isSpeaking}
      voice={voice}
      setCandidateAssessState={setCandidateAssessState}
      setCandidateQIndex={setCandidateQIndex}
      setCandidateAnswers={setCandidateAnswers}
      setCandidateResult={setCandidateResult}
      setCandidateAssessError={setCandidateAssessError}
      setCandidateSubmitting={setCandidateSubmitting}
      setIsMuted={setIsMuted}
      setIsSpeaking={setIsSpeaking}
    />
  );

  // ═══ LOADING FALLBACK ═══
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <div className="page"><div className="cnt"><div style={{ textAlign: "center", padding: 40 }}><div className="loader" /></div></div></div>
    </div>
  );
}



