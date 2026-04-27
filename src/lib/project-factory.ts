import { createProjectFromBrief } from "./pipeline";
import { hydrateProjects } from "./project-io";
import { STORAGE_KEY_PROJECTS } from "./constants";
import type { Brief, ExecutionMode, ShortsProject } from "../types";

export function createEmptyBrief(): Brief {
	return {
		id: `brief-${Date.now()}`,
		title: "",
		topic: "",
		intent: "info",
		tone: "serious",
		targetDuration: 30,
		platform: "youtube",
		language: "ko",
		audience: "",
		thesis: "",
	};
}

export function createBlankProject(
	options?: Partial<
		Pick<
			ShortsProject,
			"id" | "channel" | "preset" | "accent" | "updatedAt" | "status"
		>
	> & {
		runtimeMode?: ExecutionMode;
	},
): ShortsProject {
	const brief = createEmptyBrief();
	return createProjectFromBrief(brief, "", {
		id: options?.id ?? `project-${Date.now()}`,
		channel: options?.channel ?? "channel-a",
		preset: options?.preset ?? "새 프로젝트",
		accent: options?.accent ?? "#f2b36f",
		runtimeMode: options?.runtimeMode ?? "local",
		updatedAt: options?.updatedAt ?? "방금",
		status: options?.status ?? "editing",
	});
}

export function loadProjectsFromStorage(): ShortsProject[] {
	const storage = safeLocalStorage();
	if (!storage) return [createBlankProject()];
	const raw = storage.getItem(STORAGE_KEY_PROJECTS);
	if (!raw) return [createBlankProject()];
	try {
		const parsed = hydrateProjects(JSON.parse(raw) as unknown);
		return parsed.length ? parsed : [createBlankProject()];
	} catch {
		return [createBlankProject()];
	}
}

function safeLocalStorage(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
}
