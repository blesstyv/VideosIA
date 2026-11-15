import React from "react";
import { AbsoluteFill } from "remotion";
import type { Visual } from "../lib/schema";
import { colors, fonts, layout } from "../theme";
import { AgentArt } from "./illustrations/AgentArt";
import { HookArt } from "./illustrations/HookArt";
import { ResearchArt } from "./illustrations/ResearchArt";
import { FreeArt } from "./illustrations/FreeArt";
import { PaidArt } from "./illustrations/PaidArt";
import { QuotaArt } from "./illustrations/QuotaArt";
import { TiersArt } from "./illustrations/TiersArt";
import { VerdictArt } from "./illustrations/VerdictArt";
import { OutroArt } from "./illustrations/OutroArt";

type Props = Extract<Visual, { type: "illustration" }>;

/** Escena de ilustración animada: elige el dibujo según `art`. */
export const IllustrationScene: React.FC<{ visual: Props }> = ({ visual }) => {
  const art = (() => {
    switch (visual.art) {
      case "hook":
        return <HookArt beats={visual.beats} />;
      case "agent":
        return <AgentArt beats={visual.beats} />;
      case "research":
        return <ResearchArt beats={visual.beats} />;
      case "free":
        return <FreeArt beats={visual.beats} />;
      case "paid":
        return <PaidArt beats={visual.beats} />;
      case "quota":
        return <QuotaArt beats={visual.beats} />;
      case "tiers":
        return <TiersArt beats={visual.beats} />;
      case "verdict":
        return <VerdictArt beats={visual.beats} />;
      case "outro":
        return <OutroArt beats={visual.beats} />;
    }
  })();
  return (
    <AbsoluteFill style={{ top: layout.contentTop, height: layout.contentBottom - layout.contentTop, alignItems: "center" }}>
      {art}
      {visual.note ? (
        <div
          style={{
            position: "absolute",
            right: layout.side,
            bottom: -34,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 24,
            color: colors.muted,
          }}
        >
          {visual.note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
