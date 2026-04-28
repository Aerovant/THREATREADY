// ═══════════════════════════════════════════════════════════════
// B2B HELP TAB - FAQ + Contact Support
// ═══════════════════════════════════════════════════════════════
import { showToast } from "../../components/helpers.js";

export default function B2BHelpTab({
  feedbackText, setFeedbackText,
  feedbackSent, setFeedbackSent,
}) {
  return (
    <>
      <div className="lbl" style={{ marginBottom: 12 }}>FREQUENTLY ASKED QUESTIONS</div>
      {[
        ["How are candidates assessed?", "Each candidate gets 5 adaptive AI questions for their role and difficulty. Scores are based on technical depth, communication quality, and decision-making."],
        ["Can I customise assessments?", "Yes — upload a job description and AI will tailor the scenario context. You can also set role, difficulty, and assessment type."],
        ["Are scores objective?", "AI evaluation is calibrated against industry benchmarks. Scores above 7/10 typically indicate strong candidates. All scores include a transparent breakdown."],
        ["How do I share results with my team?", "Download CSV reports from the Badges tab, or connect Slack/Zapier in Settings to push results automatically."],
        ["Can candidates retake assessments?", "By default, each invite is single-use. You can send new invites with different roles or difficulties for re-assessment."]
      ].map(([q, a], i) => (
        <div key={i} className="card fadeUp" style={{ padding: 14, marginBottom: 8, animationDelay: `${i * .05}s` }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{q}</div>
          <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>{a}</div>
        </div>
      ))}
      <div className="card fadeUp" style={{ padding: 16, marginTop: 8 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>CONTACT SUPPORT</div>
        {feedbackSent ? (
          <div style={{ color: "var(--ok)", fontSize: 13, padding: "10px 0" }}>✅ Message sent! We'll respond within 24 hours.</div>
        ) : (
          <>
            <textarea className="input" placeholder="Describe your issue or question..." style={{ minHeight: 60, marginBottom: 10 }}
              value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
            <button className="btn bp" style={{ fontSize: 13 }} disabled={!feedbackText.trim()}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const headers = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  await fetch('https://threatready-db.onrender.com/api/feedback', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ message: feedbackText })
                  });
                  setFeedbackSent(true);
                  setFeedbackText("");
                  setTimeout(() => setFeedbackSent(false), 4000);
                } catch (e) { showToast('Failed to submit. Please try again.', 'error'); }
              }}>
              Submit Message
            </button>
          </>
        )}

        {/* Contact email */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--bd)", fontSize: 13, color: "var(--tx2)" }}>
          Or email us directly at: <a href="mailto:admin@aerovanttech.com" style={{ color: "var(--ac)", textDecoration: "none", fontWeight: 600 }}>admin@aerovanttech.com</a>
        </div>
      </div>
    </>
  );
}