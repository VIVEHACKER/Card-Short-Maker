import type { ShortsProject } from "../types";
import type { CardShortsProps, CardShortsScene } from "./types";
import { getPresetByPlatform } from "../lib/export-presets";

export function projectToCardShortsProps(
  project: ShortsProject,
): CardShortsProps {
  const scenes: CardShortsScene[] = project.scenes.map((s) => ({
    id: s.id,
    index: s.index,
    text: s.text,
    duration: s.duration,
    role: s.role,
    mediaQuery: s.media.query,
    mediaImageUrl: s.media.generatedImageUrl,
    subtitleLines: s.subtitles.lines,
    emphasisWords: s.subtitles.emphasis,
    audioUrl: s.voice.generatedAudioUrl,
    notes: s.notes,
    layout: s.layout,
    transition: s.transition,
  }));

  const preset = getPresetByPlatform(project.brief.platform);

  return {
    title: project.brief.title,
    channel: project.channel,
    accent: project.accent,
    scenes,
    bgm: project.bgmUrl ? { url: project.bgmUrl } : undefined,
    safeZone: preset.safeZone,
  };
}
