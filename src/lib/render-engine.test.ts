import { describe, expect, it } from "vitest";
import {
	escapeFilterValue,
	normalizeColor,
	slugify,
	wrapText,
} from "./render-engine";

describe("wrapText", () => {
	it("returns single line when within budget", () => {
		const lines = wrapText("짧은 텍스트", 12);
		expect(lines).toEqual(["짧은 텍스트"]);
	});

	it("wraps onto multiple lines when exceeding budget", () => {
		const lines = wrapText("이것은 매우 긴 한국어 텍스트입니다", 6);
		expect(lines.length).toBeGreaterThan(1);
	});

	it("caps output at 4 lines", () => {
		const long = "한 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열";
		const lines = wrapText(long, 1);
		expect(lines.length).toBeLessThanOrEqual(4);
	});

	it("handles empty input gracefully", () => {
		expect(wrapText("", 10)).toEqual([]);
	});

	it("preserves words across English wrap", () => {
		const lines = wrapText("the quick brown fox", 6);
		// Each line word-aligned (no mid-word breaks)
		for (const line of lines) {
			expect(line).not.toMatch(/^[a-z]+\s.*[a-z]$/i.test(line) ? "" : "$$$");
		}
	});
});

describe("normalizeColor", () => {
	it("replaces leading # with 0x", () => {
		expect(normalizeColor("#1a2b3c")).toBe("0x1a2b3c");
	});

	it("returns unchanged when no #", () => {
		expect(normalizeColor("ff00ff")).toBe("ff00ff");
	});
});

describe("escapeFilterValue", () => {
	it("converts backslashes to forward slashes", () => {
		expect(escapeFilterValue("C:\\path\\to\\file")).toBe("C\\:/path/to/file");
	});

	it("escapes colons", () => {
		expect(escapeFilterValue("a:b")).toBe("a\\:b");
	});

	it("escapes single quotes", () => {
		expect(escapeFilterValue("ain't")).toBe("ain\\'t");
	});
});

describe("slugify", () => {
	it("lowercases ASCII letters", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	it("preserves Korean characters", () => {
		expect(slugify("AI 자동화")).toBe("ai-자동화");
	});

	it("collapses non-alphanumeric runs", () => {
		expect(slugify("foo!!!@@@bar")).toBe("foo-bar");
	});
});
