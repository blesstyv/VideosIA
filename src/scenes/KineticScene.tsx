import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, useEnter, useSceneWords } from "../lib/anim";
import { normalizeWord, type Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "kinetic" }>;
const SIZES = { xl: 124, lg: 100, md: 76 } as const;

/** Frame de aparición de cada palabra en pantalla, sincronizado con la voz cuando coincide. */
export const revealFrames = (display: string[], spoken: { text: string; frame: number }[]) => {
  const out: number[] = [];
  let p = 0;
  let last = 2;
  for (const w of display) {
    const n = normalizeWord(w);
    let found = -1;
    for (let k = p; k < Math.min(spoken.length, p + 6); k++)
      if (normalizeWord(spoken[k].text) === n) {
        found = k;
        break;
      }
    if (found >= 0) {
      last = Math.max(last, spoken[found].frame);
      p = found + 1;
    } else last += 4;
    out.push(last);
  }
  return out;
};

export const KineticScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spoken = useSceneWords();
  const words = visual.text.split(/\s+/);
  const at = revealFrames(words, spoken);
  const emph = new Set(visual.emphasis.map(normalizeWord));
  const eyebrow = useEnter(0);
  const size = SIZES[visual.size];
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
      {visual.eyebrow ? (
        <div
          style={{
            alignSelf: "flex-start",
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: colors.cyan,
            opacity: eyebrow,
            translate: `${interpolate(eyebrow, [0, 1], [-40, 0])}px 0px`,
          }}
        >
          {visual.eyebrow}
        </div>
      ) : null}
      <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: -3, color: colors.text }}>
        {words.map((w, i) => {
          const p = spring({ frame: frame - at[i], fps, config: { damping: 12, mass: 0.55 } });
          const isEmph = emph.has(normalizeWord(w));
          const bar = interpolate(frame - at[i], [3, 12], [0, 1], clamp);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                marginRight: "0.24em",
                opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
                scale: interpolate(p, [0, 1], [0.55, 1]),
                translate: `0px ${interpolate(p, [0, 1], [50, 0])}px`,
                color: isEmph ? "#FFE14D" : colors.text,
                textShadow: "0 10px 40px rgba(0,0,0,0.55)",
              }}
            >
              {isEmph ? (
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    right: -6,
                    bottom: "0.08em",
                    height: "0.22em",
                    background: "rgba(255,225,77,0.28)",
                    borderRadius: 8,
                    transformOrigin: "left",
                    scale: `${bar} 1`,
                    zIndex: -1,
                  }}
                />
              ) : null}
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
