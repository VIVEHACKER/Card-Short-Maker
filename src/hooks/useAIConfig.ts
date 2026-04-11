import { useCallback, useSyncExternalStore } from "react";
import {
	AI_SETTINGS_STORAGE_KEY,
	loadAISettings,
	saveAISettings,
} from "../lib/ai/config";
import type { AIProviderName, AISettings } from "../lib/ai/types";

let listeners: Array<() => void> = [];
let snapshot: AISettings = loadAISettings();

function subscribe(listener: () => void) {
	listeners = [...listeners, listener];

	if (listeners.length === 1) {
		window.addEventListener("storage", handleStorageChange);
	}

	return () => {
		listeners = listeners.filter((l) => l !== listener);
		if (listeners.length === 0) {
			window.removeEventListener("storage", handleStorageChange);
		}
	};
}

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}

function getSnapshot(): AISettings {
	return snapshot;
}

function commit(next: AISettings) {
	snapshot = next;
	saveAISettings(next);
	emitChange();
}

function handleStorageChange(event: StorageEvent) {
	if (event.key && event.key !== AI_SETTINGS_STORAGE_KEY) {
		return;
	}

	snapshot = loadAISettings();
	emitChange();
}

export function useAIConfig() {
	const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const updateSettings = useCallback((next: AISettings) => {
		commit(next);
	}, []);

	const updateApiKey = useCallback(
		(provider: AIProviderName, key: string) => {
			const next: AISettings = {
				...settings,
				providers: {
					...settings.providers,
					[provider]: {
						...settings.providers[provider],
						apiKey: key,
						enabled: key.trim().length > 0,
					},
				},
			};
			commit(next);
		},
		[settings],
	);

	const setTextProvider = useCallback((provider: AIProviderName) => {
		commit({
			...settings,
			textProvider: provider,
		});
	}, [settings]);

	const setImageProvider = useCallback(
		(provider: AIProviderName | "auto") => {
			commit({
				...settings,
				imageProvider: provider,
			});
		},
		[settings],
	);

	const setTtsProvider = useCallback((provider: AIProviderName | "auto") => {
		commit({
			...settings,
			ttsProvider: provider,
		});
	}, [settings]);

	return {
		settings,
		hasAnyProvider: Object.values(settings.providers).some(
			(provider) => provider.enabled && provider.apiKey.trim().length > 0,
		),
		updateSettings,
		updateApiKey,
		setTextProvider,
		setImageProvider,
		setTtsProvider,
	};
}
