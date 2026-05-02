import type { SceneRole } from "../types";

export type TabKey = "brief" | "editor" | "review" | "drafts" | "export";

const TAB_TITLES: Record<TabKey, string> = {
	brief: "브리프와 구조 진단",
	editor: "장면 편집과 타임라인",
	review: "QA 리뷰 보드",
	drafts: "장면 카드 보드",
	export: "렌더 패키지",
};

export function tabTitle(tab: TabKey): string {
	return TAB_TITLES[tab];
}

const QA_LABELS: Record<string, string> = {
	overall: "전체 완성도",
	hookStrength: "첫 장면 흡입력",
	scriptFlow: "스크립트 흐름",
	visualFit: "비주얼 적합도",
	subtitleReadability: "자막 가독성",
	pacing: "호흡",
	ctaFinish: "마무리 행동",
	originality: "차별성",
	creatorPersona: "채널 톤",
};

export function prettyQaLabel(label: string): string {
	return QA_LABELS[label] ?? label;
}

const ROLE_LABELS: Record<SceneRole, string> = {
	hook: "후킹",
	build: "전개",
	payoff: "전환점",
	cta: "CTA",
};

export function prettyRole(role: SceneRole): string {
	return ROLE_LABELS[role];
}

const QUANT_LABELS: Record<string, string> = {
	subtitleDensity: "자막 밀도",
	sceneDuration: "장면 길이",
	audioSync: "음성 싱크",
	cutFrequency: "컷 빈도",
};

export function prettyQuantLabel(label: string): string {
	return QUANT_LABELS[label] ?? label;
}
