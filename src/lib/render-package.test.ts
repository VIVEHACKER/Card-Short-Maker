import { describe, expect, it } from "vitest";
import { buildRenderPackage } from "./render-package";
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
	});

	it("ffmpegConcat lists every scene", () => {
		const project = makeProject();
		const pkg = buildRenderPackage(project);
		const fileLines = pkg.ffmpegConcat.split("\n").filter((l) =>
			l.startsWith("file "),
		);
		expect(fileLines.length).toBe(project.scenes.length);
	});
});
