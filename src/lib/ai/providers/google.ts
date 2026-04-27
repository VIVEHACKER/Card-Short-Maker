import { getApiKey } from "../config";
import { aiFetch } from "../fetch-utils";
import { GOOGLE_GENAI_BASE_URL, GOOGLE_TTS_BASE_URL } from "../endpoints";
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
import { base64ToBlob, estimateTtsDuration } from "./_helpers";

function apiKey(): string {
	return getApiKey("google");
}

// --- Text Generation ---

export async function googleGenerateText(
	request: TextGenerationRequest,
	signal?: AbortSignal,
): Promise<TextGenerationResponse> {
	const maxScenes = request.maxScenes ?? estimateSceneCount(request.brief);

	const response = await aiFetch({
		provider: "google",
		capability: "text",
		url: `${GOOGLE_GENAI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey()}`,
		body: {
			contents: [
				{
					role: "user",
					parts: [
						{
							text: `${buildScriptSystemPrompt(request.language)}\n\n${buildScriptUserPrompt(request.brief, maxScenes)}`,
						},
					],
				},
			],
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 1024,
			},
		},
		signal,
		timeoutMs: 30_000,
	});

	const data = (await response.json()) as {
		candidates: Array<{
			content: { parts: Array<{ text: string }> };
		}>;
	};
	const script =
		data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
	if (!hasUsableScript(script, maxScenes)) {
		throw new Error("Google이 품질 기준에 못 미치는 스크립트를 반환했습니다.");
	}

	return { script, provider: "google", model: "gemini-2.0-flash" };
}

// --- Image Generation ---

export async function googleGenerateImage(
	request: ImageGenerationRequest,
	signal?: AbortSignal,
): Promise<ImageGenerationResponse> {
	const prompt = buildImagePrompt(request);

	// Imagen 3 API 시도
	try {
		return await googleImagenGenerate(prompt, signal);
	} catch {
		// Imagen 실패 시 Gemini 이미지 생성 모델로 폴백
	}

	return googleGeminiImageGenerate(prompt, signal);
}

/** Imagen 3 via Gemini API */
async function googleImagenGenerate(
	prompt: string,
	signal?: AbortSignal,
): Promise<ImageGenerationResponse> {
	const response = await aiFetch({
		provider: "google",
		capability: "image",
		url: `${GOOGLE_GENAI_BASE_URL}/models/imagen-3.0-generate-002:predict?key=${apiKey()}`,
		body: {
			instances: [{ prompt }],
			parameters: {
				sampleCount: 1,
				aspectRatio: "9:16",
			},
		},
		signal,
		timeoutMs: 60_000,
	});

	const data = (await response.json()) as {
		predictions?: Array<{
			bytesBase64Encoded: string;
			mimeType: string;
		}>;
	};

	const prediction = data.predictions?.[0];
	if (!prediction?.bytesBase64Encoded) {
		throw new Error("Imagen API가 이미지를 반환하지 않았습니다.");
	}

	const blob = base64ToBlob(
		prediction.bytesBase64Encoded,
		prediction.mimeType || "image/png",
	);
	return { imageUrl: URL.createObjectURL(blob), provider: "google" };
}

/** Gemini 이미지 생성 모델 폴백 */
async function googleGeminiImageGenerate(
	prompt: string,
	signal?: AbortSignal,
): Promise<ImageGenerationResponse> {
	const response = await aiFetch({
		provider: "google",
		capability: "image",
		url: `${GOOGLE_GENAI_BASE_URL}/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey()}`,
		body: {
			contents: [
				{
					role: "user",
					parts: [
						{
							text: `Generate a vertical 9:16 image for a short-form video scene.\n\n${prompt}\n\nRespond with ONLY the image, no text.`,
						},
					],
				},
			],
			generationConfig: {
				responseModalities: ["IMAGE", "TEXT"],
			},
		},
		signal,
		timeoutMs: 60_000,
	});

	const data = (await response.json()) as {
		candidates: Array<{
			content: {
				parts: Array<{
					text?: string;
					inlineData?: { mimeType: string; data: string };
				}>;
			};
		}>;
	};

	const parts = data.candidates?.[0]?.content?.parts ?? [];
	const imagePart = parts.find((p) => p.inlineData);

	if (!imagePart?.inlineData) {
		throw new Error("Google API가 이미지를 생성하지 못했습니다.");
	}

	const blob = base64ToBlob(
		imagePart.inlineData.data,
		imagePart.inlineData.mimeType,
	);
	return { imageUrl: URL.createObjectURL(blob), provider: "google" };
}

// --- TTS ---

const VOICE_MAP: Record<string, Record<string, string>> = {
	ko: { neutral: "ko-KR-Standard-A", serious: "ko-KR-Standard-C", energetic: "ko-KR-Standard-D" },
	en: { neutral: "en-US-Standard-C", serious: "en-US-Standard-B", energetic: "en-US-Standard-D" },
};

export async function googleTTS(
	request: TTSRequest,
	signal?: AbortSignal,
): Promise<TTSResponse> {
	const voiceMap = VOICE_MAP[request.language] ?? VOICE_MAP.ko;
	const voiceName = voiceMap[request.emotion] ?? voiceMap.neutral;

	const response = await aiFetch({
		provider: "google",
		capability: "tts",
		url: `${GOOGLE_TTS_BASE_URL}/text:synthesize?key=${apiKey()}`,
		body: {
			input: { text: request.text },
			voice: {
				languageCode: request.language === "ko" ? "ko-KR" : "en-US",
				name: voiceName,
			},
			audioConfig: {
				audioEncoding: "MP3",
				speakingRate: Math.max(0.25, Math.min(4.0, request.speed)),
			},
		},
		signal,
		timeoutMs: 15_000,
	});

	const data = (await response.json()) as { audioContent: string };
	const blob = base64ToBlob(data.audioContent, "audio/mp3");
	const audioUrl = URL.createObjectURL(blob);

	return {
		audioUrl,
		durationSeconds: estimateTtsDuration(request.text, request.speed),
		provider: "google",
	};
}
