import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Language } from "../types";
import { isPiperAvailable, synthesizeWithPiper } from "./piper-tts";

const execFileAsync = promisify(execFile);

/**
 * Synthesize audio for a scene using the best available local TTS.
 * Priority: Piper (cross-platform, free) → Windows SAPI (Windows only).
 */
export async function synthesizeSceneAudio(options: {
	text: string;
	outputPath: string;
	language: Language;
	preferredVoice?: string;
	speed?: number;
}): Promise<{ voice: string }> {
	// Try Piper first (cross-platform)
	if (await isPiperAvailable()) {
		try {
			const result = await synthesizeWithPiper({
				text: options.text,
				outputPath: options.outputPath,
				language: options.language,
				speed: options.speed,
			});
			return { voice: `piper:${result.voice}` };
		} catch (error) {
			console.warn(
				"[TTS] Piper 실패, Windows SAPI 폴백 시도:",
				error instanceof Error ? error.message : error,
			);
		}
	}

	// Fallback to Windows SAPI
	if (process.platform === "win32") {
		return synthesizeWithWindowsSapi(options);
	}

	// macOS: try `say` command as last resort
	if (process.platform === "darwin") {
		return synthesizeWithMacSay(options);
	}

	throw new Error(
		"로컬 TTS를 사용할 수 없습니다. " +
			"`pip install piper-tts`로 Piper를 설치하거나, " +
			"AI 설정에서 클라우드 TTS 프로바이더를 설정해 주세요.",
	);
}

// ── Piper availability check (re-exported for external use) ──

export { isPiperAvailable } from "./piper-tts";

// ── Windows SAPI ──

export async function getInstalledWindowsVoices(): Promise<string[]> {
	if (process.platform !== "win32") return [];

	const command = [
		"Add-Type -AssemblyName System.Speech",
		"$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
		"$s.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }",
	].join("; ");

	const { stdout } = await execFileAsync(
		"powershell",
		["-NoProfile", "-Command", command],
		{ windowsHide: true },
	);

	return stdout
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

async function synthesizeWithWindowsSapi(options: {
	text: string;
	outputPath: string;
	language: Language;
	preferredVoice?: string;
	speed?: number;
}): Promise<{ voice: string }> {
	const voices = await getInstalledWindowsVoices();
	const voice = pickWindowsVoice(
		voices,
		options.language,
		options.preferredVoice,
	);
	const textBase64 = Buffer.from(options.text, "utf8").toString("base64");
	const outputBase64 = Buffer.from(options.outputPath, "utf8").toString(
		"base64",
	);
	const voiceBase64 = Buffer.from(voice, "utf8").toString("base64");
	const rate = mapSpeedToSapiRate(options.speed ?? 1);

	const command = [
		"Add-Type -AssemblyName System.Speech",
		`$text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${textBase64}'))`,
		`$out = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${outputBase64}'))`,
		`$voice = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${voiceBase64}'))`,
		"$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
		"if ($voice) { $s.SelectVoice($voice) }",
		`$s.Rate = ${rate}`,
		"$s.SetOutputToWaveFile($out)",
		"$s.Speak($text)",
		"$s.Dispose()",
	].join("; ");

	await execFileAsync("powershell", ["-NoProfile", "-Command", command], {
		windowsHide: true,
	});

	return { voice };
}

// ── macOS `say` command ──

async function synthesizeWithMacSay(options: {
	text: string;
	outputPath: string;
	language: Language;
	speed?: number;
}): Promise<{ voice: string }> {
	const voice = options.language === "ko" ? "Yuna" : "Samantha";
	const rate = Math.round((options.speed ?? 1) * 175);

	// `say` outputs AIFF by default; convert path to .aiff if needed
	const outPath = options.outputPath.replace(/\.wav$/, ".aiff");

	try {
		await execFileAsync(
			"say",
			["-v", voice, "-r", String(rate), "-o", outPath, options.text],
			{ timeout: 30000 },
		);
	} catch {
		// Fallback to default voice if specified voice not available
		await execFileAsync(
			"say",
			["-r", String(rate), "-o", outPath, options.text],
			{ timeout: 30000 },
		);
	}

	return { voice: `macos:${voice}` };
}

// ── Helpers ──

function pickWindowsVoice(
	voices: string[],
	language: Language,
	preferredVoice?: string,
): string {
	if (preferredVoice && voices.includes(preferredVoice)) {
		return preferredVoice;
	}

	if (language === "ko") {
		return (
			voices.find((v) => /Heami|Korean|Ko/i.test(v)) ??
			voices[0] ??
			"Microsoft Heami Desktop"
		);
	}

	return (
		voices.find((v) => /Zira|David|English/i.test(v)) ??
		voices[0] ??
		"Microsoft Zira Desktop"
	);
}

function mapSpeedToSapiRate(speed: number): number {
	const normalized = Math.round((speed - 1) * 20);
	return Math.max(-5, Math.min(5, normalized));
}
