import { Composition } from "remotion";
import { ShortVideoProps } from "./lib/schema";
import { calculateShortMetadata, ShortVideo } from "./ShortVideo";

/**
 * Una sola composición reutilizable. Para previsualizar otro video en el Studio,
 * cambia `timelineFile` en el panel de props (generated/<slug>/timeline.json).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShortVideo"
      component={ShortVideo}
      schema={ShortVideoProps}
      durationInFrames={90}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ timelineFile: "generated/variable-minecraft/timeline.json" }}
      calculateMetadata={calculateShortMetadata}
    />
  );
};
