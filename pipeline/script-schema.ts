/**
 * Esquema del brief (entrada del usuario) y del guion (redactado por Claude Code
 * tras investigar el tema). Ambos viven en content/videos/<slug>/.
 */
import { z } from "zod";
import { BackgroundSpec, TransitionKind, Visual } from "../src/lib/schema";

export const Category = z.enum(["programacion", "ia", "hardware", "videojuegos", "ciberseguridad-dev"]);
export const Platform = z.enum(["tiktok", "reels", "shorts", "todas"]);

export const Brief = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug: minúsculas, números y guiones"),
  topic: z.string().min(5),
  category: Category,
  platform: Platform.default("todas"),
  style: z.string().default("tecnológico, dinámico, claro"),
  targetSeconds: z
    .object({ min: z.number().min(15), max: z.number().max(180) })
    .default({ min: 30, max: 90 }),
  fps: z.union([z.literal(30), z.literal(60)]).default(30),
  tts: z
    .object({
      provider: z.enum(["sapi", "azure", "elevenlabs"]).default("sapi"),
      azure: z
        .object({
          voice: z.string().default("es-MX-JorgeNeural"),
          rate: z.string().regex(/^[+-]\d{1,2}%$/).default("+6%"),
          pitch: z.string().regex(/^[+-]\d{1,2}%$/).default("+0%"),
          style: z.string().optional(),
          /** true si el recurso de Azure es F0 (gratuito): no se pide --allow-paid. */
          freeTier: z.boolean().default(false),
        })
        .optional(),
      voice: z.string().default("Microsoft Sabina Desktop"),
      /** Velocidad SAPI: -10 (lento) a 10 (rápido). */
      rate: z.number().int().min(-10).max(10).default(1),
      elevenlabs: z
        .object({
          voiceId: z.string(),
          modelId: z.string().default("eleven_multilingual_v2"),
        })
        .optional(),
    })
    .default({ provider: "sapi", voice: "Microsoft Sabina Desktop", rate: 1 }),
  music: z
    .object({ tags: z.array(z.string()).default([]), volume: z.number().min(0).max(0.3).default(0.08) })
    .optional(),
  /** Efectos de sonido sintetizados (whoosh, pop, impacto). */
  sfx: z.boolean().default(true),
});
export type Brief = z.infer<typeof Brief>;

export const Source = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  accessed: z.string(),
});

export const Claim = z.object({
  text: z.string(),
  /** verified: respaldado por fuentes. illustrative: analogía/ejemplo didáctico. */
  status: z.enum(["verified", "illustrative"]),
  sources: z.array(z.string()).default([]),
  sceneIds: z.array(z.string()).default([]),
});

export const Scene = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  section: z.enum(["intro", "desarrollo", "ejemplo", "cierre"]),
  narration: z.string().min(3),
  visual: Visual,
  background: BackgroundSpec.default({ kind: "aurora" }),
  transitionIn: TransitionKind.default("fade"),
});
export type Scene = z.infer<typeof Scene>;

export const Script = z
  .object({
    title: z.string(),
    /** Aviso fijo en pantalla, p. ej. "Datos oficiales · nov. 2026". */
    stamp: z.string().max(40).optional(),
    /** Reemplazos solo para la voz (palabra -> pronunciación). Los subtítulos no cambian. */
    pronunciation: z.record(z.string(), z.string()).default({}),
    scenes: z.array(Scene).min(2),
    claims: z.array(Claim).min(1),
    sources: z.array(Source).default([]),
    publish: z.object({
      title: z.string().max(100),
      description: z.string().max(2200),
      hashtags: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(3).max(10),
    }),
  })
  .superRefine((s, ctx) => {
    const ids = new Set<string>();
    for (const sc of s.scenes) {
      if (ids.has(sc.id)) ctx.addIssue({ code: "custom", message: `Escena duplicada: ${sc.id}` });
      ids.add(sc.id);
    }
    const sourceIds = new Set(s.sources.map((x) => x.id));
    for (const c of s.claims) {
      if (c.status === "verified" && c.sources.length === 0)
        ctx.addIssue({ code: "custom", message: `Afirmación verificada sin fuente: "${c.text}"` });
      for (const id of c.sources)
        if (!sourceIds.has(id)) ctx.addIssue({ code: "custom", message: `Fuente inexistente: ${id}` });
      for (const id of c.sceneIds)
        if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `Escena inexistente en claim: ${id}` });
    }
    const sections = new Set(s.scenes.map((x) => x.section));
    for (const req of ["intro", "desarrollo", "ejemplo", "cierre"] as const)
      if (!sections.has(req))
        ctx.addIssue({ code: "custom", message: `Falta la sección "${req}" en el guion` });
  });
export type Script = z.infer<typeof Script>;
