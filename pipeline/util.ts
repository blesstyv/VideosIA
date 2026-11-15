import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const REMOTION_CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");

export const paths = (slug: string) => {
  const contentDir = path.join(ROOT, "content", "videos", slug);
  const genRel = `generated/${slug}`; // relativo a public/
  const genDir = path.join(ROOT, "public", "generated", slug);
  const exportDir = path.join(ROOT, "exports", slug);
  return {
    contentDir,
    brief: path.join(contentDir, "brief.json"),
    script: path.join(contentDir, "script.json"),
    genRel,
    genDir,
    audioDir: path.join(genDir, "audio"),
    ttsManifest: path.join(genDir, "tts-manifest.json"),
    timeline: path.join(genDir, "timeline.json"),
    timelineRel: `${genRel}/timeline.json`,
    exportDir,
    video: path.join(exportDir, `${slug}.mp4`),
    reviewDir: path.join(exportDir, "review"),
  };
};

export const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

export const readJson = <T = unknown>(file: string): T =>
  JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as T;

export const writeJson = (file: string, data: unknown) => {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
};

export const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export type RunResult = { code: number; stdout: string; stderr: string };

/** Ejecuta un proceso sin shell (seguro con rutas que contienen espacios). */
export const run = (
  cmd: string,
  args: string[],
  opts: {
    cwd?: string;
    input?: string;
    echo?: boolean;
    echoFilter?: (line: string) => boolean;
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? ROOT,
      env: opts.env ?? process.env,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const echo = (d: Buffer) => {
      if (!opts.echo) return;
      for (const line of d.toString().split(/\r?\n/))
        if (line.trim() && (!opts.echoFilter || opts.echoFilter(line))) console.log(`    ${line}`);
    };
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
      echo(d);
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
      echo(d);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    if (opts.input !== undefined) child.stdin.end(opts.input);
    else child.stdin.end();
  });

/** FFmpeg/FFprobe empaquetados por Remotion (no requieren instalación aparte). */
export const ffmpeg = (args: string[]) => run(process.execPath, [REMOTION_CLI, "ffmpeg", ...args]);
export const ffprobe = (args: string[]) => run(process.execPath, [REMOTION_CLI, "ffprobe", ...args]);

export const probeDurationSec = async (file: string): Promise<number> => {
  const r = await ffprobe([
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
  ]);
  const d = parseFloat(r.stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`No se pudo medir la duración de ${file}: ${r.stderr}`);
  return d;
};

export const log = {
  step: (m: string) => console.log(`\n▶ ${m}`),
  ok: (m: string) => console.log(`  ✔ ${m}`),
  warn: (m: string) => console.log(`  ⚠ ${m}`),
  err: (m: string) => console.error(`  ✖ ${m}`),
  info: (m: string) => console.log(`  · ${m}`),
};

export class PipelineError extends Error {}
