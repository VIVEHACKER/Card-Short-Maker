import { beforeEach, describe, expect, it } from "vitest";
import {
	getAvailableStockProviders,
	getAvailableStockProvidersForMode,
	getStockConfig,
	hasConfiguredStockProvider,
	hasStockProvider,
	saveStockConfig,
} from "./config";

function installLocalStorage() {
	const store = new Map<string, string>();
	const mock = {
		getItem: (k: string) => (store.has(k) ? (store.get(k) ?? null) : null),
		setItem: (k: string, v: string) => store.set(k, v),
		removeItem: (k: string) => store.delete(k),
		clear: () => store.clear(),
		key: (i: number) => Array.from(store.keys())[i] ?? null,
		get length() {
			return store.size;
		},
	} as Storage;
	Object.defineProperty(globalThis, "localStorage", {
		value: mock,
		configurable: true,
	});
}

describe("stock config", () => {
	beforeEach(() => {
		installLocalStorage();
	});

	it("returns default config when storage empty", () => {
		const config = getStockConfig();
		expect(config.pexelsApiKey).toBe("");
		expect(config.pixabayApiKey).toBe("");
	});

	it("round-trips a config through save + get", () => {
		saveStockConfig({ pexelsApiKey: "pex-1", pixabayApiKey: "pix-1" });
		const loaded = getStockConfig();
		expect(loaded.pexelsApiKey).toBe("pex-1");
		expect(loaded.pixabayApiKey).toBe("pix-1");
	});

	it("ignores malformed JSON in storage", () => {
		localStorage.setItem("shorts-studio:stock-config", "not json");
		const loaded = getStockConfig();
		expect(loaded.pexelsApiKey).toBe("");
	});

	it("normalizes non-string values to empty string", () => {
		localStorage.setItem(
			"shorts-studio:stock-config",
			JSON.stringify({ pexelsApiKey: 1234, pixabayApiKey: null }),
		);
		const loaded = getStockConfig();
		expect(loaded.pexelsApiKey).toBe("");
		expect(loaded.pixabayApiKey).toBe("");
	});

	it("hasStockProvider is true because no-key photo sources are built in", () => {
		expect(hasStockProvider()).toBe(true);
	});

	it("hasConfiguredStockProvider returns true when any key set", () => {
		saveStockConfig({ pexelsApiKey: "p-1", pixabayApiKey: "" });
		expect(hasConfiguredStockProvider()).toBe(true);
	});

	it("getAvailableStockProviders lists configured and built-in providers", () => {
		saveStockConfig({ pexelsApiKey: "p-1", pixabayApiKey: "p-2" });
		const providers = getAvailableStockProviders();
		expect(providers).toContain("pexels");
		expect(providers).toContain("pixabay");
		expect(providers).toContain("commons");
		expect(providers).toContain("picsum");
	});

	it("can disable no-key providers for production media selection", () => {
		saveStockConfig({ pexelsApiKey: "p-1", pixabayApiKey: "" });
		const providers = getAvailableStockProvidersForMode({
			includeNoKeyFallback: false,
		});
		expect(providers).toEqual(["pexels"]);
	});

	it("hasConfiguredStockProvider ignores whitespace-only keys", () => {
		saveStockConfig({ pexelsApiKey: "   ", pixabayApiKey: "" });
		expect(hasConfiguredStockProvider()).toBe(false);
	});
});
