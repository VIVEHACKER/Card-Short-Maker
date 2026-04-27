import { useEffect } from "react";

export interface ShortcutBinding {
	/** key as reported by KeyboardEvent.key — case-insensitive. */
	key: string;
	meta?: boolean;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	/** When true, runs even if focus is in an input/textarea. */
	allowInInput?: boolean;
	handler: (event: KeyboardEvent) => void;
	preventDefault?: boolean;
}

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingContext(event: KeyboardEvent): boolean {
	const target = event.target as HTMLElement | null;
	if (!target) return false;
	if (target.isContentEditable) return true;
	return TYPING_TAGS.has(target.tagName);
}

function matches(event: KeyboardEvent, b: ShortcutBinding): boolean {
	if (event.key.toLowerCase() !== b.key.toLowerCase()) return false;
	if (Boolean(b.meta) !== event.metaKey) return false;
	if (Boolean(b.ctrl) !== event.ctrlKey) return false;
	if (Boolean(b.shift) !== event.shiftKey) return false;
	if (Boolean(b.alt) !== event.altKey) return false;
	return true;
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const typing = isTypingContext(event);
			for (const binding of bindings) {
				if (!matches(event, binding)) continue;
				if (typing && !binding.allowInInput) continue;
				if (binding.preventDefault !== false) event.preventDefault();
				binding.handler(event);
				return;
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [bindings]);
}
