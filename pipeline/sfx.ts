/**
 * Efectos de sonido originales sintetizados por código (sin licencias de terceros).
 * Se generan una vez en public/sfx/ y se reutilizan en todos los videos.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ensureDir, ROOT } from "./util";

const RATE = 48_000;
export const SFX_DIR_REL = "sfx";
const SFX_VERSION = "v1";

const wav = (samples: Float32Array) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0, "ascii");
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8, "ascii");
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36, "ascii");
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};

/** PRNG determinista (mulberry32) para que los sonidos sean siempre iguales. */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const whoosh = () => {
  const n = Math.round(RATE * 0.42);
  const out = new Float32Array(n);
  const r = rng(7);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 2;
    const cutoff = 0.02 + 0.25 * Math.sin(Math.PI * t); // barrido del filtro
    lp += cutoff * (r() * 2 - 1 - lp);
    out[i] = lp * env * 2.2;
  }
  return out;
};

const pop = () => {
  const n = Math.round(RATE * 0.13);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 380 + 700 * Math.exp(-t * 45);
    phase += (2 * Math.PI * f) / RATE;
    out[i] = Math.sin(phase) * Math.exp(-t * 32) * 0.8;
  }
  return out;
};

const impact = () => {
  const n = Math.round(RATE * 0.7);
  const out = new Float32Array(n);
  const r = rng(11);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 42 + 90 * Math.exp(-t * 14);
    phase += (2 * Math.PI * f) / RATE;
    const body = Math.sin(phase) * Math.exp(-t * 5.5);
    const click = (r() * 2 - 1) * Math.exp(-t * 90) * 0.5;
    out[i] = (body + click) * 0.85;
  }
  return out;
};

export const SFX = {
  whoosh: `${SFX_DIR_REL}/whoosh-${SFX_VERSION}.wav`,
  pop: `${SFX_DIR_REL}/pop-${SFX_VERSION}.wav`,
  impact: `${SFX_DIR_REL}/impact-${SFX_VERSION}.wav`,
} as const;

export const ensureSfx = () => {
  const gens: Record<keyof typeof SFX, () => Float32Array> = { whoosh, pop, impact };
  ensureDir(path.join(ROOT, "public", SFX_DIR_REL));
  for (const [k, rel] of Object.entries(SFX) as [keyof typeof SFX, string][]) {
    const abs = path.join(ROOT, "public", rel);
    if (!existsSync(abs)) writeFileSync(abs, wav(gens[k]()));
  }
};
