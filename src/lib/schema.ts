/**
 * Esquemas compartidos entre el pipeline (Node) y las composiciones (Remotion).
 * El guion (script.json) usa los mismos "visuales" que recibe la composición,
 * por lo que un video nuevo no requiere tocar código de React.
 */
import { z } from "zod";

export const TransitionKind = z.enum(["fade", "slide", "wipe", "none"]);

export const BackgroundSpec = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("aurora") }),
  z.object({ kind: z.literal("grid") }),
  z.object({ kind: z.literal("blocks") }),
  z.object({
    kind: z.literal("gameplay"),
    /** Etiquetas para buscar en la biblioteca local (parkour, construccion...). */
    tags: z.array(z.string()).default([]),
  }),
]);

const Cue = z.string().min(1).optional();

export const TitleVisual = z.object({
  type: z.literal("title"),
  kicker: z.string().max(28).optional(),
  title: z.string().min(1).max(70),
  subtitle: z.string().max(80).optional(),
});

export const BulletsVisual = z.object({
  type: z.literal("bullets"),
  heading: z.string().max(40),
  items: z
    .array(
      z.object({
        text: z.string().max(42),
        /** Palabra de la narración en la que aparece el elemento. */
        atWord: Cue,
      }),
    )
    .min(1)
    .max(4),
});

export const CodeVisual = z.object({
  type: z.literal("code"),
  language: z.enum(["python", "javascript", "html", "css", "sql", "text"]),
  filename: z.string().max(24).optional(),
  code: z.string().min(1),
  /** Líneas (1-indexadas) a resaltar. */
  highlight: z.array(z.number().int().positive()).default([]),
  highlightAtWord: Cue,
  /** Salida esperada; si verify=true el pipeline ejecuta el código y la compara. */
  output: z.string().optional(),
  outputAtWord: Cue,
  verify: z.boolean().default(false),
  note: z.string().max(40).optional(),
  noteAtWord: Cue,
});

export const ContainersVisual = z.object({
  type: z.literal("containers"),
  heading: z.string().max(40).optional(),
  containers: z
    .array(
      z.object({
        label: z.string().max(14),
        value: z.string().max(8),
        /** Muestra iconos de gema según el valor numérico (máx. 12). */
        showGems: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(2),
  updates: z
    .array(
      z.object({
        label: z.string(),
        value: z.string().max(8),
        delta: z.string().max(6).optional(),
        atWord: z.string(),
      }),
    )
    .default([]),
  footnote: z.string().max(48).optional(),
  footnoteAtWord: Cue,
});

export const OutroVisual = z.object({
  type: z.literal("outro"),
  title: z.string().max(60),
  points: z.array(z.string().max(40)).max(3).default([]),
  cta: z.string().max(40),
});

/** Lados de una comparación: A (cálido) y B (frío). Sin logotipos de marca. */
export const Side = z.enum(["a", "b"]);

export const KineticVisual = z.object({
  type: z.literal("kinetic"),
  /** Texto en pantalla; cada palabra aparece cuando se pronuncia (o escalonada si no está en la narración). */
  text: z.string().min(1).max(90),
  /** Palabras a resaltar con el color de acento. */
  emphasis: z.array(z.string()).default([]),
  size: z.enum(["xl", "lg", "md"]).default("lg"),
  /** Etiqueta pequeña sobre el texto. */
  eyebrow: z.string().max(36).optional(),
});

export const VersusVisual = z.object({
  type: z.literal("versus"),
  title: z.string().max(36),
  left: z.string().max(14),
  right: z.string().max(14),
  rows: z
    .array(
      z.object({
        label: z.string().max(22),
        left: z.string().max(34),
        right: z.string().max(34),
        /** Ventaja objetiva en esta fila (solo si los datos la respaldan). */
        edge: z.enum(["left", "right", "tie", "none"]).default("none"),
        atWord: Cue,
      }),
    )
    .min(1)
    .max(3),
  footnote: z.string().max(60).optional(),
});

export const PricingVisual = z.object({
  type: z.literal("pricing"),
  title: z.string().max(36),
  plans: z
    .array(
      z.object({
        side: Side,
        brand: z.string().max(10),
        name: z.string().max(14),
        price: z.number().nonnegative(),
        prefix: z.string().max(6).default("$"),
        period: z.string().max(12).default("/mes"),
        from: z.boolean().default(false),
        note: z.string().max(34).optional(),
        highlight: z.boolean().default(false),
        atWord: Cue,
      }),
    )
    .min(1)
    .max(4),
  footnote: z.string().max(60).optional(),
});

export const ChatVisual = z.object({
  type: z.literal("chat"),
  /** Título genérico de la ventana (sin logotipos). */
  window: z.string().max(28),
  /** "n" = neutral (escena que representa a ambos). */
  side: z.enum(["a", "b", "n"]).default("n"),
  prompt: z.string().max(80),
  reply: z.string().max(90).optional(),
  code: z.string().max(260).optional(),
  language: z.enum(["python", "javascript", "html", "css", "sql", "text"]).default("javascript"),
  /** Siempre se muestra el aviso de recreación ilustrativa. */
  terminal: z.boolean().default(false),
});

export const BigNumberVisual = z.object({
  type: z.literal("bignumber"),
  value: z.number(),
  prefix: z.string().max(4).default(""),
  suffix: z.string().max(8).default(""),
  label: z.string().max(40),
  atWord: Cue,
});

export const VerdictVisual = z.object({
  type: z.literal("verdict"),
  title: z.string().max(30),
  items: z
    .array(
      z.object({
        profile: z.string().max(22),
        pick: z.string().max(24),
        atWord: Cue,
      }),
    )
    .min(1)
    .max(3),
  footnote: z.string().max(60).optional(),
});

/**
 * Ilustración animada a medida (personajes, objetos, metáforas visuales).
 * `art` elige el componente; `beats` sincroniza cada momento con una palabra de la narración.
 */
export const IllustrationVisual = z.object({
  type: z.literal("illustration"),
  art: z.enum(["hook", "research", "free", "agent", "paid", "quota", "tiers", "verdict", "outro"]),
  /** id del momento -> palabra de la narración en la que ocurre. */
  beats: z.record(z.string(), z.string()).default({}),
  /** Aviso pequeño (p. ej. «Recreación ilustrativa»). */
  note: z.string().max(40).optional(),
});

export const Visual = z.discriminatedUnion("type", [
  IllustrationVisual,
  TitleVisual,
  BulletsVisual,
  CodeVisual,
  ContainersVisual,
  OutroVisual,
  KineticVisual,
  VersusVisual,
  PricingVisual,
  ChatVisual,
  BigNumberVisual,
  VerdictVisual,
]);
export type Visual = z.infer<typeof Visual>;

export const CaptionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
  /** Fuerza una página nueva de subtítulos (fin de frase o de escena). */
  pageBreakAfter: z.boolean().optional(),
});

/** Fondo ya resuelto por el selector de recursos. */
export const ResolvedBackground = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("aurora") }),
  z.object({ kind: z.literal("grid") }),
  z.object({ kind: z.literal("blocks") }),
  z.object({
    kind: z.literal("gameplay-video"),
    src: z.string(),
    assetId: z.string(),
    durationInFrames: z.number().int().positive(),
  }),
  /** Sin gameplay disponible: animación gráfica, etiquetada como ilustrativa. */
  z.object({ kind: z.literal("gameplay-illustration") }),
]);
export type ResolvedBackground = z.infer<typeof ResolvedBackground>;

export const TimelineScene = z.object({
  id: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  /** Duración visual (incluye el solape de la transición de salida). */
  visualDurationInFrames: z.number().int().positive(),
  audioSrc: z.string(),
  audioDurationInFrames: z.number().int().positive(),
  transitionIn: TransitionKind,
  background: ResolvedBackground,
  visual: Visual,
  /** Palabra normalizada -> frame relativo a la escena (primera aparición). */
  cues: z.record(z.string(), z.number()),
  /** Palabras narradas con su frame relativo (para texto cinético). */
  words: z.array(z.object({ text: z.string(), frame: z.number() })).default([]),
});
export type TimelineScene = z.infer<typeof TimelineScene>;

export const Timeline = z.object({
  version: z.literal(1),
  slug: z.string(),
  category: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  fps: z.number().int(),
  durationInFrames: z.number().int().positive(),
  transitionFrames: z.number().int().nonnegative(),
  scenes: z.array(TimelineScene).min(1),
  captions: z.array(CaptionSchema),
  music: z
    .object({ src: z.string(), volume: z.number().min(0).max(1), assetId: z.string() })
    .nullable(),
  /** Efectos de sonido originales (generados por el pipeline). */
  sfx: z.array(z.object({ src: z.string(), frame: z.number().int().nonnegative(), volume: z.number() })).default([]),
  /** Texto de aviso permanente opcional (p. ej. "Datos a nov. 2026"). */
  stamp: z.string().max(40).optional(),
});
export type Timeline = z.infer<typeof Timeline>;

export const ShortVideoProps = z.object({
  /** Ruta dentro de public/ del timeline generado por el pipeline. */
  timelineFile: z.string(),
});
export type ShortVideoProps = z.infer<typeof ShortVideoProps>;

/** Normaliza una palabra para buscar "cues" (sin tildes, signos ni mayúsculas). */
export const normalizeWord = (w: string): string =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ_+=-]/g, "");
