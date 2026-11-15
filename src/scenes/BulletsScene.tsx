import React from "react";
import { AbsoluteFill } from "remotion";
import { fadeUp, useCueLookup, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "bullets" }>;
const ACCENTS = [colors.green, colors.cyan, colors.gold, colors.purple];

const Item: React.FC<{ text: string; index: number; at: number }> = ({ text, index, at }) => {
  const p = useEnter(at);
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        padding: "30px 34px",
        borderRadius: 28,
        background: colors.panel,
        border: `3px solid ${colors.border}`,
        borderLeft: `12px solid ${accent}`,
        ...fadeUp(p, 60),
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: 76,
          height: 76,
          borderRadius: 18,
          background: accent,
          color: "#06120A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 44,
        }}
      >
        {index + 1}
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 50, lineHeight: 1.18, color: colors.text }}>{text}</div>
    </div>
  );
};

export const BulletsScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const head = useEnter(0);
  const cue = useCueLookup();
  const ats = visual.items.map((it, i) => cue(it.atWord, 8 + i * 14));
  return (
    <AbsoluteFill
      style={{
        top: layout.contentTop,
        height: layout.contentBottom - layout.contentTop,
        justifyContent: "center",
        padding: `0 ${layout.side}px`,
        gap: 30,
      }}
    >
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 84, color: colors.text, marginBottom: 14, letterSpacing: -1, ...fadeUp(head) }}>
        {visual.heading}
      </div>
      {visual.items.map((it, i) => (
        <Item key={i} text={it.text} index={i} at={ats[i]} />
      ))}
    </AbsoluteFill>
  );
};
