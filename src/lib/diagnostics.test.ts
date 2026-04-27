import { beforeEach, describe, expect, it } from "vitest";
import {
	clearSpans,
	endSpan,
	getSpans,
	startSpan,
	summarize,
	trackSpan,
} from "./diagnostics";

describe("diagnostics", () => {
	beforeEach(() => {
		clearSpans();
	});

	it("starts and ends a span with duration", () => {
		const span = startSpan("test", { stage: "warmup" });
		endSpan(span);
		expect(span.durationMs).toBeDefined();
		expect(span.tags.stage).toBe("warmup");
	});

	it("trackSpan resolves and records duration", async () => {
		const result = await trackSpan("op", {}, async () => "ok");
		expect(result).toBe("ok");
		expect(getSpans()).toHaveLength(1);
		expect(getSpans()[0]!.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("trackSpan re-throws and records error", async () => {
		await expect(
			trackSpan("op", {}, async () => {
				throw new Error("boom");
			}),
		).rejects.toThrow("boom");
		expect(getSpans()[0]!.error).toBe("boom");
	});

	it("summarize aggregates by name", async () => {
		await trackSpan("a", {}, async () => 1);
		await trackSpan("a", {}, async () => 2);
		await trackSpan("b", {}, async () => 3);
		const summary = summarize();
		expect(summary.totalSpans).toBe(3);
		expect(summary.byName.a?.count).toBe(2);
		expect(summary.byName.b?.count).toBe(1);
	});
});
