import path from "node:path";
import type { Timeline } from "../src/lib/schema";
import { ensureDir, log, paths, PipelineError, REMOTION_CLI, ROOT, run, writeJson } from "./util";

export const COMPOSITION_ID = "ShortVideo";

/** Renderiza el MP4 final (H.264 + AAC) o, con `sceneId`, solo el tramo de una escena. */
export const renderVideo = async (slug: string, timeline: Timeline, opts: { sceneId?: string } = {}) => {
  const p = paths(slug);
  const propsFile = path.join(p.genDir, "props.json");
  writeJson(propsFile, { timelineFile: p.timelineRel });

  let out = p.video;
  const extra: string[] = [];
  if (opts.sceneId) {
    const sc = timeline.scenes.find((s) => s.id === opts.sceneId);
    if (!sc) throw new PipelineError(`Escena desconocida: ${opts.sceneId}`);
    out = path.join(p.exportDir, "previews", `${slug}--${sc.id}.mp4`);
    extra.push(`--frames=${sc.startFrame}-${sc.startFrame + sc.durationInFrames - 1}`);
  }
  ensureDir(path.dirname(out));

  log.step(opts.sceneId ? `Render parcial de ${opts.sceneId}` : "Render del video completo");
  const started = Date.now();
  const r = await run(
    process.execPath,
    [
      REMOTION_CLI, "render", "src/index.ts", COMPOSITION_ID, out,
      `--props=${propsFile}`,
      // bt709 => yuv420p con rango TV etiquetado (sin él, Remotion produce yuvj420p).
      "--codec=h264", "--audio-codec=aac", "--pixel-format=yuv420p", "--color-space=bt709", "--crf=18",
      "--log=warn",
      ...extra,
    ],
    {
      cwd: ROOT,
      echo: true,
      // Muestra el progreso cada 10 % en vez de una línea por frame.
      echoFilter: (line) => {
        const m = line.match(/^(Rendered|Encoded) (\d+)\/(\d+)/);
        if (!m) return true;
        const [n, total] = [Number(m[2]), Number(m[3])];
        return n === total || n % Math.max(1, Math.round(total / 10)) === 0;
      },
    },
  );
  if (r.code !== 0) throw new PipelineError(`El render falló (código ${r.code}).`);
  log.ok(`Render terminado en ${((Date.now() - started) / 1000).toFixed(0)} s → ${path.relative(ROOT, out)}`);
  return out;
};
