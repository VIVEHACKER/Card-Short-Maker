/**
 * Word-by-word subtitle overlay with emphasis highlighting.
 * CapCut-style — each word appears timed, emphasis words glow in accent color.
 */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CardTheme } from "../themes";

interface SubtitleOverlayProps {
  lines: string[];
  emphasisWords: string[];
  theme: CardTheme;
}

/** Tokenize subtitle lines into individual words with line info */
function tokenize(lines: string[]): Array<{ word: string; lineIdx: number }> {
  const tokens: Array<{ word: string; lineIdx: number }> = [];
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const words = lines[lineIdx]!.split(/\s+/).filter(Boolean);
    for (const word of words) {
      tokens.push({ word, lineIdx });
    }
  }
  return tokens;
}

/** Check if a word should be emphasized */
function isEmphasis(word: string, emphasisWords: string[]): boolean {
  const clean = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();
  return emphasisWords.some(
    (e) => clean.includes(e.toLowerCase()) || e.toLowerCase().includes(clean),
  );
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  lines,
  emphasisWords,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (lines.length === 0) return null;

  const tokens = tokenize(lines);
  const totalTokens = tokens.length;

  // Each word gets a reveal time proportional to its position
  // Words appear between frame 8 and 70% of duration
  const revealEnd = Math.max(20, durationInFrames * 0.7);
  const revealStart = 8;

  // Container entrance
  const containerReveal = spring({
    frame: frame - 6,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  // Group tokens back into lines for rendering
  const lineGroups: Array<Array<{ word: string; tokenIdx: number; isEmph: boolean }>> = [];
  let tokenIdx = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineTokens: Array<{ word: string; tokenIdx: number; isEmph: boolean }> = [];
    for (const token of tokens) {
      if (token.lineIdx === lineIdx) {
        lineTokens.push({
          word: token.word,
          tokenIdx,
          isEmph: isEmphasis(token.word, emphasisWords),
        });
        tokenIdx++;
      }
    }
    lineGroups.push(lineTokens);
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 170,
        left: 36,
        right: 36,
        opacity: containerReveal,
        transform: `translateY(${interpolate(containerReveal, [0, 1], [16, 0])}px)`,
      }}
    >
      <div
        style={{
          background: theme.subtitleBg,
          borderRadius: 18,
          padding: "20px 32px",
          textAlign: "center",
          backdropFilter: "blur(14px)",
          border: `1px solid ${theme.accent}15`,
        }}
      >
        {lineGroups.map((lineTokens, lineIdx) => (
          <div
            key={lineIdx}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0 10px",
              lineHeight: 1.6,
            }}
          >
            {lineTokens.map((token) => {
              // Calculate this word's reveal timing
              const wordProgress = totalTokens > 1
                ? token.tokenIdx / (totalTokens - 1)
                : 0;
              const wordRevealFrame = revealStart + wordProgress * (revealEnd - revealStart);

              const wordOpacity = interpolate(
                frame,
                [wordRevealFrame - 2, wordRevealFrame + 3],
                [0.3, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

              // Active word detection — currently revealing
              const isActive =
                frame >= wordRevealFrame - 2 && frame <= wordRevealFrame + 8;

              // Scale pop on active
              const activeScale = isActive
                ? interpolate(
                    frame,
                    [wordRevealFrame, wordRevealFrame + 4, wordRevealFrame + 8],
                    [1, 1.08, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )
                : 1;

              const color = token.isEmph
                ? theme.accent
                : isActive
                  ? theme.text
                  : `${theme.text}CC`;

              const textShadow = token.isEmph && isActive
                ? `0 0 16px ${theme.accent}66, 0 0 4px ${theme.accent}44`
                : token.isEmph
                  ? `0 0 8px ${theme.accent}33`
                  : "none";

              return (
                <span
                  key={token.tokenIdx}
                  style={{
                    fontSize: token.isEmph ? 38 : 34,
                    fontWeight: token.isEmph ? 800 : 600,
                    color,
                    opacity: wordOpacity,
                    transform: `scale(${activeScale})`,
                    fontFamily: token.isEmph ? theme.displayFont : theme.bodyFont,
                    textShadow,
                    display: "inline-block",
                    willChange: "opacity, transform",
                  }}
                >
                  {token.word}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
