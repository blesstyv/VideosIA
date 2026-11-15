import assert from "node:assert/strict";
import { test } from "node:test";
import { revealFrames } from "../../src/scenes/KineticScene";
import { buildSsml } from "../tts/azure";
import { alignWordEvents, tokenize } from "../tts/tokens";

test("alignWordEvents alinea pronunciaciones de varias palabras", () => {
  const tokens = tokenize("¿Claude o ChatGPT gratis?", { ChatGPT: "chat ge pe te", Claude: "Clod" });
  const events = ["Clod", "o", "chat", "ge", "pe", "te", "gratis"].map((text, i) => ({ text, ms: i * 100 }));
  assert.deepEqual(alignWordEvents(tokens, events), [0, 100, 200, 600]);
});

test("alignWordEvents tolera eventos que no coinciden", () => {
  const tokens = tokenize("hola mundo", {});
  assert.deepEqual(alignWordEvents(tokens, [{ text: "ruido", ms: 5 }, { text: "hola", ms: 10 }, { text: "mundo", ms: 50 }]), [10, 50]);
});

test("buildSsml escapa XML e incluye voz, prosodia y estilo", () => {
  const ssml = buildSsml("a < b & c", { voice: "es-MX-JorgeNeural", rate: "+6%", pitch: "+0%", style: "cheerful" });
  assert.match(ssml, /xml:lang="es-MX"/);
  assert.match(ssml, /<voice name="es-MX-JorgeNeural">/);
  assert.match(ssml, /a &lt; b &amp; c/);
  assert.match(ssml, /express-as style="cheerful"/);
});

test("revealFrames sincroniza el texto en pantalla con la voz", () => {
  const spoken = [{ text: "¿Claude", frame: 3 }, { text: "o", frame: 12 }, { text: "ChatGPT?", frame: 18 }];
  assert.deepEqual(revealFrames(["¿Claude", "o", "ChatGPT?", "Extra"], spoken), [3, 12, 18, 22]);
});
