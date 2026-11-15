/**
 * Validación técnica del MP4 exportado + material para revisión visual.
 * Una exportación exitosa NO se considera prueba de calidad: además se revisan
 * negros, congelados, silencios, niveles de audio, sincronía de subtítulos y
 * fotogramas por escena.
 *
 * Nota: el FFmpeg empaquetado con Remotion no incluye los filtros volumedetect,
 * blackdetect, select ni tile; por eso el audio y la luminancia se analizan en
 * Node a partir de WAV y PNG en escala de grises de baja resolución.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Timeline } from "../src/lib/schema";
import { decodeGrayPng, wavPcm } from "./media-decode";
import type { Brief } from "./script-schema";
import { ensureDir, ffmpeg, ffprobe, log, paths, PipelineError, writeJson } from "./util";

type Check = { name: string; status: "ok" | "warn" | "error"; detail: string };

const LUMA_W = 54;
const LUMA_H = 96;
const LUMA_FPS = 4;

/** Analiza luminancia: tramos negros y tramos congelados. */
export const analyzeLuma = (buf: Buffer) => {
  const size = LUMA_W * LUMA_H;
  const n = Math.floor(buf.length / size);
  const means: number[] = [];
  const diffs: number[] = [];
  for (let f = 0; f < n; f++) {
    let sum = 0;
    let diff = 0;
    for (let i = 0; i < size; i++) {
      const v = buf[f * size + i];
      sum += v;
      if (f > 0) diff += Math.abs(v - buf[(f - 1) * size + i]);
    }
    means.push(sum / size);
    diffs.push(f > 0 ? diff / size : 255);
  }
  const runs = (pred: (i: number) => boolean, minLen: number) => {
    const out: [number, number][] = [];
    let start = -1;
    for (let i = 0; i <= n; i++) {
      if (i < n && pred(i)) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        if (i - start >= minLen) out.push([start / LUMA_FPS, i / LUMA_FPS]);
        start = -1;
      }
    }
    return out;
  };
  return {
    frames: n,
    black: runs((i) => means[i] < 16, 2), // ≥ 0,5 s casi negro
    frozen: runs((i) => diffs[i] < 0.15, 4 * LUMA_FPS), // ≥ 4 s sin cambios visibles
  };
};

/** Nivel RMS y pico (dBFS) de PCM s16le mono. */
export const analyzePcm = (buf: Buffer) => {
  const n = Math.floor(buf.length / 2);
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const s = buf.readInt16LE(i * 2) / 32768;
    sumSq += s * s;
    peak = Math.max(peak, Math.abs(s));
  }
  const db = (x: number) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
  return { meanDb: db(Math.sqrt(sumSq / Math.max(1, n))), peakDb: db(peak) };
};

export const validateVideo = async (brief: Brief, timeline: Timeline) => {
  const p = paths(brief.slug);
  if (!existsSync(p.video)) throw new PipelineError(`No existe el video: ${p.video}`);
  ensureDir(p.reviewDir);
  const checks: Check[] = [];
  const add = (name: string, ok: boolean | "warn", detail: string) =>
    checks.push({ name, status: ok === true ? "ok" : ok === "warn" ? "warn" : "error", detail });

  // 1) Metadatos de streams
  const pr = await ffprobe(["-v", "error", "-show_streams", "-show_format", "-of", "json", p.video]);
  if (pr.code !== 0) throw new PipelineError(`ffprobe falló: ${pr.stderr}`);
  const info = JSON.parse(pr.stdout) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; r_frame_rate?: string; pix_fmt?: string; color_range?: string; sample_rate?: string; duration?: string }[];
    format: { duration: string; size: string };
  };
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  const expectedSec = timeline.durationInFrames / timeline.fps;
  const dur = parseFloat(info.format.duration);

  add("Stream de video", !!v, v ? `${v.codec_name} ${v.width}x${v.height}` : "sin video");
  if (v) {
    add("Códec H.264", v.codec_name === "h264", v.codec_name);
    add("Resolución 1080x1920 (9:16)", v.width === 1080 && v.height === 1920, `${v.width}x${v.height}`);
    const [num, den] = (v.r_frame_rate ?? "0/1").split("/").map(Number);
    add(`FPS = ${timeline.fps}`, Math.abs(num / den - timeline.fps) < 0.01, `${(num / den).toFixed(2)}`);
    add("Píxel yuv420p (rango TV)", v.pix_fmt === "yuv420p", `${v.pix_fmt} ${v.color_range ?? ""}`.trim());
  }
  add("Stream de audio AAC", a?.codec_name === "aac", a ? `${a.codec_name} ${a.sample_rate} Hz` : "sin audio");
  add("Duración = timeline", Math.abs(dur - expectedSec) <= 2 / timeline.fps + 0.05, `${dur.toFixed(3)} s vs ${expectedSec.toFixed(3)} s esperados`);
  const { min, max } = brief.targetSeconds;
  add(`Duración en rango ${min}-${max} s`, dur >= min && dur <= max ? true : "warn", `${dur.toFixed(1)} s`);
  if (a?.duration) {
    const ad = parseFloat(a.duration);
    add("Audio cubre el video", Math.abs(ad - dur) < 0.2, `audio ${ad.toFixed(2)} s`);
  }

  // 2) Integridad: decodificación completa de audio y video
  const dec = await ffmpeg(["-v", "error", "-i", p.video, "-c:v", "rawvideo", "-c:a", "pcm_s16le", "-f", "null", "-"]);
  const decErr = dec.stderr.split(/\r?\n/).filter((l) => l.trim());
  add("Decodificación íntegra", dec.code === 0 && decErr.length === 0, decErr.slice(0, 3).join(" | ") || "sin errores");

  // 3) Luminancia: negros y congelados (frames PNG en gris a baja resolución)
  const lumaDir = path.join(p.reviewDir, "_luma");
  rmSync(lumaDir, { recursive: true, force: true });
  ensureDir(lumaDir);
  const lr = await ffmpeg(["-v", "error", "-y", "-i", p.video, "-an", "-vf", `scale=${LUMA_W}:${LUMA_H}`, "-r", String(LUMA_FPS), "-pix_fmt", "gray", "-c:v", "png", path.join(lumaDir, "%05d.png")]);
  if (lr.code === 0) {
    const files = readdirSync(lumaDir).filter((f) => f.endsWith(".png")).sort();
    const luma = analyzeLuma(Buffer.concat(files.map((f) => Buffer.from(decodeGrayPng(readFileSync(path.join(lumaDir, f))).data))));
    const fmt = (r: [number, number][]) => r.map(([s, e]) => `${s.toFixed(1)}-${e.toFixed(1)} s`).join(", ");
    add("Sin tramos en negro (≥0,5 s)", luma.black.length === 0, luma.black.length ? fmt(luma.black) : `ninguno (${luma.frames} muestras)`);
    add("Sin imagen congelada (≥4 s)", luma.frozen.length === 0 ? true : "warn", luma.frozen.length ? fmt(luma.frozen) : "ninguno");
  } else add("Análisis de luminancia", false, lr.stderr.slice(0, 200));
  rmSync(lumaDir, { recursive: true, force: true });

  // 4) Audio: niveles y silencios
  const pcmFile = path.join(p.reviewDir, "_audio.wav");
  const ar = await ffmpeg(["-v", "error", "-y", "-i", p.video, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", pcmFile]);
  if (ar.code === 0) {
    const lv = analyzePcm(wavPcm(readFileSync(pcmFile)));
    add("Volumen medio audible (> -35 dBFS)", lv.meanDb > -35, `${lv.meanDb.toFixed(1)} dBFS`);
    add("Sin saturación (pico < -0,1 dBFS)", lv.peakDb < -0.1 ? true : "warn", `${lv.peakDb.toFixed(1)} dBFS`);
  } else add("Análisis de audio", false, ar.stderr.slice(0, 200));
  rmSync(pcmFile, { force: true });
  const sd = await ffmpeg(["-hide_banner", "-i", p.video, "-vn", "-af", "silencedetect=n=-45dB:d=1.5", "-c:a", "pcm_s16le", "-f", "null", "-"]);
  if (sd.code === 0) {
    const sil = [...sd.stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)];
    add("Sin silencios largos (>1,5 s)", sil.length === 0 ? true : "warn", sil.length ? sil.map((s) => `${(+s[1]).toFixed(1)}-${(+s[2]).toFixed(1)} s`).join(", ") : "ninguno");
  } else add("Detección de silencios", false, sd.stderr.slice(-200));

  // 5) Sincronía de subtítulos con la narración
  const capEnd = Math.max(...timeline.captions.map((c) => c.endMs)) / 1000;
  add("Subtítulos dentro del video", capEnd <= dur, `último subtítulo termina en ${capEnd.toFixed(2)} s`);
  const missing = timeline.scenes.filter((sc) => {
    const s0 = (sc.startFrame / timeline.fps) * 1000;
    const s1 = ((sc.startFrame + sc.audioDurationInFrames) / timeline.fps) * 1000;
    return !timeline.captions.some((c) => c.startMs >= s0 - 1 && c.startMs < s1);
  });
  add("Cada escena tiene subtítulos dentro de su audio", missing.length === 0, missing.length ? missing.map((s) => s.id).join(", ") : "ok");

  // 6) Fotogramas de revisión: 2 por escena (40 % y 85 %) + página índice
  const shots: { file: string; scene: string; t: number }[] = [];
  for (const sc of timeline.scenes)
    for (const frac of [0.4, 0.85]) {
      const t = (sc.startFrame + Math.floor(sc.durationInFrames * frac)) / timeline.fps;
      const file = `${String(shots.length + 1).padStart(2, "0")}-${sc.id}-${Math.round(frac * 100)}.jpg`;
      const r = await ffmpeg(["-y", "-v", "error", "-ss", t.toFixed(3), "-i", p.video, "-frames:v", "1", "-q:v", "3", path.join(p.reviewDir, file)]);
      if (r.code === 0) shots.push({ file, scene: sc.id, t });
    }
  writeFileSync(
    path.join(p.reviewDir, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Revisión ${brief.slug}</title>
<style>body{background:#111;color:#eee;font-family:system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}figure{margin:0}img{width:100%;border-radius:8px}</style>
<h1>Revisión visual — ${brief.slug}</h1><main>${shots
      .map((s) => `<figure><img src="${s.file}"><figcaption>${s.scene} · ${s.t.toFixed(1)} s</figcaption></figure>`)
      .join("")}</main>`,
    "utf8",
  );
  add("Fotogramas de revisión", shots.length === timeline.scenes.length * 2, `${shots.length} en review/`);

  const errors = checks.filter((c) => c.status === "error");
  const warns = checks.filter((c) => c.status === "warn");
  for (const c of checks) (c.status === "ok" ? log.ok : c.status === "warn" ? log.warn : log.err)(`${c.name}: ${c.detail}`);

  const report = {
    video: path.basename(p.video),
    generatedAt: new Date().toISOString(),
    durationSec: dur,
    sizeBytes: Number(info.format.size),
    result: errors.length ? "FALLO" : warns.length ? "OK_CON_AVISOS" : "OK",
    checks,
    manualReviewRequired: [
      "Revisar review/index.html (texto fuera de pantalla, solapes, legibilidad).",
      "Ver el MP4 completo con audio: pronunciación, ritmo y sincronía de subtítulos.",
      "Confirmar exactitud técnica frente a sources.md antes de publicar.",
    ],
  };
  writeJson(path.join(p.exportDir, "validation-report.json"), report);
  if (errors.length) throw new PipelineError(`Validación fallida: ${errors.map((e) => e.name).join(", ")}`);
  return report;
};
