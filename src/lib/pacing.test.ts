import { describe, expect, it } from "vitest";
import { calculateSceneDuration, optimizePacing } from "./pacing";

describe("calculateSceneDuration", () => {
	it("returns at least the role minimum", () => {
		const result = calculateSceneDuration({
			text: "짧",
			role: "hook",
			language: "ko",
			subtitleLines: ["짧"],
		});
		expect(result.duration).toBeGreaterThanOrEqual(3);
	});

	it("clamps to MAX_DURATION 8", () => {
		const longText = "긴".repeat(500);
		const result = calculateSceneDuration({
			text: longText,
			role: "build",
			language: "ko",
			subtitleLines: [longText],
		});
		expect(result.duration).toBeLessThanOrEqual(8);
	});

	it("English text uses different reading speed", () => {
		const koResult = calculateSceneDuration({
			text: "이것은 한국어 텍스트입니다",
			role: "build",
			language: "ko",
			subtitleLines: ["이것은 한국어 텍스트입니다"],
		});
		const enResult = calculateSceneDuration({
			text: "this is english text",
			role: "build",
			language: "en",
			subtitleLines: ["this is english text"],
		});
		expect(koResult.duration).not.toBe(enResult.duration);
	});

	it("rounds duration to 0.1s precision", () => {
		const result = calculateSceneDuration({
			text: "테스트 문장",
			role: "build",
			language: "ko",
			subtitleLines: ["테스트 문장"],
		});
		expect(Math.round(result.duration * 10) / 10).toBe(result.duration);
	});
});

describe("optimizePacing", () => {
	it("returns ideal durations when no target given", () => {
		const result = optimizePacing([
			{ text: "훅 텍스트", role: "hook", language: "ko", subtitleLines: ["훅 텍스트"] },
			{ text: "빌드 텍스트", role: "build", language: "ko", subtitleLines: ["빌드 텍스트"] },
		]);
		expect(result).toHaveLength(2);
		expect(result.every((d) => d > 0)).toBe(true);
	});

	it("scales to approximately match target duration", () => {
		const result = optimizePacing(
			[
				{ text: "훅", role: "hook", language: "ko", subtitleLines: ["훅"] },
				{ text: "빌드 1", role: "build", language: "ko", subtitleLines: ["빌드 1"] },
				{ text: "페이오프", role: "payoff", language: "ko", subtitleLines: ["페이오프"] },
			],
			30,
		);
		const total = result.reduce((a, b) => a + b, 0);
		expect(total).toBeCloseTo(30, 0);
	});

	it("respects per-role minimum even when scaling down", () => {
		const result = optimizePacing(
			[{ text: "x", role: "hook", language: "ko", subtitleLines: ["x"] }],
			1,
		);
		expect(result[0]).toBeGreaterThanOrEqual(3);
	});
});
