import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fadeUp, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout, sides } from "../theme";
import { tokenizeLine } from "./CodeScene";

type Props = Extract<Visual, { type: "chat" }>;

/** Recreación genérica de un asistente/agente (sin logotipos ni interfaz real de ninguna marca). */
export const ChatScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = sides[visual.side];
  const win = useEnter(0);
  const budget = durationInFrames * 0.85;
  const promptEnd = Math.min(6 + visual.prompt.length * 0.7, budget * 0.35);
  const replyLen = visual.reply?.length ?? 0;
  const replyEnd = promptEnd + 6 + Math.min(replyLen * 0.5, budget * 0.2);
  const codeLen = visual.code?.length ?? 0;
  const codeEnd = Math.min(replyEnd + 4 + codeLen * 0.45, budget);
  const typed = (start: number, end: number, len: number) => Math.floor(interpolate(frame, [start, end], [0, len], clamp));
  const promptChars = typed(6, promptEnd, visual.prompt.length);
  const replyChars = typed(promptEnd + 6, replyEnd, replyLen);
  const codeChars = typed(replyEnd + 4, codeEnd, codeLen);
  const caret = Math.floor(frame / 8) % 2 === 0;

  let consumed = 0;
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, padding: `0 ${layout.side - 34}px`, justifyContent: "center", gap: 18 }}>
      <div
        style={{
          borderRadius: 30,
          overflow: "hidden",
          background: visual.terminal ? "#05070D" : "#0E1424",
          border: `3px solid ${s.main}`,
          boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 60px ${s.soft}`,
          ...fadeUp(win, 70),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 26px", background: "rgba(255,255,255,0.05)", borderBottom: `2px solid ${colors.border}` }}>
          {["#F87171", "#FACC15", "#4ADE80"].map((c) => (
            <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />
          ))}
          <div style={{ marginLeft: 12, fontFamily: fonts.mono, fontWeight: 700, fontSize: 28, color: s.main }}>{visual.window}</div>
        </div>
        <div style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Petición del usuario */}
          <div
            style={{
              alignSelf: visual.terminal ? "stretch" : "flex-end",
              maxWidth: visual.terminal ? "100%" : "88%",
              padding: visual.terminal ? 0 : "18px 24px",
              borderRadius: 24,
              background: visual.terminal ? "transparent" : "rgba(255,255,255,0.08)",
              fontFamily: visual.terminal ? fonts.mono : fonts.sans,
              fontWeight: 700,
              fontSize: visual.terminal ? 36 : 40,
              lineHeight: 1.3,
              color: colors.text,
            }}
          >
            {visual.terminal ? <span style={{ color: s.main }}>{"> "}</span> : null}
            {visual.prompt.slice(0, promptChars)}
            {frame < promptEnd + 4 && caret ? <span style={{ color: s.main }}>▍</span> : null}
          </div>
          {/* Respuesta */}
          {visual.reply && replyChars > 0 ? (
            <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 36, lineHeight: 1.3, color: colors.muted }}>
              <span style={{ color: s.main, fontWeight: 900 }}>● </span>
              {visual.reply.slice(0, replyChars)}
            </div>
          ) : null}
          {visual.code && codeChars > 0 ? (
            <div style={{ borderRadius: 18, background: "rgba(0,0,0,0.45)", padding: "18px 22px", fontFamily: fonts.mono, fontSize: 32, lineHeight: "48px", whiteSpace: "pre" }}>
              {visual.code.split("\n").map((line, i) => {
                const start = consumed;
                consumed += line.length + 1;
                const visible = Math.max(0, Math.min(line.length, codeChars - start));
                let shown = 0;
                return (
                  <div key={i} style={{ minHeight: 48 }}>
                    {tokenizeLine(line, visual.language).map((t, j) => {
                      const take = Math.max(0, Math.min(t.text.length, visible - shown));
                      shown += t.text.length;
                      return take > 0 ? (
                        <span key={j} style={{ color: t.color }}>
                          {t.text.slice(0, take)}
                        </span>
                      ) : null;
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ alignSelf: "center", fontFamily: fonts.sans, fontWeight: 700, fontSize: 24, color: colors.muted, opacity: win }}>
        Recreación ilustrativa · no es una captura real
      </div>
    </AbsoluteFill>
  );
};
