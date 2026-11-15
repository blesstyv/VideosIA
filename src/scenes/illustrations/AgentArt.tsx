/**
 * Qué es un agente de código: el asistente recorre el proyecto (lee), modifica un archivo
 * (edita) y lanza las pruebas en la terminal (ejecuta). Recreación genérica.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useCueLookup } from "../../lib/anim";
import { fonts, sides } from "../../theme";
import { CheckBadge, FileIcon, FolderIcon, Orb, typed, Win } from "./parts";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const A = sides.a.main;

const TREE = [
  { depth: 0, name: "mi-proyecto", folder: true },
  { depth: 1, name: "src", folder: true },
  { depth: 2, name: "app.js" },
  { depth: 2, name: "form.js", target: true },
  { depth: 1, name: "tests", folder: true },
  { depth: 2, name: "form.test.js" },
  { depth: 1, name: "package.json" },
];

const CODE = [
  { t: "function validar(f) {" },
  { t: "  if (!esEmail(f.email))", add: true },
  { t: '    return "Email no válido";', add: true },
  { t: "  return null;" },
  { t: "}" },
];

export const AgentArt: React.FC<{ beats: Record<string, string> }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = useCueLookup();
  const tRead = cue(beats.read, 60);
  const tEdit = cue(beats.edit, tRead + 25);
  const tRun = cue(beats.run, tEdit + 25);
  const sp = (t: number, damping = 14) => spring({ frame: frame - t, fps, config: { damping, mass: 0.7 } });

  // Fases de los pasos
  const steps = [
    { n: 1, label: "Lee", t: tRead },
    { n: 2, label: "Edita", t: tEdit },
    { n: 3, label: "Ejecuta", t: tRun },
  ];

  // Ventanas
  const inTree = sp(4);
  const inEditor = sp(tEdit - 8);
  const inTerm = sp(tRun - 8);

  // El asistente viaja: arriba -> árbol -> editor -> terminal
  const ox = interpolate(frame, [0, tRead - 6, tRead + 4, tEdit - 6, tEdit + 4, tRun - 6, tRun + 4], [540, 540, 520, 520, 1010, 1010, 770], cl);
  const oy = interpolate(frame, [0, tRead - 6, tRead + 4, tEdit - 6, tEdit + 4, tRun - 6, tRun + 4], [260, 260, 450, 450, 670, 670, 820], cl);
  const look = interpolate(frame, [tRead, tEdit - 6, tEdit + 4, tRun - 6, tRun + 4], [-1, -1, -0.6, -0.6, 1], cl);

  // Lectura: barrido por las filas del árbol hasta quedarse en form.js
  const rowH = 46;
  const scan = interpolate(frame, [tRead, tRead + 22, tRead + 30], [0, TREE.length - 1, 3], cl);
  const scanOn = frame >= tRead;

  // Edición: líneas añadidas se escriben
  const codeStart = tEdit + 4;
  // Ejecución
  const cmd = typed("npm test", frame, tRun + 2, 0.7);
  const passAt = tRun + 22;
  const pass = sp(passAt, 10);

  const title = sp(0, 16);

  return (
    <svg viewBox="0 0 1080 980" width={1080} height={980} style={{ overflow: "visible" }}>
      {/* Título */}
      <g opacity={title} transform={`translate(0 ${interpolate(title, [0, 1], [-20, 0])})`}>
        <text x={540} y={70} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={66} fill="#F8FAFC">
          ¿Qué es un <tspan fill={A}>agente</tspan>?
        </text>
      </g>
      {/* Pasos */}
      {steps.map((s, i) => {
        const on = interpolate(frame, [s.t - 2, s.t + 6], [0, 1], cl);
        const x = 200 + i * 340;
        return (
          <g key={s.n} transform={`translate(${x} 150) scale(${1 + on * 0.06})`}>
            <rect x={-150} y={-34} width={300} height={68} rx={36} fill={on > 0.5 ? A : "rgba(3,6,16,0.75)"} stroke={A} strokeWidth={4} strokeOpacity={0.4 + on * 0.6} />
            <text y={15} textAnchor="middle" fontFamily={fonts.sans} fontWeight={900} fontSize={36} fill={on > 0.5 ? "#2A1206" : "#A5B4CC"}>
              {s.n}. {s.label}
            </text>
          </g>
        );
      })}

      {/* Árbol de archivos */}
      <Win x={30} y={220} w={410} h={420} title="mi-proyecto" appear={inTree} accent={A} active={interpolate(frame, [tRead, tRead + 6, tEdit, tEdit + 6], [0, 1, 1, 0], cl)}>
        {scanOn ? (
          <rect x={10} y={84 + scan * rowH} width={390} height={42} rx={10} fill={A} opacity={frame > tRead + 30 ? 0.3 : 0.2} />
        ) : null}
        {TREE.map((r, i) => {
          const x = 26 + r.depth * 36;
          const y = 88 + i * rowH;
          const hit = r.target && frame > tRead + 30;
          return (
            <g key={r.name}>
              {r.folder ? <FolderIcon x={x} y={y + 4} /> : <FileIcon x={x + 4} y={y + 2} color={hit ? A : "#A5B4CC"} />}
              <text x={x + 46} y={y + 28} fontFamily={fonts.mono} fontWeight={700} fontSize={27} fill={hit ? A : "#E2E8F0"}>
                {r.name}
              </text>
            </g>
          );
        })}
      </Win>

      {/* Editor */}
      <Win x={470} y={220} w={580} h={420} title="form.js" appear={inEditor} accent={A} active={interpolate(frame, [tEdit, tEdit + 6, tRun, tRun + 6], [0, 1, 1, 0], cl)}>
        {(() => {
          let added = 0;
          return CODE.map((l, i) => {
            const y = 120 + i * 58;
            let text = l.t;
            if (l.add) {
              text = typed(l.t, frame, codeStart + added * 14, 2.2);
              added++;
            }
            return (
              <g key={i}>
                {l.add && text.length > 0 ? <rect x={8} y={y - 38} width={564} height={52} rx={8} fill="rgba(74,222,128,0.16)" /> : null}
                <text x={20} y={y} fontFamily={fonts.mono} fontWeight={700} fontSize={25} fill="#64748B">
                  {l.add ? "+" : i + 1}
                </text>
                <text x={56} y={y} xmlSpace="preserve" fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={l.add ? "#86EFAC" : "#CBD5E1"}>
                  {text}
                </text>
              </g>
            );
          });
        })()}
      </Win>

      {/* Terminal */}
      <Win x={30} y={700} w={1020} h={230} title="terminal" appear={inTerm} accent={A} active={interpolate(frame, [tRun, tRun + 6], [0, 1], cl)}>
        <text x={34} y={125} xmlSpace="preserve" fontFamily={fonts.mono} fontWeight={700} fontSize={34} fill="#E2E8F0">
          <tspan fill={A}>$ </tspan>
          {cmd}
          {frame < passAt && Math.floor(frame / 8) % 2 === 0 ? "▌" : ""}
        </text>
        <text x={34} y={188} fontFamily={fonts.mono} fontWeight={700} fontSize={34} fill="#4ADE80" opacity={interpolate(pass, [0, 0.3], [0, 1], cl)}>
          ✓ 12 pruebas superadas
        </text>
      </Win>
      <CheckBadge x={940} y={815} r={58} appear={pass} />

      {/* Asistente */}
      <Orb id="ag-a" x={ox} y={oy} r={48} color={A} frame={frame} appear={sp(0, 12)} look={look} happy={interpolate(pass, [0, 1], [0.3, 1])} />
    </svg>
  );
};
