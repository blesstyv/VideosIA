/**
 * Tech Content Studio — CLI del pipeline.
 *
 *   npm run video -- new <slug> --topic "..." --category programacion [--min 30 --max 90] [--fps 30] [--platform todas]
 *   npm run video -- check <slug>                 valida guion, fuentes, límites de texto y ejecuta el código
 *   npm run video -- tts <slug> [--scene id,id] [--force] [--allow-paid]
 *   npm run video -- build <slug> [--fps 60]       genera el timeline
 *   npm run video -- render <slug> [--scene id]    MP4 completo o solo una escena (preview)
 *   npm run video -- validate <slug>
 *   npm run video -- export <slug>
 *   npm run video -- produce <slug> [--fps 60] [--force] [--allow-paid]   todo el proceso
 *   npm run video -- list
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { Timeline } from "../src/lib/schema";
import { checkScript, loadProject } from "./check";
import { writeExports } from "./exports";
import { renderVideo } from "./render";
import { Brief, Category, Platform } from "./script-schema";
import { buildTimeline } from "./timeline";
import { runTts, type TtsManifest } from "./tts";
import { synthesizeAzure } from "./tts/azure";
import { tokenize } from "./tts/tokens";
import { ensureDir, log, paths, PipelineError, readJson, ROOT, writeJson } from "./util";
import { validateVideo } from "./validate";

// Claves de API locales (AZURE_SPEECH_KEY, etc.). .env está en .gitignore.
const envFile = path.join(ROOT, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const argv = process.argv.slice(2);
const [command, slug] = argv;
const flag = (name: string) => argv.includes(`--${name}`);
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const fpsOpt = () => {
  const f = opt("fps");
  if (f === undefined) return undefined;
  if (f !== "30" && f !== "60") throw new PipelineError("--fps admite 30 o 60");
  return Number(f);
};

const requireSlug = () => {
  if (!slug || slug.startsWith("--")) throw new PipelineError("Indica el slug del video.");
  return slug;
};

const loadTimeline = (s: string) => {
  const p = paths(s);
  if (!existsSync(p.timeline)) throw new PipelineError("No hay timeline. Ejecuta build primero.");
  return Timeline.parse(readJson(p.timeline));
};

const stages = {
  async check() {
    log.step("Comprobación del guion");
    return checkScript(requireSlug());
  },
  async tts() {
    const { brief, script } = await stages.check();
    // --provider sapi permite previsualizar sin claves (no modifica brief.json)
    const override = opt("provider");
    if (override) brief.tts.provider = Brief.shape.tts.unwrap().shape.provider.unwrap().parse(override);
    log.step(`Narración (${brief.tts.provider})`);
    return runTts(brief, script, {
      only: opt("scene")?.split(","),
      force: flag("force"),
      allowPaid: flag("allow-paid"),
    });
  },
  async build() {
    const s = requireSlug();
    const { brief, script } = loadProject(s);
    const p = paths(s);
    if (!existsSync(p.ttsManifest)) throw new PipelineError("No hay audio. Ejecuta tts primero.");
    log.step("Timeline");
    return buildTimeline(brief, script, readJson<TtsManifest>(p.ttsManifest), fpsOpt());
  },
  async render() {
    const s = requireSlug();
    return renderVideo(s, loadTimeline(s), { sceneId: opt("scene") });
  },
  async validate() {
    const s = requireSlug();
    const { brief } = loadProject(s);
    log.step("Validación del MP4");
    return validateVideo(brief, loadTimeline(s));
  },
  async export(report?: unknown) {
    const s = requireSlug();
    const { brief, script } = loadProject(s);
    log.step("Exportación de archivos complementarios");
    writeExports(brief, script, loadTimeline(s), report);
  },
};

const commands: Record<string, () => Promise<unknown>> = {
  ...stages,
  async new() {
    const s = requireSlug();
    const p = paths(s);
    if (existsSync(p.brief)) throw new PipelineError(`Ya existe ${p.brief}`);
    const topic = opt("topic");
    if (!topic) throw new PipelineError('Falta --topic "..."');
    const brief = Brief.parse({
      slug: s,
      topic,
      category: Category.parse(opt("category") ?? "programacion"),
      platform: Platform.parse(opt("platform") ?? "todas"),
      style: opt("style") ?? undefined,
      targetSeconds: { min: Number(opt("min") ?? 30), max: Number(opt("max") ?? 90) },
      fps: Number(opt("fps") ?? 30),
    });
    writeJson(p.brief, brief);
    log.ok(`Brief creado: ${path.relative(ROOT, p.brief)}`);
    log.info("Siguiente paso: pide a Claude Code que investigue y redacte script.json (docs/WORKFLOW.md).");
  },
  /** Genera una muestra con varias voces de Azure para elegir la del canal. */
  async "voice-test"() {
    const voices = (opt("voices") ?? "es-MX-JorgeNeural,es-MX-DaliaNeural").split(",");
    const text =
      opt("text") ?? "¿Claude o ChatGPT para programar? Revisé sus páginas oficiales, así que vamos con datos.";
    if (!flag("allow-paid") && !flag("free-tier"))
      throw new PipelineError("Indica --free-tier (recurso F0 de Azure) o --allow-paid tras revisar el costo.");
    const dir = path.join(ROOT, "exports", "_voice-tests");
    ensureDir(dir);
    for (const v of voices) {
      const r = await synthesizeAzure(tokenize(text, {}), path.join(dir, v), {
        voice: v,
        rate: opt("rate") ?? "+6%",
        pitch: "+0%",
        style: opt("style"),
      });
      log.ok(`${v} → ${path.relative(ROOT, r.file)}`);
    }
  },
  async list() {
    const dir = path.join(ROOT, "content", "videos");
    for (const d of existsSync(dir) ? readdirSync(dir) : []) {
      const p = paths(d);
      const st = [
        existsSync(p.script) ? "guion" : "sin guion",
        existsSync(p.ttsManifest) ? "audio" : "",
        existsSync(p.video) ? "mp4" : "",
      ].filter(Boolean);
      console.log(`${d.padEnd(32)} ${st.join(" · ")}`);
    }
  },
  async produce() {
    const t0 = Date.now();
    await stages.tts();
    const timeline = await stages.build();
    await renderVideo(requireSlug(), timeline);
    const report = await stages.validate();
    await stages.export(report);
    log.step(`Producción completa en ${((Date.now() - t0) / 1000).toFixed(0)} s — resultado: ${report.result}`);
    log.info("Revisa exports/<slug>/review/ y el MP4 antes de aprobar la publicación.");
  },
};

const main = async () => {
  const fn = command ? commands[command] : undefined;
  if (!fn) {
    console.log(readUsage());
    process.exitCode = command ? 1 : 0;
    return;
  }
  await fn();
};

const readUsage = () =>
  "Uso: npm run video -- <new|check|tts|build|render|validate|export|produce|list> <slug> [opciones]\nVer pipeline/cli.ts o README.md.";

main().catch((e: unknown) => {
  if (e instanceof PipelineError) log.err(e.message);
  else console.error(e);
  process.exitCode = 1;
});
