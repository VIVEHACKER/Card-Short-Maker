import type { AICapability, AIProviderName } from "./types";

export class AIProviderError extends Error {
	constructor(
		public readonly provider: AIProviderName,
		public readonly capability: AICapability,
		public readonly status: number | undefined,
		public readonly retryable: boolean,
		message: string,
	) {
		super(message);
		this.name = "AIProviderError";
	}
}

export class AIKeyMissingError extends AIProviderError {
	constructor(provider: AIProviderName, capability: AICapability) {
		super(
			provider,
			capability,
			undefined,
			false,
			`${provider} API 키가 설정되지 않았습니다.`,
		);
		this.name = "AIKeyMissingError";
	}
}

export class AIAuthError extends AIProviderError {
	constructor(provider: AIProviderName, capability: AICapability) {
		super(
			provider,
			capability,
			401,
			false,
			`${provider} API 키가 유효하지 않습니다. 설정을 확인하세요.`,
		);
		this.name = "AIAuthError";
	}
}

export class AIRateLimitError extends AIProviderError {
	constructor(provider: AIProviderName, capability: AICapability) {
		super(
			provider,
			capability,
			429,
			true,
			"요청 한도 초과. 잠시 후 다시 시도하세요.",
		);
		this.name = "AIRateLimitError";
	}
}

export class AINetworkError extends AIProviderError {
	constructor(provider: AIProviderName, capability: AICapability) {
		super(
			provider,
			capability,
			undefined,
			true,
			"네트워크 오류. 연결을 확인하세요.",
		);
		this.name = "AINetworkError";
	}
}

export function classifyError(
	provider: AIProviderName,
	capability: AICapability,
	error: unknown,
): AIProviderError {
	if (error instanceof AIProviderError) return error;

	if (error instanceof TypeError && String(error.message).includes("fetch")) {
		return new AINetworkError(provider, capability);
	}

	const message = error instanceof Error ? error.message : String(error);
	return new AIProviderError(provider, capability, undefined, false, message);
}
