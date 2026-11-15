/**
 * Piezas reutilizables para las ilustraciones animadas (SVG).
 * Estilo plano con degradados suaves; sin logotipos de marca.
 */
import React from "react";
import { interpolate } from "remotion";
import { fonts } from "../../theme";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Asistente de IA: orbe con cara amable. `look` (-1..1) mueve la mirada en horizontal.
 * `appear` (0..1) controla la entrada. Parpadea según `frame`.
 */
export const Orb: React.FC<{
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  frame: number;
  appear: number;
  look?: number;
  lookY?: number;
  happy?: number;
}> = ({ id, x, y, r, color, frame, appear, look = 0, lookY = 0, happy = 0 }) => {
  const bob = Math.sin(frame / 14 + x) * r * 0.06;
  const blinkPhase = (frame + Math.round(x)) % 95;
  const blink = blinkPhase < 5 ? interpolate(blinkPhase, [0, 2, 5], [1, 0.1, 1], cl) : 1;
  const s = interpolate(appear, [0, 1], [0.2, 1], cl);
  const eyeW = r * 0.2;
  const eyeH = r * 0.32 * blink;
  const ex = look * r * 0.16;
  const ey = lookY * r * 0.1;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`} opacity={interpolate(appear, [0, 0.4], [0, 1], cl)}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="25%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity={0.75} />
        </radialGradient>
      </defs>
      <circle r={r * 1.9} fill={`url(#${id}-glow)`} />
      {/* Anillo orbital */}
      <ellipse
        rx={r * 1.35}
        ry={r * 0.38}
        fill="none"
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={r * 0.05}
        transform={`rotate(${-18 + Math.sin(frame / 30) * 6})`}
      />
      <circle r={r} fill={`url(#${id}-body)`} />
      <circle r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={r * 0.04} />
      {/* Cara */}
      <rect x={-r * 0.36 + ex - eyeW / 2} y={-r * 0.12 + ey - eyeH / 2} width={eyeW} height={eyeH} rx={eyeW / 2} fill="#0B1020" />
      <rect x={r * 0.36 + ex - eyeW / 2} y={-r * 0.12 + ey - eyeH / 2} width={eyeW} height={eyeH} rx={eyeW / 2} fill="#0B1020" />
      <path
        d={`M ${-r * 0.22 + ex} ${r * 0.24 + ey} Q ${ex} ${r * (0.32 + 0.14 * happy) + ey} ${r * 0.22 + ex} ${r * 0.24 + ey}`}
        stroke="#0B1020"
        strokeWidth={r * 0.07}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

/** Ventana de aplicación genérica con barra de título. */
export const Win: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  appear: number;
  accent?: string;
  active?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, appear, accent = "#8B9CFF", active = 0, children }) => (
  <g
    transform={`translate(${x} ${y + interpolate(appear, [0, 1], [40, 0], cl)})`}
    opacity={interpolate(appear, [0, 0.5], [0, 1], cl)}
  >
    <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={30} fill={accent} opacity={0.35 * active} />
    <rect width={w} height={h} rx={24} fill="#0E1528" stroke="rgba(148,163,184,0.35)" strokeWidth={3} />
    <path d={`M 0 24 Q 0 0 24 0 L ${w - 24} 0 Q ${w} 0 ${w} 24 L ${w} 62 L 0 62 Z`} fill="#1A2440" />
    {["#F87171", "#FACC15", "#4ADE80"].map((c, i) => (
      <circle key={c} cx={34 + i * 30} cy={31} r={9} fill={c} />
    ))}
    <text x={w / 2 - title.length * 8 > 120 ? w / 2 : 128} y={42} textAnchor={w / 2 - title.length * 8 > 120 ? "middle" : "start"} fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill="#A5B4CC">
      {title}
    </text>
    {children}
  </g>
);

export const FolderIcon: React.FC<{ x: number; y: number; color?: string }> = ({ x, y, color = "#FACC15" }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 4 Q0 0 4 0 L13 0 L17 5 L30 5 Q34 5 34 9 L34 24 Q34 28 30 28 L4 28 Q0 28 0 24 Z" fill={color} />
  </g>
);

export const FileIcon: React.FC<{ x: number; y: number; color?: string }> = ({ x, y, color = "#A5B4CC" }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 3 Q0 0 3 0 L18 0 L26 8 L26 29 Q26 32 23 32 L3 32 Q0 32 0 29 Z" fill={color} />
    <path d="M18 0 L18 8 L26 8" fill="rgba(0,0,0,0.25)" />
  </g>
);

/** Insignia circular con un check. */
export const CheckBadge: React.FC<{ x: number; y: number; r: number; appear: number; color?: string }> = ({
  x,
  y,
  r,
  appear,
  color = "#4ADE80",
}) => {
  const s = interpolate(appear, [0, 1], [0, 1], cl);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r * 1.5} fill={color} opacity={0.18} />
      <circle r={r} fill={color} />
      <path
        d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.35} L ${r * 0.5} ${-r * 0.35}`}
        stroke="#05210F"
        strokeWidth={r * 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
};

/** Texto que se escribe letra a letra: devuelve el prefijo visible. */
export const typed = (text: string, frame: number, start: number, charsPerFrame = 1.6) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * charsPerFrame)));

/** Candado; `open` (0..1) levanta el arco. */
export const Lock: React.FC<{ x: number; y: number; s?: number; open?: number; color?: string }> = ({
  x,
  y,
  s = 1,
  open = 0,
  color = "#FACC15",
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M -22 0 L -22 -22 Q -22 -46 0 -46 Q 22 -46 22 -22 L 22 0"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth={10}
      transform={`translate(${open * 10} ${-open * 18}) rotate(${-open * 25} 22 0)`}
    />
    <rect x={-36} y={-4} width={72} height={58} rx={12} fill={color} />
    <circle cx={0} cy={20} r={8} fill="#1A1405" />
    <rect x={-3} y={22} width={6} height={16} rx={3} fill="#1A1405" />
  </g>
);

/** Batería horizontal con nivel 0..1. */
export const Battery: React.FC<{ x: number; y: number; w: number; h: number; level: number; color: string }> = ({
  x,
  y,
  w,
  h,
  level,
  color,
}) => {
  const lv = Math.max(0, Math.min(1, level));
  const c = lv < 0.3 ? "#F87171" : color;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={h * 0.22} fill="rgba(3,6,16,0.6)" stroke="#CBD5E1" strokeWidth={6} />
      <rect x={w} y={h * 0.3} width={14} height={h * 0.4} rx={4} fill="#CBD5E1" />
      <rect x={10} y={10} width={(w - 20) * lv} height={h - 20} rx={h * 0.14} fill={c} />
    </g>
  );
};

export const Coin: React.FC<{ x: number; y: number; r: number; label?: string }> = ({ x, y, r, label = "$" }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#EAB308" />
    <circle r={r * 0.8} fill="#FACC15" stroke="#CA8A04" strokeWidth={r * 0.06} />
    <text y={r * 0.32} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={r * 0.9} fill="#713F12">
      {label}
    </text>
  </g>
);

/** Burbuja de chat con texto centrado. */
export const Bubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  appear: number;
  children: React.ReactNode;
  tail?: "left" | "right";
}> = ({ x, y, w, h, color, appear, children, tail = "left" }) => (
  <g
    transform={`translate(${x + w / 2} ${y + h / 2}) scale(${interpolate(appear, [0, 1], [0.5, 1], cl)}) translate(${-w / 2} ${-h / 2})`}
    opacity={interpolate(appear, [0, 0.4], [0, 1], cl)}
  >
    <rect width={w} height={h} rx={h * 0.32} fill={color} />
    <path d={tail === "left" ? `M 30 ${h - 4} L 10 ${h + 26} L 70 ${h - 4} Z` : `M ${w - 30} ${h - 4} L ${w - 10} ${h + 26} L ${w - 70} ${h - 4} Z`} fill={color} />
    {children}
  </g>
);

/** Pequeña ventana de terminal con un título (p. ej. «Claude Code»). */
export const MiniTerm: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  appear: number;
  dim?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, label, color, appear, dim = 0, children }) => (
  <g transform={`translate(${x} ${y + interpolate(appear, [0, 1], [30, 0], cl)})`} opacity={interpolate(appear, [0, 0.5], [0, 1], cl)}>
    <rect width={w} height={h} rx={22} fill="#0E1528" stroke={color} strokeOpacity={0.7} strokeWidth={4} />
    <text x={28} y={62} fontFamily={fonts.mono} fontWeight={700} fontSize={40} fill={color} opacity={1 - dim * 0.6}>
      {">_"}
    </text>
    <text x={w / 2} y={h - 30} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={38} fill="#F8FAFC" opacity={1 - dim * 0.5}>
      {label}
    </text>
    {children}
  </g>
);

/** Píldora de texto. */
export const Pill: React.FC<{
  x: number;
  y: number;
  text: string;
  color: string;
  appear: number;
  size?: number;
  solid?: boolean;
}> = ({ x, y, text, color, appear, size = 38, solid = false }) => {
  const w = text.length * size * 0.6 + size * 1.6;
  const h = size * 1.75;
  return (
    <g transform={`translate(${x} ${y}) scale(${interpolate(appear, [0, 1], [0.6, 1], cl)})`} opacity={interpolate(appear, [0, 0.4], [0, 1], cl)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(3,6,16,0.82)"} stroke={color} strokeWidth={4} />
      <text y={size * 0.36} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={size} fill={solid ? "#0B1020" : color}>
        {text}
      </text>
    </g>
  );
};
