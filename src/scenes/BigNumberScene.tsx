import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, useCue } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "bignumber" }>;

export const BigNumberScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = useCue(visual.atWord, 4);
  const p = spring({ frame: frame - at, fps, config: { damping: 10, mass: 0.6 } });
  const n = interpolate(frame - at, [0, 16], [0, visual.value], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const ring = interpolate(frame - at, [0, 24], [0, 1], clamp);
  const label = spring({ frame: frame - at - 8, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          border: "6px solid rgba(255,225,77,0.6)",
          scale: interpolate(ring, [0, 1], [0.3, 1.2]),
          opacity: interpolate(ring, [0, 0.2, 1], [0, 0.8, 0]),
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          fontFamily: fonts.sans,
          fontWeight: 900,
          letterSpacing: -12,
          scale: interpolate(p, [0, 1], [0.4, 1]),
          opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        }}
      >
        <span style={{ fontSize: 150, color: "#FFE14D", marginRight: 10 }}>{visual.prefix}</span>
        <span
          style={{
            fontSize: 340,
            lineHeight: 1,
            backgroundImage: "linear-gradient(180deg, #FFFFFF 20%, #FFE14D 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(n)}
        </span>
        <span style={{ fontSize: 80, color: colors.muted, letterSpacing: 0, marginLeft: 16 }}>{visual.suffix}</span>
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 54,
          color: colors.text,
          textAlign: "center",
          padding: `0 ${layout.side}px`,
          opacity: label,
          translate: `0px ${interpolate(label, [0, 1], [30, 0])}px`,
        }}
      >
        {visual.label}
      </div>
    </AbsoluteFill>
  );
};
