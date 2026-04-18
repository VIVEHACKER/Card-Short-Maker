export type Intent = "info" | "opinion" | "story";
export type Tone = "neutral" | "serious" | "energetic" | "urgent";
export type Platform = "youtube" | "tiktok" | "reels";
export type Language = "ko" | "en";
export type SceneRole = "hook" | "build" | "payoff" | "cta";
export type MediaType = "image" | "gif" | "video";
export type ProjectStatus = "editing" | "review" | "rendered" | "failed";
export type Verdict = "pass" | "revise";
export type ExecutionMode = "local" | "byo-api" | "hybrid";
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
