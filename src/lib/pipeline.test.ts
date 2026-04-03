import { describe, expect, it } from "vitest";
import { createProjectFromBrief, buildSubtitleBlock, duplicateScene, removeScene } from "./pipeline";
import { buildRenderPackage } from "./render-package";
import type { Brief } from "../types";

const brief: Brief = {
  id: "brief-test",
  title: "AI 도입했더니 오히려 야근이 늘어난 이유",
  topic: "AI adoption and longer work hours",
  intent: "info",
  tone: "serious",
  targetDuration: 36,
  platform: "youtube",
  language: "ko",
  audience: "AI를 도입했지만 효율이 체감되지 않는 팀 리더",
  thesis: "AI는 속도를 올리지만 판단 구조를 바꾸지 않으면 병목을 더 키웁니다.",
};

describe("pipeline", () => {
  it("creates a structured project from a brief", () => {
    const project = createProjectFromBrief(
      brief,
      [
        "AI 도입했더니 오히려 야근이 늘어난 이유.",
        "속도보다 검토 루프가 더 빨라졌기 때문입니다.",
        "사람이 모든 결과를 다시 읽고 승인하느라 병목이 생깁니다.",
        "결국 판단 구조를 바꾸지 않으면 AI는 일을 줄이지 못합니다.",
      ].join("\n"),
    );

    expect(project.scenes.length).toBeGreaterThanOrEqual(6);
    expect(project.scenes[0]?.role).toBe("hook");
    expect(project.scenes[project.scenes.length - 1]?.role).toBe("cta");
    expect(project.runtime.mode).toBe("local");
    expect(project.qa.qualitative.overall).toBeGreaterThan(0);
  });

  it("keeps subtitle blocks within the configured limits", () => {
    const subtitle = buildSubtitleBlock("AI 도입했는데 야근이 늘었다");

    expect(subtitle.lines.length).toBeLessThanOrEqual(2);
    expect(subtitle.lines.every((line) => line.replace(/\s+/g, "").length <= 12)).toBe(true);
  });

  it("supports scene duplication and constrained removal", () => {
    const project = createProjectFromBrief(brief, brief.thesis);
    const duplicated = duplicateScene(project, project.scenes[1]!.id);
    const reduced = removeScene(duplicated, duplicated.scenes[1]!.id);

    expect(duplicated.scenes.length).toBe(project.scenes.length + 1);
    expect(reduced.scenes.length).toBe(project.scenes.length);
  });

  it("builds a render package with subtitles and concat file", () => {
    const project = createProjectFromBrief(brief, brief.thesis);
    const renderPackage = buildRenderPackage(project);

    expect(renderPackage.subtitlesSrt).toContain("00:00:00,000");
    expect(renderPackage.ffmpegConcat).toContain("ffmpeg");
    expect(renderPackage.manifest.scenes.length).toBe(project.scenes.length);
  });
});
