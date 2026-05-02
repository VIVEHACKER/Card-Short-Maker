import type { Brief } from "../types";
import { buildLocalBriefDetails, buildLocalScript } from "./ai/local-script";

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
	const details = buildLocalBriefDetails(topic, intent, baseBrief.language);
	const audience = details.audience;
	const thesis = details.thesis;

	const brief: Brief = {
		...baseBrief,
		title,
		topic,
		intent,
		tone,
		targetDuration,
		audience,
		thesis,
	};

	return {
		brief,
		script: buildLocalScript({
			brief,
			maxScenes: estimateSceneCount(targetDuration),
		}),
	};
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

function estimateSceneCount(targetDuration: number): number {
	return Math.min(Math.max(Math.round(targetDuration / 5.6), 6), 8);
}
