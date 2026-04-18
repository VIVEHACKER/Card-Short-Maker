import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Pull-quote style — oversized quotation marks, accent left bar. Best for payoff. */
export const QuoteCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const barHeight = interpolate(reveal, [0, 1], [0, 280]);
  const quoteScale = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 100 }, from: 0.5, to: 1 });
  const textReveal = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 80 } });
  const textX = interpolate(textReveal, [0, 1], [30, 0]);

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "240px 56px 380px",
        }}
      >
        {/* Accent left bar */}
        <div
          style={{
            position: "absolute",
            left: 48,
            top: "50%",
            transform: "translateY(-50%)",
            width: 6,
            height: barHeight,
            background: theme.accent,
            borderRadius: 3,
            boxShadow: `0 0 16px ${theme.accent}44`,
          }}
        />

        {/* Quote mark */}
        <div
          style={{
            opacity: quoteScale,
            transform: `scale(${quoteScale})`,
            fontSize: 120,
            fontWeight: 900,
            color: `${theme.accent}33`,
            fontFamily: "Georgia, serif",
            lineHeight: 0.8,
            marginBottom: 8,
            marginLeft: 24,
          }}
        >
          "
        </div>

        {/* Quote text */}
        <div
          style={{
            opacity: textReveal,
            transform: `translateX(${textX}px)`,
            fontSize: 48,
            fontWeight: 600,
            color: theme.text,
            fontFamily: theme.headingFont,
            lineHeight: 1.5,
            wordBreak: "keep-all",
            marginLeft: 32,
            fontStyle: "italic",
          }}
        >
          {scene.text}
        </div>

        {/* Closing quote */}
        <div
          style={{
            opacity: spring({ frame: frame - 16, fps, config: { damping: 20 } }),
            fontSize: 120,
            fontWeight: 900,
            color: `${theme.accent}33`,
            fontFamily: "Georgia, serif",
            lineHeight: 0.6,
            textAlign: "right",
            marginRight: 24,
            marginTop: 8,
          }}
        >
          "
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
