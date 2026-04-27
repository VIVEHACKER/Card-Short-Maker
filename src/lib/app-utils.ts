import type { Brief, ExecutionMode, ShortsProject } from "../types";

export function slugify(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-");
}

export function normalizeForDiff(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

export function downloadText(filename: string, content: string, mime: string): void {
	const blob = new Blob([content], { type: mime });
	downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
	const url = window.URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	window.URL.revokeObjectURL(url);
}

/** Returns blob URLs referenced by a project list — used to revoke stale ObjectURLs. */
export function collectProjectObjectUrls(projects: ShortsProject[]): Set<string> {
	const urls = new Set<string>();
	for (const project of projects) {
		for (const scene of project.scenes) {
			if (scene.media.generatedImageUrl?.startsWith("blob:")) {
				urls.add(scene.media.generatedImageUrl);
			}
			if (scene.voice.generatedAudioUrl?.startsWith("blob:")) {
				urls.add(scene.voice.generatedAudioUrl);
			}
		}
	}
	return urls;
}

/** Whether the user has unsaved draft edits that should not be auto-overwritten. */
export function hasPendingDraftEdits(
	activeProject: ShortsProject,
	draftBrief: Brief,
	draftScript: string,
	draftMode: ExecutionMode,
): boolean {
	return (
		draftScript.trim() !== activeProject.script.trim() ||
		draftMode !== activeProject.runtime.mode ||
		draftBrief.topic !== activeProject.brief.topic ||
		draftBrief.intent !== activeProject.brief.intent ||
		draftBrief.tone !== activeProject.brief.tone ||
		draftBrief.targetDuration !== activeProject.brief.targetDuration ||
		draftBrief.platform !== activeProject.brief.platform ||
		draftBrief.audience !== activeProject.brief.audience ||
		draftBrief.thesis !== activeProject.brief.thesis
	);
}
