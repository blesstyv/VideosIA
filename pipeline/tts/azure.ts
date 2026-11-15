/**
 * Proveedor Azure AI Speech (voces neurales). SDK oficial:
 * https://learn.microsoft.com/azure/ai-services/speech-service/how-to-speech-synthesis
 * Variables: AZURE_SPEECH_KEY y AZURE_SPEECH_REGION (p. ej. "eastus").
 * Nivel gratuito F0: 0,5 M caracteres neurales/mes (página oficial de precios).
 */
import { writeFileSync } from "node:fs";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { PipelineError } from "../util";
import { alignWordEvents, type Token } from "./tokens";

export type AzureConfig = {
  voice: string;
  /** Prosodia SSML, p. ej. "+6%". */
  rate: string;
  pitch: string;
  /** Estilo expresivo opcional (p. ej. "cheerful"), si la voz lo admite. */
  style?: string;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const buildSsml = (text: string, cfg: AzureConfig) => {
  const lang = cfg.voice.split("-").slice(0, 2).join("-");
  const prosody = `<prosody rate="${cfg.rate}" pitch="${cfg.pitch}">${escapeXml(text)}</prosody>`;
  const body = cfg.style ? `<mstts:express-as style="${cfg.style}">${prosody}</mstts:express-as>` : prosody;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${cfg.voice}">${body}</voice></speak>`;
};

export const synthesizeAzure = async (tokens: Token[], base: string, cfg: AzureConfig) => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new PipelineError("Faltan AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION.");

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = cfg.voice;
  // El SDK abre un WebSocket que ignora HTTPS_PROXY: se lo indicamos explícitamente.
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) {
    const p = new URL(proxy);
    const port = Number(p.port) || 80;
    if (p.username) speechConfig.setProxy(p.hostname, port, decodeURIComponent(p.username), decodeURIComponent(p.password));
    else speechConfig.setProxy(p.hostname, port);
  }
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
  // Sin AudioConfig: el audio vuelve en result.audioData (no se reproduce por altavoces).
  const synth = new sdk.SpeechSynthesizer(speechConfig, null as unknown as sdk.AudioConfig);

  const events: { text: string; ms: number }[] = [];
  synth.wordBoundary = (_s, e) => {
    if (e.boundaryType === sdk.SpeechSynthesisBoundaryType.Word) events.push({ text: e.text, ms: e.audioOffset / 10_000 });
  };

  const text = tokens.map((t) => t.spoken).join(" ");
  const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) =>
    synth.speakSsmlAsync(buildSsml(text, cfg), resolve, (err) => reject(new PipelineError(`Azure: ${err}`))),
  ).finally(() => synth.close());

  if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
    const details = sdk.CancellationDetails.fromResult(result);
    throw new PipelineError(`Azure canceló la síntesis: ${details.reason} ${details.errorDetails}`);
  }
  const file = `${base}.wav`;
  writeFileSync(file, Buffer.from(result.audioData));
  if (events.length === 0) throw new PipelineError("Azure no devolvió marcas de tiempo por palabra.");
  return { file, starts: alignWordEvents(tokens, events) };
};
