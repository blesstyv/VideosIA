/** Límites: un solo tanque de uso alimenta el chat y Claude Code; los dos lo vacían a la vez. */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Bubble, MiniTerm, Pill } from "./parts";
import { cl, useArt } from "./useArt";

export const QuotaArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tChat = beat("chat", 30);
  const tCode = beat("code", tChat + 15);
  const tDrain = beat("drain", tCode + 10);
  const A = sides.a.main;

  const level = interpolate(frame, [tDrain, tDrain + 50], [0.9, 0.22], cl);
  const flowing = frame > tDrain;
  const tank = { x: 380, y: 150, w: 320, h: 420 };
  const liquidH = (tank.h - 24) * level;
  const wave = Math.sin(frame / 5) * 8;
  const warn = sp(0, 10);

  // Gotas que bajan por cada tubería
  const drops = (path: (t: number) => [number, number]) =>
    flowing
      ? [0, 1, 2].map((i) => {
          const t = ((frame - tDrain) / 18 + i / 3) % 1;
          const [x, y] = path(t);
          return <circle key={i} cx={x} cy={y} r={12} fill={A} opacity={0.9} />;
        })
      : null;
  const left = (t: number): [number, number] =>
    t < 0.5 ? [480, 570 + t * 2 * 90] : [480 - (t - 0.5) * 2 * 210, 660];
  const right = (t: number): [number, number] =>
    t < 0.5 ? [600, 570 + t * 2 * 90] : [600 + (t - 0.5) * 2 * 210, 660];

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="qt-clip">
          <rect x={tank.x + 12} y={tank.y + 12} width={tank.w - 24} height={tank.h - 24} rx={30} />
        </clipPath>
      </defs>

      {/* Aviso */}
      <g transform={`translate(150 120) scale(${warn}) rotate(${Math.sin(frame / 6) * 4})`}>
        <path d="M 0 -80 L 80 60 L -80 60 Z" fill="#FACC15" stroke="#1A1405" strokeWidth={6} strokeLinejoin="round" />
        <text y={44} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={90} fill="#1A1405">
          !
        </text>
      </g>

      {/* Tuberías */}
      <path d="M 480 570 L 480 660 L 270 660 L 270 720" fill="none" stroke="#334155" strokeWidth={28} strokeLinejoin="round" />
      <path d="M 600 570 L 600 660 L 810 660 L 810 720" fill="none" stroke="#334155" strokeWidth={28} strokeLinejoin="round" />
      {drops(left)}
      {drops(right)}

      {/* Tanque */}
      <Pill x={540} y={90} text="Tu cupo de uso" color={A} appear={sp(4)} size={42} />
      <rect x={tank.x} y={tank.y} width={tank.w} height={tank.h} rx={40} fill="rgba(14,21,40,0.92)" stroke="#CBD5E1" strokeWidth={8} />
      <g clipPath="url(#qt-clip)">
        <path
          d={`M ${tank.x} ${tank.y + tank.h - 12 - liquidH} q 80 ${wave} 160 0 t 160 0 L ${tank.x + tank.w} ${tank.y + tank.h} L ${tank.x} ${tank.y + tank.h} Z`}
          fill={A}
        />
      </g>
      {[0.25, 0.5, 0.75].map((m) => (
        <line key={m} x1={tank.x + tank.w - 50} x2={tank.x + tank.w - 14} y1={tank.y + tank.h * m} y2={tank.y + tank.h * m} stroke="#CBD5E1" strokeWidth={5} />
      ))}
      <text x={540} y={tank.y + tank.h / 2 + 30} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={84} fill="#F8FAFC">
        {Math.round(level * 100)}%
      </text>

      {/* Destinos */}
      <Bubble x={80} y={720} w={380} h={170} color={A} appear={sp(tChat - 4)}>
        <text x={190} y={108} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={60} fill="#2A1206">
          Chat
        </text>
      </Bubble>
      <MiniTerm x={620} y={720} w={380} h={200} label="Claude Code" color={A} appear={sp(tCode - 4)} />
    </svg>
  );
};
