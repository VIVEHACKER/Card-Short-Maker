import { describe, expect, it } from "vitest";
import { ALL_STOPWORDS, EN_STOPWORDS, KO_STOPWORDS, isStopword } from "./stopwords";

describe("stopwords", () => {
	it("Korean stopwords contain common particles", () => {
		expect(KO_STOPWORDS.has("그리고")).toBe(true);
		expect(KO_STOPWORDS.has("하지만")).toBe(true);
	});

	it("English stopwords contain common articles", () => {
		expect(EN_STOPWORDS.has("the")).toBe(true);
		expect(EN_STOPWORDS.has("with")).toBe(true);
	});

	it("ALL_STOPWORDS is union", () => {
		expect(ALL_STOPWORDS.has("그리고")).toBe(true);
		expect(ALL_STOPWORDS.has("the")).toBe(true);
	});

	it("isStopword is case-insensitive", () => {
		expect(isStopword("THE")).toBe(true);
		expect(isStopword("From")).toBe(true);
	});

	it("isStopword returns false for content words", () => {
		expect(isStopword("로켓")).toBe(false);
		expect(isStopword("automation")).toBe(false);
	});
});
