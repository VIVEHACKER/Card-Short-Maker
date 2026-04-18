/**
 * 4 intro templates — each is a self-contained Remotion component.
 */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";

export interface IntroProps {
  title: string;
  channel: string;
  accent: string;
  theme: CardTheme;
}

export type IntroTemplate = React.FC<IntroProps>;
export type IntroTemplateName = "default" | "bold" | "minimal" | "branded";

/** Default — accent lines + centered title (existing) */
const DefaultIntro: IntroTemplate = ({ title, channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(reveal, [0, 1], [30, 0]);
  const lineWidth = interpolate(reveal, [0, 1], [0, 200]);
  const pulse = 0.6 + Math.sin(frame * 0.1) * 0.4;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(reveal, exit) }}>
      <div style={{ position: "absolute", width: lineWidth, height: 3, background: accent, boxShadow: `0 0 20px ${accent}`, opacity: pulse, transform: "translateY(-120px)" }} />
      <div style={{ fontSize: 26, fontWeight: 600, color: accent, fontFamily: theme.displayFont, letterSpacing: "0.06em", marginBottom: 16, opacity: spring({ frame: frame - 4, fps, config: { damping: 20 } }) }}>{channel}</div>
      <div style={{ transform: `translateY(${y}px)`, fontSize: 56, fontWeight: 800, color: theme.text, fontFamily: theme.displayFont, textAlign: "center", lineHeight: 1.25, maxWidth: "85%", wordBreak: "keep-all" }}>{title}</div>
      <div style={{ position: "absolute", width: lineWidth * 0.6, height: 3, background: accent, boxShadow: `0 0 20px ${accent}`, opacity: pulse * 0.6, transform: "translateY(120px)" }} />
    </AbsoluteFill>
  );
};

/** Bold — full-screen kinetic text with stagger */
const BoldIntro: IntroTemplate = ({ title, channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = title.split(/\s+/);
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "160px 48px", opacity: exit }}>
      {/* Channel badge */}
      <div style={{
        position: "absolute", top: 200,
        opacity: spring({ frame: frame - 2, fps, config: { damping: 20 } }),
        fontSize: 22, fontWeight: 700, color: accent, fontFamily: theme.displayFont,
        letterSpacing: "0.12em", textTransform: "uppercase",
        padding: "6px 20px", border: `2px solid ${accent}44`, borderRadius: 24,
      }}>
        {channel}
      </div>

      {/* Staggered words */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {words.map((word, i) => {
          const delay = 4 + i * 4;
          const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 80 } });
          const scale = interpolate(s, [0, 1], [1.3, 1]);
          return (
            <div key={i} style={{
              opacity: s, transform: `scale(${scale})`,
              fontSize: 72, fontWeight: 900, color: theme.text, fontFamily: theme.displayFont,
              lineHeight: 1.1, textAlign: "center", wordBreak: "keep-all",
            }}>
              {word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Minimal — just channel name fading in, then title slides up */
const MinimalIntro: IntroTemplate = ({ title, channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const channelReveal = spring({ frame, fps, config: { damping: 24, stiffness: 80 } });
  const titleReveal = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 70 } });
  const titleY = interpolate(titleReveal, [0, 1], [40, 0]);
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "200px 64px", opacity: exit }}>
      <div style={{ opacity: channelReveal, fontSize: 20, fontWeight: 500, color: theme.muted, fontFamily: theme.bodyFont, letterSpacing: "0.08em", marginBottom: 24 }}>{channel}</div>
      <div style={{ opacity: titleReveal, transform: `translateY(${titleY}px)`, fontSize: 48, fontWeight: 700, color: theme.text, fontFamily: theme.headingFont, textAlign: "center", lineHeight: 1.35, wordBreak: "keep-all" }}>{title}</div>
    </AbsoluteFill>
  );
};

/** Branded — accent block + channel + title slide up */
const BrandedIntro: IntroTemplate = ({ title, channel, accent, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const blockGrow = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });
  const blockHeight = interpolate(blockGrow, [0, 1], [0, 160]);
  const textReveal = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 80 } });
  const textY = interpolate(textReveal, [0, 1], [30, 0]);
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* Accent block at top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: blockHeight, background: accent }} />

      {/* Channel in accent block */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: spring({ frame: frame - 4, fps, config: { damping: 20 } }),
        fontSize: 28, fontWeight: 800, color: "#FFFFFF", fontFamily: theme.displayFont,
        letterSpacing: "0.06em",
      }}>
        {channel}
      </div>

      {/* Title below block */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "240px 56px 200px" }}>
        <div style={{
          opacity: textReveal, transform: `translateY(${textY}px)`,
          fontSize: 52, fontWeight: 800, color: theme.text, fontFamily: theme.displayFont,
          textAlign: "center", lineHeight: 1.3, wordBreak: "keep-all",
        }}>
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const INTRO_REGISTRY: Record<IntroTemplateName, IntroTemplate> = {
  default: DefaultIntro,
  bold: BoldIntro,
  minimal: MinimalIntro,
  branded: BrandedIntro,
};

export function resolveIntroTemplate(name?: string): IntroTemplate {
  if (name && name in INTRO_REGISTRY) return INTRO_REGISTRY[name as IntroTemplateName];
  return DefaultIntro;
}

export const INTRO_TEMPLATE_NAMES = Object.keys(INTRO_REGISTRY) as IntroTemplateName[];
