import { describe, expect, it } from "vitest";
import {
	collectProjectObjectUrls,
	hasPendingDraftEdits,
	normalizeForDiff,
	slugify,
} from "./app-utils";
import type { Brief, ShortsProject } from "../types";

describe("slugify", () => {
	it("lowercases ASCII and preserves Korean", () => {
		expect(slugify("AI 자동화 Test")).toBe("ai-자동화-test");
	});

	it("collapses non-alphanumeric runs", () => {
		expect(slugify("foo!!!@@@bar")).toBe("foo-bar");
	});

	it("handles empty", () => {
		expect(slugify("")).toBe("");
	});
});

describe("normalizeForDiff", () => {
	it("collapses whitespace", () => {
		expect(normalizeForDiff("a\t b\n  c")).toBe("a b c");
	});

	it("trims", () => {
		expect(normalizeForDiff("   foo   ")).toBe("foo");
	});
});

describe("hasPendingDraftEdits", () => {
	const baseBrief: Brief = {
		id: "b1",
		title: "x",
		topic: "t",
		intent: "info",
		tone: "neutral",
		targetDuration: 30,
		platform: "youtube",
		language: "ko",
		audience: "a",
		thesis: "th",
	};

	const baseProject: ShortsProject = {
		id: "p1",
		channel: "ch",
		preset: "preset",
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
		script: "hello",
		scenes: [],
		qa: {
			quantitative: { subtitleDensity: "ok", sceneDuration: "ok", audioSync: "ok", cutFrequency: "ok" },
			qualitative: { overall: 80, hookStrength: 80, scriptFlow: 80, visualFit: 80, subtitleReadability: 80, pacing: 80, ctaFinish: 80, originality: 80, creatorPersona: 80 },
			verdict: "pass",
			issues: [],
			recommendation: "",
		},
		updatedAt: "방금",
		readiness: 80,
		status: "editing",
	};

	it("returns false when nothing changed", () => {
		expect(hasPendingDraftEdits(baseProject, baseBrief, "hello", "local")).toBe(false);
	});

	it("flags script changes", () => {
		expect(hasPendingDraftEdits(baseProject, baseBrief, "different", "local")).toBe(true);
	});

	it("flags brief changes", () => {
		expect(
			hasPendingDraftEdits(baseProject, { ...baseBrief, topic: "new" }, "hello", "local"),
		).toBe(true);
	});

	it("flags mode changes", () => {
		expect(hasPendingDraftEdits(baseProject, baseBrief, "hello", "byo-api")).toBe(true);
	});
});

describe("collectProjectObjectUrls", () => {
	it("returns blob URLs only", () => {
		const project: ShortsProject = {
			id: "p1",
			channel: "ch",
			preset: "preset",
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
				id: "b",
				title: "",
				topic: "",
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
					text: "x",
					duration: 4,
					role: "hook",
					media: {
						type: "image",
						query: "x",
						style: "y",
						tags: [],
						sourceHint: "",
						generatedImageUrl: "blob:abc",
					},
					subtitles: { id: "sub-1", lines: ["x"], emphasis: [] },
					voice: { provider: "local", speed: 1, emotion: "neutral", generatedAudioUrl: "https://example.com/x.mp3" },
					notes: "",
				},
				{
					id: "s2",
					index: 1,
					text: "y",
					duration: 4,
					role: "build",
					media: { type: "image", query: "y", style: "y", tags: [], sourceHint: "" },
					subtitles: { id: "sub-2", lines: ["y"], emphasis: [] },
					voice: { provider: "local", speed: 1, emotion: "neutral", generatedAudioUrl: "blob:def" },
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
			status: "editing",
		};

		const urls = collectProjectObjectUrls([project]);
		expect(urls.has("blob:abc")).toBe(true);
		expect(urls.has("blob:def")).toBe(true);
		expect(urls.has("https://example.com/x.mp3")).toBe(false);
	});
});
