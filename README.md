# Tech Content Studio AI

Sistema de producción de videos educativos verticales (TikTok, Reels, Shorts), coordinado
por Claude Code. A partir de un tema, investiga, escribe el guion, narra, anima con
Remotion, renderiza un MP4 H.264/AAC 1080×1920 y lo valida.

## Requisitos

- Windows 10/11 con PowerShell (voz local SAPI) · Node.js ≥ 20 · Python 3 (verifica los ejemplos de código)
- FFmpeg/FFprobe: **no hace falta instalarlos**, se usan los que trae Remotion (`npx remotion ffmpeg`).

```bash
npm install
```

## Uso rápido

```bash
npm run video -- produce variable-minecraft     # proceso completo del piloto
npm run video -- produce variable-minecraft --fps 60
npm run dev                                     # Remotion Studio para previsualizar
```

| Comando | Qué hace |
|---|---|
| `new <slug> --topic "..." --category programacion` | Crea `content/videos/<slug>/brief.json` |
| `check <slug>` | Valida el guion, las fuentes y los límites de texto, y ejecuta el código Python |
| `tts <slug> [--scene id,id] [--force]` | Narración por escena, en caché (solo regenera lo que cambió) |
| `build <slug> [--fps 60]` | Construye el timeline (tiempos, subtítulos, cues, recursos) |
| `render <slug> [--scene id]` | MP4 completo, o solo el tramo de una escena (preview) |
| `validate <slug>` | Comprueba el códec, la resolución, la duración, los negros, los silencios, los niveles y la sincronía, y extrae los fotogramas de revisión |
| `export <slug>` | Guion, SRT, título, descripción, hashtags, fuentes y metadatos |
| `produce <slug>` | Todo lo anterior en orden |
| `list` | Estado de cada video |

Categorías: `programacion`, `ia`, `hardware`, `videojuegos`, `ciberseguridad-dev`.

## Flujo con Claude Code

1. Pide: *«Crea un video: Explica qué es un algoritmo usando Minecraft»*.
2. Claude Code ejecuta `new`, investiga en fuentes oficiales y redacta `script.json`
   (escenas, narración, visuales, afirmaciones con fuentes, metadatos de publicación).
3. Ejecuta `produce`, revisa los fotogramas de `exports/<slug>/review/` y corrige lo necesario.
4. **Tú** revisas el MP4 y decides si se publica. Nada se publica automáticamente.

Detalle completo: [docs/WORKFLOW.md](docs/WORKFLOW.md). Arquitectura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Estructura

```
content/videos/<slug>/   brief.json (entrada) + script.json (guion y storyboard)
pipeline/                CLI y etapas: check, tts, timeline, render, validate, exports
src/                     Remotion: composición genérica ShortVideo + escenas reutilizables
public/library/          gameplay y música autorizados (manifest.json con licencias)
public/generated/<slug>/ audio y timeline generados (regenerables, no versionados)
exports/<slug>/          MP4, script.md, captions.srt/json, title/description/hashtags.txt,
                         sources.md, metadata.json, validation-report.json, review/, project/
```

## Regenerar partes

- Cambiaste la narración de una escena → `tts` regenera solo esa escena (caché por hash).
- Cambiaste solo visuales → `build` + `render` (el audio no se toca).
- Revisar una escena → `render <slug> --scene actualizar` → `exports/<slug>/previews/`.

## Voz

- `azure` (recomendado): voces neurales es-MX (Jorge, Dalia…), naturales y con tiempos por palabra.
  Configuración y costo en [docs/VOZ.md](docs/VOZ.md). Claves en `.env` (ver `.env.example`).
- `sapi`: voz local de Windows. Gratis y sin conexión, pero robótica; útil para previsualizar
  (`--provider sapi` sin tocar el brief).
- `elevenlabs`: de pago; requiere `ELEVENLABS_API_KEY` y `--allow-paid`.

Prueba de voces: `npm run video -- voice-test --free-tier`.

## Efectos de sonido

`whoosh`, `pop` e `impact` se sintetizan por código en `public/sfx/` (originales, sin licencias de
terceros) y se colocan solos en transiciones y revelados. Se desactivan con `"sfx": false` en el brief.

## Licencia de Remotion

Remotion es gratuito para personas y equipos de hasta 3 personas; las empresas más
grandes necesitan una licencia de empresa (https://www.remotion.dev/license).
