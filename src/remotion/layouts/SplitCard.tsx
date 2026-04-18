import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Split layout — top 55% image, bottom 45% text card. Best for build scenes with images. */
export const SplitCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const textY = interpolate(slideUp, [0, 1], [60, 0]);

  const imgReveal = spring({ frame: frame - 2, fps, config: { damping: 20, stiffness: 100 } });
  const imgScale = interpolate(
    frame, [0, durationInFrames], [1, 1.06],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      {/* Image area — top 55% */}
      {scene.mediaImageUrl && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            height: "50%",
            overflow: "hidden",
            opacity: imgReveal,
          }}
        >
          <Img
            src={scene.mediaImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgScale})`,
              borderRadius: "0 0 32px 32px",
            }}
          />
          {/* Gradient fade at bottom of image */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              background: `linear-gradient(transparent, ${theme.background})`,
            }}
          />
        </div>
      )}

      {/* Text area — bottom */}
      <AbsoluteFill
        style={{
          top: "52%",
          justifyContent: "center",
          padding: "0 56px 280px",
        }}
      >
        <div
          style={{
            opacity: slideUp,
            transform: `translateY(${textY}px)`,
          }}
        >
          {/* Accent bar */}
          <div
            style={{
              width: 48,
              height: 4,
              background: theme.accent,
              borderRadius: 2,
              marginBottom: 20,
            }}
          />

          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: theme.text,
              fontFamily: theme.headingFont,
              lineHeight: 1.4,
              wordBreak: "keep-all",
            }}
          >
            {scene.text}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
