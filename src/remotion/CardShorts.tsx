import {
  AbsoluteFill,
  Audio,
  Sequence,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { resolveTheme } from "./themes";
import type { CardShortsProps } from "./types";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { TitleBar } from "./components/TitleBar";
import { SceneCard } from "./components/SceneCard";
import { resolveTransition } from "./transitions";
import { BGMLayer } from "./overlays/BGMLayer";
import { resolveIntroTemplate } from "./templates/IntroTemplates";
import { resolveOutroTemplate } from "./templates/OutroTemplates";
import {
  RENDER_FPS as FPS,
  RENDER_INTRO_SECONDS as INTRO_SECONDS,
  RENDER_OUTRO_SECONDS as OUTRO_SECONDS,
  RENDER_TRANSITION_OVERLAP_FRAMES,
  RENDER_TRANSITION_OVERLAP_SECONDS,
} from "../lib/constants";

/**
 * Main CardShorts composition — vertical 1080x1920, 30fps.
 * Uses TransitionSeries for animated transitions between scenes.
 */
export const CardShorts: React.FC<CardShortsProps> = ({
  title,
  channel,
  accent,
  themeName,
  scenes,
  bgm,
  introTemplate,
  outroTemplate,
  safeZone,
}) => {
  const theme = resolveTheme(accent, themeName);

  const INTRO_FRAMES = Math.round(INTRO_SECONDS * FPS);
  const OUTRO_FRAMES = Math.round(OUTRO_SECONDS * FPS);

  const IntroComponent = resolveIntroTemplate(introTemplate);
  const OutroComponent = resolveOutroTemplate(outroTemplate);

  // Calculate start times for audio alignment
  // TransitionSeries handles visual timing; audio needs absolute offsets
  let audioOffset = INTRO_FRAMES;
  const audioOffsets: number[] = [];
  for (const scene of scenes) {
    audioOffsets.push(audioOffset);
    audioOffset +=
      Math.round(scene.duration * FPS) - RENDER_TRANSITION_OVERLAP_FRAMES;
  }

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        fontFamily: theme.headingFont,
      }}
    >
      {/* Layer 0: Animated background */}
      <AnimatedBackground theme={theme} />

      {/* Layer 1: TransitionSeries — Intro + Scene cards with transitions */}
      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroComponent
            title={title}
            channel={channel}
            accent={accent || theme.accent}
            theme={theme}
          />
        </TransitionSeries.Sequence>

        {/* Intro → first scene transition */}
        {scenes.length > 0 && (() => {
          const t = resolveTransition(scenes[0]?.transition);
          return (
            <TransitionSeries.Transition
              presentation={t.presentation}
              timing={t.timing}
            />
          );
        })()}

        {/* Scene cards with transitions */}
        {scenes.map((scene, i) => {
          const frames = Math.round(scene.duration * FPS);
          const nextScene = scenes[i + 1];

          return [
            <TransitionSeries.Sequence
              key={scene.id}
              durationInFrames={frames}
            >
              <SceneCard
                scene={scene}
                title={title}
                channel={channel}
                theme={theme}
                totalScenes={scenes.length}
                safeZone={safeZone}
              />
            </TransitionSeries.Sequence>,

            // Transition to next scene
            nextScene ? (() => {
              const t = resolveTransition(nextScene.transition);
              return (
                <TransitionSeries.Transition
                  key={`t-${scene.id}`}
                  presentation={t.presentation}
                  timing={t.timing}
                />
              );
            })() : null,
          ];
        })}

        {/* Outro transition + sequence */}
        {scenes.length > 0 && (() => {
          const t = resolveTransition("fade");
          return (
            <TransitionSeries.Transition
              presentation={t.presentation}
              timing={t.timing}
            />
          );
        })()}
        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
          <OutroComponent
            channel={channel}
            accent={accent || theme.accent}
            theme={theme}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Layer 2: Persistent title bar (fades in after intro) */}
      <Sequence from={INTRO_FRAMES}>
        <TitleBar title={title} channel={channel} theme={theme} />
      </Sequence>

      {/* Layer 3: Audio tracks (positioned absolutely, not inside TransitionSeries) */}
      {scenes.map((scene, i) =>
        scene.audioUrl ? (
          <Sequence
            key={`audio-${scene.id}`}
            from={audioOffsets[i]!}
            durationInFrames={Math.round(scene.duration * FPS)}
          >
            <Audio src={scene.audioUrl} volume={1} />
          </Sequence>
        ) : null,
      )}

      {/* Layer 4: Background music with ducking */}
      {bgm?.url && (
        <BGMLayer
          bgm={bgm}
          scenes={scenes}
          scenesStartFrame={INTRO_FRAMES}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Calculate total duration based on scenes.
 */
export function calculateCardShortsDuration(
  scenes: CardShortsProps["scenes"],
): number {
  const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const transitionOverlap =
    Math.max(0, scenes.length + 1) * RENDER_TRANSITION_OVERLAP_SECONDS;
  return Math.ceil(
    (INTRO_SECONDS + totalSceneDuration + OUTRO_SECONDS - transitionOverlap + 0.5) * FPS,
  );
}
