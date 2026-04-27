/**
 * Lightweight in-memory + sessionStorage cache for AI responses.
 * Key by stable JSON of request payload. TTL bounded to keep responses fresh.
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_PREFIX = "shorts-studio:ai-cache:";

export interface CacheOptions {
	ttlMs?: number;
	/** Skip persistence (memory-only). Useful for blob URLs which lose validity across sessions. */
	memoryOnly?: boolean;
}

export function cacheKey(namespace: string, payload: unknown): string {
	return `${namespace}::${stableHash(payload)}`;
}

export function getCached<T>(key: string): T | null {
	const inMemory = memoryCache.get(key) as CacheEntry<T> | undefined;
	if (inMemory && inMemory.expiresAt > Date.now()) {
		return inMemory.value;
	}
	if (inMemory) memoryCache.delete(key);

	const storage = safeStorage();
	if (!storage) return null;
	try {
		const raw = storage.getItem(STORAGE_PREFIX + key);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CacheEntry<T>;
		if (parsed.expiresAt < Date.now()) {
			storage.removeItem(STORAGE_PREFIX + key);
			return null;
		}
		memoryCache.set(key, parsed);
		return parsed.value;
	} catch {
		return null;
	}
}

export function setCached<T>(key: string, value: T, options: CacheOptions = {}): void {
	const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
	const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttl };
	memoryCache.set(key, entry);

	if (options.memoryOnly) return;
	const storage = safeStorage();
	if (!storage) return;
	try {
		storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
	} catch {
		// quota exceeded — silently fall back to memory-only.
	}
}

export function clearCache(): void {
	memoryCache.clear();
	const storage = safeStorage();
	if (!storage) return;
	const toRemove: string[] = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key && key.startsWith(STORAGE_PREFIX)) toRemove.push(key);
	}
	for (const key of toRemove) storage.removeItem(key);
}

function stableHash(value: unknown): string {
	return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		return Object.keys(obj)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = canonicalize(obj[key]);
				return acc;
			}, {});
	}
	return value;
}

function safeStorage(): Storage | null {
	try {
		const scope = globalThis as unknown as { sessionStorage?: Storage };
		return scope.sessionStorage ?? null;
	} catch {
		return null;
	}
}
