import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fadeUp, useCue, useEnter } from "../lib/anim";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";

type Props = Extract<Visual, { type: "code" }>;

const KEYWORDS: Record<string, string[]> = {
  python: ["def", "return", "if", "elif", "else", "for", "while", "in", "import", "from", "as", "class", "and", "or", "not", "True", "False", "None", "break", "continue", "pass", "with", "try", "except"],
  javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "of", "in", "import", "from", "export", "class", "new", "true", "false", "null", "undefined", "async", "await"],
  sql: ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "JOIN", "ON", "AND", "OR", "ORDER", "BY", "GROUP", "CREATE", "TABLE"],
};
const BUILTINS = ["print", "len", "range", "input", "int", "str", "float", "list", "console", "log"];

type Tok = { text: string; color: string };

export const tokenizeLine = (line: string, lang: string): Tok[] => {
  const kw = new Set(KEYWORDS[lang] ?? []);
  const re = /(#.*$|\/\/.*$|"[^"]*"?|'[^']*'?|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*|==|!=|<=|>=|[=+\-*/<>%(){}[\]:,.]|\s+)/g;
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), color: colors.text });
    const t = m[0];
    let color: string = colors.text;
    if (/^(#|\/\/)/.test(t)) color = "#64748B";
    else if (/^["']/.test(t)) color = colors.orange;
    else if (/^\d/.test(t)) color = colors.gold;
    else if (kw.has(t)) color = colors.purple;
    else if (BUILTINS.includes(t)) color = colors.cyan;
    else if (/^[A-Za-z_]/.test(t)) color = "#E2E8F0";
    else if (/^\s+$/.test(t)) color = colors.text;
    else color = colors.green;
    out.push({ text: t, color });
    last = m.index + t.length;
  }
  if (last < line.length) out.push({ text: line.slice(last), color: colors.text });
  return out;
};

export const CodeScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lines = visual.code.split("\n");
  const total = visual.code.length;
  const typeEnd = Math.min(durationInFrames * 0.4, 8 + total * 1.1);
  const typed = Math.floor(interpolate(frame, [8, typeEnd], [0, total], clamp));
  const panel = useEnter(0);
  const hlAt = useCue(visual.highlightAtWord, Math.round(typeEnd));
  const outAt = useCue(visual.outputAtWord, Math.round(typeEnd + 10));
  const noteAt = useCue(visual.noteAtWord, Math.round(typeEnd + 20));
  const outP = useEnter(outAt);
  const noteP = useEnter(noteAt);
  const hl = interpolate(frame, [hlAt, hlAt + 8], [0, 1], clamp);

  let consumed = 0;
  return (
    <AbsoluteFill
      style={{
        top: layout.contentTop,
        height: layout.contentBottom - layout.contentTop,
        justifyContent: "center",
        padding: `0 ${layout.side - 20}px`,
        gap: 34,
      }}
    >
      <div
        style={{
          borderRadius: 30,
          background: "#0B1222",
          border: `3px solid ${colors.border}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          overflow: "hidden",
          ...fadeUp(panel, 60),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 28px", background: "#111A30", borderBottom: `2px solid ${colors.border}` }}>
          {["#F87171", "#FACC15", "#4ADE80"].map((c) => (
            <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
          ))}
          <div style={{ marginLeft: 16, fontFamily: fonts.mono, fontWeight: 700, fontSize: 30, color: colors.muted }}>
            {visual.filename ?? `main.${visual.language === "python" ? "py" : visual.language === "javascript" ? "js" : visual.language}`}
          </div>
        </div>
        <div style={{ padding: "30px 28px", fontFamily: fonts.mono, fontSize: 48, lineHeight: "76px", fontWeight: 500 }}>
          {lines.map((line, i) => {
            const start = consumed;
            consumed += line.length + 1;
            const visible = Math.max(0, Math.min(line.length, typed - start));
            const isHl = visual.highlight.includes(i + 1);
            let shown = 0;
            const toks = tokenizeLine(line, visual.language);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  whiteSpace: "pre",
                  borderRadius: 12,
                  background: isHl ? `rgba(74,222,128,${0.16 * hl})` : "transparent",
                  boxShadow: isHl ? `inset 6px 0 0 rgba(74,222,128,${hl})` : "none",
                }}
              >
                <span style={{ width: 56, flex: "0 0 auto", color: "#475569", fontSize: 34, textAlign: "right", marginRight: 22 }}>{i + 1}</span>
                <span>
                  {toks.map((t, j) => {
                    const take = Math.max(0, Math.min(t.text.length, visible - shown));
                    shown += t.text.length;
                    return take > 0 ? (
                      <span key={j} style={{ color: t.color }}>
                        {t.text.slice(0, take)}
                      </span>
                    ) : null;
                  })}
                  {typed >= start && typed < start + line.length + 1 && frame < typeEnd + 4 ? (
                    <span style={{ display: "inline-block", width: 26, height: 56, background: colors.green, verticalAlign: "middle", opacity: Math.floor(frame / 8) % 2 ? 0.2 : 1 }} />
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {visual.output !== undefined ? (
        <div style={{ borderRadius: 24, background: "#020617", border: `3px solid ${colors.green}`, padding: "22px 30px", ...fadeUp(outP, 40) }}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 28, color: colors.green, letterSpacing: 2, marginBottom: 8 }}>CONSOLA</div>
          <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 56, color: colors.text, whiteSpace: "pre" }}>{visual.output}</div>
        </div>
      ) : null}
      {visual.note ? (
        <div
          style={{
            alignSelf: "center",
            padding: "20px 34px",
            borderRadius: 20,
            background: colors.gold,
            color: "#1A1300",
            fontFamily: fonts.sans,
            fontWeight: 900,
            fontSize: 46,
            rotate: "-1.5deg",
            ...fadeUp(noteP, 40),
          }}
        >
          {visual.note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
