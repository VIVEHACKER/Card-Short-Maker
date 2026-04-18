import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneRole } from "../../types";
import type { CardTheme } from "../themes";

const ROLE_CONFIG: Record<
  SceneRole,
  { label: string; emoji: string; color: string }
> = {
  hook: { label: "HOOK", emoji: "⚡", color: "#EF4444" },
  build: { label: "BUILD", emoji: "📊", color: "#3B82F6" },
  payoff: { label: "PAYOFF", emoji: "🎯", color: "#10B981" },
  cta: { label: "CTA", emoji: "🔥", color: "#F59E0B" },
};

interface RoleBadgeProps {
  role: SceneRole;
  index: number;
  theme: CardTheme;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  index,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const config = ROLE_CONFIG[role];

  const appear = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const scale = spring({
    frame: frame - 6,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.8 },
    from: 0.6,
    to: 1,
  });

  const x = interpolate(appear, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        left: 40,
        opacity: appear,
        transform: `translateX(${x}px) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          background: config.color,
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 18,
          fontWeight: 700,
          color: "#FFFFFF",
          fontFamily: theme.headingFont,
          letterSpacing: "0.08em",
          boxShadow: `0 2px 12px ${config.color}66`,
        }}
      >
        {config.emoji} {config.label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.muted,
          fontFamily: theme.bodyFont,
        }}
      >
        #{index}
      </div>
    </div>
  );
};
