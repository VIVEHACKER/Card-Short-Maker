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

				if (!hasUsableScript(script, maxScenes)) {
					throw new Error("OpenAI가 품질 기준에 못 미치는 스크립트를 반환했습니다.");
				}

			return { script, provider: "openai", model };
		} catch (error) {
			lastError = error;
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
			const imageUrl = resolveImageUrl(item);

			return {
				imageUrl,
				revisedPrompt: item?.revised_prompt,
				provider: "openai",
			};
		} catch (error) {
			lastError = error;
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
		durationSeconds: estimateDuration(request.text, request.speed),
		provider: "openai",
	};
}

// --- Helpers ---

function base64ToBlob(b64: string, type: string): Blob {
	const bytes = atob(b64);
	const buffer = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) {
		buffer[i] = bytes.charCodeAt(i);
	}
	return new Blob([buffer], { type });
}

function resolveImageUrl(item: {
	b64_json?: string;
	b64?: string;
	url?: string;
} | null | undefined): string {
	if (item?.url) {
		return item.url;
	}

	const raw = item?.b64_json ?? item?.b64;
	if (raw) {
		const blob = base64ToBlob(raw, "image/png");
		return URL.createObjectURL(blob);
	}

	throw new Error("OpenAI 이미지 응답에서 결과를 찾지 못했습니다.");
}

function extractTextContent(
	content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
	if (typeof content === "string") {
		return content.trim();
	}

	if (Array.isArray(content)) {
		return content
			.filter((part) => part.type === "text" || part.text)
			.map((part) => part.text ?? "")
			.join("\n")
			.trim();
	}

	return "";
}

function estimateDuration(text: string, speed: number): number {
	// 대략 한국어 5자/초, 영어 3단어/초 기준
	const chars = text.replace(/\s+/g, "").length;
	return Math.max(1, chars / (5 * speed));
}
