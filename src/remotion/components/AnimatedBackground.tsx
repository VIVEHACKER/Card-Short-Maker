import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CardTheme } from "../themes";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const n = Number.parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const AnimatedBackground: React.FC<{ theme: CardTheme }> = ({
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bg = hexToRgb(theme.background);
  const accent = hexToRgb(theme.accent);

  const angle = 160 + Math.sin(frame / (fps * 6)) * 20;

  const orbs = [
    { x: 30, y: 25, size: 260, speedX: 8, speedY: 12 },
    { x: 70, y: 70, size: 200, speedX: 11, speedY: 7 },
    { x: 50, y: 50, size: 320, speedX: 14, speedY: 9 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg,
          rgb(${bg.r}, ${bg.g}, ${bg.b}) 0%,
          rgb(${Math.min(255, bg.r + 8)}, ${Math.min(255, bg.g + 8)}, ${Math.min(255, bg.b + 12)}) 50%,
          rgb(${bg.r}, ${bg.g}, ${bg.b}) 100%)`,
      }}
    >
      {orbs.map((orb, i) => {
        const ox = orb.x + Math.sin(frame / (fps * orb.speedX)) * 12;
        const oy = orb.y + Math.cos(frame / (fps * orb.speedY)) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${ox}%`,
              top: `${oy}%`,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.06)`,
              filter: `blur(${orb.size * 0.4}px)`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.4,
        }}
      />
    </AbsoluteFill>
  );
};
