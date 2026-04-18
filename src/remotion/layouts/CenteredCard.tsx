import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Default centered card layout — extracted from original SceneCard */
export const CenteredCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    frame: frame - 3, fps,
    config: { damping: 16, stiffness: 100 },
    from: 0.92, to: 1,
  });

  const textReveal = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 80 } });
  const textY = interpolate(textReveal, [0, 1], [24, 0]);

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "240px 48px 400px" }}>
        <div style={{ transform: `scale(${cardScale})`, width: "100%" }}>
          <div
            style={{
              background: scene.mediaImageUrl ? `${theme.surface}B0` : `${theme.surface}E8`,
              borderRadius: 24,
              padding: "48px 40px",
              backdropFilter: "blur(20px)",
              border: `1px solid ${theme.accent}22`,
              boxShadow: `0 8px 40px ${theme.background}80`,
            }}
          >
            <div
              style={{
                opacity: textReveal,
                transform: `translateY(${textY}px)`,
                fontSize: 52,
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
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
