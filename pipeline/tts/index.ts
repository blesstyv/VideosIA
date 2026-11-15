/**
 * Capa TTS con proveedores intercambiables y caché por escena.
 * Cada escena produce: audio + tiempos por palabra (para subtítulos y "cues").
 */
import { existsSync, renameSync } from "node:fs";
import path from "node:path";
import type { Brief, Script } from "../script-schema";
import { ensureDir, ffmpeg, hash, log, paths, PipelineError, probeDurationSec, readJson, writeJson } from "../util";
import { synthesizeAzure } from "./azure";
import { synthesizeElevenLabs } from "./elevenlabs";
import { synthesizeSapi } from "./sapi";
import { finalizeTimings, tokenize, type Token, type WordTiming } from "./tokens";

export type { Token, WordTiming };

export type SceneAudio = {
  sceneId: string;
  key: string;
  file: string; // nombre de archivo dentro de audioDir
  durationSec: number;
  words: WordTiming[];
};
export type TtsManifest = { scenes: Record<string, SceneAudio> };

export const runTts = async (
  brief: Brief,
  script: Script,
  opts: { only?: string[]; force?: boolean; allowPaid?: boolean },
): Promise<TtsManifest> => {
  const p = paths(brief.slug);
  ensureDir(p.audioDir);
  const manifest: TtsManifest = existsSync(p.ttsManifest)
    ? readJson<TtsManifest>(p.ttsManifest)
    : { scenes: {} };

  const { provider } = brief.tts;
  const pending: { id: string; tokens: Token[]; key: string }[] = [];
  for (const scene of script.scenes) {
    const tokens = tokenize(scene.narration, script.pronunciation);
    const key = hash({ v: "trim-0.3", provider, tts: brief.tts, spoken: tokens.map((t) => t.spoken), cap: tokens.map((t) => t.caption) });
    const cached = manifest.scenes[scene.id];
    const fileOk = cached && existsSync(path.join(p.audioDir, cached.file));
    const selected = !opts.only || opts.only.includes(scene.id);
    if (selected && (opts.force || !fileOk || cached.key !== key)) pending.push({ id: scene.id, tokens, key });
    else if (!fileOk || cached.key !== key)
      throw new PipelineError(`La escena ${scene.id} no tiene audio actualizado; regenera sin --scene.`);
  }

  if (pending.length === 0) {
    log.ok("Audio en caché para todas las escenas (nada que regenerar)");
  }

  if (provider === "azure" && pending.length > 0) {
    const az = brief.tts.azure;
    if (!az) throw new PipelineError("Configura brief.tts.azure (voz, velocidad) para usar Azure.");
    const chars = pending.reduce((n, x) => n + x.tokens.map((t) => t.spoken).join(" ").length, 0);
    log.info(`Azure Speech: ${chars} caracteres (${pending.length} escenas), voz ${az.voice}.`);
    if (!az.freeTier && !opts.allowPaid)
      throw new PipelineError(
        "El recurso de Azure no está marcado como gratuito (freeTier). Revisa https://azure.microsoft.com/pricing/details/speech/ y repite con --allow-paid.",
      );
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION)
      throw new PipelineError("Faltan AZURE_SPEECH_KEY y AZURE_SPEECH_REGION (ver docs/VOZ.md).");
  }

  if (provider === "elevenlabs" && pending.length > 0) {
    const chars = pending.reduce((n, x) => n + x.tokens.map((t) => t.spoken).join(" ").length, 0);
    log.warn(`ElevenLabs es un servicio de pago: se enviarán ${chars} caracteres (${pending.length} escenas).`);
    log.warn("Consulta el costo vigente en https://elevenlabs.io/pricing antes de continuar.");
    if (!opts.allowPaid)
      throw new PipelineError("Uso de API de pago no autorizado. Repite con --allow-paid tras revisar el costo.");
    if (!process.env.ELEVENLABS_API_KEY) throw new PipelineError("Falta la variable ELEVENLABS_API_KEY.");
  }

  for (const job of pending) {
    const base = path.join(p.audioDir, job.id);
    const r =
      provider === "sapi"
        ? await synthesizeSapi(job.tokens, base, brief.tts.voice, brief.tts.rate)
        : provider === "azure"
          ? await synthesizeAzure(job.tokens, base, brief.tts.azure!)
          : await synthesizeElevenLabs(job.tokens, base, brief.tts.elevenlabs);
    if (r.file.endsWith(".wav")) await trimTrailingSilence(r.file);
    const durationSec = await probeDurationSec(r.file);
    const words = finalizeTimings(job.tokens, r.starts, durationSec * 1000);
    const last = words[words.length - 1];
    if (last && last.startMs > durationSec * 1000)
      throw new PipelineError(`Tiempos fuera del audio en ${job.id} (desfase TTS).`);
    manifest.scenes[job.id] = {
      sceneId: job.id,
      key: job.key,
      file: path.basename(r.file),
      durationSec,
      words,
    };
    writeJson(p.ttsManifest, manifest);
    log.ok(`${job.id}: ${durationSec.toFixed(2)} s, ${words.length} palabras`);
  }

  // Limpia entradas de escenas eliminadas del guion
  const valid = new Set(script.scenes.map((s) => s.id));
  for (const id of Object.keys(manifest.scenes)) if (!valid.has(id)) delete manifest.scenes[id];
  writeJson(p.ttsManifest, manifest);
  return manifest;
};

/** Silencio final que se conserva tras la última palabra (ritmo ágil para shorts). */
const KEEP_TAIL_SEC = 0.3;

/** Recorta el silencio final largo que deja SAPI (~0,7 s) a KEEP_TAIL_SEC. */
export const trimTrailingSilence = async (file: string) => {
  const dur = await probeDurationSec(file);
  const sd = await ffmpeg(["-hide_banner", "-i", file, "-af", "silencedetect=n=-45dB:d=0.2", "-c:a", "pcm_s16le", "-f", "null", "-"]);
  const starts = [...sd.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...sd.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const lastStart = starts[starts.length - 1];
  // El último silencio debe llegar hasta el final del archivo
  const reachesEnd = lastStart !== undefined && (ends.length < starts.length || dur - ends[ends.length - 1] < 0.05);
  if (!reachesEnd || dur - lastStart <= KEEP_TAIL_SEC + 0.05) return;
  const tmp = `${file}.trim.wav`;
  const r = await ffmpeg(["-v", "error", "-y", "-i", file, "-t", (lastStart + KEEP_TAIL_SEC).toFixed(3), "-c:a", "pcm_s16le", tmp]);
  if (r.code !== 0) throw new PipelineError(`No se pudo recortar ${file}: ${r.stderr}`);
  renameSync(tmp, file);
};
