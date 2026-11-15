/**
 * Plan gratis: dos cajas de herramientas. Claude: chat con Sonnet y Haiku, Claude Code con candado.
 * ChatGPT: chat con GPT-6 y Codex con la batería casi vacía (acceso limitado).
 */
import React from "react";
import { interpolate } from "remotion";
import { fonts, sides } from "../../theme";
import { Battery, Bubble, Lock, MiniTerm, Orb, Pill } from "./parts";
import { cl, useArt } from "./useArt";

const Toolbox: React.FC<{ x: number; color: string; appear: number }> = ({ x, color, appear }) => (
  <g transform={`translate(${x} ${interpolate(appear, [0, 1], [60, 0])})`} opacity={interpolate(appear, [0, 0.4], [0, 1], cl)}>
    <path d="M 140 250 L 140 215 Q 140 195 160 195 L 300 195 Q 320 195 320 215 L 320 250" fill="none" stroke={color} strokeWidth={16} />
    <rect x={0} y={250} width={460} height={680} rx={36} fill="rgba(14,21,40,0.92)" stroke={color} strokeWidth={6} />
    <rect x={0} y={250} width={460} height={56} rx={28} fill={color} opacity={0.25} />
  </g>
);

export const FreeArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const { frame, beat, sp } = useArt(beats);
  const tA = beat("a", 10);
  const tChatA = beat("chatA", tA + 20);
  const tLock = beat("lock", tChatA + 30);
  const tB = beat("b", tLock + 40);
  const tChatB = beat("chatB", tB + 20);
  const tBatt = beat("batt", tChatB + 30);
  const A = sides.a.main;
  const B = sides.b.main;
  const lockShake = frame > tLock && frame < tLock + 14 ? Math.sin((frame - tLock) * 1.6) * 6 : 0;
  const battLevel = interpolate(frame, [tBatt, tBatt + 14], [0.85, 0.18], cl);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <Pill x={540} y={52} text="Plan gratis · $0" color="#F8FAFC" appear={sp(0)} size={44} />

      {/* Claude */}
      <Toolbox x={40} color={A} appear={sp(tA - 6)} />
      <Orb id="fr-a" x={130} y={132} r={44} color={A} frame={frame} appear={sp(tA - 6)} look={0.5} happy={0.8} />
      <text x={190} y={150} fontFamily={fonts.sans} fontWeight={900} fontSize={46} fill={A} opacity={interpolate(sp(tA - 6), [0, 0.5], [0, 1], cl)}>
        Claude
      </text>
      <Bubble x={70} y={350} w={400} h={170} color={A} appear={sp(tChatA - 4)}>
        <text x={200} y={72} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={32} fill="#2A1206">
          Chat
        </text>
        <text x={200} y={124} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={40} fill="#2A1206">
          Sonnet · Haiku
        </text>
      </Bubble>
      <MiniTerm x={70} y={590} w={400} h={300} label="Claude Code" color={A} appear={sp(tLock - 8)} dim={interpolate(frame, [tLock, tLock + 8], [0, 1], cl)}>
        <g transform={`translate(${200 + lockShake} 105)`}>
          <Lock x={0} y={0} s={interpolate(sp(tLock), [0, 1], [0.3, 1.3])} />
        </g>
        <text x={200} y={212} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={30} fill="#F87171" opacity={sp(tLock + 4)}>
          No incluido
        </text>
      </MiniTerm>

      {/* ChatGPT */}
      <Toolbox x={580} color={B} appear={sp(tB - 6)} />
      <Orb id="fr-b" x={670} y={132} r={44} color={B} frame={frame} appear={sp(tB - 6)} look={0.5} happy={0.8} />
      <text x={730} y={150} fontFamily={fonts.sans} fontWeight={900} fontSize={46} fill={B} opacity={interpolate(sp(tB - 6), [0, 0.5], [0, 1], cl)}>
        ChatGPT
      </text>
      <Bubble x={610} y={350} w={400} h={170} color={B} appear={sp(tChatB - 4)} tail="right">
        <text x={200} y={72} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={32} fill="#03251A">
          Chat
        </text>
        <text x={200} y={124} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={44} fill="#03251A">
          GPT-6
        </text>
      </Bubble>
      <MiniTerm x={610} y={590} w={400} h={300} label="Codex" color={B} appear={sp(tBatt - 8)}>
        <Battery x={90} y={80} w={210} h={90} level={battLevel} color={B} />
        <text x={200} y={212} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={30} fill="#FACC15" opacity={sp(tBatt + 8)}>
          Uso limitado
        </text>
      </MiniTerm>
    </svg>
  );
};
