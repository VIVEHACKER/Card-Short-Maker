import type { Tone } from "../types";

export interface BGMPreset {
  id: string;
  name: string;
  nameKo: string;
  /** Public URL — uses royalty-free sources */
  url: string;
  tone: Tone[];
  bpm: number;
}

/**
 * Built-in BGM presets using Pixabay Music (royalty-free, no attribution required).
 * URLs point to direct download links from pixabay.com/music.
 *
 * In production, these should be hosted on your own CDN.
 * For now they serve as placeholders — users can override with custom URLs.
 */
export const BGM_PRESETS: BGMPreset[] = [
  {
    id: "lofi-chill",
    name: "Lo-Fi Chill",
    nameKo: "로파이 칠",
    url: "",
    tone: ["neutral"],
    bpm: 85,
  },
  {
    id: "upbeat-tech",
    name: "Upbeat Tech",
    nameKo: "업비트 테크",
    url: "",
    tone: ["energetic"],
    bpm: 120,
  },
  {
    id: "cinematic-tension",
    name: "Cinematic Tension",
    nameKo: "시네마틱 텐션",
    url: "",
    tone: ["serious", "urgent"],
    bpm: 90,
  },
  {
    id: "minimal-ambient",
    name: "Minimal Ambient",
    nameKo: "미니멀 앰비언트",
    url: "",
    tone: ["neutral", "serious"],
    bpm: 70,
  },
  {
    id: "warm-acoustic",
    name: "Warm Acoustic",
    nameKo: "웜 어쿠스틱",
    url: "",
    tone: ["neutral", "energetic"],
    bpm: 100,
  },
];

/** Match a brief tone to the best BGM preset */
export function matchBGMByTone(tone: Tone): BGMPreset {
  const match = BGM_PRESETS.find((p) => p.tone.includes(tone));
  return match ?? BGM_PRESETS[0]!;
}

/** Get preset by ID */
export function getBGMPreset(id: string): BGMPreset | undefined {
  return BGM_PRESETS.find((p) => p.id === id);
}
