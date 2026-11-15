/**
 * Gancho: un programador en su escritorio mira a dos asistentes de IA (naranja = Claude,
 * verde = ChatGPT, sin logotipos) y cae una etiqueta de precio con la gran pregunta.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useCueLookup } from "../../lib/anim";
import { sides, fonts } from "../../theme";
import { Orb } from "./parts";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Label: React.FC<{ x: number; y: number; text: string; color: string; appear: number }> = ({ x, y, text, color, appear }) => {
  const w = text.length * 26 + 70;
  return (
    <g transform={`translate(${x} ${y + interpolate(appear, [0, 1], [24, 0], cl)})`} opacity={interpolate(appear, [0, 0.6], [0, 1], cl)}>
      <rect x={-w / 2} y={-36} width={w} height={72} rx={36} fill="rgba(3,6,16,0.82)" stroke={color} strokeWidth={4} />
      <text y={14} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={42} fill={color}>
        {text}
      </text>
    </g>
  );
};

export const HookArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = useCueLookup();
  const tA = cue(beats.a, 12);
  const tB = cue(beats.b, 40);
  const tPay = cue(beats.pay, 90);
  const sp = (t: number, damping = 12) => spring({ frame: frame - t, fps, config: { damping, mass: 0.7 } });

  const inA = sp(tA - 4);
  const inB = sp(tB - 4);
  const inPay = sp(tPay - 6, 9);
  const intro = sp(0, 16);

  // Mirada del programador: centro -> izquierda -> derecha -> al frente (preocupado)
  const look = interpolate(frame, [tA - 2, tA + 6, tB - 2, tB + 6, tPay - 4, tPay + 4], [0, -1, -1, 1, 1, 0], cl);
  const worry = interpolate(frame, [tPay - 2, tPay + 8], [0, 1], cl);
  const headX = look * 10;

  // Etiqueta de precio que cae y se balancea
  const tagY = interpolate(inPay, [0, 1], [-260, 0]);
  const swing = Math.sin((frame - tPay) / 5) * 14 * Math.exp(-Math.max(0, frame - tPay) / 22) * (frame > tPay - 6 ? 1 : 0);
  const vs = interpolate(frame, [tB + 6, tB + 14, tPay - 8, tPay - 2], [0, 1, 1, 0], cl);

  // Teclado: brillo de pantalla que parpadea suave mientras "programa"
  const glow = 0.55 + Math.sin(frame / 6) * 0.08;
  const steam = (frame % 60) / 60;

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="hk-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <radialGradient id="hk-screen">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="hk-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334166" />
          <stop offset="100%" stopColor="#334166" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Asistentes */}
      <Orb id="hk-a" x={200} y={300} r={92} color={sides.a.main} frame={frame} appear={inA} look={0.6} happy={1} />
      <Label x={200} y={480} text="Claude" color={sides.a.main} appear={inA} />
      <Orb id="hk-b" x={880} y={300} r={92} color={sides.b.main} frame={frame} appear={inB} look={-0.6} happy={1} />
      <Label x={880} y={480} text="ChatGPT" color={sides.b.main} appear={inB} />

      {/* VS */}
      <g opacity={vs} transform={`translate(540 190) scale(${interpolate(vs, [0, 1], [0.6, 1])})`}>
        <circle r={62} fill="rgba(3,6,16,0.85)" stroke="#F8FAFC" strokeWidth={4} />
        <text y={20} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={56} fill="#F8FAFC">
          VS
        </text>
      </g>

      {/* Etiqueta de precio */}
      <g transform={`translate(540 ${70 + tagY}) rotate(${swing})`} opacity={interpolate(inPay, [0, 0.2], [0, 1], cl)}>
        <line x1={0} y1={-70} x2={0} y2={0} stroke="#CBD5E1" strokeWidth={4} />
        <g transform="rotate(-6)">
          <path d="M -150 20 L 110 20 L 170 95 L 110 170 L -150 170 Q -170 170 -170 150 L -170 40 Q -170 20 -150 20 Z" fill="#FACC15" />
          <circle cx={118} cy={95} r={14} fill="#070B16" />
          <text x={-30} y={122} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={88} fill="#1A1405">
            $20
          </text>
          <text x={-30} y={158} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={28} fill="#1A1405">
            AL MES
          </text>
        </g>
      </g>

      {/* Programador */}
      <g transform={`translate(0 ${interpolate(intro, [0, 1], [60, 0])})`} opacity={intro}>
        {/* Cuerpo (sudadera) */}
        <path d="M 330 820 Q 335 640 450 610 L 630 610 Q 745 640 750 820 Z" fill="#3B4A7A" />
        <path d="M 470 612 Q 540 680 610 612" fill="none" stroke="#2C3860" strokeWidth={14} strokeLinecap="round" />
        <line x1={515} y1={640} x2={510} y2={700} stroke="#CBD5E1" strokeWidth={6} strokeLinecap="round" />
        <line x1={565} y1={640} x2={570} y2={700} stroke="#CBD5E1" strokeWidth={6} strokeLinecap="round" />
        <rect x={515} y={575} width={50} height={45} fill="#E2B48C" />

        {/* Cabeza */}
        <g transform={`translate(${headX} 0) rotate(${look * 4} 540 480)`}>
          <circle cx={540} cy={480} r={102} fill="#F2C6A0" />
          <circle cx={540} cy={480} r={102} fill="url(#hk-screen)" opacity={glow * 0.5} />
          <circle cx={438} cy={492} r={20} fill="#E8B48E" />
          <circle cx={642} cy={492} r={20} fill="#E8B48E" />
          {/* Pelo */}
          <path d="M 440 470 Q 430 370 540 365 Q 655 365 642 470 Q 620 420 560 418 Q 500 440 440 470 Z" fill="#2B1B14" />
          {/* Cejas */}
          <path d={`M 488 ${452 - worry * 12} q 22 ${-8 - worry * 6} 40 ${0 + worry * 6}`} stroke="#2B1B14" strokeWidth={9} strokeLinecap="round" fill="none" />
          <path d={`M 552 ${452 - worry * 6} q 18 ${-6 - worry * 8} 40 ${2 - worry * 6}`} stroke="#2B1B14" strokeWidth={9} strokeLinecap="round" fill="none" />
          {/* Ojos */}
          {[508, 572].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={486} rx={17} ry={20} fill="#FFFFFF" />
              <circle cx={ex + look * 8} cy={488 - worry * 3} r={10} fill="#1E293B" />
            </g>
          ))}
          {/* Boca: sonrisa -> "o" */}
          <path
            d={`M 515 ${540} Q 540 ${560 - worry * 20} 565 540`}
            stroke="#8B3A2E"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            opacity={1 - worry}
          />
          <ellipse cx={540} cy={545} rx={13 * worry} ry={16 * worry} fill="#8B3A2E" />
          {/* Gota de sudor */}
          <path
            d="M 640 420 q 14 26 0 34 q -14 -8 0 -34 Z"
            fill="#7DD3FC"
            opacity={worry}
            transform={`translate(0 ${worry * 10})`}
          />
        </g>

        {/* Escritorio */}
        <rect x={120} y={810} width={840} height={30} rx={10} fill="#46557F" />
        <rect x={150} y={840} width={780} height={140} fill="url(#hk-desk)" />

        {/* Laptop (vista trasera) */}
        <path d="M 395 640 L 685 640 Q 700 640 700 655 L 700 800 L 380 800 L 380 655 Q 380 640 395 640 Z" fill="url(#hk-lid)" />
        <circle cx={540} cy={720} r={20} fill="#CBD5E1" />
        <rect x={350} y={798} width={380} height={16} rx={8} fill="#64748B" />

        {/* Taza con vapor */}
        <g transform="translate(210 740)">
          <path d="M 0 0 L 70 0 L 64 70 L 6 70 Z" fill="#FB923C" />
          <path d="M 68 15 q 30 5 0 35" fill="none" stroke="#FB923C" strokeWidth={9} />
          {[0, 1].map((k) => (
            <path
              key={k}
              d={`M ${22 + k * 24} -10 q -12 -20 0 -40 q 12 -20 0 -40`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth={6}
              strokeLinecap="round"
              opacity={interpolate((steam + k * 0.5) % 1, [0, 0.5, 1], [0, 0.6, 0])}
              transform={`translate(0 ${-((steam + k * 0.5) % 1) * 20})`}
            />
          ))}
        </g>
        {/* Planta */}
        <g transform="translate(800 700)">
          <path d="M 0 40 L 80 40 L 70 110 L 10 110 Z" fill="#8B5CF6" />
          <path d="M 40 40 Q 0 -10 10 -50 Q 40 -10 40 40" fill="#22C55E" />
          <path d="M 40 40 Q 80 -20 75 -60 Q 45 -10 40 40" fill="#16A34A" />
          <path d="M 40 40 Q 40 -40 40 -80 Q 55 -30 40 40" fill="#4ADE80" />
        </g>
      </g>
    </svg>
  );
};
