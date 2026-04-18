import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { promisify } from "node:util";
import type { Language } from "../types";

const execFileAsync = promisify(execFile);

/** Run a command with stdin input piped to it. */
function spawnWithInput(
  cmd: string,
  args: string[],
  input: string,
  timeout = 60000,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => { stdout += d; });
    child.stderr?.on("data", (d) => { stderr += d; });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Exit code ${code}`));
    });

    child.stdin?.write(input);
    child.stdin?.end();
  });
}

/** Piper voice models — name → onnx model identifier */
const VOICE_MODELS: Record<Language, Record<string, string>> = {
  ko: {
    default: "ko_KR-kss-low",
  },
  en: {
    default: "en_US-lessac-medium",
    female: "en_US-amy-medium",
    male: "en_US-lessac-medium",
  },
};

let piperAvailable: boolean | null = null;

/**
 * Check whether `piper` CLI is installed and available.
 */
export async function isPiperAvailable(): Promise<boolean> {
  if (piperAvailable !== null) return piperAvailable;

  try {
    const command = process.platform === "win32" ? "where" : "which";
    await execFileAsync(command, ["piper"], {
      timeout: 5000,
      windowsHide: true,
    });
    piperAvailable = true;
  } catch {
    piperAvailable = false;
  }

  return piperAvailable;
}

/** Reset cached availability (for testing) */
export function resetPiperCache(): void {
  piperAvailable = null;
}

export interface PiperTTSOptions {
  text: string;
  outputPath: string;
  language: Language;
  speed?: number;
  /** Silence between sentences in seconds */
  sentenceSilence?: number;
}

/**
 * Synthesize speech using Piper TTS.
 * Cross-platform: works on macOS, Linux, Windows.
 * Requires `piper` CLI installed (`pip install piper-tts`).
 */
export async function synthesizeWithPiper(
  options: PiperTTSOptions,
): Promise<{ voice: string; durationEstimate: number }> {
  const available = await isPiperAvailable();
  if (!available) {
    throw new Error(
      "Piper TTS가 설치되어 있지 않습니다. `pip install piper-tts`로 설치해 주세요.",
    );
  }

  const model = resolveModel(options.language);
  const lengthScale = mapSpeedToLengthScale(options.speed ?? 1);
  const sentenceSilence = options.sentenceSilence ?? 0.3;

  try {
    await spawnWithInput(
      "piper",
      [
        "--model",
        model,
        "--length-scale",
        lengthScale.toFixed(2),
        "--sentence-silence",
        sentenceSilence.toFixed(2),
        "--output_file",
        options.outputPath,
      ],
      options.text,
      60000,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Model not downloaded? Try with --download-dir
    if (msg.includes("model") || msg.includes("not found")) {
      throw new Error(
        `Piper 음성 모델 "${model}"을 찾을 수 없습니다. ` +
          `\`piper --model ${model} --download-dir ~/.piper/models\`로 다운로드해 주세요.`,
      );
    }

    throw new Error(`Piper TTS 실패: ${msg}`);
  }

  // Verify output exists
  try {
    await fs.access(options.outputPath);
  } catch {
    throw new Error("Piper TTS 출력 파일이 생성되지 않았습니다.");
  }

  // Estimate duration based on text length
  const durationEstimate = estimateDuration(
    options.text,
    options.language,
    options.speed ?? 1,
  );

  return { voice: model, durationEstimate };
}

/**
 * List available Piper models (installed locally).
 */
export async function listPiperModels(): Promise<string[]> {
  const available = await isPiperAvailable();
  if (!available) return [];

  try {
    const { stdout } = await execFileAsync("piper", ["--help"], {
      timeout: 5000,
      windowsHide: true,
    });
    // Piper doesn't have a list command, so just return known models
    return Object.values(VOICE_MODELS)
      .flatMap((models) => Object.values(models));
  } catch {
    return [];
  }
}

function resolveModel(language: Language): string {
  const models = VOICE_MODELS[language] ?? VOICE_MODELS.en;
  return models.default;
}

/**
 * Map app speed (0.8–1.2) to Piper length_scale.
 * length_scale < 1 = faster, > 1 = slower (inverse of speed).
 */
function mapSpeedToLengthScale(speed: number): number {
  const clamped = Math.max(0.5, Math.min(2.0, speed));
  return 1 / clamped;
}

/**
 * Rough duration estimate based on character count.
 * Korean: ~4–5 chars/sec, English: ~12–15 chars/sec at 1x speed.
 */
function estimateDuration(
  text: string,
  language: Language,
  speed: number,
): number {
  const charsPerSecond = language === "ko" ? 5 : 14;
  const chars = text.replace(/\s+/g, "").length;
  return chars / (charsPerSecond * speed);
}
