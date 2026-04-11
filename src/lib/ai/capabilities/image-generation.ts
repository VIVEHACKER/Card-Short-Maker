import { resolveProvider } from "../registry";
import { withFallback } from "../fallback";
import { classifyError } from "../errors";
import { openaiGenerateImage } from "../providers/openai";
import { googleGenerateImage } from "../providers/google";
import type { ImageGenerationRequest, ImageGenerationResponse } from "../types";

export async function generateImage(
	request: ImageGenerationRequest,
	signal?: AbortSignal,
): Promise<ImageGenerationResponse> {
	const preferred = resolveProvider("image");

	return withFallback("image", preferred, async (provider) => {
		try {
			switch (provider) {
				case "openai":
					return await openaiGenerateImage(request, signal);
				case "google":
					return await googleGenerateImage(request, signal);
				default:
					throw new Error(`${provider}는 이미지 생성을 지원하지 않습니다.`);
			}
		} catch (error) {
			throw classifyError(provider, "image", error);
		}
	});
}

/** 여러 이미지를 동시에 생성 (최대 concurrency개 병렬) */
export async function generateImages(
	requests: ImageGenerationRequest[],
	signal?: AbortSignal,
	concurrency = 3,
	onProgress?: (completed: number, total: number) => void,
): Promise<Array<ImageGenerationResponse | null>> {
	const results: Array<ImageGenerationResponse | null> = new Array(
		requests.length,
	).fill(null);
	let completed = 0;
	let index = 0;
	let firstError: unknown = null;

	async function worker() {
		while (index < requests.length) {
			const currentIndex = index++;
			try {
				results[currentIndex] = await generateImage(
					requests[currentIndex]!,
					signal,
				);
			} catch (error) {
				if (!firstError) {
					firstError = error;
				}
				results[currentIndex] = null;
			}
			completed++;
			onProgress?.(completed, requests.length);
		}
	}

	const workers = Array.from(
		{ length: Math.min(concurrency, requests.length) },
		() => worker(),
	);
	await Promise.all(workers);

	if (requests.length > 0 && results.every((item) => item === null)) {
		throw (
			firstError ??
			new Error(
				"모든 장면의 이미지 생성에 실패했습니다. 이미지 프로바이더 설정과 API 키를 확인해 주세요.",
			)
		);
	}

	return results;
}
