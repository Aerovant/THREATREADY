// ═══════════════════════════════════════════════════════════════
// TOAST + CONFIRM CONTAINER
// Verbatim from original App.jsx — registers itself with helpers' bridge.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { setShowToast, setShowConfirm } from "./helpers.js";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  // Register the bridge once on mount so showToast()/showConfirm() work app-wide.
  useEffect(() => {
    setShowToast((msg, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    });
    setShowConfirm((msg, onYes, onNo) => setConfirm({ msg, onYes, onNo }));
  }, []);

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const isLogout = (msg) => msg.toLowerCase().includes('logout');
  const isDelete = (msg) => msg.toLowerCase().includes('delete');

  return (
    <>
      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type || 'info'}`}>
            <span className="toast-icon">{icons[t.type] || 'ℹ️'}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>

      {/* ── CONFIRM DIALOG ── */}
      {confirm && (
        <div className="confirm-backdrop"
          onClick={e => e.target === e.currentTarget && (confirm.onNo?.(), setConfirm(null))}>
          <div className="confirm-box">
            <span className="confirm-emoji">
              {isLogout(confirm.msg) ? '👋' : isDelete(confirm.msg) ? '🗑️' : '⚠️'}
            </span>
            <div className="confirm-title">{confirm.msg}</div>
            <div className="confirm-sub">
              {isLogout(confirm.msg)
                ? 'You will be signed out and redirected to the home page.'
                : isDelete(confirm.msg)
                  ? 'This action is permanent and cannot be undone.'
                  : 'Please confirm to proceed with this action.'}
            </div>
            <div className="confirm-btns">
              <button className="confirm-cancel"
                onClick={() => { confirm.onNo?.(); setConfirm(null); }}>
                Cancel
              </button>
              <button className={`confirm-ok ${isDelete(confirm.msg) ? 'confirm-ok-delete' : 'confirm-ok-logout'}`}
                onClick={() => { confirm.onYes?.(); setConfirm(null); }}>
                {isLogout(confirm.msg) ? 'Yes, Logout'
                  : isDelete(confirm.msg) ? 'Yes, Delete'
                    : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
