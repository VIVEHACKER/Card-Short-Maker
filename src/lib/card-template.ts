import type { SceneRole } from "../types";

export const REFERENCE_CARD_LAYOUT = "reference-card";
export const REFERENCE_CARD_PRESET = "레퍼런스 카드형";
export const REFERENCE_CARD_TEMPLATE_LABEL = "내용 교체형 카드 쇼츠";

export const REFERENCE_CARD_TEXT_LIMITS = {
	idealHeadlineChars: 44,
	tightHeadlineChars: 72,
	maxHeadlineChars: 92,
	idealSubtitleChars: 18,
	maxSubtitleChars: 30,
} as const;

const ROLE_NOTES: Record<SceneRole, string> = {
	hook: "레퍼런스 카드형 템플릿: 첫 카드는 상단 라벨, 큰 핵심 문장, 하단 자막만 교체합니다.",
	build: "레퍼런스 카드형 템플릿: 번호형 전개 카드입니다. 배경 이미지는 바뀌지만 문장 위치는 고정합니다.",
	payoff: "레퍼런스 카드형 템플릿: 결론 카드입니다. 핵심 통찰 한 문장만 크게 보여줍니다.",
	cta: "레퍼런스 카드형 템플릿: 행동 유도 카드입니다. 구체적인 다음 행동만 바꿉니다.",
};

export function referenceCardTransition(
	index: number,
	role: SceneRole,
	_totalScenes?: number,
): string {
	if (index <= 1) return "scale";
	if (role === "cta") return "fade";
	return "slideUp";
}

export function referenceCardNote(role: SceneRole): string {
	return ROLE_NOTES[role];
}

export function applyReferenceCardTemplate<
	T extends {
		index: number;
		role: SceneRole;
		layout?: string;
		transition?: string;
		notes?: string;
	},
>(scene: T, totalScenes?: number): T & {
	layout: string;
	transition: string;
	notes: string;
} {
	return {
		...scene,
		layout: REFERENCE_CARD_LAYOUT,
		transition: referenceCardTransition(scene.index, scene.role, totalScenes),
		notes: scene.notes?.trim() || referenceCardNote(scene.role),
	};
}

export function referenceCardHeadlineFontSize(
	text: string,
	role: SceneRole,
): number {
	const length = compactLength(text);
	const base = role === "hook" ? 72 : 62;
	if (length > 72) return base - 22;
	if (length > 58) return base - 16;
	if (length > 44) return base - 10;
	return base;
}

export function referenceCardSubtitleFontSize(text: string): number {
	const length = compactLength(text);
	if (length > 24) return 28;
	if (length > 18) return 31;
	return 34;
}

export function referenceCardTextRisk(
	text: string,
	subtitleLines: string[],
): "ok" | "tight" | "overflow" {
	const headlineChars = compactLength(text);
	const subtitleChars = Math.max(
		0,
		...subtitleLines.map((line) => compactLength(line)),
	);

	if (
		headlineChars > REFERENCE_CARD_TEXT_LIMITS.maxHeadlineChars ||
		subtitleChars > REFERENCE_CARD_TEXT_LIMITS.maxSubtitleChars
	) {
		return "overflow";
	}

	if (
		headlineChars > REFERENCE_CARD_TEXT_LIMITS.tightHeadlineChars ||
		subtitleChars > REFERENCE_CARD_TEXT_LIMITS.idealSubtitleChars
	) {
		return "tight";
	}

	return "ok";
}

export function stripReferenceCardCopyPrefix(text: string): string {
	return text
		.replace(
			/^\s*(?:HOOK|OPENING|POINT\s*\d{1,2}|KEY\s*POINT|NEXT\s*STEP|CTA|ACTION|BUILD|PAYOFF)\s*[:.)\-–—]?\s*/i,
			"",
		)
		.replace(/^\s*(?:첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째)\s*[,.:)\-–—]?\s*/u, "")
		.replace(/^\s*\d{1,2}\s*[.)]\s*/u, "")
		.trim();
}

export function hasReferenceCardCopyPrefix(text: string): boolean {
	return stripReferenceCardCopyPrefix(text) !== text.trim();
}

export function compactLength(text: string): number {
	return [...text.replace(/\s+/g, "")].length;
}
