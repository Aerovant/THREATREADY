// ═══════════════════════════════════════════════════════════════
// ARCHITECTURE DIAGRAM
// SVG renderer with zoom and pan. Verbatim from original App.jsx.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import { NT } from "../constants.js";

export default function ArchDiagram({ nodes, edges, zoom = 1 }) {
  const [z, setZ] = useState(zoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  if (!nodes?.length) return null;
  // Content bounds with padding so nodes/labels aren't flush against the edges.
  const minX = Math.min(...nodes.map(n => n.x)) - 30;
  const minY = Math.min(...nodes.map(n => n.y)) - 30;
  const maxX = Math.max(...nodes.map(n => n.x)) + 130;
  const maxY = Math.max(...nodes.map(n => n.y)) + 90;
  const vbW = maxX - minX;
  const vbH = maxY - minY;

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setZ(p => Math.min(2, p + 0.2))}>+</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setZ(p => Math.max(0.5, p - 0.2))}>-</button>
        <button className="btn bs" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => { setZ(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        <span style={{ fontSize: 11, color: "var(--tx2)", marginLeft: 4 }}>{Math.round(z * 100)}%</span>
      </div>
      <div style={{ overflow: "hidden", borderRadius: 10, background: "var(--s2)", border: "1px solid var(--bd)", cursor: "grab" }}
        onMouseDown={e => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={e => { if (!dragging.current) return; setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y })); lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}>
        <svg viewBox={`${minX} ${minY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: 360, display: "block", margin: "0 auto", transform: `scale(${z}) translate(${pan.x / z}px, ${pan.y / z}px)`, transformOrigin: "center" }}>
          <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#ff5252" /></marker></defs>

          {/* PASS 1: Draw edge lines (connecting nodes) */}
          {edges?.map((e, i) => {
            const from = nodes.find(n => n.id === e.f), to = nodes.find(n => n.id === e.t);
            if (!from || !to) return null;
            return (
              <line key={`line-${i}`}
                x1={from.x + 50} y1={from.y + 25}
                x2={to.x + 50} y2={to.y + 25}
                stroke={e.a ? "#ff5252b0" : "#ffffff30"}
                strokeWidth={e.a ? 2 : 1}
                markerEnd={e.a ? "url(#ah)" : ""}
              />
            );
          })}

          {/* PASS 2: Draw nodes (boxes with icon and label) */}
          {nodes.map(n => {
            const t = NT[n.t] || NT.compute;
            return <g key={n.id}>
              <rect x={n.x} y={n.y} width={100} height={50} rx={6} fill={t.bg} stroke={t.bd} strokeWidth={1.5} />
              <text x={n.x + 50} y={n.y + 20} fill="#fff" fontSize="16" textAnchor="middle">{t.ic}</text>
              <text x={n.x + 50} y={n.y + 38} fill="#e8eaf6" fontSize="11" fontWeight="600" textAnchor="middle">{n.l}</text>
            </g>;
          })}

          {/* PASS 3: Draw edge LABELS LAST — text only with outline, no box */}
          {edges?.map((e, i) => {
            const from = nodes.find(n => n.id === e.f), to = nodes.find(n => n.id === e.t);
            if (!from || !to) return null;
            const label = e.l || '';
            if (!label) return null;

            const fromCx = from.x + 50;
            const fromCy = from.y + 25;
            const toCx = to.x + 50;
            const toCy = to.y + 25;

            const mx = (fromCx + toCx) / 2;
            const my = (fromCy + toCy) / 2;

            const dx = toCx - fromCx;
            const dy = toCy - fromCy;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            let perpX = -dy / len;
            let perpY = dx / len;

            if (perpY > 0) {
              perpX = -perpX;
              perpY = -perpY;
            }

            const offsetDistance = 26;
            const labelX = mx + perpX * offsetDistance;
            const labelY = my + perpY * offsetDistance;

            // Approx text width so the backing chip fits the label (SVG can't
            // measure text synchronously; ~6.2px per char at fontSize 11 is close).
            const chipW = label.length * 6.2 + 14;
            const chipH = 18;

            return (
              <g key={`label-${i}`} style={{ pointerEvents: "none" }}>
                <rect
                  x={labelX - chipW / 2}
                  y={labelY - chipH / 2}
                  width={chipW}
                  height={chipH}
                  rx={5}
                  fill="#0a0e1a"
                  opacity="0.92"
                  stroke="#ffffff22"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ userSelect: 'none' }}
                >{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
