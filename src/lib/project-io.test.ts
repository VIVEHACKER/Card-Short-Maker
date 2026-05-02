import { describe, expect, it } from "vitest";
import { hydrateProject, hydrateProjects, parseBriefPayload } from "./project-io";

describe("parseBriefPayload", () => {
	it("returns defaults when raw is empty object", () => {
		const result = parseBriefPayload({});
		expect(result.brief.title).toBeTruthy();
		expect(result.brief.intent).toBe("info");
		expect(result.brief.platform).toBe("youtube");
		expect(result.runtimeMode).toBe("local");
	});

	it("ignores invalid intent / platform / language", () => {
		const result = parseBriefPayload({
			intent: "garbage",
			platform: 123,
			language: "fr",
			tone: "lol",
		});
		expect(result.brief.intent).toBe("info");
		expect(result.brief.platform).toBe("youtube");
		expect(result.brief.language).toBe("ko");
		expect(result.brief.tone).toBe("serious");
	});

	it("preserves valid fields", () => {
		const result = parseBriefPayload({
			id: "b1",
			title: "테스트",
			topic: "AI",
			intent: "story",
			tone: "energetic",
			targetDuration: 45,
			platform: "tiktok",
			language: "en",
		});
		expect(result.brief.id).toBe("b1");
		expect(result.brief.intent).toBe("story");
		expect(result.brief.targetDuration).toBe(45);
		expect(result.brief.platform).toBe("tiktok");
		expect(result.brief.language).toBe("en");
	});

	it("falls back numeric duration when not finite", () => {
		const result = parseBriefPayload({ targetDuration: "abc" });
		expect(result.brief.targetDuration).toBe(30);
	});
});

describe("hydrateProject", () => {
	it("rebuilds a project from brief-only payload", () => {
		const project = hydrateProject({
			title: "안녕",
			topic: "테스트",
			targetDuration: 30,
		});
		expect(project.scenes.length).toBeGreaterThan(0);
		expect(project.brief.title).toBe("안녕");
	});

	it("retains saved scenes when provided", () => {
		const sample = hydrateProject({
			brief: { title: "x", topic: "y", targetDuration: 30 },
			script: "x\ny\nz",
			scenes: [
				{
					id: "s1",
					text: "훅 라인",
					role: "hook",
					duration: 4,
				},
				{
					id: "s2",
					text: "빌드 라인",
					role: "build",
					duration: 4,
				},
			],
		});
		expect(sample.scenes).toHaveLength(2);
		expect(sample.scenes[0]?.role).toBe("hook");
	});

	it("drops persisted blob audio urls because they expire after reload", () => {
		const project = hydrateProject({
			brief: { title: "x", topic: "y", targetDuration: 30 },
			script: "훅\n전개\n전개\n전환\n마무리",
			scenes: [
				{
					id: "s1",
					text: "훅 라인",
					role: "hook",
					duration: 4,
					voice: {
						provider: "macos-say",
						speed: 1,
						emotion: "serious",
						generatedAudioUrl: "blob:http://127.0.0.1:5173/expired",
					},
				},
			],
		});

		expect(project.scenes[0]?.voice.generatedAudioUrl).toBeUndefined();
		expect(project.qa.issues.some((issue) => issue.includes("음성"))).toBe(true);
	});
});

describe("hydrateProjects", () => {
	it("returns [] for non-array input", () => {
		expect(hydrateProjects(null)).toEqual([]);
		expect(hydrateProjects("oops")).toEqual([]);
	});

	it("skips invalid entries silently", () => {
		const list = hydrateProjects([null, undefined, { brief: { title: "ok" }, script: "x" }]);
		expect(list.length).toBeGreaterThanOrEqual(1);
	});
});
