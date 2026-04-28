// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD
// Resume upload widget. Verbatim from original App.jsx.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import { showToast } from "./helpers.js";

export default function FileUpload({ onUpload, label }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const extractPdfText = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
          }
          resolve(fullText);
        } catch (err) {
          resolve('');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handle = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);

    try {
      let extractedText = '';

      if (f.type === 'application/pdf') {
        extractedText = await extractPdfText(f);
      } else if (f.name.endsWith('.txt')) {
        extractedText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result);
          reader.readAsText(f);
        });
      } else {
        // DOC/DOCX - send to backend
        const formData = new FormData();
        formData.append('resume', f);
        const token = localStorage.getItem('token');
        const res = await fetch('https://threatready-db.onrender.com/api/resume/extract', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        extractedText = data.text || '';
      }

      if (!extractedText.trim()) {
        showToast('Could not read file. Try PDF or TXT format.', 'warning');
        setUploading(false);
        return;
      }

      // Send to backend for AI extraction
      const resumeToken = localStorage.getItem('token');
      const resumeResp = await fetch("https://threatready-db.onrender.com/api/resume/parse-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (resumeToken || '')
        },
        body: JSON.stringify({ text: extractedText })
      });
      const resumeData = await resumeResp.json();
      const keyPoints = resumeData.key_points || extractedText.substring(0, 500);
      // Pass full AI data so parent can display skills, recommendations, etc.
      onUpload(keyPoints, resumeData);

    } catch (err) {
      console.error(err);
      showToast('Upload failed: ' + err.message, 'error');
    }
    setUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <button
        className="btn bs"
        style={{ fontSize: 12, padding: "6px 12px" }}
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        {uploading ? '⏳ Analyzing...' : `📎 ${label || "Upload File"}`}
      </button>
      <span style={{ fontSize: 12, color: "var(--tx2)", fontWeight: 600 }}>PDF · TXT · DOC</span>
      <input ref={ref} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={handle} />
    </div>
  );
}
