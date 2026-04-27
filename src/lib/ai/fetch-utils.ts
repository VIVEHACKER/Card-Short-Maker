import type { AICapability, AIProviderName } from "./types";
import {
	AIAuthError,
	AINetworkError,
	AIProviderError,
	AIRateLimitError,
} from "./errors";
import {
	AI_FETCH_DEFAULT_TIMEOUT_MS,
	AI_FETCH_MAX_RETRIES,
} from "../constants";

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

/** Base for exponential backoff: attempts wait BASE * 2^attempt + jitter (capped). */
const BACKOFF_BASE_MS = 750;
const BACKOFF_CAP_MS = 15_000;
const JITTER_MS = 250;

export async function aiFetch(options: FetchOptions): Promise<Response> {
	const {
		provider,
		capability,
		url,
		method = "POST",
		headers = {},
		body,
		signal,
		timeoutMs = AI_FETCH_DEFAULT_TIMEOUT_MS,
		maxRetries = AI_FETCH_MAX_RETRIES,
	} = options;

	let lastError: AIProviderError | null = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

			if (response.status === 429 || response.status === 503) {
				lastError = new AIRateLimitError(provider, capability);
				if (attempt < maxRetries) {
					const wait = retryAfterMs(response) ?? backoffMs(attempt);
					await sleep(wait);
					continue;
				}
				throw lastError;
			}

			// 5xx — retry with exponential backoff (transient server errors)
			if (response.status >= 500 && response.status < 600) {
				lastError = new AINetworkError(provider, capability);
				if (attempt < maxRetries) {
					await sleep(backoffMs(attempt));
					continue;
				}
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

			if (error instanceof DOMException && error.name === "AbortError") {
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
				await sleep(backoffMs(attempt));
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

/**
 * Exponential backoff with full jitter.
 * Attempt 0 → ~750ms, 1 → ~1500ms, 2 → ~3000ms (capped at 15s).
 */
export function backoffMs(attempt: number): number {
	const expo = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
	const jitter = Math.floor(Math.random() * JITTER_MS);
	return expo + jitter;
}

/** Parse RFC 7231 `Retry-After` header. Supports seconds (number) and HTTP-date. */
export function retryAfterMs(response: Response): number | null {
	const header = response.headers.get("Retry-After");
	if (!header) return null;
	const seconds = Number(header);
	if (Number.isFinite(seconds) && seconds >= 0) {
		return Math.min(seconds * 1000, BACKOFF_CAP_MS);
	}
	const dateMs = Date.parse(header);
	if (Number.isFinite(dateMs)) {
		return Math.max(0, Math.min(dateMs - Date.now(), BACKOFF_CAP_MS));
	}
	return null;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
