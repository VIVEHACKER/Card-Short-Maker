import type { TTSRequest, TTSResponse } from "../types";

interface LocalTTSStatus {
  piper: boolean;
  platform: string;
  fallback: string;
}

let cachedStatus: LocalTTSStatus | null = null;

/**
 * Check if local TTS is available (Piper or platform fallback).
 * Calls the Vite dev server plugin at /api/local-tts/status.
 */
export async function isLocalTTSAvailable(): Promise<boolean> {
  try {
    const status = await getLocalTTSStatus();
    return status.piper || status.fallback !== "none";
  } catch {
    return false;
  }
}

export async function getLocalTTSStatus(): Promise<LocalTTSStatus> {
  if (cachedStatus) return cachedStatus;

  try {
    const res = await fetch("/api/local-tts/status", { method: "GET" });
    if (!res.ok) return { piper: false, platform: "unknown", fallback: "none" };
    cachedStatus = (await res.json()) as LocalTTSStatus;
    return cachedStatus;
  } catch {
    return { piper: false, platform: "unknown", fallback: "none" };
  }
}

/** Reset cached status (for testing) */
export function resetLocalTTSCache(): void {
  cachedStatus = null;
}

/**
 * Generate TTS using the local Piper/macOS/SAPI backend.
 * Communicates via the Vite dev server plugin.
 */
export async function localTTS(
  request: TTSRequest,
  signal?: AbortSignal,
): Promise<TTSResponse> {
  const res = await fetch("/api/local-tts/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: request.text,
      language: request.language,
      speed: request.speed,
    }),
    signal,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Local TTS failed" }));
    throw new Error(
      (error as { error?: string }).error ?? "로컬 TTS 실패",
    );
  }

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  // Estimate duration
  const charsPerSecond = request.language === "ko" ? 5 : 14;
  const chars = request.text.replace(/\s+/g, "").length;
  const durationSeconds = chars / (charsPerSecond * (request.speed || 1));

  const status = await getLocalTTSStatus();
  const providerLabel = status.piper ? "piper" : status.fallback;

  return {
    audioUrl,
    durationSeconds,
    provider: "openai", // Type constraint — actual provider in sourceHint
    _localProvider: providerLabel,
  } as TTSResponse & { _localProvider: string };
}
