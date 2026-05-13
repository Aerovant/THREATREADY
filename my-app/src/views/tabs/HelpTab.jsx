// ═══════════════════════════════════════════════════════════════
// HELP TAB — Redesigned (2026-05)
// 2-column layout: main (Search + FAQ + Feedback + Page Rating)
// + sidebar (Contact Support / System Status / Quick Links / Still Need Help).
// All existing functionality preserved:
//   • POST /api/feedback  (submit feedback with text or voice transcript)
//   • Voice dictation toggle (Type / Dictate)
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { showToast } from "../../components/helpers.js";

/* ── Inline SVG icons ── */
const I = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  mic: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  micBig: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  stop: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>,
  smile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  thumbsUp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  thumbsDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  checkCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="rgba(16,185,129,0.12)" stroke="#10b981"/><polyline points="9 12 11 14 15 10" stroke="#10b981"/></svg>,
  external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  shield: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const FAQ_ITEMS = [
  { q: "How is my score calculated?", a: "Each question is scored on 3 dimensions: Technical Depth, Communication Quality, and Decision-Making. Overall = average of 5 questions." },
  { q: "Can I retake scenarios?", a: "Yes! Paid users get unlimited attempts. Each attempt loads a different architecture from our pool." },
  { q: "Are badges valid for hiring?", a: "Badges include a verification link (verify.ready.io/verify/[id]) that hiring managers can check." },
  { q: "Can I share my profile?", a: "Yes. Toggle your profile to public in Settings. Share your unique URL on LinkedIn." },
];

const QUICK_LINKS = [
  { label: "Documentation", url: "https://threatready.io/docs" },
  { label: "Community Forum", url: "https://threatready.io/community" },
  { label: "Feature Requests", url: "https://threatready.io/feedback" },
  { label: "Roadmap", url: "https://threatready.io/roadmap" },
];

export default function HelpTab({
  feedbackText,
  feedbackSent,
  feedbackInputMode,
  feedbackVoice,
  setFeedbackText,
  setFeedbackSent,
  setFeedbackInputMode,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqs, setExpandedFaqs] = useState([0, 1, 2, 3]); // all open by default to match mockup
  const [pageHelpful, setPageHelpful] = useState(null); // null | 'yes' | 'no'

  const toggleFaq = (i) => {
    setExpandedFaqs(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const filteredFaq = FAQ_ITEMS
    .map((f, i) => ({ ...f, originalIdx: i }))
    .filter(f =>
      !searchQuery ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const submitFeedback = async () => {
    try {
      const finalMessage = feedbackText.trim() || feedbackVoice.transcript?.trim() || "";
      if (!finalMessage) return;
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('https://threatready-db.onrender.com/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: finalMessage })
      });
      setFeedbackSent(true);
      setFeedbackText("");
      feedbackVoice.reset();
      setFeedbackInputMode("text");
      setTimeout(() => setFeedbackSent(false), 4000);
    } catch (e) {
      showToast('Failed to submit. Please try again.', 'error');
    }
  };

  const handlePageHelpful = (helpful) => {
    if (pageHelpful !== null) return;
    setPageHelpful(helpful);
    if (helpful === 'yes') {
      showToast('Thanks for your feedback!', 'success');
    } else {
      showToast("Sorry to hear that. Please use the feedback form to tell us more.", 'info');
    }
  };

  return (
    <>
      <div className="tr-help-root">
        {/* Page header */}
        <div className="tr-help-head fadeUp">
          <h1 className="tr-help-title">Help Center</h1>
          <p className="tr-help-sub">Find answers to your questions and get the help you need.</p>
        </div>

        {/* 2-column layout */}
        <div className="tr-help-layout">
          {/* ───── LEFT MAIN ───── */}
          <div className="tr-help-main">

            {/* Search bar */}
            <div className="tr-help-search fadeUp">
              <span className="tr-help-search-icon">{I.search}</span>
              <input
                type="text"
                className="tr-help-search-input"
                placeholder="Search for articles, topics or keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* FAQ */}
            <div className="tr-help-card fadeUp">
              <div className="tr-help-card-label">Frequently Asked Questions</div>
              <div className="tr-help-faq-list">
                {filteredFaq.length === 0 ? (
                  <div className="tr-help-empty">
                    No results match your search. Try different keywords or browse all questions above.
                  </div>
                ) : filteredFaq.map(f => {
                  const isOpen = expandedFaqs.includes(f.originalIdx);
                  return (
                    <div key={f.originalIdx} className={`tr-help-faq${isOpen ? ' open' : ''}`}>
                      <button
                        type="button"
                        className="tr-help-faq-q"
                        onClick={() => toggleFaq(f.originalIdx)}
                        aria-expanded={isOpen}
                      >
                        <div className="tr-help-faq-q-text">
                          <div className="tr-help-faq-q-title">{f.q}</div>
                          {isOpen && <div className="tr-help-faq-q-answer">{f.a}</div>}
                        </div>
                        <span className={`tr-help-faq-chev${isOpen ? ' open' : ''}`}>{I.chevron}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback */}
            <div className="tr-help-card fadeUp">
              <div className="tr-help-card-label">Feedback</div>
              {feedbackSent ? (
                <div className="tr-help-feedback-success">
                  ✓ Thank you! Your feedback has been submitted.
                </div>
              ) : (
                <>
                  <div className="tr-help-mode-tabs">
                    <button
                      type="button"
                      className={`tr-help-mode-tab${feedbackInputMode === 'text' ? ' on' : ''}`}
                      onClick={() => setFeedbackInputMode('text')}
                    >
                      {I.edit} Type
                    </button>
                    <button
                      type="button"
                      className={`tr-help-mode-tab${feedbackInputMode === 'voice' ? ' on' : ''}`}
                      onClick={() => setFeedbackInputMode('voice')}
                    >
                      {I.mic} Dictate
                    </button>
                  </div>

                  {feedbackInputMode === 'text' ? (
                    <textarea
                      className="tr-help-textarea"
                      placeholder="Report a problem, suggest a feature, or share feedback..."
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                    />
                  ) : (
                    <div className="tr-help-voice">
                      <div
                        className={`tr-help-voice-ring${feedbackVoice.recording ? ' active' : ''}`}
                        onClick={() => {
                          if (feedbackVoice.recording) {
                            feedbackVoice.stop();
                            if (feedbackVoice.transcript?.trim()) {
                              setFeedbackText(prev => (prev ? prev + ' ' : '') + feedbackVoice.transcript.trim());
                              feedbackVoice.reset();
                            }
                          } else {
                            feedbackVoice.start();
                          }
                        }}
                      >
                        {feedbackVoice.recording ? I.stop : I.micBig}
                      </div>
                      <div className="tr-help-voice-status">
                        {feedbackVoice.recording ? "Recording... tap to stop" : "Tap to start dictating"}
                      </div>
                      {(feedbackVoice.transcript || feedbackText) && (
                        <div className="tr-help-voice-transcript">
                          {feedbackVoice.transcript || feedbackText}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="tr-help-btn"
                    disabled={!feedbackText.trim() && !feedbackVoice.transcript?.trim()}
                    onClick={submitFeedback}
                  >
                    Submit Feedback
                  </button>
                </>
              )}
            </div>

            {/* Was this page helpful? */}
            <div className="tr-help-rating fadeUp">
              <div className="tr-help-rating-icon">{I.smile}</div>
              <div className="tr-help-rating-body">
                <div className="tr-help-rating-title">Was this page helpful?</div>
                <div className="tr-help-rating-sub">Your feedback helps us improve our support.</div>
              </div>
              <div className="tr-help-rating-btns">
                <button
                  type="button"
                  className={`tr-help-rating-btn${pageHelpful === 'yes' ? ' selected' : ''}`}
                  onClick={() => handlePageHelpful('yes')}
                  disabled={pageHelpful !== null}
                >
                  {I.thumbsUp} Yes, helpful
                </button>
                <button
                  type="button"
                  className={`tr-help-rating-btn${pageHelpful === 'no' ? ' selected' : ''}`}
                  onClick={() => handlePageHelpful('no')}
                  disabled={pageHelpful !== null}
                >
                  {I.thumbsDown} Not really
                </button>
              </div>
            </div>
          </div>

          {/* ───── RIGHT SIDEBAR ───── */}
          <aside className="tr-help-side">

            {/* Contact Support */}
            <div className="tr-help-side-card fadeUp">
              <h4 className="tr-help-side-title">Contact Support</h4>
              <p className="tr-help-side-desc">Our support team is here to help you.</p>
              <a href="mailto:admin@aerovanttech.com" className="tr-help-contact-row">
                <span className="tr-help-contact-icon">{I.mail}</span>
                <span className="tr-help-contact-text">admin@aerovanttech.com</span>
              </a>
              <div className="tr-help-contact-row">
                <span className="tr-help-contact-icon">{I.chat}</span>
                <div>
                  <div className="tr-help-contact-text">Live Chat</div>
                  <div className="tr-help-contact-sub good">Available 24/7</div>
                </div>
              </div>
              <div className="tr-help-contact-row">
                <span className="tr-help-contact-icon">{I.clock}</span>
                <div>
                  <div className="tr-help-contact-text">Response Time</div>
                  <div className="tr-help-contact-sub">Within 24 hours</div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="tr-help-side-card fadeUp">
              <h4 className="tr-help-side-title">System Status</h4>
              <div className="tr-help-status-row">
                <span className="tr-help-status-icon">{I.checkCircle}</span>
                <span className="tr-help-status-label">All systems operational</span>
              </div>
              <div className="tr-help-status-meta">Last updated: 2 mins ago</div>
              <button
                type="button"
                className="tr-help-link-btn"
                onClick={() => window.open('https://threatready.io/status', '_blank')}
              >
                View Status Page {I.arrow}
              </button>
            </div>

            {/* Quick Links */}
            <div className="tr-help-side-card fadeUp">
              <h4 className="tr-help-side-title">Quick Links</h4>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="tr-help-quick-link"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <span>{link.label}</span>
                  {I.external}
                </button>
              ))}
            </div>

            {/* Still need help? */}
            <div className="tr-help-stillneed fadeUp">
              <div className="tr-help-stillneed-icon">{I.shield}</div>
              <div className="tr-help-stillneed-title">Still need help?</div>
              <div className="tr-help-stillneed-desc">Can't find what you're looking for? Our team is ready to assist you.</div>
              <button
                type="button"
                className="tr-help-btn outline"
                onClick={() => window.open('mailto:admin@aerovanttech.com', '_blank')}
              >
                Contact Support {I.arrow}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ══════ Scoped styles ══════ */}
      <style>{`
.tr-help-root{font-family:'Inter','Segoe UI',sans-serif;color:var(--tx1,#1a1a2e)}
.tr-help-head{margin-bottom:22px}
.tr-help-title{font-size:26px;font-weight:800;margin:0 0 6px;color:var(--tx1,#1a1a2e);letter-spacing:-0.3px}
.tr-help-sub{font-size:14px;color:var(--tx2,#8890b0);margin:0}

.tr-help-layout{
  display:grid;
  grid-template-columns:minmax(0,1fr) 320px;
  gap:20px;
  align-items:start;
}
@media (max-width:1100px){.tr-help-layout{grid-template-columns:1fr}}

.tr-help-main{display:flex;flex-direction:column;gap:16px;min-width:0}
.tr-help-side{display:flex;flex-direction:column;gap:16px}

/* ── Search bar ── */
.tr-help-search{
  position:relative;
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:14px 18px 14px 50px;
  display:flex;align-items:center;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
  transition:border-color .15s,box-shadow .15s;
}
.tr-help-search:focus-within{
  border-color:#7c3aed;
  box-shadow:0 0 0 3px rgba(124,58,237,.08);
}
.tr-help-search-icon{
  position:absolute;left:18px;top:50%;transform:translateY(-50%);
  color:var(--tx2,#8890b0);
  display:inline-flex;align-items:center;
}
.tr-help-search-input{
  flex:1;
  border:none;background:transparent;
  outline:none;
  font-size:14px;
  color:var(--tx1,#1a1a2e);
  font-family:inherit;
  width:100%;
}
.tr-help-search-input::placeholder{color:var(--tx2,#8890b0)}

/* ── Card ── */
.tr-help-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:22px;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-help-card-label{
  font-size:12px;font-weight:700;
  color:#7c3aed;
  text-transform:uppercase;letter-spacing:2px;
  margin-bottom:16px;
}

/* ── FAQ accordion ── */
.tr-help-faq-list{display:flex;flex-direction:column;gap:8px}
.tr-help-faq{
  border:1px solid var(--bd,#e9e5f3);
  border-radius:11px;
  background:#fafafa;
  transition:border-color .15s,background .15s;
  overflow:hidden;
}
.tr-help-faq:hover{border-color:#d4ccea}
.tr-help-faq.open{
  background:#fff;
  border-color:#d4ccea;
}
.tr-help-faq-q{
  width:100%;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  padding:14px 16px;
  background:transparent;
  border:none;
  cursor:pointer;
  font-family:inherit;
  text-align:left;
}
.tr-help-faq-q-text{flex:1;min-width:0}
.tr-help-faq-q-title{
  font-size:13.5px;font-weight:700;
  color:var(--tx1,#1a1a2e);
  margin-bottom:0;
}
.tr-help-faq-q-answer{
  margin-top:6px;
  font-size:12.5px;
  color:var(--tx2,#8890b0);
  line-height:1.6;
}
.tr-help-faq-chev{
  flex-shrink:0;
  color:var(--tx2,#8890b0);
  transition:transform .2s ease;
  display:inline-flex;
  margin-top:2px;
}
.tr-help-faq-chev.open{transform:rotate(180deg);color:#7c3aed}
.tr-help-empty{
  padding:24px 16px;
  text-align:center;
  font-size:13px;
  color:var(--tx2,#8890b0);
  font-style:italic;
}

/* ── Feedback (Type/Dictate tabs) ── */
.tr-help-mode-tabs{display:flex;gap:6px;margin-bottom:14px}
.tr-help-mode-tab{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;
  background:transparent;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:9px;
  color:var(--tx1,#1a1a2e);
  font-size:12.5px;font-weight:600;
  cursor:pointer;font-family:inherit;
  transition:all .15s;
}
.tr-help-mode-tab:hover{border-color:#7c3aed;color:#7c3aed}
.tr-help-mode-tab.on{
  background:rgba(124,58,237,.08);
  border-color:#7c3aed;
  color:#7c3aed;
}
.tr-help-textarea{
  width:100%;
  min-height:110px;
  padding:14px;
  background:#fafafa;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:10px;
  font-size:13px;
  color:var(--tx1,#1a1a2e);
  font-family:inherit;
  outline:none;
  resize:vertical;
  margin-bottom:14px;
  box-sizing:border-box;
  transition:border-color .15s,box-shadow .15s;
}
.tr-help-textarea:focus{
  border-color:#7c3aed;
  box-shadow:0 0 0 3px rgba(124,58,237,.08);
}
.tr-help-textarea::placeholder{color:var(--tx2,#8890b0)}

.tr-help-voice{text-align:center;padding:18px 0;margin-bottom:14px}
.tr-help-voice-ring{
  width:64px;height:64px;
  margin:0 auto 10px;
  border-radius:50%;
  background:rgba(124,58,237,.08);
  color:#7c3aed;
  border:2px solid rgba(124,58,237,.25);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
  transition:all .2s;
}
.tr-help-voice-ring:hover{transform:scale(1.05)}
.tr-help-voice-ring.active{
  background:#dc2626;color:#fff;border-color:#dc2626;
  animation:trHelpPulse 1.4s ease-in-out infinite;
}
@keyframes trHelpPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}
  50%{box-shadow:0 0 0 10px rgba(220,38,38,0)}
}
.tr-help-voice-status{
  font-size:12.5px;
  color:var(--tx2,#8890b0);
}
.tr-help-voice-transcript{
  margin-top:12px;
  padding:12px;
  background:#fafafa;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:9px;
  font-size:12.5px;
  color:var(--tx1,#1a1a2e);
  text-align:left;
  line-height:1.6;
}

.tr-help-feedback-success{
  padding:14px;
  background:rgba(16,185,129,.08);
  border:1px solid rgba(16,185,129,.25);
  border-radius:10px;
  color:#059669;
  font-size:13px;font-weight:600;
}

/* ── Buttons ── */
.tr-help-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:10px 18px;
  background:#7c3aed;
  border:none;
  border-radius:9px;
  color:#fff;
  font-size:13px;font-weight:600;
  cursor:pointer;
  font-family:inherit;
  transition:all .15s ease;
}
.tr-help-btn:hover:not(:disabled){background:#6d28d9;transform:translateY(-1px);box-shadow:0 4px 12px rgba(124,58,237,.25)}
.tr-help-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-help-btn.outline{
  background:transparent;
  border:1.5px solid #7c3aed;
  color:#7c3aed;
}
.tr-help-btn.outline:hover{
  background:rgba(124,58,237,.06);
  transform:none;box-shadow:none;
}

/* ── Was this page helpful? card ── */
.tr-help-rating{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px 20px;
  display:flex;
  align-items:center;
  gap:16px;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
  flex-wrap:wrap;
}
.tr-help-rating-icon{
  width:46px;height:46px;
  border-radius:11px;
  background:rgba(124,58,237,.08);
  color:#7c3aed;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.tr-help-rating-body{flex:1;min-width:200px}
.tr-help-rating-title{
  font-size:14px;font-weight:700;
  color:var(--tx1,#1a1a2e);
  margin-bottom:2px;
}
.tr-help-rating-sub{
  font-size:12.5px;
  color:var(--tx2,#8890b0);
}
.tr-help-rating-btns{display:flex;gap:8px;flex-wrap:wrap}
.tr-help-rating-btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:8px 14px;
  background:transparent;
  border:1px solid var(--bd,#e9e5f3);
  border-radius:9px;
  font-size:12.5px;font-weight:600;
  color:var(--tx1,#1a1a2e);
  cursor:pointer;
  font-family:inherit;
  transition:all .15s;
}
.tr-help-rating-btn:hover:not(:disabled){
  border-color:#7c3aed;
  color:#7c3aed;
  background:rgba(124,58,237,.04);
}
.tr-help-rating-btn.selected{
  background:#7c3aed;
  border-color:#7c3aed;
  color:#fff;
}
.tr-help-rating-btn:disabled:not(.selected){
  opacity:.4;cursor:not-allowed;
}

/* ── Sidebar cards ── */
.tr-help-side-card{
  background:var(--s1,#fff);
  border:1px solid var(--bd,#e9e5f3);
  border-radius:14px;
  padding:18px;
  box-shadow:0 1px 2px rgba(0,0,0,.02);
}
.tr-help-side-title{
  font-size:14px;font-weight:700;
  margin:0 0 4px;
  color:var(--tx1,#1a1a2e);
}
.tr-help-side-desc{
  font-size:12.5px;
  color:var(--tx2,#8890b0);
  margin:0 0 16px;
}

/* Contact Support rows */
.tr-help-contact-row{
  display:flex;
  align-items:flex-start;
  gap:11px;
  padding:9px 0;
  text-decoration:none;
  color:inherit;
}
.tr-help-contact-icon{
  flex-shrink:0;
  color:var(--tx2,#8890b0);
  margin-top:2px;
  display:inline-flex;
}
.tr-help-contact-text{
  font-size:13px;font-weight:600;
  color:var(--tx1,#1a1a2e);
  word-break:break-word;
}
a.tr-help-contact-row:hover .tr-help-contact-text{color:#7c3aed}
.tr-help-contact-sub{
  font-size:11.5px;
  color:var(--tx2,#8890b0);
  margin-top:2px;
}
.tr-help-contact-sub.good{color:#10b981;font-weight:600}

/* System Status */
.tr-help-status-row{
  display:flex;align-items:center;gap:9px;
  margin-top:10px;
}
.tr-help-status-icon{display:inline-flex;align-items:center}
.tr-help-status-label{
  font-size:13px;font-weight:600;
  color:#059669;
}
.tr-help-status-meta{
  font-size:11.5px;
  color:var(--tx2,#8890b0);
  margin:6px 0 12px;
}
.tr-help-link-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:0;
  background:transparent;border:none;
  color:#7c3aed;
  font-size:13px;font-weight:600;
  cursor:pointer;font-family:inherit;
}
.tr-help-link-btn:hover{text-decoration:underline}

/* Quick Links */
.tr-help-quick-link{
  display:flex;
  align-items:center;
  justify-content:space-between;
  width:100%;
  padding:10px 4px;
  background:transparent;border:none;
  font-size:13px;
  color:var(--tx1,#1a1a2e);
  cursor:pointer;
  font-family:inherit;
  text-align:left;
  transition:color .15s;
}
.tr-help-quick-link:hover{color:#7c3aed}
.tr-help-quick-link svg{color:var(--tx2,#8890b0)}
.tr-help-quick-link:hover svg{color:#7c3aed}

/* Still need help (lavender) */
.tr-help-stillneed{
  background:rgba(124,58,237,.07);
  border:1px solid rgba(124,58,237,.18);
  border-radius:14px;
  padding:20px;
  text-align:center;
}
.tr-help-stillneed-icon{
  width:46px;height:46px;
  margin:0 auto 12px;
  border-radius:11px;
  background:rgba(124,58,237,.12);
  color:#7c3aed;
  display:flex;align-items:center;justify-content:center;
}
.tr-help-stillneed-title{
  font-size:15px;font-weight:700;
  color:var(--tx1,#1a1a2e);
  margin-bottom:6px;
}
.tr-help-stillneed-desc{
  font-size:12.5px;
  color:var(--tx2,#8890b0);
  line-height:1.5;
  margin-bottom:14px;
}

/* SVG defensive sizing */
.tr-help-root svg:not([width]){width:16px;height:16px}

/* Fade animation */
.tr-help-root .fadeUp{animation:trHelpFade .35s ease both}
@keyframes trHelpFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </>
  );
}
