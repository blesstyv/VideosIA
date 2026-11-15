# Flujo de producción de un video

## 1. Brief (entrada)

```bash
npm run video -- new algoritmo-minecraft --topic "Explica qué es un algoritmo usando Minecraft" --category programacion --min 45 --max 75
```

Campos de `brief.json`: `topic`, `category`, `platform` (`tiktok|reels|shorts|todas`),
`style`, `targetSeconds {min,max}`, `fps` (30|60), `tts` y `music` (opcional).

## 2. Investigación (Claude Code)

- Consulta fuentes primarias: documentación oficial, especificaciones y fabricantes.
- Cada dato técnico va a `claims` con `status: "verified"` y los ids de sus `sources`.
- Las analogías y los ejemplos didácticos van con `status: "illustrative"`.
- No se inventan cifras ni noticias. Si un dato no se puede verificar, se quita del guion.

## 3. Guion (`script.json`)

Estructura obligatoria: al menos una escena de cada sección `intro`, `desarrollo`, `ejemplo` y `cierre`.

```jsonc
{
  "title": "...",
  "pronunciation": { "Python": "Páiton" },     // solo cambia la voz, no los subtítulos
  "scenes": [
    {
      "id": "concepto",                         // [a-z0-9-]
      "section": "desarrollo",
      "narration": "Texto que se narra y se subtitula.",
      "background": { "kind": "grid" | "blocks" | "gameplay", "tags": ["parkour"] },
      "transitionIn": "fade" | "slide" | "wipe" | "none",
      "visual": { "type": "...", ... }
    }
  ],
  "claims": [...], "sources": [...],
  "publish": { "title": "...", "description": "...", "hashtags": ["#..."] }
}
```

### Visuales disponibles

| type | Campos | Uso |
|---|---|---|
| `title` | `kicker?`, `title` (marca palabras con `*asteriscos*`), `subtitle?` | Gancho inicial |
| `bullets` | `heading`, `items[{text, atWord?}]` (máx. 4) | Listas, reglas, pasos |
| `code` | `language`, `code` (≤ 9 líneas, ≤ 28 col.), `highlight[]`, `highlightAtWord?`, `output?`, `outputAtWord?`, `verify`, `note?`, `noteAtWord?` | Código con tecleo, resaltado y consola |
| `containers` | `heading?`, `containers[{label,value}]` (máx. 2), `updates[{label,value,delta?,atWord}]`, `footnote?` | Variables, memoria, inventarios |
| `outro` | `title`, `points[]` (máx. 3), `cta` | Cierre |
| `kinetic` | `text`, `emphasis[]`, `size` (xl/lg/md), `eyebrow?` | Gancho y frases clave; cada palabra aparece cuando se pronuncia |
| `versus` | `title`, `left`, `right`, `rows[{label,left,right,edge,atWord?}]` (máx. 3) | Comparativa cara a cara; `edge` solo si los datos lo respaldan |
| `pricing` | `title`, `plans[{side,brand,name,price,from?,note?,highlight?,atWord?}]` (máx. 4) | Tarjetas de precio con contador |
| `chat` | `window`, `side` (a/b/n), `terminal`, `prompt`, `reply?`, `code?` | Recreación genérica de un asistente (lleva el aviso «Recreación ilustrativa») |
| `bignumber` | `value`, `prefix`, `suffix`, `label`, `atWord?` | Cifra protagonista con contador |
| `verdict` | `title`, `items[{profile,pick,atWord?}]` (máx. 3) | Recomendación por perfil |

Fondos: `aurora` (por defecto), `grid`, `blocks`, `gameplay`. Todas las escenas llevan movimiento de
cámara automático (punch-in + zoom lento). Para el ritmo: escenas de 3–9 s, una idea por escena.
`stamp` en el guion muestra un aviso fijo (p. ej. «Datos oficiales · 15 nov 2026»).

`atWord` sincroniza una animación con la palabra exacta de la narración (sin importar
tildes ni mayúsculas). Si la palabra no existe en la narración de esa escena, `build` falla.

Con `verify: true` (Python), `check` ejecuta el código y exige que la salida coincida con `output`.

### Nuevos tipos de escena

1. Añade el esquema Zod en `src/lib/schema.ts` (unión `Visual`).
2. Crea el componente en `src/scenes/` y regístralo en `SceneVisual` (`src/ShortVideo.tsx`).
3. Si usa cues, añádelos en `collectCues` (`pipeline/timeline.ts`).

## 4. Producción

```bash
npm run video -- produce <slug>
```

## 5. Revisión (obligatoria antes de publicar)

1. `exports/<slug>/validation-report.json`: resultado técnico.
2. `exports/<slug>/review/index.html`: dos fotogramas por escena (texto fuera de pantalla, solapes).
3. El MP4 completo con audio: pronunciación, ritmo y sincronía.
4. `sources.md`: exactitud técnica.
5. Al aprobar, publica tú usando `title.txt`, `description.txt` y `hashtags.txt`.
