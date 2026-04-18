/**
 * Auto-pacing engine — calculates optimal scene durations
 * based on text length, language, and scene role.
 */
import type { Language, SceneRole } from "../types";

/** Reading speed constants */
const CHARS_PER_SECOND: Record<Language, number> = {
  ko: 3.5,  // Korean: ~3.5 characters/second comfortable reading
  en: 12,   // English: ~12 characters/second (~2.5 words/second)
};

/** Minimum scene duration by role (seconds) */
const MIN_DURATION: Record<SceneRole, number> = {
  hook: 3.0,    // hooks need impact time
  build: 2.8,   // builds carry information
  payoff: 3.0,  // payoffs need comprehension time
  cta: 3.5,     // CTAs need action processing time
};

/** Extra padding by role (seconds) */
const ROLE_PADDING: Record<SceneRole, number> = {
  hook: 0.8,    // dramatic pause after hook
  build: 0.3,   // slight breathing room
  payoff: 0.5,  // let the message land
  cta: 1.0,     // time to process call-to-action
};

/** Maximum scene duration to maintain engagement */
const MAX_DURATION = 8.0;

export interface PacingInput {
  text: string;
  role: SceneRole;
  language: Language;
  subtitleLines: string[];
}

export interface PacingResult {
  duration: number;
  readingTime: number;
  totalWithPadding: number;
}

/**
 * Calculate optimal duration for a single scene.
 */
export function calculateSceneDuration(input: PacingInput): PacingResult {
  const { text, role, language } = input;

  // Calculate raw reading time
  const charCount = text.replace(/\s+/g, "").length;
  const readingSpeed = CHARS_PER_SECOND[language];
  const readingTime = charCount / readingSpeed;

  // Add role-specific padding
  const padding = ROLE_PADDING[role];
  const totalWithPadding = readingTime + padding;

  // Clamp between min and max
  const minDur = MIN_DURATION[role];
  const duration = Math.max(minDur, Math.min(MAX_DURATION, totalWithPadding));

  // Round to 0.1s
  return {
    duration: Math.round(duration * 10) / 10,
    readingTime: Math.round(readingTime * 10) / 10,
    totalWithPadding: Math.round(totalWithPadding * 10) / 10,
  };
}

/**
 * Optimize durations for all scenes while respecting a target total duration.
 * If targetDuration is provided, scales proportionally to fit.
 */
export function optimizePacing(
  scenes: PacingInput[],
  targetDuration?: number,
): number[] {
  // Calculate ideal durations
  const ideal = scenes.map((s) => calculateSceneDuration(s));
  const idealDurations = ideal.map((r) => r.duration);

  if (!targetDuration) {
    return idealDurations;
  }

  // Scale to target duration
  const idealTotal = idealDurations.reduce((a, b) => a + b, 0);
  if (idealTotal === 0) {
    return idealDurations;
  }

  const scale = targetDuration / idealTotal;

  // Scale but respect minimums
  const scaled = idealDurations.map((d, i) => {
    const min = MIN_DURATION[scenes[i]!.role];
    return Math.max(min, Math.round(d * scale * 10) / 10);
  });

  // Adjust to exactly match target (distribute remainder to longest scene)
  const scaledTotal = scaled.reduce((a, b) => a + b, 0);
  const gap = Math.round((targetDuration - scaledTotal) * 10) / 10;

  if (gap !== 0 && scaled.length > 0) {
    // Find the longest non-hook scene to absorb the difference
    let targetIdx = 0;
    let maxDur = 0;
    for (let i = 0; i < scaled.length; i++) {
      if (scaled[i]! > maxDur && scenes[i]!.role !== "hook") {
        maxDur = scaled[i]!;
        targetIdx = i;
      }
    }
    scaled[targetIdx] = Math.max(
      MIN_DURATION[scenes[targetIdx]!.role],
      Math.round((scaled[targetIdx]! + gap) * 10) / 10,
    );
  }

  return scaled;
}
