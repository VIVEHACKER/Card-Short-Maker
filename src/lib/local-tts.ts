import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Language } from "../types";

const execFileAsync = promisify(execFile);

export async function getInstalledWindowsVoices(): Promise<string[]> {
	const command = [
		"Add-Type -AssemblyName System.Speech",
		"$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
		"$s.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }",
	].join("; ");

	const { stdout } = await execFileAsync(
		"powershell",
		["-NoProfile", "-Command", command],
		{
			windowsHide: true,
		},
	);

	return stdout
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

export async function synthesizeSceneAudio(options: {
	text: string;
	outputPath: string;
	language: Language;
	preferredVoice?: string;
	speed?: number;
}): Promise<{ voice: string }> {
	const voices = await getInstalledWindowsVoices();
	const voice = pickVoice(voices, options.language, options.preferredVoice);
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

function pickVoice(
	voices: string[],
	language: Language,
	preferredVoice?: string,
): string {
	if (preferredVoice && voices.includes(preferredVoice)) {
		return preferredVoice;
	}

	if (language === "ko") {
		return (
			voices.find((voice) => /Heami|Korean|Ko/i.test(voice)) ??
			voices[0] ??
			"Microsoft Heami Desktop"
		);
	}

	return (
		voices.find((voice) => /Zira|David|English/i.test(voice)) ??
		voices[0] ??
		"Microsoft Zira Desktop"
	);
}

function mapSpeedToSapiRate(speed: number): number {
	const normalized = Math.round((speed - 1) * 20);
	return Math.max(-5, Math.min(5, normalized));
}
