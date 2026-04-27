import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withFallback } from "./fallback";
import { AIKeyMissingError } from "./errors";
import * as config from "./config";

function mockConfigured(providers: string[]) {
	vi.spyOn(config, "isProviderConfigured").mockImplementation((p) =>
		providers.includes(p),
	);
}

describe("withFallback", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws AIKeyMissingError when no provider is configured", async () => {
		mockConfigured([]);
		await expect(
			withFallback("text", "openai", async () => "x"),
		).rejects.toBeInstanceOf(AIKeyMissingError);
	});

	it("uses preferred provider when configured", async () => {
		mockConfigured(["openai"]);
		const fn = vi.fn(async (provider: string) => `result-${provider}`);
		const result = await withFallback("text", "openai", fn);
		expect(result).toBe("result-openai");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("falls back to next provider when preferred fails", async () => {
		mockConfigured(["openai", "google"]);
		const fn = vi.fn(async (provider: string) => {
			if (provider === "openai") throw new Error("rate limited");
			return `result-${provider}`;
		});
		const result = await withFallback("text", "openai", fn);
		expect(result).toBe("result-google");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("does not fall back on AbortError", async () => {
		mockConfigured(["openai", "google"]);
		const fn = vi.fn(async () => {
			throw new DOMException("aborted", "AbortError");
		});
		await expect(
			withFallback("text", "openai", fn),
		).rejects.toBeInstanceOf(DOMException);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("skips providers that lack the capability", async () => {
		mockConfigured(["anthropic"]);
		await expect(
			withFallback("image", "anthropic", async () => "x"),
		).rejects.toBeInstanceOf(AIKeyMissingError);
	});
});
