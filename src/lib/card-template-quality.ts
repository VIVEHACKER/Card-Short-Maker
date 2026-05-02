import type { Scene, ShortsProject } from "../types";
import {
	REFERENCE_CARD_LAYOUT,
	hasReferenceCardCopyPrefix,
	referenceCardTextRisk,
	referenceCardTransition,
} from "./card-template";

export interface ReferenceCardQualityReport {
	ok: boolean;
	score: number;
	issues: string[];
	checks: {
		layoutLocked: boolean;
		transitionSequence: boolean;
		roleStructure: boolean;
		textFit: boolean;
		noDuplicateLabels: boolean;
		sceneCount: boolean;
	};
}

export function validateReferenceCardProject(
	project: Pick<ShortsProject, "scenes">,
): ReferenceCardQualityReport {
	return validateReferenceCardScenes(project.scenes);
}

export function validateReferenceCardScenes(
	scenes: Scene[],
): ReferenceCardQualityReport {
	const issues: string[] = [];
	const checks = {
		layoutLocked: scenes.every((scene) => scene.layout === REFERENCE_CARD_LAYOUT),
		transitionSequence: scenes.every(
			(scene) => scene.transition === referenceCardTransition(scene.index, scene.role, scenes.length),
		),
		roleStructure: hasReferenceRoleStructure(scenes),
		textFit: scenes.every(
			(scene) => referenceCardTextRisk(scene.text, scene.subtitles.lines) !== "overflow",
		),
		noDuplicateLabels: scenes.every((scene) => !hasReferenceCardCopyPrefix(scene.text)),
		sceneCount: scenes.length >= 4 && scenes.length <= 10,
	};

	if (!checks.layoutLocked) {
		issues.push("카드 템플릿 레이아웃이 모든 장면에 고정되어 있지 않습니다.");
	}
	if (!checks.transitionSequence) {
		issues.push("카드 템플릿 전환 순서가 고정 시퀀스와 다릅니다.");
	}
	if (!checks.roleStructure) {
		issues.push("장면 역할 구조가 Hook → Build → Payoff → CTA 흐름을 벗어났습니다.");
	}
	if (!checks.textFit) {
		issues.push("일부 장면 문장이 카드 템플릿 안전 영역을 넘을 위험이 있습니다.");
	}
	if (!checks.noDuplicateLabels) {
		issues.push("문장 안에 첫째/둘째/POINT 같은 템플릿 라벨이 중복되어 있습니다.");
	}
	if (!checks.sceneCount) {
		issues.push("카드형 쇼츠는 4~10장면 범위에서 가장 안정적입니다.");
	}

	const passed = Object.values(checks).filter(Boolean).length;
	const score = Math.round((passed / Object.keys(checks).length) * 100);

	return {
		ok: issues.length === 0,
		score,
		issues,
		checks,
	};
}

function hasReferenceRoleStructure(scenes: Scene[]): boolean {
	if (scenes.length === 0) return false;
	if (scenes[0]?.role !== "hook") return false;
	if (scenes[scenes.length - 1]?.role !== "cta") return false;
	if (scenes.length >= 4 && scenes[scenes.length - 2]?.role !== "payoff") {
		return false;
	}

	return scenes.slice(1, -2).every((scene) => scene.role === "build");
}
