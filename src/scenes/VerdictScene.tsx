import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fadeUp, useCueLookup, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "verdict" }>;
const ACCENTS = ["#22D3EE", "#FFE14D", "#FF8A5B"];

const Item: React.FC<{ item: Props["items"][number]; at: number; i: number }> = ({ item, at, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, mass: 0.6 } });
  const accent = ACCENTS[i % ACCENTS.length];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "26px 32px",
        borderRadius: 28,
        background: "rgba(15,23,42,0.9)",
        border: `3px solid ${colors.border}`,
        borderLeft: `14px solid ${accent}`,
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        translate: `${interpolate(p, [0, 1], [i % 2 ? 140 : -140, 0])}px 0px`,
      }}
    >
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 32, letterSpacing: 2, textTransform: "uppercase", color: colors.muted }}>{item.profile}</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 58, color: accent, letterSpacing: -1 }}>→ {item.pick}</div>
    </div>
  );
};

export const VerdictScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const head = useEnter(0);
  const cue = useCueLookup();
  const foot = useEnter(30);
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, padding: `0 ${layout.side - 20}px`, justifyContent: "center", gap: 24 }}>
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 84, color: colors.text, letterSpacing: -2, ...fadeUp(head) }}>{visual.title}</div>
      {visual.items.map((it, i) => (
        <Item key={i} item={it} i={i} at={cue(it.atWord, 10 + i * 20)} />
      ))}
      {visual.footnote ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 28, color: colors.muted, opacity: foot }}>{visual.footnote}</div>
      ) : null}
    </AbsoluteFill>
  );
};
