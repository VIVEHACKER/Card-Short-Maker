import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Minimal text-only layout — maximum whitespace, accent CTA phrase. Best for CTA. */
export const MinimalCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const reveal = spring({ frame: frame - 6, fps, config: { damping: 22, stiffness: 80 } });
  const y = interpolate(reveal, [0, 1], [20, 0]);

  // Accent underline grows in
  const lineReveal = spring({ frame: frame - 14, fps, config: { damping: 16, stiffness: 60 } });
  const lineWidth = interpolate(lineReveal, [0, 1], [0, 160]);

  // Subtle breathing animation
  const breath = Math.sin(frame * 0.04) * 0.5 + 0.5;

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "280px 72px 400px",
        }}
      >
        {/* Text */}
        <div
          style={{
            opacity: reveal,
            transform: `translateY(${y}px)`,
            fontSize: 52,
            fontWeight: 700,
            color: theme.text,
            fontFamily: theme.headingFont,
            textAlign: "center",
            lineHeight: 1.5,
            wordBreak: "keep-all",
            letterSpacing: "-0.01em",
          }}
        >
          {scene.text}
        </div>

        {/* Accent underline */}
        <div
          style={{
            marginTop: 32,
            width: lineWidth,
            height: 4,
            background: theme.accent,
            borderRadius: 2,
            boxShadow: `0 0 ${12 + breath * 8}px ${theme.accent}66`,
          }}
        />

        {/* Subtle arrow hint */}
        <div
          style={{
            position: "absolute",
            bottom: 260,
            opacity: spring({ frame: frame - 20, fps, config: { damping: 20 } }) * 0.5,
            fontSize: 28,
            color: theme.accent,
            transform: `translateY(${Math.sin(frame * 0.12) * 4}px)`,
          }}
        >
          ↓
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
