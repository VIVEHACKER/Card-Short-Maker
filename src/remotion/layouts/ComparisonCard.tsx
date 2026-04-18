import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Split text into two parts for comparison */
function splitComparison(text: string): { top: string; bottom: string } {
  // Try "vs" split
  const vsParts = text.split(/\s+vs\.?\s+/i);
  if (vsParts.length === 2) return { top: vsParts[0]!.trim(), bottom: vsParts[1]!.trim() };

  // Try "but/however" split
  const butParts = text.split(/[,.]?\s*(하지만|그러나|반면|but|however)\s*/i);
  if (butParts.length >= 2) return { top: butParts[0]!.trim(), bottom: butParts.slice(1).join(" ").trim() };

  // Fallback: split in half
  const mid = Math.ceil(text.length / 2);
  const space = text.lastIndexOf(" ", mid);
  const split = space > 5 ? space : mid;
  return { top: text.slice(0, split).trim(), bottom: text.slice(split).trim() };
}

/** Top/bottom comparison with VS badge. Best for before/after or contrast scenes. */
export const ComparisonCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { top, bottom } = splitComparison(scene.text);

  const topReveal = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 90 } });
  const topY = interpolate(topReveal, [0, 1], [-30, 0]);
  const bottomReveal = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 90 } });
  const bottomY = interpolate(bottomReveal, [0, 1], [30, 0]);
  const badgeScale = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 120, mass: 0.8 }, from: 0, to: 1 });

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill style={{ padding: "200px 48px 360px" }}>
        {/* Top panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: topReveal,
            transform: `translateY(${topY}px)`,
            background: `${theme.surface}CC`,
            borderRadius: "24px 24px 8px 8px",
            padding: "32px 40px",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: theme.muted,
              fontFamily: theme.headingFont,
              textAlign: "center",
              lineHeight: 1.4,
              wordBreak: "keep-all",
            }}
          >
            {top}
          </div>
        </div>

        {/* VS badge */}
        <div
          style={{
            position: "relative",
            height: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              transform: `scale(${badgeScale}) translateY(-50%)`,
              width: 64,
              height: 64,
              borderRadius: 16,
              background: theme.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "#FFF",
              fontFamily: theme.displayFont,
              boxShadow: `0 4px 20px ${theme.accent}66`,
            }}
          >
            VS
          </div>
        </div>

        {/* Bottom panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: bottomReveal,
            transform: `translateY(${bottomY}px)`,
            background: `${theme.accent}18`,
            borderRadius: "8px 8px 24px 24px",
            padding: "32px 40px",
            border: `1px solid ${theme.accent}33`,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: theme.text,
              fontFamily: theme.headingFont,
              textAlign: "center",
              lineHeight: 1.4,
              wordBreak: "keep-all",
            }}
          >
            {bottom}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
