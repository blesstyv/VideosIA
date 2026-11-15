/**
 * Proveedor ElevenLabs (de pago). Solo se ejecuta con --allow-paid y ELEVENLABS_API_KEY.
 * Usa el endpoint "with-timestamps", que devuelve la alineación por carácter.
 * Documentación: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
 * Estado: implementado pero NO probado (no hay clave configurada en este equipo).
 */
import { writeFileSync } from "node:fs";
import { PipelineError } from "../util";
import { spansOf, tokenAt, type Token } from "./tokens";

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export const synthesizeElevenLabs = async (
  tokens: Token[],
  base: string,
  cfg: { voiceId: string; modelId: string } | undefined,
) => {
  if (!cfg) throw new PipelineError("Configura brief.tts.elevenlabs.voiceId para usar ElevenLabs.");
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new PipelineError("Falta ELEVENLABS_API_KEY.");
  const text = tokens.map((t) => t.spoken).join(" ");
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cfg.voiceId)}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: cfg.modelId,
        language_code: "es",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) throw new PipelineError(`ElevenLabs respondió ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { audio_base64: string; alignment: Alignment | null };
  const file = `${base}.mp3`;
  writeFileSync(file, Buffer.from(data.audio_base64, "base64"));

  const spans = spansOf(tokens);
  const starts: (number | null)[] = tokens.map(() => null);
  const al = data.alignment;
  if (al) {
    al.characters.forEach((ch, idx) => {
      if (/\s/.test(ch)) return;
      const i = tokenAt(spans, idx);
      if (i >= 0 && starts[i] == null) starts[i] = al.character_start_times_seconds[idx] * 1000;
    });
  }
  return { file, starts };
};
