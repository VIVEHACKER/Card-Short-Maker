import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";

/** Split text into list items by line breaks, commas, or numbered patterns */
function parseListItems(text: string): string[] {
  // Try numbered list: "1. foo 2. bar"
  const numbered = text.split(/\d+[.)]\s*/).filter(Boolean);
  if (numbered.length >= 2) return numbered.map((s) => s.trim()).filter(Boolean);

  // Try line-break split
  const lines = text.split(/[,;·\n]+/).map((s) => s.trim()).filter(Boolean);
  if (lines.length >= 2) return lines;

  // Fallback: split at natural breaks
  const mid = Math.ceil(text.length / 2);
  const space = text.lastIndexOf(" ", mid);
  if (space > 5) {
    return [text.slice(0, space).trim(), text.slice(space).trim()];
  }

  return [text];
}

/** List layout — items revealed one by one with stagger. Best for multi-point builds. */
export const ListCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = parseListItems(scene.text);
  const headerReveal = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "240px 56px 400px",
        }}
      >
        {items.map((item, i) => {
          const delay = 6 + i * 8;
          const itemReveal = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 90 } });
          const x = interpolate(itemReveal, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: itemReveal,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                marginBottom: 28,
              }}
            >
              {/* Bullet */}
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${theme.accent}${i === 0 ? "" : "44"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: i === 0 ? "#FFF" : theme.accent,
                  fontFamily: theme.bodyFont,
                  marginTop: 6,
                }}
              >
                {i + 1}
              </div>

              {/* Text */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 600,
                  color: theme.text,
                  fontFamily: theme.headingFont,
                  lineHeight: 1.4,
                  wordBreak: "keep-all",
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </SceneShell>
  );
};
