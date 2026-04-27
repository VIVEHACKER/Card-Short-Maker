/**
 * Lightweight, structured diagnostics for the AI pipeline and render.
 * Records start/end timestamps + arbitrary tags so we can summarize timings
 * post-hoc without coupling the pipeline to a specific telemetry vendor.
 */

export interface SpanRecord {
	id: string;
	name: string;
	startedAt: number;
	endedAt?: number;
	durationMs?: number;
	tags: Record<string, string | number | boolean>;
	error?: string;
}

const log: SpanRecord[] = [];

export function startSpan(name: string, tags: SpanRecord["tags"] = {}): SpanRecord {
	const id = `span-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
	const span: SpanRecord = {
		id,
		name,
		startedAt: performance.now(),
		tags: { ...tags },
	};
	log.push(span);
	return span;
}

export function endSpan(span: SpanRecord, error?: unknown): void {
	span.endedAt = performance.now();
	span.durationMs = Math.round(span.endedAt - span.startedAt);
	if (error) {
		span.error = error instanceof Error ? error.message : String(error);
	}
}

export async function trackSpan<T>(
	name: string,
	tags: SpanRecord["tags"],
	fn: () => Promise<T>,
): Promise<T> {
	const span = startSpan(name, tags);
	try {
		const result = await fn();
		endSpan(span);
		return result;
	} catch (error) {
		endSpan(span, error);
		throw error;
	}
}

export function getSpans(): SpanRecord[] {
	return log.slice();
}

export function clearSpans(): void {
	log.length = 0;
}

export interface SpanSummary {
	totalSpans: number;
	totalDurationMs: number;
	byName: Record<string, { count: number; totalMs: number; errors: number }>;
}

export function summarize(spans: SpanRecord[] = log): SpanSummary {
	const byName: SpanSummary["byName"] = {};
	let totalDurationMs = 0;
	for (const span of spans) {
		const dur = span.durationMs ?? 0;
		totalDurationMs += dur;
		const bucket = (byName[span.name] ??= { count: 0, totalMs: 0, errors: 0 });
		bucket.count += 1;
		bucket.totalMs += dur;
		if (span.error) bucket.errors += 1;
	}
	return {
		totalSpans: spans.length,
		totalDurationMs,
		byName,
	};
}
