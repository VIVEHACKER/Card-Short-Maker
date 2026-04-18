/**
 * Animated data visualization primitives for card shorts.
 * Driven by Remotion's useCurrentFrame + interpolate.
 */
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";

// ── AnimatedCounter — spring-animated number counting up ──

export const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  theme: CardTheme;
  fontSize?: number;
}> = ({ value, suffix = "", prefix = "", decimals = 0, theme, fontSize = 120 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = interpolate(
    frame,
    [6, Math.min(durationInFrames * 0.55, 40)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const displayVal = decimals > 0
    ? (value * progress).toFixed(decimals)
    : Math.round(value * progress);

  const scale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.8 },
    from: 0.6,
    to: 1,
  });

  const glow = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        fontSize,
        fontWeight: 900,
        color: theme.accent,
        fontFamily: theme.displayFont,
        lineHeight: 1,
        textAlign: "center",
        textShadow: `0 0 ${interpolate(glow, [0, 1], [0, 32])}px ${theme.accent}44`,
      }}
    >
      {prefix}{displayVal}{suffix}
    </div>
  );
};

// ── ProgressBar — horizontal bar filling with accent color ──

export const AnimatedProgressBar: React.FC<{
  value: number;
  label?: string;
  theme: CardTheme;
  height?: number;
}> = ({ value, label, theme, height = 28 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fillProgress = interpolate(
    frame,
    [10, Math.max(30, durationInFrames * 0.5)],
    [0, Math.min(100, value) / 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const containerReveal = spring({ frame, fps, config: { damping: 20 } });
  const percentReveal = spring({ frame: frame - 15, fps, config: { damping: 20 } });

  return (
    <div style={{ width: "100%", opacity: containerReveal }}>
      {label && (
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.text,
            fontFamily: theme.headingFont,
            marginBottom: 16,
          }}
        >
          {label}
        </div>
      )}

      <div
        style={{
          width: "100%",
          height,
          background: `${theme.text}15`,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fillProgress * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}CC)`,
            borderRadius: height / 2,
            boxShadow: `0 0 12px ${theme.accent}44`,
          }}
        />
      </div>

      <div
        style={{
          textAlign: "right",
          marginTop: 8,
          fontSize: 24,
          fontWeight: 800,
          color: theme.accent,
          fontFamily: theme.displayFont,
          opacity: percentReveal,
        }}
      >
        {Math.round(fillProgress * 100)}%
      </div>
    </div>
  );
};

// ── ProgressRing — circular SVG progress indicator ──

export const ProgressRing: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  theme: CardTheme;
}> = ({ value, size = 200, strokeWidth = 10, label, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = interpolate(
    frame,
    [8, Math.max(30, durationInFrames * 0.55)],
    [0, Math.min(100, value) / 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const dashOffset = circumference * (1 - progress);
  const scale = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 80 }, from: 0.7, to: 1 });
  const numberReveal = spring({ frame: frame - 10, fps, config: { damping: 20 } });

  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${scale})` }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${theme.text}12`}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 6px ${theme.accent}66)` }}
        />
      </svg>

      {/* Center number */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: numberReveal,
        }}
      >
        <div
          style={{
            fontSize: size * 0.28,
            fontWeight: 900,
            color: theme.accent,
            fontFamily: theme.displayFont,
            lineHeight: 1,
          }}
        >
          {Math.round(progress * value)}%
        </div>
        {label && (
          <div
            style={{
              fontSize: size * 0.09,
              fontWeight: 600,
              color: theme.muted,
              fontFamily: theme.bodyFont,
              marginTop: 4,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

// ── ComparisonBar — two bars side by side ──

export const ComparisonBars: React.FC<{
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  theme: CardTheme;
}> = ({ leftValue, rightValue, leftLabel, rightLabel, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const maxVal = Math.max(leftValue, rightValue, 1);

  const leftProgress = interpolate(
    frame,
    [8, Math.max(25, durationInFrames * 0.45)],
    [0, leftValue / maxVal],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const rightProgress = interpolate(
    frame,
    [14, Math.max(30, durationInFrames * 0.5)],
    [0, rightValue / maxVal],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });

  const barStyle = (progress: number, isAccent: boolean): React.CSSProperties => ({
    height: 32,
    width: `${progress * 100}%`,
    background: isAccent
      ? `linear-gradient(90deg, ${theme.accent}, ${theme.accent}CC)`
      : `${theme.text}30`,
    borderRadius: 16,
    minWidth: 4,
  });

  return (
    <div style={{ width: "100%", opacity: reveal }}>
      {/* Left bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: theme.text, fontFamily: theme.headingFont }}>{leftLabel}</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: theme.accent, fontFamily: theme.displayFont }}>{Math.round(leftProgress * leftValue)}</span>
        </div>
        <div style={barStyle(leftProgress, leftValue >= rightValue)} />
      </div>

      {/* Right bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: theme.text, fontFamily: theme.headingFont }}>{rightLabel}</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: theme.muted, fontFamily: theme.displayFont }}>{Math.round(rightProgress * rightValue)}</span>
        </div>
        <div style={barStyle(rightProgress, rightValue > leftValue)} />
      </div>
    </div>
  );
};

// ── DataViz config type ──

export interface DataVizConfig {
  type: "counter" | "bar" | "ring" | "comparison";
  value: number;
  label?: string;
  suffix?: string;
  prefix?: string;
  /** For comparison type */
  compareValue?: number;
  compareLabel?: string;
}

/** Auto-detect data viz from text content */
export function detectDataViz(text: string): DataVizConfig | undefined {
  // Percentage pattern: "87%" or "87.5%"
  const pctMatch = text.match(/(\d[\d.]*)\s*%/);
  if (pctMatch) {
    const value = Number.parseFloat(pctMatch[1]!);
    const label = text.replace(pctMatch[0]!, "").trim();
    // Use ring for clean percentages, bar for longer context
    return {
      type: label.length > 20 ? "bar" : "ring",
      value,
      label: label || undefined,
      suffix: "%",
    };
  }

  // Large number pattern: "1,234" or "500만"
  const numMatch = text.match(/(\d[\d,]*)\s*(만|억|조|배|개|명|건)?/);
  if (numMatch && Number.parseInt(numMatch[1]!.replace(/,/g, ""), 10) >= 100) {
    const value = Number.parseInt(numMatch[1]!.replace(/,/g, ""), 10);
    const suffix = numMatch[2] ?? "";
    const label = text.replace(numMatch[0]!, "").trim();
    return { type: "counter", value, label: label || undefined, suffix };
  }

  return undefined;
}
