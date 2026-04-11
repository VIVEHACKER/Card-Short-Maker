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
});
