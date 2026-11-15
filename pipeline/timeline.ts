/**
 * Construye el timeline que consume la composición ShortVideo:
 * tiempos por escena (derivados del audio), subtítulos globales, cues y recursos.
 */
import { normalizeWord, type ResolvedBackground, Timeline, type TimelineScene } from "../src/lib/schema";
import { assetDurationSec, loadLibrary, pickAsset } from "./assets";
import { ensureSfx, SFX } from "./sfx";
import type { Brief, Script } from "./script-schema";
import type { TtsManifest } from "./tts";
import { log, paths, PipelineError, writeJson } from "./util";

export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Duración de las transiciones entre escenas. */
const TRANSITION_SEC = 0.45;
/** Pausa tras la narración de cada escena (se suma al ~0,3 s de silencio final del audio). */
const TAIL_SEC = 0.35;
/** Cola final del video para que el cierre no se corte. */
const END_SEC = 0.9;

export const buildTimeline = async (
  brief: Brief,
  script: Script,
  tts: TtsManifest,
  fpsOverride?: number,
): Promise<Timeline> => {
  const fps = fpsOverride ?? brief.fps;
  const p = paths(brief.slug);
  const library = loadLibrary();
  const transitionFrames = Math.round(TRANSITION_SEC * fps);

  const scenes: TimelineScene[] = [];
  const captions: Timeline["captions"] = [];
  const sfx: Timeline["sfx"] = [];
  if (brief.sfx) ensureSfx();
  let cursor = 0;

  for (const [index, scene] of script.scenes.entries()) {
    const audio = tts.scenes[scene.id];
    if (!audio) throw new PipelineError(`Falta audio para la escena ${scene.id}. Ejecuta la etapa tts.`);
    const isLast = index === script.scenes.length - 1;
    const audioFrames = Math.ceil(audio.durationSec * fps);
    const duration = audioFrames + Math.round((TAIL_SEC + (isLast ? END_SEC : 0)) * fps);

    // Cues: palabra normalizada -> frame relativo a la escena (primera aparición)
    const cues: Record<string, number> = {};
    for (const w of audio.words) {
      const key = normalizeWord(w.text);
      if (key && cues[key] === undefined) cues[key] = Math.round((w.startMs / 1000) * fps);
    }
    for (const cue of collectCues(scene.visual))
      if (cues[normalizeWord(cue)] === undefined)
        throw new PipelineError(`La escena ${scene.id} usa atWord "${cue}", que no aparece en su narración.`);

    // Fondo
    let background: ResolvedBackground;
    if (scene.background.kind === "gameplay") {
      const item = pickAsset(library, "gameplay", scene.background.tags, index);
      if (item) {
        const sec = await assetDurationSec(item);
        background = {
          kind: "gameplay-video",
          src: item.file,
          assetId: item.id,
          durationInFrames: Math.max(1, Math.floor(sec * fps)),
        };
        log.info(`${scene.id}: gameplay "${item.id}"`);
      } else {
        background = { kind: "gameplay-illustration" };
        log.warn(`${scene.id}: sin gameplay en la biblioteca → animación ilustrativa (etiquetada).`);
      }
    } else background = scene.background;

    const startMs = (cursor / fps) * 1000;
    audio.words.forEach((w, i) =>
      captions.push({
        text: ` ${w.text}`,
        startMs: Math.round(startMs + w.startMs),
        endMs: Math.round(startMs + w.endMs),
        timestampMs: Math.round(startMs + (w.startMs + w.endMs) / 2),
        confidence: null,
        // Nunca mezclar dos frases ni dos escenas en el mismo subtítulo
        ...(/[.!?…:]$/.test(w.text) || i === audio.words.length - 1 ? { pageBreakAfter: true } : {}),
      }),
    );

    // Efectos: transición de entrada y "pop" en cada revelado sincronizado
    if (brief.sfx) {
      if (index === 0) sfx.push({ src: SFX.impact, frame: cursor, volume: 0.45 });
      else if (scene.transitionIn !== "none")
        sfx.push({ src: SFX.whoosh, frame: Math.max(0, cursor - 4), volume: 0.22 });
      for (const cue of collectCues(scene.visual))
        sfx.push({ src: SFX.pop, frame: cursor + cues[normalizeWord(cue)], volume: 0.3 });
    }

    scenes.push({
      id: scene.id,
      startFrame: cursor,
      durationInFrames: duration,
      // Si la siguiente escena entra con transición, esta se alarga lo que dura el solape,
      // así cada escena visual arranca exactamente cuando empieza su narración.
      visualDurationInFrames:
        !isLast && script.scenes[index + 1].transitionIn !== "none" ? duration + transitionFrames : duration,
      audioSrc: `${p.genRel}/audio/${audio.file}`,
      audioDurationInFrames: audioFrames,
      transitionIn: index === 0 ? "none" : scene.transitionIn,
      background,
      visual: scene.visual,
      cues,
      words: audio.words.map((w) => ({ text: w.text, frame: Math.round((w.startMs / 1000) * fps) })),
    });
    cursor += duration;
  }

  let music: Timeline["music"] = null;
  if (brief.music) {
    const item = pickAsset(library, "music", brief.music.tags, 0);
    if (item) music = { src: item.file, volume: brief.music.volume, assetId: item.id };
    else log.warn("Sin música con licencia verificada en la biblioteca → video sin música.");
  }

  const timeline = Timeline.parse({
    version: 1,
    slug: brief.slug,
    category: brief.category,
    width: WIDTH,
    height: HEIGHT,
    fps,
    durationInFrames: cursor,
    transitionFrames,
    scenes,
    captions,
    music,
    sfx,
    stamp: script.stamp,
  });
  writeJson(p.timeline, timeline);
  log.ok(`Timeline: ${scenes.length} escenas, ${(cursor / fps).toFixed(2)} s a ${fps} fps`);
  return timeline;
};

export const collectCues = (v: Script["scenes"][number]["visual"]): string[] => {
  switch (v.type) {
    case "bullets":
      return v.items.flatMap((i) => (i.atWord ? [i.atWord] : []));
    case "code":
      return [v.highlightAtWord, v.outputAtWord, v.noteAtWord].filter((x): x is string => !!x);
    case "containers":
      return [...v.updates.map((u) => u.atWord), ...(v.footnoteAtWord ? [v.footnoteAtWord] : [])];
    case "versus":
      return v.rows.flatMap((r) => (r.atWord ? [r.atWord] : []));
    case "pricing":
      return v.plans.flatMap((p) => (p.atWord ? [p.atWord] : []));
    case "verdict":
      return v.items.flatMap((i) => (i.atWord ? [i.atWord] : []));
    case "bignumber":
      return v.atWord ? [v.atWord] : [];
    case "illustration":
      return Object.values(v.beats);
    default:
      return [];
  }
};
