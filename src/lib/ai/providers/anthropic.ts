import { getApiKey } from "../config";
import { aiFetch } from "../fetch-utils";
import { ANTHROPIC_BASE_URL } from "../endpoints";
import type { TextGenerationRequest, TextGenerationResponse } from "../types";
import {
	buildScriptSystemPrompt,
	buildScriptUserPrompt,
	estimateSceneCount,
} from "../prompts/script";
import { hasUsableScript } from "../text-quality";
import { extractTextContent } from "./_helpers";

function headers(): Record<string, string> {
	return {
		"x-api-key": getApiKey("anthropic"),
		"anthropic-version": "2023-06-01",
		"anthropic-dangerous-direct-browser-access": "true",
	};
}

// --- Text Generation (유일한 기능) ---

export async function anthropicGenerateText(
	request: TextGenerationRequest,
	signal?: AbortSignal,
): Promise<TextGenerationResponse> {
	const maxScenes = request.maxScenes ?? estimateSceneCount(request.brief);

	const response = await aiFetch({
		provider: "anthropic",
		capability: "text",
		url: `${ANTHROPIC_BASE_URL}/messages`,
		headers: headers(),
		body: {
			model: "claude-sonnet-4-20250514",
			max_tokens: 1024,
			temperature: request.temperature ?? 0.7,
			system: buildScriptSystemPrompt(request.language),
			messages: [
				{
					role: "user",
					content: buildScriptUserPrompt(
						request.brief,
						maxScenes,
						request.variation,
					),
				},
			],
		},
		signal,
		timeoutMs: 30_000,
	});

	const data = (await response.json()) as {
		content: Array<{ type: string; text: string }>;
	};
	const script = extractTextContent(data.content);
	if (!script) {
		throw new Error(
			"Anthropic 응답에 텍스트 part가 없습니다 (tool_use 등 비텍스트 응답 가능).",
		);
	}
	if (!hasUsableScript(script, maxScenes)) {
		throw new Error("Anthropic이 품질 기준에 못 미치는 스크립트를 반환했습니다.");
	}

	return { script, provider: "anthropic", model: "claude-sonnet-4-20250514" };
}
