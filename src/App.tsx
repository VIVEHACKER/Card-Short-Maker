import JSZip from "jszip";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  Download,
  FileJson2,
  Layers3,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,

  Workflow,
  Zap,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  BriefOverview,
  DetailCard,
  DraftsCanvas,
  EditorCanvas,
  ExportCanvas,
  QuantChip,
  ReviewCanvas,
  ScoreBar,
} from "./components/StudioPanels";
import { AISettingsPanel } from "./components/AISettingsPanel";
import { GenerationProgress } from "./components/GenerationProgress";
import { ErrorBanner } from "./components/ErrorBanner";
import { useErrors } from "./hooks/useErrors";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutoSave } from "./hooks/useAutoSave";
import { hydrateProject, parseBriefPayload } from "./lib/project-io";
import {
  createBlankProject,
  createEmptyBrief,
  loadProjectsFromStorage,
} from "./lib/project-factory";
import {
  prettyQaLabel,
  prettyQuantLabel,
  prettyRole,
  tabTitle,
  type TabKey,
} from "./lib/labels";
import {
  collectProjectObjectUrls,
  downloadBlob,
  downloadText,
  hasPendingDraftEdits,
  normalizeForDiff,
  slugify,
} from "./lib/app-utils";
import {
  addSceneAfter,
  buildSubtitleBlock,
  createProjectFromBrief,
  duplicateScene,
  moveScene,
  recalculateProject,
  refreshSceneFromText,
  removeScene,
  updateSceneDuration,
  updateSceneNotes,
  updateSceneRole,
  updateProjectRuntimeMode,
} from "./lib/pipeline";
import { buildRenderPackage } from "./lib/render-package";
import { buildAutoDraftFromTitle } from "./lib/title-autofill";
import { useAIPipeline } from "./hooks/useAIPipeline";
import { getAvailableProviders } from "./lib/ai/registry";
import { hasConfiguredStockProvider } from "./lib/stock";
import { generateImage } from "./lib/ai/capabilities/image-generation";
import type { GenerationVariationProfile, VariationStrength } from "./lib/ai/types";
import type { Brief, ExecutionMode, RenderPackage, SceneRole, ShortsProject } from "./types";

const NAV_TABS: Array<{ key: TabKey; label: string }> = [
  { key: "brief", label: "입력" },
  { key: "editor", label: "편집" },
  { key: "review", label: "검수" },
  { key: "drafts", label: "초안" },
  { key: "export", label: "내보내기" },
];

const PIPELINE_STAGES = [
  "브리프 정규화",
  "스크립트 압축",
  "장면 분해",
  "스톡 미디어 검색",
  "미디어 쿼리",
  "자막 분절",
  "QA 재평가",
  "렌더 패키지",
];

import { STORAGE_KEY_PROJECTS as STORAGE_KEY } from "./lib/constants";

function App() {
  const [projects, setProjects] = useState<ShortsProject[]>(() => loadProjectsFromStorage());
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TabKey>("editor");
  const [activeSceneId, setActiveSceneId] = useState(projects[0]?.scenes[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [draftBrief, setDraftBrief] = useState<Brief>(projects[0]?.brief ?? createEmptyBrief());
  const [draftScript, setDraftScript] = useState(projects[0]?.script ?? "");
  const [draftMode, setDraftMode] = useState<ExecutionMode>(projects[0]?.runtime.mode ?? "local");
  const [notice, setNotice] = useState("");
  const [variationStrength, setVariationStrength] = useState<VariationStrength>("fresh");
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [showAISettings, setShowAISettings] = useState(false);
  const trackedObjectUrlsRef = useRef<Set<string>>(new Set());

  const projectImportRef = useRef<HTMLInputElement>(null);
  const briefImportRef = useRef<HTMLInputElement>(null);

  const { generate: aiGenerate, cancel: aiCancel, progress: aiProgress, isGenerating } = useAIPipeline();
  const { errors: structuredErrors, push: pushError, dismiss: dismissError } = useErrors();

  const deferredSearch = useDeferredValue(search);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const activeScene = activeProject?.scenes.find((scene) => scene.id === activeSceneId) ?? activeProject?.scenes[0];
  const renderPackage = useMemo<RenderPackage | null>(
    () => (activeProject ? buildRenderPackage(activeProject) : null),
    [activeProject],
  );

  const filteredProjects = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => {
      const haystack = [project.brief.title, project.brief.topic, project.script].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, projects]);

  useEffect(() => {
    if (!activeProject) return;
    setDraftBrief(activeProject.brief);
    setDraftScript(activeProject.script);
    setDraftMode(activeProject.runtime.mode);
    setGenerationAttempt(0);
    setActiveSceneId(activeProject.scenes[0]?.id ?? "");
    // Intentionally only react to project *selection* changes. Within-project edits
    // are tracked separately via `commitProject` and must not bulldoze draft state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useAutoSave({
    value: projects,
    debounceMs: 800,
    intervalMs: 30_000,
    onSave: (next) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        pushError({
          severity: "warn",
          title: "자동 저장 실패",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });

  useEffect(() => {
    if (!notice) return;
    const isError = notice.includes("실패") || notice.includes("없습니다") || notice.includes("0/");
    const timer = window.setTimeout(() => setNotice(""), isError ? 15000 : 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const nextUrls = collectProjectObjectUrls(projects);
    const previousUrls = trackedObjectUrlsRef.current;

    for (const url of previousUrls) {
      if (!nextUrls.has(url)) {
        URL.revokeObjectURL(url);
      }
    }

    trackedObjectUrlsRef.current = nextUrls;
  }, [projects]);

  useEffect(() => {
    return () => {
      for (const url of trackedObjectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      trackedObjectUrlsRef.current.clear();
    };
  }, []);

  function handleRecoverWorkspace() {
    const fallbackProjects = [createBlankProject()];
    const first = fallbackProjects[0];

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors and continue with in-memory reset
    }

    setProjects(fallbackProjects);
    setActiveProjectId(first?.id ?? "");
    setActiveSceneId(first?.scenes[0]?.id ?? "");
    setDraftBrief(first?.brief ?? createEmptyBrief());
    setDraftScript(first?.script ?? "");
    setDraftMode(first?.runtime.mode ?? "local");
    setActiveTab("brief");
    setNotice("저장된 프로젝트를 초기화하고 빈 프로젝트로 복구했습니다.");
  }

  useKeyboardShortcuts([
    {
      key: "a",
      shift: true,
      handler: () => {
        if (!activeProject || !activeScene) return;
        handleAddScene();
      },
    },
    {
      key: "d",
      meta: true,
      handler: () => {
        if (!activeProject || !activeScene) return;
        handleDuplicateScene();
      },
    },
    {
      key: "Backspace",
      shift: true,
      handler: () => {
        if (!activeProject || !activeScene) return;
        handleDeleteScene();
      },
    },
    {
      key: "ArrowUp",
      meta: true,
      handler: () => {
        if (!activeProject || !activeScene) return;
        handleMoveScene("up");
      },
    },
    {
      key: "ArrowDown",
      meta: true,
      handler: () => {
        if (!activeProject || !activeScene) return;
        handleMoveScene("down");
      },
    },
    {
      key: "Enter",
      meta: true,
      allowInInput: true,
      handler: () => {
        if (isGenerating) return;
        handleAIGenerate();
      },
    },
  ]);

  if (!activeProject || !activeScene || !renderPackage) {
    return (
      <div className="startup-fallback">
        <section className="startup-fallback__card">
          <p className="startup-fallback__eyebrow">Card Short Maker</p>
          <h1 className="startup-fallback__title">프로젝트 상태를 불러오지 못했습니다</h1>
          <p className="startup-fallback__desc">
            저장된 로컬 프로젝트 데이터가 손상되었거나, 현재 앱 구조와 호환되지 않을 수 있습니다.
            아래 버튼으로 프로젝트 상태를 복구할 수 있습니다.
          </p>
          <div className="startup-fallback__actions">
            <button type="button" className="new-reel" onClick={handleRecoverWorkspace}>
              프로젝트 복구하기
            </button>
          </div>
        </section>
      </div>
    );
  }

  const accentStyle = { "--accent": activeProject.accent } as CSSProperties;
  const activeTitle = activeProject.brief.title.trim() || "제목을 입력하면 숏츠가 구성됩니다";
  const sceneTotalDuration = activeProject.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const mediaReadyCount = activeProject.scenes.filter((scene) => scene.media.generatedImageUrl).length;
  const voiceReadyCount = activeProject.scenes.filter((scene) => scene.voice.generatedAudioUrl).length;

  function commitProject(nextProject: ShortsProject, preferredSceneId?: string) {
    setProjects((current) =>
      current.map((project) => (project.id === nextProject.id ? nextProject : project)),
    );

    const nextSceneId =
      preferredSceneId && nextProject.scenes.some((scene) => scene.id === preferredSceneId)
        ? preferredSceneId
        : nextProject.scenes[0]?.id ?? "";

    setActiveSceneId(nextSceneId);
  }

  function handleTitleAutofill(rawTitle: string, options?: { force?: boolean }) {
    const title = rawTitle.trim();
    const force = options?.force ?? false;
    if (!title) {
      return;
    }

    if (!force && hasPendingDraftEdits(activeProject, draftBrief, draftScript, draftMode)) {
      setNotice("수동으로 편집한 내용이 있어 제목 자동 채움을 건너뛰었습니다.");
      return;
    }

    const autoDraft = buildAutoDraftFromTitle(title, draftBrief);
    setDraftBrief(autoDraft.brief);
    if (autoDraft.script) {
      setDraftScript(autoDraft.script);
    }

    const localProject = createProjectFromBrief(autoDraft.brief, autoDraft.script, {
      id: activeProject.id,
      accent: activeProject.accent,
      channel: activeProject.channel,
      preset: activeProject.preset,
      runtimeMode: draftMode,
    });
    commitProject(localProject);
    setActiveTab("editor");
    setNotice("제목 기반으로 브리프, 스크립트, 장면을 채웠습니다.");
  }

  async function runAIGenerate(briefOverride?: Brief, options?: { regenerate?: boolean }) {
    const imageProviders = getAvailableProviders("image");
    const textProviders = getAvailableProviders("text");

    if (isGenerating) {
      setNotice("이미 생성이 진행 중입니다.");
      return;
    }

    const canUseStock = hasConfiguredStockProvider();
    const setupWarnings: string[] = [];
    if (textProviders.length === 0) {
      setupWarnings.push("스크립트는 로컬 생성");
    }
    if (imageProviders.length === 0 && !canUseStock) {
      setupWarnings.push("이미지는 의미 기반 로컬 비주얼");
    }
    if (setupWarnings.length > 0) {
      setNotice(`${setupWarnings.join(" · ")}로 진행합니다. 키 없이도 완성 가능한 장면별 비주얼을 생성합니다.`);
    }

    const baseBrief = briefOverride ?? draftBrief;
    const normalizedTitle = baseBrief.title.trim();
    const attempt = options?.regenerate ? generationAttempt + 1 : 1;
    const variation: GenerationVariationProfile = {
      attempt,
      strength: variationStrength,
      seed: `${(normalizedTitle || baseBrief.topic || "shorts").slice(0, 24)}-${attempt}-${Date.now().toString(36)}`,
    };
    const normalizedTopic = baseBrief.topic.replace(/\s+/g, " ").trim();
    const normalizedTopicFromTitle = normalizedTitle.replace(/\s+/g, " ").trim();
    const shouldEnrichBrief =
      normalizedTitle.length > 0 &&
      (
        normalizedTopic !== normalizedTopicFromTitle ||
        !baseBrief.topic.trim() ||
        !baseBrief.audience.trim() ||
        !baseBrief.thesis.trim()
      );
    const effectiveBrief = shouldEnrichBrief
      ? buildAutoDraftFromTitle(normalizedTitle, baseBrief).brief
      : baseBrief;

    if (shouldEnrichBrief) {
      setDraftBrief(effectiveBrief);
    }

    try {
      const result = await aiGenerate(effectiveBrief, {
        id: activeProject.id,
        accent: activeProject.accent,
        channel: activeProject.channel,
        preset: activeProject.preset,
        runtimeMode: draftMode,
        bypassScriptCache: true,
        variation,
      });

      setDraftScript(result.project.script);
      setGenerationAttempt(attempt);
      commitProject(result.project);
      setActiveProjectId(result.project.id);
      setActiveTab("editor");

      const sceneTotal = result.project.scenes.length;
      const statusParts = [
        `이미지 ${result.imageSuccessCount}/${sceneTotal}${result.imageFallbackCount ? ` (로컬 ${result.imageFallbackCount})` : ""}`,
        `음성 ${result.ttsSuccessCount}/${sceneTotal}`,
      ];
      const firstError = result.errors[0] ?? "";
      const errorSummary = firstError
        ? ` — ${firstError}`
        : "";
      const variationLabel =
        variationStrength === "wild" ? "WILD" : variationStrength === "fresh" ? "FRESH" : "BALANCED";
      setNotice(`${result.scriptProvider} 생성 완료 · ${statusParts.join(" · ")} · ${variationLabel} ${attempt}회차${errorSummary}`);

      for (const partialError of result.errors) {
        pushError({
          severity: "warn",
          title: "AI 부분 실패",
          detail: partialError,
        });
      }
    } catch (error) {
      // 스크립트 생성 자체가 실패한 경우만 여기에 도달
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setNotice(`AI 생성 실패: ${message}`);
      pushError({
        severity: "error",
        title: "AI 스크립트 생성 실패",
        detail: message,
      });
    }
  }

  function handleAIGenerate(options?: { regenerate?: boolean }) {
    runAIGenerate(undefined, options).catch((error) => {
      setNotice(`AI 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  async function handleDiagnose() {
    const textP = getAvailableProviders("text");
    const imageP = getAvailableProviders("image");
    const ttsP = getAvailableProviders("tts");
    const lines = [`프로바이더: text=${textP.join(",") || "없음"} | image=${imageP.join(",") || "없음"} | tts=${ttsP.join(",") || "없음"}`];

    if (imageP.length === 0) {
      lines.push("AI 이미지 프로바이더 없음 — 자동 생성은 의미 기반 로컬 비주얼로 처리됩니다");
      setNotice(lines.join("\n"));
      return;
    }

    lines.push(`이미지 테스트 (${imageP[0]})...`);
    setNotice(lines.join(" | "));

    try {
      const result = await generateImage({
        prompt: "simple blue gradient background",
        style: "minimal clean",
        aspectRatio: "9:16",
        sceneRole: "hook",
      });
      lines.push(`성공! URL=${result.imageUrl.slice(0, 30)}...`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lines.push(`실패: ${msg}`);
    }

    setNotice(lines.join(" | "));
  }

  function handleCreateProject() {
    const project = createBlankProject({
      id: `project-${Date.now()}`,
      accent: "#9fd49f",
      channel: "channel-new",
      preset: "새 프로젝트",
      runtimeMode: "local",
    });

    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setActiveSceneId(project.scenes[0]?.id ?? "");
    setActiveTab("brief");
    setNotice("새 프로젝트를 만들었습니다.");
  }

  function handleSceneTextChange(value: string) {
    commitProject(
      recalculateProject({
        ...activeProject,
        scenes: activeProject.scenes.map((scene) =>
          scene.id === activeScene.id ? refreshSceneFromText({ ...scene, text: value }, activeProject.brief) : scene,
        ),
      }),
      activeScene.id,
    );
  }

  function handleSceneMediaChange(value: string) {
    commitProject(
      recalculateProject({
        ...activeProject,
        scenes: activeProject.scenes.map((scene) =>
          scene.id === activeScene.id
            ? {
                ...scene,
                media: {
                  ...scene.media,
                  query: value,
                },
              }
            : scene,
        ),
      }),
      activeScene.id,
    );
  }

  function handleSceneSubtitleChange(value: string) {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2);

    commitProject(
      recalculateProject({
        ...activeProject,
        scenes: activeProject.scenes.map((scene) =>
          scene.id === activeScene.id
            ? {
                ...scene,
                subtitles: {
                  ...buildSubtitleBlock(scene.text),
                  lines,
                },
              }
            : scene,
        ),
      }),
      activeScene.id,
    );
  }

  function handleRoleChange(role: SceneRole) {
    commitProject(updateSceneRole(activeProject, activeScene.id, role), activeScene.id);
  }

  function handleDurationChange(duration: number) {
    commitProject(updateSceneDuration(activeProject, activeScene.id, duration), activeScene.id);
  }

  function handleNotesChange(value: string) {
    commitProject(updateSceneNotes(activeProject, activeScene.id, value), activeScene.id);
  }

  function handleAddScene() {
    commitProject(addSceneAfter(activeProject, activeScene.id));
    setNotice("새 장면을 추가했습니다.");
  }

  function handleDuplicateScene() {
    commitProject(duplicateScene(activeProject, activeScene.id));
    setNotice("현재 장면을 복제했습니다.");
  }

  function handleDeleteScene() {
    commitProject(removeScene(activeProject, activeScene.id));
    setNotice("장면을 삭제했습니다.");
  }

  function handleMoveScene(direction: "up" | "down") {
    commitProject(moveScene(activeProject, activeScene.id, direction), activeScene.id);
  }

  function handleRuntimeModeChange(mode: ExecutionMode) {
    setDraftMode(mode);
    commitProject(updateProjectRuntimeMode(activeProject, mode), activeScene.id);
    setNotice("실행 모드를 변경했습니다.");
  }

  function handleDownloadProjectJson() {
    downloadText(
      `${slugify(activeProject.brief.title)}-project.json`,
      JSON.stringify(activeProject, null, 2),
      "application/json",
    );
    setNotice("프로젝트 JSON을 내보냈습니다.");
  }

  async function handleDownloadRenderPackage() {
    if (!renderPackage) {
      return;
    }

    const zip = new JSZip();
    zip.file("project.json", JSON.stringify(activeProject, null, 2));
    zip.file("render-manifest.json", JSON.stringify(renderPackage.manifest, null, 2));
    zip.file("subtitles.srt", renderPackage.subtitlesSrt);
    zip.file("ffmpeg-concat.txt", renderPackage.ffmpegConcat);
    zip.file("README.txt", renderPackage.readme);

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(`${slugify(activeProject.brief.title)}-render-package.zip`, blob);
    setNotice("렌더 패키지 zip을 만들었습니다.");
  }

  function handleOpenProjectImport() {
    projectImportRef.current?.click();
  }

  function handleOpenBriefImport() {
    briefImportRef.current?.click();
  }

  async function handleProjectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const project = hydrateProject(raw);
      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setActiveProjectId(project.id);
      setActiveSceneId(project.scenes[0]?.id ?? "");
      setActiveTab("editor");
      setNotice("프로젝트 JSON을 가져왔습니다.");
    } catch {
      setNotice("프로젝트 JSON을 읽지 못했습니다.");
    }
  }

  async function handleBriefImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const payload = parseBriefPayload(raw);
      setDraftBrief(payload.brief);
      setDraftScript(payload.script);
      setDraftMode(payload.runtimeMode);
      setActiveTab("brief");
      setNotice("브리프 JSON을 불러왔습니다. 검토 후 자동 생성하세요.");
    } catch {
      setNotice("브리프 JSON을 읽지 못했습니다.");
    }
  }

  return (
    <div className="app-shell" style={accentStyle}>
      <input className="hidden-file" ref={projectImportRef} type="file" accept=".json,application/json" onChange={handleProjectImport} />
      <input className="hidden-file" ref={briefImportRef} type="file" accept=".json,application/json" onChange={handleBriefImport} />

      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="brand-mark">
            <span>CS</span>
            <div>
              <strong>Card Short Maker</strong>
              <em>카드형 숏츠 제작실</em>
            </div>
          </div>

          <button className="new-reel" type="button" onClick={handleCreateProject}>
            <Sparkles size={16} />
            새 Reel
          </button>

          <div className="toolbar-row">
            <button className="ghost-button ghost-button--small" type="button" onClick={handleOpenProjectImport}>
              <Upload size={14} />
              프로젝트
            </button>
            <button className="ghost-button ghost-button--small" type="button" onClick={handleOpenBriefImport}>
              <Upload size={14} />
              브리프
            </button>
          </div>

          <div className="project-search">
            <Search size={15} />
            <input
              aria-label="프로젝트 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="제목 / 스크립트 검색..."
            />
          </div>
        </div>

        <div className="sidebar__list">
          {filteredProjects.length ? (
            filteredProjects.map((project) => (
              <button
                key={project.id}
                className={`project-card ${project.id === activeProject.id ? "project-card--active" : ""}`}
                type="button"
                onClick={() => setActiveProjectId(project.id)}
                aria-current={project.id === activeProject.id ? "true" : undefined}
              >
                <div className="project-card__status">
                  <span className={`status-dot status-dot--${project.status}`} />
                  <span>{project.status}</span>
                  <span>{project.updatedAt}</span>
                </div>
                <strong>{project.brief.title.trim() || "제목 없는 Reel"}</strong>
                <span>{project.scenes.length}장면 · {project.brief.targetDuration}초</span>
              </button>
            ))
          ) : (
            <div className="sidebar-empty">
              <strong>검색 결과 없음</strong>
              <span>다른 제목이나 스크립트 단어로 찾아보세요.</span>
            </div>
          )}
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar__title">
            <div className="eyebrow">
              <Workflow size={14} />
              Shorts Studio
            </div>
            <h1>{activeTitle}</h1>
          </div>

          <nav className="tabs" aria-label="주요 탭">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tabs__item ${tab.key === activeTab ? "tabs__item--active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={tab.key === activeTab ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="topbar__meta" aria-label="프로젝트 상태">
            <div className="status-meter">
              <span>완성도</span>
              <strong>{activeProject.readiness}%</strong>
            </div>
            <button className="ghost-button ghost-button--small" type="button" onClick={() => setShowAISettings(true)} aria-label="AI 설정">
              <Settings size={15} />
            </button>
          </div>
        </header>

        <section className="command-strip" aria-label="작업 요약">
          <div className="command-strip__stat">
            <span>장면</span>
            <strong>{activeProject.scenes.length}</strong>
          </div>
          <div className="command-strip__stat">
            <span>타임라인</span>
            <strong>{sceneTotalDuration.toFixed(1)}s</strong>
          </div>
          <div className="command-strip__stat">
            <span>이미지</span>
            <strong>{mediaReadyCount}/{activeProject.scenes.length}</strong>
          </div>
          <div className="command-strip__stat">
            <span>음성</span>
            <strong>{voiceReadyCount}/{activeProject.scenes.length}</strong>
          </div>
          <div className="command-strip__actions">
            <button className="ghost-button ghost-button--small" type="button" onClick={() => setShowAISettings(true)}>
              <Settings size={14} />
              설정
            </button>
            <button className="ai-generate-button ai-generate-button--compact" type="button" onClick={() => handleAIGenerate()} disabled={isGenerating}>
              <Zap size={14} />
              생성
            </button>
          </div>
        </section>

        <AnimatePresence>
          {notice ? (
            <motion.div
              className="notice-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {notice}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="workspace">
          <section className="panel brief-pane">
            <div className="panel__header">
              <div>
                <p>Step 1</p>
                <h2>제목에서 장면까지</h2>
              </div>
              <div className="brief-actions">
                <button className="ghost-button" type="button" onClick={handleDiagnose} disabled={isGenerating}>
                  <Search size={15} />
                  진단
                </button>
                <select
                  className="ghost-select"
                  value={variationStrength}
                  onChange={(event) => setVariationStrength(event.target.value as VariationStrength)}
                  disabled={isGenerating}
                  aria-label="변주 강도"
                >
                  <option value="balanced">변주 안정</option>
                  <option value="fresh">변주 강화</option>
                  <option value="wild">변주 최대</option>
                </select>
                <button className="ai-generate-button" type="button" onClick={() => handleAIGenerate()} disabled={isGenerating}>
                  <Zap size={15} />
                  AI 생성
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => handleAIGenerate({ regenerate: true })}
                  disabled={isGenerating || !draftBrief.title.trim()}
                >
                  <Sparkles size={15} />
                  다시 생성
                </button>
              </div>
            </div>

            <div className="panel__content panel__content--form">
              <div className="brief-focus-card">
                <span>현재 기준</span>
                <strong>{draftBrief.thesis || "제목을 입력하면 핵심 논지가 자동으로 잡힙니다."}</strong>
              </div>

              <label className="field">
                <span>제목</span>
                <div className="field-input-action">
                  <input
                    value={draftBrief.title}
                    onChange={(event) => setDraftBrief((current) => ({ ...current, title: event.target.value }))}
                    onBlur={(event) => handleTitleAutofill(event.currentTarget.value, { force: true })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleTitleAutofill(event.currentTarget.value, { force: true });
                      }
                    }}
                  />
                  <button
                    className="ghost-button ghost-button--small field-action-button"
                    type="button"
                    onClick={() => handleTitleAutofill(draftBrief.title, { force: true })}
                    disabled={!draftBrief.title.trim()}
                  >
                    자동 채우기
                  </button>
                </div>
              </label>

              <label className="field">
                <span>주제</span>
                <input
                  value={draftBrief.topic}
                  onChange={(event) => setDraftBrief((current) => ({ ...current, topic: event.target.value }))}
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span>톤</span>
                  <select
                    value={draftBrief.tone}
                    onChange={(event) =>
                      setDraftBrief((current) => ({ ...current, tone: event.target.value as Brief["tone"] }))
                    }
                  >
                    <option value="serious">진지한 톤</option>
                    <option value="neutral">균형 톤</option>
                    <option value="energetic">활기찬 톤</option>
                    <option value="urgent">긴급 톤</option>
                  </select>
                </label>

                <label className="field">
                  <span>플랫폼</span>
                  <select
                    value={draftBrief.platform}
                    onChange={(event) =>
                      setDraftBrief((current) => ({ ...current, platform: event.target.value as Brief["platform"] }))
                    }
                  >
                    <option value="youtube">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                    <option value="reels">Instagram Reels</option>
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>러닝타임</span>
                  <input
                    type="number"
                    min={15}
                    max={60}
                    value={draftBrief.targetDuration}
                    onChange={(event) =>
                      setDraftBrief((current) => ({ ...current, targetDuration: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="field">
                  <span>의도</span>
                  <select
                    value={draftBrief.intent}
                    onChange={(event) =>
                      setDraftBrief((current) => ({ ...current, intent: event.target.value as Brief["intent"] }))
                    }
                  >
                    <option value="info">정보 전달</option>
                    <option value="opinion">의견 / 관점</option>
                    <option value="story">스토리</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>실행 모드</span>
                <select value={draftMode} onChange={(event) => handleRuntimeModeChange(event.target.value as ExecutionMode)}>
                  <option value="local">로컬 생성</option>
                  <option value="byo-api">내 API 사용</option>
                  <option value="hybrid">하이브리드</option>
                </select>
              </label>

              <label className="field">
                <span>대상 시청자</span>
                <input
                  value={draftBrief.audience}
                  onChange={(event) => setDraftBrief((current) => ({ ...current, audience: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>핵심 논지</span>
                <textarea
                  rows={3}
                  value={draftBrief.thesis}
                  onChange={(event) => setDraftBrief((current) => ({ ...current, thesis: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>스크립트</span>
                <textarea rows={11} value={draftScript} onChange={(event) => setDraftScript(event.target.value)} />
              </label>
            </div>

            <div className="pipeline-rail">
              {PIPELINE_STAGES.map((stage, index) => (
                <div key={stage} className="pipeline-rail__item">
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <span>{stage}</span>
                  <strong>{index < 3 ? "setup" : index < 6 ? "asset" : "final"}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel stage-pane">
            <div className="panel__header">
              <div>
                <p>Step 2</p>
                <h2>{tabTitle(activeTab)}</h2>
              </div>
              <div className="stage-actions">
                <button className="ghost-button" type="button" onClick={handleDownloadProjectJson}>
                  <FileJson2 size={15} />
                  프로젝트 JSON
                </button>
                <button className="ghost-button" type="button" onClick={handleDownloadRenderPackage}>
                  <Download size={15} />
                  렌더 패키지
                </button>
              </div>
            </div>

            {activeTab === "brief" ? (
              <BriefOverview project={activeProject} />
            ) : activeTab === "review" ? (
              <ReviewCanvas project={activeProject} scene={activeScene} />
            ) : activeTab === "drafts" ? (
              <DraftsCanvas project={activeProject} activeSceneId={activeScene.id} onSelectScene={setActiveSceneId} />
            ) : activeTab === "export" ? (
              <ExportCanvas project={activeProject} renderPackage={renderPackage} />
            ) : (
              <EditorCanvas project={activeProject} scene={activeScene} onSelectScene={setActiveSceneId} />
            )}
          </section>

          <section className="panel inspector-pane">
            <AnimatePresence mode="wait">
              {activeTab === "brief" ? (
                <motion.section
                  key="brief"
                  className="inspector-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="panel__header panel__header--inner">
                    <div>
                      <p>브리프 진단</p>
                      <h2>기준점</h2>
                    </div>
                    <span className="meta-pill">{activeProject.brief.targetDuration}s</span>
                  </div>

                  <div className="detail-grid">
                    <DetailCard icon={<Layers3 size={15} />} label="대상 시청자" value={activeProject.brief.audience} />
                    <DetailCard icon={<Play size={15} />} label="핵심 논지" value={activeProject.brief.thesis} />
                    <DetailCard
                      icon={<Workflow size={15} />}
                      label="플랫폼 / 의도"
                      value={`${activeProject.brief.platform} · ${activeProject.brief.intent}`}
                    />
                    <DetailCard
                      icon={<Upload size={15} />}
                      label="실행 모드"
                      value={`${activeProject.runtime.mode} · ${activeProject.runtime.costModel}`}
                    />
                  </div>

                  <div className="recommendation-box">
                    <strong>추천 흐름</strong>
                    <p>
                      첫 장면은 질문형 Hook로 열고, 중간 장면은 사례 하나씩만 전달하세요.
                      마지막은 결론보다 기준 제안형 CTA가 더 강합니다.
                    </p>
                    <p>{activeProject.runtime.install.join(" / ")}</p>
                  </div>
                </motion.section>
              ) : activeTab === "review" ? (
                <motion.section
                  key="review"
                  className="inspector-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="panel__header panel__header--inner">
                    <div>
                      <p>리뷰</p>
                      <h2>QA와 보완점</h2>
                    </div>
                    <span className={`verdict-pill verdict-pill--${activeProject.qa.verdict}`}>
                      {activeProject.qa.verdict.toUpperCase()}
                    </span>
                  </div>

                  <div className="qa-summary">
                    {Object.entries(activeProject.qa.qualitative).map(([label, value]) => (
                      <ScoreBar key={label} label={prettyQaLabel(label)} value={value} />
                    ))}
                  </div>

                  <div className="quant-grid">
                    {Object.entries(activeProject.qa.quantitative).map(([label, value]) => (
                      <QuantChip key={label} label={prettyQuantLabel(label)} status={value} />
                    ))}
                  </div>

                  <div className="issue-list">
                    <div className="issue-list__title">
                      <Workflow size={16} />
                      개선 포인트
                    </div>
                    {activeProject.qa.issues.length ? (
                      activeProject.qa.issues.map((issue) => <p key={issue}>{issue}</p>)
                    ) : (
                      <p>현재 구조는 큰 문제 없이 배포 가능한 수준입니다.</p>
                    )}
                  </div>

                  <div className="recommendation-box">
                    <strong>권장 액션</strong>
                    <p>{activeProject.qa.recommendation}</p>
                  </div>
                </motion.section>
              ) : activeTab === "export" ? (
                <motion.section
                  key="export"
                  className="inspector-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="panel__header panel__header--inner">
                    <div>
                      <p>익스포트</p>
                      <h2>렌더 패키지</h2>
                    </div>
                    <button className="ghost-button" type="button" onClick={handleDownloadRenderPackage}>
                      <Download size={15} />
                      다운로드
                    </button>
                  </div>

                  <div className="export-card">
                    <div className="export-stat">
                      <span>장면 수</span>
                      <strong>{activeProject.scenes.length}</strong>
                    </div>
                    <div className="export-stat">
                      <span>목표 시간</span>
                      <strong>{activeProject.brief.targetDuration}s</strong>
                    </div>
                    <div className="export-stat">
                      <span>QA</span>
                      <strong>{activeProject.qa.qualitative.overall}</strong>
                    </div>
                  </div>

                  <pre className="json-preview">{JSON.stringify(renderPackage.manifest, null, 2)}</pre>
                </motion.section>
              ) : (
                <motion.section
                  key="editor"
                  className="inspector-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="panel__header panel__header--inner">
                    <div>
                      <p>장면 {activeScene.index}</p>
                      <h2>{prettyRole(activeScene.role)}</h2>
                    </div>
                    <span className="meta-pill">{activeScene.duration.toFixed(1)}s</span>
                  </div>

                  <div className="inspector-actions">
                    <button className="ghost-button ghost-button--small" type="button" onClick={() => handleMoveScene("up")}>
                      <ArrowUp size={14} />
                      위로
                    </button>
                    <button className="ghost-button ghost-button--small" type="button" onClick={() => handleMoveScene("down")}>
                      <ArrowDown size={14} />
                      아래로
                    </button>
                    <button className="ghost-button ghost-button--small" type="button" onClick={handleAddScene}>
                      <Plus size={14} />
                      추가
                    </button>
                    <button className="ghost-button ghost-button--small" type="button" onClick={handleDuplicateScene}>
                      <CopyPlus size={14} />
                      복제
                    </button>
                    <button className="ghost-button ghost-button--small danger-button" type="button" onClick={handleDeleteScene}>
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span>역할</span>
                      <select value={activeScene.role} onChange={(event) => handleRoleChange(event.target.value as SceneRole)}>
                        <option value="hook">후킹</option>
                        <option value="build">전개</option>
                        <option value="payoff">전환점</option>
                        <option value="cta">CTA</option>
                      </select>
                    </label>

                    <label className="field">
                      <span>길이 (초)</span>
                      <input
                        type="number"
                        step={0.1}
                        min={1.8}
                        max={7.8}
                        value={activeScene.duration}
                        onChange={(event) => handleDurationChange(Number(event.target.value))}
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>장면 문장</span>
                    <textarea rows={6} value={activeScene.text} onChange={(event) => handleSceneTextChange(event.target.value)} />
                  </label>

                  <label className="field">
                    <span>미디어 쿼리</span>
                    <input value={activeScene.media.query} onChange={(event) => handleSceneMediaChange(event.target.value)} />
                  </label>

                  <label className="field">
                    <span>자막</span>
                    <textarea
                      rows={3}
                      value={activeScene.subtitles.lines.join("\n")}
                      onChange={(event) => handleSceneSubtitleChange(event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>장면 노트</span>
                    <textarea rows={3} value={activeScene.notes} onChange={(event) => handleNotesChange(event.target.value)} />
                  </label>

                  <div className="detail-grid">
                    <DetailCard icon={<Play size={15} />} label="스타일" value={activeScene.media.style} />
                    <DetailCard icon={<Workflow size={15} />} label="소스 힌트" value={activeScene.media.sourceHint} />
                    <DetailCard
                      icon={<Upload size={15} />}
                      label="보이스"
                      value={`${activeScene.voice.emotion} · ${activeScene.voice.speed.toFixed(2)}x`}
                    />
                    <DetailCard
                      icon={<Layers3 size={15} />}
                      label="강조 키워드"
                      value={activeScene.subtitles.emphasis.join(", ") || "-"}
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </section>
        </section>
      </main>

      <AISettingsPanel open={showAISettings} onClose={() => setShowAISettings(false)} />
      <GenerationProgress progress={aiProgress} onCancel={aiCancel} />
      <ErrorBanner errors={structuredErrors} onDismiss={dismissError} />
    </div>
  );
}

export default App;
