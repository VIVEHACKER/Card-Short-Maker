import { describe, expect, it } from "vitest";
import { buildImagePrompt } from "./image";

describe("buildImagePrompt variation", () => {
	it("embeds variation seed and strength instructions", () => {
		const prompt = buildImagePrompt({
			prompt: "카메라 앞에서 제품을 들고 핵심 차이를 설명하는 장면",
			style: "editorial clean",
			aspectRatio: "9:16",
			sceneRole: "build",
			variation: {
				attempt: 4,
				seed: "img-seed-4",
				strength: "fresh",
			},
		});

		expect(prompt).toContain("Variation run: attempt 4, seed img-seed-4.");
		expect(prompt).toContain("Variation mode: FRESH");
		expect(prompt).toContain("fixed card-shorts template");
		expect(prompt).toContain("central and lower-third areas");
	});
});
