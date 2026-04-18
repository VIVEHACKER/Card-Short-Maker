/**
 * Shared primitives used across multiple layouts.
 */
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";
import type { CardShortsScene } from "../types";
import { RoleBadge } from "../components/RoleBadge";
import { SubtitleOverlay } from "../overlays/SubtitleOverlay";

/** Standard fade in/out envelope */
export function useFadeEnvelope(theme: CardTheme) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = spring({
    frame,
    fps,
    config: { damping: theme.spring.damping, stiffness: theme.spring.stiffness },
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return Math.min(fadeIn, fadeOut);
}

/** Ken-burns background image with gradient overlay */
export const BackgroundImage: React.FC<{
  src: string;
  theme: CardTheme;
  brightness?: number;
}> = ({ src, theme, brightness = 0.35 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${1 + progress * 0.08})`,
          filter: `brightness(${brightness}) saturate(0.8)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            ${theme.background}CC 0%,
            ${theme.background}44 30%,
            ${theme.background}88 70%,
            ${theme.background}EE 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Subtitle overlay bar at the bottom */
export const SubtitleBar: React.FC<{
  lines: string[];
  theme: CardTheme;
}> = ({ lines, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (lines.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 180,
        left: 40,
        right: 40,
        opacity: spring({ frame: frame - 10, fps, config: { damping: 20 } }),
      }}
    >
      <div
        style={{
          background: theme.subtitleBg,
          borderRadius: 16,
          padding: "18px 28px",
          textAlign: "center",
          backdropFilter: "blur(12px)",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: theme.text,
              fontFamily: theme.bodyFont,
              lineHeight: 1.5,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Progress bar at the very bottom */
export const ProgressBar: React.FC<{
  index: number;
  total: number;
  duration: number;
  theme: CardTheme;
  safeBottom?: number;
}> = ({ index, total, duration, theme, safeBottom }) => (
  <div style={{ position: "absolute", bottom: (safeBottom ?? 0) + 120, left: 48, right: 48 }}>
    <div
      style={{
        height: 4,
        background: `${theme.text}15`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(index / total) * 100}%`,
          height: "100%",
          background: theme.accent,
          borderRadius: 2,
          boxShadow: `0 0 8px ${theme.accent}66`,
        }}
      />
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 8,
        fontSize: 16,
        color: theme.muted,
        fontFamily: theme.bodyFont,
      }}
    >
      <span>{index}/{total}</span>
      <span>{duration.toFixed(1)}s</span>
    </div>
  </div>
);

/** Common scene shell — wraps any layout with bg image, role badge, subtitles, progress */
export const SceneShell: React.FC<{
  scene: CardShortsScene;
  theme: CardTheme;
  totalScenes: number;
  safeZone?: { top: number; bottom: number; left: number; right: number };
  children: React.ReactNode;
}> = ({ scene, theme, totalScenes, safeZone, children }) => {
  const opacity = useFadeEnvelope(theme);

  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.mediaImageUrl && (
        <BackgroundImage src={scene.mediaImageUrl} theme={theme} />
      )}
      <RoleBadge role={scene.role} index={scene.index} theme={theme} />
      {children}
      <SubtitleOverlay
        lines={scene.subtitleLines}
        emphasisWords={scene.emphasisWords}
        theme={theme}
      />
      <ProgressBar
        index={scene.index}
        total={totalScenes}
        duration={scene.duration}
        theme={theme}
        safeBottom={safeZone?.bottom}
      />
    </AbsoluteFill>
  );
};
