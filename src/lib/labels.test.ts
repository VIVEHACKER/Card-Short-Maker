import { describe, expect, it } from "vitest";
import { prettyQaLabel, prettyQuantLabel, prettyRole, tabTitle } from "./labels";

describe("tabTitle", () => {
	it("returns Korean title for each tab", () => {
		expect(tabTitle("brief")).toBe("브리프와 구조 진단");
		expect(tabTitle("editor")).toBe("장면 편집과 타임라인");
		expect(tabTitle("review")).toBe("QA 리뷰 보드");
		expect(tabTitle("drafts")).toBe("장면 카드 보드");
		expect(tabTitle("export")).toBe("렌더 패키지");
	});
});

describe("prettyQaLabel", () => {
	it("maps known fields", () => {
		expect(prettyQaLabel("overall")).toBe("Overall");
		expect(prettyQaLabel("hookStrength")).toBe("Hook");
		expect(prettyQaLabel("creatorPersona")).toBe("Persona");
	});

	it("returns input for unknown fields", () => {
		expect(prettyQaLabel("unknownField")).toBe("unknownField");
	});
});

describe("prettyRole", () => {
	it("maps each scene role", () => {
		expect(prettyRole("hook")).toBe("Hook");
		expect(prettyRole("build")).toBe("Build");
		expect(prettyRole("payoff")).toBe("Payoff");
		expect(prettyRole("cta")).toBe("CTA");
	});
});

describe("prettyQuantLabel", () => {
	it("maps quantitative qa fields", () => {
		expect(prettyQuantLabel("subtitleDensity")).toBe("Subtitle density");
		expect(prettyQuantLabel("audioSync")).toBe("Audio sync");
	});
});
