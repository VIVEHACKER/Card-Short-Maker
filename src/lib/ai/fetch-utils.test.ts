import { describe, expect, it } from "vitest";
import { backoffMs, retryAfterMs } from "./fetch-utils";

describe("backoffMs", () => {
	it("grows exponentially with attempt", () => {
		const a0 = backoffMs(0);
		const a1 = backoffMs(1);
		const a2 = backoffMs(2);
		expect(a0).toBeGreaterThanOrEqual(750);
		expect(a1).toBeGreaterThanOrEqual(1500);
		expect(a2).toBeGreaterThanOrEqual(3000);
	});

	it("caps at 15s + jitter", () => {
		const value = backoffMs(20);
		expect(value).toBeLessThanOrEqual(15_000 + 250);
	});

	it("is deterministic when random is injected", () => {
		expect(backoffMs(0, () => 0.5)).toBe(750 + 125);
		expect(backoffMs(1, () => 0)).toBe(1500);
	});
});

describe("retryAfterMs", () => {
	it("returns null when header missing", () => {
		const response = new Response(null, { headers: {} });
		expect(retryAfterMs(response)).toBeNull();
	});

	it("parses seconds correctly", () => {
		const response = new Response(null, { headers: { "Retry-After": "5" } });
		expect(retryAfterMs(response)).toBe(5000);
	});

	it("caps seconds at 15s", () => {
		const response = new Response(null, { headers: { "Retry-After": "9999" } });
		expect(retryAfterMs(response)).toBe(15_000);
	});

	it("parses HTTP-date format", () => {
		const future = new Date(Date.now() + 2_000).toUTCString();
		const response = new Response(null, { headers: { "Retry-After": future } });
		const ms = retryAfterMs(response);
		expect(ms).toBeGreaterThan(0);
		expect(ms).toBeLessThanOrEqual(15_000);
	});

	it("returns 0 for past HTTP-date", () => {
		const past = new Date(Date.now() - 60_000).toUTCString();
		const response = new Response(null, { headers: { "Retry-After": past } });
		expect(retryAfterMs(response)).toBe(0);
	});
});
