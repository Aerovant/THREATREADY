// ═══════════════════════════════════════════════════════════════
// INTERVIEW REPORT — Full session report viewer
// Displays scores, breakdown, radar chart, strengths/growth, Q&A
// FEATURES: print-friendly, history panel with sort, score normalization
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const API_BASE = "https://threatready-db.onrender.com";

const formatDuration = (totalSeconds) => {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min} min ${sec} sec`;
};

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  } catch (_) {
    return iso || "—";
  }
};

const formatDateShort = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      hour12: false,
    });
  } catch (_) {
    return iso || "—";
  }
};

const badgeColorFor = (badge) => ({
  Platinum: "#e2e8f0",
  Gold: "#f59e0b",
  Silver: "#94a3b8",
  Bronze: "#b45309",
}[badge] || "#64748b");

const scoreColor = (score, outOf = 10) => {
  const pct = (score / outOf) * 100;
  if (pct >= 75) return "#22c55e";
  if (pct >= 60) return "#a855f7";
  if (pct >= 45) return "#f59e0b";
  return "#ef4444";
};

// Normalize scores to 0–10 scale.
// Backend may return categoryScores & skillsRadar as 0-100 OR 0-10.
// If the value is > 10, we treat it as 0-100 and divide by 10.
const normalizeToTen = (score) => {
  const n = Number(score) || 0;
  return n > 10 ? n / 10 : n;
};

const getAuthToken = () => {
  try {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      ""
    );
  } catch (_) {
    return "";
  }
};

// ───────────────────────────────────────────────────────────────
// SVG Radar chart — expects data scores already normalized to 0–10
// ───────────────────────────────────────────────────────────────
function RadarChart({ data, size = 300 }) {
  if (!data || data.length === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 50;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const maxScore = 10;
  const rings = [2, 4, 6, 8, 10];

  const polygonPoints = (level) =>
    data.map((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (level / maxScore) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");

  const dataPoints = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const s = Math.max(0, Math.min(maxScore, Number(d.score) || 0));
    const r = (s / maxScore) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {/* Concentric grids */}
      {rings.map((ring) => (
        <polygon key={ring} points={polygonPoints(ring)}
          fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke="rgba(139,92,246,0.10)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(139,92,246,0.20)"
        stroke="#8b5cf6"
        strokeWidth="2"
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const lr = radius + 24;
        const x = cx + lr * Math.cos(angle);
        const y = cy + lr * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} fontSize="11" fill="var(--tx1)"
            textAnchor="middle" dominantBaseline="middle" fontWeight="600">
            {d.skill || d.axis}
          </text>
        );
      })}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// History panel — slides in from the right; sort + select
// ───────────────────────────────────────────────────────────────
function InterviewHistoryPanel({ open, onClose, onSelect }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first
  const [loadingId, setLoadingId] = useState(null);

  // Fetch list when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/api/interview/reports`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) {
          const msg = res.status === 401
            ? "Please log in again to view your history."
            : `Server returned ${res.status}`;
          throw new Error(msg);
        }
        const data = await res.json();
        if (!cancelled) setReports(Array.isArray(data.reports) ? data.reports : []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReports();
    return () => { cancelled = true; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sorted = [...reports].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return sortOrder === "desc" ? db - da : da - db;
  });

  const handleRowClick = async (row) => {
    setLoadingId(row.id);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/interview/reports/${row.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.report) {
        onSelect(data.report, row.id);
        onClose();
      } else {
        throw new Error("Empty report payload");
      }
    } catch (e) {
      alert("Failed to load report: " + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="no-print" style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(8, 8, 16, 0.65)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "relative",
        width: "min(460px, 95vw)",
        height: "100%",
        background: "var(--bg, #0f0a1f)",
        borderLeft: "1px solid rgba(139,92,246,0.25)",
        boxShadow: "-12px 0 32px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease-out",
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0.5; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(139,92,246,0.15)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--ac, #a78bfa)" }}>
              📋 INTERVIEW HISTORY
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--tx1)", marginTop: 2 }}>
              Past Reports
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--tx1)",
              fontSize: 18, lineHeight: 1, cursor: "pointer",
              width: 32, height: 32, borderRadius: 8,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Toolbar — sort + count */}
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid rgba(139,92,246,0.10)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 8, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>
            {loading ? "Loading…" : `${reports.length} report${reports.length === 1 ? "" : "s"}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--tx2)" }}>Sort:</span>
            <button
              onClick={() => setSortOrder("desc")}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                background: sortOrder === "desc" ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                border: sortOrder === "desc" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: sortOrder === "desc" ? "#c4b5fd" : "var(--tx2)",
              }}
            >
              ↓ Newest
            </button>
            <button
              onClick={() => setSortOrder("asc")}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                background: sortOrder === "asc" ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                border: sortOrder === "asc" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: sortOrder === "asc" ? "#c4b5fd" : "var(--tx2)",
              }}
            >
              ↑ Oldest
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "12px 14px",
        }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 30, color: "var(--tx2)", fontSize: 13 }}>
              Loading reports…
            </div>
          )}

          {error && !loading && (
            <div style={{
              padding: 16, borderRadius: 8,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "var(--tx2)", fontSize: 13 }}>
              No previous interviews yet.
              <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>
                Reports you complete will appear here.
              </div>
            </div>
          )}

          {!loading && !error && sorted.map((row) => {
            const score = Number(row.overall_score) || 0;
            const color = scoreColor(score, 100);
            const badge = row.badge || "Bronze";
            const bColor = badgeColorFor(badge);
            const isLoading = loadingId === row.id;
            return (
              <div
                key={row.id}
                onClick={() => !isLoading && handleRowClick(row)}
                style={{
                  padding: "12px 14px", marginBottom: 8,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderLeft: `3px solid ${color}`,
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.55 : 1,
                  transition: "background 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "rgba(139,92,246,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: "var(--tx2)", fontFamily: "monospace",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {formatDateShort(row.created_at)}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                        padding: "2px 7px", borderRadius: 4,
                        background: `${bColor}22`,
                        color: bColor,
                        border: `1px solid ${bColor}55`,
                      }}>
                        {badge.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 7px", borderRadius: 4,
                        background: "rgba(255,255,255,0.04)",
                        color: "var(--tx2)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        {row.questions_answered || 0} Q{(row.questions_answered || 0) === 1 ? "" : "s"}
                      </span>
                      {row.duration_seconds > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          padding: "2px 7px", borderRadius: 4,
                          background: "rgba(255,255,255,0.04)",
                          color: "var(--tx2)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}>
                          {formatDuration(row.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, fontFamily: "monospace" }}>
                      {score}
                      <span style={{ fontSize: 11, color: "var(--tx2)", fontWeight: 600 }}>/100</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 2, letterSpacing: 0.5 }}>
                      {isLoading ? "loading…" : "view →"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// MAIN — InterviewReport
// ───────────────────────────────────────────────────────────────
export default function InterviewReport({ report, onRestart, onHome }) {
  const [expandedQ, setExpandedQ] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historicalReport, setHistoricalReport] = useState(null);
  const [historicalId, setHistoricalId] = useState(null);

  // Use the historical report if user picked one, otherwise the prop
  const activeReport = historicalReport || report;

  const handleSelectHistorical = (selectedReport, id) => {
    setHistoricalReport(selectedReport);
    setHistoricalId(id);
    setExpandedQ(null);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) {}
  };

  const handleBackToCurrent = () => {
    setHistoricalReport(null);
    setHistoricalId(null);
    setExpandedQ(null);
  };

  if (!activeReport) {
    return (
      <div className="fadeUp" style={{ maxWidth: 700, margin: "20px auto", padding: 20 }}>
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--tx2)" }}>No report data available.</div>
        </div>
      </div>
    );
  }

  const {
    candidate = {},
    session = {},
    overall = {},
    categoryScores = [],
    skillsRadar = [],
    summary = "",
    strengths = [],
    growthAreas = [],
    suggestedFocus = "",
    topicsToStudy = [],
    questions = [],
  } = activeReport;

  const badge = overall.badge || "Bronze";
  const badgeColor = overall.badgeColor || badgeColorFor(badge);
  const overallScore = overall.score ?? 0;
  const verdict = overall.verdict || "Session evaluated";

  // Normalize skillsRadar to 0-10 for the chart (backend returns 0-100)
  const skillsRadarNormalized = (skillsRadar || []).map((s) => ({
    ...s,
    skill: s.skill || s.axis,
    score: normalizeToTen(s.score),
  }));

  return (
    <div className="interview-report-print fadeUp" style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 80px" }}>

      {/* ═══ "Viewing previous" banner (only when historical) ═══ */}
      {historicalId && (
        <div className="no-print" style={{
          marginBottom: 14, padding: "10px 14px",
          background: "rgba(99,102,241,0.10)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 8,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: "var(--tx1)" }}>
            ⏪ Viewing a previous report from your history
          </div>
          <button
            onClick={handleBackToCurrent}
            style={{
              fontSize: 11, fontWeight: 700,
              padding: "6px 12px", borderRadius: 6, cursor: "pointer",
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              color: "#c4b5fd",
            }}
          >
            ← Back to current session
          </button>
        </div>
      )}

      {/* ═══ Top bar with action buttons ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div className="lbl" style={{ marginBottom: 2 }}>INTERVIEW REPORT</div>
          <div style={{ fontSize: 13, color: "var(--tx2)" }}>
            Generated on {formatDateTime(session.completedAt || new Date().toISOString())}
          </div>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn bs"
            onClick={() => setHistoryOpen(true)}
            style={{ fontSize: 12, padding: "8px 14px" }}
            title="View all your previous interview reports"
          >
            📋 All Reports
          </button>
          <button className="btn bs" onClick={() => window.print()} style={{ fontSize: 12, padding: "8px 14px" }}>
            🖨️ Print / PDF
          </button>
          <button className="btn bs" onClick={onHome} style={{ fontSize: 12, padding: "8px 14px" }}>
            🏠 Go to Home
          </button>
          <button className="btn bp" onClick={onRestart} style={{ fontSize: 12, padding: "8px 14px", fontWeight: 700 }}>
            🔄 Start Interview Again
          </button>
        </div>
      </div>

      {/* ═══ Candidate header card ═══ */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))",
            border: "2px solid rgba(139,92,246,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
          }}>
            👤
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--tx1)" }}>
              {candidate.name || "Candidate"}
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
              {candidate.email && <span>📧 {candidate.email}</span>}
              {candidate.role && (
                <span style={{ marginLeft: candidate.email ? 12 : 0 }}>
                  🎯 {candidate.role} · {candidate.level || ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                padding: "3px 9px", borderRadius: 4,
                background: "rgba(34,197,94,0.12)", color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
              }}>
                ✓ SESSION COMPLETED
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                padding: "3px 9px", borderRadius: 4,
                background: "rgba(99,102,241,0.12)", color: "#a78bfa",
                border: "1px solid rgba(99,102,241,0.3)",
              }}>
                {session.questionsAnswered || 0} QUESTIONS
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                padding: "3px 9px", borderRadius: 4,
                background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)",
              }}>
                {badge.toUpperCase()} BADGE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Score breakdown (5 categories + overall) ═══ */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 2fr", gap: 24, alignItems: "center" }}>
          {/* Overall score circle */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 64, fontWeight: 900,
              color: scoreColor(overallScore, overall.outOf || 100),
              lineHeight: 1,
            }}>
              {overallScore}
              <span style={{ fontSize: 22, color: "var(--tx2)", fontWeight: 700 }}>
                /{overall.outOf || 100}
              </span>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
              color: "var(--tx2)", marginTop: 6,
            }}>
              OVERALL SCORE
            </div>
            <div style={{
              display: "inline-block", marginTop: 12,
              padding: "6px 16px", borderRadius: 20,
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.35)",
              fontSize: 12, fontWeight: 700,
              color: "#22c55e",
            }}>
              ✓ {verdict}
            </div>
          </div>

          {/* Category bars — normalized to /10 display */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryScores.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--tx2)", fontStyle: "italic" }}>
                No category scores available.
              </div>
            )}
            {categoryScores.map((cat, i) => {
              const normalized = normalizeToTen(cat.score); // 0–10
              const pct = (normalized / 10) * 100;
              const color = scoreColor(normalized, 10);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx1)" }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--tx2)" }}>Weighted across questions</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: color, fontFamily: "monospace" }}>
                      {normalized.toFixed(1)}<span style={{ color: "var(--tx2)", fontSize: 11 }}>/10</span>
                    </div>
                  </div>
                  <div style={{
                    height: 8, borderRadius: 4,
                    background: "rgba(255,255,255,0.05)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${Math.min(100, pct)}%`, height: "100%",
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Session metadata strip ═══ */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "var(--tx2)" }}>SESSION STARTED</div>
            <div style={{ fontSize: 12, color: "var(--tx1)", marginTop: 4, fontFamily: "monospace" }}>
              {formatDateTime(session.startedAt)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "var(--tx2)" }}>SESSION ENDED</div>
            <div style={{ fontSize: 12, color: "var(--tx1)", marginTop: 4, fontFamily: "monospace" }}>
              {formatDateTime(session.completedAt)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "var(--tx2)" }}>DURATION</div>
            <div style={{ fontSize: 12, color: "var(--tx1)", marginTop: 4, fontFamily: "monospace" }}>
              {session.durationSeconds ? formatDuration(session.durationSeconds) : `${session.durationMinutes || 0} min`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "var(--tx2)" }}>QUESTIONS ANSWERED</div>
            <div style={{ fontSize: 12, color: "var(--tx1)", marginTop: 4, fontFamily: "monospace" }}>
              {session.questionsAnswered || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "var(--tx2)" }}>BADGE EARNED</div>
            <div style={{ fontSize: 12, color: badgeColor, marginTop: 4, fontFamily: "monospace", fontWeight: 700 }}>
              🏅 {badge}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Recommendation & summary ═══ */}
      {summary && (
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--ac)" }}>
              RECOMMENDATION & SUMMARY
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#22c55e",
            }}>
              ✓ {verdict}
            </span>
          </div>
          <div style={{
            fontSize: 13, lineHeight: 1.7, color: "var(--tx1)",
            padding: 16,
            background: "rgba(255,255,255,0.02)",
            borderLeft: "3px solid #22c55e",
            borderRadius: 6,
          }}>
            {summary}
          </div>

          {/* Strengths & Growth side-by-side */}
          <div style={{
            marginTop: 18, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", marginBottom: 8 }}>
                ✓ Strengths
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {strengths.length === 0 && (
                  <li style={{ fontSize: 12, color: "var(--tx2)", fontStyle: "italic" }}>
                    No strengths identified.
                  </li>
                )}
                {strengths.map((s, i) => (
                  <li key={i} style={{
                    fontSize: 13, color: "var(--tx1)", marginBottom: 6,
                    paddingLeft: 18, position: "relative", lineHeight: 1.6,
                  }}>
                    <span style={{ position: "absolute", left: 0, color: "#22c55e", fontWeight: 700 }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", marginBottom: 8 }}>
                ↑ Growth Areas
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {growthAreas.length === 0 && (
                  <li style={{ fontSize: 12, color: "var(--tx2)", fontStyle: "italic" }}>
                    No growth areas identified.
                  </li>
                )}
                {growthAreas.map((g, i) => (
                  <li key={i} style={{
                    fontSize: 13, color: "var(--tx1)", marginBottom: 6,
                    paddingLeft: 18, position: "relative", lineHeight: 1.6,
                  }}>
                    <span style={{ position: "absolute", left: 0, color: "#f59e0b", fontWeight: 700 }}>↑</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {suggestedFocus && (
            <div style={{
              marginTop: 16, padding: 14,
              background: "rgba(139,92,246,0.06)",
              borderLeft: "3px solid #8b5cf6",
              borderRadius: 6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>
                💡 SUGGESTED NEXT INTERVIEW FOCUS
              </div>
              <div style={{ fontSize: 13, color: "var(--tx1)", lineHeight: 1.6 }}>
                {suggestedFocus}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Skills radar chart — normalized 0-10 ═══ */}
      {skillsRadarNormalized.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--ac)", marginBottom: 14 }}>
            SKILLS RADAR · WHERE YOU ARE STRONG AND WHERE YOU CAN GROW
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24, alignItems: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RadarChart data={skillsRadarNormalized} size={300} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {skillsRadarNormalized.map((s, i) => {
                const color = scoreColor(s.score, 10);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 6,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx1)" }}>{s.skill}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: color, fontFamily: "monospace" }}>
                      {s.score.toFixed(1)}<span style={{ fontSize: 10, color: "var(--tx2)" }}>/10</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Topics to study ═══ */}
      {topicsToStudy.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--ac)", marginBottom: 12 }}>
            📚 TOPICS TO STUDY NEXT
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}>
            {topicsToStudy.map((t, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                background: "rgba(99,102,241,0.06)",
                borderLeft: "3px solid #6366f1",
                borderRadius: 6,
                fontSize: 13, color: "var(--tx1)", lineHeight: 1.5,
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Question-by-question breakdown ═══ */}
      {questions.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--ac)", marginBottom: 14 }}>
            QUESTION-BY-QUESTION BREAKDOWN · {questions.length} QUESTION{questions.length === 1 ? "" : "S"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => {
              const isOpen = expandedQ === i;
              const avgScore = q.scores && q.scores.length > 0
                ? q.scores.reduce((a, b) => a + (Number(b.score) || 0), 0) / q.scores.length
                : 0;
              const qColor = scoreColor(avgScore, 10);
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: `3px solid ${qColor}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}>
                  {/* Header (clickable) */}
                  <div
                    onClick={() => setExpandedQ(isOpen ? null : i)}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 10, flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: 1,
                          color: "var(--ac)",
                        }}>
                          Q{q.index || i + 1} OF {questions.length}
                        </span>
                        {q.category && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 4,
                            background: "rgba(168,85,247,0.12)",
                            color: "#a78bfa",
                            border: "1px solid rgba(168,85,247,0.3)",
                          }}>
                            {q.category}
                          </span>
                        )}
                        {q.panelist && (
                          <span style={{ fontSize: 10, color: "var(--tx2)" }}>
                            · asked by {q.panelist}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--tx1)", marginTop: 6, lineHeight: 1.5 }}>
                        {(q.question || "").substring(0, 140)}{(q.question || "").length > 140 ? "…" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {q.scores && q.scores.map((s, si) => {
                        const sNum = Number(s.score) || 0;
                        return (
                          <span key={si} style={{
                            fontSize: 11, fontWeight: 700,
                            padding: "3px 8px", borderRadius: 4,
                            background: `${scoreColor(sNum, 10)}1a`,
                            color: scoreColor(sNum, 10),
                            border: `1px solid ${scoreColor(sNum, 10)}55`,
                            fontFamily: "monospace",
                          }}>
                            {s.label || s.key} {sNum.toFixed(1)}
                          </span>
                        );
                      })}
                      <span style={{ fontSize: 14, color: "var(--tx2)", marginLeft: 4 }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isOpen && (
                    <div style={{
                      padding: "0 16px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      {/* Full question */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--tx2)", marginBottom: 4 }}>
                          QUESTION
                        </div>
                        <div style={{ fontSize: 13, color: "var(--tx1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {q.question}
                        </div>
                      </div>

                      {/* Candidate vs Model answer */}
                      <div style={{
                        marginTop: 14,
                        display: "grid", gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      }}>
                        <div style={{
                          padding: 12,
                          background: "rgba(34,197,94,0.04)",
                          borderLeft: "3px solid #22c55e",
                          borderRadius: 6,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: 0.5, marginBottom: 6 }}>
                            👤 YOUR ANSWER
                          </div>
                          <div style={{ fontSize: 12, color: "var(--tx1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {q.candidateAnswer || "(no answer recorded)"}
                          </div>
                        </div>
                        <div style={{
                          padding: 12,
                          background: "rgba(168,85,247,0.04)",
                          borderLeft: "3px solid #a855f7",
                          borderRadius: 6,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: 0.5, marginBottom: 6 }}>
                            ✓ MODEL ANSWER
                          </div>
                          <div style={{ fontSize: 12, color: "var(--tx1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {q.modelAnswer || "(no model answer available)"}
                          </div>
                        </div>
                      </div>

                      {/* Evaluator note */}
                      {q.evaluatorNote && (
                        <div style={{
                          marginTop: 14, padding: 12,
                          background: "rgba(99,102,241,0.04)",
                          borderLeft: "3px solid #6366f1",
                          borderRadius: 6,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", letterSpacing: 0.5, marginBottom: 4 }}>
                            EVALUATOR NOTE
                          </div>
                          <div style={{ fontSize: 12, color: "var(--tx1)", lineHeight: 1.6, fontStyle: "italic" }}>
                            {q.evaluatorNote}
                          </div>
                        </div>
                      )}

                      {/* References */}
                      {(q.mitreAttack || q.framework || q.realWorldParallel) && (
                        <div style={{
                          marginTop: 14, padding: 12,
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)",
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx2)", letterSpacing: 0.5, marginBottom: 8 }}>
                            🔗 REFERENCES & SOURCES
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {q.mitreAttack && (
                              <div style={{ display: "flex", fontSize: 11, gap: 8 }}>
                                <span style={{ minWidth: 110, color: "var(--tx2)", fontWeight: 600 }}>MITRE ATT&CK</span>
                                <span style={{ color: "var(--tx1)", fontFamily: "monospace" }}>{q.mitreAttack}</span>
                              </div>
                            )}
                            {q.framework && (
                              <div style={{ display: "flex", fontSize: 11, gap: 8 }}>
                                <span style={{ minWidth: 110, color: "var(--tx2)", fontWeight: 600 }}>FRAMEWORK</span>
                                <span style={{ color: "var(--tx1)" }}>{q.framework}</span>
                              </div>
                            )}
                            {q.realWorldParallel && (
                              <div style={{ display: "flex", fontSize: 11, gap: 8 }}>
                                <span style={{ minWidth: 110, color: "var(--tx2)", fontWeight: 600 }}>REAL-WORLD PARALLEL</span>
                                <span style={{ color: "var(--tx1)" }}>{q.realWorldParallel}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Final action buttons ═══ */}
      <div className="no-print" style={{
        display: "flex", gap: 12, justifyContent: "center",
        marginTop: 24, flexWrap: "wrap",
      }}>
        <button
          className="btn bs"
          onClick={onHome}
          style={{ padding: "14px 28px", fontSize: 14, fontWeight: 700 }}
        >
          🏠 Go to Home
        </button>
        <button
          className="btn bp"
          onClick={onRestart}
          style={{ padding: "14px 28px", fontSize: 14, fontWeight: 700 }}
        >
          🔄 Start Interview Again
        </button>
      </div>

      {/* History panel */}
      <InterviewHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectHistorical}
      />

      {/* ═══ PRINT STYLES — strip app chrome, show only the report ═══ */}
      <style>{`
        @media print {
          /* Hide everything on the page */
          body * { visibility: hidden !important; }

          /* Show the report and all of its descendants */
          .interview-report-print,
          .interview-report-print * { visibility: visible !important; }

          /* Pull the report to the top of the print page */
          .interview-report-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 6mm 8mm !important;
            margin: 0 !important;
            color: #111 !important;
            background: #fff !important;
          }

          /* Hide interactive controls (buttons + history panel + banner) */
          .interview-report-print .btn,
          .interview-report-print .no-print,
          .no-print { display: none !important; }

          /* Print-friendly card styling: light background, dark text */
          .interview-report-print .card {
            background: #ffffff !important;
            border: 1px solid #d4d4d8 !important;
            color: #111 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            margin-bottom: 10px !important;
          }

          /* Force readable colors for print */
          .interview-report-print,
          .interview-report-print * {
            text-shadow: none !important;
          }

          /* Reduce page margins so URL/headers can be removed by user */
          @page {
            size: A4 portrait;
            margin: 10mm 8mm;
          }
        }
      `}</style>
    </div>
  );
}
