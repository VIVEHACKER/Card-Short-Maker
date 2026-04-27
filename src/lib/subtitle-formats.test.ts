import { describe, expect, it } from "vitest";
import { buildAss, buildVtt, projectToCues } from "./subtitle-formats";
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
		script: "1\n2",
		scenes: [
			{
				id: "s1",
				index: 0,
				text: "첫째",
				duration: 4,
				role: "hook",
				media: { type: "image", query: "x", style: "bold", tags: [], sourceHint: "" },
				subtitles: { id: "sub-1", lines: ["첫째 줄"], emphasis: [] },
				voice: { provider: "local", speed: 1, emotion: "neutral" },
				notes: "",
			},
			{
				id: "s2",
				index: 1,
				text: "둘째",
				duration: 5,
				role: "build",
				media: { type: "image", query: "y", style: "bold", tags: [], sourceHint: "" },
				subtitles: { id: "sub-2", lines: ["둘째 줄"], emphasis: [] },
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

describe("projectToCues", () => {
	it("computes absolute start/end correctly", () => {
		const cues = projectToCues(makeProject());
		expect(cues[0]!.start).toBe(0);
		expect(cues[0]!.end).toBe(4);
		expect(cues[1]!.start).toBe(4);
		expect(cues[1]!.end).toBe(9);
	});
});

describe("buildVtt", () => {
	it("starts with WEBVTT header", () => {
		const vtt = buildVtt(makeProject());
		expect(vtt.startsWith("WEBVTT")).toBe(true);
	});

	it("uses dot-separated milliseconds", () => {
		const vtt = buildVtt(makeProject());
		expect(vtt).toMatch(/00:00:00\.000 --> 00:00:04\.000/);
	});

	it("includes subtitle text", () => {
		const vtt = buildVtt(makeProject());
		expect(vtt).toContain("첫째 줄");
		expect(vtt).toContain("둘째 줄");
	});
});

describe("buildAss", () => {
	it("contains required ASS sections", () => {
		const ass = buildAss(makeProject());
		expect(ass).toContain("[Script Info]");
		expect(ass).toContain("[V4+ Styles]");
		expect(ass).toContain("[Events]");
	});

	it("emits Dialogue lines per scene", () => {
		const ass = buildAss(makeProject());
		const dialogues = ass.split("\n").filter((l) => l.startsWith("Dialogue:"));
		expect(dialogues).toHaveLength(2);
	});

	it("uses centiseconds in timestamps", () => {
		const ass = buildAss(makeProject());
		expect(ass).toMatch(/0:00:00\.00,0:00:04\.00/);
	});
});
