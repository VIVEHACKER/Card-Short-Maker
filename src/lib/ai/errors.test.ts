import { describe, expect, it } from "vitest";
import {
	AIAuthError,
	AIKeyMissingError,
	AINetworkError,
	AIProviderError,
	AIRateLimitError,
	classifyError,
} from "./errors";

describe("AI error classes", () => {
	it("AIKeyMissingError is non-retryable", () => {
		const error = new AIKeyMissingError("openai", "text");
		expect(error).toBeInstanceOf(AIProviderError);
		expect(error.retryable).toBe(false);
		expect(error.provider).toBe("openai");
	});

	it("AIAuthError is 401 + non-retryable", () => {
		const error = new AIAuthError("google", "image");
		expect(error.status).toBe(401);
		expect(error.retryable).toBe(false);
	});

	it("AIRateLimitError is 429 + retryable", () => {
		const error = new AIRateLimitError("anthropic", "text");
		expect(error.status).toBe(429);
		expect(error.retryable).toBe(true);
	});

	it("AINetworkError is retryable", () => {
		const error = new AINetworkError("openai", "tts");
		expect(error.retryable).toBe(true);
	});
});

describe("classifyError", () => {
	it("returns existing AIProviderError unchanged", () => {
		const original = new AIRateLimitError("openai", "text");
		const classified = classifyError("openai", "text", original);
		expect(classified).toBe(original);
	});

	it("converts fetch TypeError to AINetworkError", () => {
		const fetchError = new TypeError("Failed to fetch");
		const classified = classifyError("openai", "text", fetchError);
		expect(classified).toBeInstanceOf(AINetworkError);
	});

	it("wraps generic Error with provider context", () => {
		const generic = new Error("something broke");
		const classified = classifyError("google", "image", generic);
		expect(classified).toBeInstanceOf(AIProviderError);
		expect(classified.message).toContain("something broke");
		expect(classified.provider).toBe("google");
	});

	it("wraps non-Error values", () => {
		const classified = classifyError("anthropic", "text", "raw string");
		expect(classified.message).toBe("raw string");
	});
});
