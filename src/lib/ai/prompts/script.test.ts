import { describe, expect, it } from "vitest";
import type { Brief } from "../../../types";
import { buildScriptUserPrompt } from "./script";

const briefKo: Brief = {
	id: "brief-ko",
	title: "전환율 올리는 썸네일 구조",
	topic: "전환율 올리는 썸네일 구조",
	intent: "info",
	tone: "serious",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "콘텐츠 제작자",
	thesis: "기준 먼저 고정하면 클릭률이 안정됩니다.",
};

const briefEn: Brief = {
	...briefKo,
	id: "brief-en",
	language: "en",
	title: "How to improve thumbnail CTR",
	topic: "thumbnail CTR optimization",
};

describe("buildScriptUserPrompt variation", () => {
	it("includes korean variation instructions when variation profile is provided", () => {
		const prompt = buildScriptUserPrompt(briefKo, 6, {
			attempt: 3,
			seed: "seed-ko-3",
			strength: "wild",
		});

		expect(prompt).toContain("변주 실행: 3회차, seed=seed-ko-3");
		expect(prompt).toContain("변주 모드: WILD");
		expect(prompt).toContain("POINT 01");
		expect(prompt).toContain("내용 문장만");
	});

	it("includes english variation instructions for english brief", () => {
		const prompt = buildScriptUserPrompt(briefEn, 6, {
			attempt: 2,
			seed: "seed-en-2",
			strength: "fresh",
		});

		expect(prompt).toContain("Variation run: attempt 2, seed seed-en-2.");
		expect(prompt).toContain("Variation mode: FRESH");
		expect(prompt).toContain("POINT 01");
		expect(prompt).toContain("content sentences only");
	});
});
