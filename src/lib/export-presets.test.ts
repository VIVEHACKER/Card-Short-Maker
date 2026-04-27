import { describe, expect, it } from "vitest";
import {
	EXPORT_PRESETS,
	getPresetById,
	getPresetByPlatform,
	safeZonePadding,
} from "./export-presets";

describe("export presets", () => {
	it("contains youtube/tiktok/reels", () => {
		const platforms = EXPORT_PRESETS.map((p) => p.platform);
		expect(platforms).toContain("youtube");
		expect(platforms).toContain("tiktok");
		expect(platforms).toContain("reels");
	});

	it("all presets are 1080x1920 vertical", () => {
		for (const p of EXPORT_PRESETS) {
			expect(p.width).toBe(1080);
			expect(p.height).toBe(1920);
			expect(p.height).toBeGreaterThan(p.width);
		}
	});

	it("all presets define safeZone fields", () => {
		for (const p of EXPORT_PRESETS) {
			expect(p.safeZone.top).toBeGreaterThan(0);
			expect(p.safeZone.bottom).toBeGreaterThan(0);
			expect(p.safeZone.left).toBeGreaterThanOrEqual(0);
			expect(p.safeZone.right).toBeGreaterThanOrEqual(0);
		}
	});

	it("getPresetByPlatform returns the matching preset", () => {
		expect(getPresetByPlatform("youtube").platform).toBe("youtube");
		expect(getPresetByPlatform("tiktok").platform).toBe("tiktok");
	});

	it("getPresetById returns undefined for unknown id", () => {
		expect(getPresetById("does-not-exist")).toBeUndefined();
	});

	it("safeZonePadding mirrors preset safeZone numbers", () => {
		const preset = getPresetByPlatform("tiktok");
		const padding = safeZonePadding(preset);
		expect(padding.paddingTop).toBe(preset.safeZone.top);
		expect(padding.paddingBottom).toBe(preset.safeZone.bottom);
	});
});
