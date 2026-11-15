/**
 * Comprobaciones previas al render: esquema, fuentes, límites de texto en pantalla
 * (para evitar desbordes) y ejecución real de los ejemplos de código.
 */
import { existsSync } from "node:fs";
import { Brief, Script } from "./script-schema";
import { log, paths, PipelineError, readJson, run } from "./util";

/** Caracteres por línea de código que caben en el editor (fuente mono 50px, 920px útiles). */
export const MAX_CODE_COLS = 28;
export const MAX_CODE_LINES = 9;

export const loadProject = (slug: string) => {
  const p = paths(slug);
  if (!existsSync(p.brief)) throw new PipelineError(`No existe ${p.brief}. Crea el video con "new".`);
  if (!existsSync(p.script))
    throw new PipelineError(`No existe ${p.script}. Claude Code debe redactar el guion (ver docs/WORKFLOW.md).`);
  const b = Brief.safeParse(readJson(p.brief));
  if (!b.success) throw new PipelineError(`brief.json inválido:\n${formatIssues(b.error.issues)}`);
  const s = Script.safeParse(readJson(p.script));
  if (!s.success) throw new PipelineError(`script.json inválido:\n${formatIssues(s.error.issues)}`);
  return { brief: b.data, script: s.data };
};

const formatIssues = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((i) => `  - ${i.path.join(".") || "(raíz)"}: ${i.message}`).join("\n");

const PYTHON_TIMEOUT_MS = 10_000;

const runPython = async (code: string) => {
  // -I: modo aislado (no carga módulos del directorio actual ni variables PYTHON*)
  const r = await Promise.race([
    run("python", ["-I", "-"], { input: code }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), PYTHON_TIMEOUT_MS)),
  ]);
  return r;
};

export const checkScript = async (slug: string) => {
  const { brief, script } = loadProject(slug);
  log.ok(`Esquema válido: ${script.scenes.length} escenas, ${script.claims.length} afirmaciones`);
  const errors: string[] = [];
  const warnings: string[] = [];

  const verified = script.claims.filter((c) => c.status === "verified").length;
  log.ok(`Afirmaciones: ${verified} verificadas con fuente, ${script.claims.length - verified} ilustrativas`);

  // Estimación de duración (≈ 2,6 palabras/s con SAPI rate 1)
  const words = script.scenes.reduce((n, s) => n + s.narration.split(/\s+/).length, 0);
  const est = words / 2.6;
  log.info(`Narración: ${words} palabras (≈ ${est.toFixed(0)} s estimados)`);
  if (est > brief.targetSeconds.max * 1.1)
    warnings.push(`La narración parece larga (≈${est.toFixed(0)} s > ${brief.targetSeconds.max} s).`);

  for (const scene of script.scenes) {
    const v = scene.visual;
    if (v.type === "code") {
      const lines = v.code.split("\n");
      if (lines.length > MAX_CODE_LINES) errors.push(`${scene.id}: ${lines.length} líneas de código (máx. ${MAX_CODE_LINES}).`);
      lines.forEach((l, i) => {
        if (l.length > MAX_CODE_COLS)
          errors.push(`${scene.id}: línea ${i + 1} de código con ${l.length} caracteres (máx. ${MAX_CODE_COLS}): "${l}"`);
      });
      for (const h of v.highlight)
        if (h > lines.length) errors.push(`${scene.id}: highlight ${h} fuera de rango.`);
      if (v.verify) {
        if (v.language !== "python") errors.push(`${scene.id}: verify solo admite python por ahora.`);
        else if (v.output === undefined) errors.push(`${scene.id}: verify=true requiere "output".`);
        else {
          try {
            const r = await runPython(v.code);
            const got = r.stdout.replace(/\r\n/g, "\n").trim();
            if (r.code !== 0) errors.push(`${scene.id}: el código falla al ejecutarse:\n${r.stderr}`);
            else if (got !== v.output.trim())
              errors.push(`${scene.id}: salida real "${got}" ≠ salida mostrada "${v.output.trim()}".`);
            else log.ok(`${scene.id}: código Python ejecutado, salida "${got}" coincide`);
          } catch (e) {
            errors.push(`${scene.id}: no se pudo ejecutar Python (${(e as Error).message}).`);
          }
        }
      }
    }
    if (v.type === "containers")
      for (const u of v.updates)
        if (!v.containers.some((c) => c.label === u.label))
          errors.push(`${scene.id}: update sobre contenedor inexistente "${u.label}".`);
  }

  warnings.forEach((w) => log.warn(w));
  if (errors.length) {
    errors.forEach((e) => log.err(e));
    throw new PipelineError(`El guion tiene ${errors.length} error(es).`);
  }
  log.ok("Guion listo para producción");
  return { brief, script };
};
