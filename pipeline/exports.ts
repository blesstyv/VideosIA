/** Archivos complementarios: guion, subtítulos, metadatos de publicación y fuentes. */
import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Timeline } from "../src/lib/schema";
import type { Brief, Script } from "./script-schema";
import { ensureDir, log, paths, writeJson } from "./util";

const srtTime = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const r = Math.floor(ms % 1000);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(r, 3)}`;
};

/** Agrupa palabras en líneas de subtítulo legibles (≤ 32 caracteres o fin de frase). */
export const toSrt = (captions: Timeline["captions"]) => {
  const blocks: { start: number; end: number; text: string }[] = [];
  let cur: { start: number; end: number; text: string } | null = null;
  for (const c of captions) {
    const word = c.text.trim();
    if (cur && (cur.text.length + word.length + 1 > 32 || c.startMs - cur.end > 600)) {
      blocks.push(cur);
      cur = null;
    }
    if (!cur) cur = { start: c.startMs, end: c.endMs, text: word };
    else {
      cur.text += ` ${word}`;
      cur.end = c.endMs;
    }
    if (/[.!?…]$/.test(word)) {
      blocks.push(cur);
      cur = null;
    }
  }
  if (cur) blocks.push(cur);
  return blocks.map((b, i) => `${i + 1}\n${srtTime(b.start)} --> ${srtTime(b.end)}\n${b.text}\n`).join("\n");
};

export const writeExports = (brief: Brief, script: Script, timeline: Timeline, report?: unknown) => {
  const p = paths(brief.slug);
  ensureDir(p.exportDir);
  const fps = timeline.fps;
  const t = (f: number) => (f / fps).toFixed(1);

  // Guion legible con storyboard
  const md = [
    `# ${script.title}`,
    "",
    `- Tema: ${brief.topic}`,
    `- Categoría: ${brief.category} · Plataforma: ${brief.platform} · ${timeline.fps} fps`,
    `- Duración: ${t(timeline.durationInFrames)} s`,
    "",
    "## Storyboard",
    "",
    "| # | Escena | Sección | Inicio | Fin | Visual | Fondo |",
    "|---|---|---|---|---|---|---|",
    ...timeline.scenes.map((s, i) => {
      const sc = script.scenes[i];
      return `| ${i + 1} | ${s.id} | ${sc.section} | ${t(s.startFrame)} s | ${t(s.startFrame + s.durationInFrames)} s | ${s.visual.type} | ${s.background.kind} |`;
    }),
    "",
    "## Narración",
    "",
    ...script.scenes.flatMap((s, i) => [`**${i + 1}. ${s.id}** (${s.section})`, "", s.narration, ""]),
  ].join("\n");
  writeFileSync(path.join(p.exportDir, "script.md"), md, "utf8");

  writeFileSync(path.join(p.exportDir, "captions.srt"), toSrt(timeline.captions), "utf8");
  writeJson(path.join(p.exportDir, "captions.json"), timeline.captions);

  // Publicación (no se publica nada automáticamente)
  writeFileSync(path.join(p.exportDir, "title.txt"), script.publish.title + "\n", "utf8");
  writeFileSync(
    path.join(p.exportDir, "description.txt"),
    `${script.publish.description}\n\n${script.publish.hashtags.join(" ")}\n`,
    "utf8",
  );
  writeFileSync(path.join(p.exportDir, "hashtags.txt"), script.publish.hashtags.join(" ") + "\n", "utf8");

  // Fuentes y estado de verificación
  const src = new Map(script.sources.map((s) => [s.id, s]));
  const sources = [
    `# Fuentes y verificación — ${script.title}`,
    "",
    "## Afirmaciones verificadas",
    "",
    ...script.claims
      .filter((c) => c.status === "verified")
      .flatMap((c) => [`- ${c.text}`, ...c.sources.map((id) => `  - [${src.get(id)?.title}](${src.get(id)?.url}) (consultado ${src.get(id)?.accessed})`)]),
    "",
    "## Contenido ilustrativo (analogías / ejemplos didácticos, no datos)",
    "",
    ...script.claims.filter((c) => c.status === "illustrative").map((c) => `- ${c.text}`),
    "",
    "## Recursos audiovisuales",
    "",
    ...timeline.scenes.map((s) =>
      s.background.kind === "gameplay-video"
        ? `- ${s.id}: gameplay de biblioteca \`${s.background.assetId}\``
        : s.background.kind === "gameplay-illustration"
          ? `- ${s.id}: animación gráfica original (etiquetada "Animación ilustrativa", no es grabación real)`
          : `- ${s.id}: gráficos generados (${s.background.kind})`,
    ),
    `- Música: ${timeline.music ? timeline.music.assetId : "sin música"}`,
    `- Voz: ${brief.tts.provider} (${brief.tts.provider === "sapi" ? brief.tts.voice : brief.tts.elevenlabs?.voiceId})`,
    "",
  ].join("\n");
  writeFileSync(path.join(p.exportDir, "sources.md"), sources, "utf8");

  writeJson(path.join(p.exportDir, "metadata.json"), {
    slug: brief.slug,
    topic: brief.topic,
    category: brief.category,
    platform: brief.platform,
    fps: timeline.fps,
    resolution: `${timeline.width}x${timeline.height}`,
    durationSec: timeline.durationInFrames / timeline.fps,
    publish: script.publish,
    tts: brief.tts.provider === "sapi" ? { provider: "sapi", voice: brief.tts.voice } : { provider: "elevenlabs" },
    music: timeline.music,
    scenes: timeline.scenes.map((s) => ({ id: s.id, start: s.startFrame / fps, duration: s.durationInFrames / fps, visual: s.visual.type, background: s.background.kind })),
    validation: report ?? null,
    approvedForPublishing: false,
  });

  // Copia de los archivos de proyecto
  const proj = path.join(p.exportDir, "project");
  ensureDir(proj);
  copyFileSync(p.brief, path.join(proj, "brief.json"));
  copyFileSync(p.script, path.join(proj, "script.json"));
  copyFileSync(p.timeline, path.join(proj, "timeline.json"));
  log.ok(`Archivos complementarios en ${path.relative(process.cwd(), p.exportDir) || p.exportDir}`);
};
