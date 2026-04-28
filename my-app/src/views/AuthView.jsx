// ═══════════════════════════════════════════════════════════════
// AUTH VIEW (Signup/Login + Email Verification + B2C/B2B Detection)
// Most complex view: 7 sub-states (form, verify, detect, company-info,
// roleselect, forgot, resetcode, resetdone)
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════════
import { CSS } from "../styles.js";
import { ROLES, SCENARIOS } from "../constants.js";
import ToastContainer from "../components/ToastContainer.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";

export default function AuthView({
  // ── STATE ──
  authMode,
  authStep,
  authEmail,
  authPassword,
  authName,
  authError,
  agreeTerms,
  showAuthPassword,
  showNewPassword,
  isAuthenticating,
  otpCode,
  otpError,
  forgotEmail,
  forgotCode,
  newPassword,
  forgotLoading,
  forgotMsg,
  userType,
  hrModalCompanyName,
  hrModalTeamSize,
  HR_PRICING,
  // ── SETTERS ──
  setAuthMode,
  setAuthStep,
  setAuthEmail,
  setAuthPassword,
  setAuthName,
  setAuthError,
  setAgreeTerms,
  setShowAuthPassword,
  setShowNewPassword,
  setOtpCode,
  setOtpError,
  setForgotEmail,
  setForgotCode,
  setNewPassword,
  setForgotLoading,
  setForgotMsg,
  setHrModalCompanyName,
  setHrModalTeamSize,
  setView,
  // ── HANDLERS ──
  handleAuth,
  verifyEmail,
  confirmUserType,
  confirmCompanyInfo,
  startScenario,
  goBack,
}) {
  return (
    <div className="app"><style>{CSS}</style><div className="scanbar" /><div className="gridbg" />
      <ToastContainer />
      <button className="home-btn" onClick={goBack}>← Back</button>
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card fadeUp" style={{ maxWidth: 460, width: "90%", padding: 36 }}>

          {authStep === "form" && (<>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div className="lbl" style={{ marginBottom: 6 }}>{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
              {authMode === "signup" && <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 6 }}>2 free attempts · No credit card required</p>}
            </div>
            {authError && <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 13, color: "var(--dn)", marginBottom: 14 }}>{authError}</div>}
            {authMode === "signup" && <input className="input" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} style={{ marginBottom: 10 }} />}
            <input className="input" placeholder="Email" type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                className="input"
                placeholder="Password"
                type={showAuthPassword ? "text" : "password"}
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowAuthPassword(p => !p)}
                style={{
                  position: "absolute", right: 8, top: 0, bottom: 0,
                  width: 36, border: "none", background: "transparent",
                  cursor: "pointer", color: "var(--tx2)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {showAuthPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {authMode === "signup" && <PasswordStrength password={authPassword} />}
            {authMode === "signup" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx2)", marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                I agree to <span style={{ color: "var(--ac)" }}>Terms of Service</span> and <span style={{ color: "var(--ac)" }}>Privacy Policy</span>
              </label>
            )}
            {authMode === "login" && <div style={{ textAlign: "right", marginBottom: 10 }}><span style={{ fontSize: 13, color: "var(--ac)", cursor: "pointer" }} onClick={() => { setAuthStep("forgot"); setForgotEmail(authEmail || ""); setForgotMsg(""); }}>Forgot Password?</span></div>}

            <button
              className="btn bp"
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                opacity: isAuthenticating ? 0.7 : 1,
                cursor: isAuthenticating ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8
              }}
              onClick={handleAuth}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <span className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  {authMode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                authMode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/google"}>
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Google
              </button>
              <button className="btn bs" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => window.location.href = "https://threatready-db.onrender.com/auth/github?prompt=login"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--tx2)" }}>
              {authMode === "login" ? "No account? " : "Have an account? "}
              <span style={{ color: "var(--ac)", cursor: "pointer" }} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </span>
            </div>
          </>)}

          {authStep === "verify" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>VERIFY EMAIL</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Check Your Inbox</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: "var(--ac)" }}>{authEmail}</strong>
                </p>
              </div>
              {otpError && (
                <div style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", borderRadius: 8, padding: 10, fontSize: 13, color: "var(--dn)", marginBottom: 14 }}>
                  {otpError}
                </div>
              )}
              <input
                className="input"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ marginBottom: 14, textAlign: "center", fontSize: 18, letterSpacing: 8, fontFamily: "monospace" }}
                maxLength={6}
              />
              <button className="btn bp" style={{ width: "100%", padding: 12, marginBottom: 10 }}
                onClick={async () => {
                  if (otpCode.length !== 6) { setOtpError("Please enter 6-digit code"); return; }
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/verify-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: authEmail, otp: otpCode })
                    });
                    const data = await res.json();
                    if (!res.ok) { setOtpError(data.error || "Invalid code"); return; }

                    setAuthStep("form");
                    setAuthMode("login");
                    setOtpCode("");
                    setAuthError("✅ Email verified! Please sign in.");
                  } catch (e) { setOtpError("Network error"); }
                }}>
                Verify Email ✓
              </button>
              <button className="btn bs" style={{ width: "100%", padding: 10, fontSize: 12 }}
                onClick={async () => {
                  try {
                    await fetch("https://threatready-db.onrender.com/api/auth/send-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: authEmail })
                    });
                  } catch (e) { }
                }}>
                Resend Code
              </button>
            </div>
          )}

          {authStep === "detect" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{userType === "b2b" ? "🏢" : "👤"}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                {userType === "b2b" ? "Looks Like You're Hiring" : "Ready to Prepare?"}
              </h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 20, lineHeight: 1.7 }}>
                {userType === "b2b"
                  ? "Your work email suggests you're at a company. Are you here to assess candidates?"
                  : "Are you preparing for security interviews?"}
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <button className="btn bp" style={{ padding: 14 }} onClick={() => confirmUserType(userType)}>
                  {userType === "b2b" ? "Yes, I'm Hiring / Assessing →" : "Yes, I'm Preparing →"}
                </button>
                <button className="btn bs" style={{ padding: 12, fontSize: 13 }} onClick={() => confirmUserType(userType === "b2b" ? "b2c" : "b2b")}>
                  {userType === "b2b" ? "Actually, I'm a candidate preparing" : "Actually, I'm hiring / assessing"}
                </button>
              </div>
            </div>
          )}

          {authStep === "company-info" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>COMPANY DETAILS</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Tell us about your company</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)" }}>
                  This helps us set up your hiring dashboard
                </p>
              </div>
              <input
                className="input"
                placeholder="Company Name"
                value={hrModalCompanyName}
                onChange={e => setHrModalCompanyName(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <select
                className="input"
                value={hrModalTeamSize}
                onChange={e => setHrModalTeamSize(e.target.value)}
                style={{ marginBottom: 14 }}
              >
                {Object.entries(HR_PRICING).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
              <button className="btn bp" style={{ width: "100%", padding: 12 }} onClick={confirmCompanyInfo}>
                Continue →
              </button>
            </div>
          )}

          {authStep === "roleselect" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>QUICK START</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pick Your First Role</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)" }}>You can change this later</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {ROLES.slice(0, 6).map(r => (
                  <button key={r.id} className="btn bs" style={{ padding: 14, fontSize: 13, textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
                    onClick={() => {
                      const scs = SCENARIOS[r.id];
                      if (scs?.length) { startScenario(scs[0], "beginner"); }
                    }}>
                    <span style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</span>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {authStep === "forgot" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>RESET PASSWORD</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Forgot your password?</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)" }}>Enter your email to receive a reset code</p>
              </div>
              {forgotMsg && (
                <div style={{ background: forgotMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", border: `1px solid ${forgotMsg.includes("✅") ? "rgba(0,224,150,.3)" : "rgba(255,82,82,.3)"}`, borderRadius: 8, padding: 10, fontSize: 13, color: forgotMsg.includes("✅") ? "var(--ok)" : "var(--dn)", marginBottom: 14 }}>
                  {forgotMsg}
                </div>
              )}
              <input
                className="input"
                placeholder="Enter your email"
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !forgotLoading && document.getElementById("forgot-send-btn").click()}
                style={{ marginBottom: 14 }}
              />
              <button id="forgot-send-btn" className="btn bp" style={{ width: "100%", padding: 12, marginBottom: 10 }}
                disabled={forgotLoading}
                onClick={async () => {
                  if (!forgotEmail.trim()) { setForgotMsg("Please enter your email"); return; }
                  setForgotLoading(true); setForgotMsg("");
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail.trim() })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setForgotMsg("✅ Reset code sent! Check your email.");
                      setTimeout(() => { setAuthStep("resetcode"); setForgotMsg(""); }, 1500);
                    } else {
                      setForgotMsg(data.error || "Failed to send code");
                    }
                  } catch (e) { setForgotMsg("Network error"); }
                  setForgotLoading(false);
                }}>
                {forgotLoading ? "Sending..." : "Send Reset Code"}
              </button>
              <button className="btn bs" style={{ width: "100%", padding: 10, fontSize: 12 }}
                onClick={() => { setAuthStep("form"); setForgotMsg(""); }}>
                ← Back to Sign In
              </button>
            </div>
          )}

          {authStep === "resetcode" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>RESET PASSWORD</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Enter Code & New Password</h2>
                <p style={{ fontSize: 13, color: "var(--tx2)" }}>Code sent to <strong style={{ color: "var(--ac)" }}>{forgotEmail}</strong></p>
              </div>
              {forgotMsg && (
                <div style={{ background: forgotMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", border: `1px solid ${forgotMsg.includes("✅") ? "rgba(0,224,150,.3)" : "rgba(255,82,82,.3)"}`, borderRadius: 8, padding: 10, fontSize: 13, color: forgotMsg.includes("✅") ? "var(--ok)" : "var(--dn)", marginBottom: 14 }}>
                  {forgotMsg}
                </div>
              )}
              <input
                className="input"
                placeholder="Enter 6-digit code"
                value={forgotCode}
                onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ marginBottom: 12, textAlign: "center", fontSize: 18, letterSpacing: 8, fontFamily: "monospace" }}
                maxLength={6}
              />
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  className="input"
                  placeholder="New password (min 8 chars)"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(p => !p)}
                  style={{
                    position: "absolute", right: 8, top: 0, bottom: 0,
                    width: 36, border: "none", background: "transparent",
                    cursor: "pointer", color: "var(--tx2)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {showNewPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
              <button className="btn bp" style={{ width: "100%", padding: 12, marginBottom: 10 }}
                disabled={forgotLoading}
                onClick={async () => {
                  if (forgotCode.length !== 6) { setForgotMsg("Enter 6-digit code"); return; }
                  if (newPassword.length < 8) { setForgotMsg("Password min 8 characters"); return; }
                  setForgotLoading(true); setForgotMsg("");
                  try {
                    const res = await fetch("https://threatready-db.onrender.com/api/auth/reset-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail, code: forgotCode, new_password: newPassword })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setForgotMsg("✅ Password reset! You can now sign in.");
                      setTimeout(() => setAuthStep("resetdone"), 1200);
                    } else {
                      setForgotMsg(data.error || "Reset failed");
                    }
                  } catch (e) { setForgotMsg("Network error"); }
                  setForgotLoading(false);
                }}>
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--ac)", cursor: "pointer" }} onClick={() => setAuthStep("forgot")}>← Resend code</span>
                <span style={{ fontSize: 12, color: "var(--tx2)", cursor: "pointer" }} onClick={() => { setAuthStep("form"); setForgotMsg(""); }}>Cancel</span>
              </div>
            </div>
          )}

          {authStep === "resetdone" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 24, lineHeight: 1.7 }}>
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button className="btn bp" style={{ width: "100%", padding: 14 }}
                onClick={() => {
                  setAuthStep("form");
                  setAuthMode("login");
                  setAuthPassword("");
                  setForgotMsg("");
                  setAuthError("");
                }}>
                Sign In →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}