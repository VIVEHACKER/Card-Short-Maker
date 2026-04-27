import { describe, expect, it } from "vitest";
import {
	addSceneAfter,
	buildRuntimeProfile,
	createProjectFromBrief,
	makeRenderManifest,
	moveScene,
	recalculateProject,
	updateProjectRuntimeMode,
	updateSceneDuration,
	updateSceneNotes,
	updateSceneRole,
} from "./pipeline";
import type { Brief } from "../types";

const brief: Brief = {
	id: "b1",
	title: "샘플 프로젝트",
	topic: "AI 자동화",
	intent: "info",
	tone: "neutral",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "팀 리더",
	thesis: "자동화는 결정 구조를 바꿀 때만 효율적입니다.",
};

const baseScript = [
	"오프닝 훅",
	"중간 빌드 1",
	"중간 빌드 2",
	"페이오프 메시지",
	"마무리 CTA",
].join("\n");

describe("addSceneAfter", () => {
	it("adds a new scene right after the target", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[1]!;
		const next = addSceneAfter(project, target.id);
		expect(next.scenes.length).toBe(project.scenes.length + 1);
		const targetIdx = next.scenes.findIndex((s) => s.id === target.id);
		const inserted = next.scenes[targetIdx + 1];
		expect(inserted).toBeDefined();
	});

	it("returns input unchanged when sceneId not found", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const next = addSceneAfter(project, "no-such-id");
		expect(next.scenes.length).toBe(project.scenes.length);
	});
});

describe("moveScene", () => {
	it("moves a scene up", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[2]!;
		const next = moveScene(project, target.id, "up");
		expect(next.scenes[1]?.id).toBe(target.id);
	});

	it("moves a scene down", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[1]!;
		const next = moveScene(project, target.id, "down");
		expect(next.scenes[2]?.id).toBe(target.id);
	});

	it("noop at edges", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const first = project.scenes[0]!;
		const result = moveScene(project, first.id, "up");
		expect(result.scenes[0]?.id).toBe(first.id);
	});
});

describe("updateSceneRole", () => {
	it("changes only the targeted scene", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[1]!;
		const result = updateSceneRole(project, target.id, "payoff");
		const updated = result.scenes.find((s) => s.id === target.id);
		expect(updated?.role).toBe("payoff");
	});
});

describe("updateSceneDuration", () => {
	it("updates duration on target scene", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[0]!;
		const result = updateSceneDuration(project, target.id, 7.5);
		const updated = result.scenes.find((s) => s.id === target.id);
		expect(updated?.duration).toBe(7.5);
	});
});

describe("updateSceneNotes", () => {
	it("appends notes string", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const target = project.scenes[0]!;
		const result = updateSceneNotes(project, target.id, "메모 텍스트");
		const updated = result.scenes.find((s) => s.id === target.id);
		expect(updated?.notes).toBe("메모 텍스트");
	});
});

describe("updateProjectRuntimeMode", () => {
	it("flips mode and aligns runtime profile fields", () => {
		const project = createProjectFromBrief(brief, baseScript, { runtimeMode: "local" });
		const next = updateProjectRuntimeMode(project, "byo-api");
		expect(next.runtime.mode).toBe("byo-api");
		expect(next.runtime.costModel).toBe("user-api");
	});
});

describe("recalculateProject", () => {
	it("re-runs QA and recomputes readiness", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const tampered = { ...project, qa: { ...project.qa, qualitative: { ...project.qa.qualitative, overall: 0 } } };
		const next = recalculateProject(tampered);
		expect(next.qa.qualitative.overall).toBeGreaterThan(0);
	});
});

describe("buildRuntimeProfile", () => {
	it("local mode uses bundled ffmpeg + free-local cost", () => {
		const profile = buildRuntimeProfile("local");
		expect(profile.ffmpeg).toBe("bundled");
		expect(profile.costModel).toBe("free-local");
	});

	it("byo-api mode flips to user-api cost", () => {
		const profile = buildRuntimeProfile("byo-api");
		expect(profile.costModel).toBe("user-api");
	});

	it("hybrid mode uses mixed cost", () => {
		const profile = buildRuntimeProfile("hybrid");
		expect(profile.costModel).toBe("mixed");
	});
});

describe("makeRenderManifest", () => {
	it("produces one manifest scene per project scene", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const manifest = makeRenderManifest(project);
		expect(manifest.scenes.length).toBe(project.scenes.length);
		expect(manifest.title).toBe(project.brief.title);
	});

	it("includes voice metadata per scene", () => {
		const project = createProjectFromBrief(brief, baseScript);
		const manifest = makeRenderManifest(project);
		for (const scene of manifest.scenes) {
			expect(scene.voice).toBeDefined();
			expect(typeof scene.voice.speed).toBe("number");
		}
	});
});
