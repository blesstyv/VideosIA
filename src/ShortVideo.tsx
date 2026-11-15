/**
 * Composición genérica para Shorts/Reels/TikTok. No contiene contenido fijo:
 * todo llega desde el timeline JSON generado por el pipeline.
 */
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Sequence, staticFile } from "remotion";
import { SceneBackground } from "./components/Background";
import { Captions } from "./components/Captions";
import { Chrome, IllustrativeBadge } from "./components/Chrome";
import { Camera } from "./components/Camera";
import { CuesContext, WordsContext } from "./lib/anim";
import { type ShortVideoProps, Timeline, type TimelineScene } from "./lib/schema";
import { IllustrationScene } from "./scenes/IllustrationScene";
import { BigNumberScene } from "./scenes/BigNumberScene";
import { BulletsScene } from "./scenes/BulletsScene";
import { ChatScene } from "./scenes/ChatScene";
import { KineticScene } from "./scenes/KineticScene";
import { PricingScene } from "./scenes/PricingScene";
import { VerdictScene } from "./scenes/VerdictScene";
import { VersusScene } from "./scenes/VersusScene";
import { CodeScene } from "./scenes/CodeScene";
import { ContainersScene } from "./scenes/ContainersScene";
import { OutroScene } from "./scenes/OutroScene";
import { TitleScene } from "./scenes/TitleScene";
import { categoryLabel, colors, fonts } from "./theme";

type Props = ShortVideoProps & { timeline?: Timeline };

export const calculateShortMetadata: CalculateMetadataFunction<Props> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(props.timelineFile), { signal: abortSignal });
  if (!res.ok) {
    // Sin timeline todavía: composición de marcador para que el Studio no falle.
    return { durationInFrames: 90, fps: 30, width: 1080, height: 1920, props: { ...props, timeline: undefined } };
  }
  const timeline = Timeline.parse(await res.json());
  return {
    durationInFrames: timeline.durationInFrames,
    fps: timeline.fps,
    width: timeline.width,
    height: timeline.height,
    defaultOutName: timeline.slug,
    props: { ...props, timeline },
  };
};

const SceneVisual: React.FC<{ scene: TimelineScene }> = ({ scene }) => {
  const v = scene.visual;
  switch (v.type) {
    case "title":
      return <TitleScene visual={v} />;
    case "bullets":
      return <BulletsScene visual={v} />;
    case "code":
      return <CodeScene visual={v} />;
    case "containers":
      return <ContainersScene visual={v} />;
    case "outro":
      return <OutroScene visual={v} />;
    case "kinetic":
      return <KineticScene visual={v} />;
    case "versus":
      return <VersusScene visual={v} />;
    case "pricing":
      return <PricingScene visual={v} />;
    case "chat":
      return <ChatScene visual={v} />;
    case "bignumber":
      return <BigNumberScene visual={v} />;
    case "verdict":
      return <VerdictScene visual={v} />;
    case "illustration":
      return <IllustrationScene visual={v} />;
  }
};

/** Cada presentación tiene props distintas; se crea el elemento por caso para mantener los tipos. */
const transitionElement = (kind: TimelineScene["transitionIn"], key: string, frames: number) => {
  const timing = linearTiming({ durationInFrames: frames });
  switch (kind) {
    case "slide":
      return <TransitionSeries.Transition key={key} presentation={slide({ direction: "from-right" })} timing={timing} />;
    case "wipe":
      return <TransitionSeries.Transition key={key} presentation={wipe({ direction: "from-left" })} timing={timing} />;
    default:
      return <TransitionSeries.Transition key={key} presentation={fade()} timing={timing} />;
  }
};

export const ShortVideo: React.FC<Props> = ({ timeline }) => {
  if (!timeline) {
    return (
      <AbsoluteFill style={{ background: colors.bg, color: colors.muted, fontFamily: fonts.sans, fontSize: 44, justifyContent: "center", alignItems: "center", textAlign: "center", padding: 80 }}>
        No hay timeline. Ejecuta: npm run video -- produce &lt;slug&gt;
      </AbsoluteFill>
    );
  }
  const { scenes, transitionFrames } = timeline;
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const items = [];
          if (i > 0 && scene.transitionIn !== "none")
            items.push(transitionElement(scene.transitionIn, `t-${scene.id}`, transitionFrames));
          items.push(
            <TransitionSeries.Sequence key={scene.id} name={scene.id} durationInFrames={scene.visualDurationInFrames}>
              <CuesContext.Provider value={scene.cues}>
                <WordsContext.Provider value={scene.words}>
                  <AbsoluteFill>
                    <SceneBackground bg={scene.background} />
                    <Camera seed={i}>
                      <SceneVisual scene={scene} />
                    </Camera>
                    {scene.background.kind === "gameplay-illustration" ? <IllustrativeBadge /> : null}
                  </AbsoluteFill>
                </WordsContext.Provider>
              </CuesContext.Provider>
            </TransitionSeries.Sequence>,
          );
          return items;
        })}
      </TransitionSeries>

      {/* Narración: cada escena en su posición absoluta (independiente de las transiciones) */}
      {scenes.map((scene) => (
        <Sequence key={`a-${scene.id}`} from={scene.startFrame} durationInFrames={scene.audioDurationInFrames} layout="none" name={`Voz ${scene.id}`}>
          <Audio src={staticFile(scene.audioSrc)} />
        </Sequence>
      ))}
      {timeline.music ? <Audio src={staticFile(timeline.music.src)} volume={timeline.music.volume} loop /> : null}
      {timeline.sfx.map((e, i) => (
        <Sequence key={`sfx-${i}`} from={e.frame} durationInFrames={Math.round(timeline.fps * 0.8)} layout="none" name={`SFX ${i + 1}`}>
          <Audio src={staticFile(e.src)} volume={e.volume} />
        </Sequence>
      ))}

      <Chrome category={categoryLabel[timeline.category] ?? timeline.category} stamp={timeline.stamp} />
      <Captions captions={timeline.captions} />
    </AbsoluteFill>
  );
};
