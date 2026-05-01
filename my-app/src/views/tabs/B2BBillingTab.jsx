import { useState, useEffect } from "react";

export default function B2BBillingTab({ b2bLoading, setB2bTab, setShowHrSubscribeModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://threatready-db.onrender.com/api/b2b/billing", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  const fmtAmount = (amt, currency) => {
    if (amt === null || amt === undefined) return "—";
    const symbol = currency === "INR" ? "₹" : (currency || "");
    // Razorpay stores amounts in paise — divide by 100
    const value = (amt / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    return `${symbol}${value}`;
  };

  const statusInfo = (status) => {
    if (status === "active") return { color: "var(--ok)", bg: "rgba(0,224,150,0.12)", label: "Active" };
    if (status === "expiring_soon") return { color: "#ffab40", bg: "rgba(255,171,64,0.12)", label: "Expiring Soon" };
    if (status === "expired") return { color: "#ff5252", bg: "rgba(255,82,82,0.12)", label: "Expired" };
    return { color: "var(--tx2)", bg: "rgba(136,144,176,0.12)", label: "Inactive" };
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--tx2)" }}>
        Loading subscription details…
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: 10, padding: 20, color: "#ff5252" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Could not load billing</div>
          <div style={{ fontSize: 13 }}>{error}</div>
          <button className="btn" style={{ marginTop: 14, fontSize: 12, padding: "5px 12px" }} onClick={fetchBilling}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data || !data.subscription) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--tx2)" }}>
        No subscription data available.
      </div>
    );
  }

  const sub = data.subscription;
  const invoices = data.invoices || [];
  const status = statusInfo(sub.status);
  const used = sub.candidates_used || 0;
  const quota = sub.candidate_quota || 50;
  const remaining = sub.candidates_remaining ?? Math.max(0, quota - used);
  const usagePct = Math.min(100, Math.round((used / quota) * 100));
  const usageColor = usagePct >= 100 ? "#ff5252" : usagePct >= 80 ? "#ffab40" : "var(--ok)";
  const showExpiryBanner = sub.active && sub.days_remaining > 0 && sub.days_remaining <= 7;

  return (
    <div style={{ padding: "10px 0", maxWidth: 1100 }}>

      {/* ── Expiry banner ── */}
      {showExpiryBanner && (
        <div style={{
          background: "rgba(255,171,64,0.1)",
          border: "1px solid rgba(255,171,64,0.4)",
          borderRadius: 10,
          padding: 16,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffab40", marginBottom: 4 }}>
              ⚠ Your subscription expires in {sub.days_remaining} day{sub.days_remaining === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 12, color: "var(--tx2)" }}>
              Renew now to avoid interruption to candidate assessments.
            </div>
          </div>
          <button className="btn" style={{ fontSize: 12, padding: "6px 14px", background: "#ffab40", color: "#000", fontWeight: 700 }} onClick={() => setShowHrSubscribeModal && setShowHrSubscribeModal(true)}>
            Renew Subscription
          </button>
        </div>
      )}

      {sub.status === "expired" && (
        <div style={{
          background: "rgba(255,82,82,0.1)",
          border: "1px solid rgba(255,82,82,0.4)",
          borderRadius: 10,
          padding: 16,
          marginBottom: 18
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ff5252", marginBottom: 4 }}>
            ✕ Your subscription has expired
          </div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>
            Renew to continue inviting candidates and accessing reports.
          </div>
        </div>
      )}

      {/* ── Subscription card ── */}
      <div style={{
        background: "rgba(0,229,255,0.04)",
        border: "1px solid rgba(0,229,255,0.18)",
        borderRadius: 12,
        padding: 22,
        marginBottom: 18
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 11, color: "var(--tx2)", letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
              CURRENT PLAN
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--tx1)" }}>
                💳 {sub.plan_name || "Standard"}
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                padding: "3px 10px",
                borderRadius: 12,
                background: status.bg,
                color: status.color,
                border: `1px solid ${status.color}33`
              }}>
                {status.label.toUpperCase()}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>
              <div><strong style={{ color: "var(--tx1)" }}>Company:</strong> {sub.company_name || "—"}</div>
              <div><strong style={{ color: "var(--tx1)" }}>Team Size:</strong> {sub.team_size || "—"}</div>
              <div><strong style={{ color: "var(--tx1)" }}>Billing Period:</strong> {sub.billing_period ? (sub.billing_period.charAt(0).toUpperCase() + sub.billing_period.slice(1)) : "—"}</div>
            </div>
          </div>

          <div style={{ minWidth: 220, textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--tx2)", letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
              VALIDITY
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: sub.days_remaining <= 7 ? "#ffab40" : "var(--ac)", lineHeight: 1 }}>
              {sub.active ? sub.days_remaining : 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>days remaining</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 14, lineHeight: 1.7 }}>
              <div>Started: <strong style={{ color: "var(--tx1)" }}>{fmtDate(sub.subscribed_at)}</strong></div>
              <div>Expires: <strong style={{ color: "var(--tx1)" }}>{fmtDate(sub.subscription_end)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Candidate usage card ── */}
      <div style={{
        background: "var(--bg)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 22,
        marginBottom: 18
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--tx2)", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
              CANDIDATE USAGE
            </div>
            <div style={{ fontSize: 14, color: "var(--tx1)" }}>
              <strong style={{ color: usageColor, fontSize: 22 }}>{used}</strong>
              <span style={{ color: "var(--tx2)" }}> / {quota} candidates invited</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--tx2)" }}>
            <span style={{ color: usageColor, fontWeight: 700 }}>{remaining}</span> remaining
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{
            width: `${usagePct}%`,
            height: "100%",
            background: usageColor,
            transition: "width 300ms ease",
            borderRadius: 5
          }} />
        </div>

        <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 10 }}>
          {usagePct >= 100
            ? "You've reached your candidate limit. Upgrade your plan to invite more."
            : usagePct >= 80
              ? `You've used ${usagePct}% of your quota. Consider upgrading soon.`
              : `Counted from ${fmtDate(sub.subscribed_at)} (subscription start).`}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <button
          className="btn"
          style={{ fontSize: 12, padding: "8px 16px", background: "var(--ac)", color: "#000", fontWeight: 700 }}
          onClick={() => setShowHrSubscribeModal && setShowHrSubscribeModal(true)}
        >
          {sub.active ? "↑ Upgrade Plan" : "+ Subscribe Now"}
        </button>
        <button
          className="btn"
          style={{ fontSize: 12, padding: "8px 16px" }}
          onClick={fetchBilling}
        >
          ⟳ Refresh
        </button>
      </div>

      {/* ── Invoice history ── */}
      <div style={{
        background: "var(--bg)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 22
      }}>
        <div style={{ fontSize: 11, color: "var(--tx2)", letterSpacing: 1, fontWeight: 700, marginBottom: 14 }}>
          INVOICE HISTORY
        </div>

        {invoices.length === 0 ? (
          <div style={{ padding: "30px 12px", textAlign: "center", color: "var(--tx2)", fontSize: 13 }}>
            No invoices yet. Payment history will appear here after your first transaction.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--tx2)" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>DATE</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>PAYMENT ID</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>PERIOD</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>AMOUNT</th>
                  <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>STATUS</th>
                  <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, letterSpacing: 1 }}>INVOICE</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px", color: "var(--tx1)" }}>{fmtDate(inv.created_at)}</td>
                    <td style={{ padding: "10px", color: "var(--tx2)", fontFamily: "monospace", fontSize: 11 }}>
                      {inv.payment_id ? inv.payment_id.substring(0, 18) + (inv.payment_id.length > 18 ? "…" : "") : "—"}
                    </td>
                    <td style={{ padding: "10px", color: "var(--tx2)", textTransform: "capitalize" }}>
                      {inv.billing_period || "—"}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", color: "var(--tx1)", fontWeight: 700 }}>
                      {fmtAmount(inv.amount, inv.currency)}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: inv.status === "captured" || inv.status === "paid" ? "rgba(0,224,150,0.12)" : "rgba(255,171,64,0.12)",
                        color: inv.status === "captured" || inv.status === "paid" ? "var(--ok)" : "#ffab40"
                      }}>
                        {(inv.status || "—").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      {inv.invoice_url ? (
                        <a
                          href={inv.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--ac)", fontSize: 12, textDecoration: "none" }}
                        >
                          ↓ Download
                        </a>
                      ) : (
                        <span style={{ color: "var(--tx2)", fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
