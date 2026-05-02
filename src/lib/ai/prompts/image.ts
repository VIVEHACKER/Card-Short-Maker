import type { ImageGenerationRequest } from "../types";

const ROLE_STYLE_HINTS: Record<string, string> = {
	hook: "high-contrast cinematic frame, dramatic depth, strong focal subject, eye-catching",
	build: "editorial documentary visual, realistic context, information-rich framing",
	payoff: "symbolic conceptual visual, premium lighting, aha-moment feeling",
	cta: "clean inviting frame, warm tone, forward-looking energy",
};

export function buildImagePrompt(request: ImageGenerationRequest): string {
	const roleHint = ROLE_STYLE_HINTS[request.sceneRole] ?? ROLE_STYLE_HINTS.build;
	const variationLines = buildVariationLines(request);

	return [
		"Create a premium vertical 9:16 image for a short-form video scene.",
		"",
		`Scene narration: "${request.prompt}"`,
		`Scene style: ${request.style}`,
		`Visual mood: ${roleHint}`,
		...variationLines,
		"",
		"The image must visually represent the narration above.",
		"Focus on the subject/emotion/action described in the narration.",
		"This image will sit under a fixed card-shorts template: a large headline card in the center and two subtitle chips near the bottom.",
		"",
		"Requirements:",
		"- No text, watermarks, logos, UI elements, or subtitles",
		"- Keep the central and lower-third areas readable for overlays",
		"- Place important detail toward the upper third or edges so the text card does not hide the meaning",
		"- Professional quality, editorial aesthetic",
		"- Avoid generic stock-photo symbolism; use a concrete visual metaphor for this exact scene",
		"- Vertical composition for mobile viewing",
		"- The image should feel like it belongs to THIS specific scene, not a generic stock photo",
	].join("\n");
}

function buildVariationLines(request: ImageGenerationRequest): string[] {
	if (!request.variation) return [];

	const strengthLine =
		request.variation.strength === "wild"
			? "Variation mode: WILD. Use a clearly different composition, camera angle, and color mood from prior attempts."
			: request.variation.strength === "fresh"
				? "Variation mode: FRESH. Keep the same meaning, but change framing and visual metaphor from prior attempts."
				: "Variation mode: BALANCED. Keep the core meaning, but avoid repeating prior composition choices.";

	return [
		`Variation run: attempt ${request.variation.attempt}, seed ${request.variation.seed}.`,
		strengthLine,
	];
}
