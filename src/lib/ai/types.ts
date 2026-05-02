import type { Brief, Language, SceneRole, VoiceSpec } from "../../types";

// --- Provider Identity ---
export type AIProviderName = "openai" | "google" | "anthropic";
export type AICapability = "text" | "image" | "tts";

// --- Configuration ---
export interface AIProviderConfig {
	apiKey: string;
	enabled: boolean;
}

export interface AISettings {
	providers: Record<AIProviderName, AIProviderConfig>;
	textProvider: AIProviderName;
	imageProvider: AIProviderName | "auto";
	ttsProvider: AIProviderName | "auto";
}

export type VariationStrength = "balanced" | "fresh" | "wild";

export interface GenerationVariationProfile {
	seed: string;
	attempt: number;
	strength: VariationStrength;
}

// --- Text Generation ---
export interface TextGenerationRequest {
	brief: Brief;
	language: Language;
	maxScenes?: number;
	variation?: GenerationVariationProfile;
	temperature?: number;
}

export interface TextGenerationResponse {
	script: string;
	provider: AIProviderName;
	model: string;
}

// --- Image Generation ---
export interface ImageGenerationRequest {
	prompt: string;
	style: string;
	aspectRatio: "9:16";
	sceneRole: SceneRole;
	variation?: GenerationVariationProfile;
}

export interface ImageGenerationResponse {
	imageUrl: string;
	revisedPrompt?: string;
	provider: AIProviderName;
}

// --- TTS Generation ---
export interface TTSRequest {
	text: string;
	language: Language;
	speed: number;
	emotion: VoiceSpec["emotion"];
}

export interface TTSResponse {
	audioUrl: string;
	durationSeconds: number;
	provider: AIProviderName;
}

// --- Pipeline Progress ---
export type PipelineStage =
	| "idle"
	| "generating-script"
	| "searching-stock"
	| "generating-images"
	| "generating-tts"
	| "finalizing";

export interface PipelineProgress {
	stage: PipelineStage;
	current: number;
	total: number;
	message: string;
}

// --- Capability Matrix ---
export const PROVIDER_CAPABILITIES: Record<
	AIProviderName,
	Record<AICapability, boolean>
> = {
	openai: { text: true, image: true, tts: true },
	google: { text: true, image: true, tts: true },
	anthropic: { text: true, image: false, tts: false },
};

export const PROVIDER_LABELS: Record<AIProviderName, string> = {
	openai: "OpenAI GPT-4o",
	google: "Google Gemini",
	anthropic: "Anthropic Claude",
};
