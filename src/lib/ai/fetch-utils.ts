import type { AICapability, AIProviderName } from "./types";
import {
	AIAuthError,
	AINetworkError,
	AIProviderError,
	AIRateLimitError,
} from "./errors";

interface FetchOptions {
	provider: AIProviderName;
	capability: AICapability;
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
	signal?: AbortSignal;
	timeoutMs?: number;
	maxRetries?: number;
}

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 3000];

export async function aiFetch(options: FetchOptions): Promise<Response> {
	const {
		provider,
		capability,
		url,
		method = "POST",
		headers = {},
		body,
		signal,
		timeoutMs = DEFAULT_TIMEOUT,
		maxRetries = MAX_RETRIES,
	} = options;

	let lastError: AIProviderError | null = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		// 외부 signal이 있으면 연결
		const onAbort = () => controller.abort();
		signal?.addEventListener("abort", onAbort);

		try {
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json", ...headers },
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (response.ok) return response;

			if (response.status === 401 || response.status === 403) {
				throw new AIAuthError(provider, capability);
			}

			if (response.status === 429) {
				lastError = new AIRateLimitError(provider, capability);
				if (attempt < maxRetries) {
					await sleep(BACKOFF_MS[attempt] ?? 3000);
					continue;
				}
				throw lastError;
			}

			const text = await response.text().catch(() => "");
			throw new AIProviderError(
				provider,
				capability,
				response.status,
				false,
				`${provider} API 오류 (${response.status}): ${text.slice(0, 200)}`,
			);
		} catch (error) {
			if (error instanceof AIProviderError) throw error;

			if (
				error instanceof DOMException &&
				error.name === "AbortError"
			) {
				if (signal?.aborted) {
					throw new AIProviderError(
						provider,
						capability,
						undefined,
						false,
						"사용자가 요청을 취소했습니다.",
					);
				}
				throw new AIProviderError(
					provider,
					capability,
					undefined,
					true,
					"요청 시간이 초과되었습니다.",
				);
			}

			lastError = new AINetworkError(provider, capability);
			if (attempt < maxRetries) {
				await sleep(BACKOFF_MS[attempt] ?? 3000);
				continue;
			}
			throw new AIProviderError(
				provider,
				capability,
				undefined,
				true,
				`${lastError.message} (브라우저 CORS 또는 dev proxy 설정 문제일 수 있습니다.)`,
			);
		} finally {
			clearTimeout(timeout);
			signal?.removeEventListener("abort", onAbort);
		}
	}

	throw lastError ?? new AINetworkError(provider, capability);
}

/** blob URL을 반환하는 바이너리 fetch (이미지/오디오용) */
export async function aiFetchBlob(options: FetchOptions): Promise<string> {
	const response = await aiFetch(options);
	const blob = await response.blob();
	return URL.createObjectURL(blob);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
