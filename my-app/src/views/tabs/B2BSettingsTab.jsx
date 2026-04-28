// ═══════════════════════════════════════════════════════════════
// B2B SETTINGS TAB - Company Profile + Integrations + Permissions
// ═══════════════════════════════════════════════════════════════
export default function B2BSettingsTab({
  companyName, setCompanyName,
  teamSize, setTeamSize,
  companySettingsMsg, setCompanySettingsMsg,
  slackWebhook, setSlackWebhook,
  zapierWebhook, setZapierWebhook,
  integrationMsg, setIntegrationMsg,
}) {
  return (
    <>
      <div className="lbl" style={{ marginBottom: 10 }}>COMPANY PROFILE</div>
      <div className="card fadeUp" style={{ padding: 16, marginBottom: 16 }}>
        {companySettingsMsg && (
          <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: companySettingsMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: companySettingsMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
            {companySettingsMsg}
          </div>
        )}
        <input className="input" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ marginBottom: 10 }} />
        <select className="input" value={teamSize} onChange={e => setTeamSize(e.target.value)} style={{ marginBottom: 14 }}>
          <option value="5-10">Team Starter · 5-10 people</option>
          <option value="11-50">Team Pro · 11-50 people</option>
          <option value="50+">Enterprise · 50+ people</option>
        </select>
        <button className="btn bp" style={{ fontSize: 12, padding: "10px 24px" }}
          onClick={async () => {
            setCompanySettingsMsg('Saving...');
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ company_name: companyName, team_size: teamSize })
              });
              const data = await res.json();
              if (data.success) { setCompanySettingsMsg('✅ Saved!'); setTimeout(() => setCompanySettingsMsg(''), 3000); }
              else setCompanySettingsMsg('❌ ' + (data.error || 'Failed'));
            } catch (e) { setCompanySettingsMsg('❌ ' + e.message); }
          }}>
          Save Profile
        </button>
      </div>

      {/* Integrations */}
      <div className="card fadeUp" style={{ padding: 18, marginBottom: 14 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>INTEGRATIONS</div>
        {integrationMsg && (
          <div style={{ padding: 9, borderRadius: 8, marginBottom: 10, fontSize: 13, background: integrationMsg.includes("✅") ? "rgba(0,224,150,.1)" : "rgba(255,82,82,.1)", color: integrationMsg.includes("✅") ? "var(--ok)" : "var(--dn)" }}>
            {integrationMsg}
          </div>
        )}
        <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>💬 Slack Notifications</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Get notified when candidates complete assessments</div>
            </div>
            <span style={{ fontSize: 12, color: slackWebhook ? "var(--ok)" : "var(--tx2)", fontWeight: 600 }}>{slackWebhook ? "✅ Connected" : "Not connected"}</span>
          </div>
          <input className="input" placeholder="Slack Webhook URL (https://hooks.slack.com/...)" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
          <button className="btn bs" style={{ fontSize: 13, padding: "6px 16px" }}
            onClick={async () => {
              setIntegrationMsg('Saving...');
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ slack_webhook: slackWebhook }) });
                const data = await res.json();
                if (data.success) { setIntegrationMsg('✅ Slack webhook saved!'); setTimeout(() => setIntegrationMsg(''), 3000); }
                else setIntegrationMsg('❌ ' + (data.error || 'Failed'));
              } catch (e) { setIntegrationMsg('❌ ' + e.message); }
            }}>Save Webhook</button>
        </div>
        <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>⚡ ATS Integration (Zapier)</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Push candidate results to your ATS automatically</div>
            </div>
            <span style={{ fontSize: 12, color: zapierWebhook ? "var(--ok)" : "var(--tx2)", fontWeight: 600 }}>{zapierWebhook ? "✅ Connected" : "Not connected"}</span>
          </div>
          <input className="input" placeholder="Zapier Webhook URL (https://hooks.zapier.com/...)" value={zapierWebhook} onChange={e => setZapierWebhook(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
          <button className="btn bs" style={{ fontSize: 13, padding: "6px 16px" }}
            onClick={async () => {
              setIntegrationMsg('Saving...');
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://threatready-db.onrender.com/api/b2b/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ zapier_webhook: zapierWebhook }) });
                const data = await res.json();
                if (data.success) { setIntegrationMsg('✅ Zapier webhook saved!'); setTimeout(() => setIntegrationMsg(''), 3000); }
                else setIntegrationMsg('❌ ' + (data.error || 'Failed'));
              } catch (e) { setIntegrationMsg('❌ ' + e.message); }
            }}>Save Webhook</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>🔐 Google Workspace SSO</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Let your team sign in with Google Workspace</div>
          </div>
          <span style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>✅ Available via Google Login</span>
        </div>
      </div>

      {/* Team Permissions */}
      <div className="card fadeUp" style={{ padding: 18 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>TEAM PERMISSIONS</div>
        {[
          ["👑 Admin", "Full access — manage everything", "#f59e0b"],
          ["👔 Hiring Manager", "Create assessments, view results, invite candidates", "var(--ac)"],
          ["📋 Recruiter", "Invite candidates only", "var(--ok)"],
          ["👁️ Viewer", "View results only, no actions", "var(--tx2)"]
        ].map(([role, desc, color], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--bd)" : "none" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>{role}</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>{desc}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--tx2)", background: "var(--s2)", padding: "3px 10px", borderRadius: 20 }}>{i === 0 ? "You" : "Invite via email"}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: 12, background: "rgba(0,229,255,.05)", borderRadius: 10, border: "1px solid rgba(0,229,255,.15)", fontSize: 13, color: "var(--tx2)" }}>
          💡 Invite team members as candidates with their work email — they'll appear after completing their assessment.
        </div>
      </div>
    </>
  );
}