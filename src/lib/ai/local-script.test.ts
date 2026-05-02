import { describe, expect, it } from "vitest";
import type { Brief } from "../../types";
import { buildLocalScript } from "./local-script";

const brief: Brief = {
	id: "brief-local",
	title: "전환율 올리는 썸네일 구조",
	topic: "전환율 올리는 썸네일 구조",
	intent: "info",
	tone: "serious",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "콘텐츠 제작자",
	thesis: "전환율 올리는 썸네일 구조는 클릭 기준을 먼저 고정할 때 좋아집니다.",
};

describe("buildLocalScript", () => {
	it("builds a topic-specific script with the requested scene count", () => {
		const script = buildLocalScript({ brief, maxScenes: 6 });
		const lines = script.split("\n");

		expect(lines).toHaveLength(6);
		expect(script).toContain("전환율 올리는 썸네일 구조");
		expect(script).toContain("첫 화면");
		expect(lines[lines.length - 1]).not.toContain("CTA");
		expect(lines.slice(1, -2).join(" ")).not.toMatch(/^(첫째|둘째|셋째)|\n(첫째|둘째|셋째)/);
	});

	it("changes output when variation seed changes", () => {
		const first = buildLocalScript({
			brief,
			maxScenes: 6,
			variation: { attempt: 1, seed: "a", strength: "fresh" },
		});
		const second = buildLocalScript({
			brief,
			maxScenes: 6,
			variation: { attempt: 2, seed: "b", strength: "fresh" },
		});

		expect(first).not.toBe(second);
	});

	it("turns numbered finance titles into concrete habits instead of generic template copy", () => {
		const script = buildLocalScript({
			brief: {
				...brief,
				title: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
				topic: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
				audience: "",
				thesis: "",
			},
			maxScenes: 6,
		});

		expect(script.split("\n")).toHaveLength(6);
		expect(script).toContain("저축");
		expect(script).toContain("고정비");
		expect(script).toContain("카드값");
		expect(script).not.toContain("첫째,");
		expect(script).not.toContain("둘째,");
		expect(script).not.toContain("셋째,");
		expect(script).not.toContain("기능을 먼저 설명");
		expect(script).not.toContain("기준 한 줄을 고정");
	});
});
