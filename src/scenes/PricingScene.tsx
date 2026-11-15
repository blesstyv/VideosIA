import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fadeUp, useCueLookup, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout, sides } from "../theme";

type Props = Extract<Visual, { type: "pricing" }>;
type Plan = Props["plans"][number];

const Card: React.FC<{ plan: Plan; at: number; compact: boolean }> = ({ plan, at, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 13, mass: 0.6 } });
  const count = interpolate(frame - at, [2, 20], [0, plan.price], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const s = sides[plan.side];
  return (
    <div
      style={{
        flex: "1 1 45%",
        padding: compact ? "26px 28px" : "36px 32px",
        borderRadius: 32,
        background: plan.highlight ? `linear-gradient(160deg, ${s.soft}, rgba(15,23,42,0.92) 60%)` : "rgba(15,23,42,0.88)",
        border: `3px solid ${plan.highlight ? s.main : colors.border}`,
        boxShadow: plan.highlight ? `0 20px 60px ${s.soft}` : "0 20px 50px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 14,
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        scale: interpolate(p, [0, 1], [0.8, 1]),
        translate: `0px ${interpolate(p, [0, 1], [60, 0])}px`,
      }}
    >
      <div style={{ alignSelf: "flex-start", padding: "6px 16px", borderRadius: 999, background: s.main, color: s.ink, fontFamily: fonts.sans, fontWeight: 900, fontSize: 26 }}>
        {plan.brand}
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: compact ? 44 : 54, color: colors.text }}>{plan.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: fonts.sans, color: colors.text }}>
        {plan.from ? <span style={{ fontSize: 30, fontWeight: 700, color: colors.muted, marginRight: 6 }}>desde</span> : null}
        <span style={{ fontSize: compact ? 44 : 56, fontWeight: 800 }}>{plan.prefix}</span>
        <span style={{ fontSize: compact ? 96 : 124, fontWeight: 900, letterSpacing: -4, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(count)}
        </span>
        <span style={{ fontSize: 32, fontWeight: 700, color: colors.muted }}>{plan.period}</span>
      </div>
      {plan.note ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: compact ? 30 : 34, lineHeight: 1.2, color: plan.highlight ? s.main : colors.muted }}>{plan.note}</div>
      ) : null}
    </div>
  );
};

export const PricingScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const head = useEnter(0);
  const cue = useCueLookup();
  // 2+ planes en fila (tarjetas compactas); 1 plan, tarjeta grande.
  const compact = visual.plans.length > 1;
  const foot = useEnter(24);
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, padding: `0 ${layout.side - 30}px`, justifyContent: "center", gap: 28 }}>
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 72, color: colors.text, textAlign: "center", letterSpacing: -1, ...fadeUp(head) }}>{visual.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, flexDirection: "row" }}>
        {visual.plans.map((pl, i) => (
          <Card key={i} plan={pl} at={cue(pl.atWord, 8 + i * 14)} compact={compact} />
        ))}
      </div>
      {visual.footnote ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 28, color: colors.muted, textAlign: "center", opacity: foot }}>{visual.footnote}</div>
      ) : null}
    </AbsoluteFill>
  );
};
