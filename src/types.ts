/** Editorial intent of a brief — drives tone, hook style, and pacing. */
export type Intent = "info" | "opinion" | "story";
/** Voice/tone signal for delivery and BGM matching. */
export type Tone = "neutral" | "serious" | "energetic" | "urgent";
/** Distribution target — controls aspect ratio safe-zone, intro template. */
export type Platform = "youtube" | "tiktok" | "reels";
/** Spoken language — controls TTS voice and pacing heuristics. */
export type Language = "ko" | "en";
/** Narrative role for a scene — affects layout and transition selection. */
export type SceneRole = "hook" | "build" | "payoff" | "cta";
/** Media asset kind for a scene background. */
export type MediaType = "image" | "gif" | "video";
/** Project lifecycle stage shown in the dashboard. */
export type ProjectStatus = "editing" | "review" | "rendered" | "failed";
/** QA verdict for a project. */
export type Verdict = "pass" | "revise";
/** Execution policy — picks between local-only, BYO API, or hybrid. */
export type ExecutionMode = "local" | "byo-api" | "hybrid";
/** Cost expectation associated with the active execution mode. */
export type RuntimeCostModel = "free-local" | "user-api" | "mixed";

export interface RuntimeProfile {
  mode: ExecutionMode;
  costModel: RuntimeCostModel;
  ffmpeg: "bundled" | "system";
  scriptProvider: string;
  qaProvider: string;
  ttsProvider: string;
  mediaProvider: string;
  install: string[];
}

export interface Brief {
  id: string;
  title: string;
  topic: string;
  intent: Intent;
  tone: Tone;
  targetDuration: number;
  platform: Platform;
  language: Language;
  audience: string;
  thesis: string;
}

export interface SubtitleBlock {
  id: string;
  lines: string[];
  emphasis: string[];
}

export interface MediaSpec {
  type: MediaType;
  query: string;
  style: string;
  tags: string[];
  sourceHint: string;
  generatedImageUrl?: string;
}

export interface VoiceSpec {
  provider: string;
  speed: number;
  emotion: "neutral" | "serious" | "energetic";
  generatedAudioUrl?: string;
  voiceId?: string;
}

export interface Scene {
  id: string;
  index: number;
  text: string;
  duration: number;
  role: SceneRole;
  media: MediaSpec;
  subtitles: SubtitleBlock;
  voice: VoiceSpec;
  notes: string;
  /** Layout template — assigned automatically by role */
  layout?: string;
  /** Transition type between scenes */
  transition?: string;
}

export interface QuantitativeQa {
  subtitleDensity: "ok" | "warn";
  sceneDuration: "ok" | "warn";
  audioSync: "ok" | "warn";
  cutFrequency: "ok" | "warn";
}

export interface QualitativeQa {
  overall: number;
  hookStrength: number;
  scriptFlow: number;
  visualFit: number;
  subtitleReadability: number;
  pacing: number;
  ctaFinish: number;
  originality: number;
  creatorPersona: number;
}

export interface QaReport {
  quantitative: QuantitativeQa;
  qualitative: QualitativeQa;
  verdict: Verdict;
  issues: string[];
  recommendation: string;
}

export interface ShortsProject {
  id: string;
  channel: string;
  preset: string;
  accent: string;
  runtime: RuntimeProfile;
  brief: Brief;
  script: string;
  scenes: Scene[];
  qa: QaReport;
  updatedAt: string;
  readiness: number;
  status: ProjectStatus;
  /** BGM audio URL (optional) */
  bgmUrl?: string;
  /** BGM preset ID for auto-matching */
  bgmPresetId?: string;
}

export interface RenderManifest {
  projectId: string;
  title: string;
  targetDuration: number;
  scenes: Array<{
    id: string;
    role: SceneRole;
    duration: number;
    text: string;
    mediaQuery: string;
    subtitle: string[];
    voice: VoiceSpec;
  }>;
  qa: QaReport;
}

export interface RenderPackage {
  project: ShortsProject;
  manifest: RenderManifest;
  subtitlesSrt: string;
  ffmpegConcat: string;
  readme: string;
}
