/**
 * Plan de $20: cae una moneda en cada alcancía; el candado de Claude Code se abre
 * y la batería de Codex se llena.
 */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Battery, CheckBadge, Coin, Lock, MiniTerm, Pill } from "./parts";
import { cl, useArt } from "./useArt";

const Piggy: React.FC<{ x: number; y: number; color: string; squash: number }> = ({ x, y, color, squash }) => (
  <g transform={`translate(${x} ${y}) scale(${1 + squash * 0.06} ${1 - squash * 0.06})`}>
    <rect x={-80} y={50} width={36} height={60} rx={14} fill={color} />
    <rect x={44} y={50} width={36} height={60} rx={14} fill={color} />
    <ellipse rx={150} ry={105} fill={color} />
    <ellipse rx={150} ry={105} fill="#FFFFFF" opacity={0.12} transform="translate(-30 -30) scale(0.6)" />
    <path d="M -90 -80 L -60 -130 L -30 -90 Z" fill={color} />
    <ellipse cx={140} cy={10} rx={34} ry={28} fill="#FFFFFF" opacity={0.3} />
    <circle cx={132} cy={6} r={6} fill="#0B1020" />
    <circle cx={150} cy={6} r={6} fill="#0B1020" />
    <circle cx={80} cy={-30} r={11} fill="#0B1020" />
    <rect x={-50} y={-102} width={100} height={14} rx={7} fill="#0B1020" />
  </g>
);

export const PaidArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tCoin = beat("coin", 10);
  const tUnlock = beat("unlock", tCoin + 60);
  const tFill = beat("fill", tUnlock + 50);
  const A = sides.a.main;
  const B = sides.b.main;

  const coinY = (delay: number) => interpolate(frame, [tCoin - 14 + delay, tCoin + delay], [-60, 150], cl);
  const coinOp = (delay: number) => interpolate(frame, [tCoin - 14 + delay, tCoin - 10 + delay, tCoin + delay - 1, tCoin + delay], [0, 1, 1, 0], cl);
  const squash = (delay: number) => {
    const d = frame - (tCoin + delay);
    return d >= 0 && d < 12 ? Math.sin((d / 12) * Math.PI) : 0;
  };
  const open = interpolate(sp(tUnlock - 2, 10), [0, 1], [0, 1]);
  const lockFade = interpolate(frame, [tUnlock + 12, tUnlock + 22], [1, 0], cl);
  const level = interpolate(frame, [tFill, tFill + 20], [0.18, 0.95], cl);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      {/* Monedas */}
      <g opacity={coinOp(0)}>
        <Coin x={270} y={coinY(0)} r={54} label="$20" />
      </g>
      <g opacity={coinOp(6)}>
        <Coin x={810} y={coinY(6)} r={54} label="$20" />
      </g>

      <Piggy x={270} y={290} color={A} squash={squash(0)} />
      <Piggy x={810} y={290} color={B} squash={squash(6)} />
      <Pill x={270} y={460} text="Claude Pro" color={A} appear={sp(tCoin)} size={40} />
      <Pill x={810} y={460} text="ChatGPT Plus" color={B} appear={sp(tCoin + 6)} size={40} />

      {/* Claude Code se desbloquea */}
      <MiniTerm x={70} y={560} w={400} h={330} label="Claude Code" color={A} appear={sp(tCoin + 10)} dim={1 - open}>
        <g opacity={lockFade}>
          <Lock x={200} y={120} s={1.4} open={open} />
        </g>
        <CheckBadge x={200} y={135} r={56} appear={sp(tUnlock + 16, 10)} />
        <text x={200} y={240} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={30} fill="#4ADE80" opacity={sp(tUnlock + 18)}>
          Incluido
        </text>
      </MiniTerm>

      {/* Codex con más uso */}
      <MiniTerm x={610} y={560} w={400} h={330} label="Codex" color={B} appear={sp(tCoin + 16)}>
        <Battery x={90} y={95} w={210} h={90} level={level} color={B} />
        <text x={200} y={240} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={30} fill="#4ADE80" opacity={sp(tFill + 10)}>
          Más uso
        </text>
      </MiniTerm>
    </svg>
  );
};
