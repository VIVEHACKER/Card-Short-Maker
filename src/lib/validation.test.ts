import { describe, expect, it } from "vitest";
import { validateBrief, validateProject, validateScene } from "./validation";
import type { Brief, Scene, ShortsProject } from "../types";

const baseBrief: Brief = {
	id: "brief-test",
	title: "AI 자동화 30초",
	topic: "AI",
	intent: "info",
	tone: "neutral",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "",
	thesis: "",
};

function makeScene(over: Partial<Scene> = {}): Scene {
	return {
		id: "s1",
		index: 0,
		text: "샘플 씬",
		duration: 5,
		role: "build",
		media: { type: "image", query: "abc", style: "bold", tags: [], sourceHint: "" },
		subtitles: { id: "sub-1", lines: ["샘플 씬"], emphasis: [] },
		voice: { provider: "local", speed: 1, emotion: "neutral" },
		notes: "",
		...over,
	};
}

describe("validateBrief", () => {
	it("flags missing title", () => {
		const result = validateBrief({ ...baseBrief, title: "" });
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.field === "title" && i.severity === "error")).toBe(true);
	});

	it("flags out-of-range targetDuration", () => {
		const result = validateBrief({ ...baseBrief, targetDuration: 5 });
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.field === "targetDuration")).toBe(true);
	});

	it("passes a valid brief", () => {
		const result = validateBrief(baseBrief);
		expect(result.ok).toBe(true);
	});

	it("warns when title is too long", () => {
		const result = validateBrief({ ...baseBrief, title: "A".repeat(120) });
		expect(result.issues.some((i) => i.field === "title" && i.severity === "warn")).toBe(true);
	});
});

describe("validateScene", () => {
	it("flags empty text", () => {
		const result = validateScene(makeScene({ text: "  " }));
		expect(result.ok).toBe(false);
	});

	it("warns out-of-range duration", () => {
		const result = validateScene(makeScene({ duration: 0.5 }));
		expect(result.issues.some((i) => i.severity === "warn")).toBe(true);
	});
});

describe("validateProject", () => {
	it("requires at least one scene", () => {
		const project: ShortsProject = {
			id: "p1",
			channel: "ch",
			preset: "default",
			accent: "#fff",
			runtime: {
				mode: "local",
				costModel: "free-local",
				ffmpeg: "bundled",
				scriptProvider: "local",
				qaProvider: "local",
				ttsProvider: "local",
				mediaProvider: "local",
				install: [],
			},
			brief: baseBrief,
			script: "",
			scenes: [],
			qa: {
				quantitative: { subtitleDensity: "ok", sceneDuration: "ok", audioSync: "ok", cutFrequency: "ok" },
				qualitative: { overall: 7, hookStrength: 7, scriptFlow: 7, visualFit: 7, subtitleReadability: 7, pacing: 7, ctaFinish: 7, originality: 7, creatorPersona: 7 },
				verdict: "pass",
				issues: [],
				recommendation: "",
			},
			updatedAt: new Date().toISOString(),
			readiness: 0,
			status: "editing",
		};
		const result = validateProject(project);
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.field === "scenes")).toBe(true);
	});
});
