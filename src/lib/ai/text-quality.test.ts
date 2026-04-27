import { describe, expect, it } from "vitest";
import { hasUsableScript } from "./text-quality";

describe("hasUsableScript", () => {
	it("returns false for empty or too-short scripts", () => {
		expect(hasUsableScript("", 6)).toBe(false);
		expect(hasUsableScript("짧은 문장 하나", 6)).toBe(false);
	});

	it("returns false for repetitive script lines", () => {
		const repetitive = [
			"이게 핵심입니다.",
			"이게 핵심입니다.",
			"이게 핵심입니다.",
			"이게 핵심입니다.",
			"이게 핵심입니다.",
			"이게 핵심입니다.",
		].join("\n");
		expect(hasUsableScript(repetitive, 6)).toBe(false);
	});

	it("returns true for structured and varied scripts", () => {
		const valid = [
			"왜 열심히 하는데도 결과가 안 나올까요?",
			"문제는 속도가 아니라 판단 순서가 뒤집혀 있다는 점입니다.",
			"대부분은 작업부터 시작해서 기준 없는 수정 루프에 빠집니다.",
			"먼저 목표 한 줄과 금지 기준 한 줄을 고정해야 흔들리지 않습니다.",
			"핵심은 도구보다 실행 기준을 먼저 고정하는 것입니다.",
			"오늘은 기준 한 줄만 정하고 다음 작업에서 바로 검증해보세요.",
		].join("\n");
		expect(hasUsableScript(valid, 6)).toBe(true);
	});

	it("rejects scripts with role markers (hook/build/payoff/cta)", () => {
		const withMarkers = [
			"hook: 첫 번째 라인입니다 충분히 길게 작성되어 있어야 합니다.",
			"build: 두 번째 라인 역시 의미 있는 길이로 작성되어 있습니다.",
			"build: 세 번째 라인 또한 다양성을 보장하기 위한 내용입니다.",
			"build: 네 번째 라인 역시 다른 표현을 사용하여 작성되었습니다.",
			"payoff: 다섯 번째 라인은 결론을 향해 의미 있게 마무리됩니다.",
			"cta: 행동 유도 라인입니다.",
		].join("\n");
		expect(hasUsableScript(withMarkers, 6)).toBe(false);
	});

	it("rejects numbered scripts (1. 2. 3.)", () => {
		const numbered = [
			"1. 첫 번째 라인입니다 충분히 길게 작성되어 있어야 합니다.",
			"2. 두 번째 라인 역시 의미 있는 길이로 작성되어 있습니다.",
			"3. 세 번째 라인 또한 다양성을 보장하기 위한 내용입니다.",
			"네 번째 라인 역시 다른 표현을 사용하여 작성되었습니다.",
			"다섯 번째 라인은 결론을 향해 의미 있게 마무리됩니다.",
			"여섯 번째 라인은 행동을 유도합니다.",
		].join("\n");
		expect(hasUsableScript(numbered, 6)).toBe(false);
	});

	it("requires at least 4 lines even when expectedLines is small", () => {
		const threeLines = [
			"첫 번째 의미 있는 라인입니다 충분히 길게 작성되어 있어야 합니다.",
			"두 번째 라인 역시 의미 있는 길이로 작성되어 있습니다.",
			"세 번째 라인 또한 다양성을 보장하기 위한 내용입니다.",
		].join("\n");
		expect(hasUsableScript(threeLines, 3)).toBe(false);
	});
});
