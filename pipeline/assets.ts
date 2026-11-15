/**
 * Biblioteca local de recursos autorizados: public/library/manifest.json
 * Solo se usan recursos con licencia verificada (license.verified = true).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { log, probeDurationSec, readJson, ROOT } from "./util";

export const LibraryItem = z.object({
  id: z.string(),
  type: z.enum(["gameplay", "music", "image"]),
  /** Ruta relativa a public/ (p. ej. library/gameplay/parkour-01.mp4). */
  file: z.string(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  license: z.object({
    owner: z.string(),
    /** original-propio | licencia-comercial | dominio-publico | cc-by | ... */
    kind: z.string(),
    verified: z.boolean(),
    proof: z.string().default(""),
    attribution: z.string().optional(),
  }),
});
export type LibraryItem = z.infer<typeof LibraryItem>;
export const Library = z.object({ items: z.array(LibraryItem).default([]) });

export const LIBRARY_MANIFEST = path.join(ROOT, "public", "library", "manifest.json");

export const loadLibrary = (): LibraryItem[] => {
  if (!existsSync(LIBRARY_MANIFEST)) return [];
  const lib = Library.parse(readJson(LIBRARY_MANIFEST));
  const usable: LibraryItem[] = [];
  for (const item of lib.items) {
    const abs = path.join(ROOT, "public", item.file);
    if (!item.license.verified) {
      log.warn(`Recurso ${item.id} ignorado: licencia no verificada.`);
      continue;
    }
    if (!existsSync(abs)) {
      log.warn(`Recurso ${item.id} ignorado: no existe ${item.file}.`);
      continue;
    }
    usable.push(item);
  }
  return usable;
};

/** Elige el recurso con más etiquetas coincidentes; rota entre empates según `seed`. */
export const pickAsset = (
  items: LibraryItem[],
  type: LibraryItem["type"],
  tags: string[],
  seed: number,
): LibraryItem | null => {
  const candidates = items
    .filter((i) => i.type === type)
    .map((i) => ({ i, score: i.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score);
  if (candidates.length === 0) return null;
  const best = candidates.filter((c) => c.score === candidates[0].score);
  return best[seed % best.length].i;
};

export const assetDurationSec = (item: LibraryItem) => probeDurationSec(path.join(ROOT, "public", item.file));
