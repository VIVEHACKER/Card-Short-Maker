import type { Brief } from "../../types";
import type { GenerationVariationProfile } from "./types";

export interface LocalScriptRequest {
	brief: Brief;
	maxScenes: number;
	variation?: GenerationVariationProfile;
}

export interface LocalBriefDetails {
	audience: string;
	thesis: string;
}

type TopicDomain = "finance" | "work" | "content" | "generic";

interface TopicProfile {
	topic: string;
	domain: TopicDomain;
	listCount: number;
	items: string[];
	audience: string;
	thesis: string;
	hook: string;
	payoff: string;
	cta: string;
}

export function buildLocalBriefDetails(
	topic: string,
	intent: Brief["intent"],
	language: Brief["language"],
): LocalBriefDetails {
	const profile = buildTopicProfile(topic, intent, language);
	return {
		audience: profile.audience,
		thesis: profile.thesis,
	};
}

export function buildLocalScript({
	brief,
	maxScenes,
	variation,
}: LocalScriptRequest): string {
	const count = Math.max(4, maxScenes);
	const topic = (brief.topic || brief.title || "이 주제").trim();
	const profile = buildTopicProfile(topic, brief.intent, brief.language, brief.audience, brief.thesis);

	if (brief.language === "en") {
		return buildEnglishScript(profile, count, variation);
	}

	return buildKoreanScript(profile, count, variation);
}

function buildKoreanScript(
	profile: TopicProfile,
	count: number,
	variation?: GenerationVariationProfile,
): string {
	const items = applyVariation(profile.items, profile, variation);
	const lines = [profile.hook, ...items, profile.payoff, profile.cta];
	return fitSceneCount(lines, count, profile, variation).join("\n");
}

function buildEnglishScript(
	profile: TopicProfile,
	count: number,
	variation?: GenerationVariationProfile,
): string {
	const items = applyVariation(profile.items, profile, variation);
	const lines = [profile.hook, ...items, profile.payoff, profile.cta];
	return fitSceneCount(lines, count, profile, variation).join("\n");
}

function applyVariation(
	items: string[],
	profile: TopicProfile,
	variation?: GenerationVariationProfile,
): string[] {
	if (!variation || items.length <= 1) return items;
	const shift = Math.abs(hashString(`${profile.topic}|${variation.seed}|${variation.attempt}`)) % items.length;
	return items.slice(shift).concat(items.slice(0, shift));
}

function fitSceneCount(
	baseLines: string[],
	count: number,
	profile: TopicProfile,
	variation?: GenerationVariationProfile,
): string[] {
	const lines = [...baseLines];
	const seed = Math.abs(hashString(`${profile.topic}|${variation?.seed ?? "local"}`));
	const bridges = buildBridgeLines(profile, seed);

	while (lines.length < count) {
		const insertAt = Math.max(1, lines.length - 2);
		lines.splice(insertAt, 0, bridges[(lines.length + seed) % bridges.length]!);
	}

	if (lines.length > count) {
		const keep = [lines[0]!, ...lines.slice(1, count - 2), lines[lines.length - 2]!, lines[lines.length - 1]!];
		return keep.slice(0, count);
	}

	return lines;
}

function buildTopicProfile(
	topic: string,
	intent: Brief["intent"],
	language: Brief["language"],
	audienceOverride = "",
	thesisOverride = "",
): TopicProfile {
	const normalizedTopic = normalizeTopic(topic || "이 주제");
	const domain = detectDomain(normalizedTopic);
	const requestedCount = extractRequestedCount(normalizedTopic) ?? 3;
	const listCount = Math.min(Math.max(requestedCount, 2), 5);

	if (language === "en") {
		return buildEnglishProfile(normalizedTopic, domain, listCount, audienceOverride, thesisOverride);
	}

	if (domain === "finance") {
		const items = [
			"월급날 남은 돈을 저축하려고 하면 저축은 항상 마지막 순서로 밀립니다.",
			"구독료, 보험료, 할부처럼 자동으로 빠지는 고정비를 매달 다시 보지 않습니다.",
			"카드값을 결제일에만 확인해서 이미 쓴 돈을 뒤늦게 발견합니다.",
			"비상금 계좌가 없어서 작은 변수도 전부 생활비에서 빠져나갑니다.",
			"저축 목표가 금액만 있고 돈이 빠지는 날짜와 계좌가 정해져 있지 않습니다.",
		].slice(0, listCount);
		return {
			topic: normalizedTopic,
			domain,
			listCount,
			items,
			audience: audienceOverride || "월급을 받는데도 통장에 돈이 남지 않는 직장인",
			thesis:
				thesisOverride ||
				"돈이 안 모이는 원인은 수입 부족만이 아니라 월급날 돈이 빠지는 순서와 확인 습관에 있습니다.",
			hook: `${normalizedTopic}, 문제는 의지가 아니라 돈이 빠지는 순서입니다.`,
			payoff: "돈이 모이는 사람은 남은 돈을 저축하지 않고, 월급날 빠질 돈부터 먼저 잠급니다.",
			cta: "오늘 월급 통장에서 저축, 고정비, 생활비 계좌를 먼저 나눠보세요.",
		};
	}

	if (domain === "work") {
		const items = [
			"새 도구를 넣기 전에 누가 마지막 판단을 하는지 정하지 않습니다.",
			"자동화 결과를 모두 사람이 다시 검토해서 병목이 사라지지 않습니다.",
			"반복 업무와 예외 업무를 구분하지 않아 AI가 애매한 일까지 떠안습니다.",
			"성과 기준이 시간 절약인지 품질 향상인지 정해져 있지 않습니다.",
			"팀원이 쓰는 프롬프트와 검수 기준이 각자 달라 결과가 흔들립니다.",
		].slice(0, listCount);
		return {
			topic: normalizedTopic,
			domain,
			listCount,
			items,
			audience: audienceOverride || "AI와 자동화를 도입했지만 효율이 체감되지 않는 팀 리더",
			thesis:
				thesisOverride ||
				"AI는 속도를 올리지만 판단 구조와 검수 기준을 바꾸지 않으면 병목을 더 크게 만듭니다.",
			hook: `${normalizedTopic}, 도구를 늘렸는데 일이 줄지 않는 이유가 있습니다.`,
			payoff: "자동화의 핵심은 더 많은 기능이 아니라 사람이 판단해야 할 지점을 줄이는 것입니다.",
			cta: "오늘 반복 업무 하나를 골라 입력, 판단, 검수 기준을 한 줄씩 적어보세요.",
		};
	}

	if (domain === "content") {
		const items = [
			"첫 화면에서 누가 왜 봐야 하는지 약속하지 않습니다.",
			"예쁜 요소를 먼저 고르고 클릭 후 얻는 이득은 흐릿하게 둡니다.",
			"제목, 썸네일, 첫 문장이 서로 다른 기대를 만들고 있습니다.",
			"성과가 낮은 버전을 지우지 않고 새 디자인만 계속 더합니다.",
			"조회수보다 저장, 클릭, 전환 중 어떤 행동을 원하는지 정하지 않습니다.",
		].slice(0, listCount);
		return {
			topic: normalizedTopic,
			domain,
			listCount,
			items,
			audience: audienceOverride || `${normalizedTopic} 성과를 개선하고 싶은 제작자와 마케터`,
			thesis:
				thesisOverride ||
				`${normalizedTopic}는 디자인 요소보다 첫 화면의 약속과 시청 후 행동이 맞을 때 올라갑니다.`,
			hook: `${normalizedTopic}, 디자인보다 먼저 봐야 할 기준이 있습니다.`,
			payoff: "좋은 콘텐츠는 멋져 보이는 화면보다 클릭 전에 약속한 이득을 끝까지 지키는 구조입니다.",
			cta: "다음 콘텐츠는 제목, 첫 문장, 행동 유도가 같은 약속을 말하는지 먼저 확인하세요.",
		};
	}

	const genericItems = [
		`${normalizedTopic}에서 가장 먼저 볼 것은 결과가 아니라 반복해서 막히는 지점입니다.`,
		"해결책을 늘리기 전에 하지 말아야 할 행동을 하나 지우는 것입니다.",
		"오늘 바로 확인할 수 있는 작은 기준으로 바꾸는 것입니다.",
		"성공 사례를 복사하기 전에 내 상황의 제약을 먼저 적는 것입니다.",
		"실행 후 바로 비교할 수 있는 숫자나 행동을 남기는 것입니다.",
	].slice(0, listCount);

	return {
		topic: normalizedTopic,
		domain,
		listCount,
		items: genericItems,
		audience:
			audienceOverride ||
			(intent === "story"
				? `${normalizedTopic}에서 시행착오를 줄이고 싶은 시청자`
				: `${normalizedTopic}를 빠르게 이해하고 적용하고 싶은 시청자`),
		thesis:
			thesisOverride ||
			(intent === "opinion"
				? `${normalizedTopic}는 주장보다 반복 검증 가능한 기준으로 판단해야 합니다.`
				: `${normalizedTopic}는 구체 행동과 확인 기준이 있을 때 실제 변화로 이어집니다.`),
		hook: `${normalizedTopic}, 막연하게 시작하면 끝까지 흐려집니다.`,
		payoff: `${normalizedTopic}의 핵심은 좋은 말이 아니라 오늘 바꿀 행동 하나로 좁히는 것입니다.`,
		cta: "지금 내 상황에서 바로 바꿀 행동 하나와 확인 기준 하나를 적어보세요.",
	};
}

function buildEnglishProfile(
	topic: string,
	domain: TopicDomain,
	listCount: number,
	audienceOverride: string,
	thesisOverride: string,
): TopicProfile {
	const genericItems = [
		`Identify the repeated point where ${topic} breaks down.`,
		"Remove one failure pattern before adding another tactic.",
		"Turn the advice into one action you can check today.",
		"Write the constraint in your situation before copying a success case.",
		"Leave one number or behavior you can compare after execution.",
	].slice(0, listCount);

	return {
		topic,
		domain,
		listCount,
		items: genericItems,
		audience: audienceOverride || `Viewers who want to apply ${topic} without vague advice`,
		thesis: thesisOverride || `${topic} only becomes useful when it is translated into one concrete action and one checkable criterion.`,
		hook: `${topic} stays vague when the first action is unclear.`,
		payoff: `The point of ${topic} is not more advice, but one action you can verify today.`,
		cta: "Write one action and one criterion before you move to the next step.",
	};
}

function buildBridgeLines(profile: TopicProfile, seed: number): string[] {
	const common = [
		`${profile.audience}에게 중요한 건 더 많은 정보가 아니라 바로 확인할 수 있는 행동입니다.`,
		`그래서 ${profile.topic}는 원인을 하나씩 분리해서 봐야 합니다.`,
		`여기서 흐름을 놓치면 마지막 CTA가 단순한 다짐으로 끝납니다.`,
	];
	return common.slice(seed % common.length).concat(common.slice(0, seed % common.length));
}

function detectDomain(topic: string): TopicDomain {
	if (/(월급|통장|돈|저축|소비|카드|가계부|재테크|고정비|구독료|지출)/i.test(topic)) return "finance";
	if (/(AI|업무|야근|자동화|팀|회의|생산성|일정|리더|협업)/i.test(topic)) return "work";
	if (/(썸네일|전환율|조회수|클릭|콘텐츠|쇼츠|릴스|광고|랜딩|마케팅)/i.test(topic)) return "content";
	return "generic";
}

function extractRequestedCount(topic: string): number | null {
	const match = topic.match(/(\d{1,2})\s*(가지|개|단계|법칙|습관|이유|방법|팁)/);
	return match ? Number(match[1]) : null;
}

function normalizeTopic(value: string): string {
	return value.replace(/\s+/g, " ").replace(/[!?]+$/g, "").trim();
}

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return hash;
}
