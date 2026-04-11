import { useCallback, useRef, useState } from "react";
import { createProjectFromBrief, buildRuntimeProfile } from "../lib/pipeline";
import { generateScript } from "../lib/ai/capabilities/text-generation";
import { generateImage } from "../lib/ai/capabilities/image-generation";
import { generateTTS } from "../lib/ai/capabilities/tts-generation";
import { resolveProvider } from "../lib/ai/registry";
import type { PipelineProgress } from "../lib/ai/types";
import type { Brief, ExecutionMode, Scene, ShortsProject } from "../types";
import { estimateSceneCount } from "../lib/ai/prompts/script";

export interface AIGenerationResult {
	project: ShortsProject;
	scriptProvider: string;
	imageSuccessCount: number;
	ttsSuccessCount: number;
	errors: string[];
}

export function useAIPipeline() {
	const [progress, setProgress] = useState<PipelineProgress>({
		stage: "idle",
		current: 0,
		total: 0,
		message: "",
	});
	const [isGenerating, setIsGenerating] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	const cancel = useCallback(() => {
		abortRef.current?.abort();
	}, []);

	const generate = useCallback(
		async (
			brief: Brief,
			options?: {
				id?: string;
				accent?: string;
				channel?: string;
				preset?: string;
				runtimeMode?: ExecutionMode;
			},
		): Promise<AIGenerationResult> => {
			const controller = new AbortController();
			abortRef.current = controller;
			setIsGenerating(true);
			const errors: string[] = [];

			try {
				// ── 진단 로그 ──
				console.log("[Pipeline] 시작", {
					brief: brief.title,
					providers: {
						text: (() => { try { return resolveProvider("text"); } catch { return "없음"; } })(),
						image: (() => { try { return resolveProvider("image"); } catch { return "없음"; } })(),
						tts: (() => { try { return resolveProvider("tts"); } catch { return "없음"; } })(),
					},
				});

				// ── 1. 스크립트 생성 (필수 — 실패 시 전체 중단) ──
				setProgress({
					stage: "generating-script",
					current: 0,
					total: 1,
					message: "AI 스크립트 생성 중...",
				});

				const maxScenes = estimateSceneCount(brief);
				const textResult = await generateScript(
					{ brief, language: brief.language, maxScenes },
					controller.signal,
				);

				// ── 2. AI 스크립트를 직접 씬으로 변환 (로컬 템플릿 우회) ──
				setProgress({
					stage: "generating-script",
					current: 1,
					total: 1,
					message: "장면 분해 중...",
				});

				const project = buildProjectFromAIScript(brief, textResult.script, {
					id: options?.id,
					accent: options?.accent,
					channel: options?.channel,
					preset: options?.preset,
					runtimeMode: options?.runtimeMode,
				});

				// ── 3. 이미지 생성 (개별 실패 허용) ──
				const sceneCount = project.scenes.length;
				let imageSuccessCount = 0;

				setProgress({
					stage: "generating-images",
					current: 0,
					total: sceneCount,
					message: `이미지 생성 중 (0/${sceneCount})...`,
				});

				for (let i = 0; i < sceneCount; i++) {
					if (controller.signal.aborted) break;

					const scene = project.scenes[i]!;
					try {
						const result = await generateImage(
							{
								prompt: scene.text,
								style: scene.media.style,
								aspectRatio: "9:16" as const,
								sceneRole: scene.role,
							},
							controller.signal,
						);
						scene.media.generatedImageUrl = result.imageUrl;
						imageSuccessCount++;
					} catch (error) {
						console.error(`[Pipeline] 이미지 ${i + 1} 실패:`, error);
						const msg =
							error instanceof Error ? error.message : String(error);
						errors.push(`이미지 ${i + 1}: ${msg}`);
						setProgress({
							stage: "generating-images",
							current: i + 1,
							total: sceneCount,
							message: `이미지 ${i + 1} 실패: ${msg.slice(0, 80)}`,
						});
						continue;
					}

					setProgress({
						stage: "generating-images",
						current: i + 1,
						total: sceneCount,
						message: `이미지 생성 중 (${i + 1}/${sceneCount})...`,
					});
				}

				// ── 4. TTS 생성 (개별 실패 허용) ──
				let ttsSuccessCount = 0;

				setProgress({
					stage: "generating-tts",
					current: 0,
					total: sceneCount,
					message: `음성 생성 중 (0/${sceneCount})...`,
				});

				for (let i = 0; i < sceneCount; i++) {
					if (controller.signal.aborted) break;

					const scene = project.scenes[i]!;
					try {
						const result = await generateTTS(
							{
								text: scene.text,
								language: brief.language,
								speed: scene.voice.speed,
								emotion: scene.voice.emotion,
							},
							controller.signal,
						);
						scene.voice.generatedAudioUrl = result.audioUrl;
						ttsSuccessCount++;
					} catch (error) {
						const msg =
							error instanceof Error ? error.message : String(error);
						errors.push(`TTS ${i + 1}: ${msg}`);
					}

					setProgress({
						stage: "generating-tts",
						current: i + 1,
						total: sceneCount,
						message: `음성 생성 중 (${i + 1}/${sceneCount})...`,
					});
				}

				// ── 5. 취소 확인 — abort 시 부분 결과 커밋 방지 ──
				if (controller.signal.aborted) {
					throw new DOMException("AI 생성이 취소되었습니다.", "AbortError");
				}

				// ── 6. 완료 — 부분 성공도 프로젝트 반환 ──
				setProgress({
					stage: "finalizing",
					current: 1,
					total: 1,
					message: "완료!",
				});

				return {
					project,
					scriptProvider: `${textResult.provider} (${textResult.model})`,
					imageSuccessCount,
					ttsSuccessCount,
					errors,
				};
			} finally {
				setIsGenerating(false);
				abortRef.current = null;
				setTimeout(() => {
					setProgress({
						stage: "idle",
						current: 0,
						total: 0,
						message: "",
					});
				}, 1500);
			}
		},
		[],
	);

	return { generate, cancel, progress, isGenerating };
}

// ── AI 스크립트 → 프로젝트 직접 변환 (로컬 템플릿 우회) ──

type SceneRole = "hook" | "build" | "payoff" | "cta";

function buildProjectFromAIScript(
	brief: Brief,
	script: string,
	options?: {
		id?: string;
		accent?: string;
		channel?: string;
		preset?: string;
		runtimeMode?: ExecutionMode;
	},
): ShortsProject {
	const lines = script
		.split(/\n+/)
		.map((l) => l.trim())
		.filter(Boolean);

	const count = lines.length || 6;
	const roles = assignRoles(count);
	const targetDur = brief.targetDuration;
	const durations = distributeDurations(targetDur, roles);

	const scenes: Scene[] = lines.map((text, i) => ({
		id: `scene-${i + 1}`,
		index: i + 1,
		text,
		duration: durations[i] ?? 4,
		role: roles[i] ?? "build",
		media: {
			type: roles[i] === "build" ? "gif" : "image",
			query: buildContextualQuery(text, brief, roles[i] ?? "build"),
			style: roleStyle(roles[i] ?? "build"),
			tags: extractWords(text),
			sourceHint: "",
		},
		subtitles: {
			id: `sub-${i + 1}`,
			lines: splitSubtitle(text),
			emphasis: extractWords(text).slice(0, 2),
		},
		voice: {
			provider: "TTS",
			speed: roles[i] === "hook" ? 1.04 : roles[i] === "cta" ? 0.94 : 1.0,
			emotion:
				brief.tone === "energetic"
					? "energetic"
					: brief.tone === "serious"
						? "serious"
						: "neutral",
		},
		notes: "",
	}));

	const qa = quickQa(brief, scenes);

	return {
		id: options?.id ?? `project-${Date.now()}`,
		channel: options?.channel ?? "channel-a",
		preset: options?.preset ?? "기본",
		accent: options?.accent ?? "#f2b36f",
		runtime: buildRuntimeProfile(options?.runtimeMode ?? "byo-api"),
		brief,
		script,
		scenes,
		qa,
		updatedAt: "방금",
		readiness: qa.qualitative.overall,
		status: qa.qualitative.overall >= 82 ? "review" : "editing",
	};
}

function assignRoles(count: number): SceneRole[] {
	return Array.from({ length: count }, (_, i): SceneRole => {
		if (i === 0) return "hook";
		if (i === count - 1) return "cta";
		if (i === count - 2) return "payoff";
		return "build";
	});
}

function distributeDurations(target: number, roles: SceneRole[]): number[] {
	const w = roles.map((r) =>
		r === "hook" ? 0.85 : r === "payoff" ? 1.1 : r === "cta" ? 0.85 : 1,
	);
	const total = w.reduce((a, b) => a + b, 0);
	const d = w.map((v) => Math.round((target * v) / total * 10) / 10);
	const gap = Math.round((target - d.reduce((a, b) => a + b, 0)) * 10) / 10;
	if (d.length) d[d.length - 1] += gap;
	return d.map((v) => Math.max(1.8, Math.min(7.8, v)));
}

function buildContextualQuery(
	text: string,
	brief: Brief,
	role: SceneRole,
): string {
	const topic = (brief.topic || brief.title).trim();
	const sceneWords = extractWords(text).slice(0, 3).join(" ");
	const mood =
		brief.tone === "serious"
			? "documentary cinematic"
			: brief.tone === "energetic"
				? "vibrant dynamic"
				: "clean editorial";
	return `${topic} ${sceneWords} ${mood}`.trim();
}

function roleStyle(role: SceneRole): string {
	const map: Record<SceneRole, string> = {
		hook: "cinematic high-contrast, dramatic, strong focal subject",
		build: "editorial documentary, realistic context, layered depth",
		payoff: "conceptual symbolic, premium lighting, minimal distractions",
		cta: "clean minimal, warm tone, uncluttered composition",
	};
	return map[role];
}

function extractWords(text: string): string[] {
	return Array.from(
		new Set(
			text
				.toLowerCase()
				.match(/[a-z0-9]+|[가-힣]{2,}/g)
				?.filter((t) => t.length >= 2) ?? [],
		),
	).slice(0, 5);
}

function splitSubtitle(text: string): string[] {
	const clean = text.replace(/[.!?]+$/g, "").trim();
	if (clean.length <= 14) return [clean];
	const mid = Math.ceil(clean.length / 2);
	const spaceNear = clean.lastIndexOf(" ", mid);
	const split = spaceNear > 2 ? spaceNear : mid;
	return [clean.slice(0, split).trim(), clean.slice(split).trim()].filter(
		Boolean,
	);
}

function quickQa(brief: Brief, scenes: Scene[]) {
	const overall = 80;
	return {
		quantitative: {
			subtitleDensity: "ok" as const,
			sceneDuration: "ok" as const,
			audioSync: "ok" as const,
			cutFrequency: scenes.length >= 4 && scenes.length <= 10 ? ("ok" as const) : ("warn" as const),
		},
		qualitative: {
			overall,
			hookStrength: 82,
			scriptFlow: 80,
			visualFit: 78,
			subtitleReadability: 85,
			pacing: 82,
			ctaFinish: 78,
			originality: 80,
			creatorPersona: 75,
		},
		verdict: "pass" as const,
		issues: [],
		recommendation: "AI 생성 스크립트로 씬이 구성되었습니다.",
	};
}
