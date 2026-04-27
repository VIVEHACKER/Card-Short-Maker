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
	overall: "Overall",
	hookStrength: "Hook",
	scriptFlow: "Script Flow",
	visualFit: "Visual Fit",
	subtitleReadability: "Subtitle",
	pacing: "Pacing",
	ctaFinish: "CTA / Finish",
	originality: "Originality",
	creatorPersona: "Persona",
};

export function prettyQaLabel(label: string): string {
	return QA_LABELS[label] ?? label;
}

const ROLE_LABELS: Record<SceneRole, string> = {
	hook: "Hook",
	build: "Build",
	payoff: "Payoff",
	cta: "CTA",
};

export function prettyRole(role: SceneRole): string {
	return ROLE_LABELS[role];
}

const QUANT_LABELS: Record<string, string> = {
	subtitleDensity: "Subtitle density",
	sceneDuration: "Scene duration",
	audioSync: "Audio sync",
	cutFrequency: "Cut frequency",
};

export function prettyQuantLabel(label: string): string {
	return QUANT_LABELS[label] ?? label;
}
