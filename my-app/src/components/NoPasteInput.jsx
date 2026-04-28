// ═══════════════════════════════════════════════════════════════
// NO-PASTE INPUT
// Textarea with copy/paste/cut disabled. Used in scenarios.
// Verbatim from original App.jsx.
// ═══════════════════════════════════════════════════════════════
import { noPaste } from "./helpers.js";

export default function NoPasteInput({ value, onChange, ...props }) {
  return <textarea className="input" value={value} onChange={onChange} onPaste={noPaste} onCopy={noPaste} onCut={noPaste} {...props} />;
}
