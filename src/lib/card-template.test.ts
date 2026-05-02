import { describe, expect, it } from "vitest";
import {
	REFERENCE_CARD_LAYOUT,
	applyReferenceCardTemplate,
	hasReferenceCardCopyPrefix,
	referenceCardHeadlineFontSize,
	referenceCardTextRisk,
	referenceCardTransition,
	stripReferenceCardCopyPrefix,
} from "./card-template";

describe("card template", () => {
	it("locks every generated scene to the reference card layout", () => {
		const scene = applyReferenceCardTemplate({
			index: 3,
			role: "build" as const,
			notes: "",
		});

		expect(scene.layout).toBe(REFERENCE_CARD_LAYOUT);
		expect(scene.transition).toBe("slideUp");
		expect(scene.notes).toContain("레퍼런스 카드형");
	});

	it("keeps the template transition sequence deterministic", () => {
		expect(referenceCardTransition(1, "hook", 6)).toBe("scale");
		expect(referenceCardTransition(2, "build", 6)).toBe("slideUp");
		expect(referenceCardTransition(5, "payoff", 6)).toBe("slideUp");
		expect(referenceCardTransition(6, "cta", 6)).toBe("fade");
	});

	it("downgrades headline size and risk as copy gets longer", () => {
		const shortSize = referenceCardHeadlineFontSize("짧은 후킹", "hook");
		const longText = "이 문장은 카드형 쇼츠 중앙 헤드라인 영역에서 줄바꿈이 많아질 정도로 길게 작성된 테스트 문장입니다.".repeat(3);
		const longSize = referenceCardHeadlineFontSize(longText, "hook");

		expect(longSize).toBeLessThan(shortSize);
		expect(referenceCardTextRisk(longText, ["긴 자막도 같이 들어갑니다"])).toBe("overflow");
	});

	it("strips duplicate template labels from scene copy", () => {
		expect(stripReferenceCardCopyPrefix("POINT 01. 월급날 돈부터 잠급니다.")).toBe("월급날 돈부터 잠급니다.");
		expect(stripReferenceCardCopyPrefix("첫째, 고정비를 먼저 분리합니다.")).toBe("고정비를 먼저 분리합니다.");
		expect(stripReferenceCardCopyPrefix("1. Check the first action.")).toBe("Check the first action.");
		expect(hasReferenceCardCopyPrefix("둘째, 카드값을 먼저 확인합니다.")).toBe(true);
		expect(hasReferenceCardCopyPrefix("카드값을 먼저 확인합니다.")).toBe(false);
	});
});
