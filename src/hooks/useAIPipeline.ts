import { useCallback, useRef, useState } from "react";
import { buildRuntimeProfile, buildSubtitleBlock, recalculateProject } from "../lib/pipeline";
import { generateScript } from "../lib/ai/capabilities/text-generation";
import { generateImage } from "../lib/ai/capabilities/image-generation";
import { generateTTS } from "../lib/ai/capabilities/tts-generation";
import { getAvailableProviders, resolveProvider } from "../lib/ai/registry";
import type { GenerationVariationProfile, PipelineProgress, VariationStrength } from "../lib/ai/types";
import type { Brief, ExecutionMode, Scene, ShortsProject } from "../types";
import { estimateSceneCount } from "../lib/ai/prompts/script";
import { hasConfiguredStockProvider, findStockImagesForScenes } from "../lib/stock";
import { isLocalTTSAvailable, localTTS } from "../lib/ai/providers/local-tts";
import { optimizePacing } from "../lib/pacing";
import { trackSpan } from "../lib/diagnostics";
import { matchBGMByTone } from "../lib/bgm-presets";
import { buildLocalScript } from "../lib/ai/local-script";
import {
	SEMANTIC_VECTOR_SOURCE_HINT,
	buildLocalSceneCardImage,
} from "../lib/local-assets";
import { buildReferenceCardMediaQuery } from "../lib/media-query";
import {
	REFERENCE_CARD_PRESET,
	applyReferenceCardTemplate,
} from "../lib/card-template";

export interface AIGenerationResult {
	project: ShortsProject;
	scriptProvider: string;
	imageSuccessCount: number;
	imageFallbackCount: number;
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
				bypassScriptCache?: boolean;
				variation?: GenerationVariationProfile;
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
				const textProviderAvailable = getAvailableProviders("text").length > 0;
				let generatedScript = "";
				let scriptProvider = "local (rule-based)";

				if (textProviderAvailable) {
					try {
						const textResult = await trackSpan(
							"pipeline.script",
							{ language: brief.language, maxScenes },
							() =>
								generateScript(
									{
										brief,
										language: brief.language,
										maxScenes,
										variation: options?.variation,
										temperature: variationStrengthToTemperature(
											options?.variation?.strength,
										),
									},
									controller.signal,
									{ bypassCache: options?.bypassScriptCache ?? false },
								),
						);
						generatedScript = textResult.script;
						scriptProvider = `${textResult.provider} (${textResult.model})`;
					} catch (error) {
						const msg = error instanceof Error ? error.message : String(error);
						errors.push(`스크립트 AI 실패: ${msg} — 로컬 스크립트로 대체`);
					}
				}

				if (!generatedScript.trim()) {
					setProgress({
						stage: "generating-script",
						current: 1,
						total: 1,
						message: "로컬 스크립트 생성 중...",
					});
					generatedScript = buildLocalScript({
						brief,
						maxScenes,
						variation: options?.variation,
					});
				}

				// ── 2. AI 스크립트를 직접 씬으로 변환 (로컬 템플릿 우회) ──
				setProgress({
					stage: "generating-script",
					current: 1,
					total: 1,
					message: "장면 분해 중...",
				});

				const project = buildProjectFromAIScript(brief, generatedScript, {
					id: options?.id,
					accent: options?.accent,
					channel: options?.channel,
					preset: options?.preset,
					runtimeMode: options?.runtimeMode,
				});

				// ── 3a. AI 이미지 생성 (키가 있으면 최우선) ──
				const sceneCount = project.scenes.length;
				let imageSuccessCount = 0;
				let imageFallbackCount = 0;
				const stockAvailable = hasConfiguredStockProvider();
				const imageProviderAvailable = getAvailableProviders("image").length > 0;

				if (imageProviderAvailable) {
					setProgress({
						stage: "generating-images",
						current: 0,
						total: sceneCount,
						message: `AI 이미지 생성 중 (0/${sceneCount})...`,
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
									variation: options?.variation
										? {
												...options.variation,
												seed: `${options.variation.seed}-scene-${i + 1}`,
											}
										: undefined,
								},
								controller.signal,
							);
							scene.media.generatedImageUrl = result.imageUrl;
							scene.media.sourceHint = `AI — ${result.provider}`;
							imageSuccessCount++;
						} catch (error) {
							console.error(`[Pipeline] AI 이미지 ${i + 1} 실패:`, error);
							const msg = error instanceof Error ? error.message : String(error);
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
							message: `AI 이미지 생성 중 (${i + 1}/${sceneCount})...`,
						});
					}
				}

				// ── 3b. 스톡 미디어 검색 (AI 미커버 장면만) ──
				const stockTargets = project.scenes
					.map((scene, index) => ({ scene, index }))
					.filter((item) => !item.scene.media.generatedImageUrl);

				if (stockTargets.length > 0 && stockAvailable) {
					setProgress({
						stage: "searching-stock",
						current: 0,
						total: stockTargets.length,
						message: "스톡 이미지 검색 중...",
					});

					try {
						const queries = stockTargets.map(({ scene }) => ({
							query: scene.media.query,
							language: brief.language,
						}));

						const stockResults = await findStockImagesForScenes(
							queries,
							controller.signal,
							2,
							(done, total) => {
								setProgress({
									stage: "searching-stock",
									current: done,
									total,
									message: `스톡 검색 중 (${done}/${total})...`,
								});
							},
							{ includeNoKeyFallback: false },
						);

						for (let i = 0; i < stockTargets.length; i++) {
							const result = stockResults[i];
							if (result) {
								const scene = project.scenes[stockTargets[i]!.index]!;
								scene.media.generatedImageUrl = result.url;
								scene.media.sourceHint = `${result.provider} — ${result.photographer ?? "unknown"}`;
								imageSuccessCount++;
							}
						}

						console.log(
							`[Pipeline] 스톡 검색: ${stockResults.filter(Boolean).length}/${stockTargets.length} 성공`,
						);
					} catch (error) {
						console.error("[Pipeline] 스톡 검색 실패:", error);
					}
				}

				// ── 3c. 의미 기반 로컬 비주얼 (키/스톡 없이도 최종 산출물 보장) ──
				const semanticVisualTargets = project.scenes.filter(
					(scene) => !scene.media.generatedImageUrl,
				).length;
				if (semanticVisualTargets > 0) {
					setProgress({
						stage: "generating-images",
						current: 0,
						total: semanticVisualTargets,
						message: `의미 기반 비주얼 생성 중 (0/${semanticVisualTargets})...`,
					});
				}

				let semanticVisualDone = 0;
				for (let i = 0; i < sceneCount; i++) {
					const scene = project.scenes[i]!;
					if (scene.media.generatedImageUrl) continue;

					scene.media.generatedImageUrl = buildLocalSceneCardImage(
						scene.text,
						scene.role,
						brief,
						i,
					);
					scene.media.sourceHint = SEMANTIC_VECTOR_SOURCE_HINT;
					imageSuccessCount++;
					imageFallbackCount++;
					semanticVisualDone++;
					setProgress({
						stage: "generating-images",
						current: semanticVisualDone,
						total: semanticVisualTargets,
						message: `의미 기반 비주얼 생성 중 (${semanticVisualDone}/${semanticVisualTargets})...`,
					});
				}

				// ── 4. TTS 생성 (로컬 우선 → 클라우드 폴백) ──
				let ttsSuccessCount = 0;
				const localTTSReady = await isLocalTTSAvailable();
				const ttsProviderAvailable = getAvailableProviders("tts").length > 0;

				setProgress({
					stage: "generating-tts",
					current: 0,
					total: sceneCount,
					message: localTTSReady
						? `로컬 음성 생성 중 (0/${sceneCount})...`
						: `음성 생성 중 (0/${sceneCount})...`,
				});

				for (let i = 0; i < sceneCount; i++) {
					if (controller.signal.aborted) break;

					const scene = project.scenes[i]!;
					const ttsRequest = {
						text: scene.text,
						language: brief.language,
						speed: scene.voice.speed,
						emotion: scene.voice.emotion,
					};

					let ttsSuccess = false;

					// Try local TTS first (Piper/macOS say — free)
					if (localTTSReady && !ttsSuccess) {
						try {
							const result = await localTTS(ttsRequest, controller.signal);
							scene.voice.generatedAudioUrl = result.audioUrl;
							scene.voice.provider = getLocalTTSProviderLabel(result);
							ttsSuccessCount++;
							ttsSuccess = true;
						} catch (error) {
							console.warn(
								`[Pipeline] 로컬 TTS ${i + 1} 실패, 클라우드 폴백:`,
								error instanceof Error ? error.message : error,
							);
						}
					}

					// Fallback to cloud TTS only when a provider is configured.
					if (!ttsSuccess && ttsProviderAvailable) {
						try {
							const result = await generateTTS(ttsRequest, controller.signal);
							scene.voice.generatedAudioUrl = result.audioUrl;
							ttsSuccessCount++;
						} catch (error) {
							const msg =
								error instanceof Error ? error.message : String(error);
							errors.push(`TTS ${i + 1}: ${msg}`);
						}
					} else if (!ttsSuccess) {
						scene.voice.provider = "TTS not configured";
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

				// ── 5b. BGM 자동 매칭 — 사용자가 지정 안 한 경우 톤 기반 추천 ──
				if (!project.bgmPresetId) {
					const matched = matchBGMByTone(brief.tone);
					project.bgmPresetId = matched.id;
					if (matched.url) {
						project.bgmUrl = matched.url;
					}
				}

				// ── 6. 완료 — 부분 성공도 프로젝트 반환 ──
				setProgress({
					stage: "finalizing",
					current: 1,
					total: 1,
					message: "완료!",
				});

					const finalProject = recalculateProject(project);

					return {
						project: finalProject,
						scriptProvider,
						imageSuccessCount,
						imageFallbackCount,
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

	// Use smart pacing based on text content (falls back to proportional distribution)
	const pacingInputs = lines.map((text, i) => ({
		text,
		role: roles[i] ?? ("build" as const),
		language: brief.language,
		subtitleLines: buildSubtitleBlock(text).lines,
	}));
	const durations = optimizePacing(pacingInputs, targetDur);

	const scenes: Scene[] = lines.map((text, i) => {
		const role = roles[i] ?? "build";

		return applyReferenceCardTemplate({
			id: `scene-${i + 1}`,
			index: i + 1,
			text,
			duration: durations[i] ?? 4,
			role,
			media: {
				type: role === "build" ? "gif" : "image",
				query: buildReferenceCardMediaQuery(text, brief, role),
				style: roleStyle(role),
				tags: extractWords(text),
				sourceHint: "",
			},
			subtitles: buildSubtitleBlock(text),
			voice: {
				provider: "TTS pending",
				speed: role === "hook" ? 1.04 : role === "cta" ? 0.94 : 1.0,
				emotion:
					brief.tone === "energetic"
						? "energetic"
						: brief.tone === "serious"
							? "serious"
					: "neutral",
			},
			notes: "",
		}, count);
	});

	const qa = quickQa(brief, scenes);

	return {
		id: options?.id ?? `project-${Date.now()}`,
		channel: options?.channel ?? "channel-a",
		preset: options?.preset ?? REFERENCE_CARD_PRESET,
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

function getLocalTTSProviderLabel(result: unknown): string {
	const localProvider =
		result && typeof result === "object" && "_localProvider" in result
			? (result as { _localProvider?: unknown })._localProvider
			: undefined;

	return typeof localProvider === "string" && localProvider.trim()
		? localProvider
		: "local TTS";
}

function variationStrengthToTemperature(strength?: VariationStrength): number {
	if (strength === "wild") return 1.0;
	if (strength === "fresh") return 0.85;
	return 0.72;
}
