import { describe, expect, it } from "vitest";
import { BGM_PRESETS, getBGMPreset, matchBGMByTone } from "./bgm-presets";

describe("BGM presets", () => {
	it("provides at least 5 presets", () => {
		expect(BGM_PRESETS.length).toBeGreaterThanOrEqual(5);
	});

	it("each preset has bpm and tone", () => {
		for (const p of BGM_PRESETS) {
			expect(p.bpm).toBeGreaterThan(0);
			expect(p.tone.length).toBeGreaterThan(0);
		}
	});

	it("matchBGMByTone returns a tone-matching preset", () => {
		const energetic = matchBGMByTone("energetic");
		expect(energetic.tone).toContain("energetic");
	});

	it("matchBGMByTone falls back when no match", () => {
		const result = matchBGMByTone("urgent");
		expect(result).toBeDefined();
	});

	it("getBGMPreset returns undefined for unknown id", () => {
		expect(getBGMPreset("nope-doesnt-exist")).toBeUndefined();
	});

	it("getBGMPreset returns matching preset when id exists", () => {
		const first = BGM_PRESETS[0]!;
		expect(getBGMPreset(first.id)?.id).toBe(first.id);
	});
});
