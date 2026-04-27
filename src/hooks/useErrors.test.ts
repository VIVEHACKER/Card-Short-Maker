import { describe, expect, it } from "vitest";
import {
	DEFAULT_MAX_ERRORS,
	WARN_AUTO_DISMISS_MS,
	INFO_AUTO_DISMISS_MS,
	autoDismissTimeout,
	reduceErrors,
} from "./useErrors";
import type { ErrorBannerEntry } from "../components/ErrorBanner";

const entry = (
	id: string,
	title: string,
	detail?: string,
	severity: ErrorBannerEntry["severity"] = "error",
): ErrorBannerEntry => ({ id, title, detail, severity });

describe("reduceErrors", () => {
	it("appends a new entry", () => {
		const next = reduceErrors([], entry("1", "boom"), 5);
		expect(next).toHaveLength(1);
		expect(next[0]?.title).toBe("boom");
	});

	it("dedupes when title+detail matches existing", () => {
		const prev = [entry("a", "x", "d1")];
		const next = reduceErrors(prev, entry("b", "x", "d1"), 5);
		expect(next).toHaveLength(1);
		expect(next[0]?.id).toBe("b"); // most recent wins
	});

	it("treats different details as distinct", () => {
		const prev = [entry("a", "x", "d1")];
		const next = reduceErrors(prev, entry("b", "x", "d2"), 5);
		expect(next).toHaveLength(2);
	});

	it("caps at max keeping most recent", () => {
		let list: ErrorBannerEntry[] = [];
		for (let i = 0; i < 10; i++) {
			list = reduceErrors(list, entry(String(i), `t${i}`), 3);
		}
		expect(list).toHaveLength(3);
		expect(list.map((e) => e.title)).toEqual(["t7", "t8", "t9"]);
	});
});

describe("autoDismissTimeout", () => {
	it("returns null for error severity", () => {
		expect(autoDismissTimeout("error")).toBeNull();
	});

	it("returns warn timeout for warn", () => {
		expect(autoDismissTimeout("warn")).toBe(WARN_AUTO_DISMISS_MS);
	});

	it("returns info timeout for info", () => {
		expect(autoDismissTimeout("info")).toBe(INFO_AUTO_DISMISS_MS);
	});
});

describe("DEFAULT_MAX_ERRORS", () => {
	it("is a small positive integer", () => {
		expect(DEFAULT_MAX_ERRORS).toBeGreaterThan(0);
		expect(DEFAULT_MAX_ERRORS).toBeLessThanOrEqual(10);
	});
});
