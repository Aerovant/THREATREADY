// ═══════════════════════════════════════════════════════════════
// PASSWORD STRENGTH METER
// Verbatim from original App.jsx.
// ═══════════════════════════════════════════════════════════════
export default function PasswordStrength({ password }) {
  if (!password) return null;
  const score = (password.length >= 8 ? 1 : 0) + (password.length >= 12 ? 1 : 0) + (/[A-Z]/.test(password) ? 1 : 0) + (/[0-9]/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const levels = [{ l: "Weak", c: "#ff5252" }, { l: "Fair", c: "#ffab40" }, { l: "Good", c: "#f59e0b" }, { l: "Strong", c: "#22c55e" }, { l: "Very Strong", c: "#00e096" }];
  const level = levels[Math.min(score - 1, 4)] || levels[0];
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="strength-bar" style={{ width: "100%", background: "var(--s3)" }}>
        <div className="strength-bar" style={{ width: `${score * 20}%`, background: level.c }} />
      </div>
      <div style={{ fontSize: 11, color: level.c, marginTop: 3 }}>{level.l}</div>
    </div>
  );
}
