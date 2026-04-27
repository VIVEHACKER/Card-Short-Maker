import { resolveProvider } from "../registry";
import { withFallback } from "../fallback";
import { classifyError } from "../errors";
import { openaiTTS } from "../providers/openai";
import { googleTTS } from "../providers/google";
import { cacheKey, getCached, setCached } from "../cache";
import type { TTSRequest, TTSResponse } from "../types";

export async function generateTTS(
	request: TTSRequest,
	signal?: AbortSignal,
): Promise<TTSResponse> {
	const preferred = resolveProvider("tts");

	const key = cacheKey("tts", { request, preferred });
	const cached = getCached<TTSResponse>(key);
	if (cached && !cached.audioUrl.startsWith("blob:")) {
		return cached;
	}

	const response = await withFallback("tts", preferred, async (provider) => {
		try {
			switch (provider) {
				case "openai":
					return await openaiTTS(request, signal);
				case "google":
					return await googleTTS(request, signal);
				default:
					throw new Error(`${provider}는 TTS를 지원하지 않습니다.`);
			}
		} catch (error) {
			throw classifyError(provider, "tts", error);
		}
	});

	const memoryOnly = response.audioUrl.startsWith("blob:");
	setCached(key, response, { memoryOnly });
	return response;
}

/** 순차적으로 여러 TTS 생성 */
export async function generateAllTTS(
	requests: TTSRequest[],
	signal?: AbortSignal,
	onProgress?: (completed: number, total: number) => void,
): Promise<Array<TTSResponse | null>> {
	const results: Array<TTSResponse | null> = [];
	let firstError: unknown = null;

	for (let i = 0; i < requests.length; i++) {
		try {
			const result = await generateTTS(requests[i]!, signal);
			results.push(result);
		} catch (error) {
			if (!firstError) {
				firstError = error;
			}
			results.push(null);
		}
		onProgress?.(i + 1, requests.length);
	}

	if (requests.length > 0 && results.every((item) => item === null)) {
		throw (
			firstError ??
			new Error(
				"모든 장면의 음성 생성에 실패했습니다. TTS 프로바이더 설정과 API 키를 확인해 주세요.",
			)
		);
	}

	return results;
}
