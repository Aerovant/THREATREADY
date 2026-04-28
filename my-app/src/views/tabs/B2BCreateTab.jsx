// ═══════════════════════════════════════════════════════════════
// B2B CREATE TAB - Create new assessment with JD analysis
// ═══════════════════════════════════════════════════════════════
import { ROLES, DIFFICULTIES } from "../../constants.js";
import { showToast } from "../../components/helpers.js";

export default function B2BCreateTab({
  newAssessJD, setNewAssessJD,
  newAssessName, setNewAssessName,
  newAssessRole, setNewAssessRole,
  newAssessDiff, setNewAssessDiff,
  newAssessType, setNewAssessType,
  newAssessQuestionCount, setNewAssessQuestionCount,
  jdAnalysis, setJdAnalysis,
  jdAnalyzing, setJdAnalyzing,
  assessMsg, setAssessMsg,
  setB2bTab,
  loadB2bData,
}) {
  return (
    <>
      <div className="card fadeUp" style={{ padding: 20, marginBottom: 14, borderColor: jdAnalysis ? "var(--ok)" : "var(--bd)" }}>
        <div className="lbl" style={{ marginBottom: 8 }}>CREATE ASSESSMENT</div>

        {/* JD Upload */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 8 }}>
            Paste a job description — AI will auto-suggest the role and difficulty.
          </div>
          <input type="file" id="jd-file-input" accept=".pdf,.txt,.doc,.docx"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              setJdAnalysis(null);
              if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = ev => { setNewAssessJD(ev.target.result); showToast('File loaded!', 'success'); };
                reader.readAsText(file);
              } else if (file.name.endsWith('.pdf')) {
                showToast('Reading PDF...', 'info');
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  try {
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    if (pdfjsLib) {
                      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                      const pdf = await pdfjsLib.getDocument({ data: ev.target.result }).promise;
                      let text = '';
                      for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const ct = await page.getTextContent();
                        text += ct.items.map(x => x.str).join(' ') + '\n';
                      }
                      setNewAssessJD(text.trim());
                      showToast('PDF loaded!', 'success');
                    }
                  } catch (err) { showToast('Could not read PDF. Paste text instead.', 'error'); }
                };
                reader.readAsArrayBuffer(file);
              }
              e.target.value = '';
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button className="btn bs" style={{ fontSize: 13, padding: "6px 14px" }} onClick={() => document.getElementById('jd-file-input').click()}>📎 Upload JD</button>
            <span style={{ fontSize: 12, color: "var(--tx2)", fontWeight: 600 }}>PDF · TXT · DOC</span>
            {newAssessJD && <button className="btn bs" style={{ marginLeft: "auto", fontSize: 12, padding: "4px 8px", color: "var(--dn)", borderColor: "var(--dn)" }} onClick={() => { setNewAssessJD(''); setJdAnalysis(null); }}>✕ Clear</button>}
          </div>
          <textarea className="input" placeholder="Or paste job description text here..." value={newAssessJD}
            onChange={e => { setNewAssessJD(e.target.value); setJdAnalysis(null); }}
            style={{ minHeight: 80, marginBottom: 10, fontSize: 12 }} />
          <button className="btn bp" style={{ fontSize: 13, padding: "8px 20px" }}
            disabled={!newAssessJD.trim() || jdAnalyzing}
            onClick={async () => {
              setJdAnalyzing(true); setJdAnalysis(null);
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://threatready-db.onrender.com/api/b2b/analyze-jd', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ jd_text: newAssessJD })
                });
                const data = await res.json();
                if (data.analysis) {
                  setJdAnalysis(data.analysis);
                  if (data.analysis.recommended_role) setNewAssessRole(data.analysis.recommended_role);
                  if (data.analysis.recommended_difficulty) setNewAssessDiff(data.analysis.recommended_difficulty);
                  if (data.analysis.suggested_name) setNewAssessName(data.analysis.suggested_name);
                }
              } catch (e) { console.log('JD analyze error:', e.message); }
              setJdAnalyzing(false);
            }}>
            {jdAnalyzing ? <><span className="loader" style={{ width: 12, height: 12 }} /> Analyzing...</> : "🤖 Analyze JD →"}
          </button>
          {jdAnalysis && (
            <div style={{ marginTop: 10, padding: 12, background: "rgba(0,224,150,.07)", borderRadius: 10, border: "1px solid rgba(0,224,150,.2)", fontSize: 13 }}>
              <div style={{ color: "var(--ok)", fontWeight: 700, marginBottom: 6 }}>✅ AI Analysis Complete</div>
              {jdAnalysis.summary && <div style={{ color: "var(--tx2)", marginBottom: 4 }}>{jdAnalysis.summary}</div>}
              {jdAnalysis.key_skills?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {jdAnalysis.key_skills.map((s, i) => <span key={i} className="tag" style={{ fontSize: 11 }}>{s}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assessment Config */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ASSESSMENT NAME</div>
            <input className="input" placeholder="e.g. Senior Cloud Engineer Q2" value={newAssessName} onChange={e => setNewAssessName(e.target.value)} style={{ fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>ROLE</div>
            <select className="input" value={newAssessRole} onChange={e => setNewAssessRole(e.target.value)} style={{ fontSize: 12 }}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>DIFFICULTY</div>
            <select className="input" value={newAssessDiff} onChange={e => setNewAssessDiff(e.target.value)} style={{ fontSize: 12 }}>
              {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 4 }}>TYPE</div>
            <select className="input" value={newAssessType} onChange={e => setNewAssessType(e.target.value)} style={{ fontSize: 12 }}>
              <option value="standard">Standard</option>
              <option value="timed">Timed Challenge</option>
              <option value="take_home">Take Home</option>
            </select>
          </div>
        </div>

        {/* Custom Question Count */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>NUMBER OF QUESTIONS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {[5, 10, 15, 20, 25].map(n => (
              <button key={n} type="button"
                className={`btn ${newAssessQuestionCount === n ? 'bp' : 'bs'}`}
                style={{ fontSize: 13, padding: "6px 14px" }}
                onClick={() => setNewAssessQuestionCount(n)}>
                {n} Q
              </button>
            ))}
          </div>
          <input type="number" className="input" min="1" max="50" value={newAssessQuestionCount}
            onChange={e => {
              const v = parseInt(e.target.value) || 1;
              setNewAssessQuestionCount(Math.max(1, Math.min(50, v)));
            }}
            placeholder="Or enter custom number (1-50)"
            style={{ fontSize: 12 }} />
          <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 4 }}>
            AI will generate exactly {newAssessQuestionCount} question{newAssessQuestionCount !== 1 ? 's' : ''} for this assessment
          </div>
        </div>

        {assessMsg && (
          <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: assessMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: assessMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>{assessMsg}</div>
        )}
        <button className="btn bp" style={{ width: "100%", padding: 12, fontSize: 13 }}
          disabled={!newAssessName.trim()}
          onClick={async () => {
            setAssessMsg('Creating assessment with ' + newAssessQuestionCount + ' questions...');
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('https://threatready-db.onrender.com/api/b2b/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                  name: newAssessName,
                  role_id: newAssessRole,
                  difficulty: newAssessDiff,
                  assessment_type: newAssessType,
                  jd_text: newAssessJD,
                  question_count: newAssessQuestionCount
                })
              });
              const data = await res.json();
              if (data.assessment) {
                setAssessMsg('✅ Assessment created with ' + newAssessQuestionCount + ' questions! Redirecting to Library...');
                setNewAssessName(''); setNewAssessJD(''); setJdAnalysis(null);
                setNewAssessQuestionCount(5);
                loadB2bData();
                setTimeout(() => {
                  setAssessMsg('');
                  setB2bTab("library");
                  localStorage.setItem('cyberprep_b2btab', 'library');
                }, 1500);
              } else {
                setAssessMsg('❌ ' + (data.error || 'Failed to create assessment'));
              }
            } catch (e) { setAssessMsg('❌ ' + e.message); }
          }}>
          Create Assessment →
        </button>
      </div>
    </>
  );
}