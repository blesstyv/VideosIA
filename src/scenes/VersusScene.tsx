import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fadeUp, useCueLookup, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout, sides } from "../theme";

type Props = Extract<Visual, { type: "versus" }>;
type Row = Props["rows"][number];

const Cell: React.FC<{ text: string; side: "a" | "b"; win: boolean; p: number; from: number }> = ({ text, side, win, p, from }) => (
  <div
    style={{
      flex: 1,
      minHeight: 150,
      padding: "22px 24px",
      borderRadius: 26,
      background: win ? sides[side].soft : "rgba(15,23,42,0.85)",
      border: `3px solid ${win ? sides[side].main : colors.border}`,
      boxShadow: win ? `0 0 40px ${sides[side].soft}` : "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 8,
      opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
      translate: `${interpolate(p, [0, 1], [from, 0])}px 0px`,
    }}
  >
    <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 38, lineHeight: 1.15, color: colors.text }}>{text}</div>
    {win ? (
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 26, letterSpacing: 2, color: sides[side].main }}>✓ VENTAJA</div>
    ) : null}
  </div>
);

const RowView: React.FC<{ row: Row; at: number }> = ({ row, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 15, mass: 0.6 } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          alignSelf: "center",
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: colors.muted,
          opacity: p,
        }}
      >
        {row.label}
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <Cell text={row.left} side="a" win={row.edge === "left" || row.edge === "tie"} p={p} from={-120} />
        <Cell text={row.right} side="b" win={row.edge === "right" || row.edge === "tie"} p={p} from={120} />
      </div>
    </div>
  );
};

export const VersusScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const head = useEnter(0);
  const cue = useCueLookup();
  const frame = useCurrentFrame();
  const vs = interpolate(frame, [4, 12], [3, 1], { ...clamp });
  const foot = useEnter(30);
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, padding: `0 ${layout.side - 30}px`, justifyContent: "center", gap: 26 }}>
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 70, color: colors.text, textAlign: "center", letterSpacing: -1, ...fadeUp(head) }}>
        {visual.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {(["a", "b"] as const).map((s, i) => (
          <React.Fragment key={s}>
            {i === 1 ? (
              <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 46, color: colors.text, scale: vs, opacity: interpolate(vs, [1, 3], [1, 0]) }}>VS</div>
            ) : null}
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "16px 10px",
                borderRadius: 20,
                background: sides[s].main,
                color: sides[s].ink,
                fontFamily: fonts.sans,
                fontWeight: 900,
                fontSize: 50,
                ...fadeUp(head, 30),
              }}
            >
              {s === "a" ? visual.left : visual.right}
            </div>
          </React.Fragment>
        ))}
      </div>
      {visual.rows.map((r, i) => (
        <RowView key={i} row={r} at={cue(r.atWord, 10 + i * 24)} />
      ))}
      {visual.footnote ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 28, color: colors.muted, textAlign: "center", opacity: foot }}>{visual.footnote}</div>
      ) : null}
    </AbsoluteFill>
  );
};
