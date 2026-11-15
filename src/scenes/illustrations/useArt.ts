import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useCueLookup } from "../../lib/anim";

export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Frame actual, búsqueda de beats y un muelle a partir de un frame. */
export const useArt = (beats: Record<string, string>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lookup = useCueLookup();
  const beat = (id: string, fallback: number) => lookup(beats[id], fallback);
  const sp = (t: number, damping = 13) => spring({ frame: frame - t, fps, config: { damping, mass: 0.7 } });
  return { frame, fps, beat, sp };
};
