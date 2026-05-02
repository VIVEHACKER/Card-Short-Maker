import { describe, expect, it } from "vitest";
import {
	createProjectFromBrief,
	buildSubtitleBlock,
	duplicateScene,
	removeScene,
} from "./pipeline";
import { buildRenderPackage } from "./render-package";
import { REFERENCE_CARD_LAYOUT } from "./card-template";
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
		expect(project.scenes.every((scene) => scene.layout === REFERENCE_CARD_LAYOUT)).toBe(true);
		expect(project.scenes[0]?.transition).toBe("scale");
		expect(project.scenes[project.scenes.length - 1]?.transition).toBe("fade");
		expect(project.runtime.mode).toBe("local");
		expect(project.qa.qualitative.overall).toBeGreaterThan(0);
	});

	it("keeps subtitle blocks within the configured limits", () => {
		const subtitle = buildSubtitleBlock("AI 도입했는데 야근이 늘었다");

		expect(subtitle.lines.length).toBeLessThanOrEqual(2);
		expect(
			subtitle.lines.every((line) => line.replace(/\s+/g, "").length <= 12),
		).toBe(true);
	});

	it("supports scene duplication and constrained removal", () => {
		const project = createProjectFromBrief(brief, brief.thesis);
		const duplicated = duplicateScene(project, project.scenes[1]?.id ?? "");
		const reduced = removeScene(duplicated, duplicated.scenes[1]?.id ?? "");

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

	it("keeps scenes empty when brief and script are empty", () => {
		const emptyBrief: Brief = {
			...brief,
			id: "brief-empty",
			title: "",
			topic: "",
			audience: "",
			thesis: "",
		};
		const project = createProjectFromBrief(emptyBrief, "");

		expect(project.script).toBe("");
		expect(project.scenes.every((scene) => scene.text === "")).toBe(true);
		expect(project.scenes.every((scene) => scene.media.query === "")).toBe(true);
	});

	it("expands short scripts into non-repetitive narrative scenes", () => {
		const project = createProjectFromBrief(brief, "문제는 도구가 아니라 기준입니다.");
		const uniqueLines = new Set(project.scenes.map((scene) => scene.text));

		expect(uniqueLines.size).toBeGreaterThanOrEqual(4);
		expect(project.scenes[0]?.role).toBe("hook");
		expect(project.scenes[project.scenes.length - 1]?.role).toBe("cta");
	});

	it("creates semantic local visuals for generated scenes but does not pass QA without voice", () => {
		const project = createProjectFromBrief(
			brief,
			[
				"AI 도입했더니 오히려 야근이 늘어난 이유.",
				"자동화 결과를 모두 사람이 다시 검토해서 병목이 생깁니다.",
				"반복 업무와 예외 업무를 나누지 않으면 AI가 애매한 일까지 떠안습니다.",
				"판단 구조를 바꾸지 않으면 AI는 일을 줄이지 못합니다.",
				"오늘 반복 업무 하나의 입력, 판단, 검수 기준을 적어보세요.",
			].join("\n"),
		);

		expect(project.scenes.every((scene) => scene.media.generatedImageUrl?.startsWith("data:image/svg+xml"))).toBe(true);
		expect(new Set(project.scenes.map((scene) => scene.media.sourceHint))).toEqual(new Set(["semantic vector visual"]));
		expect(project.qa.issues.join(" ")).not.toContain("API/스톡");
		expect(project.qa.verdict).toBe("revise");
		expect(project.qa.issues.some((issue) => issue.includes("음성"))).toBe(true);
		expect(project.readiness).toBeLessThan(90);
	});

	it("preserves concrete hook and CTA lines from a generated finance script", () => {
		const moneyBrief: Brief = {
			...brief,
			title: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
			topic: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
			audience: "월급을 받는데도 통장에 돈이 남지 않는 직장인",
			thesis: "돈이 안 모이는 원인은 수입 부족만이 아니라 월급날 돈이 빠지는 순서와 확인 습관에 있습니다.",
		};
		const project = createProjectFromBrief(
			moneyBrief,
			[
				"월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관, 문제는 의지가 아니라 돈이 빠지는 순서입니다.",
				"첫째, 월급날 남은 돈을 저축하려고 하면 저축은 항상 마지막 순서로 밀립니다.",
				"둘째, 구독료, 보험료, 할부처럼 자동으로 빠지는 고정비를 매달 다시 보지 않습니다.",
				"셋째, 카드값을 결제일에만 확인해서 이미 쓴 돈을 뒤늦게 발견합니다.",
				"돈이 모이는 사람은 남은 돈을 저축하지 않고, 월급날 빠질 돈부터 먼저 잠급니다.",
				"오늘 월급 통장에서 저축, 고정비, 생활비 계좌를 먼저 나눠보세요.",
			].join("\n"),
		);

		expect(project.scenes[0]?.text).toContain("돈이 빠지는 순서");
		expect(project.scenes[project.scenes.length - 1]?.text).toContain("생활비 계좌");
		expect(project.scenes[project.scenes.length - 1]?.text).not.toContain("해보세요 해보세요");
		expect(project.scenes.map((scene) => scene.text).join(" ")).not.toContain("핵심 한 줄");
	});
});
