import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors } from "../theme";

/** Fondo vivo: manchas de color que se desplazan, rejilla sutil, partículas y grano. */
export const Aurora: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const blob = (x: number, y: number, size: number, color: string) => (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
        filter: "blur(10px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: colors.bg, overflow: "hidden" }}>
      {blob(200 + Math.sin(t * 0.5) * 160, 420 + Math.cos(t * 0.4) * 120, 1100, "rgba(255,138,91,0.20)")}
      {blob(900 + Math.cos(t * 0.45) * 160, 900 + Math.sin(t * 0.35) * 180, 1200, "rgba(46,230,166,0.16)")}
      {blob(540 + Math.sin(t * 0.3) * 260, 1500 + Math.cos(t * 0.5) * 120, 1000, "rgba(124,92,255,0.18)")}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          backgroundPosition: `0px ${(frame * 0.8) % 72}px`,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      {Array.from({ length: 22 }, (_, i) => {
        const x = (i * 97) % 1080;
        const speed = 0.6 + ((i * 37) % 10) / 10;
        const y = 1920 - ((frame * speed * 2 + i * 173) % 2100);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: 2,
              background: i % 2 ? "rgba(255,255,255,0.35)" : "rgba(46,230,166,0.45)",
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
