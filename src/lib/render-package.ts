import { makeRenderManifest } from "./pipeline";
import { buildAss, buildVtt } from "./subtitle-formats";
import type { RenderPackage, ShortsProject } from "../types";

export function buildRenderPackage(project: ShortsProject): RenderPackage {
  const manifest = makeRenderManifest(project);

  return {
    project,
    manifest,
    subtitlesSrt: buildSrt(project),
    subtitlesVtt: buildVtt(project),
    subtitlesAss: buildAss(project),
    ffmpegConcat: buildFfmpegConcat(project),
    readme: buildPackageReadme(project),
  };
}

export function buildSrt(project: ShortsProject): string {
  let elapsed = 0;

  return project.scenes
    .map((scene, index) => {
      const start = formatSrtTimestamp(elapsed);
      elapsed += scene.duration;
      const end = formatSrtTimestamp(elapsed);

      return [
        String(index + 1),
        `${start} --> ${end}`,
        scene.subtitles.lines.join("\n"),
      ].join("\n");
    })
    .join("\n\n");
}

export function buildFfmpegConcat(project: ShortsProject): string {
  return [
    "# Replace asset paths before rendering with FFmpeg.",
    "# Example: ffmpeg -f concat -safe 0 -i ffmpeg-concat.txt -vf subtitles=subtitles.srt output.mp4",
    ...project.scenes.flatMap((scene) => [
      `file ./assets/${scene.id}.mp4`,
      `duration ${scene.duration.toFixed(1)}`,
    ]),
  ].join("\n");
}

function buildPackageReadme(project: ShortsProject): string {
  const manifest = makeRenderManifest(project);

  return [
    "Shorts Studio Render Package",
    "",
    `Title: ${project.brief.title}`,
    `Project ID: ${project.id}`,
    `Duration: ${project.brief.targetDuration}s`,
    `Scenes: ${project.scenes.length}`,
    `QA Overall: ${project.qa.qualitative.overall}`,
    `Execution Mode: ${project.runtime.mode}`,
    `Cost Model: ${project.runtime.costModel}`,
    "",
    "Included files:",
    "- project.json: editable project state",
    "- render-manifest.json: renderer-facing manifest",
    "- subtitles.srt: subtitle timeline",
    "- ffmpeg-concat.txt: concat template for FFmpeg assets",
    "- README.txt: package notes",
    "",
    "Runtime profile:",
    `- FFmpeg: ${project.runtime.ffmpeg}`,
    `- Script: ${project.runtime.scriptProvider}`,
    `- QA: ${project.runtime.qaProvider}`,
    `- TTS: ${project.runtime.ttsProvider}`,
    `- Media: ${project.runtime.mediaProvider}`,
    ...project.runtime.install.map((item) => `- ${item}`),
    "",
    "Scene summary:",
    ...manifest.scenes.map(
      (scene, index) =>
        `${index + 1}. [${scene.role}] ${scene.duration.toFixed(1)}s | ${scene.mediaQuery} | ${scene.text}`,
    ),
  ].join("\n");
}

function formatSrtTimestamp(seconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${String(milliseconds).padStart(3, "0")}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
