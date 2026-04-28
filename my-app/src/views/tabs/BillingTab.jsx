// ═══════════════════════════════════════════════════════════════
// BILLING TAB (Dashboard - Subscription Plans + Role Selection)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";

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
  subscribe,
}) {
  return (
    <>
      <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
        {/* Monthly / Yearly Toggle */}
        <div style={{ display: "flex", background: "var(--s2)", borderRadius: 10, padding: 4, maxWidth: 300, margin: "0 auto 24px", gap: 4 }}>
          <button
            className={`btn ${billingPeriod === "monthly" ? "bp" : "bs"}`}
            style={{ flex: 1, padding: "8px 0", fontSize: 13, border: "none" }}
            onClick={() => setBillingPeriod("monthly")}>
            Monthly
          </button>
          <button
            className={`btn ${billingPeriod === "yearly" ? "bp" : "bs"}`}
            style={{ flex: 1, padding: "8px 0", fontSize: 13, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onClick={() => setBillingPeriod("yearly")}>
            Yearly
            <span style={{ fontSize: 11, background: "rgba(0,224,150,.2)", color: "var(--ok)", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>-20%</span>
          </button>
        </div>

        {/* Current Plan Status */}
        <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>CURRENT PLAN</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {isPaid ? `${subscribedRoles.length} Role${subscribedRoles.length > 1 ? "s" : ""} · Active` : "Free Trial"}
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                {isPaid
                  ? subscribedRoles.map(r => ROLES.find(x => x.id === r)?.name).filter(Boolean).join(", ")
                  : subscribedRoles.length > 0
                    ? subscribedRoles.map(r => `${ROLES.find(x => x.id === r)?.name}: ${getRemainingAttempts(r)}`).join(" · ") + " · Beginner only"
                    : "Select roles to start trial"}
              </div>
            </div>
            {isPaid && <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700 }}>● Active</span>}
          </div>
        </div>

        {/* Role Selection Grid */}
        <div className="lbl" style={{ marginBottom: 12 }}>
          {isPaid ? "ADD MORE ROLES" : "SUBSCRIBE TO UNLOCK ALL LEVELS"}
        </div>
        <div className="rgrid">
          {ROLES.map((r, i) => {
            const sel = selectedRoles.includes(r.id);
            // Only treat role as "subscribed" (ACTIVE) if user is actually PAID
            // Free trial users have roles in subscribedRoles but they're not actually paid for
            const subscribed = isPaid && subscribedRoles.includes(r.id);
            const inFreeTrial = !isPaid && subscribedRoles.includes(r.id);
            const monthlyPrice = r.price;
            const yearlyPrice = Math.round(r.price * 12 * 0.8);
            const savings = r.price * 12 - yearlyPrice;
            return (
              <div key={r.id} className={`sub-card fadeUp ${sel || subscribed ? "sel" : ""}`}
                style={{
                  animationDelay: `${i * .03}s`,
                  borderColor: subscribed ? "var(--ok)" : inFreeTrial ? "var(--wn)" : sel ? r.color : undefined,
                  cursor: subscribed ? "default" : "pointer",
                  opacity: subscribed ? 1 : 1,
                  pointerEvents: subscribed ? "none" : "auto"
                }}
                onClick={() => { if (!subscribed) toggleRole(r.id); }}>
                {subscribed && (
                  <div style={{ position: "absolute", top: 8, right: 8, fontSize: 8, color: "var(--ok)", fontWeight: 800, background: "rgba(0,224,150,.1)", padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(0,224,150,.3)" }}>
                    ACTIVE
                  </div>
                )}
                {inFreeTrial && (
                  <div style={{ position: "absolute", top: 8, right: 8, fontSize: 8, color: "var(--wn)", fontWeight: 800, background: "rgba(255,171,64,.1)", padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(255,171,64,.3)" }}>
                    FREE TRIAL
                  </div>
                )}
                {sel && !subscribed && !inFreeTrial && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: "var(--ac)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>
                )}
                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: subscribed ? "var(--ok)" : inFreeTrial ? "var(--wn)" : sel ? r.color : "var(--tx2)" }}>
                  {billingPeriod === "yearly" ? `₹${yearlyPrice}/yr` : `₹${monthlyPrice}/mo`}
                </div>
                {billingPeriod === "yearly" && !subscribed && !inFreeTrial && (
                  <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 2 }}>Save ₹{savings}/yr</div>
                )}
                {subscribed && (
                  <div style={{ fontSize: 11, color: "var(--ok)", marginTop: 2 }}>🔓 All levels unlocked</div>
                )}
                {inFreeTrial && (
                  <div style={{ fontSize: 11, color: "var(--wn)", marginTop: 2 }}>🔒 Beginner only · Subscribe to unlock</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bundle Discount Banner */}
        {selectedRoles.length >= 2 && (
          <div style={{ padding: "10px 16px", background: "rgba(0,224,150,.07)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 10, margin: "16px 0", fontSize: 12, color: "var(--ok)", textAlign: "center", fontWeight: 600 }}>
            {selectedRoles.length >= 3 ? "🎉 30% bundle discount applied!" : "🎉 18% bundle discount applied for 2+ roles!"}
          </div>
        )}

        {/* Checkout Summary */}
        {selectedRoles.length > 0 && (
          <div className="card fadeUp" style={{ padding: 20, textAlign: "center", borderColor: "var(--ac)", marginTop: 4 }}>
            <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6 }}>
              {selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected · {billingPeriod}
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: "var(--ac)", marginBottom: 4 }}>
              ₹{billingPeriod === "yearly" ? Math.round(getPrice() * 12 * 0.8) : getPrice()}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--tx2)" }}> /{billingPeriod === "yearly" ? "year" : "month"}</span>
            </div>
            {(getDiscount() > 0 || billingPeriod === "yearly") && (
              <div style={{ fontSize: 12, color: "var(--ok)", marginBottom: 16 }}>
                {getDiscount() > 0 ? `${getDiscount()}% bundle discount` : ""}
                {getDiscount() > 0 && billingPeriod === "yearly" ? " + " : ""}
                {billingPeriod === "yearly" ? "20% yearly discount" : ""}
                {" applied"}
              </div>
            )}
            <button className="btn bp" style={{ width: "100%", padding: 14, fontSize: 14 }}
              onClick={subscribe}>
              Subscribe Now →
            </button>
          </div>
        )}

        {isPaid && (
          <button className="btn bs" style={{ width: "100%", marginTop: 12, fontSize: 13, color: "var(--wn)" }}>
            Pause Subscription
          </button>
        )}
      </div>
    </>
  );
}