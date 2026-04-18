import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Full-bleed bold text — fills 70% of screen, no card surface. Best for hooks. */
export const FullBleedText: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dramatic entrance: scale from large + fade
  const reveal = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
  const scale = interpolate(reveal, [0, 1], [1.15, 1]);
  const y = interpolate(reveal, [0, 1], [40, 0]);

  // Accent line animation
  const lineWidth = interpolate(reveal, [0, 1], [0, 320]);

  // Subtle pulse on accent
  const pulse = 0.7 + Math.sin(frame * 0.08) * 0.3;

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "200px 56px 380px",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: "28%",
            width: lineWidth,
            height: 4,
            background: theme.accent,
            boxShadow: `0 0 24px ${theme.accent}`,
            opacity: pulse,
            borderRadius: 2,
          }}
        />

        {/* Main text */}
        <div
          style={{
            opacity: reveal,
            transform: `translateY(${y}px) scale(${scale})`,
            fontSize: 68,
            fontWeight: 900,
            color: theme.text,
            fontFamily: theme.displayFont,
            lineHeight: 1.2,
            textAlign: "center",
            wordBreak: "keep-all",
            letterSpacing: "-0.02em",
            textShadow: `0 4px 24px ${theme.background}88`,
          }}
        >
          {scene.text}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "32%",
            width: lineWidth * 0.6,
            height: 4,
            background: theme.accent,
            boxShadow: `0 0 24px ${theme.accent}`,
            opacity: pulse * 0.6,
            borderRadius: 2,
          }}
        />
      </AbsoluteFill>
    </SceneShell>
  );
};
