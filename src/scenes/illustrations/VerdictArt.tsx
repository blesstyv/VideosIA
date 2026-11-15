/** Veredicto: un poste con dos señales (gratis / $20) y una pancarta final «prueba los dos». */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Orb } from "./parts";
import { cl, useArt } from "./useArt";

const Sign: React.FC<{
  y: number;
  dir: 1 | -1;
  title: string;
  pick: string;
  color: string;
  appear: number;
  pickOn: number;
}> = ({ y, dir, title, pick, color, appear, pickOn }) => {
  const w = 420;
  const h = 170;
  const x0 = dir === 1 ? 560 : 520 - w;
  const tip = dir === 1 ? `L ${x0 + w + 45} ${y + h / 2} L ${x0 + w} ${y + h}` : `L ${x0 - 45} ${y + h / 2} L ${x0} ${y}`;
  const d =
    dir === 1
      ? `M ${x0} ${y} L ${x0 + w} ${y} ${tip} L ${x0} ${y + h} Z`
      : `M ${x0 + w} ${y} L ${x0 + w} ${y + h} L ${x0} ${y + h} ${tip} Z`;
  const cx = x0 + w / 2;
  return (
    <g opacity={interpolate(appear, [0, 0.4], [0, 1], cl)} transform={`rotate(${interpolate(appear, [0, 1], [dir * 10, 0])} 540 ${y + h / 2})`}>
      <path d={d} fill="rgba(14,21,40,0.95)" stroke={color} strokeWidth={7} strokeLinejoin="round" />
      <text x={cx} y={y + 66} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={34} fill="#A5B4CC">
        {title}
      </text>
      <text
        x={cx}
        y={y + 136}
        textAnchor="middle"
        fontFamily={fonts.sans}
        fontWeight={900}
        fontSize={interpolate(pickOn, [0, 1], [38, 46])}
        fill={color}
        opacity={interpolate(pickOn, [0, 1], [0, 1], cl)}
      >
        {pick}
      </text>
    </g>
  );
};

export const VerdictArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tLearn = beat("learn", 20);
  const tFree = beat("free", tLearn + 15);
  const tDaily = beat("daily", tFree + 40);
  const tTwenty = beat("twenty", tDaily + 25);
  const tTry = beat("try", tTwenty + 50);
  const banner = sp(tTry - 4, 11);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <text x={540} y={70} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={70} fill="#F8FAFC" opacity={sp(0)}>
        Mi consejo
      </text>
      {/* Poste */}
      <rect x={522} y={130} width={36} height={600} rx={10} fill="#64748B" />
      <ellipse cx={540} cy={735} rx={140} ry={26} fill="#1E293B" />

      <Sign y={170} dir={-1} title="¿Aprendiendo?" pick="Empieza gratis" color="#4ADE80" appear={sp(tLearn - 4, 11)} pickOn={sp(tFree - 2)} />
      <Sign y={400} dir={1} title="¿Programas a diario?" pick="Plan de $20" color="#FACC15" appear={sp(tDaily - 4, 11)} pickOn={sp(tTwenty - 2)} />

      {/* Pancarta final */}
      <g transform={`translate(540 850) scale(${interpolate(banner, [0, 1], [0.6, 1])})`} opacity={interpolate(banner, [0, 0.4], [0, 1], cl)}>
        <rect x={-470} y={-80} width={940} height={160} rx={80} fill="#F8FAFC" />
        <text x={70} y={18} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={46} fill="#0B1020">
          Prueba los dos en tu proyecto
        </text>
      </g>
      <Orb id="vd-a" x={125} y={850} r={36} color={sides.a.main} frame={frame} appear={banner} happy={1} look={0.5} />
      <Orb id="vd-b" x={195} y={850} r={36} color={sides.b.main} frame={frame + 30} appear={banner} happy={1} look={0.5} />
    </svg>
  );
};
