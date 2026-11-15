import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const fonts = {
  sans: loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily,
  mono: loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily,
};

export const colors = {
  bg: "#070B16",
  bg2: "#0D1530",
  panel: "rgba(15, 23, 42, 0.92)",
  border: "rgba(148, 163, 184, 0.22)",
  text: "#F8FAFC",
  muted: "#A5B4CC",
  green: "#4ADE80",
  gold: "#FACC15",
  cyan: "#22D3EE",
  purple: "#A78BFA",
  red: "#F87171",
  orange: "#FB923C",
};

/** Colores de los dos lados de una comparación (neutros, sin imitar marcas). */
export const sides = {
  a: { main: "#FF8A5B", soft: "rgba(255,138,91,0.16)", ink: "#2A1206" },
  b: { main: "#2EE6A6", soft: "rgba(46,230,166,0.14)", ink: "#03251A" },
  n: { main: "#8B9CFF", soft: "rgba(139,156,255,0.16)", ink: "#0B1033" },
} as const;

/** Zonas seguras para 1080x1920 (deja libre la interfaz de TikTok/Reels/Shorts). */
export const layout = {
  side: 84,
  contentTop: 260,
  contentBottom: 1240,
  captionsTop: 1290,
  captionsHeight: 250,
};

export const categoryLabel: Record<string, string> = {
  programacion: "Programación",
  ia: "Inteligencia artificial",
  hardware: "Hardware",
  videojuegos: "Videojuegos",
  "ciberseguridad-dev": "Ciberseguridad y desarrollo",
};
