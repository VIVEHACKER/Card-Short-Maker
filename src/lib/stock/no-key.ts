import type {
	StockMedia,
	StockSearchRequest,
	StockSearchResponse,
} from "./types";

interface CommonsPage {
	pageid: number;
	title: string;
	imageinfo?: Array<{
		url?: string;
		thumburl?: string;
		descriptionurl?: string;
		width?: number;
		height?: number;
		mime?: string;
		extmetadata?: {
			Artist?: { value?: string };
			Credit?: { value?: string };
		};
	}>;
}

export async function searchCommonsPhotos(
	request: StockSearchRequest,
	signal?: AbortSignal,
): Promise<StockSearchResponse> {
	if ((request.type ?? "photo") !== "photo") {
		return { provider: "commons", results: [], totalResults: 0 };
	}

	const queries = buildCommonsQueries(request.query);
	const results: StockMedia[] = [];

	for (const query of queries) {
		if (signal?.aborted || results.length >= (request.perPage ?? 5)) break;
		const params = new URLSearchParams({
			origin: "*",
			action: "query",
			format: "json",
			generator: "search",
			gsrnamespace: "6",
			gsrsearch: query,
			gsrlimit: "10",
			prop: "imageinfo",
			iiprop: "url|size|mime|extmetadata",
			iiurlwidth: "1080",
		});

		try {
			const res = await fetch(
				`https://commons.wikimedia.org/w/api.php?${params}`,
				{ signal },
			);
			if (!res.ok) continue;

			const data = (await res.json()) as {
				query?: { pages?: Record<string, CommonsPage> };
			};
			const pages = Object.values(data.query?.pages ?? {});

			for (const page of pages) {
				const media = mapCommonsPage(page);
				if (!media || results.some((item) => item.id === media.id)) continue;
				results.push(media);
				if (results.length >= (request.perPage ?? 5)) break;
			}
		} catch {
			// Commons is a best-effort no-key source; callers decide their fallback.
		}
	}

	return { provider: "commons", results, totalResults: results.length };
}

export async function searchPicsumPhotos(
	request: StockSearchRequest,
): Promise<StockSearchResponse> {
	if ((request.type ?? "photo") !== "photo") {
		return { provider: "picsum", results: [], totalResults: 0 };
	}

	const count = Math.max(1, Math.min(request.perPage ?? 3, 6));
	const baseSeed = slugify(request.query || "card-short-photo");
	const results: StockMedia[] = Array.from({ length: count }, (_, index) => {
		const seed = `${baseSeed}-${index + 1}`;
		return {
			id: `picsum-${seed}`,
			provider: "picsum" as const,
			type: "photo" as const,
			url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/1080/1920`,
			thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(seed)}/320/568`,
			width: 1080,
			height: 1920,
			photographer: "Lorem Picsum",
			pageUrl: "https://picsum.photos/",
		};
	});

	return { provider: "picsum", results, totalResults: results.length };
}

function mapCommonsPage(page: CommonsPage): StockMedia | null {
	const info = page.imageinfo?.[0];
	const mime = info?.mime ?? "";
	const width = info?.width ?? 0;
	const height = info?.height ?? 0;
	const url = info?.thumburl ?? info?.url ?? "";

	if (!url || mime !== "image/jpeg") return null;
	if (isRejectedCommonsPhotoTitle(page.title)) return null;
	if (width < 400 || height < 400) return null;

	return {
		id: `commons-${page.pageid}`,
		provider: "commons",
		type: "photo",
		url,
		thumbnailUrl: info?.thumburl ?? url,
		width,
		height,
		photographer: cleanCommonsText(
			info?.extmetadata?.Artist?.value ?? info?.extmetadata?.Credit?.value ?? "",
		),
		pageUrl:
			info?.descriptionurl ??
			`https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
	};
}

function buildCommonsQueries(query: string): string[] {
	const normalized = query.toLowerCase();
	const queries: string[] = [];

	if (/카드|결제|credit|card/.test(normalized)) {
		queries.push("credit card bill", "payment card statement", "bank card");
	}

	if (/구독|보험|할부|고정비|bill|invoice|subscription|insurance/.test(normalized)) {
		queries.push("invoice bill", "household bills", "receipt finance");
	}

	if (/budget|wallet|planning|calculator|가계부|생활비|예산/.test(normalized)) {
		queries.push("household budget wallet", "budget planning notebook", "personal finance calculator");
	}

	if (/저축|잠급|남은|save|saving|jar/.test(normalized)) {
		queries.push("saving money jar", "coins jar", "personal savings");
	}

	if (/통장|계좌|bank|account/.test(normalized)) {
		queries.push("bank account budget", "personal finance cash", "household budget wallet");
	}

	if (/월급|통장|돈|저축|카드|고정비|구독료|할부|bank|money|saving|credit/.test(normalized)) {
		queries.push("saving money jar", "credit card", "personal finance cash", "budget planning");
	}

	if (/업무|야근|자동화|회의|생산성|ai|work|office|automation/.test(normalized)) {
		queries.push("office work laptop", "team meeting", "workflow automation", "desk productivity");
	}

	if (/콘텐츠|쇼츠|조회수|클릭|마케팅|광고|content|marketing|video/.test(normalized)) {
		queries.push("video editing", "social media content", "marketing analytics", "camera creator");
	}

	queries.push(query.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim());

	return Array.from(new Set(queries.filter((item) => item.length >= 3))).slice(0, 5);
}

function cleanCommonsText(value: string): string {
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 80);
}

export function isRejectedCommonsPhotoTitle(title: string): boolean {
	return /logo|screenshot|screen shot|diagram|chart|graph|icon|statement|form|document|receipt scan|seal|coat of arms|flag|swear jar|swearjar/i.test(title);
}

function slugify(value: string): string {
	return (
		value
			.toLowerCase()
			.replace(/[^a-z0-9가-힣]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 72) || "card-short-photo"
	);
}
