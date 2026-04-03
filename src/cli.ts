import { promises as fs } from "node:fs";
import path from "node:path";
import { createProjectFromBrief, recalculateProject } from "./lib/pipeline";
import { hydrateProject, parseBriefPayload } from "./lib/project-io";
import { renderProjectToMp4 } from "./lib/render-engine";
import { buildRenderPackage } from "./lib/render-package";
import type { ExecutionMode } from "./types";

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  const options = parseArgs(argv);

  if (!command || command === "help" || options.help) {
    printHelp();
    return;
  }

  if (command === "generate") {
    await generateProject(options);
    return;
  }

  if (command === "qa") {
    await qaProject(options);
    return;
  }

  if (command === "package") {
    await packageProject(options);
    return;
  }

  if (command === "render") {
    await renderProject(options);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function generateProject(options: CliOptions) {
  const briefPath = requireOption(options, "brief");
  const briefPayload = parseBriefPayload(await readJson(briefPath));
  const script =
    (typeof options.script === "string" ? await fs.readFile(resolveInput(options.script), "utf8") : "") ||
    briefPayload.script;
  const project = createProjectFromBrief(briefPayload.brief, script, {
    id: `cli-${Date.now()}`,
    channel: "cli",
    preset: "CLI",
    runtimeMode: parseMode(options.mode, briefPayload.runtimeMode),
  });

  const output = resolveOutput(
    options.out,
    path.join(path.dirname(resolveInput(briefPath)), `${slugify(project.brief.title)}-project.json`),
  );

  await writeJson(output, project);
  console.log(`Generated project: ${output}`);
  console.log(`Scenes: ${project.scenes.length} | QA: ${project.qa.qualitative.overall}`);
  console.log(`Mode: ${project.runtime.mode}`);
}

async function qaProject(options: CliOptions) {
  const projectPath = requireOption(options, "project");
  const project = hydrateProject(await readJson(projectPath));
  const refreshed = recalculateProject(project);

  if (options.json) {
    console.log(JSON.stringify(refreshed.qa, null, 2));
    return;
  }

  console.log(`Title: ${refreshed.brief.title}`);
  console.log(`Overall: ${refreshed.qa.qualitative.overall}`);
  console.log(`Verdict: ${refreshed.qa.verdict}`);
  console.log(`Issues: ${refreshed.qa.issues.length || 0}`);

  for (const issue of refreshed.qa.issues) {
    console.log(`- ${issue}`);
  }
}

async function packageProject(options: CliOptions) {
  const projectPath = requireOption(options, "project");
  const project = hydrateProject(await readJson(projectPath));
  const renderPackage = buildRenderPackage(project);
  const outputDir = resolveOutput(
    options.out,
    path.join(path.dirname(resolveInput(projectPath)), `${slugify(project.brief.title)}-render-pack`),
  );

  await fs.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, "project.json"), project);
  await writeJson(path.join(outputDir, "render-manifest.json"), renderPackage.manifest);
  await fs.writeFile(path.join(outputDir, "subtitles.srt"), renderPackage.subtitlesSrt, "utf8");
  await fs.writeFile(path.join(outputDir, "ffmpeg-concat.txt"), renderPackage.ffmpegConcat, "utf8");
  await fs.writeFile(path.join(outputDir, "README.txt"), renderPackage.readme, "utf8");

  console.log(`Render package created at: ${outputDir}`);
}

async function renderProject(options: CliOptions) {
  const projectPath = requireOption(options, "project");
  const project = hydrateProject(await readJson(projectPath));
  const outDir = resolveOutput(options.out, path.join(path.dirname(resolveInput(projectPath)), "render-output"));
  const outputFile =
    typeof options.output === "string" && options.output.trim()
      ? path.resolve(process.cwd(), options.output)
      : path.join(outDir, `${slugify(project.brief.title)}.mp4`);

  const result = await renderProjectToMp4({
    project,
    outDir,
    outputFile,
    ffmpegPath: typeof options.ffmpeg === "string" ? options.ffmpeg : undefined,
    withTts: options["no-tts"] ? false : true,
  });

  console.log(`Rendered MP4: ${result.outputFile}`);
  console.log(`Workspace: ${result.workspaceDir}`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2) as keyof CliOptions;
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function parseMode(value: string | boolean | undefined, fallback: ExecutionMode): ExecutionMode {
  return value === "byo-api" || value === "hybrid" || value === "local" ? value : fallback;
}

function requireOption(options: CliOptions, key: keyof CliOptions): string {
  const value = options[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required option --${String(key)}`);
  }

  return value;
}

function resolveInput(filePath: string): string {
  return path.resolve(process.cwd(), filePath);
}

function resolveOutput(filePath: string | boolean | undefined, fallback: string): string {
  return typeof filePath === "string" && filePath.trim() ? path.resolve(process.cwd(), filePath) : fallback;
}

async function readJson(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(resolveInput(filePath), "utf8");
  return JSON.parse(raw) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-");
}

function printHelp() {
  console.log(`Card Short Maker CLI

Commands:
  generate --brief ./examples/sample-brief.json [--script ./script.txt] [--mode local|byo-api|hybrid] [--out ./project.json]
  qa --project ./project.json [--json]
  package --project ./project.json [--out ./render-pack]
  render --project ./project.json [--out ./render-output] [--output ./video.mp4] [--ffmpeg C:\\ffmpeg\\bin\\ffmpeg.exe] [--no-tts]
`);
}

type CliOptions = Partial<
  Record<"brief" | "script" | "out" | "output" | "project" | "mode" | "ffmpeg" | "json" | "help" | "no-tts", string | boolean>
>;

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
