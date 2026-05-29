// ═══════════════════════════════════════════════════════════════
// BILLING TAB — REDESIGNED
// Matches reference design + adds the requested feature sections:
//   - Header (Billing + subtitle)  [NO Welcome banner — Home only]
//   - Monthly/Yearly toggle
//   - 2-column layout
//     LEFT:
//       • Current Plan card
//       • Purchased Course Details          (NEW)
//       • User Details                       (NEW)
//       • Subscribe to Unlock All Levels (12-role grid)
//       • Invoice Table + Download buttons   (NEW — incl. Email ID column)
//     RIGHT:
//       • Payment Summary
//       • Usage This Year
//       • Need Help?
//
// Preserved props (11):
//   user, isPaid, subscribedRoles, selectedRoles,
//   billingPeriod, setBillingPeriod, getRemainingAttempts,
//   toggleRole, getPrice, getDiscount, subscribe
// ═══════════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

// ── Scoped CSS ──
const BILL_CSS = `
.tr-bill-root{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:var(--tx1)}
.tr-bill-root svg:not([width]){width:16px;height:16px;flex-shrink:0}

/* Header */
.tr-bill-head{margin-bottom:18px}
.tr-bill-title{font-size:26px;font-weight:800;letter-spacing:-.6px;margin:0 0 4px;color:var(--tx1)}
.tr-bill-sub{font-size:13.5px;color:var(--tx2);font-weight:500;margin:0;line-height:1.5}

/* Monthly/Yearly toggle (lives inside Add More Roles card header) */
.tr-bill-roles-head{
  display:flex;align-items:center;justify-content:space-between;
  gap:14px;flex-wrap:wrap;margin-bottom:16px;
}
.tr-bill-toggle{
  display:inline-flex;gap:4px;padding:4px;
  background:var(--s1);border:1px solid var(--bd,#e9e5f3);border-radius:11px;
}
.tr-bill-toggle-btn{
  padding:8px 18px;
  background:transparent;border:none;border-radius:8px;
  font-size:13px;font-weight:600;color:var(--tx1);
  cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;gap:7px;
  transition:all .2s ease;
}
.tr-bill-toggle-btn:hover:not(.on){background:rgba(124,58,237,.06);color:#7c3aed}
.tr-bill-toggle-btn.on{
  background:#7c3aed;color:#fff;
  box-shadow:0 4px 12px rgba(124,58,237,.25);
}
.tr-bill-toggle-btn.on .tr-bill-toggle-discount{background:#fff;color:#15803d}
.tr-bill-toggle-discount{
  font-size:10.5px;font-weight:700;
  background:#dcfce7;color:#15803d;
  padding:2px 7px;border-radius:8px;
}

/* 2-column layout — TOP section. Both columns stretch to the same height (grid default).
   The last card in each column grows to fill any remaining vertical space so no empty area sits between the columns. */
/* Top zone: 2-column layout where each card sizes to its own content.
   Cards no longer stretch — eliminates empty space when one column has more content than the other. */
.tr-bill-layout{
  display:grid;
  grid-template-columns:minmax(0,1fr) 320px;
  gap:18px;
  margin-bottom:18px;
  align-items:start;
}
@media (max-width:1100px){.tr-bill-layout{grid-template-columns:1fr}}

/* Each column is an independent flex stack — cards flow without row-pairing */
.tr-bill-col{
  display:flex;
  flex-direction:column;
  gap:18px;
  min-width:0;
}
.tr-bill-col > .tr-bill-card{ margin:0; }

/* Full-width bottom section — Add More Roles + Invoices use 100% width */
.tr-bill-bottom{display:flex;flex-direction:column;gap:16px}

/* Card */
.tr-bill-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:20px;
}
.tr-bill-card-label{
  font-size:12px;font-weight:700;color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;
}
.tr-bill-card-title{font-size:15px;font-weight:700;color:var(--tx1);margin:0 0 4px}

/* Current Plan card */
.tr-bill-plan-row{display:flex;align-items:center;gap:16px}
.tr-bill-plan-icon{
  width:56px;height:56px;flex-shrink:0;
  display:grid;place-items:center;
  background:#ede9fe;
  border-radius:12px;
}
.tr-bill-plan-icon svg{width:26px;height:26px;color:#7c3aed}
.tr-bill-plan-body{min-width:0;flex:1}
.tr-bill-plan-name{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  font-size:18px;font-weight:700;color:var(--tx1);
}
.tr-bill-plan-pill{
  font-size:11px;font-weight:600;
  background:#ede9fe;color:#7c3aed;
  padding:3px 10px;border-radius:8px;
}
.tr-bill-plan-pill.active{background:#dcfce7;color:#15803d}
.tr-bill-plan-sub{font-size:13px;color:var(--tx2);margin-top:4px}

/* Course details list */

.tr-bill-courses-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
}
@media (max-width:900px){.tr-bill-courses-grid{grid-template-columns:1fr}}

.tr-bill-course-row{
  display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;
  padding:14px;
  background:var(--bg,#faf8ff);border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;
}
.tr-bill-course-row:last-child{margin-bottom:0}
.tr-bill-course-icon{
  width:44px;height:44px;
  display:grid;place-items:center;
  background:#fff;border-radius:10px;
  flex-shrink:0;
}
.tr-bill-course-icon svg{width:26px;height:26px}
.tr-bill-course-body{min-width:0}
.tr-bill-course-name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.tr-bill-course-name{font-size:14px;font-weight:700;color:var(--tx1)}
.tr-bill-course-status{
  font-size:10.5px;font-weight:700;
  padding:2px 9px;border-radius:7px;
  text-transform:uppercase;letter-spacing:.5px;
}
.tr-bill-course-status.active{background:#dcfce7;color:#15803d}
.tr-bill-course-status.trial{background:#fef3c7;color:#92400e}
.tr-bill-course-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 14px;font-size:11.5px;color:var(--tx2)}
.tr-bill-course-meta strong{color:var(--tx1);font-weight:600}
.tr-bill-empty{
  text-align:center;padding:20px 12px;
  font-size:13px;color:var(--tx2);
}

/* User details */
.tr-bill-user{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center}
.tr-bill-user-avatar{
  width:56px;height:56px;flex-shrink:0;
  display:grid;place-items:center;
  background:linear-gradient(135deg,#7c3aed,#6d28d9);
  color:#fff;border-radius:50%;
  font-size:20px;font-weight:700;letter-spacing:.5px;
}
.tr-bill-user-body{min-width:0}
.tr-bill-user-name{font-size:15px;font-weight:700;color:var(--tx1)}
.tr-bill-user-email{font-size:12.5px;color:var(--tx2);margin-top:2px}
.tr-bill-user-stats{
  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
  margin-top:14px;
  padding-top:14px;border-top:1px solid var(--bd,#e9e5f3);
}
.tr-bill-user-stat{text-align:center}
.tr-bill-user-stat-num{font-size:18px;font-weight:800;color:var(--tx1)}
.tr-bill-user-stat-lbl{font-size:11px;color:var(--tx2);margin-top:2px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}

/* Roles grid */
.tr-bill-roles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media (max-width:1280px){.tr-bill-roles{grid-template-columns:repeat(3,1fr)}}
@media (max-width:880px){.tr-bill-roles{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.tr-bill-roles{grid-template-columns:1fr}}
.tr-bill-role{
  position:relative;
  display:flex;align-items:flex-start;gap:14px;
  padding:14px;
  background:var(--s1,#fff);
  border:1.5px solid var(--bd,#e9e5f3);
  border-radius:12px;
  cursor:pointer;
  transition:all .2s ease;
}
.tr-bill-role:hover{transform:translateY(-2px);border-color:#c4b5fd;box-shadow:0 8px 22px rgba(124,58,237,.08)}
.tr-bill-role.sel{border-color:#7c3aed;background:rgba(124,58,237,.04)}
.tr-bill-role.sub{border-color:#10b981;background:rgba(16,185,129,.04);cursor:default}
.tr-bill-role.trial{border-color:#f59e0b;background:rgba(245,158,11,.04)}
.tr-bill-role-icon{
  width:46px;height:46px;flex-shrink:0;
  display:grid;place-items:center;
  background:var(--bg,#faf8ff);border-radius:10px;
}
.tr-bill-role-icon svg{width:28px;height:28px}
.tr-bill-role-body{min-width:0;flex:1}
.tr-bill-role-name{font-size:13.5px;font-weight:700;color:var(--tx1);margin-bottom:3px}
.tr-bill-role-price{font-size:13.5px;font-weight:700;color:var(--tx1);font-family:'JetBrains Mono','SF Mono',monospace}
.tr-bill-role-save{font-size:11.5px;color:#10b981;font-weight:600;margin-top:2px}
.tr-bill-role-tag{
  position:absolute;top:8px;right:8px;
  font-size:9.5px;font-weight:700;
  padding:2px 7px;border-radius:7px;
  text-transform:uppercase;letter-spacing:.5px;
}
.tr-bill-role-tag.active{background:#dcfce7;color:#15803d}
.tr-bill-role-tag.trial{background:#fef3c7;color:#92400e}
.tr-bill-role-check{
  position:absolute;top:8px;right:8px;
  width:20px;height:20px;border-radius:50%;
  background:#7c3aed;color:#fff;
  display:grid;place-items:center;
}
.tr-bill-role-check svg{width:11px;height:11px}

/* Bundle banner */
.tr-bill-bundle{
  margin-top:12px;
  padding:12px 16px;
  background:linear-gradient(135deg,#dcfce7,#bbf7d0);
  border:1px solid #86efac;
  border-radius:11px;
  font-size:13px;color:#15803d;font-weight:600;text-align:center;
}

/* Checkout summary */
.tr-bill-checkout{
  margin-top:12px;
  text-align:center;
  background:linear-gradient(135deg,#faf8ff,#f3eeff);
  border:1px solid #c4b5fd;
  border-radius:14px;
  padding:22px;
}
[data-theme="dark"] .tr-bill-checkout{
  background:linear-gradient(135deg, rgba(167,139,250,0.10), rgba(124,58,237,0.12));
  border-color:rgba(167,139,250,0.30);
}
[data-theme="dark"] .tr-bill-checkout-price{
  color:#c4b5fd;
}

.tr-bill-checkout-meta{font-size:12.5px;color:var(--tx2);margin-bottom:8px;font-weight:500}
.tr-bill-checkout-price{
  font-size:34px;font-weight:800;color:#7c3aed;letter-spacing:-1px;
  font-family:'JetBrains Mono','SF Mono',monospace;margin-bottom:4px;
}
.tr-bill-checkout-price .per{font-size:13px;color:var(--tx2);font-weight:500}
.tr-bill-checkout-disc{font-size:12px;color:#10b981;margin-bottom:14px;font-weight:600}
.tr-bill-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:11px 20px;
  background:linear-gradient(135deg,#7c3aed,#6d28d9);
  color:#fff;border:none;border-radius:10px;
  font-size:13.5px;font-weight:600;
  cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
.tr-bill-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.3)}
.tr-bill-btn.full{width:100%}
.tr-bill-btn.outline{background:#fff;color:#7c3aed;border:1px solid #c4b5fd}
.tr-bill-btn.outline:hover{background:#faf8ff;box-shadow:0 6px 16px rgba(124,58,237,.1)}
[data-theme="dark"] .tr-bill-btn.outline{
  background:rgba(167,139,250,0.10);
  color:#c4b5fd;
  border-color:rgba(167,139,250,0.30);
}
[data-theme="dark"] .tr-bill-btn.outline:hover{
  background:rgba(167,139,250,0.18);
  box-shadow:0 6px 16px rgba(124,58,237,.25);
}
.tr-bill-btn.small{padding:7px 13px;font-size:12px;border-radius:8px}

/* Invoice table */
.tr-bill-inv-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;
}
.tr-bill-inv-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tr-bill-inv-table{
  width:100%;
  border-collapse:separate;border-spacing:0;
  font-size:12.5px;
  min-width:720px;
}
.tr-bill-inv-table th{
  text-align:left;
  padding:10px 12px;
  font-size:11px;font-weight:700;color:var(--tx2);
  text-transform:uppercase;letter-spacing:1px;
  border-bottom:1px solid var(--bd,#e9e5f3);
  background:var(--bg,#faf8ff);
  white-space:nowrap;
}
.tr-bill-inv-table th:first-child{border-top-left-radius:10px}
.tr-bill-inv-table th:last-child{border-top-right-radius:10px;text-align:right}
.tr-bill-inv-table td{
  padding:11px 12px;
  border-bottom:1px solid var(--bd,#e9e5f3);
  color:var(--tx1);
  vertical-align:middle;
  white-space:nowrap;
}
.tr-bill-inv-table td:last-child{text-align:right}
.tr-bill-inv-table tr:last-child td{border-bottom:none}
.tr-bill-inv-table tr:hover td{background:#faf8ff}
[data-theme="dark"] .tr-bill-inv-table tr:hover td{background:rgba(167,139,250,0.08)}
[data-theme="dark"] .tr-bill-inv-table th{background:rgba(255,255,255,0.03)}
.tr-bill-inv-email{
  font-weight:600;color:#7c3aed;
  display:inline-block;padding:2px 8px;
  background:#ede9fe;border-radius:6px;
  font-size:12px;
}
.tr-bill-inv-mono{font-family:'JetBrains Mono','SF Mono',monospace;font-size:12px}
.tr-bill-inv-status{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11px;font-weight:700;
  padding:3px 9px;border-radius:8px;
  text-transform:uppercase;letter-spacing:.5px;
}
.tr-bill-inv-status.paid{background:#dcfce7;color:#15803d}
.tr-bill-inv-status.pending{background:#fef3c7;color:#92400e}
.tr-bill-inv-status.refunded{background:#fee2e2;color:#b91c1c}

/* Sidebar cards */
.tr-bill-side-title{font-size:15px;font-weight:700;color:var(--tx1);margin:0 0 12px}

/* Payment summary */
.tr-bill-pay-amt{
  font-size:36px;font-weight:800;color:var(--tx1);letter-spacing:-1px;
  font-family:'JetBrains Mono','SF Mono',monospace;
  line-height:1;margin:4px 0;
}
.tr-bill-pay-amt-lbl{font-size:12px;color:var(--tx2);margin-bottom:14px;font-weight:500}
.tr-bill-pay-info{
  padding:12px 0;
  border-top:1px solid var(--bd,#e9e5f3);
  border-bottom:1px solid var(--bd,#e9e5f3);
  margin-bottom:14px;
}
.tr-bill-pay-info-row{font-size:12.5px;color:var(--tx1);margin-bottom:6px;line-height:1.5}
.tr-bill-pay-info-row:last-child{margin-bottom:0}
.tr-bill-pay-info-row strong{color:var(--tx1);font-weight:600;display:block}

/* Usage */
.tr-bill-usage{display:flex;flex-direction:column;gap:14px}
.tr-bill-usage-row{}
.tr-bill-usage-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12.5px}
.tr-bill-usage-name{color:var(--tx1);font-weight:600}
.tr-bill-usage-val{color:var(--tx2);font-weight:500;font-family:'JetBrains Mono','SF Mono',monospace}
.tr-bill-usage-bar{
  height:6px;background:var(--bd,#e9e5f3);border-radius:3px;overflow:hidden;
}
.tr-bill-usage-fill{
  height:100%;
  background:linear-gradient(90deg,#7c3aed,#a78bfa);
  border-radius:3px;
  transition:width .4s ease;
}

/* Need help */
.tr-bill-help-link{
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 0;
  font-size:13px;color:var(--tx1);
  text-decoration:none;
  border-bottom:1px solid var(--bd,#e9e5f3);
  background:transparent;border-left:none;border-right:none;border-top:none;
  width:100%;cursor:pointer;font-family:inherit;font-weight:500;
}
.tr-bill-help-link:last-of-type{border-bottom:none}
.tr-bill-help-link:hover{color:#7c3aed}
.tr-bill-help-link-left{display:inline-flex;align-items:center;gap:8px}
.tr-bill-help-link-left svg{color:#7c3aed}
.tr-bill-help-link-right svg{color:var(--tx2);width:13px;height:13px}

.tr-bill-help-note{
  margin-top:12px;
  padding:12px;
  background:linear-gradient(135deg,#faf8ff,#f3eeff);
  border:1px solid #c4b5fd;
  border-radius:11px;
  font-size:12px;color:var(--tx1);line-height:1.5;
  display:flex;align-items:flex-start;gap:9px;
}
[data-theme="dark"] .tr-bill-help-note{
  background:linear-gradient(135deg, rgba(167,139,250,0.10), rgba(124,58,237,0.12));
  border-color:rgba(167,139,250,0.30);
}
.tr-bill-help-note-icon{
  width:24px;height:24px;flex-shrink:0;
  display:grid;place-items:center;
  background:#fff;border-radius:7px;color:#7c3aed;
}
[data-theme="dark"] .tr-bill-help-note-icon{
  background:rgba(167,139,250,0.18);
  color:#c4b5fd;
}
.tr-bill-help-note-icon svg{width:14px;height:14px}
`;

// ── Icons (every one explicitly sized) ──
const I = {
  shield: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  invoice: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>,
  help: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  faq: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  external: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  spark: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" /></svg>,
  user: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

// ── Per-role SVG icons (matching design's flat-colored icons; reused from Badges) ──
const ROLE_ICONS = {
  cloud: <svg width="28" height="28" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"><path d="M19 18H6a4 4 0 0 1-.6-7.95A6 6 0 0 1 17.7 9.5 4.5 4.5 0 0 1 19 18z" /></svg>,
  devsecops: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  appsec: <svg width="28" height="28" viewBox="0 0 24 24" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  netsec: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  prodsec: <svg width="28" height="28" viewBox="0 0 24 24" fill="#a47148" stroke="#7c4a2a" strokeWidth="1.4" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline fill="none" stroke="#5a3418" points="3.27 6.96 12 12.01 20.73 6.96" /><line fill="none" stroke="#5a3418" x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  secarch: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V9l8-4 8 4v12" /><rect x="9" y="13" width="6" height="8" fill="#fcd34d" /><line x1="13" y1="5" x2="13" y2="13" /><line x1="13" y1="5" x2="18" y2="3" /></svg>,
  dfir: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  grc: <svg width="28" height="28" viewBox="0 0 24 24" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><rect x="9" y="1.5" width="6" height="3" rx="1" fill="#94a3b8" stroke="none" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>,
  soc: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12a7 7 0 0 1 7-7" /><path d="M5 12a7 7 0 0 0 7 7" /><circle cx="5" cy="12" r="2" fill="#94a3b8" /><line x1="5" y1="14" x2="5" y2="22" /><line x1="2" y1="22" x2="8" y2="22" /></svg>,
  threat: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" fill="#fee2e2" /><circle cx="12" cy="12" r="2.5" fill="#dc2626" stroke="none" /></svg>,
  red: <svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626" /><circle cx="9" cy="9" r="2.5" fill="#ef4444" opacity=".6" /></svg>,
  blue: <svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb" /><circle cx="9" cy="9" r="2.5" fill="#3b82f6" opacity=".6" /></svg>,
  iam: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="14" r="6" fill="#e0f2fe" /><circle cx="9" cy="14" r="2.5" fill="#0ea5e9" stroke="none" /><path d="M14 11l7-7" /><path d="M19 4l2 2" /><path d="M16 7l2 2" /></svg>,
  data: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" fill="#d1fae5" /><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" /></svg>,
  llm: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v3a3 3 0 0 0 1 2.24V18a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2.76A3 3 0 0 0 19 13v-3a3 3 0 0 0-3-3V6a4 4 0 0 0-4-4z" fill="#f3e8ff" /><circle cx="9" cy="11" r="1" fill="#a855f7" stroke="none" /><circle cx="15" cy="11" r="1" fill="#a855f7" stroke="none" /><path d="M9 15h6" /></svg>,
};

// ── Helpers ──
const formatDate = (d) => {
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

const buildInvoiceHTML = (inv) => {
  // Simple printable HTML invoice — opens in a new window where the user can Print → Save as PDF
  return `<!doctype html><html><head><meta charset="utf-8"><title>${inv.invoice_no}</title>
<style>
  body{font-family:'Inter',Arial,sans-serif;color:#1a1530;padding:40px;max-width:720px;margin:0 auto}
  h1{font-size:28px;margin:0 0 4px;letter-spacing:-.5px}
  .muted{color:#7a7395;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:24px 0}
  th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e9e5f3;font-size:13px}
  th{text-transform:uppercase;letter-spacing:1px;font-size:11px;color:#7a7395;background:#faf8ff}
  .total{font-size:22px;font-weight:800;color:#7c3aed;margin-top:24px;text-align:right}
  .status{display:inline-block;padding:2px 9px;border-radius:8px;background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;text-transform:uppercase}
  .row{display:flex;justify-content:space-between;margin-bottom:16px;align-items:flex-start}
  .brand{font-size:18px;font-weight:800;color:#7c3aed;letter-spacing:-.3px}
  @media print{body{padding:20px}}
</style></head><body>
<div class="row">
  <div><div class="brand">ThreatReady.io</div><div class="muted">Cybersecurity Interview Practice</div></div>
  <div style="text-align:right"><h1>INVOICE</h1><div class="muted">${inv.invoice_no}</div></div>
</div>
<div class="row">
  <div><div class="muted">BILLED TO</div><div style="font-weight:600">${inv.user_name}</div><div class="muted" style="margin-top:2px">${inv.user_email}</div></div>
  <div style="text-align:right"><div class="muted">DATE</div><div>${formatDate(inv.purchase_date)}</div></div>
</div>
<table>
  <thead><tr><th>Course ID</th><th>Description</th><th>Payment ID</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody><tr>
    <td>${inv.course_id}</td>
    <td>${inv.description}</td>
    <td>${inv.payment_id}</td>
    <td style="text-align:right">₹${inv.amount.toLocaleString("en-IN")}</td>
  </tr></tbody>
</table>
<div class="row"><div class="muted">Status: <span class="status">${inv.status}</span></div></div>
<div class="total">Total: ₹${inv.amount.toLocaleString("en-IN")}</div>
<p class="muted" style="margin-top:32px;font-size:11px">Auto-generated invoice. For queries contact admin@aerovanttech.com</p>
<script>setTimeout(()=>window.print(),300);</script>
</body></html>`;
};

const downloadFile = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

export default function BillingTab({
  user,
  isPaid,
  subscribedRoles,
  selectedRoles,
  billingPeriod,
  setBillingPeriod,
  getRemainingAttempts,
  toggleRole,
  getPrice,
  getDiscount,
  localSessionHistory,
  completedScenarios,
  subscribe,
}) {

  // Derived: purchased courses (from subscribedRoles)
  const purchasedCourses = useMemo(() => {
    if (!Array.isArray(subscribedRoles)) return [];
    const today = new Date();
    return subscribedRoles.map((rid) => {
      const role = ROLES.find(r => r.id === rid);
      if (!role) return null;
      const periodMonths = billingPeriod === "yearly" ? 12 : 1;
      const startDate = today;
      const endDate = addMonths(today, periodMonths);
      const attempts = isPaid ? "Unlimited"
        : (typeof getRemainingAttempts === "function" ? getRemainingAttempts(rid) : 0) + " left";
      return {
        id: rid,
        name: role.name,
        icon: ROLE_ICONS[rid],
        startDate, endDate,
        attempts,
        plan: isPaid ? (billingPeriod === "yearly" ? "Annual" : "Monthly") : "Free Trial",
        level: isPaid ? "All levels" : "Beginner only",
        status: isPaid ? "Active" : "Trial",
      };
    }).filter(Boolean);
  }, [subscribedRoles, billingPeriod, isPaid, getRemainingAttempts]);

  // Derived: invoices (one per purchased course, with stable mock IDs)
  const invoices = useMemo(() => {
    if (!Array.isArray(subscribedRoles) || subscribedRoles.length === 0) return [];
    const today = new Date();
    return subscribedRoles.map((rid, idx) => {
      const role = ROLES.find(r => r.id === rid);
      if (!role) return null;
      const yearly = billingPeriod === "yearly";
      const amount = yearly ? Math.round(role.price * 12 * 0.8) : role.price;
      // Stable IDs (deterministic per role id)
      const stamp = today.getTime() - idx * 86400000;
      const invoice_no = `INV-${today.getFullYear()}-${String(idx + 1).padStart(4, "0")}`;
      const payment_id = `PAY-${rid.toUpperCase()}-${stamp.toString().slice(-8)}`;
      const course_id = `COURSE-${rid.toUpperCase()}-${yearly ? "ANN" : "MON"}`;
      return {
        invoice_no,
        user_name: user?.name || user?.email?.split("@")[0] || "User",
        user_email: user?.email || "—",
        payment_id,
        course_id,
        description: `${role.name} · ${yearly ? "Annual" : "Monthly"} Plan`,
        purchase_date: new Date(stamp),
        amount,
        status: isPaid ? "PAID" : "PENDING",
      };
    }).filter(Boolean);
  }, [subscribedRoles, billingPeriod, isPaid, user]);

  // Initials for avatar
  const initials = useMemo(() => {
    const name = user?.name || user?.email?.split("@")[0] || "U";
    return name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
  }, [user]);

  // Payment summary
  const totalAmount = useMemo(() => {
    if (selectedRoles?.length > 0 && typeof getPrice === "function") {
      const base = getPrice();
      return billingPeriod === "yearly" ? Math.round(base * 12 * 0.8) : base;
    }
    return 0;
  }, [selectedRoles, getPrice, billingPeriod]);

  // Usage stats — wired to REAL data from sessions and completed scenarios
  const usage = useMemo(() => {
    const completedCount = Array.isArray(completedScenarios)
      ? completedScenarios.length
      : (completedScenarios?.size || 0);
    const sessionsCount = Array.isArray(localSessionHistory) ? localSessionHistory.length : 0;
    const freeLimit = 2;
    return [
      {
        name: "Scenarios Completed",
        cur: completedCount,
        max: isPaid ? Math.max(50, completedCount) : freeLimit,
        suffix: "completed",
        textLabel: isPaid ? `${completedCount} completed` : `${completedCount} / ${freeLimit} used`,
      },
      {
        name: "Total Sessions",
        cur: sessionsCount,
        max: isPaid ? Math.max(100, sessionsCount) : freeLimit,
        suffix: "sessions",
        textLabel: isPaid ? `${sessionsCount} sessions` : `${sessionsCount} / ${freeLimit} used`,
      },
      {
        name: "Plan Tier",
        cur: isPaid ? 1 : 0,
        max: 1,
        suffix: "tier",
        textLabel: isPaid ? "Premium" : "Free Trial",
      },
    ];
  }, [completedScenarios, localSessionHistory, isPaid]);

  // ── Handlers ──
  const handleDownloadInvoicePDF = (inv) => {
    // Opens a printable invoice; user uses browser's "Save as PDF"
    const html = buildInvoiceHTML(inv);
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) { showToast("Pop-up blocked. Please allow pop-ups to download.", "error"); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handleExportAllInvoices = () => {
    if (invoices.length === 0) { showToast("No invoices to export", "warning"); return; }
    const header = ["Invoice Number", "User Name", "Email ID", "Payment ID", "Course ID", "Purchase Date", "Amount (INR)", "Status"];
    const csvRows = [
      header.join(","),
      ...invoices.map(i => [
        i.invoice_no, `"${i.user_name}"`, i.user_email, i.payment_id, i.course_id,
        formatDate(i.purchase_date), i.amount, i.status,
      ].join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    downloadFile(`threatready-invoices-${new Date().toISOString().slice(0, 10)}.csv`, blob);
  };

  return (
    <>
      <style>{BILL_CSS}</style>

      <div className="tr-bill-root" style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>

        {/* ── Header ── */}
        <div className="tr-bill-head fadeUp">
          <h2 className="tr-bill-title">Billing</h2>
          <p className="tr-bill-sub">Manage your subscription, payment methods, and billing history.</p>
        </div>

        {/* ── 2-column layout: LEFT and RIGHT columns flow independently ── */}
        <div className="tr-bill-layout">

          {/* ── LEFT COLUMN ── */}
          <div className="tr-bill-col">

            {/* Current Plan */}
            <div className="tr-bill-card fadeUp">
              <div className="tr-bill-card-label">Current Plan</div>
              <div className="tr-bill-plan-row">
                <div className="tr-bill-plan-icon">{I.shield}</div>
                <div className="tr-bill-plan-body">
                  <div className="tr-bill-plan-name">
                    {isPaid ? `${subscribedRoles?.length || 0} Role${(subscribedRoles?.length || 0) > 1 ? "s" : ""} · Active` : "Free Trial"}
                    <span className={`tr-bill-plan-pill${isPaid ? " active" : ""}`}>
                      {isPaid ? "Active" : "Current Plan"}
                    </span>
                  </div>
                  <div className="tr-bill-plan-sub">
                    {isPaid
                      ? (subscribedRoles?.map(r => ROLES.find(x => x.id === r)?.name).filter(Boolean).join(", ") || "All access")
                      : (subscribedRoles?.length > 0 ? "Free trial active · Beginner level only" : "Select roles to start trial")}
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Course Details */}
            <div className="tr-bill-card fadeUp">
              <div className="tr-bill-card-label">Purchased Course Details</div>
              {purchasedCourses.length === 0 ? (
                <div className="tr-bill-empty">No courses purchased yet. Select roles below to start.</div>
              ) : (
                <div className="tr-bill-courses-grid">
                {purchasedCourses.map(c => (
                  <div key={c.id} className="tr-bill-course-row">
                    <div className="tr-bill-course-icon">{c.icon}</div>
                    <div className="tr-bill-course-body">
                      <div className="tr-bill-course-name-row">
                        <span className="tr-bill-course-name">{c.name}</span>
                        <span className={`tr-bill-course-status ${c.status === "Active" ? "active" : "trial"}`}>{c.status}</span>
                      </div>
                      <div className="tr-bill-course-meta">
                        <span>Start: <strong>{formatDate(c.startDate)}</strong></span>
                        <span>End: <strong>{formatDate(c.endDate)}</strong></span>
                        <span>Attempts: <strong>{c.attempts}</strong></span>
                        <span>Plan: <strong>{c.plan}</strong></span>
                        <span style={{ gridColumn: "1 / -1" }}>Access: <strong>{c.level}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
            
          </div>
          {/* ── end LEFT COLUMN ── */}

          {/* ── RIGHT COLUMN ── */}
          <div className="tr-bill-col">

            {/* Payment Summary */}
            <div className="tr-bill-card fadeUp">
              <h4 className="tr-bill-side-title">Payment Summary</h4>
              <div className="tr-bill-pay-amt">₹{totalAmount.toLocaleString("en-IN")}</div>
              <div className="tr-bill-pay-amt-lbl">Total Amount</div>
              <div className="tr-bill-pay-info">
                <div className="tr-bill-pay-info-row">
                  <strong>{totalAmount > 0 ? "Upcoming payment" : "No upcoming payment"}</strong>
                  {isPaid ? `You are on the ${billingPeriod === "yearly" ? "Annual" : "Monthly"} plan` : "You are on Free Trial plan"}
                </div>
              </div>
              <button type="button" className="tr-bill-btn full" onClick={subscribe}>
                {isPaid ? "Manage Plan" : "Upgrade Plan"}
              </button>
            </div>

            {/* Usage This Year */}
            <div className="tr-bill-card fadeUp">
              <h4 className="tr-bill-side-title">Usage This Year</h4>
              <div className="tr-bill-usage">
                {usage.map((u) => (
                  <div key={u.name} className="tr-bill-usage-row">
                    <div className="tr-bill-usage-head">
                      <span className="tr-bill-usage-name">{u.name}</span>
                      <span className="tr-bill-usage-val">
                        {u.textLabel || `${u.cur} / ${u.max} ${u.suffix}`}
                      </span>
                    </div>
                    <div className="tr-bill-usage-bar">
                      <div className="tr-bill-usage-fill" style={{ width: `${Math.min(100, (u.cur / Math.max(u.max, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help? */}
            <div className="tr-bill-card fadeUp">
              <h4 className="tr-bill-side-title">Need Help?</h4>
              <button type="button" className="tr-bill-help-link" onClick={() => window.open("https://threatready.io/help", "_blank")}>
                <span className="tr-bill-help-link-left">{I.help} Visit our Help Center</span>
                <span className="tr-bill-help-link-right">{I.external}</span>
              </button>
              <button type="button" className="tr-bill-help-link" onClick={() => window.open("mailto:admin@aerovanttech.com")}>
                <span className="tr-bill-help-link-left">{I.chat} Contact Support</span>
                <span className="tr-bill-help-link-right">{I.external}</span>
              </button>
              <button type="button" className="tr-bill-help-link" onClick={() => window.open("https://threatready.io/faq", "_blank")}>
                <span className="tr-bill-help-link-left">{I.faq} FAQ</span>
                <span className="tr-bill-help-link-right">{I.external}</span>
              </button>
              <div className="tr-bill-help-note">
                <span className="tr-bill-help-note-icon">{I.spark}</span>
                <div>We're here to help you succeed in your cybersecurity journey!</div>
              </div>
            </div>

            {/* User Details */}
            <div className="tr-bill-card fadeUp">
              <div className="tr-bill-card-label">User Details</div>
              <div className="tr-bill-user">
                <div className="tr-bill-user-avatar">{initials}</div>
                <div className="tr-bill-user-body">
                  <div className="tr-bill-user-name">{user?.name || "—"}</div>
                  <div className="tr-bill-user-email">{user?.email || "—"}</div>
                </div>
              </div>
              <div className="tr-bill-user-stats">
                <div className="tr-bill-user-stat">
                  <div className="tr-bill-user-stat-num">{subscribedRoles?.length || 0}</div>
                  <div className="tr-bill-user-stat-lbl">Courses</div>
                </div>
                <div className="tr-bill-user-stat">
                  <div className="tr-bill-user-stat-num">{invoices.length}</div>
                  <div className="tr-bill-user-stat-lbl">Invoices</div>
                </div>
                <div className="tr-bill-user-stat">
                  <div className="tr-bill-user-stat-num" style={{ fontSize: 14 }}>{isPaid ? "Premium" : "Free"}</div>
                  <div className="tr-bill-user-stat-lbl">Tier</div>
                </div>
              </div>
            </div>

          </div>
          {/* ── end RIGHT COLUMN ── */}

        </div>
        {/* ── end .tr-bill-layout ── */}


        {/* ════════ FULL-WIDTH BOTTOM ════════ */}
        <div className="tr-bill-bottom">

          {/* Subscribe to Unlock All Levels — now full-width */}
          <div className="tr-bill-card fadeUp">
            <div className="tr-bill-roles-head">
              <div className="tr-bill-card-label" style={{ marginBottom: 0 }}>
                {isPaid ? "Add More Roles" : "Subscribe to Unlock All Levels"}
              </div>
              <div className="tr-bill-toggle">
                <button type="button"
                  className={`tr-bill-toggle-btn${billingPeriod === "monthly" ? " on" : ""}`}
                  onClick={() => setBillingPeriod("monthly")}>Monthly</button>
                <button type="button"
                  className={`tr-bill-toggle-btn${billingPeriod === "yearly" ? " on" : ""}`}
                  onClick={() => setBillingPeriod("yearly")}>
                  Yearly <span className="tr-bill-toggle-discount">-20%</span>
                </button>
              </div>
            </div>
            <div className="tr-bill-roles">
              {ROLES.map((r, i) => {
                const sel = selectedRoles?.includes(r.id);
                const subscribed = isPaid && subscribedRoles?.includes(r.id);
                const inTrial = !isPaid && subscribedRoles?.includes(r.id);
                const monthlyPrice = r.price;
                const yearlyPrice = Math.round(r.price * 12 * 0.8);
                const savings = r.price * 12 - yearlyPrice;
                return (
                  <div key={r.id}
                    className={`tr-bill-role${subscribed ? " sub" : ""}${inTrial ? " trial" : ""}${sel && !subscribed && !inTrial ? " sel" : ""}`}
                    style={{ animationDelay: `${i * .03}s` }}
                    onClick={() => { if (!subscribed && typeof toggleRole === "function") toggleRole(r.id); }}>
                    {subscribed && <span className="tr-bill-role-tag active">Active</span>}
                    {inTrial && <span className="tr-bill-role-tag trial">Free Trial</span>}
                    {sel && !subscribed && !inTrial && <span className="tr-bill-role-check">{I.check}</span>}
                    <div className="tr-bill-role-icon">{ROLE_ICONS[r.id]}</div>
                    <div className="tr-bill-role-body">
                      <div className="tr-bill-role-name">{r.name}</div>
                      <div className="tr-bill-role-price">
                        ₹{billingPeriod === "yearly" ? yearlyPrice : monthlyPrice}
                        <span style={{ fontSize: 11, color: "var(--tx2)", fontWeight: 500 }}>/{billingPeriod === "yearly" ? "yr" : "mo"}</span>
                      </div>
                      {billingPeriod === "yearly" && !subscribed && !inTrial && (
                        <div className="tr-bill-role-save">Save ₹{savings}/yr</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bundle banner */}
            {selectedRoles?.length >= 2 && (
              <div className="tr-bill-bundle">
                {selectedRoles.length >= 3 ? "🎉 30% bundle discount applied!" : "🎉 18% bundle discount applied for 2+ roles!"}
              </div>
            )}

            {/* Checkout */}
            {selectedRoles?.length > 0 && (
              <div className="tr-bill-checkout">
                <div className="tr-bill-checkout-meta">
                  {selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected · {billingPeriod}
                </div>
                <div className="tr-bill-checkout-price">
                  ₹{billingPeriod === "yearly" ? Math.round((getPrice?.() || 0) * 12 * 0.8) : (getPrice?.() || 0)}
                  <span className="per"> /{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
                {((getDiscount?.() || 0) > 0 || billingPeriod === "yearly") && (
                  <div className="tr-bill-checkout-disc">
                    {(getDiscount?.() || 0) > 0 ? `${getDiscount()}% bundle discount` : ""}
                    {(getDiscount?.() || 0) > 0 && billingPeriod === "yearly" ? " + " : ""}
                    {billingPeriod === "yearly" ? "20% yearly discount" : ""}
                    {" applied"}
                  </div>
                )}
                <button type="button" className="tr-bill-btn full" onClick={subscribe}>
                  Subscribe Now →
                </button>
              </div>
            )}
          </div>

          {/* Invoice Section — full-width */}
          <div className="tr-bill-card fadeUp">
            <div className="tr-bill-inv-head">
              <div className="tr-bill-card-label" style={{ marginBottom: 0 }}>Invoices</div>
              <button type="button" className="tr-bill-btn outline small" onClick={handleExportAllInvoices}>
                {I.download} Export All (CSV)
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="tr-bill-empty">
                No invoices yet. Your invoices will appear here after your first purchase.
              </div>
            ) : (
              <div className="tr-bill-inv-wrap">
                <table className="tr-bill-inv-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>User Name</th>
                      <th>Email ID</th>
                      <th>Payment ID</th>
                      <th>Course ID</th>
                      <th>Purchase Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.invoice_no}>
                        <td className="tr-bill-inv-mono"><strong>{inv.invoice_no}</strong></td>
                        <td>{inv.user_name}</td>
                        <td><span className="tr-bill-inv-email">{inv.user_email}</span></td>
                        <td className="tr-bill-inv-mono">{inv.payment_id}</td>
                        <td className="tr-bill-inv-mono">{inv.course_id}</td>
                        <td>{formatDate(inv.purchase_date)}</td>
                        <td className="tr-bill-inv-mono"><strong>₹{inv.amount.toLocaleString("en-IN")}</strong></td>
                        <td>
                          <span className={`tr-bill-inv-status ${inv.status === "PAID" ? "paid" : inv.status === "REFUNDED" ? "refunded" : "pending"}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="tr-bill-btn outline small" onClick={() => handleDownloadInvoicePDF(inv)} title="Download invoice as PDF">
                            {I.download} Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
