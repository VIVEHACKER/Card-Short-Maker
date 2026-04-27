/**
 * Project-wide constants. Centralizes magic numbers used across CLI, UI, and Remotion render.
 */

// Storage keys (browser persistence)
export const STORAGE_KEY_PROJECTS = "shorts-studio:v2";
export const STORAGE_KEY_AI_CONFIG = "shorts-studio:ai-config";
export const STORAGE_KEY_AI_SECRETS = "shorts-studio:ai-secrets";
export const STORAGE_KEY_LAST_BRIEF = "shorts-studio:last-brief";

// Render constants
export const RENDER_FPS = 30;
export const RENDER_WIDTH = 1080;
export const RENDER_HEIGHT = 1920;
export const RENDER_INTRO_SECONDS = 2;
export const RENDER_OUTRO_SECONDS = 2.5;
/** Frames overlapped during a transition (visual carryover). */
export const RENDER_TRANSITION_OVERLAP_FRAMES = 6;
/** Average overlap per transition expressed in seconds. Mirrors RENDER_TRANSITION_OVERLAP_FRAMES at RENDER_FPS. */
export const RENDER_TRANSITION_OVERLAP_SECONDS = 0.2;

// Brief / scene validation
export const SCENE_DURATION_MIN_SECONDS = 1.5;
export const SCENE_DURATION_MAX_SECONDS = 12;
export const BRIEF_DURATION_MIN_SECONDS = 15;
export const BRIEF_DURATION_MAX_SECONDS = 60;
export const BRIEF_TITLE_MAX_LENGTH = 80;
export const BRIEF_THESIS_MAX_LENGTH = 240;

// Notice / toast timeouts
export const NOTICE_TIMEOUT_INFO_MS = 3_000;
export const NOTICE_TIMEOUT_ERROR_MS = 15_000;

// AI fetch defaults
export const AI_FETCH_DEFAULT_TIMEOUT_MS = 30_000;
export const AI_FETCH_DEFAULT_BACKOFF_MS = [1_000, 3_000];
export const AI_FETCH_MAX_RETRIES = 2;

// Korean language pacing — average characters readable per second.
export const KOREAN_CHARS_PER_SECOND = 3.5;
export const ENGLISH_WORDS_PER_SECOND = 2.6;

// Subtitle density — characters per second above which we mark warn.
export const SUBTITLE_WARN_CPS = 5;
