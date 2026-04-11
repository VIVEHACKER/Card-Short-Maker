import { isProviderConfigured } from "./config";
import { AIKeyMissingError, type AIProviderError } from "./errors";
import { type AICapability, type AIProviderName, PROVIDER_CAPABILITIES } from "./types";

const FALLBACK_ORDER: AIProviderName[] = ["openai", "google", "anthropic"];

/**
 * 프로바이더 폴백 체인으로 작업 실행.
 * preferred가 실패하면 다음 프로바이더로 시도.
 */
export async function withFallback<T>(
	capability: AICapability,
	preferred: AIProviderName,
	execute: (provider: AIProviderName) => Promise<T>,
): Promise<T> {
	const chain = buildFallbackChain(capability, preferred);

	if (chain.length === 0) {
		throw new AIKeyMissingError(preferred, capability);
	}

	let lastError: AIProviderError | Error | null = null;

	for (const provider of chain) {
		try {
			return await execute(provider);
		} catch (error) {
			// 사용자 취소(AbortError)면 폴백 없이 즉시 중단
			if (error instanceof DOMException && error.name === "AbortError") {
				throw error;
			}
			lastError = error as AIProviderError | Error;
			continue;
		}
	}

	throw lastError ?? new AIKeyMissingError(preferred, capability);
}

function buildFallbackChain(
	capability: AICapability,
	preferred: AIProviderName,
): AIProviderName[] {
	const chain: AIProviderName[] = [];

	// preferred를 먼저
	if (
		PROVIDER_CAPABILITIES[preferred][capability] &&
		isProviderConfigured(preferred)
	) {
		chain.push(preferred);
	}

	// 나머지 폴백
	for (const name of FALLBACK_ORDER) {
		if (
			name !== preferred &&
			PROVIDER_CAPABILITIES[name][capability] &&
			isProviderConfigured(name)
		) {
			chain.push(name);
		}
	}

	return chain;
}
