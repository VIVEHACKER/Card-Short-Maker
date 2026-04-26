import type { Brief } from "../types";

export interface TitleAutoDraft {
	brief: Brief;
	script: string;
}

export function buildAutoDraftFromTitle(
	title: string,
	baseBrief: Brief,
): TitleAutoDraft {
	const topic = normalizeTopic(title);
	const intent = inferIntentFromTitle(topic, baseBrief.intent);
	const tone = inferToneFromTitle(topic, baseBrief.tone);
	const targetDuration = inferTargetDuration(topic, baseBrief.targetDuration);

	const brief: Brief = {
		...baseBrief,
		title,
		topic,
		intent,
		tone,
		targetDuration,
		audience: baseBrief.audience.trim() || `${topic}에 관심 있는 시청자`,
		thesis: baseBrief.thesis.trim() || "",
	};

	return {
		brief,
		script: buildScriptTemplate(topic, intent),
	};
}

function buildScriptTemplate(topic: string, intent: Brief["intent"]): string {
	const lines: string[] = [];

	if (intent === "story") {
		lines.push(`[hook] ${topic} — 이런 일이 있었습니다`);
		lines.push(`[build] ${topic}: 상황 설명`);
		lines.push(`[build] ${topic}: 결정적 순간`);
		lines.push(`[build] ${topic}: 결과와 교훈`);
		lines.push(`[payoff] ${topic} — 핵심 메시지`);
		lines.push(`[cta] 비슷한 경험이 있으신가요? 댓글로 알려주세요`);
	} else if (intent === "opinion") {
		lines.push(`[hook] ${topic} — 제 생각은 다릅니다`);
		lines.push(`[build] ${topic}: 일반적인 시각`);
		lines.push(`[build] ${topic}: 반론 근거 1`);
		lines.push(`[build] ${topic}: 반론 근거 2`);
		lines.push(`[payoff] ${topic} — 결론`);
		lines.push(`[cta] 어떻게 생각하시나요? 댓글로 남겨주세요`);
	} else {
		lines.push(`[hook] ${topic} — 핵심만 알려드립니다`);
		lines.push(`[build] ${topic}: 첫 번째 포인트`);
		lines.push(`[build] ${topic}: 두 번째 포인트`);
		lines.push(`[build] ${topic}: 세 번째 포인트`);
		lines.push(`[payoff] ${topic} — 정리`);
		lines.push(`[cta] 도움이 됐다면 좋아요와 구독 부탁드립니다`);
	}

	return lines.join("\n");
}

function normalizeTopic(value: string): string {
	return value.replace(/\s+/g, " ").replace(/[!?]+$/g, "").trim();
}

function inferIntentFromTitle(
	title: string,
	fallback: Brief["intent"],
): Brief["intent"] {
	if (/(의견|생각|vs|비교|찬반|논쟁)/i.test(title)) return "opinion";
	if (/(경험|후기|실패담|성공담|이야기|썰)/i.test(title)) return "story";
	return fallback;
}

function inferToneFromTitle(
	title: string,
	fallback: Brief["tone"],
): Brief["tone"] {
	if (/(긴급|위험|실패|망|주의|경고)/i.test(title)) return "urgent";
	if (/(꿀팁|비법|핵심|필수|완전|레전드)/i.test(title)) return "energetic";
	return fallback;
}

function inferTargetDuration(title: string, fallback: number): number {
	const secondsMatch = title.match(/(\d{1,3})\s*초/);
	if (secondsMatch) {
		return clampDuration(Number(secondsMatch[1]));
	}

	const minutesMatch = title.match(/(\d{1,2})\s*분/);
	if (minutesMatch) {
		return clampDuration(Number(minutesMatch[1]) * 60);
	}

	if (/(shorts|숏츠|릴스|reels|틱톡|tiktok)/i.test(title)) {
		return 30;
	}

	return clampDuration(fallback);
}

function clampDuration(value: number): number {
	return Math.min(Math.max(Math.round(value), 15), 60);
}
