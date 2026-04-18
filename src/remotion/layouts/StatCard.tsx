import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { LayoutProps } from "./types";
import { SceneShell } from "./shared";
import {
  AnimatedCounter,
  AnimatedProgressBar,
  ProgressRing,
  detectDataViz,
} from "../overlays/DataViz";

/** Stat card — auto-detects numbers/percentages and renders animated data viz. */
export const StatCard: React.FC<LayoutProps> = ({ scene, theme, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dataViz = detectDataViz(scene.text);
  const reveal = spring({ frame: frame - 6, fps, config: { damping: 20, stiffness: 80 } });

  // No data detected — render as bold accent text
  if (!dataViz) {
    return (
      <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "240px 56px 400px" }}>
          <div style={{ opacity: reveal, fontSize: 56, fontWeight: 800, color: theme.accent, fontFamily: theme.displayFont, textAlign: "center", wordBreak: "keep-all" }}>
            {scene.text}
          </div>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  return (
    <SceneShell scene={scene} theme={theme} totalScenes={totalScenes}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "220px 56px 380px",
          gap: 24,
        }}
      >
        {/* Ring visualization */}
        {dataViz.type === "ring" && (
          <>
            <ProgressRing
              value={dataViz.value}
              size={240}
              strokeWidth={12}
              label={dataViz.label}
              theme={theme}
            />
            {dataViz.label && (
              <div style={{
                opacity: reveal, marginTop: 20,
                fontSize: 34, fontWeight: 600, color: theme.text,
                fontFamily: theme.headingFont, textAlign: "center",
                lineHeight: 1.4, wordBreak: "keep-all", maxWidth: "85%",
              }}>
                {dataViz.label}
              </div>
            )}
          </>
        )}

        {/* Bar visualization */}
        {dataViz.type === "bar" && (
          <div style={{ width: "80%", opacity: reveal }}>
            <AnimatedProgressBar
              value={dataViz.value}
              label={dataViz.label}
              theme={theme}
              height={28}
            />
          </div>
        )}

        {/* Counter visualization */}
        {dataViz.type === "counter" && (
          <>
            <AnimatedCounter
              value={dataViz.value}
              suffix={dataViz.suffix}
              prefix={dataViz.prefix}
              theme={theme}
              fontSize={100}
            />
            {dataViz.label && (
              <div style={{
                opacity: reveal, marginTop: 16,
                fontSize: 34, fontWeight: 600, color: theme.text,
                fontFamily: theme.headingFont, textAlign: "center",
                lineHeight: 1.4, wordBreak: "keep-all", maxWidth: "85%",
              }}>
                {dataViz.label}
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    </SceneShell>
  );
};
