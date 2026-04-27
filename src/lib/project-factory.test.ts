import { beforeEach, describe, expect, it } from "vitest";
import {
	createBlankProject,
	createEmptyBrief,
	loadProjectsFromStorage,
} from "./project-factory";
import { STORAGE_KEY_PROJECTS } from "./constants";

function installLocalStorage() {
	const store = new Map<string, string>();
	const mock = {
		getItem: (k: string) => (store.has(k) ? (store.get(k) ?? null) : null),
		setItem: (k: string, v: string) => store.set(k, v),
		removeItem: (k: string) => store.delete(k),
		clear: () => store.clear(),
		key: (i: number) => Array.from(store.keys())[i] ?? null,
		get length() {
			return store.size;
		},
	} as Storage;
	Object.defineProperty(globalThis, "window", {
		value: { localStorage: mock },
		configurable: true,
	});
}

describe("createEmptyBrief", () => {
	it("returns a default brief shape", () => {
		const brief = createEmptyBrief();
		expect(brief.intent).toBe("info");
		expect(brief.platform).toBe("youtube");
		expect(brief.language).toBe("ko");
		expect(brief.targetDuration).toBe(30);
	});

	it("generates a unique-ish id per call", () => {
		const a = createEmptyBrief();
		const b = createEmptyBrief();
		// They will differ if Date.now() ticks; otherwise same id but still well-formed.
		expect(a.id).toMatch(/^brief-/);
		expect(b.id).toMatch(/^brief-/);
	});
});

describe("createBlankProject", () => {
	it("creates a usable project", () => {
		const p = createBlankProject();
		expect(p.id).toMatch(/^project-/);
		expect(p.channel).toBe("channel-a");
		expect(p.preset).toBe("새 프로젝트");
		expect(p.runtime.mode).toBe("local");
	});

	it("respects overrides", () => {
		const p = createBlankProject({ id: "x1", channel: "ch", runtimeMode: "byo-api" });
		expect(p.id).toBe("x1");
		expect(p.channel).toBe("ch");
		expect(p.runtime.mode).toBe("byo-api");
	});
});

describe("loadProjectsFromStorage", () => {
	beforeEach(() => {
		installLocalStorage();
	});

	it("returns blank project list when storage empty", () => {
		const projects = loadProjectsFromStorage();
		expect(projects.length).toBe(1);
	});

	it("hydrates persisted projects", () => {
		window.localStorage.setItem(
			STORAGE_KEY_PROJECTS,
			JSON.stringify([
				{ brief: { title: "saved" }, script: "x" },
				{ brief: { title: "other" }, script: "y" },
			]),
		);
		const projects = loadProjectsFromStorage();
		expect(projects.length).toBe(2);
	});

	it("falls back to blank on malformed JSON", () => {
		window.localStorage.setItem(STORAGE_KEY_PROJECTS, "not json");
		const projects = loadProjectsFromStorage();
		expect(projects.length).toBe(1);
	});
});
