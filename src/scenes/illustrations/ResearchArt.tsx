/** Método: una lupa recorre las dos páginas oficiales de precios y cae el sello «Datos oficiales». */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Win } from "./parts";
import { cl, useArt } from "./useArt";

const PAGES = [
  { x: 40, url: "claude.com/pricing", color: sides.a.main, rows: [["Free", "$0"], ["Pro", "$20"], ["Max", "$100"]] },
  { x: 560, url: "chatgpt.com/pricing", color: sides.b.main, rows: [["Free", "$0"], ["Plus", "$20"], ["Pro", "$100+"]] },
];

export const ResearchArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tPages = beat("pages", 15);
  const tData = beat("data", 90);

  // La lupa recorre las filas: página izquierda y luego derecha
  const span = Math.max(20, tData - tPages - 8);
  const k = interpolate(frame, [tPages, tPages + span], [0, 5.99], cl);
  const pageIdx = Math.floor(k / 3);
  const rowIdx = Math.floor(k % 3);
  const rowY = (r: number) => 330 + r * 120;
  const lx = interpolate(k, [0, 2.99, 3, 5.99], [300, 300, 820, 820], cl);
  const ly = interpolate(k % 3, [0, 1, 2, 2.99], [rowY(0), rowY(1), rowY(2), rowY(2)]) - 20;
  const lensOn = interpolate(frame, [tPages - 4, tPages + 6, tData + 2, tData + 10], [0, 1, 1, 0], cl);

  const stamp = sp(tData - 3, 9);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      {PAGES.map((p, i) => (
        <Win key={p.url} x={p.x} y={110} w={480} h={560} title={p.url} appear={sp(i * 6)} accent={p.color} active={pageIdx === i ? lensOn : 0}>
          <rect x={40} y={100} width={240} height={26} rx={13} fill="#334155" />
          <rect x={40} y={142} width={340} height={18} rx={9} fill="#1E293B" />
          {p.rows.map(([name, price], r) => {
            const hit = frame >= tPages && (pageIdx > i || (pageIdx === i && rowIdx >= r));
            return (
              <g key={name + r} transform={`translate(30 ${190 + r * 120})`}>
                <rect width={420} height={96} rx={18} fill={hit ? p.color : "#16203A"} opacity={hit ? 0.22 : 1} />
                <text x={28} y={62} fontFamily={fonts.sans} fontWeight={800} fontSize={40} fill="#E2E8F0">
                  {name}
                </text>
                <text x={392} y={62} textAnchor="end" fontFamily={fonts.sans} fontWeight={900} fontSize={42} fill={p.color}>
                  {price}
                </text>
              </g>
            );
          })}
        </Win>
      ))}

      {/* Lupa */}
      <g transform={`translate(${lx} ${ly}) rotate(-12)`} opacity={lensOn}>
        <line x1={70} y1={70} x2={150} y2={150} stroke="#94A3B8" strokeWidth={30} strokeLinecap="round" />
        <circle r={100} fill="rgba(125,211,252,0.12)" stroke="#E2E8F0" strokeWidth={16} />
        <path d="M -55 -40 Q -40 -65 -10 -72" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={10} strokeLinecap="round" fill="none" />
      </g>

      {/* Sello */}
      <g
        transform={`translate(540 820) rotate(-8) scale(${interpolate(stamp, [0, 1], [2.2, 1])})`}
        opacity={interpolate(stamp, [0, 0.25], [0, 1], cl)}
      >
        <rect x={-360} y={-80} width={720} height={160} rx={24} fill="rgba(3,6,16,0.85)" stroke="#4ADE80" strokeWidth={10} />
        <rect x={-340} y={-60} width={680} height={120} rx={14} fill="none" stroke="#4ADE80" strokeWidth={4} strokeDasharray="14 10" />
        <text y={24} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={62} letterSpacing={2} fill="#4ADE80">
          DATOS OFICIALES
        </text>
      </g>
    </svg>
  );
};
