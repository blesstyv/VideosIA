/** Planes caros: escalera de tanques cada vez más grandes (Pro, Max, Ultra) y ChatGPT Pro desde $100. */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Orb, Pill } from "./parts";
import { cl, useArt } from "./useArt";

const TIERS = [
  { name: "Pro", price: "$20", mult: "1×", x: 200, h: 170, beat: "" },
  { name: "Max", price: "$100", mult: "5×", x: 540, h: 340, beat: "t100" },
  { name: "Ultra", price: "$200", mult: "10×", x: 880, h: 510, beat: "t200" },
];
const BASE = 760;
const W = 240;

export const TiersArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const t100 = beat("t100", 20);
  const t200 = beat("t200", t100 + 25);
  const tAgents = beat("agents", t200 + 60);
  const A = sides.a.main;
  const B = sides.b.main;
  const at: Record<string, number> = { "": 0, t100, t200 };

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <Pill x={540} y={60} text="Planes de Claude" color={A} appear={sp(0)} size={40} />
      {TIERS.map((t, i) => {
        const appear = sp(at[t.beat] - 4, 12);
        const fill = interpolate(frame, [at[t.beat], at[t.beat] + 18], [0, 0.92], cl);
        const top = BASE - t.h;
        const wave = Math.sin(frame / 5 + i) * 6;
        const lh = (t.h - 20) * fill;
        return (
          <g key={t.name} opacity={interpolate(appear, [0, 0.4], [0, 1], cl)} transform={`translate(0 ${interpolate(appear, [0, 1], [50, 0])})`}>
            <defs>
              <clipPath id={`tr-${i}`}>
                <rect x={t.x - W / 2 + 10} y={top + 10} width={W - 20} height={t.h - 20} rx={26} />
              </clipPath>
            </defs>
            <rect x={t.x - W / 2} y={top} width={W} height={t.h} rx={34} fill="rgba(14,21,40,0.92)" stroke="#CBD5E1" strokeWidth={7} />
            <g clipPath={`url(#tr-${i})`}>
              <path d={`M ${t.x - W / 2} ${BASE - 10 - lh} q 60 ${wave} 120 0 t 120 0 L ${t.x + W / 2} ${BASE} L ${t.x - W / 2} ${BASE} Z`} fill={A} />
            </g>
            <text x={t.x} y={top + t.h / 2 + 26} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={72} fill="#F8FAFC">
              {t.mult}
            </text>
            <text x={t.x} y={BASE + 62} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={46} fill="#F8FAFC">
              {t.name}
            </text>
            <text x={t.x} y={BASE + 112} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={40} fill={A}>
              {t.price}/mes
            </text>
          </g>
        );
      })}
      <text x={540} y={125} textAnchor="middle" fontFamily={fonts.sans} fontWeight={700} fontSize={28} fill="#A5B4CC" opacity={sp(t100)}>
        × = uso respecto a Pro
      </text>

      {/* ChatGPT Pro */}
      <g transform="translate(300 260)">
        <Pill x={0} y={0} text="ChatGPT Pro: desde $100" color={B} appear={sp(t200 + 6)} size={34} />
      </g>

      {/* Agentes trabajando todo el día */}
      {[0, 1, 2].map((k) => {
        const ang = frame / 18 + (k * Math.PI * 2) / 3;
        return (
          <Orb
            key={k}
            id={`tr-ag-${k}`}
            x={860 + Math.cos(ang) * 110}
            y={200 + Math.sin(ang) * 40}
            r={30}
            color={A}
            frame={frame + k * 20}
            appear={sp(tAgents + k * 4)}
            happy={1}
          />
        );
      })}
    </svg>
  );
};
