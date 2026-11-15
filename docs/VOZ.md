# Voz neural con Azure AI Speech

## 1. Crear la clave (≈10 minutos, lo haces tú)

1. Entra a https://portal.azure.com e inicia sesión o crea una cuenta. Azure pide una tarjeta para verificar identidad.
2. Busca **«Speech service»** (Servicios de Voz) → **Crear**.
3. Elige una región (por ejemplo, `East US`) y el plan de tarifa **Free F0** si está disponible.
4. Al terminar, abre el recurso → **Claves y punto de conexión** → copia la **Clave 1** y la **Región**.
5. Crea el archivo `.env` en la raíz del proyecto (copia `.env.example`):

```
AZURE_SPEECH_KEY=tu_clave
AZURE_SPEECH_REGION=eastus
```

`.env` está en `.gitignore` y no se sube a Git. No compartas la clave en el chat.

6. Si tu recurso es **F0 (gratuito)**, marca `"freeTier": true` en `brief.tts.azure`.
   Si es **S0 (pago)**, deja `false`: el pipeline exigirá `--allow-paid` y mostrará los caracteres a sintetizar.

## 2. Costo (verifícalo en la página oficial)

- Página oficial: https://azure.microsoft.com/pricing/details/speech/
- F0: 0,5 millones de caracteres neurales gratis al mes (dato de la página oficial a nov. 2026).
- Un video de 75 s tiene ≈ 1.300 caracteres → caben cientos de videos al mes en F0.
- **Uso comercial con F0: no está claro.** En los foros de Microsoft hay respuestas contradictorias sobre si
  el audio de un recurso gratuito puede usarse en un canal monetizado. Si vas a monetizar, revisa los
  *Product Terms* de Microsoft o usa un recurso S0.

## 3. Elegir la voz

```bash
npm run video -- voice-test --free-tier
npm run video -- voice-test --free-tier --voices es-MX-JorgeNeural,es-MX-DaliaNeural --rate +8%
```

Las muestras quedan en `exports/_voice-tests/`. Cambia `brief.tts.azure.voice` con la que prefieras.
Si la voz admite estilos expresivos (p. ej. `cheerful`), puedes poner `"style": "cheerful"` en el brief.

## 4. Producir con Azure

```bash
npm run video -- produce claude-vs-chatgpt-programacion
```

Mientras no haya clave, puedes previsualizar con la voz local:

```bash
npm run video -- produce claude-vs-chatgpt-programacion --provider sapi
```

## Pronunciación

`script.json → pronunciation` cambia solo lo que se dice, no los subtítulos. Ejemplo:
`"ChatGPT": "chat ge pe te"`, `"Claude": "Clod"`. Ajusta después de escuchar la primera versión.
