import type { ImageGenerationRequest } from "../types";

const ROLE_STYLE_HINTS: Record<string, string> = {
	hook: "high-contrast cinematic frame, dramatic depth, strong focal subject, eye-catching",
	build: "editorial documentary visual, realistic context, information-rich framing",
	payoff: "symbolic conceptual visual, premium lighting, aha-moment feeling",
	cta: "clean inviting frame, warm tone, forward-looking energy",
};

export function buildImagePrompt(request: ImageGenerationRequest): string {
	const roleHint = ROLE_STYLE_HINTS[request.sceneRole] ?? ROLE_STYLE_HINTS.build;

	return [
		"Create a premium vertical 9:16 image for a short-form video scene.",
		"",
		`Scene narration: "${request.prompt}"`,
		`Visual mood: ${roleHint}`,
		"",
		"The image must visually represent the narration above.",
		"Focus on the subject/emotion/action described in the narration.",
		"",
		"Requirements:",
		"- No text, watermarks, logos, UI elements, or subtitles",
		"- Suitable as a background for text overlay (readable negative space)",
		"- Professional quality, editorial aesthetic",
		"- Vertical composition for mobile viewing",
		"- The image should feel like it belongs to THIS specific scene, not a generic stock photo",
	].join("\n");
}
