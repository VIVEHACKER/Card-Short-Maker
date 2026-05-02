import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LayoutProps } from "./types";
import {
  referenceCardHeadlineFontSize,
  referenceCardSubtitleFontSize,
} from "../../lib/card-template";

/** Fixed reference card template: full-bleed visual, one headline card, subtitle chips. */
export const ReferenceCard: React.FC<LayoutProps> = ({
  scene,
  theme,
  totalScenes,
  safeZone,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const reveal = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 92, mass: 0.9 },
  });
  const copyReveal = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20, stiffness: 84, mass: 1 },
  });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const top = safeZone?.top ?? 92;
  const bottom = safeZone?.bottom ?? 160;
  const side = Math.max(safeZone?.left ?? 56, 56);
  const cardY = interpolate(copyReveal, [0, 1], [42, 0]);
  const cardScale = interpolate(copyReveal, [0, 1], [0.96, 1]);
  const bgScale = 1.03 + progress * 0.08;
  const isHook = scene.role === "hook";
  const isCta = scene.role === "cta";
  const headlineSize = referenceCardHeadlineFontSize(scene.text, scene.role);
  const headlineLineHeight = headlineSize <= 52 ? 1.08 : 1.12;

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        overflow: "hidden",
        fontFamily: theme.headingFont,
      }}
    >
      {scene.mediaImageUrl ? (
        <Img
          src={scene.mediaImageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale})`,
            filter: "blur(1.2px) saturate(1.04) contrast(1.04) brightness(0.55)",
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 26% 18%, ${theme.accent}44, transparent 34%),
              radial-gradient(circle at 78% 68%, ${theme.accent}22, transparent 30%),
              linear-gradient(160deg, ${theme.surface}, ${theme.background})`,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.28) 36%, rgba(0,0,0,0.82) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.32) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: top + 118,
          left: side,
          right: side,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: reveal,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.88)",
            color: "#111111",
            boxShadow: "0 14px 38px rgba(0,0,0,0.24)",
            backdropFilter: "blur(14px)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: theme.accent,
              boxShadow: `0 0 16px ${theme.accent}`,
            }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "-0.01em",
            }}
          >
            {roleLabel(scene.role)}
          </span>
        </div>

        <div
          style={{
            padding: "12px 18px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.42)",
            color: "#FFFFFF",
            fontSize: 21,
            fontWeight: 800,
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          {String(scene.index).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: side,
          right: side,
          top: isHook ? "41%" : "43%",
          transform: `translateY(-50%) translateY(${cardY}px) scale(${cardScale})`,
          opacity: copyReveal,
        }}
      >
        <div
          style={{
            borderRadius: 34,
            padding: isHook ? "54px 46px 58px" : "46px 42px 50px",
            background: isCta
              ? `linear-gradient(135deg, ${theme.accent}F2, ${theme.accent}C9)`
              : "rgba(8, 8, 8, 0.72)",
            color: "#FFFFFF",
            border: isCta
              ? "1px solid rgba(255,255,255,0.28)"
              : "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 34px 90px rgba(0,0,0,0.38)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              marginBottom: 22,
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: isCta ? "rgba(17,17,17,0.78)" : theme.accent,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                display: "block",
                width: 46,
                height: 5,
                borderRadius: 999,
                background: isCta ? "rgba(17,17,17,0.72)" : theme.accent,
              }}
            />
            {cardKicker(scene.role, scene.index)}
          </div>

          <div
            style={{
              fontSize: headlineSize,
              fontWeight: 950,
              lineHeight: headlineLineHeight,
              letterSpacing: "-0.05em",
              wordBreak: "keep-all",
              textWrap: "balance",
              color: isCta ? "#111111" : "#FFFFFF",
              textShadow: isCta ? "none" : "0 8px 30px rgba(0,0,0,0.42)",
              fontFamily: theme.displayFont,
            }}
          >
            {scene.text}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: side,
          right: side,
          bottom: bottom + 92,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: spring({
            frame: frame - 18,
            fps,
            config: { damping: 20, stiffness: 88 },
          }),
        }}
      >
        {scene.subtitleLines.slice(0, 2).map((line, index) => (
          <div
            key={`${line}-${index}`}
            style={{
              maxWidth: "100%",
              padding: "14px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.9)",
              color: "#111111",
              fontSize: referenceCardSubtitleFontSize(line),
              fontWeight: 900,
              lineHeight: 1.22,
              letterSpacing: "-0.03em",
              boxShadow: "0 16px 34px rgba(0,0,0,0.24)",
              backdropFilter: "blur(12px)",
              fontFamily: theme.bodyFont,
              wordBreak: "keep-all",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: side,
          right: side,
          bottom: bottom + 42,
        }}
      >
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(6, progress * 100)}%`,
              height: "100%",
              borderRadius: 999,
              background: theme.accent,
              boxShadow: `0 0 18px ${theme.accent}99`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

function roleLabel(role: LayoutProps["scene"]["role"]): string {
  if (role === "hook") return "HOOK";
  if (role === "payoff") return "POINT";
  if (role === "cta") return "ACTION";
  return "CARD";
}

function cardKicker(role: LayoutProps["scene"]["role"], index: number): string {
  if (role === "hook") return "OPENING";
  if (role === "payoff") return "KEY POINT";
  if (role === "cta") return "NEXT STEP";
  return `POINT ${String(index - 1).padStart(2, "0")}`;
}
