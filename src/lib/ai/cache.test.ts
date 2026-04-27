import { beforeEach, describe, expect, it, vi } from "vitest";
import { cacheKey, clearCache, getCached, setCached } from "./cache";

function installSessionStorage() {
	const store = new Map<string, string>();
	const mock = {
		getItem(k: string) {
			return store.has(k) ? (store.get(k) ?? null) : null;
		},
		setItem(k: string, v: string) {
			store.set(k, v);
		},
		removeItem(k: string) {
			store.delete(k);
		},
		clear() {
			store.clear();
		},
		key(i: number) {
			return Array.from(store.keys())[i] ?? null;
		},
		get length() {
			return store.size;
		},
	} as Storage;
	Object.defineProperty(globalThis, "sessionStorage", {
		value: mock,
		configurable: true,
	});
}

describe("ai cache", () => {
	beforeEach(() => {
		installSessionStorage();
		clearCache();
	});

	it("returns null for missing key", () => {
		expect(getCached("missing")).toBeNull();
	});

	it("stores and retrieves a value", () => {
		const key = cacheKey("text", { brief: "x" });
		setCached(key, { script: "hi" });
		expect(getCached(key)).toEqual({ script: "hi" });
	});

	it("yields the same key for equivalent objects regardless of property order", () => {
		const k1 = cacheKey("text", { a: 1, b: { c: 2, d: 3 } });
		const k2 = cacheKey("text", { b: { d: 3, c: 2 }, a: 1 });
		expect(k1).toBe(k2);
	});

	it("respects TTL expiration", () => {
		const key = cacheKey("text", { x: 1 });
		setCached(key, "value", { ttlMs: 10 });

		vi.useFakeTimers();
		vi.setSystemTime(Date.now() + 100);
		expect(getCached(key)).toBeNull();
		vi.useRealTimers();
	});

	it("clearCache empties storage", () => {
		const key = cacheKey("text", { y: 1 });
		setCached(key, "value");
		clearCache();
		expect(getCached(key)).toBeNull();
	});
});
