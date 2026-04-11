import { loadAISettings, isProviderConfigured } from "./config";
import { AIKeyMissingError } from "./errors";
import { type AICapability, type AIProviderName, PROVIDER_CAPABILITIES } from "./types";

/**
 * 주어진 기능에 대해 실제 사용할 프로바이더를 결정한다.
 * "auto"이면 폴백 순서대로 첫 번째 사용 가능한 프로바이더 반환.
 */
export function resolveProvider(
	capability: AICapability,
	preferred?: AIProviderName | "auto",
): AIProviderName {
	const settings = loadAISettings();

	// 명시적 선택이 있으면 그것 사용
	if (preferred && preferred !== "auto") {
		if (
			PROVIDER_CAPABILITIES[preferred][capability] &&
			isProviderConfigured(preferred)
		) {
			return preferred;
		}
	}

	// 설정에서 기능별 프로바이더 읽기
	const configured =
		capability === "text"
			? settings.textProvider
			: capability === "image"
				? settings.imageProvider
				: settings.ttsProvider;

	if (configured !== "auto") {
		if (
			PROVIDER_CAPABILITIES[configured][capability] &&
			isProviderConfigured(configured)
		) {
			return configured;
		}
	}

	// 폴백: 해당 기능을 지원하고 키가 설정된 첫 프로바이더
	const fallbackOrder: AIProviderName[] = ["openai", "google", "anthropic"];
	for (const name of fallbackOrder) {
		if (PROVIDER_CAPABILITIES[name][capability] && isProviderConfigured(name)) {
			return name;
		}
	}

	throw new AIKeyMissingError(
		preferred === "auto" || !preferred ? "openai" : preferred,
		capability,
	);
}

/** 특정 기능에 사용 가능한 프로바이더 목록 */
export function getAvailableProviders(
	capability: AICapability,
): AIProviderName[] {
	const all: AIProviderName[] = ["openai", "google", "anthropic"];
	return all.filter(
		(name) =>
			PROVIDER_CAPABILITIES[name][capability] && isProviderConfigured(name),
	);
}
