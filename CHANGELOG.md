# Changelog

All notable changes to Card Short Maker.

## [Unreleased]

### Added
- WebVTT (`subtitles.vtt`) and ASS (`subtitles.ass`) subtitle formats in render packages
- Three new themes: `ocean`, `sunset`, `paper`
- Two new transitions: `blur`, `zoomOut`
- AI response cache (sessionStorage with TTL)
- Project validation utilities (`validateBrief`, `validateScene`, `validateProject`)
- Project metrics aggregator (`computeProjectMetrics`)
- Structured diagnostics (`startSpan`/`endSpan`/`trackSpan`/`summarize`)
- Keyboard shortcut hook (`useKeyboardShortcuts`)
- Auto-save hook with debounce + max-gap (`useAutoSave`)
- Error banner component + hook (`ErrorBanner`, `useErrors`)
- CLI commands: `metrics`, `doctor`
- Centralized constants module (`src/lib/constants.ts`)
- Language-specific stopwords (`KO_STOPWORDS`, `EN_STOPWORDS`)

### Changed
- `buildAutoDraftFromTitle` now generates a 6-line script template (was empty)
- Magic numbers in `CardShorts.tsx` (FPS, intro/outro, transition overlap) moved to constants
- Storage keys centralized via `STORAGE_KEY_*` constants

### Fixed
- 3 failing tests: `title-autofill` deterministic output and `config` storage assertions
- Removed dead code (`distributeDurations` in `useAIPipeline`)
- Updated `architecture.md` to reflect current modules and CLI commands

### Tests
- 17 → 93 tests across 17 files
- Coverage added: pacing, export-presets, project-io, validation, stopwords,
  bgm-presets, themes, subtitle-formats, ai/cache, ai/fallback, render-package,
  diagnostics, project-metrics

## [0.1.0] - 2026-04-18

### Added
- Initial Remotion-based composition with 8 layouts and 7 transitions
- AI pipeline (OpenAI / Google / Anthropic) with fallback chain
- Pexels + Pixabay stock media integration
- Piper TTS with macOS `say` fallback
- BGM ducking layer
- Platform-specific safe zones (YouTube Shorts / TikTok / Reels)
