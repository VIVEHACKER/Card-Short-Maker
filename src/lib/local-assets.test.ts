import { describe, expect, it } from "vitest";
import type { Brief } from "../types";
import { SEMANTIC_VECTOR_SOURCE_HINT, buildLocalSceneCardImage } from "./local-assets";

const brief: Brief = {
	id: "brief-local-assets",
	title: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
	topic: "월급 관리",
	intent: "info",
	tone: "serious",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "월급을 받는데도 통장에 돈이 남지 않는 직장인",
	thesis: "돈이 안 모이는 원인은 돈이 빠지는 순서에 있습니다.",
};

describe("buildLocalSceneCardImage", () => {
	it("creates a vertical SVG backdrop without duplicating the scene script", () => {
		const text = "문제는 의지가 아니라 돈이 빠지는 순서입니다.";
		const dataUrl = buildLocalSceneCardImage(text, "hook", brief, 0);
		const svg = decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));

		expect(dataUrl.startsWith("data:image/svg+xml")).toBe(true);
		expect(svg).toContain('width="1024"');
		expect(svg).toContain('height="1792"');
		expect(svg).toContain("motif-finance");
		expect(svg).not.toContain("PAYDAY FLOW");
		expect(SEMANTIC_VECTOR_SOURCE_HINT).toBe("semantic vector visual");
		expect(svg).not.toContain(text);
	});
});
