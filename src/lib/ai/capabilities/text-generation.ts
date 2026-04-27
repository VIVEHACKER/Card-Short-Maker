import { resolveProvider } from "../registry";
import { withFallback } from "../fallback";
import { classifyError } from "../errors";
import { openaiGenerateText } from "../providers/openai";
import { googleGenerateText } from "../providers/google";
import { anthropicGenerateText } from "../providers/anthropic";
import { cacheKey, getCached, setCached } from "../cache";
import type { TextGenerationRequest, TextGenerationResponse } from "../types";

export async function generateScript(
	request: TextGenerationRequest,
	signal?: AbortSignal,
): Promise<TextGenerationResponse> {
	const preferred = resolveProvider("text");

	const key = cacheKey("text", { request, preferred });
	const cached = getCached<TextGenerationResponse>(key);
	if (cached) return cached;

	const response = await withFallback("text", preferred, async (provider) => {
		try {
			switch (provider) {
				case "openai":
					return await openaiGenerateText(request, signal);
				case "google":
					return await googleGenerateText(request, signal);
				case "anthropic":
					return await anthropicGenerateText(request, signal);
			}
		} catch (error) {
			throw classifyError(provider, "text", error);
		}
	});

	setCached(key, response);
	return response;
}
