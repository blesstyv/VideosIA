/** Utilidades puras de tokenización y tiempos por palabra (compartidas por proveedores). */
export type WordTiming = { text: string; startMs: number; endMs: number };

/** Una palabra de la narración: texto para subtítulos y texto a pronunciar. */
export type Token = { caption: string; spoken: string };

export const tokenize = (narration: string, pronunciation: Record<string, string>): Token[] => {
  const lookup = new Map(Object.entries(pronunciation).map(([k, v]) => [k.toLowerCase(), v]));
  return narration
    .split(/\s+/)
    .filter(Boolean)
    .map((caption) => {
      const m = caption.match(/^([¿¡"'(«]*)(.*?)([.,;:!?"')»…]*)$/u);
      const [, pre = "", core = caption, post = ""] = m ?? [];
      const rep = lookup.get(core.toLowerCase());
      return { caption, spoken: rep ? `${pre}${rep}${post}` : caption };
    });
};

/** Distribuye tiempos a tokens sin evento (p. ej. signos sueltos) y fija los finales. */
export const finalizeTimings = (
  tokens: Token[],
  starts: (number | null)[],
  audioMs: number,
): WordTiming[] => {
  const s = [...starts];
  if (s[0] == null) s[0] = 0;
  for (let i = 1; i < s.length; i++) {
    if (s[i] != null) continue;
    let j = i;
    while (j < s.length && s[j] == null) j++;
    const prev = s[i - 1]!;
    const next = j < s.length ? s[j]! : Math.min(audioMs, prev + 400 * (j - i + 1));
    for (let k = i; k < j; k++) s[k] = prev + ((next - prev) * (k - i + 1)) / (j - i + 1);
  }
  // Monotonía estricta
  for (let i = 1; i < s.length; i++) if (s[i]! < s[i - 1]!) s[i] = s[i - 1]!;
  return tokens.map((t, i) => {
    const startMs = Math.round(s[i]!);
    const nextStart = i + 1 < s.length ? s[i + 1]! : Math.min(audioMs, startMs + 700);
    return { text: t.caption, startMs, endMs: Math.round(Math.max(startMs + 80, nextStart)) };
  });
};

/** Índice de token para un carácter del texto hablado (tokens unidos por un espacio). */
export const spansOf = (tokens: Token[]) => {
  const spans: { start: number; end: number }[] = [];
  let pos = 0;
  for (const t of tokens) {
    spans.push({ start: pos, end: pos + t.spoken.length });
    pos += t.spoken.length + 1;
  }
  return spans;
};
export const tokenAt = (spans: { start: number; end: number }[], charPos: number) =>
  spans.findIndex((sp) => charPos >= sp.start && charPos < sp.end + 1);


const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

/**
 * Alinea eventos de palabra (texto + ms) con los tokens de forma secuencial.
 * Sirve para proveedores cuyo offset de texto no es fiable (SSML, escapes) y
 * para pronunciaciones de varias palabras ("ChatGPT" -> "chat ge pe te").
 */
export const alignWordEvents = (tokens: Token[], events: { text: string; ms: number }[]): (number | null)[] => {
  const sub: { token: number; w: string }[] = [];
  tokens.forEach((t, i) => {
    for (const w of t.spoken.split(/[\s-]+/)) {
      const n = norm(w);
      if (n) sub.push({ token: i, w: n });
    }
  });
  const starts: (number | null)[] = tokens.map(() => null);
  let p = 0;
  for (const ev of events) {
    const e = norm(ev.text);
    if (!e) continue;
    for (let k = p; k < Math.min(sub.length, p + 5); k++) {
      if (sub[k].w === e || sub[k].w.startsWith(e) || e.startsWith(sub[k].w)) {
        if (starts[sub[k].token] == null) starts[sub[k].token] = ev.ms;
        p = k + 1;
        break;
      }
    }
  }
  return starts;
};
