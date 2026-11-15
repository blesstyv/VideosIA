import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { normalizeWord } from "../../src/lib/schema";
import { toSrt } from "../exports";
import { decodeGrayPng, wavPcm } from "../media-decode";
import { finalizeTimings, spansOf, tokenAt, tokenize } from "../tts/tokens";
import { analyzeLuma, analyzePcm } from "../validate";

test("tokenize aplica pronunciación solo a la voz y conserva la puntuación", () => {
  const t = tokenize("En Python, print(x).", { Python: "Páiton" });
  assert.deepEqual(t[1], { caption: "Python,", spoken: "Páiton," });
  assert.equal(t[2].spoken, "print(x).");
});

test("spansOf/tokenAt mapean caracteres del texto hablado a tokens", () => {
  const tokens = tokenize("hola mundo cruel", {});
  const spans = spansOf(tokens);
  assert.equal(tokenAt(spans, 0), 0);
  assert.equal(tokenAt(spans, 5), 1);
  assert.equal(tokenAt(spans, 11), 2);
});

test("finalizeTimings interpola tokens sin evento y mantiene monotonía", () => {
  const tokens = tokenize("a b c d", {});
  const w = finalizeTimings(tokens, [0, null, 400, 300], 1000);
  assert.equal(w[1].startMs, 200);
  assert.ok(w[3].startMs >= w[2].startMs);
  for (const x of w) assert.ok(x.endMs > x.startMs);
});

test("normalizeWord ignora tildes, mayúsculas y signos", () => {
  assert.equal(normalizeWord("Mayúsculas:"), "mayusculas");
  assert.equal(normalizeWord("¿Número?"), "numero");
});

test("toSrt agrupa por frase y formatea tiempos", () => {
  const caps = ["Hola", "mundo.", "Otra", "frase."].map((w, i) => ({
    text: ` ${w}`, startMs: i * 500, endMs: i * 500 + 400, timestampMs: null, confidence: null,
  }));
  const srt = toSrt(caps);
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:00,900\nHola mundo\.\n/);
  assert.match(srt, /2\n00:00:01,000 --> 00:00:01,900\nOtra frase\./);
});

const crc32 = (buf: Buffer) => {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};
const chunk = (type: string, body: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const tb = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tb));
  return Buffer.concat([len, tb, crc]);
};

test("decodeGrayPng decodifica filtros Sub y Up", () => {
  // 3x2: fila 0 con filtro Sub, fila 1 con filtro Up
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(3, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  const raw = Buffer.from([1, 10, 5, 5, 2, 1, 1, 1]);
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  const img = decodeGrayPng(png);
  assert.deepEqual([...img.data], [10, 15, 20, 11, 16, 21]);
});

test("wavPcm + analyzePcm miden nivel y pico", () => {
  const n = 1600;
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(i % 2 ? 16384 : -16384, i * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8, "ascii");
  header.writeUInt32LE(16, 16);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  const lv = analyzePcm(wavPcm(Buffer.concat([header, pcm])));
  assert.ok(Math.abs(lv.meanDb - -6.02) < 0.1);
  assert.ok(Math.abs(lv.peakDb - -6.02) < 0.1);
});

test("analyzeLuma detecta tramos negros", () => {
  const size = 54 * 96;
  const frames = [200, 0, 0, 0, 200].map((v) => Buffer.alloc(size, v));
  const r = analyzeLuma(Buffer.concat(frames));
  assert.deepEqual(r.black, [[0.25, 1]]);
});
