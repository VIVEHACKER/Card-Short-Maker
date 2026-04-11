import type { AIProviderName, AISettings } from "./types";

export const AI_SETTINGS_STORAGE_KEY = "shorts-studio:ai-config";
const AI_SECRETS_STORAGE_KEY = "shorts-studio:ai-secrets";
const PROVIDERS: AIProviderName[] = ["openai", "google", "anthropic"];
type AISecrets = Partial<Record<AIProviderName, string>>;
let volatileSecrets: AISecrets = {};

const DEFAULT_SETTINGS: AISettings = {
	providers: {
		openai: { apiKey: "", enabled: false },
		google: { apiKey: "", enabled: false },
		anthropic: { apiKey: "", enabled: false },
	},
	textProvider: "openai",
	imageProvider: "auto",
	ttsProvider: "auto",
};

export function loadAISettings(): AISettings {
	const persisted = readPersistedSettings();
	const secrets = loadSecrets();

	let migrated = false;
	const migratedSecrets: AISecrets = { ...secrets };
	for (const provider of PROVIDERS) {
		const legacyKey = persisted.providers[provider]?.apiKey ?? "";
		if (legacyKey.trim() && !migratedSecrets[provider]) {
			migratedSecrets[provider] = legacyKey;
			migrated = true;
		}
	}

	if (migrated) {
		saveSecrets(migratedSecrets);
		writePersistedSettings(
			mergeSettingsWithSecrets(persisted, migratedSecrets),
		);
	}

	return mergeSettingsWithSecrets(persisted, migratedSecrets);
}

export function saveAISettings(settings: AISettings): void {
	const normalized = normalizeSettings(settings);
	writePersistedSettings(normalized);
	saveSecrets(extractSecrets(normalized));
}

export function getApiKey(provider: AIProviderName): string {
	const settings = loadAISettings();
	return settings.providers[provider]?.apiKey ?? "";
}

export function setApiKey(provider: AIProviderName, key: string): void {
	const settings = loadAISettings();
	settings.providers[provider].apiKey = key;
	settings.providers[provider].enabled = key.trim().length > 0;
	saveAISettings(settings);
}

export function isProviderConfigured(provider: AIProviderName): boolean {
	const settings = loadAISettings();
	const config = settings.providers[provider];
	return Boolean(config?.enabled && config.apiKey.trim().length > 0);
}

export function hasAnyProvider(): boolean {
	const settings = loadAISettings();
	return (["openai", "google", "anthropic"] as const).some((name) => {
		const config = settings.providers[name];
		return Boolean(config?.enabled && config.apiKey.trim().length > 0);
	});
}

/** 프로바이더별 키 프리픽스 (검증용, 시크릿 아님) */
const KEY_PREFIXES: Record<AIProviderName, string[]> = {
	openai: ["sk-"],
	google: ["AIza"],
	anthropic: [["sk", "ant"].join("-") + "-"],
};

/** API 키 형식이 맞는지 간단 검증 */
export function validateKeyFormat(
	provider: AIProviderName,
	key: string,
): boolean {
	const trimmed = key.trim();
	if (!trimmed) return false;
	const prefixes = KEY_PREFIXES[provider];
	if (!prefixes) return trimmed.length >= 10;
	return (
		prefixes.some((p) => trimmed.startsWith(p)) || trimmed.length >= 30
	);
}

function createDefaultSettings(): AISettings {
	return {
		providers: {
			openai: { ...DEFAULT_SETTINGS.providers.openai },
			google: { ...DEFAULT_SETTINGS.providers.google },
			anthropic: { ...DEFAULT_SETTINGS.providers.anthropic },
		},
		textProvider: DEFAULT_SETTINGS.textProvider,
		imageProvider: DEFAULT_SETTINGS.imageProvider,
		ttsProvider: DEFAULT_SETTINGS.ttsProvider,
	};
}

function normalizeSettings(raw: unknown): AISettings {
	const defaults = createDefaultSettings();
	const parsed = asRecord(raw);
	const providers = asRecord(parsed.providers);

	const normalizedProviders = {
		openai: normalizeProviderConfig(providers.openai),
		google: normalizeProviderConfig(providers.google),
		anthropic: normalizeProviderConfig(providers.anthropic),
	};

	const textProvider = asProviderName(parsed.textProvider) ?? defaults.textProvider;
	const imageProvider = asProviderOrAuto(parsed.imageProvider) ?? defaults.imageProvider;
	const ttsProvider = asProviderOrAuto(parsed.ttsProvider) ?? defaults.ttsProvider;

	return {
		providers: normalizedProviders,
		textProvider,
		imageProvider,
		ttsProvider,
	};
}

function readPersistedSettings(): AISettings {
	const raw = readStorageValue("localStorage", AI_SETTINGS_STORAGE_KEY);
	if (!raw) return createDefaultSettings();

	try {
		return normalizeSettings(JSON.parse(raw) as unknown);
	} catch {
		return createDefaultSettings();
	}
}

function writePersistedSettings(settings: AISettings): void {
	const sanitized = {
		...settings,
		providers: {
			openai: {
				apiKey: "",
				enabled: settings.providers.openai.enabled,
			},
			google: {
				apiKey: "",
				enabled: settings.providers.google.enabled,
			},
			anthropic: {
				apiKey: "",
				enabled: settings.providers.anthropic.enabled,
			},
		},
	};
	writeStorageValue(
		"localStorage",
		AI_SETTINGS_STORAGE_KEY,
		JSON.stringify(sanitized),
	);
}

function extractSecrets(settings: AISettings): AISecrets {
	const secrets: AISecrets = {};

	for (const provider of PROVIDERS) {
		const key = settings.providers[provider].apiKey.trim();
		if (key) {
			secrets[provider] = key;
		}
	}

	return secrets;
}

function loadSecrets(): AISecrets {
	const storage = getStorage("localStorage");
	if (storage) {
		const raw = readStorageValue("localStorage", AI_SECRETS_STORAGE_KEY);
		if (!raw) return {};

		try {
			return normalizeSecrets(asRecord(JSON.parse(raw) as unknown));
		} catch {
			return {};
		}
	}

	return { ...volatileSecrets };
}

function saveSecrets(secrets: AISecrets): void {
	const normalized = normalizeSecrets(secrets as Record<string, unknown>);
	const storage = getStorage("localStorage");

	if (storage) {
		volatileSecrets = {};
		writeStorageValue(
			"localStorage",
			AI_SECRETS_STORAGE_KEY,
			JSON.stringify(normalized),
		);
		return;
	}

	volatileSecrets = { ...normalized };
}

function normalizeSecrets(raw: Record<string, unknown>): AISecrets {
	const secrets: AISecrets = {};
	for (const provider of PROVIDERS) {
		const value = raw[provider];
		if (typeof value === "string" && value.trim()) {
			secrets[provider] = value.trim();
		}
	}
	return secrets;
}

function mergeSettingsWithSecrets(settings: AISettings, secrets: AISecrets): AISettings {
	const merged = createDefaultSettings();

	for (const provider of PROVIDERS) {
		const key = (secrets[provider] ?? settings.providers[provider].apiKey).trim();
		merged.providers[provider] = {
			apiKey: key,
			enabled: key.length > 0,
		};
	}

	merged.textProvider = settings.textProvider;
	merged.imageProvider = settings.imageProvider;
	merged.ttsProvider = settings.ttsProvider;

	return merged;
}

function readStorageValue(
	storageName: "localStorage" | "sessionStorage",
	key: string,
): string | null {
	try {
		const storage = getStorage(storageName);
		return storage?.getItem(key) ?? null;
	} catch {
		return null;
	}
}

function writeStorageValue(
	storageName: "localStorage" | "sessionStorage",
	key: string,
	value: string,
): void {
	try {
		const storage = getStorage(storageName);
		storage?.setItem(key, value);
	} catch {
		// Ignore storage write errors (private mode, blocked storage, etc.).
	}
}

function getStorage(
	storageName: "localStorage" | "sessionStorage",
): Storage | null {
	const scope = globalThis as unknown as {
		localStorage?: Storage;
		sessionStorage?: Storage;
	};

	if (storageName === "localStorage") {
		return scope.localStorage ?? null;
	}

	return scope.sessionStorage ?? null;
}

function normalizeProviderConfig(raw: unknown): {
	apiKey: string;
	enabled: boolean;
} {
	const record = asRecord(raw);
	const apiKey = typeof record.apiKey === "string" ? record.apiKey : "";
	const enabled =
		typeof record.enabled === "boolean"
			? record.enabled
			: apiKey.trim().length > 0;

	return { apiKey, enabled };
}

function asProviderName(value: unknown): AIProviderName | null {
	return value === "openai" || value === "google" || value === "anthropic"
		? value
		: null;
}

function asProviderOrAuto(value: unknown): AIProviderName | "auto" | null {
	return value === "auto" ? "auto" : asProviderName(value);
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}
