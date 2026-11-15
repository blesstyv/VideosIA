import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { colors, fonts, layout } from "../theme";

/** Cada cuánto cambia la "página" (bajo = pocas palabras, estilo TikTok). */
const SWITCH_EVERY_MS = 800;

const Page: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = page.startMs + (frame / fps) * 1000;
  const enter = spring({ frame, fps, config: { damping: 13, mass: 0.5 } });
  return (
    <AbsoluteFill
      style={{
        top: layout.captionsTop,
        height: layout.captionsHeight,
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${layout.side}px`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 76,
          lineHeight: 1.12,
          letterSpacing: -1,
          textAlign: "center",
          color: colors.text,
          // Palabras como elementos flex con separación fija (los espacios iniciales
          // dentro de inline-block se perdían: "aCodex").
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "0.36em",
          maxWidth: 940,
          textShadow: "0 6px 0 rgba(0,0,0,0.75), 0 0 24px rgba(0,0,0,0.6)",
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          scale: interpolate(enter, [0, 1], [0.8, 1]),
          opacity: interpolate(frame, [0, 2], [0, 1], clamp),
        }}
      >
        {page.tokens.map((tok, i) => {
          const active = tok.fromMs <= t && tok.toMs > t;
          return (
            <span
              key={`${tok.fromMs}-${i}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                color: active ? "#FFE14D" : colors.text,
                scale: active ? 1.08 : 1,
              }}
            >
              {tok.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: SWITCH_EVERY_MS }),
    [captions],
  );
  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const start = Math.round((page.startMs / 1000) * fps);
        const lastTokenEnd = page.tokens[page.tokens.length - 1]?.toMs ?? page.startMs + page.durationMs;
        const endMs = next ? Math.min(next.startMs, lastTokenEnd + 500) : lastTokenEnd + 300;
        const end = Math.round((endMs / 1000) * fps);
        if (end - start <= 0) return null;
        return (
          <Sequence key={i} from={start} durationInFrames={end - start} layout="none" name={`Subtítulo ${i + 1}`}>
            <Page page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
