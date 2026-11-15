import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Movimiento de cámara continuo: entrada con "punch-in" y zoom lento durante la escena.
 * Las escenas dejan de verse estáticas sin depender de cada componente.
 */
export const Camera: React.FC<{ children: React.ReactNode; seed: number }> = ({ children, seed }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const punch = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const drift = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const dir = seed % 2 === 0 ? 1 : -1;
  return (
    <AbsoluteFill
      style={{
        scale: interpolate(punch, [0, 1], [1.08, 1]) * interpolate(drift, [0, 1], [1, 1.045]),
        translate: `${dir * interpolate(drift, [0, 1], [0, 14])}px ${interpolate(drift, [0, 1], [0, -10])}px`,
        rotate: `${dir * interpolate(punch, [0, 1], [1.2, 0])}deg`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
