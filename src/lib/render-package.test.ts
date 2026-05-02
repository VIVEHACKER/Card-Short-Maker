import { describe, expect, it } from "vitest";
import { buildRenderPackage, buildSrt } from "./render-package";
import { hydrateProject } from "./project-io";

function makeProject() {
	return hydrateProject({
		brief: {
			id: "b1",
			title: "샘플 프로젝트",
			topic: "AI",
			intent: "info",
			tone: "neutral",
			targetDuration: 30,
			platform: "youtube",
			language: "ko",
		},
		script: "첫 줄\n둘째 줄\n셋째 줄",
	});
}

describe("buildRenderPackage", () => {
	it("contains srt/vtt/ass payloads", () => {
		const pkg = buildRenderPackage(makeProject());
		expect(pkg.subtitlesSrt.length).toBeGreaterThan(0);
		expect(pkg.subtitlesVtt.startsWith("WEBVTT")).toBe(true);
		expect(pkg.subtitlesAss).toContain("[Script Info]");
	});

	it("readme references all subtitle formats", () => {
		const pkg = buildRenderPackage(makeProject());
		expect(pkg.readme).toContain("subtitles.srt");
		expect(pkg.readme).toContain("subtitles.vtt");
		expect(pkg.readme).toContain("subtitles.ass");
		expect(pkg.readme).toContain("Template: 내용 교체형 카드 쇼츠");
		expect(pkg.readme).toContain("Layout: reference-card");
	});

	it("ffmpegConcat lists every scene", () => {
		const project = makeProject();
		const pkg = buildRenderPackage(project);
		const fileLines = pkg.ffmpegConcat.split("\n").filter((l) =>
			l.startsWith("file "),
		);
		expect(fileLines.length).toBe(project.scenes.length);
	});

	it("buildSrt formats SRT with comma decimal separator", () => {
		const srt = buildSrt(makeProject());
		expect(srt).toMatch(/00:00:00,000 --> /);
		// Index numbers
		expect(srt).toMatch(/^1\n/);
		expect(srt).toContain("\n2\n");
	});

	it("buildSrt timestamps are monotonically increasing", () => {
		const srt = buildSrt(makeProject());
		const matches = [...srt.matchAll(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> /g)];
		const seconds = matches.map(
			([, h, m, s, ms]) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000,
		);
		for (let i = 1; i < seconds.length; i++) {
			expect(seconds[i]).toBeGreaterThanOrEqual(seconds[i - 1]!);
		}
	});
});
