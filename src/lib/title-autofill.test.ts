import { describe, expect, it } from "vitest";
import { buildAutoDraftFromTitle } from "./title-autofill";
import type { Brief } from "../types";

const baseBrief: Brief = {
	id: "brief-test",
	title: "",
	topic: "",
	intent: "info",
	tone: "serious",
	targetDuration: 34,
	platform: "youtube",
	language: "ko",
	audience: "",
	thesis: "",
};

describe("buildAutoDraftFromTitle", () => {
	it("keeps intent and tone when no explicit keyword exists", () => {
		const brief = {
			...baseBrief,
			intent: "story" as const,
			tone: "energetic" as const,
		};
		const result = buildAutoDraftFromTitle("AI 협업 구조 설계", brief);

		expect(result.brief.intent).toBe("story");
		expect(result.brief.tone).toBe("energetic");
	});

	it("parses explicit duration from title", () => {
		const result = buildAutoDraftFromTitle("AI 자동화 45초 요약", baseBrief);
		expect(result.brief.targetDuration).toBe(45);
	});

	it("returns deterministic output for the same title", () => {
		const first = buildAutoDraftFromTitle("신입 온보딩 구조", baseBrief);
		const second = buildAutoDraftFromTitle("신입 온보딩 구조", baseBrief);

		expect(first.brief).toEqual(second.brief);
		expect(first.script).toBe(second.script);
		expect(first.script.split("\n").length).toBe(6);
	});
});
