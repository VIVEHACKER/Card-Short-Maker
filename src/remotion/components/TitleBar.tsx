import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";

interface TitleBarProps {
  title: string;
  channel: string;
  theme: CardTheme;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  channel,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideDown = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const y = interpolate(slideDown, [0, 1], [-80, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          opacity: slideDown,
          transform: `translateY(${y}px)`,
        }}
      >
        {/* Accent strip */}
        <div
          style={{
            height: 6,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`,
          }}
        />

        {/* Title area */}
        <div
          style={{
            padding: "28px 40px 24px",
            background: `linear-gradient(180deg, ${theme.surface}F0, ${theme.surface}00)`,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: theme.accent,
              fontFamily: theme.headingFont,
              letterSpacing: "0.04em",
              marginBottom: 8,
            }}
          >
            {channel}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: theme.text,
              fontFamily: theme.headingFont,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
