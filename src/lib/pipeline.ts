import type {
  Brief,
  ExecutionMode,
  MediaSpec,
  QaReport,
  QualitativeQa,
  RenderManifest,
  RuntimeProfile,
  Scene,
  SceneRole,
  ShortsProject,
  SubtitleBlock,
  VoiceSpec,
} from "../types";

const STOPWORDS = new Set([
  "그리고",
  "하지만",
  "그래서",
  "정말",
  "진짜",
  "이번에",
  "그냥",
  "이유",
  "대한",
  "문제",
  "구조",
  "사람",
  "작업",
  "자동",
  "도입",
  "결국",
  "핵심",
  "이건",
  "합니다",
  "하는",
  "하게",
  "있는",
  "없던",
  "없애는",
  "where",
  "that",
  "with",
  "into",
  "from",
]);

const CTA_LIBRARY = [
  "이 기준부터 바꾸면 숏츠가 달라집니다.",
  "이 구조를 먼저 설계하는 팀이 결국 이깁니다.",
  "속도보다 판단 구조를 먼저 바꿔야 합니다.",
  "좋은 숏츠는 편집보다 구조에서 시작됩니다.",
];

const ROLE_NOTE: Record<SceneRole, string> = {
  hook: "첫 3초 안에 문제의식이나 반전을 드러내세요.",
  build: "정보를 한 번에 하나씩만 전달해야 이탈이 줄어듭니다.",
  payoff: "이 장면은 해설이 아니라 통찰이 되어야 합니다.",
  cta: "행동 유도는 판매보다 기준 제안에 가깝게 마무리하세요.",
};

export function createProjectFromBrief(
  brief: Brief,
  script: string,
  options?: Partial<Pick<ShortsProject, "id" | "channel" | "preset" | "accent" | "updatedAt" | "status" | "runtime">> & {
    runtimeMode?: ExecutionMode;
  },
): ShortsProject {
  const scenes = buildScenes(brief, script);
  const qa = buildQaReport(brief, scenes);
  const readiness = computeReadiness(qa);

  return {
    id: options?.id ?? `project-${Date.now()}`,
    channel: options?.channel ?? "channel-a",
    preset: options?.preset ?? "기본",
    accent: options?.accent ?? "#f2b36f",
    runtime: options?.runtime ?? buildRuntimeProfile(options?.runtimeMode ?? "local"),
    brief,
    script,
    scenes,
    qa,
    updatedAt: options?.updatedAt ?? "방금",
    readiness,
    status: options?.status ?? deriveStatus(readiness),
  };
}

export function recalculateProject(project: ShortsProject): ShortsProject {
  const qa = buildQaReport(project.brief, project.scenes);
  const readiness = computeReadiness(qa);

  return {
    ...project,
    qa,
    readiness,
    status: deriveStatus(readiness),
    updatedAt: "방금",
  };
}

export function updateProjectRuntimeMode(project: ShortsProject, mode: ExecutionMode): ShortsProject {
  return {
    ...project,
    runtime: buildRuntimeProfile(mode),
    updatedAt: "방금",
  };
}

export function refreshSceneFromText(scene: Scene, brief: Brief): Scene {
  return {
    ...scene,
    media: buildMediaSpec(scene.text, brief, scene.role),
    subtitles: buildSubtitleBlock(scene.text),
    voice: buildVoiceSpec(brief, scene.role),
    notes: scene.notes?.trim() || ROLE_NOTE[scene.role],
  };
}

export function addSceneAfter(project: ShortsProject, sceneId: string): ShortsProject {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) {
    return project;
  }

  const current = project.scenes[index];
  const role = index >= project.scenes.length - 2 ? "build" : current.role;
  const inserted = createScene(project.brief, {
    id: `scene-${Date.now()}`,
    index: index + 2,
    text: role === "build" ? current.text : project.brief.thesis,
    duration: clampDuration(current.duration),
    role,
  });

  const scenes = [
    ...project.scenes.slice(0, index + 1),
    inserted,
    ...project.scenes.slice(index + 1),
  ];

  return finalizeSceneList(project, scenes, true);
}

export function duplicateScene(project: ShortsProject, sceneId: string): ShortsProject {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) {
    return project;
  }

  const source = project.scenes[index];
  const duplicated = createScene(project.brief, {
    id: `scene-${Date.now()}`,
    index: index + 2,
    text: source.text,
    duration: source.duration,
    role: source.role === "cta" ? "build" : source.role,
  });

  const scenes = [
    ...project.scenes.slice(0, index + 1),
    duplicated,
    ...project.scenes.slice(index + 1),
  ];

  return finalizeSceneList(project, scenes, true);
}

export function removeScene(project: ShortsProject, sceneId: string): ShortsProject {
  if (project.scenes.length <= 4) {
    return project;
  }

  const scenes = project.scenes.filter((scene) => scene.id !== sceneId);
  return finalizeSceneList(project, scenes, true);
}

export function moveScene(project: ShortsProject, sceneId: string, direction: "up" | "down"): ShortsProject {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || target < 0 || target >= project.scenes.length) {
    return project;
  }

  const scenes = [...project.scenes];
  [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
  return finalizeSceneList(project, scenes, false);
}

export function updateSceneRole(project: ShortsProject, sceneId: string, role: SceneRole): ShortsProject {
  const scenes = project.scenes.map((scene) =>
    scene.id === sceneId ? refreshSceneFromText({ ...scene, role }, project.brief) : scene,
  );

  return finalizeSceneList(project, scenes, false);
}

export function updateSceneDuration(project: ShortsProject, sceneId: string, duration: number): ShortsProject {
  const scenes = project.scenes.map((scene) =>
    scene.id === sceneId
      ? {
          ...scene,
          duration: clampDuration(duration),
        }
      : scene,
  );

  return recalculateProject({
    ...project,
    scenes,
  });
}

export function updateSceneNotes(project: ShortsProject, sceneId: string, notes: string): ShortsProject {
  const scenes = project.scenes.map((scene) =>
    scene.id === sceneId
      ? {
          ...scene,
          notes,
        }
      : scene,
  );

  return recalculateProject({
    ...project,
    scenes,
  });
}

export function buildSubtitleBlock(text: string): SubtitleBlock {
  const normalized = text.replace(/[.!?]+/g, "").trim();
  const maxChars = 12;
  const words = normalized.split(/\s+/).filter(Boolean);

  const lines =
    words.length <= 1 ? sliceLongText(normalized, maxChars) : wrapWordsByLength(words, maxChars);

  return {
    id: `subtitle-${slugify(text).slice(0, 14) || "scene"}`,
    lines: lines.filter(Boolean).slice(0, 2),
    emphasis: extractKeywords(text).slice(0, 2),
  };
}

export function makeRenderManifest(project: ShortsProject): RenderManifest {
  return {
    projectId: project.id,
    title: project.brief.title,
    targetDuration: project.brief.targetDuration,
    scenes: project.scenes.map((scene) => ({
      id: scene.id,
      role: scene.role,
      duration: scene.duration,
      text: scene.text,
      mediaQuery: scene.media.query,
      subtitle: scene.subtitles.lines,
      voice: scene.voice,
    })),
    qa: project.qa,
  };
}

export function buildRuntimeProfile(mode: ExecutionMode): RuntimeProfile {
  if (mode === "byo-api") {
    return {
      mode,
      costModel: "user-api",
      ffmpeg: "bundled",
      scriptProvider: "User API key",
      qaProvider: "User API key",
      ttsProvider: "User API key or local fallback",
      mediaProvider: "Open web search / local library",
      install: ["앱 내장 FFmpeg 사용", "사용자 API 키 입력 필요", "미디어 캐시 폴더 권한 필요"],
    };
  }

  if (mode === "hybrid") {
    return {
      mode,
      costModel: "mixed",
      ffmpeg: "bundled",
      scriptProvider: "Local default + optional API fallback",
      qaProvider: "Local rules + optional API fallback",
      ttsProvider: "Local TTS preferred",
      mediaProvider: "Local cache + optional API search",
      install: ["앱 내장 FFmpeg 사용", "로컬 모델 또는 API 키 중 하나 필요", "미디어 캐시 폴더 권한 필요"],
    };
  }

  return {
    mode,
    costModel: "free-local",
    ffmpeg: "bundled",
    scriptProvider: "Local template / local model",
    qaProvider: "Local rules engine",
    ttsProvider: "Local TTS",
    mediaProvider: "Local media folder / manual import",
    install: ["앱 내장 FFmpeg 사용", "추가 API 키 없이 실행 가능", "로컬 저장공간과 미디어 폴더 접근 필요"],
  };
}

function buildScenes(brief: Brief, script: string): Scene[] {
  const units = normalizeScript(script, brief);
  const desiredCount = clamp(Math.round(brief.targetDuration / 4.8), 6, 8);
  const seed = units.length ? [...units] : [brief.thesis];

  while (seed.length < desiredCount - 1) {
    seed.push(seed[seed.length - 1] ?? brief.thesis);
  }

  const cta = CTA_LIBRARY[(brief.title.length + brief.targetDuration) % CTA_LIBRARY.length];
  const texts = [...seed.slice(0, desiredCount - 1), cta];
  const roles = texts.map<SceneRole>((_, index) => {
    if (index === 0) return "hook";
    if (index === texts.length - 1) return "cta";
    if (index === texts.length - 2) return "payoff";
    return "build";
  });
  const durations = distributeDurations(brief.targetDuration, roles);

  return texts.map((text, index) =>
    createScene(brief, {
      id: `scene-${index + 1}`,
      index: index + 1,
      text: polishSceneText(text, roles[index]),
      duration: durations[index],
      role: roles[index],
    }),
  );
}

function createScene(
  brief: Brief,
  input: Pick<Scene, "id" | "index" | "text" | "duration" | "role"> & Partial<Pick<Scene, "notes">>,
): Scene {
  const voice = buildVoiceSpec(brief, input.role);
  const text = polishSceneText(input.text, input.role);

  return {
    id: input.id,
    index: input.index,
    text,
    duration: clampDuration(input.duration),
    role: input.role,
    media: buildMediaSpec(text, brief, input.role),
    subtitles: buildSubtitleBlock(text),
    voice,
    notes: input.notes?.trim() || ROLE_NOTE[input.role],
  };
}

function finalizeSceneList(project: ShortsProject, scenes: Scene[], rebalanceDurations: boolean): ShortsProject {
  const structured = applyStructuralRoles(reindexScenes(scenes));
  const durations = rebalanceDurations
    ? distributeDurations(project.brief.targetDuration, structured.map((scene) => scene.role))
    : structured.map((scene) => clampDuration(scene.duration));

  const nextScenes = structured.map((scene, index) =>
    refreshSceneFromText(
      {
        ...scene,
        duration: durations[index],
      },
      project.brief,
    ),
  );

  return recalculateProject({
    ...project,
    scenes: nextScenes,
  });
}

function applyStructuralRoles(scenes: Scene[]): Scene[] {
  const total = scenes.length;

  return scenes.map((scene, index) => {
    let role = scene.role;

    if (index === 0) {
      role = "hook";
    } else if (index === total - 1) {
      role = "cta";
    } else if (index === total - 2 && scene.role === "cta") {
      role = "payoff";
    }

    return {
      ...scene,
      role,
    };
  });
}

function reindexScenes(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => ({
    ...scene,
    index: index + 1,
  }));
}

function buildVoiceSpec(brief: Brief, role: SceneRole): VoiceSpec {
  const speed = role === "hook" ? 1.04 : role === "cta" ? 0.94 : brief.tone === "energetic" ? 1.08 : 0.98;
  const emotion =
    brief.tone === "energetic" ? "energetic" : brief.tone === "serious" || role === "payoff" ? "serious" : "neutral";

  return {
    provider: "TTS placeholder",
    speed: Number(speed.toFixed(2)),
    emotion,
  };
}

function buildMediaSpec(text: string, brief: Brief, role: SceneRole): MediaSpec {
  const tags = extractKeywords(text);
  const styleMap: Record<SceneRole, string> = {
    hook: "high-contrast editorial frame",
    build: "contextual visual evidence",
    payoff: "symbolic insight frame",
    cta: "clean closing statement card",
  };

  return {
    type: role === "build" ? "gif" : "image",
    query: [...tags.slice(0, 4), brief.tone === "serious" ? "documentary" : "illustration"].join(" "),
    style: styleMap[role],
    tags,
    sourceHint: role === "build" ? "giphy / stock mix" : "editorial still",
  };
}

function buildQaReport(brief: Brief, scenes: Scene[]): QaReport {
  const subtitleReadability = scoreSubtitleReadability(scenes);
  const hookStrength = scoreHook(scenes[0]?.text ?? "");
  const scriptFlow = scoreScriptFlow(scenes);
  const visualFit = scoreVisualFit(scenes);
  const pacing = scorePacing(brief.targetDuration, scenes);
  const ctaFinish = scoreCta(scenes[scenes.length - 1]?.text ?? "");
  const originality = scoreOriginality(scenes);
  const creatorPersona = scorePersona(brief);
  const overall = Math.round(
    average([hookStrength, scriptFlow, visualFit, subtitleReadability, pacing, ctaFinish, originality, creatorPersona]),
  );

  const qualitative: QualitativeQa = {
    overall,
    hookStrength,
    scriptFlow,
    visualFit,
    subtitleReadability,
    pacing,
    ctaFinish,
    originality,
    creatorPersona,
  };

  const quantitative = {
    subtitleDensity: subtitleReadability >= 88 ? "ok" : "warn",
    sceneDuration: scenes.every((scene) => scene.duration >= 2.2 && scene.duration <= 6.8) ? "ok" : "warn",
    audioSync: Math.abs(totalDuration(scenes) - brief.targetDuration) <= 0.8 ? "ok" : "warn",
    cutFrequency: scenes.length >= 4 && scenes.length <= 10 ? "ok" : "warn",
  } as const;

  const issues: string[] = [];

  if (hookStrength < 80) {
    issues.push("Hook가 평범합니다. 첫 장면을 질문이나 반전형 문장으로 더 세게 시작하세요.");
  }

  if (subtitleReadability < 86) {
    issues.push("자막 길이가 길어집니다. 한 줄 12자 이내로 더 잘라야 합니다.");
  }

  if (visualFit < 80) {
    issues.push("장면 텍스트와 미디어 쿼리의 결합이 느슨합니다. 명사 태그를 더 구체화하세요.");
  }

  if (ctaFinish < 78) {
    issues.push("마지막 장면이 행동 유도보다 문장 반복에 가깝습니다. 기준 제안형 CTA로 조정하세요.");
  }

  const verdict = overall >= 84 ? "pass" : "revise";
  const recommendation =
    verdict === "pass"
      ? "현재 구조는 배포 가능한 수준입니다. 이제 실제 미디어 수집과 렌더 엔진을 붙이면 됩니다."
      : "스크립트와 자막을 먼저 다듬고, 그 다음 미디어와 CTA를 다시 생성하는 순서가 맞습니다.";

  return {
    quantitative,
    qualitative,
    verdict,
    issues,
    recommendation,
  };
}

function normalizeScript(script: string, brief: Brief): string[] {
  const normalized = script
    .split(/\n+/)
    .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+/))
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return normalized.length ? normalized : [brief.thesis];
}

function distributeDurations(targetDuration: number, roles: SceneRole[]): number[] {
  const weights = roles.map((role) => {
    if (role === "hook") return 0.82;
    if (role === "payoff") return 1.08;
    if (role === "cta") return 0.9;
    return 1;
  });

  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const durations = weights.map((weight) => Number(((targetDuration * weight) / totalWeight).toFixed(1)));
  const gap = Number((targetDuration - durations.reduce((sum, value) => sum + value, 0)).toFixed(1));

  if (durations.length) {
    durations[durations.length - 1] = Number((durations[durations.length - 1] + gap).toFixed(1));
  }

  return durations.map(clampDuration);
}

function polishSceneText(text: string, role: SceneRole): string {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (role === "hook" && !/[?!]$/.test(cleaned) && compactLength(cleaned) <= 26) {
    return `${cleaned}?`;
  }

  return cleaned;
}

function scoreHook(text: string): number {
  let score = 68;

  if (/[?!]/.test(text)) score += 10;
  if (/(왜|진짜|결국|오히려|없앤|망한|금지)/.test(text)) score += 14;
  if (compactLength(text) <= 20) score += 6;

  return clamp(score, 0, 100);
}

function scoreScriptFlow(scenes: Scene[]): number {
  const uniqueRoles = new Set(scenes.map((scene) => scene.role)).size;
  const shortMessages = scenes.filter((scene) => compactLength(scene.text) <= 28).length;

  return clamp(70 + uniqueRoles * 6 + shortMessages * 2, 0, 100);
}

function scoreVisualFit(scenes: Scene[]): number {
  const matched = scenes.filter((scene) => scene.media.tags.some((tag) => scene.text.includes(tag))).length;
  return clamp(Math.round((matched / scenes.length) * 100) + 18, 0, 100);
}

function scoreSubtitleReadability(scenes: Scene[]): number {
  const compliantScenes = scenes.filter(
    (scene) =>
      scene.subtitles.lines.length <= 2 &&
      scene.subtitles.lines.every((line) => compactLength(line) <= 12),
  ).length;

  return clamp(Math.round((compliantScenes / scenes.length) * 100), 0, 100);
}

function scorePacing(targetDuration: number, scenes: Scene[]): number {
  const averageDuration = targetDuration / scenes.length;
  const variance =
    scenes.reduce((sum, scene) => sum + Math.abs(scene.duration - averageDuration), 0) / scenes.length;

  return clamp(Math.round(96 - variance * 10), 0, 100);
}

function scoreCta(text: string): number {
  let score = 62;

  if (/(바꾸|시작|이깁|설계|달라집니다)/.test(text)) score += 22;
  if (compactLength(text) <= 26) score += 8;

  return clamp(score, 0, 100);
}

function scoreOriginality(scenes: Scene[]): number {
  const tokens = new Set(scenes.flatMap((scene) => extractKeywords(scene.text)));
  return clamp(48 + tokens.size * 4, 0, 100);
}

function scorePersona(brief: Brief): number {
  let score = 54;

  if (brief.audience.length > 8) score += 12;
  if (brief.thesis.length > 20) score += 18;
  if (brief.tone === "serious") score += 8;

  return clamp(score, 0, 100);
}

function computeReadiness(qa: QaReport): number {
  const base = qa.qualitative.overall;
  const quantBonus =
    Object.values(qa.quantitative).filter((value) => value === "ok").length / Object.values(qa.quantitative).length;

  return clamp(Math.round(base * 0.82 + quantBonus * 18), 0, 100);
}

function deriveStatus(readiness: number): ShortsProject["status"] {
  if (readiness >= 94) return "rendered";
  if (readiness >= 82) return "review";
  if (readiness >= 68) return "editing";
  return "failed";
}

function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .match(/[a-z0-9]+|[가-힣]{2,}/g)
        ?.filter((token) => !STOPWORDS.has(token)) ?? [],
    ),
  ).slice(0, 5);
}

function wrapWordsByLength(words: string[], maxChars: number): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (compactLength(candidate) <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = compactLength(word) > maxChars ? sliceLongText(word, maxChars)[0] ?? word : word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function sliceLongText(text: string, maxChars: number): string[] {
  const compact = text.replace(/\s+/g, "");
  const chunks: string[] = [];

  for (let index = 0; index < compact.length; index += maxChars) {
    chunks.push(compact.slice(index, index + maxChars));
  }

  return chunks;
}

function compactLength(value: string): number {
  return value.replace(/\s+/g, "").length;
}

function totalDuration(scenes: Scene[]): number {
  return Number(scenes.reduce((sum, scene) => sum + scene.duration, 0).toFixed(1));
}

function clampDuration(value: number): number {
  return Number(clamp(Number(value.toFixed(1)), 1.8, 7.8).toFixed(1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-");
}
