import type { ShortsProject } from "../types";

export interface ProjectMetrics {
	sceneCount: number;
	totalDuration: number;
	averageSceneDuration: number;
	totalSubtitleChars: number;
	subtitleCharsPerSecond: number;
	rolesBreakdown: Record<string, number>;
	mediaSourceBreakdown: Record<string, number>;
	hasVoiceCount: number;
	hasMediaCount: number;
}

export function computeProjectMetrics(project: ShortsProject): ProjectMetrics {
	const scenes = project.scenes;
	const sceneCount = scenes.length;
	const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

	const rolesBreakdown: Record<string, number> = {};
	const mediaSourceBreakdown: Record<string, number> = {};

	let totalSubtitleChars = 0;
	let hasVoiceCount = 0;
	let hasMediaCount = 0;

	for (const scene of scenes) {
		rolesBreakdown[scene.role] = (rolesBreakdown[scene.role] ?? 0) + 1;
		const subtitleChars = scene.subtitles.lines.join("").replace(/\s+/g, "").length;
		totalSubtitleChars += subtitleChars;
		if (scene.voice.generatedAudioUrl) hasVoiceCount++;
		if (scene.media.generatedImageUrl) hasMediaCount++;

		const sourceKey = sourceCategory(scene.media.sourceHint);
		mediaSourceBreakdown[sourceKey] = (mediaSourceBreakdown[sourceKey] ?? 0) + 1;
	}

	return {
		sceneCount,
		totalDuration: roundTo(totalDuration, 1),
		averageSceneDuration: sceneCount === 0 ? 0 : roundTo(totalDuration / sceneCount, 1),
		totalSubtitleChars,
		subtitleCharsPerSecond:
			totalDuration === 0 ? 0 : roundTo(totalSubtitleChars / totalDuration, 2),
		rolesBreakdown,
		mediaSourceBreakdown,
		hasVoiceCount,
		hasMediaCount,
	};
}

function sourceCategory(hint: string): string {
	const value = hint.toLowerCase();
	if (!value) return "none";
	if (value.includes("ai")) return "ai";
	if (value.includes("pexels")) return "pexels";
	if (value.includes("pixabay")) return "pixabay";
	return "other";
}

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
