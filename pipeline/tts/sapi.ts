import { rmSync } from "node:fs";
import path from "node:path";
import { PipelineError, readJson, run, writeJson } from "../util";
import { spansOf, tokenAt, type Token } from "./tokens";

type SapiOut = { words: { charPos: number; charCount: number; text: string; ms: number }[] | null };

/** Voz local de Windows (System.Speech). Gratis, sin red. */
export const synthesizeSapi = async (tokens: Token[], base: string, voice: string, rate: number) => {
  const text = tokens.map((t) => t.spoken).join(" ");
  const outWav = `${base}.wav`;
  const outJson = `${base}.sapi.json`;
  const inJson = `${base}.sapi-in.json`;
  writeJson(inJson, { text, voice, rate, outWav, outJson });
  const r = await run("powershell.exe", [
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", path.join(import.meta.dirname, "sapi.ps1"),
    "-InputJson", inJson,
  ]);
  rmSync(inJson, { force: true });
  if (r.code !== 0) throw new PipelineError(`SAPI falló: ${r.stderr || r.stdout}`);

  const out = readJson<SapiOut>(outJson);
  rmSync(outJson, { force: true });
  const events = out.words ?? [];
  const spans = spansOf(tokens);
  const starts: (number | null)[] = tokens.map(() => null);
  for (const ev of events) {
    const i = tokenAt(spans, ev.charPos);
    if (i >= 0 && starts[i] == null) starts[i] = ev.ms;
  }
  if (events.length === 0) throw new PipelineError("SAPI no devolvió marcas de tiempo por palabra.");
  return { file: outWav, starts };
};
