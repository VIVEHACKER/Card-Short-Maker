import { describe, expect, it } from "vitest";
import {
	estimateTtsDuration,
	extractTextContent,
	resolveImageUrlFromItem,
} from "./_helpers";

describe("extractTextContent", () => {
	it("returns plain string trimmed", () => {
		expect(extractTextContent("  hello  ")).toBe("hello");
	});

	it("joins multipart array of text parts", () => {
		const parts = [
			{ type: "text", text: "line one" },
			{ type: "text", text: "line two" },
		];
		expect(extractTextContent(parts)).toBe("line one\nline two");
	});

	it("filters out non-text parts", () => {
		const parts = [
			{ type: "image", text: undefined },
			{ type: "text", text: "keep me" },
		];
		expect(extractTextContent(parts)).toBe("keep me");
	});

	it("returns empty string for null", () => {
		expect(extractTextContent(null)).toBe("");
		expect(extractTextContent(undefined)).toBe("");
	});
});

describe("resolveImageUrlFromItem", () => {
	it("returns url when present", () => {
		expect(resolveImageUrlFromItem({ url: "https://x/y.png" })).toBe(
			"https://x/y.png",
		);
	});

	it("throws when neither url nor base64 is present", () => {
		expect(() => resolveImageUrlFromItem({})).toThrow();
		expect(() => resolveImageUrlFromItem(null)).toThrow();
	});
});

describe("estimateTtsDuration", () => {
	it("returns at least 1 second", () => {
		expect(estimateTtsDuration("", 1)).toBe(1);
	});

	it("scales inversely with speed", () => {
		const slow = estimateTtsDuration("샘플 텍스트입니다", 1);
		const fast = estimateTtsDuration("샘플 텍스트입니다", 2);
		expect(fast).toBeLessThan(slow);
	});

	it("clamps speed to a sane minimum", () => {
		const value = estimateTtsDuration("긴 텍스트 샘플 입니다", 0);
		expect(Number.isFinite(value)).toBe(true);
	});
});
