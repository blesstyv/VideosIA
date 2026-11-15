import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

/** Barra de progreso superior y etiqueta de categoría. */
export const Chrome: React.FC<{ category: string; stamp?: string }> = ({ category, stamp }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: "100%",
            width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan})`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 104,
          left: 84,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 24px",
          borderRadius: 999,
          background: "rgba(3,6,16,0.7)",
          border: `2px solid ${colors.border}`,
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors.text,
        }}
      >
        <div style={{ width: 16, height: 16, background: colors.green, borderRadius: 4 }} />
        {category}
      </div>
      {stamp ? (
        <div
          style={{
            position: "absolute",
            top: 186,
            left: 84,
            padding: "8px 18px",
            borderRadius: 12,
            background: "rgba(3,6,16,0.7)",
            color: colors.muted,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 24,
          }}
        >
          {stamp}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Aviso obligatorio cuando el fondo es una animación y no una grabación real. */
export const IllustrativeBadge: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 110,
      right: 84,
      padding: "8px 18px",
      borderRadius: 12,
      background: "rgba(3,6,16,0.7)",
      color: colors.muted,
      fontFamily: fonts.sans,
      fontWeight: 700,
      fontSize: 24,
    }}
  >
    Animación ilustrativa
  </div>
);
