import { describe, expect, it } from "vitest";
import { CARD_THEMES, createCustomTheme, resolveTheme } from "./themes";

describe("CARD_THEMES", () => {
	it("contains at least 13 built-in themes", () => {
		expect(Object.keys(CARD_THEMES).length).toBeGreaterThanOrEqual(13);
	});

	it("each theme defines required font fields", () => {
		for (const [name, theme] of Object.entries(CARD_THEMES)) {
			expect(theme.displayFont, name).toBeTruthy();
			expect(theme.headingFont, name).toBeTruthy();
			expect(theme.bodyFont, name).toBeTruthy();
			expect(theme.spring.damping, name).toBeGreaterThan(0);
		}
	});

	it("includes new themes ocean / sunset / paper", () => {
		expect(CARD_THEMES.ocean).toBeDefined();
		expect(CARD_THEMES.sunset).toBeDefined();
		expect(CARD_THEMES.paper).toBeDefined();
	});
});

describe("createCustomTheme", () => {
	it("merges overrides onto base", () => {
		const t = createCustomTheme("dark", { accent: "#ff0000" });
		expect(t.accent).toBe("#ff0000");
		expect(t.background).toBe(CARD_THEMES.dark!.background);
	});

	it("falls back to dark when base is unknown", () => {
		const t = createCustomTheme("does-not-exist", { accent: "#fff" });
		expect(t.background).toBe(CARD_THEMES.dark!.background);
	});
});

describe("resolveTheme", () => {
	it("respects accent override", () => {
		const t = resolveTheme("#abcdef", "warm");
		expect(t.accent).toBe("#abcdef");
		expect(t.background).toBe(CARD_THEMES.warm!.background);
	});

	it("falls back to dark when theme unknown", () => {
		const t = resolveTheme(undefined, "missing");
		expect(t.background).toBe(CARD_THEMES.dark!.background);
	});
});
