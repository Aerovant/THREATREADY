// ═══════════════════════════════════════════════════════════════
// PROFILE TAB (Dashboard - Resume + AI Analysis + Career Goals + Readiness)
// Extracted from App.jsx (B2C Dashboard)
// ═══════════════════════════════════════════════════════════════
import { ROLES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";
import FileUpload from "../../components/FileUpload.jsx";

export default function ProfileTab({
  user,
  resumeText,
  setResumeText,
  resumeAiData,
  setResumeAiData,
  targetRole,
  setTargetRole,
  experienceLevel,
  setExperienceLevel,
  readiness,
}) {
  return (
    <>
      <div style={{ opacity: !user ? 0.4 : 1, pointerEvents: !user ? "none" : "auto" }}>
        <div className="lbl" style={{ marginBottom: 10 }}>RESUME CONTEXT</div>
        <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
          <textarea
            className="input"
            placeholder="Paste your resume here OR upload PDF/DOC/TXT below. AI extracts key points automatically."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            style={{ minHeight: 120, marginBottom: 10 }}
          />
          <FileUpload onUpload={(text, aiData) => { setResumeText(text); if (aiData) setResumeAiData(aiData); }} label="Upload Resume (PDF/DOC/TXT)" />
          {resumeText && <div style={{ marginTop: 8, fontSize: 12, color: "var(--ok)" }}>✓ Resume loaded · AI will personalize your scenarios</div>}
          <button className="btn bp" style={{ marginTop: 10, fontSize: 13, padding: "8px 20px" }}
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://threatready-db.onrender.com/api/resume/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ resume_text: resumeText })
                });
                if (res.ok) showToast('Resume saved successfully!', 'success');
              } catch (e) { showToast('Failed to save resume', 'error'); }
            }}>
            💾 Save Resume
          </button>
        </div>

        {/* AI-DETECTED SKILLS (shown after resume upload) */}
        {resumeAiData && (resumeAiData.skills?.length > 0 || resumeAiData.experience_years || resumeAiData.weak_areas?.length > 0) && (
          <>
            <div className="lbl" style={{ marginBottom: 10 }}>AI ANALYSIS OF YOUR RESUME</div>
            <div className="card fadeUp" style={{ padding: 16, marginBottom: 16, borderColor: "var(--ac)", background: "rgba(0,229,255,.02)" }}>
              {resumeAiData.skills?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ac)", marginBottom: 6, letterSpacing: 0.5 }}>✓ WE DETECTED</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {resumeAiData.skills.map((skill, i) => (
                      <span key={i} style={{ background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.3)", color: "var(--ac)", fontSize: 13, padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resumeAiData.experience_years > 0 && (
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 8 }}>
                  <span style={{ color: "var(--tx2)" }}>Experience: </span>
                  <span style={{ color: "var(--tx)", fontWeight: 600 }}>{resumeAiData.experience_years} years</span>
                  {resumeAiData.top_role && <span> · Top strength: <span style={{ color: "var(--ok)" }}>{resumeAiData.top_role}</span></span>}
                </div>
              )}
              {resumeAiData.weak_areas?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--wn)", marginBottom: 6, letterSpacing: 0.5 }}>⚠️ AREAS TO IMPROVE</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {resumeAiData.weak_areas.map((area, i) => (
                      <span key={i} style={{ background: "rgba(255,171,64,.08)", border: "1px solid rgba(255,171,64,.25)", color: "var(--wn)", fontSize: 12, padding: "3px 8px", borderRadius: 10 }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resumeAiData.recommended_difficulty && (
                <div style={{ marginTop: 12, padding: 10, background: "rgba(0,224,150,.06)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, marginBottom: 3 }}>🎯 AI RECOMMENDS</div>
                  <div style={{ fontSize: 12, color: "var(--tx)" }}>
                    Start with <span style={{ color: "var(--ok)", fontWeight: 700, textTransform: "capitalize" }}>{resumeAiData.recommended_difficulty}</span> difficulty
                    {resumeAiData.recommended_roles?.length > 0 && (
                      <span> · focus on <span style={{ color: "var(--ac)" }}>{resumeAiData.recommended_roles.map(rid => ROLES.find(r => r.id === rid)?.name).filter(Boolean).join(", ")}</span></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="lbl" style={{ marginBottom: 10 }}>CAREER GOALS</div>
        <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10 }}>Target role and experience level</div>
          <select className="input" style={{ marginBottom: 10 }} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
            <option value="">Select target role...</option>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="input" style={{ marginBottom: 10 }} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
            <option value="">Select experience level...</option>
            <option value="junior">Junior (0-2 years)</option>
            <option value="mid">Mid (2-5 years)</option>
            <option value="senior">Senior (5-8 years)</option>
            <option value="lead">Lead (8+ years)</option>
          </select>
          <button className="btn bp" style={{ fontSize: 13, padding: "8px 20px" }}
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://threatready-db.onrender.com/api/profile/goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ target_role: targetRole, experience_level: experienceLevel })
                });
                if (res.ok) showToast('Career goals saved!', 'success');
              } catch (e) { showToast('Failed to save goals', 'error'); }
            }}>
            💾 Save Goals
          </button>
        </div>

        <div className="lbl" style={{ marginBottom: 10 }}>INTERVIEW READINESS</div>
        <div className="card fadeUp" style={{ padding: 20, textAlign: "center" }}>
          {readiness && readiness.has_data ? (
            <>
              <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: readiness.overall_readiness >= 70 ? "var(--ok)" : readiness.overall_readiness >= 50 ? "var(--ac)" : "var(--wn)" }}>
                {readiness.overall_readiness}<span style={{ fontSize: 16, color: "var(--tx2)" }}>/100</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>
                Overall Interview Readiness · based on {readiness.total_sessions} assessment{readiness.total_sessions !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
                {[["Technical", readiness.technical], ["Communication", readiness.communication], ["Decision", readiness.decision]].map(([l, v], i) => (
                  <div key={i}>
                    <div className="mono" style={{ fontSize: 14, color: v >= 70 ? "var(--ok)" : v >= 50 ? "var(--ac)" : "var(--wn)" }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--tx2)" }}>{l}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--tx2)" }}>—</div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.6 }}>
                Complete your first assessment to see your readiness score.
                <br />
                <span style={{ fontSize: 12, color: "var(--tx2)" }}>Score updates automatically after each session.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}