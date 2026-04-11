import { beforeEach, describe, expect, it } from "vitest";
import { hasAnyProvider, loadAISettings, saveAISettings } from "./config";

const STORAGE_KEY = "shorts-studio:ai-config";
const SECRETS_KEY = "shorts-studio:ai-secrets";

function installMockStorage() {
	const localStore = new Map<string, string>();
	const sessionStore = new Map<string, string>();

	const localStorageMock = {
		getItem(key: string) {
			return localStore.has(key) ? (localStore.get(key) ?? null) : null;
		},
		setItem(key: string, value: string) {
			localStore.set(key, value);
		},
		removeItem(key: string) {
			localStore.delete(key);
		},
		clear() {
			localStore.clear();
		},
		key(index: number) {
			return Array.from(localStore.keys())[index] ?? null;
		},
		get length() {
			return localStore.size;
		},
	} as Storage;

	const sessionStorageMock = {
		getItem(key: string) {
			return sessionStore.has(key) ? (sessionStore.get(key) ?? null) : null;
		},
		setItem(key: string, value: string) {
			sessionStore.set(key, value);
		},
		removeItem(key: string) {
			sessionStore.delete(key);
		},
		clear() {
			sessionStore.clear();
		},
		key(index: number) {
			return Array.from(sessionStore.keys())[index] ?? null;
		},
		get length() {
			return sessionStore.size;
		},
	} as Storage;

	Object.defineProperty(globalThis, "localStorage", {
		value: localStorageMock,
		configurable: true,
	});
	Object.defineProperty(globalThis, "sessionStorage", {
		value: sessionStorageMock,
		configurable: true,
	});
}

describe("ai config hardening", () => {
	beforeEach(() => {
		installMockStorage();
	});

	it("does not crash when providers shape is malformed", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				providers: {
					openai: "bad-shape",
					google: { apiKey: 1234 },
				},
				textProvider: "unknown",
				imageProvider: "not-auto",
				ttsProvider: "bad",
			}),
		);

		expect(() => hasAnyProvider()).not.toThrow();
		const settings = loadAISettings();

		expect(settings.providers.openai.apiKey).toBe("");
		expect(settings.providers.google.apiKey).toBe("");
		expect(settings.providers.anthropic.apiKey).toBe("");
		expect(settings.textProvider).toBe("openai");
		expect(settings.imageProvider).toBe("auto");
		expect(settings.ttsProvider).toBe("auto");
	});

	it("derives enabled flag from apiKey when enabled field is missing", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				providers: {
					openai: { apiKey: "sk-test-key" },
				},
			}),
		);

		expect(hasAnyProvider()).toBe(true);
	});

	it("migrates legacy api keys from localStorage to sessionStorage", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				providers: {
					openai: { apiKey: "sk-legacy-key", enabled: true },
				},
			}),
		);

		const settings = loadAISettings();
		expect(settings.providers.openai.apiKey).toBe("sk-legacy-key");
		expect(sessionStorage.getItem(SECRETS_KEY)).toContain("sk-legacy-key");

		const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
			providers?: { openai?: { apiKey?: string } };
		};
		expect(persisted.providers?.openai?.apiKey ?? "").toBe("");
	});

	it("stores secrets in sessionStorage instead of localStorage", () => {
		const settings = loadAISettings();
		settings.providers.openai.apiKey = "sk-session-only";
		settings.providers.openai.enabled = true;
		saveAISettings(settings);

		expect(sessionStorage.getItem(SECRETS_KEY)).toContain("sk-session-only");
		expect(localStorage.getItem(STORAGE_KEY)).not.toContain("sk-session-only");
	});

	it("returns isolated default objects on repeated loads", () => {
		const first = loadAISettings();
		first.providers.openai.apiKey = "mutated";
		first.providers.openai.enabled = true;

		const second = loadAISettings();
		expect(second.providers.openai.apiKey).toBe("");
		expect(second.providers.openai.enabled).toBe(false);
	});
});
