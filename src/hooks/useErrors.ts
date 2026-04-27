import { useCallback, useEffect, useRef, useState } from "react";
import type { ErrorBannerEntry } from "../components/ErrorBanner";

export const DEFAULT_MAX_ERRORS = 5;
export const WARN_AUTO_DISMISS_MS = 30_000;
export const INFO_AUTO_DISMISS_MS = 6_000;

export interface UseErrorsOptions {
	max?: number;
}

/** Pure reducer: append entry, dedupe by title+detail, cap to N most recent. */
export function reduceErrors(
	prev: ErrorBannerEntry[],
	incoming: ErrorBannerEntry,
	max: number,
): ErrorBannerEntry[] {
	const dedupKey = (e: Pick<ErrorBannerEntry, "title" | "detail">) =>
		`${e.title}::${e.detail ?? ""}`;
	const incomingKey = dedupKey(incoming);
	const filtered = prev.filter((e) => dedupKey(e) !== incomingKey);
	const next = [...filtered, incoming];
	return next.length > max ? next.slice(next.length - max) : next;
}

export function autoDismissTimeout(severity: ErrorBannerEntry["severity"]): number | null {
	if (severity === "warn") return WARN_AUTO_DISMISS_MS;
	if (severity === "info") return INFO_AUTO_DISMISS_MS;
	return null; // "error" stays until manual dismiss
}

export function useErrors(options: UseErrorsOptions = {}) {
	const max = options.max ?? DEFAULT_MAX_ERRORS;
	const [errors, setErrors] = useState<ErrorBannerEntry[]>([]);
	const timersRef = useRef<Map<string, number>>(new Map());

	const dismiss = useCallback((id: string) => {
		setErrors((prev) => prev.filter((e) => e.id !== id));
		const timer = timersRef.current.get(id);
		if (timer !== undefined) {
			window.clearTimeout(timer);
			timersRef.current.delete(id);
		}
	}, []);

	const push = useCallback(
		(entry: Omit<ErrorBannerEntry, "id">) => {
			const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
			const full: ErrorBannerEntry = { ...entry, id };
			setErrors((prev) => reduceErrors(prev, full, max));

			const timeout = autoDismissTimeout(entry.severity ?? "error");
			if (timeout !== null) {
				const timer = window.setTimeout(() => dismiss(id), timeout);
				timersRef.current.set(id, timer);
			}
			return id;
		},
		[max, dismiss],
	);

	const clear = useCallback(() => {
		setErrors([]);
		for (const timer of timersRef.current.values()) {
			window.clearTimeout(timer);
		}
		timersRef.current.clear();
	}, []);

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const timer of timers.values()) {
				window.clearTimeout(timer);
			}
			timers.clear();
		};
	}, []);

	return { errors, push, dismiss, clear };
}
