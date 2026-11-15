import React from "react";
import { AbsoluteFill } from "remotion";
import { fadeUp, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "title" }>;

const Word: React.FC<{ word: string; index: number; accent: boolean }> = ({ word, index, accent }) => {
  const p = useEnter(6 + index * 3);
  return (
    <span style={{ display: "inline-block", marginRight: "0.25em", color: accent ? colors.green : colors.text, ...fadeUp(p, 50) }}>
      {word}
    </span>
  );
};

export const TitleScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const kicker = useEnter(0);
  const sub = useEnter(16);
  // Las palabras marcadas con *asteriscos* se resaltan; la puntuación pegada se conserva.
  const words = visual.title.split(/\s+/).map((w) => {
    const m = w.match(/^(.*?)\*(.+?)\*(.*)$/);
    return m ? { text: `${m[1]}${m[2]}${m[3]}`, accent: true } : { text: w, accent: false };
  });
  return (
    <AbsoluteFill
      style={{
        top: layout.contentTop,
        height: layout.contentBottom - layout.contentTop,
        justifyContent: "center",
        padding: `0 ${layout.side}px`,
        gap: 36,
      }}
    >
      {visual.kicker ? (
        <div
          style={{
            alignSelf: "flex-start",
            padding: "12px 26px",
            borderRadius: 14,
            background: colors.gold,
            color: "#1A1300",
            fontFamily: fonts.sans,
            fontWeight: 900,
            fontSize: 38,
            ...fadeUp(kicker),
          }}
        >
          {visual.kicker}
        </div>
      ) : null}
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 106, lineHeight: 1.05, letterSpacing: -2, textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
        {words.map((w, i) => (
          <Word key={i} index={i} word={w.text} accent={w.accent} />
        ))}
      </div>
      {visual.subtitle ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 48, color: colors.muted, lineHeight: 1.25, ...fadeUp(sub) }}>
          {visual.subtitle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
