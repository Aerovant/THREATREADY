// ═══════════════════════════════════════════════════════════════
// SETTINGS TAB — Full 6-Tab Build (2026-05)
//
// Tabs:
//   1. Profile Settings — name, email, role, timezone + privacy + data
//   2. Account          — account details + subscription + billing history + payment method
//   3. Preferences      — general, dashboard, learning, content & email prefs
//   4. Notifications    — email + in-app + frequency settings
//   5. Security         — password, 2FA, active sessions, login activity
//   6. Integrations     — GitHub / Slack / LinkedIn / Drive / Notion / Teams / Webhook
//
// Backend endpoints preserved:
//   • POST /api/settings/profile         (save name)
//   • POST /api/settings/privacy         (3 privacy toggles)
//   • GET  /api/settings/export          (download personal report PDF)
//   • DELETE /api/settings/delete-account
//
// All new preferences persist to localStorage (no backend changes required).
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { showToast } from "../../components/helpers.js";
import { ROLES } from "../../constants.js";

/* ── Inline SVG icons ── */
const I = {
  // tab nav icons
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  card: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  sliders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  shieldOutline: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  puzzle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2v4a2 2 0 0 1-2 2h-4v-2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2H5a2 2 0 0 1-2-2v-4h2a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H3V7a2 2 0 0 1 2-2h4V3a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v4z"/></svg>,

  // section icons (used inside lavender squares)
  userBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lockBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  dbBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
  crown: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 6-4-8-4 8-6-6z"/></svg>,
  receipt: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
  ccBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  slidersBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  pieBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  bookBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  mailBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  bellBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  clockBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  monitor: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  shieldBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,

  // device icons for sessions
  desktop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  mobile: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  laptop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,

  // quick action icons
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  help: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  shieldQ: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  pdf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  checkCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10" fill="none"/></svg>,
  alertCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(220,38,38,0.12)" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" fill="none"/><line x1="12" y1="16" x2="12.01" y2="16" fill="none"/></svg>,
  more: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,

  // brand-ish icons for Integrations
  github: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>,
  slack: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 15a2 2 0 1 1-2-2h2zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0z" fill="#E01E5A"/><path d="M9 5a2 2 0 1 1 2-2v2zm0 1a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4z" fill="#36C5F0"/><path d="M19 9a2 2 0 1 1 2 2h-2zm-1 0a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0z" fill="#2EB67D"/><path d="M15 19a2 2 0 1 1-2 2v-2zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4z" fill="#ECB22E"/></svg>,
  linkedin: <svg width="26" height="26" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>,
  gdrive: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7.71 3l-6 10.39 3 5.19h12l3-5.19L13.71 3z" fill="#FFC107"/><path d="M1.71 13.39l3 5.19h12L13.71 13z" fill="#1976D2"/><path d="M7.71 3l-6 10.39h12L13.71 3z" fill="#4CAF50"/><path d="M22.29 13.39L16.29 3h-2.58l6 10.39z" fill="#FFC107" opacity=".4"/></svg>,
  notion: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4l13.5-1c.83-.06 1.5.61 1.5 1.44v15.4c0 .77-.6 1.4-1.37 1.44L5 22c-.77.04-1.4-.57-1.4-1.34V5.55c0-.78.55-1.43 1.32-1.5l-.42-.05zm.1 1.45c-.16.13-.19.32-.05.49l1.44 1.78v12.55c0 .35.31.62.66.6l11.55-.66c.28-.02.5-.25.5-.54V6.93c0-.28-.22-.5-.5-.51L5.66 5.13c-.4-.04-.81.17-.96.32z"/></svg>,
  teams: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="9" y="6" width="9" height="12" rx="1" fill="#4B53BC"/><text x="13.5" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial">T</text><circle cx="19" cy="9" r="2.5" fill="#7B83EB"/><circle cx="4.5" cy="10" r="3" fill="#7B83EB"/></svg>,
  webhook: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="12" cy="6" r="3"/><line x1="8.5" y1="16" x2="11" y2="11"/><line x1="13" y1="11" x2="15.5" y2="16"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
};

const TABS = [
  { id: 'profile', label: 'Profile Settings', icon: I.user },
  { id: 'account', label: 'Account', icon: I.card },
  { id: 'preferences', label: 'Preferences', icon: I.sliders },
  { id: 'notifications', label: 'Notifications', icon: I.bell },
  { id: 'security', label: 'Security', icon: I.shieldOutline },
  { id: 'integrations', label: 'Integrations', icon: I.puzzle },
];

const TIMEZONES = [
  '(GMT+05:30) Asia/Kolkata',
  '(GMT+00:00) UTC',
  '(GMT+01:00) Europe/London',
  '(GMT+09:00) Asia/Tokyo',
  '(GMT-05:00) America/New_York',
  '(GMT-08:00) America/Los_Angeles',
  '(GMT+10:00) Australia/Sydney',
  '(GMT+04:00) Asia/Dubai',
  '(GMT+08:00) Asia/Singapore',
];

const ROLE_OPTIONS = ['User', 'Cybersecurity Student', 'SOC Analyst', 'Pen Tester', 'Security Engineer', 'Security Manager'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Chinese (Simplified)'];
const DATE_FORMATS = ['May 20, 2024 (MMM D, YYYY)', '20 May 2024 (D MMM YYYY)', '05/20/2024 (MM/DD/YYYY)', '20/05/2024 (DD/MM/YYYY)', '2024-05-20 (YYYY-MM-DD)'];
const TIME_FORMATS = ['12-Hour (10:30 AM)', '24-Hour (10:30)'];
const LANDING_PAGES = ['Dashboard', 'Home', 'Scores', 'Badges', 'Interview', 'Billing'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Expert'];
const EMAIL_FREQ = ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Never'];
const APP_FREQ = ['Real-time', 'Batched', 'Daily digest'];

const INTEGRATIONS = [
  { id: 'github', name: 'GitHub', desc: 'Sync your repositories and track your security learning progress.', logo: I.github, defaultConnected: false },
  { id: 'slack', name: 'Slack', desc: 'Get updates, reminders, and notifications straight to your Slack workspace.', logo: I.slack, defaultConnected: false },
  { id: 'linkedin', name: 'LinkedIn', desc: 'Share your achievements and add badges to your LinkedIn profile.', logo: I.linkedin, defaultConnected: false },
  { id: 'gdrive', name: 'Google Drive', desc: 'Back up your reports and certificates to Google Drive.', logo: I.gdrive, defaultConnected: false },
  { id: 'notion', name: 'Notion', desc: 'Sync your notes, progress, and resources to Notion.', logo: I.notion, defaultConnected: false },
  { id: 'teams', name: 'Microsoft Teams', desc: 'Receive notifications and collaborate with your team in Teams.', logo: I.teams, defaultConnected: false },
  { id: 'webhook', name: 'Webhook (Custom)', desc: 'Send data to your custom webhook URL in real-time.', logo: I.webhook, defaultConnected: false },
];

/* ── helpers ── */
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' · ' +
      dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '—'; }
};
const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  } catch { return fallback; }
};
const lsSet = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch {}
};
const detectDevice = () => {
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS', browser = 'Unknown Browser', icon = I.desktop;
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) { os = 'Android'; icon = I.mobile; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = /iPad/i.test(ua) ? 'iPadOS' : 'iOS'; icon = I.mobile; }
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  if (os === 'macOS' && /Macintosh/i.test(ua)) icon = I.laptop;
  return { os, browser, icon };
};

// ── Billing helpers (mirrored from BillingTab so invoices look identical) ──
const formatBillingDate = (d) => {
  if (!d) return "—";
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export default function SettingsTab({
  user, setUser,
  settingsName, setSettingsName,
  profilePublic, setProfilePublic,
  inLeaderboard, setInLeaderboard,
  allowBenchmarking, setAllowBenchmarking,
  // ── Billing props (passed through from App.jsx the same way BillingTab gets them) ──
  subscribedRoles = [],
  billingPeriod = "yearly",
  setView, showConfirm,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [role, setRole] = useState(() => lsGet('cyberprep_role_pref', 'User'));
  const [timezone, setTimezone] = useState(() => {
    const stored = lsGet('cyberprep_tz_pref', null);
    if (stored) return stored;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TIMEZONES.find(t => t.includes(tz)) || TIMEZONES[0];
    } catch { return TIMEZONES[0]; }
  });

  /* ── Preferences state (all localStorage-backed) ── */
  const [language, setLanguage] = useState(() => lsGet('cyberprep_prefs_lang', 'English'));
  const [dateFormat, setDateFormat] = useState(() => lsGet('cyberprep_prefs_date_fmt', DATE_FORMATS[0]));
  const [timeFormat, setTimeFormat] = useState(() => lsGet('cyberprep_prefs_time_fmt', TIME_FORMATS[0]));
  const [landingPage, setLandingPage] = useState(() => lsGet('cyberprep_prefs_landing', 'Dashboard'));
  const [showRecentActivity, setShowRecentActivity] = useState(() => lsGet('cyberprep_prefs_show_recent', true));
  const [showLeaderboard, setShowLeaderboard] = useState(() => lsGet('cyberprep_prefs_show_lb', true));
  const [defaultDifficulty, setDefaultDifficulty] = useState(() => lsGet('cyberprep_prefs_default_diff', 'Intermediate'));
  const [autoAdvance, setAutoAdvance] = useState(() => lsGet('cyberprep_prefs_auto_advance', false));
  const [showHints, setShowHints] = useState(() => lsGet('cyberprep_prefs_show_hints', true));
  const [emailUpdates, setEmailUpdates] = useState(() => lsGet('cyberprep_prefs_email_updates', true));
  const [promoEmails, setPromoEmails] = useState(() => lsGet('cyberprep_prefs_promo_emails', false));
  const [weeklySummary, setWeeklySummary] = useState(() => lsGet('cyberprep_prefs_weekly_sum', true));

  /* ── Notification state ── */
  const [notif, setNotif] = useState(() => ({
    labReminders: lsGet('cyberprep_notif_lab_reminders', true),
    newFeatures: lsGet('cyberprep_notif_new_features', true),
    promotions: lsGet('cyberprep_notif_promotions', false),
    weeklyProgressEmail: lsGet('cyberprep_notif_weekly_progress_email', true),
    practiceReminders: lsGet('cyberprep_notif_practice_reminders', true),
    scoreUpdates: lsGet('cyberprep_notif_score_updates', true),
    badgeEarned: lsGet('cyberprep_notif_badge_earned', true),
    systemNotifs: lsGet('cyberprep_notif_system', true),
    emailFreq: lsGet('cyberprep_notif_email_freq', 'Weekly'),
    appFreq: lsGet('cyberprep_notif_app_freq', 'Real-time'),
  }));

  /* ── Security state ── */
  const [twoFa, setTwoFa] = useState(() => lsGet('cyberprep_security_2fa', false));

  /* ── Integrations state ── */
  const [integrations, setIntegrations] = useState(() => {
    const initial = {};
    INTEGRATIONS.forEach(it => { initial[it.id] = lsGet('cyberprep_integration_' + it.id, false); });
    return initial;
  });
  const [integrationConnectedAt, setIntegrationConnectedAt] = useState(() => {
    const initial = {};
    INTEGRATIONS.forEach(it => {
      const v = lsGet('cyberprep_integration_at_' + it.id, null);
      if (v) initial[it.id] = v;
    });
    return initial;
  });

  const initials = ((settingsName || user?.name || '?').trim()[0] || '?').toUpperCase();
  const isPaid = localStorage.getItem('isPaid') === 'true';
  const sessionStart = localStorage.getItem('cyberprep_session_start');
  const lastLoginDate = sessionStart ? new Date(parseInt(sessionStart)) : new Date();
  const currentDevice = detectDevice();

  // ── Derived: billing invoices (same logic as BillingTab so the two tabs stay in sync) ──
  const invoices = useMemo(() => {
    if (!Array.isArray(subscribedRoles) || subscribedRoles.length === 0) return [];
    const today = new Date();
    return subscribedRoles.map((rid, idx) => {
      const role = ROLES.find(r => r.id === rid);
      if (!role) return null;
      const yearly = billingPeriod === "yearly";
      const amount = yearly ? Math.round(role.price * 12 * 0.8) : role.price;
      const stamp = today.getTime() - idx * 86400000;
      const invoice_no = `INV-${today.getFullYear()}-${String(idx + 1).padStart(4, "0")}`;
      return {
        invoice_no,
        description: `${role.name} · ${yearly ? "Annual" : "Monthly"} Plan`,
        purchase_date: new Date(stamp),
        amount,
        status: isPaid ? "PAID" : "PENDING",
      };
    }).filter(Boolean);
  }, [subscribedRoles, billingPeriod, isPaid]);

  // ── Payment Method state (saved locally — wire to real gateway later) ──
  const [savedPayment, setSavedPayment] = useState(() => {
    try {
      const raw = localStorage.getItem('cyberprep_payment_method');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [paymentError, setPaymentError] = useState('');

  // ── Change Password modal state ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  // ── 2FA Setup modal state ──
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(1); // 1=intro, 2=verify, 3=backup, 4=disable
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState([]);
  // Stable demo secret per session (real app: comes from backend on setup)
  const twoFASecret = useMemo(() => {
    const stored = lsGet('cyberprep_security_2fa_secret', null);
    if (stored) return stored;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let s = '';
    for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }, []);

  // Detect card brand from first digit
  const detectCardBrand = (num) => {
    const d = num.replace(/\s/g, '');
    if (d.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
    if (/^3[47]/.test(d)) return 'Amex';
    if (/^6/.test(d)) return 'Discover';
    if (/^35/.test(d)) return 'JCB';
    return 'Card';
  };
  const formatCardNumber = (val) => {
    // strip non-digits, group in 4s, max 19 digits (Amex is 15, Visa/MC 16, others up to 19)
    const digits = val.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  };

  const openPaymentModal = () => {
    setPaymentForm({ cardholder: settingsName || user?.name || '', cardNumber: '', expiry: '', cvv: '' });
    setPaymentError('');
    setShowPaymentModal(true);
  };
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentError('');
  };
  const savePaymentMethod = () => {
    const { cardholder, cardNumber, expiry, cvv } = paymentForm;
    const digits = cardNumber.replace(/\s/g, '');
    if (!cardholder.trim()) { setPaymentError('Cardholder name is required'); return; }
    if (digits.length < 13 || digits.length > 19) { setPaymentError('Card number must be 13–19 digits'); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setPaymentError('Expiry must be MM/YY format'); return; }
    const [mm, yy] = expiry.split('/').map(s => parseInt(s, 10));
    if (mm < 1 || mm > 12) { setPaymentError('Invalid expiry month'); return; }
    const currentYY = new Date().getFullYear() % 100;
    if (yy < currentYY) { setPaymentError('Card has expired'); return; }
    if (!/^\d{3,4}$/.test(cvv)) { setPaymentError('CVV must be 3 or 4 digits'); return; }
    // Store only safe metadata — never full PAN or CVV
    const record = {
      brand: detectCardBrand(digits),
      last4: digits.slice(-4),
      cardholder: cardholder.trim(),
      expiry,
      added_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem('cyberprep_payment_method', JSON.stringify(record));
      setSavedPayment(record);
      setShowPaymentModal(false);
      showToast('Payment method added successfully', 'success');
    } catch {
      setPaymentError('Could not save — please try again');
    }
  };
  const removePaymentMethod = () => {
    showConfirm(
      'Remove payment method?',
      'Your card details will be removed from this device. You can add a new one anytime.',
      () => {
        try { localStorage.removeItem('cyberprep_payment_method'); } catch {}
        setSavedPayment(null);
        showToast('Payment method removed', 'info');
      }
    );
  };

  /* ── Handlers ── */
  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://threatready-db.onrender.com/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: settingsName || user?.name })
      });
      if (res.ok) {
        const updated = { ...user, name: settingsName || user?.name };
        setUser(updated);
        localStorage.setItem('cyberprep_user', JSON.stringify(updated));
        lsSet('cyberprep_role_pref', role);
        lsSet('cyberprep_tz_pref', timezone);
        setIsEditingProfile(false);
        showToast('Profile updated successfully!', 'success');
      } else { showToast('Failed to update profile', 'error'); }
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  };

  const savePrivacy = async (field, value, setter) => {
    setter(value);
    const token = localStorage.getItem('token');
    try {
      const body = {
        profile_public: field === 'profile_public' ? value : profilePublic,
        in_leaderboard: field === 'in_leaderboard' ? value : inLeaderboard,
        allow_benchmarking: field === 'allow_benchmarking' ? value : allowBenchmarking
      };
      const res = await fetch('https://threatready-db.onrender.com/api/settings/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) showToast('Privacy settings saved', 'success');
      else showToast('Failed to save settings', 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  };

  const downloadReport = async () => {
    showToast('Generating your report...', 'info');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://threatready-db.onrender.com/api/settings/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      const u = d.user || {}; const st = d.stats || {}; const scores = d.skill_scores || []; const sessions = d.sessions || []; const bdgs = d.badges || [];
      const avgScore = sessions.filter(s => s.overall_score).length > 0 ? (sessions.filter(s => s.overall_score).reduce((a, s) => a + parseFloat(s.overall_score || 0), 0) / sessions.filter(s => s.overall_score).length).toFixed(1) : '—';
      const bestScore = sessions.filter(s => s.overall_score).length > 0 ? Math.max(...sessions.filter(s => s.overall_score).map(s => parseFloat(s.overall_score || 0))).toFixed(1) : '—';
      const roleNames = { cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security', netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect', dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst', threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team' };
      const scoreRows = scores.map(s => `<tr><td style="padding:10px;font-weight:600">${roleNames[s.role_id] || s.role_id}</td><td style="padding:10px;font-weight:800;color:${s.total_score >= 7 ? '#00e096' : s.total_score >= 5 ? '#ffab40' : '#ff5252'}">${parseFloat(s.total_score || 0).toFixed(1)}/10</td><td style="padding:10px;color:${s.badge_level === 'Platinum' ? '#e2e8f0' : s.badge_level === 'Gold' ? '#f59e0b' : s.badge_level === 'Silver' ? '#94a3b8' : '#b45309'}">${s.badge_level || '—'}</td><td style="padding:10px">${s.percentile || 0}th percentile</td><td style="padding:10px;color:#8890b0">${new Date(s.updated_at).toLocaleDateString()}</td></tr>`).join('');
      const sessionRows = sessions.slice(0, 10).map(s => `<tr><td style="padding:8px;color:#8890b0">${s.scenario_id || '—'}</td><td style="padding:8px;font-weight:700;color:${parseFloat(s.overall_score || 0) >= 7 ? '#00e096' : parseFloat(s.overall_score || 0) >= 5 ? '#ffab40' : '#ff5252'}">${s.overall_score ? parseFloat(s.overall_score).toFixed(1) + '/10' : 'Incomplete'}</td><td style="padding:8px;color:${s.badge === 'Gold' ? '#f59e0b' : s.badge === 'Platinum' ? '#e2e8f0' : '#94a3b8'}">${s.badge || '—'}</td><td style="padding:8px;color:#ffab40">+${s.earned_xp || 0} XP</td><td style="padding:8px;color:#8890b0">${s.completed_at ? new Date(s.completed_at).toLocaleDateString() : 'In Progress'}</td></tr>`).join('');
      const badgeItems = bdgs.map(b => `<span style="display:inline-block;margin:4px;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:#00e5ff">🏅 ${b.name}</span>`).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ThreatReady Report - ${u.name || 'User'}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0e1a;color:#e8eaf6;padding:40px;line-height:1.6}.header{text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #1e2536}.logo{font-size:32px;font-weight:900;color:#00e5ff;letter-spacing:2px;margin-bottom:4px}.subtitle{font-size:13px;color:#8890b0}.name{font-size:22px;font-weight:800;margin:12px 0 4px}.email{font-size:13px;color:#8890b0}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.stat{background:#111827;border:1px solid #1e2536;border-radius:12px;padding:16px;text-align:center}.stat-val{font-size:28px;font-weight:900;color:#00e5ff;font-family:monospace}.stat-lbl{font-size:10px;color:#8890b0;margin-top:4px;text-transform:uppercase;letter-spacing:1px}.section{margin:28px 0}.section-title{font-size:11px;font-weight:800;color:#00e5ff;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #1e2536}table{width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden}th{background:#1a1f2e;padding:10px;text-align:left;font-size:10px;color:#00e5ff;letter-spacing:1px;text-transform:uppercase}tr{border-bottom:1px solid #1e2536}tr:last-child{border-bottom:none}tr:hover{background:#1a1f2e}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #1e2536;font-size:11px;color:#5a6380}@media print{body{background:var(--s1);color:#000}.header,.stat,.section{border-color:#ddd}.stat-val,.logo{color:#0066cc}th{background:#f0f0f0;color:#333}}</style></head><body><div class="header"><div class="logo">⚡ THREATREADY</div><div class="subtitle">Cybersecurity Assessment Platform — Personal Report</div><div class="name">${u.name || 'User'}</div><div class="email">${u.email || ''} &nbsp;·&nbsp; Member since ${new Date(u.created_at).toLocaleDateString()}</div></div><div class="stats-grid"><div class="stat"><div class="stat-val">${st.total_xp || 0}</div><div class="stat-lbl">Total XP</div></div><div class="stat"><div class="stat-val">${sessions.filter(s => s.completed_at).length}</div><div class="stat-lbl">Sessions Done</div></div><div class="stat"><div class="stat-val">${avgScore}</div><div class="stat-lbl">Avg Score</div></div><div class="stat"><div class="stat-val">${bestScore}</div><div class="stat-lbl">Best Score</div></div></div>${scores.length > 0 ? `<div class="section"><div class="section-title">Skill Scores by Role</div><table><thead><tr><th>Role</th><th>Score</th><th>Badge</th><th>Percentile</th><th>Last Updated</th></tr></thead><tbody>${scoreRows}</tbody></table></div>` : ''}${bdgs.length > 0 ? `<div class="section"><div class="section-title">Earned Badges (${bdgs.length})</div><div style="margin-top:8px">${badgeItems}</div></div>` : ''}${sessions.length > 0 ? `<div class="section"><div class="section-title">Recent Sessions (Last 10)</div><table><thead><tr><th>Scenario</th><th>Score</th><th>Badge</th><th>XP</th><th>Date</th></tr></thead><tbody>${sessionRows}</tbody></table></div>` : ''}<div class="footer">ThreatReady &nbsp;·&nbsp; Report generated on ${new Date().toLocaleString()} &nbsp;·&nbsp; Confidential</div></body></html>`;
      const w = window.open('', '_blank');
      w.document.write(html); w.document.close();
      setTimeout(() => w.print(), 600);
      showToast('Report ready — use Print → Save as PDF', 'success');
    } catch (e) { showToast('Report failed: ' + e.message, 'error'); }
  };

  const deleteAccount = () => {
    showConfirm('Delete your account permanently? All data will be lost.', async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('https://threatready-db.onrender.com/api/settings/delete-account', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { localStorage.clear(); setUser(null); setView('landing'); showToast('Account deleted.', 'info'); }
    });
  };

  const signOut = () => {
    showConfirm('Sign out of your account?', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('cyberprep_user');
      localStorage.removeItem('cyberprep_session_start');
      setUser(null);
      setView('landing');
      showToast('Signed out successfully', 'info');
    });
  };

  // ── Change Password ──
  const openPasswordModal = () => {
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setShowPwd({ current: false, next: false, confirm: false });
    setShowPasswordModal(true);
  };
  const closePasswordModal = () => {
    if (passwordLoading) return;
    setShowPasswordModal(false);
    setPasswordError('');
  };
  // Password strength (0-4)
  const pwdStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const submitChangePassword = async () => {
    const { current, next, confirm } = passwordForm;
    if (!current) { setPasswordError('Enter your current password'); return; }
    if (next.length < 8) { setPasswordError('New password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/\d/.test(next)) {
      setPasswordError('New password must include uppercase, lowercase, and a number');
      return;
    }
    if (next === current) { setPasswordError('New password must be different from current password'); return; }
    if (next !== confirm) { setPasswordError('New password and confirmation do not match'); return; }

    setPasswordLoading(true);
    setPasswordError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://threatready-db.onrender.com/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (res.ok) {
        showToast('Password changed successfully', 'success');
        setShowPasswordModal(false);
      } else if (res.status === 401 || res.status === 403) {
        setPasswordError('Current password is incorrect');
      } else if (res.status === 404 || res.status === 501) {
        // Endpoint not implemented yet — graceful fallback
        showToast('Password change endpoint not ready yet. Please use "Forgot Password" on the login page.', 'info');
        setShowPasswordModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordError(data?.error || 'Could not change password. Please try again.');
      }
    } catch {
      setPasswordError('Network error. Please check your connection and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── 2FA Setup ──
  const open2FAModal = () => {
    if (twoFa) {
      // Already enabled — go to disable flow
      setTwoFAStep(4);
    } else {
      setTwoFAStep(1);
    }
    setTwoFACode('');
    setTwoFAError('');
    setShow2FAModal(true);
  };
  const close2FAModal = () => {
    setShow2FAModal(false);
    setTwoFAError('');
    setTwoFACode('');
  };
  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.random().toString(36).slice(2, 6).toUpperCase();
      const b = Math.random().toString(36).slice(2, 6).toUpperCase();
      codes.push(`${a}-${b}`);
    }
    return codes;
  };
  const verify2FACode = () => {
    // Demo mode: accept any 6-digit numeric code (real TOTP would verify against twoFASecret)
    if (!/^\d{6}$/.test(twoFACode)) {
      setTwoFAError('Enter the 6-digit code from your authenticator app');
      return;
    }
    // Generate + persist backup codes, mark 2FA on
    const codes = generateBackupCodes();
    setTwoFABackupCodes(codes);
    setTwoFa(true);
    lsSet('cyberprep_security_2fa', true);
    lsSet('cyberprep_security_2fa_secret', twoFASecret);
    lsSet('cyberprep_security_2fa_backup', codes);
    setTwoFAError('');
    setTwoFAStep(3);
  };
  const finalize2FA = () => {
    setShow2FAModal(false);
    showToast('Two-factor authentication enabled', 'success');
  };
  const disable2FA = () => {
    if (!/^\d{6}$/.test(twoFACode)) {
      setTwoFAError('Enter your current 6-digit code to confirm');
      return;
    }
    setTwoFa(false);
    lsSet('cyberprep_security_2fa', false);
    try { localStorage.removeItem('cyberprep_security_2fa_secret'); } catch {}
    try { localStorage.removeItem('cyberprep_security_2fa_backup'); } catch {}
    setShow2FAModal(false);
    showToast('Two-factor authentication disabled', 'info');
  };
  const copyBackupCodes = () => {
    const text = twoFABackupCodes.join('\n');
    try {
      navigator.clipboard.writeText(text);
      showToast('Backup codes copied to clipboard', 'success');
    } catch {
      showToast('Could not copy — please save these codes manually', 'warning');
    }
  };

  const goToBilling = () => {
    try {
      localStorage.setItem('cyberprep_tab', 'billing');
      window.location.href = '/dashboard/billing';
    } catch {
      showToast('Open the Billing tab from the sidebar to manage your subscription.', 'info');
    }
  };

  const savePreferences = () => {
    lsSet('cyberprep_prefs_lang', language);
    lsSet('cyberprep_prefs_date_fmt', dateFormat);
    lsSet('cyberprep_prefs_time_fmt', timeFormat);
    lsSet('cyberprep_prefs_landing', landingPage);
    lsSet('cyberprep_prefs_show_recent', showRecentActivity);
    lsSet('cyberprep_prefs_show_lb', showLeaderboard);
    lsSet('cyberprep_prefs_default_diff', defaultDifficulty);
    lsSet('cyberprep_prefs_auto_advance', autoAdvance);
    lsSet('cyberprep_prefs_show_hints', showHints);
    lsSet('cyberprep_prefs_email_updates', emailUpdates);
    lsSet('cyberprep_prefs_promo_emails', promoEmails);
    lsSet('cyberprep_prefs_weekly_sum', weeklySummary);
    showToast('Preferences saved', 'success');
  };

  const toggleNotif = (key) => {
    setNotif(prev => {
      const next = { ...prev, [key]: !prev[key] };
      lsSet('cyberprep_notif_' + key.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), next[key]);
      return next;
    });
  };
  const setNotifFreq = (key, value) => {
    setNotif(prev => {
      const next = { ...prev, [key]: value };
      lsSet('cyberprep_notif_' + key.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), value);
      return next;
    });
  };
  const saveNotifications = () => {
    Object.keys(notif).forEach(key => {
      lsSet('cyberprep_notif_' + key.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), notif[key]);
    });
    showToast('Notification preferences saved', 'success');
  };
  const resetNotifications = () => {
    showConfirm('Reset all notification preferences to default?', () => {
      const defaults = { labReminders: true, newFeatures: true, promotions: false, weeklyProgressEmail: true, practiceReminders: true, scoreUpdates: true, badgeEarned: true, systemNotifs: true, emailFreq: 'Weekly', appFreq: 'Real-time' };
      setNotif(defaults);
      Object.keys(defaults).forEach(k => lsSet('cyberprep_notif_' + k.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), defaults[k]));
      showToast('Notifications reset to default', 'success');
    });
  };

  const toggleIntegration = (id) => {
    const currentlyConnected = integrations[id];
    if (currentlyConnected) {
      showConfirm(`Disconnect ${INTEGRATIONS.find(x => x.id === id)?.name}?`, () => {
        setIntegrations(prev => { const next = { ...prev, [id]: false }; lsSet('cyberprep_integration_' + id, false); return next; });
        setIntegrationConnectedAt(prev => { const next = { ...prev }; delete next[id]; localStorage.removeItem('cyberprep_integration_at_' + id); return next; });
        showToast(`${INTEGRATIONS.find(x => x.id === id)?.name} disconnected`, 'info');
      });
    } else {
      // Without backend OAuth, simulate connect
      setIntegrations(prev => { const next = { ...prev, [id]: true }; lsSet('cyberprep_integration_' + id, true); return next; });
      const now = new Date().toISOString();
      setIntegrationConnectedAt(prev => { const next = { ...prev, [id]: now }; lsSet('cyberprep_integration_at_' + id, now); return next; });
      showToast(`${INTEGRATIONS.find(x => x.id === id)?.name} connected (simulated — backend OAuth coming soon)`, 'success');
    }
  };

  const logoutAllOtherSessions = () => {
    showConfirm('Log out of all other sessions? You will stay signed in on this device.', () => {
      showToast('Other sessions logged out. (No other active sessions are currently tracked.)', 'info');
    });
  };

  /* ════════ TAB CONTENTS ════════ */

  const ProfileSettingsContent = () => (
    <>
      {/* Profile Settings card */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.userBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head">
            <h3 className="tr-set-card-title">Profile Settings</h3>
            <button
              type="button"
              className="tr-set-btn outline small"
              onClick={() => {
                if (isEditingProfile) {
                  // Cancel — revert any unsaved changes and lock
                  setSettingsName(user?.name || '');
                  setIsEditingProfile(false);
                } else {
                  setIsEditingProfile(true);
                  setTimeout(() => document.getElementById('tr-set-name-input')?.focus(), 0);
                }
              }}
            >
              {isEditingProfile ? 'Cancel' : (<>{I.edit} Edit Profile</>)}
            </button>
          </div>
          <div className="tr-set-form">
            <div className="tr-set-field">
              <label className="tr-set-label" htmlFor="tr-set-name-input">Full Name</label>
              <input id="tr-set-name-input" className="tr-set-input" value={settingsName ?? user?.name ?? ''} onChange={e => setSettingsName(e.target.value)} placeholder="Your full name" readOnly={!isEditingProfile} style={!isEditingProfile ? { cursor: 'not-allowed', opacity: 0.7 } : undefined} />
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Email Address</label>
              <input className="tr-set-input" value={user?.email || ''} disabled />
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Role</label>
              <select className="tr-set-select" value={role} onChange={e => setRole(e.target.value)} disabled={!isEditingProfile} style={!isEditingProfile ? { cursor: 'not-allowed', opacity: 0.7 } : undefined}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Timezone</label>
              <select className="tr-set-select" value={timezone} onChange={e => setTimezone(e.target.value)} disabled={!isEditingProfile} style={!isEditingProfile ? { cursor: 'not-allowed', opacity: 0.7 } : undefined}>
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button type="button" className="tr-set-btn" onClick={saveProfile} style={{ marginTop: 16, opacity: isEditingProfile ? 1 : 0.5, cursor: isEditingProfile ? 'pointer' : 'not-allowed' }} disabled={!isEditingProfile}>Save Changes</button>
        </div>
      </div>

      {/* Privacy card */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.lockBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Privacy</h3></div>
          <div className="tr-set-privacy">
            {[
              { id: 'profile_public', label: 'Make profile public', val: profilePublic, setter: setProfilePublic },
              { id: 'in_leaderboard', label: 'Include in leaderboard', val: inLeaderboard, setter: setInLeaderboard },
              { id: 'allow_benchmarking', label: 'Allow benchmarking data', val: allowBenchmarking, setter: setAllowBenchmarking },
            ].map(p => (
              <label key={p.id} className="tr-set-privacy-row">
                <span>{p.label}</span>
                <input type="checkbox" className="tr-set-checkbox" checked={!!p.val} onChange={e => savePrivacy(p.id, e.target.checked, p.setter)} />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Data card */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.dbBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Data</h3></div>
          <button type="button" className="tr-set-btn full" onClick={downloadReport}>{I.pdf} Download My Report (PDF)</button>
          <button type="button" className="tr-set-btn danger" onClick={deleteAccount} style={{ marginTop: 12 }}>{I.trash} Delete Account</button>
        </div>
      </div>
    </>
  );

  const AccountContent = () => (
    <>
      {/* Account Details */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.userBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head">
            <h3 className="tr-set-card-title">Account Details</h3>
            <button
              type="button"
              className="tr-set-btn outline small"
              onClick={() => {
                if (isEditingProfile) {
                  setSettingsName(user?.name || '');
                  setIsEditingProfile(false);
                } else {
                  setIsEditingProfile(true);
                  setTimeout(() => document.getElementById('tr-set-acct-name')?.focus(), 0);
                }
              }}
            >
              {isEditingProfile ? 'Cancel' : (<>{I.edit} Edit Details</>)}
            </button>
          </div>
          <div className="tr-set-form">
            <div className="tr-set-field">
              <label className="tr-set-label">Full Name</label>
              <input id="tr-set-acct-name" className="tr-set-input" value={settingsName ?? user?.name ?? ''} onChange={e => setSettingsName(e.target.value)} readOnly={!isEditingProfile} style={!isEditingProfile ? { cursor: 'not-allowed', opacity: 0.7 } : undefined} />
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Account Type</label>
              <div className="tr-set-acct-pill">{isPaid ? 'Premium Tier' : 'Free Tier'}</div>
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Email Address</label>
              <input className="tr-set-input" value={user?.email || ''} disabled />
            </div>
            <div className="tr-set-field">
              <label className="tr-set-label">Member Since</label>
              <div className="tr-set-acct-static">{fmtDate(user?.created_at)}</div>
            </div>
          </div>
          <button type="button" className="tr-set-btn" onClick={saveProfile} style={{ marginTop: 16, opacity: isEditingProfile ? 1 : 0.5, cursor: isEditingProfile ? 'pointer' : 'not-allowed' }} disabled={!isEditingProfile}>Save Changes</button>
        </div>
      </div>

      {/* Subscription */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.crown}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head">
            <h3 className="tr-set-card-title">Subscription</h3>
            <button type="button" className="tr-set-btn outline small" onClick={goToBilling}>{isPaid ? 'Manage Plan' : 'Upgrade Plan'}</button>
          </div>
          <div className="tr-set-sub-grid">
            <div>
              <div className="tr-set-label-sm">Current Plan</div>
              <div className="tr-set-big-text">{isPaid ? 'Premium' : 'Free Tier'}</div>
              <div className="tr-set-muted">{isPaid ? 'Full access to all labs, features, and premium support.' : 'Access to basic labs and features. Upgrade to unlock more.'}</div>
            </div>
            <div>
              <div className="tr-set-row-pair">
                <div className="tr-set-label-sm">Plan Status</div>
                <div><span className="tr-set-status-pill green">Active</span></div>
              </div>
              <div className="tr-set-row-pair" style={{ marginTop: 14 }}>
                <div className="tr-set-label-sm">Renews On</div>
                <div className="tr-set-acct-static">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.receipt}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Billing History</h3></div>
          <div className="tr-set-table-wrap">
            <table className="tr-set-table">
              <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Invoice</th></tr></thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="5" className="tr-set-empty-cell">
                    <div className="tr-set-empty-icon">{I.receipt}</div>
                    <div className="tr-set-empty-title">No billing history found.</div>
                    <div className="tr-set-empty-sub">Your transactions will appear here.</div>
                  </td></tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.invoice_no}>
                      <td>{formatBillingDate(inv.purchase_date)}</td>
                      <td>{inv.description}</td>
                      <td><strong>₹{inv.amount.toLocaleString("en-IN")}</strong></td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '.6px',
                          background: inv.status === 'PAID' ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.15)',
                          color: inv.status === 'PAID' ? '#10b981' : '#f59e0b',
                        }}>{inv.status}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inv.invoice_no}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.ccBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Payment Method</h3></div>
          {savedPayment ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 14, flexWrap: 'wrap', padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))',
              border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{
                  width: 50, height: 34, borderRadius: 6,
                  background: '#7c3aed', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, letterSpacing: '.5px',
                  flexShrink: 0,
                }}>{savedPayment.brand}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600, letterSpacing: '1.5px' }}>
                    •••• •••• •••• {savedPayment.last4}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                    {savedPayment.cardholder} · Exp {savedPayment.expiry}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="tr-set-btn outline small" onClick={openPaymentModal}>Replace</button>
                <button type="button" className="tr-set-btn outline small" onClick={removePaymentMethod} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}>Remove</button>
              </div>
            </div>
          ) : (
            <div className="tr-set-payment-empty">
              <div>
                <div className="tr-set-empty-title" style={{ textAlign: 'left' }}>No payment method added.</div>
                <div className="tr-set-empty-sub" style={{ textAlign: 'left' }}>Add a payment method to subscribe to paid plans.</div>
              </div>
              <button type="button" className="tr-set-btn outline small" onClick={openPaymentModal}>{I.plus} Add Payment Method</button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const PreferencesContent = () => (
    <>
      {/* General Preferences */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.slidersBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">General Preferences</h3></div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Language</div><div className="tr-set-pref-sub">Choose your preferred language.</div></div>
              <select className="tr-set-select narrow" value={language} onChange={e => setLanguage(e.target.value)}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Timezone</div><div className="tr-set-pref-sub">Choose your current timezone.</div></div>
              <select className="tr-set-select narrow" value={timezone} onChange={e => setTimezone(e.target.value)}>{TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Date Format</div><div className="tr-set-pref-sub">Choose how dates are displayed.</div></div>
              <select className="tr-set-select narrow" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>{DATE_FORMATS.map(d => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Time Format</div><div className="tr-set-pref-sub">Choose how time is displayed.</div></div>
              <select className="tr-set-select narrow" value={timeFormat} onChange={e => setTimeFormat(e.target.value)}>{TIME_FORMATS.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.pieBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Dashboard Preferences</h3></div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Default Landing Page</div><div className="tr-set-pref-sub">Choose what page to land on after login.</div></div>
              <select className="tr-set-select narrow" value={landingPage} onChange={e => setLandingPage(e.target.value)}>{LANDING_PAGES.map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Show Recent Activity</div><div className="tr-set-pref-sub">Display your recent activity on the dashboard.</div></div>
              <Toggle checked={showRecentActivity} onChange={setShowRecentActivity} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Show Leaderboard Snapshot</div><div className="tr-set-pref-sub">Display leaderboard snapshot on dashboard.</div></div>
              <Toggle checked={showLeaderboard} onChange={setShowLeaderboard} />
            </div>
          </div>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.bookBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Learning Preferences</h3></div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Default Lab Difficulty</div><div className="tr-set-pref-sub">Set the default difficulty level for labs.</div></div>
              <select className="tr-set-select narrow" value={defaultDifficulty} onChange={e => setDefaultDifficulty(e.target.value)}>{DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Auto-Advance to Next Question</div><div className="tr-set-pref-sub">Automatically go to the next question.</div></div>
              <Toggle checked={autoAdvance} onChange={setAutoAdvance} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Show Hints by Default</div><div className="tr-set-pref-sub">Show hints by default in labs and quizzes.</div></div>
              <Toggle checked={showHints} onChange={setShowHints} />
            </div>
          </div>
        </div>
      </div>

      {/* Content & Email Preferences */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.mailBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Content &amp; Email Preferences</h3></div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Email Updates</div><div className="tr-set-pref-sub">Receive updates about new features and improvements.</div></div>
              <Toggle checked={emailUpdates} onChange={setEmailUpdates} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Promotional Emails</div><div className="tr-set-pref-sub">Receive promotions and offers.</div></div>
              <Toggle checked={promoEmails} onChange={setPromoEmails} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Weekly Progress Summary</div><div className="tr-set-pref-sub">Receive a weekly summary of your progress.</div></div>
              <Toggle checked={weeklySummary} onChange={setWeeklySummary} />
            </div>
          </div>
          <button type="button" className="tr-set-btn" onClick={savePreferences} style={{ marginTop: 16 }}>Save Preferences</button>
        </div>
      </div>
    </>
  );

  const NotificationsContent = () => (
    <div className="tr-set-card fadeUp">
      <div className="tr-set-card-icon">{I.bellBig}</div>
      <div className="tr-set-card-body">
        <div className="tr-set-card-head">
          <div>
            <h3 className="tr-set-card-title">Notification Preferences</h3>
            <div className="tr-set-card-sub">Choose how and when you want to be notified.</div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="tr-set-notif-section">
          <div className="tr-set-notif-section-head">
            <span className="tr-set-notif-section-icon">{I.mailBig}</span>
            <span className="tr-set-notif-section-title">Email Notifications</span>
          </div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Lab Reminders</div><div className="tr-set-pref-sub">Get reminded about incomplete labs and practice.</div></div>
              <Toggle checked={notif.labReminders} onChange={() => toggleNotif('labReminders')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">New Features &amp; Updates</div><div className="tr-set-pref-sub">Receive emails about new features, improvements and announcements.</div></div>
              <Toggle checked={notif.newFeatures} onChange={() => toggleNotif('newFeatures')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Promotions &amp; Offers</div><div className="tr-set-pref-sub">Receive emails about special offers and promotions.</div></div>
              <Toggle checked={notif.promotions} onChange={() => toggleNotif('promotions')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Weekly Progress Summary</div><div className="tr-set-pref-sub">Receive a weekly summary of your learning progress.</div></div>
              <Toggle checked={notif.weeklyProgressEmail} onChange={() => toggleNotif('weeklyProgressEmail')} />
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="tr-set-notif-section">
          <div className="tr-set-notif-section-head">
            <span className="tr-set-notif-section-icon">{I.bellBig}</span>
            <span className="tr-set-notif-section-title">In-App Notifications</span>
          </div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Practice Reminders</div><div className="tr-set-pref-sub">Get notified to keep your streak and continue practicing.</div></div>
              <Toggle checked={notif.practiceReminders} onChange={() => toggleNotif('practiceReminders')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Score Updates</div><div className="tr-set-pref-sub">Get notified when your scores are updated.</div></div>
              <Toggle checked={notif.scoreUpdates} onChange={() => toggleNotif('scoreUpdates')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Badge Earned</div><div className="tr-set-pref-sub">Get notified when you earn a new badge.</div></div>
              <Toggle checked={notif.badgeEarned} onChange={() => toggleNotif('badgeEarned')} />
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">System Notifications</div><div className="tr-set-pref-sub">Important alerts about system and security.</div></div>
              <Toggle checked={notif.systemNotifs} onChange={() => toggleNotif('systemNotifs')} />
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="tr-set-notif-section">
          <div className="tr-set-notif-section-head">
            <span className="tr-set-notif-section-icon">{I.clockBig}</span>
            <span className="tr-set-notif-section-title">Notification Frequency</span>
          </div>
          <div className="tr-set-pref-list">
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">Email Frequency</div><div className="tr-set-pref-sub">Choose how often you want to receive emails.</div></div>
              <select className="tr-set-select narrow" value={notif.emailFreq} onChange={e => setNotifFreq('emailFreq', e.target.value)}>{EMAIL_FREQ.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div className="tr-set-pref-row">
              <div><div className="tr-set-pref-name">In-App Notification Frequency</div><div className="tr-set-pref-sub">Choose how often you want to receive in-app notifications.</div></div>
              <select className="tr-set-select narrow" value={notif.appFreq} onChange={e => setNotifFreq('appFreq', e.target.value)}>{APP_FREQ.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
          </div>
        </div>

        <div className="tr-set-action-row">
          <button type="button" className="tr-set-btn" onClick={saveNotifications}>Save Changes</button>
          <button type="button" className="tr-set-btn outline" onClick={resetNotifications}>Reset to Default</button>
        </div>
      </div>
    </div>
  );

  const SecurityContent = () => (
    <>
      {/* Password & Login */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.lockBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head"><h3 className="tr-set-card-title">Password &amp; Login</h3></div>
          <div className="tr-set-sec-row">
            <div>
              <div className="tr-set-sec-row-title">Password</div>
              <div className="tr-set-sec-row-sub">Last changed on {fmtDate(user?.created_at)}</div>
            </div>
            <button type="button" className="tr-set-btn outline small" onClick={openPasswordModal}>Change Password</button>
          </div>
          <div className="tr-set-sec-row">
            <div>
              <div className="tr-set-sec-row-title">Two-Factor Authentication (2FA)</div>
              <div className="tr-set-sec-row-sub">Add an extra layer of security to your account by enabling two-factor authentication.</div>
            </div>
            <button type="button" className={`tr-set-sec-toggle-pill${twoFa ? ' on' : ''}`} onClick={open2FAModal}>
              {twoFa ? <>{I.check} Enabled</> : 'Enable'} {I.chevR}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.monitor}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head">
            <div>
              <h3 className="tr-set-card-title">Active Sessions</h3>
              <div className="tr-set-card-sub">You're currently signed in on the devices listed below.</div>
            </div>
          </div>
          <div className="tr-set-session-row">
            <span className="tr-set-session-device-icon">{currentDevice.icon}</span>
            <div className="tr-set-session-info">
              <div className="tr-set-session-name">
                {currentDevice.os} • {currentDevice.browser}
                <span className="tr-set-session-this-pill">This device</span>
              </div>
              <div className="tr-set-session-meta">Current session</div>
            </div>
            <div className="tr-set-session-time">{fmtDateTime(lastLoginDate)}</div>
          </div>
          <div className="tr-set-session-empty">
            <div className="tr-set-empty-sub">No other active sessions detected. When you sign in from another device, it will appear here.</div>
          </div>
          <button type="button" className="tr-set-btn outline small" onClick={logoutAllOtherSessions} style={{ marginTop: 4 }}>Log out of all other sessions</button>
        </div>
      </div>

      {/* Login Activity */}
      <div className="tr-set-card fadeUp">
        <div className="tr-set-card-icon">{I.shieldBig}</div>
        <div className="tr-set-card-body">
          <div className="tr-set-card-head">
            <div>
              <h3 className="tr-set-card-title">Login Activity</h3>
              <div className="tr-set-card-sub">Review your recent account login activity.</div>
            </div>
            <button type="button" className="tr-set-btn outline small" onClick={() => showToast('Full activity history coming soon — backend logging in development.', 'info')}>View All Activity</button>
          </div>
          <div className="tr-set-activity-row">
            <span className="tr-set-activity-icon">{I.checkCircle}</span>
            <div className="tr-set-activity-info">
              <div className="tr-set-activity-title">Successful login</div>
              <div className="tr-set-activity-meta">{currentDevice.os} • {currentDevice.browser}</div>
            </div>
            <div className="tr-set-session-time">{fmtDateTime(lastLoginDate)}</div>
          </div>
          <div className="tr-set-activity-footer">
            Don't recognize an activity? <button type="button" className="tr-set-inline-link" onClick={openPasswordModal}>Change your password</button> and secure your account.
          </div>
        </div>
      </div>
    </>
  );

  const IntegrationsContent = () => (
    <div className="tr-set-card fadeUp">
      <div className="tr-set-card-body" style={{ paddingLeft: 0 }}>
        <div className="tr-set-card-head" style={{ marginBottom: 6 }}>
          <div>
            <h3 className="tr-set-card-title">Integrations</h3>
            <div className="tr-set-card-sub">Connect your favorite tools and services to enhance your learning experience.</div>
          </div>
        </div>
        <div className="tr-set-int-list">
          {INTEGRATIONS.map(it => {
            const connected = integrations[it.id];
            const connectedAt = integrationConnectedAt[it.id];
            return (
              <div key={it.id} className="tr-set-int-row" onClick={() => toggleIntegration(it.id)}>
                <span className="tr-set-int-logo">{it.logo}</span>
                <div className="tr-set-int-info">
                  <div className="tr-set-int-name">{it.name}</div>
                  <div className="tr-set-int-desc">{it.desc}</div>
                </div>
                <div className="tr-set-int-action">
                  {connected ? (
                    <>
                      <div className="tr-set-int-status">{I.check} Connected</div>
                      {connectedAt && <div className="tr-set-int-status-meta">Connected on {fmtDate(connectedAt)}</div>}
                    </>
                  ) : (
                    <button type="button" className="tr-set-btn outline small">Connect</button>
                  )}
                </div>
                <span className="tr-set-int-chev">{I.chevR}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="tr-set-root">
        {/* Page header */}
        <div className="tr-set-head fadeUp">
          <h1 className="tr-set-title">Settings</h1>
          <p className="tr-set-sub">Manage your account preferences and application settings.</p>
        </div>

        {/* 2-column grid */}
        <div className="tr-set-layout" style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? 'none' : 'auto' }}>

          {/* LEFT MAIN */}
          <div className="tr-set-main">
            {/* Tab nav */}
            <div className="tr-set-tabs fadeUp">
              {TABS.map(t => (
                <button key={t.id} type="button" className={`tr-set-tab${activeTab === t.id ? ' on' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.icon}<span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'profile' && ProfileSettingsContent()}
            {activeTab === 'account' && AccountContent()}
            {activeTab === 'preferences' && PreferencesContent()}
            {activeTab === 'notifications' && NotificationsContent()}
            {activeTab === 'security' && SecurityContent()}
            {activeTab === 'integrations' && IntegrationsContent()}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="tr-set-side">
            {/* Account Summary */}
            <div className="tr-set-account fadeUp">
              <h4 className="tr-set-side-title">Account Summary</h4>
              <div className="tr-set-account-avatar">{initials}</div>
              <div className="tr-set-account-name">{settingsName || user?.name || '—'}</div>
              <div className="tr-set-account-email">{user?.email || '—'}</div>
              <span className="tr-set-account-tier">{isPaid ? 'Premium Tier' : 'Free Tier'}</span>
              <div className="tr-set-account-meta">
                <div className="tr-set-account-meta-row">
                  <div className="tr-set-account-meta-lbl">Member since</div>
                  <div className="tr-set-account-meta-val">{fmtDate(user?.created_at)}</div>
                </div>
                <div className="tr-set-account-meta-row">
                  <div className="tr-set-account-meta-lbl">Last login</div>
                  <div className="tr-set-account-meta-val">{fmtDateTime(lastLoginDate)}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="tr-set-qa fadeUp">
              <h4 className="tr-set-side-title" style={{ padding: '0 14px' }}>Quick Actions</h4>
              <button type="button" className="tr-set-qa-link" onClick={openPasswordModal}>
                <span className="tr-set-qa-link-left">{I.lock} Change Password</span>
                <span className="tr-set-qa-link-right">{I.chevR}</span>
              </button>
              <button type="button" className="tr-set-qa-link" onClick={downloadReport}>
                <span className="tr-set-qa-link-left">{I.download} Download My Data</span>
                <span className="tr-set-qa-link-right">{I.chevR}</span>
              </button>
              <button type="button" className="tr-set-qa-link danger" onClick={deleteAccount}>
                <span className="tr-set-qa-link-left">{I.trash} Delete Account</span>
                <span className="tr-set-qa-link-right">{I.chevR}</span>
              </button>
              <button type="button" className="tr-set-qa-link danger" onClick={signOut}>
                <span className="tr-set-qa-link-left">{I.logout} Sign Out</span>
                <span className="tr-set-qa-link-right">{I.chevR}</span>
              </button>
            </div>

            {/* Help & Support */}
            <div className="tr-set-help fadeUp">
              <h4 className="tr-set-side-title">Help &amp; Support</h4>
              <button type="button" className="tr-set-help-link" onClick={() => window.open('https://threatready.io/help', '_blank')}>
                <span className="tr-set-help-link-left">{I.help} Visit our Help Center</span>{I.external}
              </button>
              <button type="button" className="tr-set-help-link" onClick={() => window.open('mailto:admin@aerovanttech.com', '_blank')}>
                <span className="tr-set-help-link-left">{I.chat} Contact Support</span>{I.external}
              </button>
              <button type="button" className="tr-set-help-link" onClick={() => window.open('https://threatready.io/faq', '_blank')}>
                <span className="tr-set-help-link-left">{I.shieldQ} FAQ</span>{I.external}
              </button>
              <div className="tr-set-help-note">
                <span className="tr-set-help-note-icon">{I.shieldQ}</span>
                <div>We're here to help you succeed in your cybersecurity journey!</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ══════ Add/Edit Payment Method Modal ══════ */}
      {showPaymentModal && (
        <div
          onClick={closePaymentModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10, 7, 24, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'tr-set-pm-fade 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460,
              background: 'var(--s1)',
              color: 'var(--tx1)',
              border: '1px solid var(--bd)',
              borderRadius: 16, padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'tr-set-pm-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', color: 'var(--tx1)' }}>
                {savedPayment ? 'Replace Payment Method' : 'Add Payment Method'}
              </h3>
              <button
                type="button"
                onClick={closePaymentModal}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'grid', placeItems: 'center',
                  color: 'inherit', opacity: 0.6,
                }}
                aria-label="Close"
              >✕</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 18 }}>
              Enter your card details below.
            </div>

            {/* Cardholder */}
            <div className="tr-set-field" style={{ marginBottom: 12 }}>
              <label className="tr-set-label" htmlFor="pm-cardholder">Cardholder Name</label>
              <input
                id="pm-cardholder"
                className="tr-set-input"
                value={paymentForm.cardholder}
                onChange={(e) => setPaymentForm(p => ({ ...p, cardholder: e.target.value }))}
                placeholder="Name on card"
                autoComplete="cc-name"
              />
            </div>

            {/* Card number */}
            <div className="tr-set-field" style={{ marginBottom: 12 }}>
              <label className="tr-set-label" htmlFor="pm-cardnumber">
                Card Number
                {paymentForm.cardNumber.replace(/\s/g, '').length >= 4 && (
                  <span style={{
                    marginLeft: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    background: '#7c3aed', color: '#fff', borderRadius: 4, letterSpacing: '.4px',
                  }}>{detectCardBrand(paymentForm.cardNumber)}</span>
                )}
              </label>
              <input
                id="pm-cardnumber"
                className="tr-set-input"
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm(p => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                autoComplete="cc-number"
                style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
              />
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="tr-set-field" style={{ marginBottom: 0 }}>
                <label className="tr-set-label" htmlFor="pm-expiry">Expiry (MM/YY)</label>
                <input
                  id="pm-expiry"
                  className="tr-set-input"
                  value={paymentForm.expiry}
                  onChange={(e) => setPaymentForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                />
              </div>
              <div className="tr-set-field" style={{ marginBottom: 0 }}>
                <label className="tr-set-label" htmlFor="pm-cvv">CVV</label>
                <input
                  id="pm-cvv"
                  className="tr-set-input"
                  value={paymentForm.cvv}
                  onChange={(e) => setPaymentForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  type="password"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Inline error */}
            {paymentError && (
              <div style={{
                padding: '9px 12px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(239,68,68,0.12)', color: '#f87171',
                fontSize: 12.5, fontWeight: 500,
                border: '1px solid rgba(239,68,68,0.25)',
              }}>{paymentError}</div>
            )}

            {/* Demo notice */}
            <div style={{
              padding: '10px 12px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(124,58,237,0.10)', color: '#c4b5fd',
              fontSize: 11.5, lineHeight: 1.5,
              border: '1px solid rgba(124,58,237,0.22)',
            }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>🔒 Demo Mode</strong>
              Card details are saved locally on this device only. No real charges are processed.
              Only your card brand and last 4 digits are stored — never the full number or CVV.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="tr-set-btn outline small" onClick={closePaymentModal}>
                Cancel
              </button>
              <button type="button" className="tr-set-btn" onClick={savePaymentMethod}>
                {savedPayment ? 'Update Card' : 'Save Card'}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes tr-set-pm-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes tr-set-pm-pop {
              from { opacity: 0; transform: scale(0.94) translateY(8px) }
              to { opacity: 1; transform: scale(1) translateY(0) }
            }
            /* Ensure form labels and inputs follow the active theme inside the modal */
            .tr-set-label { color: var(--tx2); }
            .tr-set-input {
              background: var(--s2) !important;
              color: var(--tx1) !important;
              border: 1px solid var(--bd) !important;
            }
            .tr-set-input::placeholder { color: var(--tx3); }
          `}</style>
        </div>
      )}

      {/* ══════ Change Password Modal ══════ */}
      {showPasswordModal && (
        <div
          onClick={closePasswordModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10, 7, 24, 0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'tr-set-pm-fade 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460,
              background: 'var(--ta-card-bg, #15101f)',
              border: '1px solid var(--ta-card-border, rgba(255,255,255,0.10))',
              borderRadius: 16, padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'tr-set-pm-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Change Password</h3>
              <button type="button" onClick={closePasswordModal} disabled={passwordLoading}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: passwordLoading ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', color: 'inherit', opacity: 0.6 }}
                aria-label="Close">✕</button>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 18 }}>
              Choose a strong password with at least 8 characters, mixing letters, numbers, and symbols.
            </div>

            {[
              { key: 'current', label: 'Current Password', placeholder: 'Enter current password', autoComplete: 'current-password' },
              { key: 'next',    label: 'New Password',     placeholder: 'At least 8 characters',  autoComplete: 'new-password' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password', autoComplete: 'new-password' },
            ].map(field => (
              <div key={field.key} className="tr-set-field" style={{ marginBottom: 12 }}>
                <label className="tr-set-label" htmlFor={`pwd-${field.key}`}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={`pwd-${field.key}`}
                    className="tr-set-input"
                    type={showPwd[field.key] ? 'text' : 'password'}
                    value={passwordForm[field.key]}
                    onChange={(e) => setPasswordForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    style={{ paddingRight: 40 }}
                    disabled={passwordLoading}
                  />
                  <button type="button"
                    onClick={() => setShowPwd(s => ({ ...s, [field.key]: !s[field.key] }))}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'inherit', opacity: 0.55 }}
                    aria-label={showPwd[field.key] ? 'Hide password' : 'Show password'}
                  >{showPwd[field.key] ? '🙈' : '👁'}</button>
                </div>
                {/* Strength bar — only under "New Password" */}
                {field.key === 'next' && passwordForm.next && (() => {
                  const s = pwdStrength(passwordForm.next);
                  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
                  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'];
                  return (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < s ? colors[s] : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 4, color: colors[s], fontWeight: 600 }}>{labels[s]}</div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {passwordError && (
              <div style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: 12.5, fontWeight: 500, border: '1px solid rgba(239,68,68,0.25)' }}>
                {passwordError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="tr-set-btn outline small" onClick={closePasswordModal} disabled={passwordLoading}>Cancel</button>
              <button type="button" className="tr-set-btn" onClick={submitChangePassword} disabled={passwordLoading} style={{ opacity: passwordLoading ? 0.6 : 1 }}>
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ 2FA Setup Modal ══════ */}
      {show2FAModal && (
        <div
          onClick={close2FAModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10, 7, 24, 0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'tr-set-pm-fade 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--ta-card-bg, #15101f)',
              border: '1px solid var(--ta-card-border, rgba(255,255,255,0.10))',
              borderRadius: 16, padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'tr-set-pm-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                {twoFAStep === 4 ? 'Disable Two-Factor Authentication' : 'Set Up Two-Factor Authentication'}
              </h3>
              <button type="button" onClick={close2FAModal}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'inherit', opacity: 0.6 }}
                aria-label="Close">✕</button>
            </div>

            {/* Step dots (only on enable flow, hide on disable step) */}
            {twoFAStep !== 4 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, marginTop: 12 }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: s <= twoFAStep ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.25s',
                  }} />
                ))}
              </div>
            )}

            {/* STEP 1: Intro */}
            {twoFAStep === 1 && (
              <>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, marginBottom: 18 }}>
                  Two-factor authentication adds an extra layer of security to your account. After enabling, you'll need both your password and a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password, etc.) to sign in.
                </div>
                <div style={{ padding: '12px 14px', background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 10, fontSize: 12.5, lineHeight: 1.5, color: '#c4b5fd', marginBottom: 20 }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>What you'll need:</strong>
                  • An authenticator app installed on your phone<br />
                  • A safe place to store your backup codes
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="tr-set-btn outline small" onClick={close2FAModal}>Cancel</button>
                  <button type="button" className="tr-set-btn" onClick={() => setTwoFAStep(2)}>Continue</button>
                </div>
              </>
            )}

            {/* STEP 2: Verify */}
            {twoFAStep === 2 && (
              <>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 14 }}>
                  Scan this QR code with your authenticator app, or enter the setup key manually.
                </div>

                {/* QR code placeholder — deterministic visual */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 180, height: 180, padding: 12,
                    background: '#fff', borderRadius: 10,
                    display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 1,
                  }}>
                    {Array.from({ length: 169 }).map((_, i) => {
                      // Deterministic pattern based on secret + position
                      const seed = twoFASecret.charCodeAt(i % twoFASecret.length) + i;
                      const filled = (seed * 7919) % 100 < 48;
                      // Corner finder patterns
                      const r = Math.floor(i / 13), c = i % 13;
                      const inFinder = (r < 3 && c < 3) || (r < 3 && c >= 10) || (r >= 10 && c < 3);
                      const finderBorder = (r === 0 || r === 2 || c === 0 || c === 2);
                      const finderCenter = (r === 1 && c === 1);
                      const inTopRight = (r < 3 && c >= 10) && ((r === 0 || r === 2 || c === 10 || c === 12) || (r === 1 && c === 11));
                      const inBotLeft = (r >= 10 && c < 3) && ((r === 10 || r === 12 || c === 0 || c === 2) || (r === 11 && c === 1));
                      let on = filled;
                      if (inFinder) {
                        if (r < 3 && c < 3) on = finderBorder || finderCenter;
                        else on = inTopRight || inBotLeft;
                      }
                      return <div key={i} style={{ background: on ? '#0f0a1f' : '#fff', aspectRatio: '1/1' }} />;
                    })}
                  </div>
                </div>

                <div className="tr-set-field" style={{ marginBottom: 14 }}>
                  <label className="tr-set-label">Or enter this setup key manually</label>
                  <div style={{
                    padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 8,
                    fontFamily: 'monospace', fontSize: 14, letterSpacing: '1.5px',
                    textAlign: 'center', userSelect: 'all',
                  }}>{twoFASecret.match(/.{1,4}/g).join(' ')}</div>
                </div>

                <div className="tr-set-field" style={{ marginBottom: 14 }}>
                  <label className="tr-set-label" htmlFor="tfa-code">Enter the 6-digit code from your app</label>
                  <input
                    id="tfa-code"
                    className="tr-set-input"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '6px', textAlign: 'center' }}
                  />
                </div>

                {twoFAError && (
                  <div style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: 12.5, fontWeight: 500, border: '1px solid rgba(239,68,68,0.25)' }}>
                    {twoFAError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="tr-set-btn outline small" onClick={() => setTwoFAStep(1)}>Back</button>
                  <button type="button" className="tr-set-btn" onClick={verify2FACode}>Verify &amp; Enable</button>
                </div>
              </>
            )}

            {/* STEP 3: Backup codes */}
            {twoFAStep === 3 && (
              <>
                <div style={{
                  padding: '12px 14px', marginBottom: 16,
                  background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 10, fontSize: 13, color: '#10b981',
                }}>
                  <strong>✓ 2FA Enabled.</strong> Save these backup codes somewhere safe — they're your only way to sign in if you lose your phone.
                </div>
                <div style={{
                  padding: 16, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
                  marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                }}>
                  {twoFABackupCodes.map((c) => (
                    <div key={c} style={{
                      fontFamily: 'monospace', fontSize: 13, padding: '6px 8px',
                      background: 'rgba(255,255,255,0.04)', borderRadius: 6, textAlign: 'center',
                      letterSpacing: '1px',
                    }}>{c}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <button type="button" className="tr-set-btn outline small" onClick={copyBackupCodes}>📋 Copy Codes</button>
                  <button type="button" className="tr-set-btn" onClick={finalize2FA}>Done</button>
                </div>
              </>
            )}

            {/* STEP 4: Disable */}
            {twoFAStep === 4 && (
              <>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 14, marginTop: 8 }}>
                  Disabling 2FA reduces your account security. You'll only need your password to sign in.
                </div>
                <div style={{
                  padding: '10px 12px', marginBottom: 16,
                  background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 8, fontSize: 12.5, color: '#fbbf24',
                }}>
                  ⚠ For safety, confirm by entering your current 6-digit code from your authenticator app.
                </div>
                <div className="tr-set-field" style={{ marginBottom: 14 }}>
                  <label className="tr-set-label" htmlFor="tfa-disable-code">Current 6-digit code</label>
                  <input
                    id="tfa-disable-code"
                    className="tr-set-input"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '6px', textAlign: 'center' }}
                  />
                </div>
                {twoFAError && (
                  <div style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: 12.5, fontWeight: 500, border: '1px solid rgba(239,68,68,0.25)' }}>
                    {twoFAError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="tr-set-btn outline small" onClick={close2FAModal}>Cancel</button>
                  <button type="button" className="tr-set-btn" onClick={disable2FA} style={{ background: '#dc2626' }}>Disable 2FA</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ Scoped styles ══════ */}
      <style>{`
.tr-set-root{font-family:'Inter','Segoe UI',sans-serif;color:var(--tx1,#1a1a2e)}
.tr-set-head{margin-bottom:22px}
.tr-set-title{font-size:26px;font-weight:800;margin:0 0 6px;color:var(--tx1,#1a1a2e);letter-spacing:-0.3px}
.tr-set-sub{font-size:14px;color:var(--tx2,#8890b0);margin:0}

.tr-set-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start}
@media (max-width:1100px){.tr-set-layout{grid-template-columns:1fr}}

.tr-set-main{display:flex;flex-direction:column;gap:16px;min-width:0}
.tr-set-side{display:flex;flex-direction:column;gap:16px}

/* Tabs */
.tr-set-tabs{display:flex;gap:4px;flex-wrap:wrap;background:transparent;border-bottom:1px solid var(--bd,#e9e5f3);padding:0;margin-bottom:2px}
.tr-set-tab{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;background:transparent;border:none;border-bottom:2px solid transparent;font-size:13px;font-weight:600;color:var(--tx2,#8890b0);cursor:pointer;font-family:inherit;margin-bottom:-1px;transition:all .15s ease}
.tr-set-tab:hover:not(.on){color:#7c3aed}
.tr-set-tab.on{color:#7c3aed;border-bottom-color:#7c3aed}

/* Card */
.tr-set-card{background:var(--s1,#fff);border:1px solid var(--bd,#e9e5f3);border-radius:14px;padding:22px;display:flex;gap:18px;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.tr-set-card-icon{width:46px;height:46px;border-radius:11px;background:rgba(124,58,237,.08);color:#7c3aed;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tr-set-card-body{flex:1;min-width:0}
.tr-set-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px;flex-wrap:wrap}
.tr-set-card-title{font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:2px;margin:0}
.tr-set-card-sub{font-size:13px;color:var(--tx2,#8890b0);margin-top:4px}

/* Form */
.tr-set-form{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}
@media (max-width:640px){.tr-set-form{grid-template-columns:1fr}}
.tr-set-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.tr-set-label{font-size:12px;font-weight:600;color:var(--tx1,#1a1a2e)}
.tr-set-label-sm{font-size:12px;font-weight:600;color:var(--tx1,#1a1a2e);margin-bottom:4px}
.tr-set-input,.tr-set-select{padding:10px 12px;background:var(--s2);border:1px solid var(--bd,#e9e5f3);border-radius:8px;font-size:13px;color:var(--tx1,#1a1a2e);font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s;width:100%;box-sizing:border-box}
.tr-set-select{cursor:pointer}
.tr-set-select.narrow{width:auto;min-width:200px;max-width:280px}
.tr-set-input:focus,.tr-set-select:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.08)}
.tr-set-input:disabled,.tr-set-select:disabled{opacity:.55;cursor:not-allowed;background:var(--s3)}

/* Buttons */
.tr-set-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;background:#7c3aed;border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease}
.tr-set-btn:hover:not(:disabled){background:#6d28d9;transform:translateY(-1px);box-shadow:0 4px 12px rgba(124,58,237,.25)}
.tr-set-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-set-btn.outline{background:transparent;border:1px solid var(--bd,#e9e5f3);color:var(--tx1,#1a1a2e)}
.tr-set-btn.outline:hover{border-color:#7c3aed;color:#7c3aed;background:rgba(124,58,237,.04);transform:none;box-shadow:none}
.tr-set-btn.danger{background:transparent;border:1px solid #fecaca;color:#dc2626}
.tr-set-btn.danger:hover{background:rgba(220,38,38,.10);border-color:#dc2626;transform:none;box-shadow:none}
.tr-set-btn.full{width:100%}
.tr-set-btn.small{padding:7px 12px;font-size:12px}

/* Privacy */
.tr-set-privacy{display:flex;flex-direction:column;gap:6px}
.tr-set-privacy-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;color:var(--tx1,#1a1a2e);cursor:pointer}
.tr-set-checkbox{width:20px;height:20px;cursor:pointer;accent-color:#7c3aed}

/* ── Account tab extras ── */
.tr-set-acct-pill{display:inline-block;padding:7px 14px;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:9px;font-size:13px;font-weight:600;width:fit-content}
.tr-set-acct-static{padding:10px 0;font-size:14px;font-weight:600;color:var(--tx1,#1a1a2e)}
.tr-set-sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media (max-width:640px){.tr-set-sub-grid{grid-template-columns:1fr}}
.tr-set-big-text{font-size:18px;font-weight:700;color:var(--tx1,#1a1a2e);margin-bottom:6px}
.tr-set-muted{font-size:12.5px;color:var(--tx2,#8890b0);line-height:1.5}
.tr-set-row-pair{}
.tr-set-status-pill{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11.5px;font-weight:700}
.tr-set-status-pill.green{background:rgba(16,185,129,.12);color:#059669}

/* Table */
.tr-set-table-wrap{overflow-x:auto;border:1px solid var(--bd,#e9e5f3);border-radius:10px}
.tr-set-table{width:100%;border-collapse:collapse;font-size:13px}
.tr-set-table th{padding:12px 14px;background:var(--s2);font-size:11px;font-weight:700;color:var(--tx2,#8890b0);letter-spacing:1px;text-transform:uppercase;text-align:left;border-bottom:1px solid var(--bd,#e9e5f3)}
.tr-set-table td{padding:14px}
.tr-set-empty-cell{text-align:center;padding:36px 14px !important}
.tr-set-empty-icon{display:inline-flex;width:46px;height:46px;border-radius:11px;background:rgba(124,58,237,.08);color:#7c3aed;align-items:center;justify-content:center;margin-bottom:10px}
.tr-set-empty-title{font-size:13.5px;font-weight:600;color:var(--tx1,#1a1a2e);text-align:center;margin-bottom:4px}
.tr-set-empty-sub{font-size:12.5px;color:var(--tx2,#8890b0);text-align:center}

.tr-set-payment-empty{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}

/* ── Preferences rows ── */
.tr-set-pref-list{display:flex;flex-direction:column;gap:6px}
.tr-set-pref-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid var(--bd,#e9e5f3)}
.tr-set-pref-row:last-child{border-bottom:none}
.tr-set-pref-name{font-size:13.5px;font-weight:600;color:var(--tx1,#1a1a2e);margin-bottom:2px}
.tr-set-pref-sub{font-size:12px;color:var(--tx2,#8890b0)}

/* Toggle switch */
.tr-set-toggle{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;cursor:pointer}
.tr-set-toggle input{opacity:0;width:0;height:0}
.tr-set-toggle-slider{position:absolute;inset:0;background:#cbd5e1;border-radius:24px;transition:background .2s}
.tr-set-toggle-slider:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:var(--s1);border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.tr-set-toggle input:checked + .tr-set-toggle-slider{background:#7c3aed}
.tr-set-toggle input:checked + .tr-set-toggle-slider:before{transform:translateX(18px)}

/* ── Notifications ── */
.tr-set-notif-section{padding-top:18px;margin-top:8px;border-top:1px solid var(--bd,#e9e5f3)}
.tr-set-notif-section:first-of-type{border-top:none;margin-top:0;padding-top:0}
.tr-set-notif-section-head{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.tr-set-notif-section-icon{width:36px;height:36px;border-radius:9px;background:rgba(124,58,237,.08);color:#7c3aed;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tr-set-notif-section-title{font-size:11.5px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px}
.tr-set-action-row{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}

/* ── Security ── */
.tr-set-sec-row{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--bd,#e9e5f3);flex-wrap:wrap}
.tr-set-sec-row:last-child{border-bottom:none}
.tr-set-sec-row-title{font-size:13.5px;font-weight:600;color:var(--tx1,#1a1a2e);margin-bottom:3px}
.tr-set-sec-row-sub{font-size:12.5px;color:var(--tx2,#8890b0);max-width:480px}
.tr-set-sec-toggle-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);color:#059669;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.tr-set-sec-toggle-pill:not(.on){background:transparent;border-color:var(--bd,#e9e5f3);color:var(--tx2,#8890b0)}

.tr-set-session-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--bd,#e9e5f3)}
.tr-set-session-row:last-of-type{border-bottom:none}
.tr-set-session-device-icon{width:36px;height:36px;border-radius:9px;background:var(--s2);color:var(--tx2,#8890b0);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tr-set-session-info{flex:1;min-width:0}
.tr-set-session-name{font-size:13.5px;font-weight:600;color:var(--tx1,#1a1a2e);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tr-set-session-this-pill{display:inline-block;padding:2px 8px;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:6px;font-size:10.5px;font-weight:700;letter-spacing:.3px}
.tr-set-session-meta{font-size:11.5px;color:var(--tx2,#8890b0);margin-top:2px}
.tr-set-session-time{font-size:12px;color:var(--tx2,#8890b0);font-weight:500;flex-shrink:0}
.tr-set-session-empty{padding:18px;text-align:center;background:var(--s2);border-radius:10px;margin:6px 0 12px}

.tr-set-activity-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd,#e9e5f3)}
.tr-set-activity-row:last-of-type{border-bottom:none}
.tr-set-activity-icon{flex-shrink:0;display:inline-flex;align-items:center}
.tr-set-activity-info{flex:1;min-width:0}
.tr-set-activity-title{font-size:13px;font-weight:600;color:var(--tx1,#1a1a2e)}
.tr-set-activity-meta{font-size:11.5px;color:var(--tx2,#8890b0);margin-top:2px}
.tr-set-activity-footer{margin-top:14px;padding-top:14px;border-top:1px solid var(--bd,#e9e5f3);font-size:12.5px;color:var(--tx2,#8890b0)}
.tr-set-inline-link{background:none;border:none;color:#7c3aed;font-weight:600;cursor:pointer;font-family:inherit;font-size:inherit;padding:0;text-decoration:none}
.tr-set-inline-link:hover{text-decoration:underline}

/* ── Integrations ── */
.tr-set-int-list{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.tr-set-int-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--s1,#fff);border:1px solid var(--bd,#e9e5f3);border-radius:11px;cursor:pointer;transition:all .15s ease}
.tr-set-int-row:hover{border-color:#c8bce8;background:var(--s2)}
.tr-set-int-logo{width:42px;height:42px;border-radius:10px;background:var(--s2);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.tr-set-int-info{flex:1;min-width:0}
.tr-set-int-name{font-size:14px;font-weight:700;color:var(--tx1,#1a1a2e);margin-bottom:3px}
.tr-set-int-desc{font-size:12.5px;color:var(--tx2,#8890b0);line-height:1.5}
.tr-set-int-action{flex-shrink:0;text-align:right}
.tr-set-int-status{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(16,185,129,.12);color:#059669;border:1px solid rgba(16,185,129,.25);border-radius:8px;font-size:11.5px;font-weight:700}
.tr-set-int-status-meta{font-size:11px;color:var(--tx2,#8890b0);margin-top:5px}
.tr-set-int-chev{color:var(--tx2,#8890b0);flex-shrink:0;display:inline-flex}

/* ── Sidebar titles ── */
.tr-set-side-title{font-size:14px;font-weight:700;margin:0 0 14px;color:var(--tx1,#1a1a2e)}

/* Account Summary */
.tr-set-account{background:var(--s1,#fff);border:1px solid var(--bd,#e9e5f3);border-radius:14px;padding:22px;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.tr-set-account-avatar{width:78px;height:78px;margin:8px auto 14px;border-radius:50%;background:linear-gradient(135deg,#f3eaff,#e9d5ff);color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;border:3px solid #fff;box-shadow:0 4px 12px rgba(124,58,237,.15)}
.tr-set-account-name{text-align:center;font-size:15px;font-weight:700;color:var(--tx1,#1a1a2e);margin:0}
.tr-set-account-email{text-align:center;font-size:12px;color:var(--tx2,#8890b0);margin:3px 0 12px;word-break:break-all}
.tr-set-account-tier{display:block;width:fit-content;margin:0 auto 18px;padding:5px 14px;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:12px;font-size:12px;font-weight:600}
.tr-set-account-meta{border-top:1px solid var(--bd,#e9e5f3);padding-top:14px;display:flex;flex-direction:column;gap:12px}
.tr-set-account-meta-row{font-size:12px}
.tr-set-account-meta-lbl{color:var(--tx2,#8890b0);margin-bottom:3px}
.tr-set-account-meta-val{color:var(--tx1,#1a1a2e);font-weight:600;font-size:13px}

/* Quick Actions */
.tr-set-qa{background:var(--s1,#fff);border:1px solid var(--bd,#e9e5f3);border-radius:14px;padding:18px 8px;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.tr-set-qa .tr-set-side-title{margin-bottom:6px}
.tr-set-qa-link{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:transparent;border:none;width:100%;font-size:13px;font-weight:500;color:var(--tx1,#1a1a2e);cursor:pointer;font-family:inherit;border-radius:8px;text-align:left;transition:background .15s,color .15s}
.tr-set-qa-link:hover{background:rgba(124,58,237,.06)}
.tr-set-qa-link.danger{color:#dc2626}
.tr-set-qa-link.danger:hover{background:rgba(220,38,38,.10)}
.tr-set-qa-link-left{display:inline-flex;align-items:center;gap:11px}
.tr-set-qa-link-right{color:var(--tx2,#8890b0);display:inline-flex;align-items:center}

/* Help & Support */
.tr-set-help{background:var(--s1,#fff);border:1px solid var(--bd,#e9e5f3);border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.tr-set-help-link{display:flex;align-items:center;justify-content:space-between;padding:9px 4px;background:transparent;border:none;width:100%;font-size:13px;font-weight:500;color:var(--tx1,#1a1a2e);cursor:pointer;font-family:inherit;text-align:left;transition:color .15s}
.tr-set-help-link:hover{color:#7c3aed}
.tr-set-help-link-left{display:inline-flex;align-items:center;gap:11px}
.tr-set-help-note{margin-top:14px;padding:14px;background:rgba(124,58,237,.06);border-radius:10px;display:flex;gap:11px;font-size:12.5px;color:var(--tx1,#1a1a2e);line-height:1.5;align-items:flex-start}
.tr-set-help-note-icon{flex-shrink:0;color:#7c3aed;margin-top:1px}

/* SVG defensive sizing */
.tr-set-root svg:not([width]){width:16px;height:16px}

/* Fade animation */
.tr-set-root .fadeUp{animation:trSetFade .35s ease both}
@keyframes trSetFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE OVERRIDES — gradients, branded chips, hover states
   ═══════════════════════════════════════════════════════════════ */

/* Form inputs in dark mode — explicit override of input bg */
[data-theme="dark"] .tr-set-input,
[data-theme="dark"] .tr-set-select{
  background: var(--s2);
  color: var(--tx1);
  border-color: var(--bd);
}
[data-theme="dark"] .tr-set-input:focus,
[data-theme="dark"] .tr-set-select:focus{
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167,139,250,.18);
}
[data-theme="dark"] .tr-set-input:disabled,
[data-theme="dark"] .tr-set-select:disabled{
  background: var(--s1);
  color: var(--tx3);
}
[data-theme="dark"] .tr-set-input::placeholder,
[data-theme="dark"] .tr-set-select::placeholder{
  color: var(--tx3);
  opacity: 1;
}

/* Outline + danger buttons in dark mode */
[data-theme="dark"] .tr-set-btn.outline{
  border-color: rgba(255,255,255,.14);
}
[data-theme="dark"] .tr-set-btn.outline:hover{
  border-color: #a78bfa;
  color: #c4b5fd;
  background: rgba(167,139,250,.10);
}
[data-theme="dark"] .tr-set-btn.danger{
  background: transparent;
  border-color: rgba(248,113,113,.40);
  color: #fca5a5;
}
[data-theme="dark"] .tr-set-btn.danger:hover{
  background: rgba(248,113,113,.12);
  border-color: #f87171;
}

/* Tab navigation pill */
[data-theme="dark"] .tr-set-tabs{
  background: var(--s2);
  border-color: var(--bd);
}
[data-theme="dark"] .tr-set-tab{
  color: var(--tx2);
}
[data-theme="dark"] .tr-set-tab:hover:not(.active){
  background: rgba(167,139,250,.08);
  color: var(--tx1);
}
[data-theme="dark"] .tr-set-tab.active{
  background: var(--s1);
  color: #c4b5fd;
}

/* Table header */
[data-theme="dark"] .tr-set-table th{
  background: var(--s2);
  border-color: var(--bd);
}
[data-theme="dark"] .tr-set-table tr{
  border-color: var(--bd);
}
[data-theme="dark"] .tr-set-table-wrap{
  border-color: var(--bd);
}

/* Toggle slider — off state needed lift in dark mode */
[data-theme="dark"] .tr-set-toggle-slider{
  background: rgba(255,255,255,.20);
}
[data-theme="dark"] .tr-set-toggle-slider:before{
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,.40);
}
[data-theme="dark"] .tr-set-toggle input:checked + .tr-set-toggle-slider{
  background: #a78bfa;
}

/* Notification section icon */
[data-theme="dark"] .tr-set-notif-section-icon{
  background: rgba(167,139,250,.15);
  color: #c4b5fd;
}
[data-theme="dark"] .tr-set-notif-section-title{
  color: #c4b5fd;
}

/* Acct pill + status pill + tier */
[data-theme="dark"] .tr-set-acct-pill,
[data-theme="dark"] .tr-set-account-tier{
  background: rgba(167,139,250,.18);
  color: #c4b5fd;
}
[data-theme="dark"] .tr-set-status-pill.green{
  background: rgba(52,211,153,.18);
  color: #6ee7b7;
}
[data-theme="dark"] .tr-set-empty-icon{
  background: rgba(167,139,250,.15);
  color: #c4b5fd;
}

/* Security toggle pill */
[data-theme="dark"] .tr-set-sec-toggle-pill{
  background: rgba(52,211,153,.18);
  border-color: rgba(52,211,153,.30);
  color: #6ee7b7;
}
[data-theme="dark"] .tr-set-sec-toggle-pill:not(.on){
  background: rgba(255,255,255,.04);
  border-color: var(--bd);
  color: var(--tx3);
}

/* Session "this device" pill */
[data-theme="dark"] .tr-set-session-this-pill{
  background: rgba(167,139,250,.18);
  color: #c4b5fd;
}

/* Account summary avatar */
[data-theme="dark"] .tr-set-account-avatar{
  background: linear-gradient(135deg, rgba(167,139,250,.30), rgba(124,58,237,.40));
  color: #f0eefa;
  border-color: var(--s1);
}

/* Quick Actions hover */
[data-theme="dark"] .tr-set-qa-link:hover{
  background: rgba(167,139,250,.10);
}
[data-theme="dark"] .tr-set-qa-link.danger{
  color: #fca5a5;
}
[data-theme="dark"] .tr-set-qa-link.danger:hover{
  background: rgba(248,113,113,.12);
}

/* Help & support */
[data-theme="dark"] .tr-set-help-link:hover{
  color: #c4b5fd;
}
[data-theme="dark"] .tr-set-help-note{
  background: rgba(167,139,250,.10);
}
[data-theme="dark"] .tr-set-help-note-icon{
  color: #c4b5fd;
}
[data-theme="dark"] .tr-set-inline-link{
  color: #c4b5fd;
}

/* Integration status badge */
[data-theme="dark"] .tr-set-int-status{
  background: rgba(52,211,153,.18);
  border-color: rgba(52,211,153,.30);
  color: #6ee7b7;
}

/* Side panel cards (Account Summary / Quick Actions / Help) */
[data-theme="dark"] .tr-set-account,
[data-theme="dark"] .tr-set-qa,
[data-theme="dark"] .tr-set-help{
  background: linear-gradient(180deg, rgba(255,255,255,.025) 0%, var(--s1) 100%);
  border-color: rgba(255,255,255,.08);
  box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.30);
}

/* Integration card */
[data-theme="dark"] .tr-set-int-row{
  background: var(--s1);
  border-color: rgba(255,255,255,.08);
}
[data-theme="dark"] .tr-set-int-row:hover{
  background: rgba(167,139,250,.08);
  border-color: rgba(167,139,250,.25);
}
[data-theme="dark"] .tr-set-int-logo{
  background: rgba(255,255,255,.06);
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — tablet (≤960) + phone (≤640 expanded) + small (≤420)
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 960px){
  .tr-set-layout{grid-template-columns:1fr !important}
  .tr-set-side{margin-top:14px}
}

@media (max-width: 640px){
  .tr-set-root{padding:0 4px}
  .tr-set-h{font-size:22px}
  .tr-set-sub{font-size:13px}

  .tr-set-tabs{padding:3px;margin-bottom:14px;overflow-x:auto}
  .tr-set-tab{padding:7px 12px;font-size:12.5px;white-space:nowrap}

  .tr-set-card{padding:16px;border-radius:12px}
  .tr-set-section-title{font-size:11px;letter-spacing:1.4px}

  .tr-set-input,.tr-set-select{padding:9px 11px;font-size:12.5px}
  .tr-set-label,.tr-set-label-sm{font-size:11.5px}
  .tr-set-btn{padding:9px 14px;font-size:12.5px}
  .tr-set-btn.small{padding:6px 10px;font-size:11.5px}

  .tr-set-pref-row{flex-wrap:wrap;gap:8px}
  .tr-set-pref-name{font-size:13px}
  .tr-set-pref-sub{font-size:11.5px}

  .tr-set-sec-row{flex-direction:column;align-items:stretch;gap:8px}
  .tr-set-sec-toggle-pill{align-self:flex-start}

  .tr-set-int-row{padding:11px 12px;gap:11px;flex-wrap:wrap}
  .tr-set-int-logo{width:36px;height:36px}
  .tr-set-int-name{font-size:13px}
  .tr-set-int-desc{font-size:11.5px}
  .tr-set-int-action{flex-basis:100%;text-align:left;margin-top:6px}

  .tr-set-table th,.tr-set-table td{padding:10px 11px;font-size:12px}
  .tr-set-table th{font-size:10px}

  .tr-set-account{padding:18px}
  .tr-set-account-avatar{width:66px;height:66px;font-size:26px;border-width:2px}
  .tr-set-qa,.tr-set-help{padding:14px 6px}
  .tr-set-qa-link,.tr-set-help-link{padding:10px 12px;font-size:12.5px}
}

@media (max-width: 420px){
  .tr-set-h{font-size:19px}
  .tr-set-tabs{margin-bottom:12px}
  .tr-set-tab{padding:6px 10px;font-size:11.5px}
  .tr-set-card{padding:14px;border-radius:11px}
  .tr-set-input,.tr-set-select{padding:8px 10px;font-size:12px}
  .tr-set-btn{padding:8px 12px;font-size:12px;border-radius:8px}
  .tr-set-account-avatar{width:60px;height:60px;font-size:22px}
}
      `}</style>
    </>
  );
}

/* ── Reusable toggle switch ── */
function Toggle({ checked, onChange }) {
  return (
    <label className="tr-set-toggle">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span className="tr-set-toggle-slider"></span>
    </label>
  );
}
