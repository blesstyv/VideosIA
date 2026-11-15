/**
 * Decodificadores mínimos para analizar medios sin dependencias extra.
 * El FFmpeg empaquetado por Remotion no trae los muxers rawvideo/s16le, pero sí
 * PNG y WAV, así que se leen esos formatos directamente.
 */
import { inflateSync } from "node:zlib";

/** Decodifica un PNG en escala de grises de 8 bits sin entrelazado. Devuelve los píxeles. */
export const decodeGrayPng = (buf: Buffer): { width: number; height: number; data: Uint8Array } => {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("No es un PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const [depth, color, , , interlace] = [body[8], body[9], body[10], body[11], body[12]];
      if (depth !== 8 || color !== 0 || interlace !== 0)
        throw new Error(`PNG no soportado (depth ${depth}, color ${color}, interlace ${interlace})`);
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(width * height);
  const stride = width;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const v = raw[row + x];
      const a = x > 0 ? out[y * stride + x - 1] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x > 0 && y > 0 ? out[(y - 1) * stride + x - 1] : 0;
      let pred = 0;
      switch (filter) {
        case 0: pred = 0; break;
        case 1: pred = a; break;
        case 2: pred = b; break;
        case 3: pred = (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default: throw new Error(`Filtro PNG desconocido: ${filter}`);
      }
      out[y * stride + x] = (v + pred) & 0xff;
    }
  }
  return { width, height, data: out };
};

/** Extrae las muestras PCM s16le del bloque "data" de un WAV. */
export const wavPcm = (buf: Buffer): Buffer => {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error("No es un WAV");
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "data") return buf.subarray(pos + 8, Math.min(buf.length, pos + 8 + size));
    pos += 8 + size + (size % 2);
  }
  throw new Error("WAV sin bloque data");
};
