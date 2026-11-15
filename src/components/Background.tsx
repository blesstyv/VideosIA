import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ResolvedBackground } from "../lib/schema";
import { Aurora } from "./Aurora";
import { colors } from "../theme";
import {
  CLOUD_MAP,
  CLOUD_PALETTE,
  DIRT_MAP,
  GRASS_MAP,
  GRASS_PALETTE,
  PixelSprite,
  RUNNER_MAP,
  RUNNER_PALETTE,
  STONE_MAP,
  STONE_PALETTE,
} from "./PixelArt";

const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 1.2) % 90;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 0%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(148,163,184,0.07) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${offset}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: -300,
          top: interpolate(frame, [0, 600], [200, 380]),
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.16), transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -380,
          top: interpolate(frame, [0, 600], [900, 760]),
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.14), transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Fondo tecnológico con bloques flotando en los márgenes. */
const BlocksBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const blocks = [
    { x: 40, y: 330, s: 7, map: GRASS_MAP, speed: 0.5, phase: 0 },
    { x: 930, y: 560, s: 6, map: DIRT_MAP, speed: 0.7, phase: 40 },
    { x: 60, y: 1080, s: 6, map: STONE_MAP, speed: 0.6, phase: 80 },
    { x: 900, y: 1180, s: 7, map: GRASS_MAP, speed: 0.4, phase: 20 },
  ];
  return (
    <AbsoluteFill>
      <GridBackground />
      {blocks.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + Math.sin((frame + b.phase) / 30) * 18,
            rotate: `${Math.sin((frame + b.phase) / 50) * 8}deg`,
            opacity: 0.55,
          }}
        >
          <PixelSprite
            map={b.map}
            palette={b.map === STONE_MAP ? STONE_PALETTE : GRASS_PALETTE}
            pixel={b.s * 2}
          />
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Parkour ilustrativo generado (NO es una grabación real; se etiqueta en pantalla). */
const ParkourIllustration: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const BLOCK = 80;
  const SPACING = 330;
  const speed = SPACING / 26; // un salto cada 26 frames
  const scroll = frame * speed;
  const rand = (k: number) => {
    const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const topOf = (k: number) => 1180 + Math.floor(rand(k) * 4) * BLOCK * 0.5;
  const first = Math.floor(scroll / SPACING) - 1;
  const pillars = Array.from({ length: Math.ceil(width / SPACING) + 3 }, (_, i) => first + i);

  const runnerX = 300;
  const worldX = scroll + runnerX;
  const k = Math.floor(worldX / SPACING);
  const u = (worldX % SPACING) / SPACING;
  const groundY = interpolate(u, [0, 1], [topOf(k), topOf(k + 1)]);
  const runnerY = groundY - Math.sin(Math.PI * u) * 170 - 10 * 10;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5DB7F0 0%, #9ED8FF 55%, #CDEBFF 100%)" }}>
      {[0, 1, 2].map((c) => {
        const span = width + 400;
        const x = (((c * 470 - frame * (0.8 + c * 0.3)) % span) + span) % span - 300;
        return (
          // Nubes solo en la franja superior para no competir con el título
          <div key={c} style={{ position: "absolute", top: 200 + c * 90, left: x, opacity: 0.7 }}>
            <PixelSprite map={CLOUD_MAP} palette={CLOUD_PALETTE} pixel={14 + c * 3} />
          </div>
        );
      })}
      {pillars.map((p) => {
        const x = p * SPACING - scroll;
        const top = topOf(p);
        const rows = Math.ceil((height - top) / BLOCK);
        return (
          <div key={p} style={{ position: "absolute", left: x, top }}>
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} style={{ display: "flex" }}>
                {[0, 1].map((c) => (
                  <PixelSprite key={c} map={r === 0 ? GRASS_MAP : DIRT_MAP} palette={GRASS_PALETTE} pixel={BLOCK / 8} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: runnerX - 40, top: runnerY }}>
        <PixelSprite map={RUNNER_MAP} palette={RUNNER_PALETTE} pixel={10} />
      </div>
    </AbsoluteFill>
  );
};

export const SceneBackground: React.FC<{ bg: ResolvedBackground }> = ({ bg }) => {
  switch (bg.kind) {
    case "aurora":
      return <Aurora />;
    case "grid":
      return <GridBackground />;
    case "blocks":
      return <BlocksBackground />;
    case "gameplay-video":
      return (
        <AbsoluteFill>
          <Video
            src={staticFile(bg.src)}
            muted
            loop
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
          <AbsoluteFill style={{ background: "rgba(5,8,20,0.55)" }} />
        </AbsoluteFill>
      );
    case "gameplay-illustration":
      return (
        <AbsoluteFill>
          <ParkourIllustration />
          <AbsoluteFill style={{ background: "linear-gradient(rgba(5,8,20,0.78) 0%, rgba(5,8,20,0.45) 50%, rgba(5,8,20,0.3) 100%)" }} />
        </AbsoluteFill>
      );
  }
};
