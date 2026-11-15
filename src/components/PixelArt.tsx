/**
 * Pixel art original de estilo "bloques" (inspirado en juegos voxel, sin usar
 * texturas ni recursos de terceros).
 */
import React from "react";

type Palette = Record<string, string>;

export const PixelSprite: React.FC<{
  map: string[];
  palette: Palette;
  pixel: number;
  style?: React.CSSProperties;
}> = ({ map, palette, pixel, style }) => {
  const w = Math.max(...map.map((r) => r.length));
  const h = map.length;
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const fill = palette[ch];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }),
  );
  return (
    <svg
      width={w * pixel}
      height={h * pixel}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ display: "block", ...style }}
    >
      {rects}
    </svg>
  );
};

export const CHEST_MAP = [
  "oooooooooooooo",
  "ollllllllllllo",
  "owwwwwwwwwwwwo",
  "owdwwwwwwwwdwo",
  "oddddddddddddo",
  "owwwwwggwwwwwo",
  "owwwwwkkwwwwwo",
  "owwwwwwwwwwwwo",
  "owdwwwwwwwwdwo",
  "owwwwwwwwwwwwo",
  "oddddddddddddo",
  "oooooooooooooo",
];
export const CHEST_PALETTE: Palette = {
  o: "#2B1A0B",
  l: "#C98A43",
  w: "#9A6324",
  d: "#6B4118",
  g: "#FDE68A",
  k: "#CA8A04",
};

export const GEM_MAP = ["..ooo..", ".oCcco.", "oCcccbo", ".occbo.", "..obo..", "...o..."];
export const GEM_PALETTE: Palette = { o: "#0E7490", C: "#CFFAFE", c: "#22D3EE", b: "#0891B2" };

export const GRASS_MAP = [
  "gGgggGgg",
  "ggGggggG",
  "gdgGdggd",
  "ddgdDddg",
  "dDdddddd",
  "ddddDddd",
  "dDdddddD",
  "ddddDddd",
];

export const CLOUD_MAP = ["..wwww......", ".wwwwwwww...", "wwwwwwwwwwww", ".wwwwwwwwww."];
export const CLOUD_PALETTE: Palette = { w: "#FFFFFF" };
export const GRASS_PALETTE: Palette = { g: "#4CAF50", G: "#6BCB5A", d: "#8B5A2B", D: "#6E4520" };

export const DIRT_MAP = ["dddDdddd", "dDdddddD", "ddddDddd", "dddddddd", "DdddddDd", "dddDdddd", "ddDddddd", "dddddDdd"];

export const STONE_MAP = ["ssSsssss", "sssssSss", "sSssssss", "ssssssSs", "ssssssss", "sssSssss", "Ssssssss", "ssssssSs"];
export const STONE_PALETTE: Palette = { s: "#7C8591", S: "#5F6873" };

/** Personaje genérico de bloques (diseño propio). */
export const RUNNER_MAP = [
  "..hhhh..",
  "..hffh..",
  "..ffff..",
  ".cccccc.",
  "fccccccf",
  "fccccccf",
  "..pppp..",
  "..p..p..",
  "..p..p..",
  "..b..b..",
];
export const RUNNER_PALETTE: Palette = { h: "#3F2A14", f: "#E0AC69", c: "#22D3EE", p: "#3B4BA8", b: "#1F2937" };
