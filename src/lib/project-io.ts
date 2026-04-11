import {
	buildRuntimeProfile,
	createProjectFromBrief,
	recalculateProject,
	refreshSceneFromText,
} from "./pipeline";
import type { Brief, ExecutionMode, Scene, ShortsProject } from "../types";

export interface ImportedBriefPayload {
	brief: Brief;
	script: string;
	runtimeMode: ExecutionMode;
}

export function parseBriefPayload(raw: unknown): ImportedBriefPayload {
	const record = asRecord(raw);
	const runtimeMode = unionField(
		asRecord(record.runtime).mode ?? record.executionMode,
		["local", "byo-api", "hybrid"],
		"local",
	);
	const brief: Brief = {
		id: stringField(record.id, `brief-${Date.now()}`),
		title: stringField(record.title, "새 숏츠 초안"),
		topic: stringField(record.topic, stringField(record.title, "새 주제")),
		intent: unionField(record.intent, ["info", "opinion", "story"], "info"),
		tone: unionField(
			record.tone,
			["neutral", "serious", "energetic", "urgent"],
			"serious",
		),
		targetDuration: numberField(record.targetDuration, 30),
		platform: unionField(
			record.platform,
			["youtube", "tiktok", "reels"],
			"youtube",
		),
		language: unionField(record.language, ["ko", "en"], "ko"),
		audience: stringField(
			record.audience,
			"의사결정 구조를 빠르게 공유하고 싶은 실무자",
		),
		thesis: stringField(
			record.thesis,
			"좋은 숏츠는 구조를 먼저 세우는 데서 시작됩니다.",
		),
	};

	const script = stringField(
		record.script,
		[
			brief.title,
			brief.thesis,
			"핵심 메시지를 문장 단위로 더 적어주세요.",
		].join("\n"),
	);

	return { brief, script, runtimeMode };
}

export function hydrateProject(raw: unknown): ShortsProject {
	const record = asRecord(raw);

	if ("brief" in record && "script" in record) {
		const briefPayload = parseBriefPayload(record.brief);
		const runtimeMode = unionField(
			asRecord(record.runtime).mode ?? record.executionMode,
			["local", "byo-api", "hybrid"],
			briefPayload.runtimeMode,
		);
		const base = createProjectFromBrief(
			briefPayload.brief,
			stringField(record.script, briefPayload.script),
			{
				id: stringField(record.id, `project-${Date.now()}`),
				channel: stringField(record.channel, "channel-a"),
				preset: stringField(record.preset, "기본"),
				accent: stringField(record.accent, "#f2b36f"),
				updatedAt: stringField(record.updatedAt, "방금"),
				runtime: hydrateRuntime(asRecord(record.runtime), runtimeMode),
			},
		);

		const scenes = Array.isArray(record.scenes)
			? record.scenes
					.map((sceneRaw, index) => hydrateScene(sceneRaw, index, base.brief))
					.filter((scene): scene is Scene => scene !== null)
			: [];

		if (!scenes.length) {
			return base;
		}

		return recalculateProject({
			...base,
			scenes,
			status: unionField(
				record.status,
				["editing", "review", "rendered", "failed"],
				base.status,
			),
		});
	}

	const payload = parseBriefPayload(record);
	return createProjectFromBrief(payload.brief, payload.script, {
		runtimeMode: payload.runtimeMode,
	});
}

export function hydrateProjects(raw: unknown): ShortsProject[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw
		.map((item) => {
			try {
				return hydrateProject(item);
			} catch {
				return null;
			}
		})
		.filter((project): project is ShortsProject => project !== null);
}

function hydrateScene(raw: unknown, index: number, brief: Brief): Scene | null {
	try {
		const record = asRecord(raw);
		const role = unionField(
			record.role,
			["hook", "build", "payoff", "cta"],
			index === 0 ? "hook" : "build",
		);

		const mediaRaw = asRecord(record.media);
		const voiceRaw = asRecord(record.voice);

		const refreshed = refreshSceneFromText(
			{
				id: stringField(record.id, `scene-${index + 1}`),
				index: numberField(record.index, index + 1),
				text: stringField(record.text, brief.thesis),
				duration: numberField(
					record.duration,
					Math.max(2.8, brief.targetDuration / 7),
				),
				role,
				media: {
					type: unionField(
						mediaRaw.type,
						["image", "gif", "video"],
						"image",
					),
					query: stringField(mediaRaw.query, brief.topic),
					style: stringField(mediaRaw.style, "editorial still"),
					tags: arrayOfStrings(mediaRaw.tags),
					sourceHint: stringField(
						mediaRaw.sourceHint,
						"editorial still",
					),
				},
				subtitles: {
					id: stringField(
						asRecord(record.subtitles).id,
						`subtitle-${index + 1}`,
					),
					lines: arrayOfStrings(asRecord(record.subtitles).lines).slice(0, 2),
					emphasis: arrayOfStrings(asRecord(record.subtitles).emphasis).slice(
						0,
						2,
					),
				},
				voice: {
					provider: stringField(
						voiceRaw.provider,
						"TTS placeholder",
					),
					speed: numberField(voiceRaw.speed, 1),
					emotion: unionField(
						voiceRaw.emotion,
						["neutral", "serious", "energetic"],
						"neutral",
					),
				},
				notes: stringField(record.notes, ""),
			},
			brief,
		);

		// P1 fix: AI 생성 에셋(이미지/오디오 URL)을 hydration 시 보존
		const savedImageUrl = stringField(mediaRaw.generatedImageUrl, "");
		const savedAudioUrl = stringField(voiceRaw.generatedAudioUrl, "");

		if (savedImageUrl) {
			refreshed.media.generatedImageUrl = savedImageUrl;
		}
		if (savedAudioUrl) {
			refreshed.voice.generatedAudioUrl = savedAudioUrl;
		}

		return refreshed;
	} catch {
		return null;
	}
}

function hydrateRuntime(
	raw: Record<string, unknown>,
	fallbackMode: ExecutionMode,
) {
	const defaults = buildRuntimeProfile(fallbackMode);

	return {
		mode: unionField(raw.mode, ["local", "byo-api", "hybrid"], defaults.mode),
		costModel: unionField(
			raw.costModel,
			["free-local", "user-api", "mixed"],
			defaults.costModel,
		),
		ffmpeg: unionField(raw.ffmpeg, ["bundled", "system"], defaults.ffmpeg),
		scriptProvider: stringField(raw.scriptProvider, defaults.scriptProvider),
		qaProvider: stringField(raw.qaProvider, defaults.qaProvider),
		ttsProvider: stringField(raw.ttsProvider, defaults.ttsProvider),
		mediaProvider: stringField(raw.mediaProvider, defaults.mediaProvider),
		install: arrayOfStrings(raw.install).length
			? arrayOfStrings(raw.install)
			: defaults.install,
	};
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value as Record<string, unknown>;
}

function stringField(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value : fallback;
}

function numberField(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function unionField<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fallback: T,
): T {
	return typeof value === "string" && allowed.includes(value as T)
		? (value as T)
		: fallback;
}

function arrayOfStrings(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}
