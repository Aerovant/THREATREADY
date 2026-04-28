// ═══════════════════════════════════════════════════════════════
// HomeBtn — Small reusable "← Home" button used in many views
// ═══════════════════════════════════════════════════════════════
export default function HomeBtn({ goHome, label = "← Home" }) {
  return (
    <button className="home-btn" onClick={goHome}>{label}</button>
  );
}
