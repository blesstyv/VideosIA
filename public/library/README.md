# Biblioteca local de recursos

Aquí van el gameplay y la música que el pipeline puede elegir de forma automática.
Solo se usa un recurso si su licencia está marcada como verificada (`license.verified: true`).

## Estructura

```
public/library/
  manifest.json
  gameplay/   clips MP4 verticales u horizontales (se recortan en "cover")
  music/      pistas MP3/WAV
```

## Añadir un recurso

1. Copia el archivo a `gameplay/` o a `music/`.
2. Regístralo en `manifest.json`:

```json
{
  "items": [
    {
      "id": "parkour-01",
      "type": "gameplay",
      "file": "library/gameplay/parkour-01.mp4",
      "tags": ["parkour", "minecraft", "exploracion"],
      "description": "Parkour en mundo propio, grabado por mí",
      "license": {
        "owner": "Canal propio",
        "kind": "original-propio",
        "verified": true,
        "proof": "Grabación propia del 2026-11-20"
      }
    },
    {
      "id": "ambient-01",
      "type": "music",
      "file": "library/music/ambient-01.mp3",
      "tags": ["ambiental", "tecnologia"],
      "license": {
        "owner": "Autor",
        "kind": "licencia-comercial",
        "verified": true,
        "proof": "URL o número de la licencia",
        "attribution": "Texto de atribución, si la licencia lo pide"
      }
    }
  ]
}
```

3. En el `script.json`, pide gameplay con `"background": { "kind": "gameplay", "tags": ["parkour"] }`.
   Para la música, añade `"music": { "tags": ["ambiental"], "volume": 0.08 }` en `brief.json`.

Si no hay ningún clip compatible, la escena usa una animación gráfica original con el
aviso «Animación ilustrativa» en pantalla. Nunca se presenta como grabación real.

> Los binarios de esta carpeta están en `.gitignore`; solo se versiona `manifest.json`.
