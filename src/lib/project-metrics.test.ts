import { describe, expect, it } from "vitest";
import { computeProjectMetrics } from "./project-metrics";
import type { ShortsProject } from "../types";

function makeProject(): ShortsProject {
	return {
		id: "p1",
		channel: "ch",
		preset: "기본",
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
		brief: {
			id: "b1",
			title: "샘플",
			topic: "샘플",
			intent: "info",
			tone: "neutral",
			targetDuration: 30,
			platform: "youtube",
			language: "ko",
			audience: "",
			thesis: "",
		},
		script: "",
		scenes: [
			{
				id: "s1",
				index: 0,
				text: "훅",
				duration: 4,
				role: "hook",
				media: {
					type: "image",
					query: "x",
					style: "bold",
					tags: [],
					sourceHint: "Pexels — alice",
					generatedImageUrl: "https://x/x.jpg",
				},
				subtitles: { id: "sub-1", lines: ["훅 라인"], emphasis: [] },
				voice: { provider: "local", speed: 1, emotion: "neutral", generatedAudioUrl: "blob://..." },
				notes: "",
			},
			{
				id: "s2",
				index: 1,
				text: "빌드",
				duration: 6,
				role: "build",
				media: { type: "image", query: "y", style: "bold", tags: [], sourceHint: "AI — openai" },
				subtitles: { id: "sub-2", lines: ["빌드 라인"], emphasis: [] },
				voice: { provider: "local", speed: 1, emotion: "neutral" },
				notes: "",
			},
		],
		qa: {
			quantitative: { subtitleDensity: "ok", sceneDuration: "ok", audioSync: "ok", cutFrequency: "ok" },
			qualitative: { overall: 80, hookStrength: 80, scriptFlow: 80, visualFit: 80, subtitleReadability: 80, pacing: 80, ctaFinish: 80, originality: 80, creatorPersona: 80 },
			verdict: "pass",
			issues: [],
			recommendation: "",
		},
		updatedAt: "방금",
		readiness: 80,
		status: "review",
	};
}

describe("computeProjectMetrics", () => {
	it("computes sceneCount + total duration", () => {
		const m = computeProjectMetrics(makeProject());
		expect(m.sceneCount).toBe(2);
		expect(m.totalDuration).toBe(10);
		expect(m.averageSceneDuration).toBe(5);
	});

	it("counts media + voice presence", () => {
		const m = computeProjectMetrics(makeProject());
		expect(m.hasMediaCount).toBe(1);
		expect(m.hasVoiceCount).toBe(1);
	});

	it("breaks down media source", () => {
		const m = computeProjectMetrics(makeProject());
		expect(m.mediaSourceBreakdown.pexels).toBe(1);
		expect(m.mediaSourceBreakdown.ai).toBe(1);
	});

	it("breaks down roles", () => {
		const m = computeProjectMetrics(makeProject());
		expect(m.rolesBreakdown.hook).toBe(1);
		expect(m.rolesBreakdown.build).toBe(1);
	});

	it("computes subtitle CPS", () => {
		const m = computeProjectMetrics(makeProject());
		expect(m.subtitleCharsPerSecond).toBeGreaterThan(0);
	});

	it("handles empty scenes safely", () => {
		const empty = makeProject();
		empty.scenes = [];
		const m = computeProjectMetrics(empty);
		expect(m.sceneCount).toBe(0);
		expect(m.averageSceneDuration).toBe(0);
		expect(m.subtitleCharsPerSecond).toBe(0);
	});
});
