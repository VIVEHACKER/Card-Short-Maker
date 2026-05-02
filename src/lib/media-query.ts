import type { Brief, SceneRole } from "../types";

type MediaDomain = "finance" | "work" | "content" | "generic";

export function buildReferenceCardMediaQuery(
	text: string,
	brief: Pick<Brief, "title" | "topic" | "tone">,
	role: SceneRole,
): string {
	if (!text.trim()) return "";

	const haystack = `${brief.title} ${brief.topic} ${text}`.toLowerCase();
	const domain = detectMediaDomain(haystack);
	const roleMood = roleMoodQuery(role, brief.tone);

	return `${domainQuery(domain, haystack, role)} ${roleMood}`.replace(/\s+/g, " ").trim();
}

function detectMediaDomain(value: string): MediaDomain {
	if (/(월급|통장|돈|저축|소비|카드|가계부|재테크|고정비|구독료|지출|paycheck|salary|money|saving|credit|budget|bill|invoice|subscription)/i.test(value)) {
		return "finance";
	}
	if (/(ai|업무|야근|자동화|팀|회의|생산성|일정|리더|협업|work|office|meeting|automation|productivity)/i.test(value)) {
		return "work";
	}
	if (/(썸네일|전환율|조회수|클릭|콘텐츠|쇼츠|릴스|광고|랜딩|마케팅|thumbnail|ctr|content|marketing|video|creator)/i.test(value)) {
		return "content";
	}
	return "generic";
}

function domainQuery(domain: MediaDomain, text: string, role: SceneRole): string {
	if (domain === "finance") {
		if (role === "cta") {
			return "budget planning notebook calculator bank account wallet";
		}
		if (/(카드값|결제|credit|card|payment|statement)/i.test(text)) {
			return "credit card bill payment statement personal finance";
		}
		if (/(구독|보험|할부|고정비|subscription|insurance|installment|bill|invoice)/i.test(text)) {
			return "household bills invoice subscription budget planning";
		}
		if (/(저축|남은 돈|잠급|saving|save|jar|coins)/i.test(text)) {
			return "savings jar coins household budget cash";
		}
		if (/(계좌|통장|생활비|bank|account|wallet)/i.test(text)) {
			return "budget planning notebook calculator bank account wallet";
		}
		return "personal finance cash wallet household budget";
	}

	if (domain === "work") {
		if (/(회의|meeting)/i.test(text)) return "team meeting office discussion productivity";
		if (/(자동화|ai|automation)/i.test(text)) return "workflow automation laptop office dashboard";
		if (/(야근|병목|overtime|bottleneck)/i.test(text)) return "late night office work laptop deadline";
		return "office work laptop team productivity";
	}

	if (domain === "content") {
		if (/(썸네일|thumbnail)/i.test(text)) return "thumbnail design video editing creator desk";
		if (/(조회수|클릭|전환율|ctr|conversion|click)/i.test(text)) return "marketing analytics dashboard content performance";
		if (/(쇼츠|릴스|video|shorts|reels)/i.test(text)) return "vertical video editing social media creator";
		return "content creator camera video editing studio";
	}

	if (role === "cta") return "notebook checklist action planning desk";
	if (role === "payoff") return "idea lightbulb notebook insight desk";
	return "documentary detail real world context";
}

function roleMoodQuery(role: SceneRole, tone: Brief["tone"]): string {
	const mood =
		tone === "urgent"
			? "urgent documentary"
			: tone === "energetic"
				? "bright dynamic editorial"
				: "documentary cinematic";

	if (role === "hook") return `strong opening visual ${mood}`;
	if (role === "payoff") return `insight reveal visual ${mood}`;
	if (role === "cta") return `clean action closeup ${mood}`;
	return `realistic detail visual ${mood}`;
}
