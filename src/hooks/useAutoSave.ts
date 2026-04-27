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
 *
 * The interval is fully torn down when `enabled` flips to false or `intervalMs`
 * changes — preventing stale/duplicate timers.
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
	const valueRef = useRef<T>(value);
	valueRef.current = value;
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;

	useEffect(() => {
		if (!enabled) return;

		function flush(next: T) {
			savedRef.current = next;
			lastSaveAtRef.current = Date.now();
			void onSaveRef.current(next);
		}

		// Schedule debounced flush whenever value differs from last save.
		if (!Object.is(savedRef.current, value)) {
			if (debounceTimerRef.current !== null) {
				window.clearTimeout(debounceTimerRef.current);
			}
			debounceTimerRef.current = window.setTimeout(() => {
				flush(valueRef.current);
				debounceTimerRef.current = null;
			}, debounceMs);
		}

		return () => {
			if (debounceTimerRef.current !== null) {
				window.clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
		};
	}, [value, debounceMs, enabled]);

	useEffect(() => {
		if (!enabled) return;
		const tickInterval = Math.min(intervalMs, 5_000);

		const id = window.setInterval(() => {
			const now = Date.now();
			if (
				now - lastSaveAtRef.current >= intervalMs &&
				!Object.is(savedRef.current, valueRef.current)
			) {
				savedRef.current = valueRef.current;
				lastSaveAtRef.current = now;
				void onSaveRef.current(valueRef.current);
			}
		}, tickInterval);

		return () => window.clearInterval(id);
	}, [intervalMs, enabled]);
}
