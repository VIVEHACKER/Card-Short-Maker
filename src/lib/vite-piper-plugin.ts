/**
 * Vite dev server plugin that exposes /api/local-tts endpoint.
 * Runs Piper TTS as a subprocess and returns WAV audio.
 * Falls back to macOS `say` if Piper is unavailable.
 */
import type { Plugin } from "vite";
import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function spawnWithInput(
  cmd: string,
  args: string[],
  input: string,
  timeout = 60000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
      windowsHide: true,
    });

    let stderr = "";
    child.stderr?.on("data", (d) => { stderr += d; });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Exit code ${code}`));
    });

    child.stdin?.write(input);
    child.stdin?.end();
  });
}

const VOICE_MODELS: Record<string, string> = {
  ko: "ko_KR-kss-low",
  en: "en_US-lessac-medium",
};

async function checkPiper(): Promise<boolean> {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    await execFileAsync(cmd, ["piper"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function piperTTSPlugin(): Plugin {
  let hasPiper = false;

  return {
    name: "piper-local-tts",
    configureServer(server) {
      // Check Piper availability on startup
      checkPiper().then((available) => {
        hasPiper = available;
        if (available) {
          console.log("  ✓ Piper TTS 감지됨 — /api/local-tts 활성화");
        } else {
          const fallback =
            process.platform === "darwin" ? "macOS say" : "없음";
          console.log(
            `  ⚠ Piper TTS 미설치 — 로컬 TTS 폴백: ${fallback}`,
          );
        }
      });

      server.middlewares.use("/api/local-tts/status", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            piper: hasPiper,
            platform: process.platform,
            fallback:
              process.platform === "darwin"
                ? "macos-say"
                : process.platform === "win32"
                  ? "windows-sapi"
                  : "none",
          }),
        );
      });

      server.middlewares.use("/api/local-tts/synthesize", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        try {
          const body = await readBody(req);
          const { text, language, speed } = JSON.parse(body) as {
            text: string;
            language?: string;
            speed?: number;
          };

          if (!text?.trim()) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "text is required" }));
            return;
          }

          const tmpDir = os.tmpdir();
          const tmpFile = path.join(
            tmpDir,
            `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`,
          );

          const lang = language === "ko" ? "ko" : "en";

          if (hasPiper) {
            await synthesizePiper(text, lang, speed ?? 1, tmpFile);
          } else if (process.platform === "darwin") {
            await synthesizeMacSay(text, lang, speed ?? 1, tmpFile);
          } else {
            res.statusCode = 503;
            res.end(
              JSON.stringify({
                error:
                  "로컬 TTS 사용 불가. pip install piper-tts로 설치해 주세요.",
              }),
            );
            return;
          }

          const audioBuffer = await fs.readFile(tmpFile);

          res.setHeader(
            "Content-Type",
            tmpFile.endsWith(".aiff")
              ? "audio/aiff"
              : "audio/wav",
          );
          res.setHeader("Content-Length", audioBuffer.length);
          res.end(audioBuffer);

          // Clean up temp file
          fs.unlink(tmpFile).catch(() => {});
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: msg }));
        }
      });
    },
  };
}

async function synthesizePiper(
  text: string,
  language: string,
  speed: number,
  outputPath: string,
): Promise<void> {
  const model = VOICE_MODELS[language] ?? VOICE_MODELS.en;
  const lengthScale = (1 / Math.max(0.5, Math.min(2, speed))).toFixed(2);

  await spawnWithInput(
    "piper",
    [
      "--model",
      model!,
      "--length-scale",
      lengthScale,
      "--sentence-silence",
      "0.3",
      "--output_file",
      outputPath,
    ],
    text,
    60000,
  );
}

async function synthesizeMacSay(
  text: string,
  language: string,
  speed: number,
  outputPath: string,
): Promise<void> {
  const voice = language === "ko" ? "Yuna" : "Samantha";
  const rate = Math.round(speed * 175);
  // macOS `say` outputs AIFF
  const aiffPath = outputPath.replace(/\.wav$/, ".aiff");

  try {
    await execFileAsync("say", ["-v", voice, "-r", String(rate), "-o", aiffPath, text], {
      timeout: 30000,
    });
  } catch {
    await execFileAsync("say", ["-r", String(rate), "-o", aiffPath, text], {
      timeout: 30000,
    });
  }

  // Rename back so the caller can find it
  if (aiffPath !== outputPath) {
    await fs.rename(aiffPath, outputPath).catch(() => {});
  }
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
