export function hasUsableScript(script: string, expectedLines: number): boolean {
	const trimmed = script.trim();
	if (!trimmed || trimmed.length < 60) {
		return false;
	}

	const lines = trimmed
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);
	const minLines = Math.max(4, Math.min(expectedLines, 6));
	if (lines.length < minLines) {
		return false;
	}

	const normalizedLines = lines.map((line) =>
		line.replace(/[.!?]+$/g, "").toLowerCase(),
	);
	const uniqueLineCount = new Set(normalizedLines).size;
	if (uniqueLineCount < Math.max(3, Math.floor(lines.length * 0.65))) {
		return false;
	}

	if (/\b(1[.)]|2[.)]|3[.)]|hook|build|payoff|cta)\b/i.test(trimmed)) {
		return false;
	}

	return true;
}
