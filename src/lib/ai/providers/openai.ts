import { getApiKey } from "../config";
import { aiFetch, aiFetchBlob } from "../fetch-utils";
import { OPENAI_BASE_URL } from "../endpoints";
import type {
	ImageGenerationRequest,
	ImageGenerationResponse,
	TTSRequest,
	TTSResponse,
	TextGenerationRequest,
	TextGenerationResponse,
} from "../types";
import {
	buildScriptSystemPrompt,
	buildScriptUserPrompt,
	estimateSceneCount,
} from "../prompts/script";
import { buildImagePrompt } from "../prompts/image";
import { hasUsableScript } from "../text-quality";
import {
	estimateTtsDuration,
	extractTextContent,
	resolveImageUrlFromItem,
} from "./_helpers";
import { AIAuthError, AIKeyMissingError } from "../errors";

/** Auth/quota errors should not waste time falling back to the next model. */
function isNonRetryableAuthError(error: unknown): boolean {
	return error instanceof AIAuthError || error instanceof AIKeyMissingError;
}

function headers(): Record<string, string> {
	return {
		Authorization: `Bearer ${getApiKey("openai")}`,
	};
}

// --- Text Generation ---

export async function openaiGenerateText(
	request: TextGenerationRequest,
	signal?: AbortSignal,
): Promise<TextGenerationResponse> {
	const maxScenes = request.maxScenes ?? estimateSceneCount(request.brief);
	const modelCandidates = ["gpt-4o", "gpt-4o-mini"] as const;
	let lastError: unknown = null;

	for (const model of modelCandidates) {
		try {
			const response = await aiFetch({
				provider: "openai",
				capability: "text",
				url: `${OPENAI_BASE_URL}/chat/completions`,
				headers: headers(),
				body: {
					model,
					messages: [
						{
							role: "system",
							content: buildScriptSystemPrompt(request.language),
						},
						{
							role: "user",
							content: buildScriptUserPrompt(request.brief, maxScenes),
						},
					],
					max_tokens: 1024,
					temperature: 0.7,
				},
				signal,
				timeoutMs: 30_000,
			});

			const data = (await response.json()) as {
				choices: Array<{
					message: {
						content:
							| string
							| Array<{ type?: string; text?: string }>;
					};
				}>;
			};
			const script = extractTextContent(data.choices[0]?.message.content);

			if (!script) {
				throw new Error("OpenAI 응답에 텍스트 part가 없습니다 (tool_calls 등 비텍스트 응답 가능).");
			}
			if (!hasUsableScript(script, maxScenes)) {
				throw new Error("OpenAI가 품질 기준에 못 미치는 스크립트를 반환했습니다.");
			}

			return { script, provider: "openai", model };
		} catch (error) {
			lastError = error;
			if (isNonRetryableAuthError(error)) throw error;
		}
	}

	throw lastError ?? new Error("OpenAI 스크립트 생성에 실패했습니다.");
}

// --- Image Generation ---

export async function openaiGenerateImage(
	request: ImageGenerationRequest,
	signal?: AbortSignal,
): Promise<ImageGenerationResponse> {
	const prompt = buildImagePrompt(request);
	const models = ["gpt-image-1", "dall-e-3"] as const;
	let lastError: unknown = null;

	for (const model of models) {
		try {
			const body: Record<string, unknown> =
				model === "gpt-image-1"
					? { model, prompt, n: 1, size: "1024x1536" }
					: {
							model,
							prompt,
							n: 1,
							size: "1024x1792",
							quality: "standard",
							response_format: "b64_json",
						};

			const response = await aiFetch({
				provider: "openai",
				capability: "image",
				url: `${OPENAI_BASE_URL}/images/generations`,
				headers: headers(),
				body,
				signal,
				timeoutMs: 90_000,
			});

			const data = (await response.json()) as {
				data: Array<{
					b64_json?: string;
					b64?: string;
					url?: string;
					revised_prompt?: string;
				}>;
			};
			const item = data.data[0];
			const imageUrl = resolveImageUrlFromItem(item);

			return {
				imageUrl,
				revisedPrompt: item?.revised_prompt,
				provider: "openai",
			};
		} catch (error) {
			lastError = error;
			if (isNonRetryableAuthError(error)) throw error;
		}
	}

	throw lastError ?? new Error("OpenAI 이미지 생성에 실패했습니다.");
}

// --- TTS ---

const VOICE_MAP: Record<string, string> = {
	neutral: "alloy",
	serious: "onyx",
	energetic: "nova",
};

export async function openaiTTS(
	request: TTSRequest,
	signal?: AbortSignal,
): Promise<TTSResponse> {
	const voice = VOICE_MAP[request.emotion] ?? "alloy";

	const audioUrl = await aiFetchBlob({
		provider: "openai",
		capability: "tts",
		url: `${OPENAI_BASE_URL}/audio/speech`,
		headers: headers(),
		body: {
			model: "tts-1",
			input: request.text,
			voice,
			speed: Math.max(0.25, Math.min(4.0, request.speed)),
			response_format: "mp3",
		},
		signal,
		timeoutMs: 15_000,
	});

	return {
		audioUrl,
		durationSeconds: estimateTtsDuration(request.text, request.speed),
		provider: "openai",
	};
}
