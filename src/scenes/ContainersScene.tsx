import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CHEST_MAP, CHEST_PALETTE, GEM_MAP, GEM_PALETTE, PixelSprite } from "../components/PixelArt";
import { clamp, fadeUp, useCue, useCueLookup, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "containers" }>;
type Update = Props["updates"][number] & { at: number };

const Container: React.FC<{
  label: string;
  initial: string;
  showGems: boolean;
  updates: Update[];
  scale: number;
  delay: number;
}> = ({ label, initial, showGems, updates, scale, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(delay);
  const applied = updates.filter((u) => frame >= u.at);
  const last = applied[applied.length - 1];
  const value = last ? last.value : initial;
  const pop = last ? spring({ frame: frame - last.at, fps, config: { damping: 9, mass: 0.6 } }) : 1;
  const numeric = Number(value);
  const gems = showGems && Number.isInteger(numeric) ? Math.max(0, Math.min(12, numeric)) : 0;
  const prevNumeric = (() => {
    const prev = applied.length > 1 ? applied[applied.length - 2].value : initial;
    return Number.isInteger(Number(prev)) ? Number(prev) : 0;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * scale, ...fadeUp(enter, 60) }}>
      {/* Etiqueta = nombre de la variable */}
      <div
        style={{
          padding: `${14 * scale}px ${30 * scale}px`,
          borderRadius: 16,
          background: "#F5E6C8",
          border: "5px solid #6B4118",
          color: "#2B1A0B",
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 54 * scale,
          boxShadow: "0 8px 0 #2B1A0B",
        }}
      >
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <PixelSprite map={CHEST_MAP} palette={CHEST_PALETTE} pixel={26 * scale} style={{ filter: "drop-shadow(0 18px 0 rgba(0,0,0,0.35))" }} />
        {last?.delta ? (
          <div
            style={{
              position: "absolute",
              right: -40 * scale,
              top: -20,
              fontFamily: fonts.sans,
              fontWeight: 900,
              fontSize: 80 * scale,
              color: colors.green,
              textShadow: "0 6px 0 rgba(0,0,0,0.5)",
              opacity: interpolate(frame - last.at, [0, 6, 40, 55], [0, 1, 1, 0], clamp),
              translate: `0px ${interpolate(frame - last.at, [0, 55], [40, -70], clamp)}px`,
            }}
          >
            {last.delta}
          </div>
        ) : null}
      </div>
      {/* Valor guardado */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: `${10 * scale}px ${40 * scale}px`,
          borderRadius: 26,
          background: colors.panel,
          border: `4px solid ${colors.cyan}`,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 110 * scale,
          color: colors.text,
          scale: interpolate(pop, [0, 1], [1.35, 1]),
        }}
      >
        <span style={{ color: colors.muted, fontSize: 64 * scale }}>valor</span>
        {value}
      </div>
      {gems > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, maxWidth: 700 * scale }}>
          {Array.from({ length: gems }, (_, i) => {
            const isNew = last && i >= prevNumeric;
            const p = isNew ? spring({ frame: frame - last.at - (i - prevNumeric) * 3, fps, config: { damping: 12 } }) : 1;
            return (
              <div key={i} style={{ scale: p, opacity: p }}>
                <PixelSprite map={GEM_MAP} palette={GEM_PALETTE} pixel={11 * scale} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export const ContainersScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const head = useEnter(0);
  const cue = useCueLookup();
  const footAt = useCue(visual.footnoteAtWord, 30);
  const foot = useEnter(footAt);
  const scale = visual.containers.length > 1 ? 0.62 : 1;
  const updates: Update[] = visual.updates.map((u) => ({ ...u, at: cue(u.atWord, 0) }));
  return (
    <AbsoluteFill
      style={{
        top: layout.contentTop,
        height: layout.contentBottom - layout.contentTop,
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${layout.side}px`,
        gap: 34,
      }}
    >
      {visual.heading ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 72, color: colors.text, textAlign: "center", ...fadeUp(head) }}>
          {visual.heading}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 60, alignItems: "flex-end" }}>
        {visual.containers.map((c, i) => (
          <Container
            key={c.label}
            label={c.label}
            initial={c.value}
            showGems={c.showGems}
            updates={updates.filter((u) => u.label === c.label)}
            scale={scale}
            delay={6 + i * 8}
          />
        ))}
      </div>
      {visual.footnote ? (
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 40, color: colors.gold, textAlign: "center", ...fadeUp(foot) }}>
          {visual.footnote}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
