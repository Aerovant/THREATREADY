// ═══════════════════════════════════════════════════════════════
// AI AVATAR — Static avatar with audio wave visualizer
// Verbatim from original App.jsx.
// ═══════════════════════════════════════════════════════════════
export default function AIAvatar({ isSpeaking, isMuted, qIndex }) {
  const isFemale = qIndex % 2 === 0;
  const accentColor = isFemale ? "#ff6b9d" : "#00e5ff";
  const name = isFemale ? "ARIA" : "NEXUS";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 0 }}>
      <div style={{ position: "relative", width: 150, height: 170 }}>

        {/* Outer pulse ring when speaking */}
        {isSpeaking && !isMuted && (
          <>
            <div style={{
              position: "absolute", inset: -10, borderRadius: 16,
              border: `2px solid ${accentColor}`,
              animation: "avatarRing 1s ease-in-out infinite",
              opacity: 0.6, pointerEvents: "none"
            }} />
            <div style={{
              position: "absolute", inset: -20, borderRadius: 20,
              border: `1px solid ${accentColor}`,
              animation: "avatarRing 1s ease-in-out infinite 0.3s",
              opacity: 0.3, pointerEvents: "none"
            }} />
          </>
        )}

        {/* Static Avatar Card */}
        <div style={{
          width: 150, height: 170, borderRadius: 12,
          overflow: "hidden", position: "relative",
          border: `2px solid ${isSpeaking ? accentColor : "#1e2536"}`,
          transition: "border-color 0.3s, box-shadow 0.3s",
          background: `linear-gradient(135deg, ${isFemale ? "rgba(255,107,157,0.08)" : "rgba(0,229,255,0.08)"}, rgba(10,14,26,0.9))`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: isSpeaking && !isMuted
            ? `0 0 30px ${isFemale ? "rgba(255,107,157,0.4)" : "rgba(0,229,255,0.4)"}`
            : "0 4px 20px rgba(0,0,0,0.5)"
        }}>

          {/* Avatar Icon (static) */}
          <div style={{
            fontSize: 50, marginBottom: 6,
            opacity: isMuted ? 0.3 : 1,
            filter: isSpeaking && !isMuted ? "none" : "grayscale(0.2)"
          }}>
            {isFemale ? "👩‍💼" : "👨‍💼"}
          </div>

          {/* Name */}
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
            color: isSpeaking && !isMuted ? accentColor : "#8890b0",
            marginBottom: 8, transition: "color 0.3s"
          }}>
            {name}
          </div>

          {/* Status / Audio Wave */}
          <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            {isSpeaking && !isMuted ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} style={{
                  width: 3, borderRadius: 3,
                  background: accentColor,
                  animation: `soundBar${i % 3 + 1} ${0.35 + (i % 4) * 0.08}s ease-in-out infinite alternate`,
                  height: 14
                }} />
              ))
            ) : (
              <div style={{ fontSize: 11, color: "#5a6380", letterSpacing: 1 }}>
                {isMuted ? "MUTED" : "READY"}
              </div>
            )}
          </div>

          {/* Dark overlay when muted */}
          {isMuted && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, pointerEvents: "none"
            }}>🔇</div>
          )}
        </div>

        {/* Muted badge */}
        {isMuted && (
          <div style={{
            position: "absolute", top: -8, right: -8,
            width: 26, height: 26, borderRadius: "50%",
            background: "#ff5252", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 12, border: "2px solid #0a0e1a"
          }}>🔇</div>
        )}
      </div>
    </div>
  );
}
