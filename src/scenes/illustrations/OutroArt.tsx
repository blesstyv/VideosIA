/** Cierre: los dos asistentes chocan y aparece una burbuja de comentario escribiendo. */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Bubble, Orb } from "./parts";
import { cl, useArt } from "./useArt";

export const OutroArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tBump = beat("bump", 25);
  const tComment = beat("comment", tBump + 30);

  const approach = interpolate(frame, [0, tBump], [0, 1], { ...cl, easing: (t) => t * t });
  const recoil = frame > tBump ? Math.sin(Math.min(1, (frame - tBump) / 10) * Math.PI) * 40 : 0;
  const ax = interpolate(approach, [0, 1], [-60, 420]) - recoil;
  const bx = interpolate(approach, [0, 1], [1140, 660]) + recoil;
  const burst = interpolate(frame, [tBump, tBump + 16], [0, 1], cl);
  const bubble = sp(tComment - 6, 12);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <text x={540} y={80} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={72} fill="#F8FAFC" opacity={sp(0)}>
        ¿Claude o ChatGPT?
      </text>

      {/* Destello del choque */}
      <g transform="translate(540 330)" opacity={1 - burst}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r1 = 60 + burst * 60;
          const r2 = 110 + burst * 120;
          return (
            <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="#FACC15" strokeWidth={12} strokeLinecap="round" />
          );
        })}
      </g>
      <Orb id="ot-a" x={ax} y={330} r={110} color={sides.a.main} frame={frame} appear={1} look={1} happy={1} />
      <Orb id="ot-b" x={bx} y={330} r={110} color={sides.b.main} frame={frame + 40} appear={1} look={-1} happy={1} />

      {/* Comentario */}
      <Bubble x={140} y={560} w={800} h={250} color="#F8FAFC" appear={bubble}>
        <circle cx={100} cy={125} r={52} fill="#334155" />
        <circle cx={100} cy={108} r={20} fill="#94A3B8" />
        <path d="M 66 160 Q 100 124 134 160" fill="#94A3B8" />
        <text x={180} y={110} fontFamily={fonts.sans} fontWeight={900} fontSize={50} fill="#0B1020">
          ¿Tú cuál usas?
        </text>
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={200 + i * 44}
            cy={170}
            r={14}
            fill="#64748B"
            opacity={0.35 + 0.65 * Math.max(0, Math.sin(frame / 4 - i * 0.9))}
          />
        ))}
      </Bubble>
      {/* Corazones que suben */}
      {[0, 1, 2, 3].map((i) => {
        const t = ((frame - tComment) / 40 + i / 4) % 1;
        if (frame < tComment) return null;
        return (
          <path
            key={i}
            d="M 0 10 C -30 -20 -12 -40 0 -22 C 12 -40 30 -20 0 10 Z"
            fill={i % 2 ? sides.a.main : sides.b.main}
            opacity={interpolate(t, [0, 0.2, 1], [0, 1, 0])}
            transform={`translate(${880 - i * 50} ${780 - t * 260}) scale(1.6)`}
          />
        );
      })}
    </svg>
  );
};
