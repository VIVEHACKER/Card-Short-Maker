import { useEffect, useRef } from "react";

export interface AutoSaveOptions<T> {
	value: T;
	intervalMs?: number;
	debounceMs?: number;
	onSave: (value: T) => void | Promise<void>;
	enabled?: boolean;
}

/**
 * Debounce-and-interval hybrid: saves on every change after debounceMs of quiet,
 * and additionally enforces a maximum gap (intervalMs) between saves.
 */
export function useAutoSave<T>({
	value,
	intervalMs = 30_000,
	debounceMs = 1_500,
	onSave,
	enabled = true,
}: AutoSaveOptions<T>): void {
	const savedRef = useRef<T>(value);
	const lastSaveAtRef = useRef<number>(Date.now());
	const debounceTimerRef = useRef<number | null>(null);
	const intervalTimerRef = useRef<number | null>(null);
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;

	useEffect(() => {
		if (!enabled) return;
		if (Object.is(savedRef.current, value)) return;

		const flush = () => {
			savedRef.current = value;
			lastSaveAtRef.current = Date.now();
			void onSaveRef.current(value);
		};

		if (debounceTimerRef.current !== null) {
			window.clearTimeout(debounceTimerRef.current);
		}
		debounceTimerRef.current = window.setTimeout(flush, debounceMs);

		if (intervalTimerRef.current === null) {
			intervalTimerRef.current = window.setInterval(() => {
				const now = Date.now();
				if (
					now - lastSaveAtRef.current >= intervalMs &&
					!Object.is(savedRef.current, value)
				) {
					flush();
				}
			}, Math.min(intervalMs, 5_000));
		}

		return () => {
			if (debounceTimerRef.current !== null) {
				window.clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
		};
	}, [value, debounceMs, intervalMs, enabled]);

	useEffect(() => {
		return () => {
			if (intervalTimerRef.current !== null) {
				window.clearInterval(intervalTimerRef.current);
				intervalTimerRef.current = null;
			}
		};
	}, []);
}
