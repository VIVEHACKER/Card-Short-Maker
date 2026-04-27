/**
 * Shared helpers used by every AI provider.
 *
 * Extracted from openai.ts/google.ts/anthropic.ts to avoid duplicating
 * base64 decoding, image-URL resolution, text extraction, and duration
 * estimation across providers.
 */

import { KOREAN_CHARS_PER_SECOND } from "../../constants";

export function base64ToBlob(b64: string, mime: string): Blob {
	const bytes = atob(b64);
	const buffer = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) {
		buffer[i] = bytes.charCodeAt(i);
	}
	return new Blob([buffer], { type: mime });
}

export function base64ToObjectUrl(b64: string, mime: string): string {
	return URL.createObjectURL(base64ToBlob(b64, mime));
}

export interface ImageItemLike {
	b64_json?: string;
	b64?: string;
	url?: string;
}

/** Pull an image URL out of any of the common provider response shapes. */
export function resolveImageUrlFromItem(
	item: ImageItemLike | null | undefined,
	mime = "image/png",
): string {
	if (item?.url) return item.url;
	const raw = item?.b64_json ?? item?.b64;
	if (raw) return base64ToObjectUrl(raw, mime);
	throw new Error("이미지 응답에서 결과를 찾지 못했습니다.");
}

/** Extract text from either a plain string or a Claude / GPT-4o multipart array. */
export function extractTextContent(
	content:
		| string
		| Array<{ type?: string; text?: string }>
		| null
		| undefined,
): string {
	if (typeof content === "string") return content.trim();
	if (Array.isArray(content)) {
		return content
			.filter((part) => part.type === "text" || part.text)
			.map((part) => part.text ?? "")
			.join("\n")
			.trim();
	}
	return "";
}

/**
 * Estimate playback duration of TTS output.
 * Korean reading speed @ 1x ≈ KOREAN_CHARS_PER_SECOND. Speed scales linearly.
 */
export function estimateTtsDuration(text: string, speed: number): number {
	const chars = text.replace(/\s+/g, "").length;
	const safeSpeed = Math.max(0.25, speed);
	return Math.max(1, chars / (KOREAN_CHARS_PER_SECOND * safeSpeed));
}
