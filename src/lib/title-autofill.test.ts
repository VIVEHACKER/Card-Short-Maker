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

	it("rebuilds audience and thesis from the new title", () => {
		const staleBrief: Brief = {
			...baseBrief,
			audience: "이전 주제 시청자",
			thesis: "이전 주제 논지",
		};

		const result = buildAutoDraftFromTitle("전환율 올리는 썸네일 구조", staleBrief);
		expect(result.brief.audience).toContain("전환율 올리는 썸네일 구조");
		expect(result.brief.thesis).toContain("전환율 올리는 썸네일 구조");
		expect(result.brief.audience).not.toBe("이전 주제 시청자");
		expect(result.brief.thesis).not.toBe("이전 주제 논지");
	});

	it("builds finance-specific copy for money habit titles", () => {
		const result = buildAutoDraftFromTitle(
			"월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
			baseBrief,
		);

		expect(result.brief.audience).toContain("직장인");
		expect(result.brief.thesis).toContain("돈이 안 모이는 원인");
		expect(result.script).toContain("저축");
		expect(result.script).toContain("고정비");
		expect(result.script).toContain("카드값");
		expect(result.script).not.toContain("기능을 먼저 설명");
	});
});
