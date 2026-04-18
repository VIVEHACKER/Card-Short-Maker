/**
 * 3 outro templates — shown after the last scene.
 */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";

export interface OutroProps {
  channel: string;
  accent: string;
  theme: CardTheme;
}

export type OutroTemplate = React.FC<OutroProps>;
export type OutroTemplateName = "subscribe" | "replay" | "minimal";

/** Subscribe CTA — channel name + follow prompt */
const SubscribeOutro: OutroTemplate = ({ channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const btnScale = spring({ frame: frame - 12, fps, config: { damping: 10, stiffness: 120, mass: 0.8 }, from: 0.5, to: 1 });
  const pulse = 0.9 + Math.sin(frame * 0.12) * 0.1;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(reveal, exit) }}>
      <div style={{ fontSize: 32, fontWeight: 600, color: theme.muted, fontFamily: theme.bodyFont, marginBottom: 16 }}>
        더 많은 콘텐츠
      </div>
      <div style={{ fontSize: 48, fontWeight: 800, color: theme.text, fontFamily: theme.displayFont, marginBottom: 40 }}>
        {channel}
      </div>
      <div style={{
        transform: `scale(${btnScale * pulse})`,
        background: accent, borderRadius: 20, padding: "16px 48px",
        fontSize: 28, fontWeight: 700, color: "#FFF", fontFamily: theme.headingFont,
        boxShadow: `0 4px 20px ${accent}44`,
      }}>
        팔로우
      </div>
    </AbsoluteFill>
  );
};

/** Replay — circular arrow with "다시보기" */
const ReplayOutro: OutroTemplate = ({ channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rotation = interpolate(frame, [0, durationInFrames], [0, 360], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(reveal, exit) }}>
      {/* Rotating circle */}
      <svg width={100} height={100} style={{ transform: `rotate(${rotation}deg)`, marginBottom: 24 }}>
        <circle cx={50} cy={50} r={40} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="200 52" strokeLinecap="round" />
        <polygon points="78,42 92,50 78,58" fill={accent} />
      </svg>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, fontFamily: theme.headingFont }}>
        다시 보기
      </div>
      <div style={{
        marginTop: 16, fontSize: 20, color: theme.muted, fontFamily: theme.bodyFont,
        opacity: spring({ frame: frame - 10, fps, config: { damping: 20 } }),
      }}>
        {channel}
      </div>
    </AbsoluteFill>
  );
};

/** Minimal — just the channel name fading in and out */
const MinimalOutro: OutroTemplate = ({ channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const reveal = spring({ frame: frame - 4, fps, config: { damping: 24, stiffness: 60 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(reveal, [0, 1], [0, 80]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(reveal, exit) }}>
      <div style={{ width: lineW, height: 2, background: accent, borderRadius: 1, marginBottom: 20 }} />
      <div style={{ fontSize: 28, fontWeight: 600, color: theme.muted, fontFamily: theme.bodyFont, letterSpacing: "0.08em" }}>
        {channel}
      </div>
    </AbsoluteFill>
  );
};

const OUTRO_REGISTRY: Record<OutroTemplateName, OutroTemplate> = {
  subscribe: SubscribeOutro,
  replay: ReplayOutro,
  minimal: MinimalOutro,
};

export function resolveOutroTemplate(name?: string): OutroTemplate {
  if (name && name in OUTRO_REGISTRY) return OUTRO_REGISTRY[name as OutroTemplateName];
  return SubscribeOutro;
}

export const OUTRO_TEMPLATE_NAMES = Object.keys(OUTRO_REGISTRY) as OutroTemplateName[];
