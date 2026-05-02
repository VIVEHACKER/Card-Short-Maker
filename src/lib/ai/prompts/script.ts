import type { Brief } from "../../../types";
import type { GenerationVariationProfile } from "../types";

export function buildScriptSystemPrompt(language: "ko" | "en"): string {
	if (language === "ko") {
		return `당신은 조회수를 만드는 한국어 숏폼 영상 스크립트 작가입니다.

핵심 목표:
- 첫 줄에서 스크롤을 멈추게 만들기
- 시청자가 "나도 해봐야지"라고 느끼게 만들기
- 마지막에 구체적 행동 하나를 남기기

구조 규칙:
- 정확히 요청된 줄 수만 출력
- 첫 줄(Hook): 시청자가 멈출 만한 강한 질문, 반전, 또는 충격 사실
- 중간 줄(Build): 주제에 맞는 구체적 사례, 비교, 수치, 경험담
- 마지막에서 두 번째 줄(Payoff): 이 영상의 핵심 한 줄. 중간 내용을 관통하는 통찰.
- 마지막 줄(CTA): 주제와 직결된 구체적 행동 딱 하나. 예: "오늘 자기 전에 냉장고 야채칸 한 번만 확인해보세요"
- 화면 템플릿이 HOOK / POINT 01 / KEY POINT / NEXT STEP 라벨을 자동으로 붙입니다. 스크립트에는 내용 문장만 쓰세요.

마지막 2줄 주의:
- Payoff는 앞에서 말한 내용의 결론이어야 함. 갑자기 새로운 얘기 금지.
- CTA는 반드시 주제 안에서 나온 행동이어야 함. "구독/좋아요/알림" 같은 채널 홍보 금지.
- "시작해보세요", "도전해보세요", "바꿔보세요" 같은 뜬구름 CTA 금지. 뭘 할지 구체적으로.

톤 규칙:
- 대화하듯 자연스럽게. 강의체, 설명체 금지.
- "~입니다", "~합니다" 대신 "~거든요", "~더라고요", "~해보세요" 같은 구어체
- 주제에 실제로 관련 있는 구체적 내용만. 매 줄이 다른 정보를 전달해야 함.

금지 사항:
- "이 영상에서는", "정리해보면", "결론적으로" 같은 메타 표현
- 숫자 불릿, 괄호 설명, 따옴표
- 모든 주제에 붙일 수 있는 범용 문장 (예: "대부분은 모릅니다", "핵심은 기준입니다", "지금 바로 시작해보세요")

출력: 스크립트 줄들만. 줄바꿈으로 구분. 다른 텍스트 절대 출력하지 마세요.`;
	}

	return `You are a top-performing short-form video scriptwriter.

Goals:
- First line must stop the scroll
- Make the viewer think "I need to try this"
- End with one specific action they can take right now

Structure:
- Output exactly the requested number of lines
- Line 1 (Hook): Provocative question, surprising fact, or bold claim that stops the scroll
- Middle lines (Build): Specific examples, comparisons, numbers, or real stories
- Second-to-last line (Payoff): The core insight that ties everything together
- Last line (CTA): One specific action directly related to the topic. e.g. "Tonight, check the expiration dates on everything in your fridge door"
- The fixed card template automatically adds HOOK / POINT 01 / KEY POINT / NEXT STEP labels. Write content sentences only.

Last 2 lines rules:
- Payoff must conclude what was discussed, not introduce something new
- CTA must be a concrete action FROM the topic. No "subscribe/like" channel promos.
- No vague CTAs like "start today" or "try it out". Say exactly WHAT to do.

Tone:
- Conversational and natural, not lecture-style
- Every line delivers NEW information. No rephrasing.
- Topic-specific details only.

Forbidden:
- Meta phrases like "in this video", "let me explain", "in conclusion"
- Numeric bullets, parenthetical explanations, quotes
- Generic sentences that could apply to any topic (e.g. "most people don't know", "just get started")

Output: script lines only, newline-separated, nothing else.`;
}

export function buildScriptUserPrompt(
	brief: Brief,
	maxScenes: number,
	variation?: GenerationVariationProfile,
): string {
	if (brief.language === "en") {
		const lines = [
			`Topic: ${brief.topic}`,
			`Title: ${brief.title}`,
			brief.thesis ? `Core thesis: ${brief.thesis}` : "",
			brief.audience ? `Target audience: ${brief.audience}` : "",
			`Intent: ${brief.intent === "opinion" ? "opinion/argument" : brief.intent === "story" ? "story/experience" : "information"}`,
			`Tone: ${brief.tone === "energetic" ? "energetic and fast" : brief.tone === "serious" ? "serious and deep" : brief.tone === "urgent" ? "urgent and intense" : "natural and conversational"}`,
			`Platform: ${brief.platform}`,
			`Target length: ${brief.targetDuration} seconds`,
			"",
			`Write exactly ${maxScenes} lines for this short-form script.`,
			"Every line must include topic-specific detail. Do not use generic lines that fit any topic.",
			"The card template adds HOOK / POINT 01 / KEY POINT / NEXT STEP labels automatically. Write content sentences only.",
		].filter(Boolean);

		const variationLines = buildVariationLines("en", variation);
		if (variationLines.length > 0) {
			lines.push("", ...variationLines);
		}
		return lines.join("\n");
	}

	const lines = [
		`주제: ${brief.topic}`,
		`제목: ${brief.title}`,
		brief.thesis ? `핵심 메시지: ${brief.thesis}` : "",
		brief.audience ? `대상 시청자: ${brief.audience}` : "",
		`의도: ${brief.intent === "opinion" ? "의견/주장" : brief.intent === "story" ? "경험/스토리" : "정보 전달"}`,
		`톤: ${brief.tone === "energetic" ? "활기차고 빠르게" : brief.tone === "serious" ? "진지하고 깊이 있게" : brief.tone === "urgent" ? "긴급하고 강하게" : "자연스럽고 편하게"}`,
		`플랫폼: ${brief.platform}`,
		`목표 길이: ${brief.targetDuration}초`,
		"",
		`이 주제에 대해 정확히 ${maxScenes}줄의 숏폼 스크립트를 작성하세요.`,
		"각 줄은 해당 주제만의 구체적인 내용이어야 합니다. 어떤 주제에든 쓸 수 있는 범용 문장은 절대 쓰지 마세요.",
		"카드 템플릿이 HOOK / POINT 01 / KEY POINT / NEXT STEP 라벨을 자동으로 붙입니다. 스크립트에는 내용 문장만 쓰세요.",
	].filter(Boolean);

	const variationLines = buildVariationLines("ko", variation);
	if (variationLines.length > 0) {
		lines.push("", ...variationLines);
	}

	return lines.join("\n");
}

/** Brief에서 적정 씬 수 계산 */
export function estimateSceneCount(brief: Brief): number {
	const raw = Math.round(brief.targetDuration / 4.8);
	return Math.max(6, Math.min(8, raw));
}

function buildVariationLines(
	language: "ko" | "en",
	variation?: GenerationVariationProfile,
): string[] {
	if (!variation) return [];

	if (language === "en") {
		const strengthLine =
			variation.strength === "wild"
				? "Variation mode: WILD (maximize novelty in hook angle and examples, while keeping the same thesis)."
				: variation.strength === "fresh"
					? "Variation mode: FRESH (change hook framing and build examples clearly from prior attempts)."
					: "Variation mode: BALANCED (preserve thesis, but rewrite hook/build/CTA with different wording and examples).";

		return [
			`Variation run: attempt ${variation.attempt}, seed ${variation.seed}.`,
			strengthLine,
			"Do not reuse sentence structure from previous attempts.",
			"Keep the same topic and thesis, but choose a different narrative angle.",
		];
	}

	const strengthLine =
		variation.strength === "wild"
			? "변주 모드: WILD (핵심 논지는 유지하되 Hook 각도와 사례를 최대한 새롭게 바꾸세요)."
			: variation.strength === "fresh"
				? "변주 모드: FRESH (이전 결과와 다른 Hook 프레이밍과 다른 사례를 명확히 사용하세요)."
				: "변주 모드: BALANCED (논지는 유지하면서 Hook/Build/CTA 문장과 예시를 새롭게 바꾸세요).";

	return [
		`변주 실행: ${variation.attempt}회차, seed=${variation.seed}`,
		strengthLine,
		"이전 생성과 동일한 문장 구조 재사용 금지.",
		"주제와 결론은 유지하되 전개 각도는 다르게 구성하세요.",
	];
}
