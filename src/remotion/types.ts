import type { SceneRole } from "../types";

export interface CardShortsScene {
  id: string;
  index: number;
  text: string;
  duration: number;
  role: SceneRole;
  mediaQuery: string;
  mediaImageUrl?: string;
  subtitleLines: string[];
  emphasisWords: string[];
  audioUrl?: string;
  notes: string;
  /** Layout template name — defaults to "centered" if absent */
  layout?: string;
  /** Transition type — defaults to "fade" if absent */
  transition?: string;
}

export interface BGMConfig {
  /** URL to BGM audio file */
  url: string;
  /** Base volume 0-1 (default 0.25) */
  volume?: number;
  /** Fade in seconds (default 1.5) */
  fadeIn?: number;
  /** Fade out seconds (default 2.5) */
  fadeOut?: number;
  /** Duck volume when TTS is playing (default 0.08) */
  duckVolume?: number;
}

export interface CardShortsProps {
  [key: string]: unknown;
  title: string;
  channel: string;
  accent: string;
  themeName?: string;
  scenes: CardShortsScene[];
  audioUrl?: string;
  /** Background music configuration */
  bgm?: BGMConfig;
  /** Intro template name (default/bold/minimal/branded) */
  introTemplate?: string;
  /** Outro template name (subscribe/replay/minimal) */
  outroTemplate?: string;
  /** Platform safe zone — adjusts subtitle/progress bar positions */
  safeZone?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}
