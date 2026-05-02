import { describe, expect, it } from "vitest";
import { isRejectedCommonsPhotoTitle, searchPicsumPhotos } from "./no-key";

describe("no-key stock sources", () => {
	it("builds deterministic portrait photo urls without API keys", async () => {
		const response = await searchPicsumPhotos({
			query: "월급 저축 카드값",
			orientation: "portrait",
			type: "photo",
			perPage: 2,
			language: "ko",
		});

		expect(response.provider).toBe("picsum");
		expect(response.results).toHaveLength(2);
		expect(response.results[0]?.url).toMatch(/^https:\/\/picsum\.photos\/seed\//);
		expect(response.results[0]?.height).toBeGreaterThan(response.results[0]?.width ?? 0);
	});

	it("does not claim video support for no-key photo fallback", async () => {
		const response = await searchPicsumPhotos({
			query: "finance",
			type: "video",
		});

		expect(response.results).toEqual([]);
	});

	it("rejects semantically bad Commons matches for finance cards", () => {
		expect(isRejectedCommonsPhotoTitle("File:Swear jar full of coins.jpg")).toBe(true);
		expect(isRejectedCommonsPhotoTitle("File:Saving money in a jar.jpg")).toBe(false);
	});
});
