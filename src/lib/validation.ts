import type { Brief, Scene, ShortsProject } from "../types";
import {
  BRIEF_DURATION_MAX_SECONDS,
  BRIEF_DURATION_MIN_SECONDS,
  BRIEF_THESIS_MAX_LENGTH,
  BRIEF_TITLE_MAX_LENGTH,
  SCENE_DURATION_MAX_SECONDS,
  SCENE_DURATION_MIN_SECONDS,
} from "./constants";

export interface ValidationIssue {
  field: string;
  severity: "error" | "warn";
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export function validateBrief(brief: Brief): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!brief.title.trim()) {
    issues.push({ field: "title", severity: "error", message: "제목을 입력해 주세요." });
  } else if (brief.title.length > BRIEF_TITLE_MAX_LENGTH) {
    issues.push({
      field: "title",
      severity: "warn",
      message: `제목이 ${BRIEF_TITLE_MAX_LENGTH}자를 초과했습니다.`,
    });
  }

  if (!brief.topic.trim()) {
    issues.push({ field: "topic", severity: "error", message: "토픽을 입력해 주세요." });
  }

  if (
    brief.targetDuration < BRIEF_DURATION_MIN_SECONDS ||
    brief.targetDuration > BRIEF_DURATION_MAX_SECONDS
  ) {
    issues.push({
      field: "targetDuration",
      severity: "error",
      message: `목표 길이는 ${BRIEF_DURATION_MIN_SECONDS}~${BRIEF_DURATION_MAX_SECONDS}초 사이여야 합니다.`,
    });
  }

  if (brief.thesis && brief.thesis.length > BRIEF_THESIS_MAX_LENGTH) {
    issues.push({
      field: "thesis",
      severity: "warn",
      message: `요지가 ${BRIEF_THESIS_MAX_LENGTH}자를 초과했습니다.`,
    });
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}

export function validateScene(scene: Scene): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!scene.text.trim()) {
    issues.push({
      field: `scene[${scene.index}].text`,
      severity: "error",
      message: `씬 ${scene.index + 1}의 본문이 비어 있습니다.`,
    });
  }

  if (
    scene.duration < SCENE_DURATION_MIN_SECONDS ||
    scene.duration > SCENE_DURATION_MAX_SECONDS
  ) {
    issues.push({
      field: `scene[${scene.index}].duration`,
      severity: "warn",
      message: `씬 ${scene.index + 1} 길이는 ${SCENE_DURATION_MIN_SECONDS}~${SCENE_DURATION_MAX_SECONDS}초 권장.`,
    });
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}

export function validateProject(project: ShortsProject): ValidationResult {
  const issues: ValidationIssue[] = [];
  issues.push(...validateBrief(project.brief).issues);
  if (project.scenes.length === 0) {
    issues.push({
      field: "scenes",
      severity: "error",
      message: "씬이 하나도 없습니다.",
    });
  }
  for (const scene of project.scenes) {
    issues.push(...validateScene(scene).issues);
  }
  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}
