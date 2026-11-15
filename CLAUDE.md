# Tech Content Studio AI — instrucciones para Claude Code

Cuando el usuario pida un video nuevo («Explica X usando Y»):

1. `npm run video -- new <slug> --topic "..." --category <cat>` (pregunta la duración si no la indica; por defecto 30-90 s).
2. Investiga en fuentes primarias (documentación oficial, fabricantes, especificaciones). No inventes datos ni noticias.
3. Redacta `content/videos/<slug>/script.json` siguiendo `docs/WORKFLOW.md`:
   - Secciones intro, desarrollo, ejemplo y cierre. Narración en español latinoamericano natural, ~150 palabras por minuto.
   - Cada dato técnico va en `claims` como `verified` con sus fuentes; las analogías, como `illustrative`.
   - Los ejemplos de código Python llevan `verify: true` y `output`.
   - Si Minecraft no es esencial, no lo fuerces.
4. `npm run video -- produce <slug>`. Si falla, corrige el guion o el código y repite.
5. Revisa con Read los JPG de `exports/<slug>/review/` (texto cortado, solapes, legibilidad) y corrige.
6. Informa del resultado. **Nunca publiques**: la publicación la hace el usuario tras su aprobación.

Reglas:
- No uses APIs de pago (`--allow-paid`) sin informar del costo y sin autorización explícita.
- No descargues ni uses material de terceros sin licencia verificada en `public/library/manifest.json`.
- Una exportación exitosa no prueba la calidad: revisa siempre los fotogramas.
- `npm run typecheck`, `npm test` y `npm run lint` deben pasar tras cambiar el código.
