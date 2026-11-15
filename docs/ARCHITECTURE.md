# Arquitectura

```
brief.json ──► [check] ──► [tts] ──► [build] ──► [render] ──► [validate] ──► [export]
script.json      │           │          │            │             │             │
 (Claude Code)   │      audio WAV +     timeline   MP4 H.264    informe +     SRT, guion,
                 │      tiempos por     .json      + AAC        fotogramas    metadatos
            ejecuta el   palabra        (Zod)    (Remotion)
            código Python
```

## Decisiones

- **Una sola composición data-driven (`ShortVideo`)**: el contenido llega por un timeline JSON
  validado con Zod (`src/lib/schema.ts`), compartido por el pipeline y por Remotion. Un video nuevo
  no requiere tocar React.
- **La duración la marca el audio**: cada escena dura lo que su narración más un pequeño margen.
  Las transiciones alargan la escena saliente lo que dura el solape, así cada visual empieza
  exactamente con su voz. El audio se coloca en posiciones absolutas, fuera de `TransitionSeries`.
- **Tiempos por palabra reales**: SAPI emite `SpeakProgress` con la posición del audio. Se comprobó
  que solo coincide con el WAV a **16 kHz** (a 22/44 kHz los tiempos salen escalados). De esos
  tiempos salen los subtítulos y los *cues* `atWord`.
- **Caché por escena**: hash de proveedor, voz, texto y pronunciación. Cambiar una escena regenera solo esa.
- **FFmpeg de Remotion**: evita instalar binarios del sistema. No incluye `volumedetect`,
  `blackdetect`, `select`, `tile` ni los muxers `rawvideo`/`s16le`, así que el análisis de luminancia
  y audio se hace en Node leyendo PNG en gris y WAV (`pipeline/media-decode.ts`).
- **Color**: se renderiza con `--color-space=bt709` para obtener `yuv420p` con rango TV estándar
  (sin ese flag sale `yuvj420p`, de rango completo).
- **Recursos**: solo se usan elementos de `public/library/manifest.json` con licencia verificada;
  si no hay gameplay, se usa una animación original con el aviso «Animación ilustrativa».
- **Seguridad**: los procesos se lanzan sin shell (rutas con espacios). Python se ejecuta con `-I`
  (aislado) y con timeout. Las APIs de pago exigen `--allow-paid`. Nada se publica automáticamente.

## Zonas seguras (1080×1920)

- Contenido: y 210–1240 · márgenes laterales de 84 px.
- Subtítulos: y 1290–1540, con fondo semiopaco.
- Los ~380 px inferiores quedan libres para la interfaz de cada plataforma.
