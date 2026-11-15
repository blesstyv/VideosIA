import { createContext, useContext } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { normalizeWord } from "./schema";

/** Cues de la escena actual: palabra normalizada -> frame. */
export const CuesContext = createContext<Record<string, number>>({});

/** Palabras narradas de la escena actual con su frame. */
export const WordsContext = createContext<{ text: string; frame: number }[]>([]);
export const useSceneWords = () => useContext(WordsContext);

/** Frame (relativo a la escena) en que se pronuncia `word`; si no hay cue, `fallback`. */
export const useCue = (word: string | undefined, fallback: number): number => {
  const cues = useContext(CuesContext);
  if (!word) return fallback;
  return cues[normalizeWord(word)] ?? fallback;
};

/** Igual que useCue, pero devuelve una función para usar en listas. */
export const useCueLookup = () => {
  const cues = useContext(CuesContext);
  return (word: string | undefined, fallback: number) =>
    word ? (cues[normalizeWord(word)] ?? fallback) : fallback;
};

/** Progreso 0→1 con muelle a partir de `delay` frames. */
export const useEnter = (delay: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
};

export const fadeUp = (progress: number, distance = 40): React.CSSProperties => ({
  opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  translate: `0px ${interpolate(progress, [0, 1], [distance, 0])}px`,
});

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
