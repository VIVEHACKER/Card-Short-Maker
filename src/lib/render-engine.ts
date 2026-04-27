import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegStatic from "ffmpeg-static";
import { buildSrt } from "./render-package";
import { synthesizeSceneAudio } from "./local-tts";
import type { Scene, ShortsProject } from "../types";

const execFileAsync = promisify(execFile);

export interface RenderProjectOptions {
	project: ShortsProject;
	outDir: string;
	outputFile?: string;
	ffmpegPath?: string;
	withTts?: boolean;
}

export async function renderProjectToMp4(
	options: RenderProjectOptions,
): Promise<{
	outputFile: string;
	workspaceDir: string;
}> {
	const ffmpeg = await resolveFfmpegPath(options.ffmpegPath);
	const outputDir = path.resolve(options.outDir);
	const workspaceDir = path.join(outputDir, "_render");
	const scenesDir = path.join(workspaceDir, "scenes");
	const segmentsDir = path.join(workspaceDir, "segments");
	const audioDir = path.join(workspaceDir, "audio");

	await fs.mkdir(scenesDir, { recursive: true });
	await fs.mkdir(segmentsDir, { recursive: true });
	await fs.mkdir(audioDir, { recursive: true });

	await fs.writeFile(
		path.join(workspaceDir, "subtitles.srt"),
		buildSrt(options.project),
		"utf8",
	);

	const fontFile = await resolveFontFile();
	const segmentPaths: string[] = [];

	for (const scene of options.project.scenes) {
		const sceneDir = path.join(scenesDir, scene.id);
		await fs.mkdir(sceneDir, { recursive: true });

		const textFiles = await writeSceneTextFiles(
			sceneDir,
			options.project,
			scene,
		);
		const filterFile = path.join(sceneDir, "filters.txt");
		await fs.writeFile(
			filterFile,
			buildFilterGraph({
				accent: options.project.accent,
				fontFile,
				titleFile: textFiles.titleFile,
				sceneFile: textFiles.sceneFile,
				roleFile: textFiles.roleFile,
				subtitleFile: textFiles.subtitleFile,
			}),
			"utf8",
		);

		let audioInput = createSilentAudioInput();

		if (options.withTts !== false) {
			const audioPath = path.join(audioDir, `${scene.id}.wav`);
			const { voice } = await synthesizeSceneAudio({
				text: scene.text,
				outputPath: audioPath,
				language: options.project.brief.language,
				preferredVoice:
					options.project.brief.language === "ko"
						? "Microsoft Heami Desktop"
						: undefined,
				speed: scene.voice.speed,
			});

			audioInput = { args: ["-i", audioPath], voice };
		}

		const segmentPath = path.join(
			segmentsDir,
			`${scene.index.toString().padStart(2, "0")}-${scene.id}.mp4`,
		);
		await renderSceneSegment({
			ffmpeg,
			scene,
			filterFile,
			audioArgs: audioInput.args,
			outputPath: segmentPath,
		});

		segmentPaths.push(segmentPath);
	}

	const concatFile = path.join(workspaceDir, "segments.txt");
	await fs.writeFile(
		concatFile,
		segmentPaths
			.map((segment) => `file '${segment.replace(/'/g, "'\\''")}'`)
			.join("\n"),
		"utf8",
	);

	const outputFile = path.resolve(
		options.outputFile ??
			path.join(outputDir, `${slugify(options.project.brief.title)}.mp4`),
	);
	await execFileAsync(
		ffmpeg,
		[
			"-y",
			"-f",
			"concat",
			"-safe",
			"0",
			"-i",
			concatFile,
			"-c",
			"copy",
			outputFile,
		],
		{ windowsHide: true },
	);

	return { outputFile, workspaceDir };
}

async function renderSceneSegment(options: {
	ffmpeg: string;
	scene: Scene;
	filterFile: string;
	audioArgs: string[];
	outputPath: string;
}) {
	const duration = options.scene.duration.toFixed(1);

	await execFileAsync(
		options.ffmpeg,
		[
			"-y",
			"-f",
			"lavfi",
			"-i",
			`color=c=0x111111:s=1080x1920:d=${duration}`,
			...options.audioArgs,
			"-filter_complex_script",
			options.filterFile,
			"-map",
			"[v]",
			"-map",
			"[a]",
			"-t",
			duration,
			"-r",
			"30",
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-c:a",
			"aac",
			"-ar",
			"44100",
			"-ac",
			"2",
			options.outputPath,
		],
		{ windowsHide: true },
	);
}

async function writeSceneTextFiles(
	baseDir: string,
	project: ShortsProject,
	scene: Scene,
) {
	const titleFile = path.join(baseDir, "title.txt");
	const sceneFile = path.join(baseDir, "scene.txt");
	const roleFile = path.join(baseDir, "role.txt");
	const subtitleFile = path.join(baseDir, "subtitle.txt");

	await fs.writeFile(titleFile, project.brief.title, "utf8");
	await fs.writeFile(
		sceneFile,
		wrapText(scene.text, project.brief.language === "ko" ? 12 : 18).join("\n"),
		"utf8",
	);
	await fs.writeFile(
		roleFile,
		`${scene.index}. ${scene.role.toUpperCase()}`,
		"utf8",
	);
	await fs.writeFile(subtitleFile, scene.subtitles.lines.join("\n"), "utf8");

	return { titleFile, sceneFile, roleFile, subtitleFile };
}

function buildFilterGraph(options: {
	accent: string;
	fontFile: string;
	titleFile: string;
	sceneFile: string;
	roleFile: string;
	subtitleFile: string;
}) {
	const accent = normalizeColor(options.accent);
	const font = escapeFilterValue(options.fontFile);
	const titleFile = escapeFilterValue(options.titleFile);
	const sceneFile = escapeFilterValue(options.sceneFile);
	const roleFile = escapeFilterValue(options.roleFile);
	const subtitleFile = escapeFilterValue(options.subtitleFile);

	return [
		`[0:v]drawbox=x=38:y=38:w=1004:h=1844:color=white@0.05:t=fill,` +
			`drawbox=x=38:y=38:w=1004:h=154:color=${accent}@0.95:t=fill,` +
			`drawbox=x=86:y=1550:w=908:h=212:color=black@0.36:t=fill,` +
			`drawtext=fontfile='${font}':textfile='${titleFile}':fontcolor=0x111111:fontsize=46:x=(w-text_w)/2:y=84,` +
			`drawtext=fontfile='${font}':textfile='${sceneFile}':fontcolor=white:fontsize=78:line_spacing=16:x=96:y=344,` +
			`drawtext=fontfile='${font}':textfile='${roleFile}':fontcolor=${accent}:fontsize=30:x=(w-text_w)/2:y=1470,` +
			`drawtext=fontfile='${font}':textfile='${subtitleFile}':fontcolor=white:fontsize=42:line_spacing=12:x=(w-text_w)/2:y=1608[v];` +
			`[1:a]apad=pad_dur=2[a]`,
	].join("\n");
}

function createSilentAudioInput() {
	return {
		args: [
			"-f",
			"lavfi",
			"-i",
			"anullsrc=channel_layout=stereo:sample_rate=44100",
		],
		voice: "silent",
	};
}

async function resolveFfmpegPath(explicitPath?: string) {
	if (explicitPath) {
		return path.resolve(explicitPath);
	}

	if (ffmpegStatic) {
		return ffmpegStatic;
	}

	try {
		const command = process.platform === "win32" ? "where" : "which";
		const target = process.platform === "win32" ? "ffmpeg" : "ffmpeg";
		const { stdout } = await execFileAsync(command, [target], {
			windowsHide: true,
		});
		const first = stdout
			.split(/\r?\n/)
			.map((line) => line.trim())
			.find(Boolean);

		if (!first) {
			throw new Error();
		}

		return first;
	} catch {
		throw new Error(
			"FFmpeg를 찾지 못했습니다. Windows에서는 ffmpeg.exe를 PATH에 추가하거나 --ffmpeg 옵션으로 경로를 넘겨주세요. / FFmpeg was not found. Add ffmpeg.exe to PATH or pass --ffmpeg.",
		);
	}
}

async function resolveFontFile() {
	const candidates =
		process.platform === "win32"
			? [
					"C:/Windows/Fonts/malgun.ttf",
					"C:/Windows/Fonts/segoeui.ttf",
					"C:/Windows/Fonts/arial.ttf",
				]
			: [
					"/System/Library/Fonts/AppleSDGothicNeo.ttc",
					"/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
					"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
					"/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
				];

	for (const candidate of candidates) {
		try {
			await fs.access(candidate);
			return candidate;
		} catch {
			// try next candidate
		}
	}

	throw new Error(
		"렌더에 사용할 폰트를 찾지 못했습니다. malgun.ttf 또는 DejaVuSans.ttf 계열 폰트를 설치해주세요. / A usable font was not found for rendering.",
	);
}

export function wrapText(text: string, maxCompactLength: number) {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (compactLength(candidate) <= maxCompactLength) {
			current = candidate;
			continue;
		}

		if (current) {
			lines.push(current);
		}

		current = word;
	}

	if (current) {
		lines.push(current);
	}

	return lines.slice(0, 4);
}

function compactLength(value: string) {
	return value.replace(/\s+/g, "").length;
}

export function normalizeColor(value: string) {
	return value.replace("#", "0x");
}

export function escapeFilterValue(value: string) {
	return value.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export function slugify(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-");
}
