import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fadeUp, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "outro" }>;

const Point: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const p = useEnter(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, ...fadeUp(p, 40) }}>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: colors.green,
          color: "#052E16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 40,
        }}
      >
        ✓
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 48, color: colors.text }}>{text}</div>
    </div>
  );
};

export const OutroScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const ctaAt = 14 + visual.points.length * 10;
  const cta = useEnter(ctaAt);
  return (
    <AbsoluteFill
      style={{
        top: layout.contentTop,
        height: layout.contentBottom - layout.contentTop,
        justifyContent: "center",
        padding: `0 ${layout.side}px`,
        gap: 40,
      }}
    >
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 88, lineHeight: 1.08, color: colors.text, letterSpacing: -1, ...fadeUp(title) }}>
        {visual.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {visual.points.map((p, i) => (
          <Point key={i} text={p} delay={10 + i * 10} />
        ))}
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          marginTop: 20,
          padding: "24px 44px",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan})`,
          color: "#03150B",
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 50,
          ...fadeUp(cta, 40),
          scale: 1 + 0.03 * Math.sin(Math.max(0, frame - ctaAt) / 6) * interpolate(cta, [0, 1], [0, 1]),
        }}
      >
        {visual.cta}
      </div>
    </AbsoluteFill>
  );
};
