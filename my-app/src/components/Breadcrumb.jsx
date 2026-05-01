// ═══════════════════════════════════════════════════════════════
// BREADCRUMB — Shows navigation path with clickable segments
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../constants.js";

export default function Breadcrumb({
  view,
  dashTab,
  b2bTab,
  activeRole,
  activeDifficulty,
  scenario,
  setView,
  setDashTab,
  setB2bTab,
  goHome,
  userType
}) {
  const segments = [];

  if (view === "landing") {
    segments.push({ label: "Home", clickable: false });
  } else if (view === "auth") {
    segments.push({ label: "Home", onClick: () => setView("landing") });
    segments.push({ label: "Sign In / Sign Up", clickable: false });
  } else if (view === "trial-role-select") {
    segments.push({ label: "Home", onClick: () => setView("landing") });
    segments.push({ label: "Free Trial", clickable: false });
  } else if (view === "trial-complete") {
    segments.push({ label: "Home", onClick: () => setView("landing") });
    segments.push({ label: "Trial Complete", clickable: false });
  } else if (view === "candidate-assess") {
    segments.push({ label: "Candidate Assessment", clickable: false });
  } else if (view === "dashboard") {
    segments.push({ label: "Home", onClick: () => { setDashTab("home"); localStorage.setItem('cyberprep_tab', 'home'); } });
    if (dashTab && dashTab !== "home") {
      const tabName = dashTab.charAt(0).toUpperCase() + dashTab.slice(1);
      segments.push({ label: tabName, clickable: false });
    }
  } else if (view === "b2b-dashboard") {
    segments.push({ label: "HR Dashboard", onClick: () => { setB2bTab("overview"); localStorage.setItem('cyberprep_b2btab', 'overview'); } });
    if (b2bTab && b2bTab !== "overview") {
      const labels = {
        create: "Create Assessment",
        candidates: "Candidates",
        reports: "Reports",
        teamskills: "Team Skills",
        library: "Library",
        settings: "Settings",
        help: "Help"
      };
      segments.push({ label: labels[b2bTab] || b2bTab, clickable: false });
    }
  } else if (view === "roles") {
    segments.push({ label: "Home", onClick: () => goHome() });
    segments.push({ label: "Roles", clickable: false });
  } else if (view === "difficulty") {
    segments.push({ label: "Home", onClick: () => goHome() });
    const role = ROLES.find(r => r.id === activeRole);
    segments.push({ label: role?.name || activeRole || "Role", clickable: false });
    segments.push({ label: "Select Difficulty", clickable: false });
  } else if (view === "interview") {
    segments.push({ label: "Home", onClick: () => goHome() });
    const role = ROLES.find(r => r.id === activeRole);
    segments.push({ label: role?.name || activeRole || "Role", onClick: () => setView("difficulty") });
    if (activeDifficulty) {
      const diff = activeDifficulty.charAt(0).toUpperCase() + activeDifficulty.slice(1);
      segments.push({ label: diff, clickable: false });
    }
    segments.push({ label: scenario?.ti || "Assessment", clickable: false });
  } else if (view === "results") {
    segments.push({ label: "Home", onClick: () => goHome() });
    const role = ROLES.find(r => r.id === activeRole);
    segments.push({ label: role?.name || activeRole || "Role", onClick: () => setView("difficulty") });
    if (activeDifficulty) {
      const diff = activeDifficulty.charAt(0).toUpperCase() + activeDifficulty.slice(1);
      segments.push({ label: diff, clickable: false });
    }
    segments.push({ label: "Results", clickable: false });
  } else {
    segments.push({ label: "Home", onClick: () => setView("landing") });
  }

  return (
    <div style={{
      padding: "10px 16px",
      fontSize: 13,
      color: "var(--tx2)",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      borderBottom: "1px solid #1e2536",
      background: "rgba(15, 20, 32, 0.6)",
      backdropFilter: "blur(4px)"
    }}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const isClickable = !isLast && (seg.onClick || seg.clickable !== false);
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isClickable ? (
              <span
                onClick={seg.onClick}
                style={{
                  color: "var(--ac)",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
              >
                {seg.label}
              </span>
            ) : (
              <span style={{ color: isLast ? "var(--tx1)" : "var(--tx2)", fontWeight: isLast ? 600 : 400 }}>
                {seg.label}
              </span>
            )}
            {!isLast && (
              <span style={{ color: "var(--tx3)", fontSize: 11 }}>›</span>
            )}
          </span>
        );
      })}
    </div>
  );
}