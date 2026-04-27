import { describe, expect, it } from "vitest";
import {
	AI_FETCH_DEFAULT_BACKOFF_MS,
	AI_FETCH_DEFAULT_TIMEOUT_MS,
	AI_FETCH_MAX_RETRIES,
	BRIEF_DURATION_MAX_SECONDS,
	BRIEF_DURATION_MIN_SECONDS,
	ENGLISH_WORDS_PER_SECOND,
	KOREAN_CHARS_PER_SECOND,
	NOTICE_TIMEOUT_ERROR_MS,
	NOTICE_TIMEOUT_INFO_MS,
	RENDER_FPS,
	RENDER_HEIGHT,
	RENDER_INTRO_SECONDS,
	RENDER_OUTRO_SECONDS,
	RENDER_TRANSITION_OVERLAP_FRAMES,
	RENDER_TRANSITION_OVERLAP_SECONDS,
	RENDER_WIDTH,
	SCENE_DURATION_MAX_SECONDS,
	SCENE_DURATION_MIN_SECONDS,
	STORAGE_KEY_AI_CONFIG,
	STORAGE_KEY_AI_SECRETS,
	STORAGE_KEY_LAST_BRIEF,
	STORAGE_KEY_PROJECTS,
} from "./constants";

describe("render constants", () => {
	it("FPS and dimensions are vertical-9:16 sane", () => {
		expect(RENDER_FPS).toBe(30);
		expect(RENDER_WIDTH).toBe(1080);
		expect(RENDER_HEIGHT).toBe(1920);
		expect(RENDER_HEIGHT).toBeGreaterThan(RENDER_WIDTH);
	});

	it("intro/outro seconds are positive and modest", () => {
		expect(RENDER_INTRO_SECONDS).toBeGreaterThan(0);
		expect(RENDER_OUTRO_SECONDS).toBeGreaterThan(0);
		expect(RENDER_INTRO_SECONDS + RENDER_OUTRO_SECONDS).toBeLessThan(10);
	});

	it("transition overlap frames matches seconds at FPS", () => {
		// frames ≈ seconds × FPS
		expect(RENDER_TRANSITION_OVERLAP_FRAMES / RENDER_FPS).toBeCloseTo(
			RENDER_TRANSITION_OVERLAP_SECONDS,
			1,
		);
	});
});

describe("validation bounds", () => {
	it("scene duration min is positive and less than max", () => {
		expect(SCENE_DURATION_MIN_SECONDS).toBeGreaterThan(0);
		expect(SCENE_DURATION_MIN_SECONDS).toBeLessThan(SCENE_DURATION_MAX_SECONDS);
	});

	it("brief duration min is positive and less than max", () => {
		expect(BRIEF_DURATION_MIN_SECONDS).toBeGreaterThan(0);
		expect(BRIEF_DURATION_MIN_SECONDS).toBeLessThan(BRIEF_DURATION_MAX_SECONDS);
	});

	it("scene min ≤ brief min (a single scene must fit)", () => {
		expect(SCENE_DURATION_MIN_SECONDS).toBeLessThanOrEqual(BRIEF_DURATION_MIN_SECONDS);
	});
});

describe("AI fetch constants", () => {
	it("timeout is positive", () => {
		expect(AI_FETCH_DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
	});

	it("max retries is non-negative integer", () => {
		expect(Number.isInteger(AI_FETCH_MAX_RETRIES)).toBe(true);
		expect(AI_FETCH_MAX_RETRIES).toBeGreaterThanOrEqual(0);
	});

	it("backoff steps non-decreasing", () => {
		for (let i = 1; i < AI_FETCH_DEFAULT_BACKOFF_MS.length; i++) {
			expect(AI_FETCH_DEFAULT_BACKOFF_MS[i]).toBeGreaterThanOrEqual(
				AI_FETCH_DEFAULT_BACKOFF_MS[i - 1]!,
			);
		}
	});
});

describe("notice timeouts", () => {
	it("error timeout is longer than info timeout", () => {
		expect(NOTICE_TIMEOUT_ERROR_MS).toBeGreaterThan(NOTICE_TIMEOUT_INFO_MS);
	});
});

describe("language pacing", () => {
	it("Korean and English have positive reading speed", () => {
		expect(KOREAN_CHARS_PER_SECOND).toBeGreaterThan(0);
		expect(ENGLISH_WORDS_PER_SECOND).toBeGreaterThan(0);
	});
});

describe("storage keys", () => {
	it("are unique strings under shorts-studio namespace", () => {
		const keys = [
			STORAGE_KEY_PROJECTS,
			STORAGE_KEY_AI_CONFIG,
			STORAGE_KEY_AI_SECRETS,
			STORAGE_KEY_LAST_BRIEF,
		];
		expect(new Set(keys).size).toBe(keys.length);
		for (const k of keys) {
			expect(k.startsWith("shorts-studio")).toBe(true);
		}
	});
});
