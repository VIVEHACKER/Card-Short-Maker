import { describe, expect, it } from "vitest";
import { buildReferenceCardMediaQuery } from "./media-query";
import type { Brief } from "../types";

const brief: Brief = {
	id: "media-brief",
	title: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
	topic: "월급이 매달 사라지는 이유: 통장에 돈이 안 모이는 3가지 습관",
	intent: "info",
	tone: "serious",
	targetDuration: 30,
	platform: "youtube",
	language: "ko",
	audience: "직장인",
	thesis: "돈이 새는 순서를 바꿔야 합니다.",
};

describe("buildReferenceCardMediaQuery", () => {
	it("separates finance scene visuals by concrete meaning", () => {
		const saving = buildReferenceCardMediaQuery(
			"월급날 남은 돈을 저축하려고 하면 저축은 항상 마지막 순서로 밀립니다.",
			brief,
			"build",
		);
		const bills = buildReferenceCardMediaQuery(
			"구독료, 보험료, 할부처럼 자동으로 빠지는 고정비를 매달 다시 보지 않습니다.",
			brief,
			"build",
		);
		const card = buildReferenceCardMediaQuery(
			"카드값을 결제일에만 확인해서 이미 쓴 돈을 뒤늦게 발견합니다.",
			brief,
			"build",
		);

		expect(saving).toContain("savings jar");
		expect(bills).toContain("household bills");
		expect(card).toContain("credit card bill");
		expect(new Set([saving, bills, card]).size).toBe(3);
	});

	it("uses CTA-friendly planning imagery for action scenes", () => {
		const query = buildReferenceCardMediaQuery(
			"오늘 월급 통장에서 저축, 고정비, 생활비 계좌를 먼저 나눠보세요.",
			brief,
			"cta",
		);

		expect(query).toContain("budget planning");
		expect(query).toContain("notebook calculator");
		expect(query).toContain("clean action closeup");
		expect(query).not.toContain("household bills");
	});
});
