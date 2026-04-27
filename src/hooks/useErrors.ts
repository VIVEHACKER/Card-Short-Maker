import { useCallback, useState } from "react";
import type { ErrorBannerEntry } from "../components/ErrorBanner";

export function useErrors() {
	const [errors, setErrors] = useState<ErrorBannerEntry[]>([]);

	const push = useCallback((entry: Omit<ErrorBannerEntry, "id">) => {
		const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		setErrors((prev) => [...prev, { ...entry, id }]);
		return id;
	}, []);

	const dismiss = useCallback((id: string) => {
		setErrors((prev) => prev.filter((e) => e.id !== id));
	}, []);

	const clear = useCallback(() => {
		setErrors([]);
	}, []);

	return { errors, push, dismiss, clear };
}
