// ═══════════════════════════════════════════════════════════════
// ROLES VIEW (Pricing / Role Selection)
// Lets user pick which security tracks to subscribe to
// Extracted from App.jsx lines 2940-3004 (65 lines)
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES } from "../constants.js";
import HomeBtn from "../components/HomeBtn.jsx";

export default function RolesView({
  // ── STATE ──
  isPaid,
  selectedRoles,
  // ── SETTERS ──
  setSubscribedRoles,
  setFreeAttempts,
  setView,
  // ── HANDLERS ──
  goHome,
  toggleRole,
  getDiscount,
  getPrice,
  subscribe,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <HomeBtn goHome={goHome} />
      <div className="page"><div className="cnt" style={{ paddingTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="fadeUp">
          <div className="lbl" style={{ marginBottom: 10 }}>CHOOSE YOUR TRACKS</div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Select Security Roles</h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 6 }}>
            {isPaid ? "2 roles = 18% off · 3+ roles = 30% off" : "Free trial · Select up to 2 roles"}
          </p>
          {!isPaid && (
            <div style={{ background: "rgba(0,229,255,.06)", border: "1px solid rgba(0,229,255,.2)", borderRadius: 10, padding: "10px 16px", marginTop: 12, fontSize: 13, color: "var(--ac)" }}>
              🎯 Free Trial — Select up to 2 roles · Beginner difficulty only · 2 attempts total
            </div>
          )}
        </div>
        <div className="rgrid">
          {ROLES.map((r, i) => {
            const sel = selectedRoles.includes(r.id);
            return (
              <div key={r.id} className={`sub-card fadeUp ${sel ? "sel" : ""}`}
                style={{
                  animationDelay: `${i * .04}s`,
                  borderColor: sel ? r.color : undefined,
                  opacity: 1,
                  cursor: "pointer",
                  pointerEvents: "auto"
                }}
                onClick={() => toggleRole(r.id)}>

                {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "var(--ac)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10, fontWeight: 500 }}>{r.desc}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: sel ? r.color : "var(--tx2)" }}>₹{r.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
              </div>
            );
          })}
        </div>
        {selectedRoles.length > 0 && (
          <div className="card fadeUp" style={{ marginTop: 20, padding: 20, textAlign: "center", borderColor: "var(--ac)" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--tx2)" }}>{selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""}</span>
              {getDiscount() > 0 && <span className="tag" style={{ background: "rgba(0,224,150,.1)", color: "var(--ok)", borderColor: "rgba(0,224,150,.2)" }}>{getDiscount()}% OFF</span>}
              <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--ac)" }}>₹{getPrice()}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--tx2)" }}>/mo</span></span>

              <button className="btn bp" onClick={() => {
                if (!isPaid && selectedRoles.length > 0) {
                  // Free trial - no payment needed
                  setSubscribedRoles(selectedRoles);
                  setFreeAttempts(2);
                  setView("dashboard");
                } else {
                  subscribe();
                }
              }} style={{ padding: "10px 28px" }}>
                {isPaid ? "Subscribe →" : "Start Free Trial →"}
              </button>

            </div>
          </div>
        )}
      </div></div>
    </div>
  );
}
