/**
 * Background music layer with intelligent volume ducking.
 * Fades in at start, ducks when TTS is playing, fades out at end.
 */
import { Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BGMConfig, CardShortsScene } from "../types";

interface BGMLayerProps {
  bgm: BGMConfig;
  scenes: CardShortsScene[];
  /** Frame offset where scenes start (after intro) */
  scenesStartFrame: number;
}

const FPS = 30;

export const BGMLayer: React.FC<BGMLayerProps> = ({
  bgm,
  scenes,
  scenesStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const baseVolume = bgm.volume ?? 0.25;
  const duckVolume = bgm.duckVolume ?? 0.08;
  const fadeInFrames = Math.round((bgm.fadeIn ?? 1.5) * fps);
  const fadeOutFrames = Math.round((bgm.fadeOut ?? 2.5) * fps);

  // Build TTS active ranges for ducking
  const ttsRanges = buildTTSRanges(scenes, scenesStartFrame);

  return (
    <Audio
      src={bgm.url}
      loop
      volume={(f) => {
        // Fade in envelope
        const fadeIn = interpolate(f, [0, fadeInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Fade out envelope
        const fadeOut = interpolate(
          f,
          [durationInFrames - fadeOutFrames, durationInFrames],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        const envelope = Math.min(fadeIn, fadeOut);

        // Ducking — check if any TTS is active at this frame
        const isDucking = ttsRanges.some(
          (r) => f >= r.start - 4 && f <= r.end + 6,
        );

        // Smooth duck transition (~200ms attack, ~400ms release)
        const duckAttackFrames = Math.round(0.2 * fps);
        const duckReleaseFrames = Math.round(0.4 * fps);

        let duckFactor = 1;
        if (isDucking) {
          // Find nearest TTS range for smooth interpolation
          for (const r of ttsRanges) {
            if (f >= r.start - duckAttackFrames && f <= r.end + duckReleaseFrames) {
              const attackProgress = interpolate(
                f,
                [r.start - duckAttackFrames, r.start],
                [1, duckVolume / baseVolume],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const releaseProgress = interpolate(
                f,
                [r.end, r.end + duckReleaseFrames],
                [duckVolume / baseVolume, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

              if (f < r.start) {
                duckFactor = Math.min(duckFactor, attackProgress);
              } else if (f > r.end) {
                duckFactor = Math.min(duckFactor, releaseProgress);
              } else {
                duckFactor = Math.min(duckFactor, duckVolume / baseVolume);
              }
            }
          }
        }

        return baseVolume * envelope * duckFactor;
      }}
    />
  );
};

interface FrameRange {
  start: number;
  end: number;
}

function buildTTSRanges(
  scenes: CardShortsScene[],
  scenesStartFrame: number,
): FrameRange[] {
  const ranges: FrameRange[] = [];
  let offset = scenesStartFrame;

  for (const scene of scenes) {
    const sceneFrames = Math.round(scene.duration * FPS);
    if (scene.audioUrl) {
      ranges.push({
        start: offset,
        end: offset + sceneFrames,
      });
    }
    offset += sceneFrames - 6; // account for transition overlap
  }

  return ranges;
}
