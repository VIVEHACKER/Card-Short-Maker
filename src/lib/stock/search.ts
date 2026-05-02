import type {
  StockMedia,
  StockSearchRequest,
  StockSearchResponse,
} from "./types";
import { getAvailableStockProvidersForMode } from "./config";
import { searchPexelsPhotos, searchPexelsVideos } from "./pexels";
import { searchPixabayPhotos, searchPixabayVideos } from "./pixabay";
import { searchCommonsPhotos, searchPicsumPhotos } from "./no-key";

interface StockSearchOptions {
  includeNoKeyFallback?: boolean;
}

/**
 * Search across all configured stock providers.
 * Returns merged results, prioritizing Pexels (higher quality portraits).
 */
export async function searchStockMedia(
  request: StockSearchRequest,
  signal?: AbortSignal,
  options?: StockSearchOptions,
): Promise<StockMedia[]> {
  const providers = getAvailableStockProvidersForMode(options);
  if (providers.length === 0) return [];

  const searchType = request.type ?? "photo";

  const searches: Promise<StockSearchResponse>[] = [];

  for (const provider of providers) {
    if (provider === "pexels") {
      searches.push(
        searchType === "video"
          ? searchPexelsVideos(request, signal)
          : searchPexelsPhotos(request, signal),
      );
    } else if (provider === "pixabay") {
      searches.push(
        searchType === "video"
          ? searchPixabayVideos(request, signal)
          : searchPixabayPhotos(request, signal),
      );
    } else if (provider === "commons") {
      searches.push(searchCommonsPhotos(request, signal));
    } else if (provider === "picsum") {
      searches.push(searchPicsumPhotos(request));
    }
  }

  const responses = await Promise.allSettled(searches);

  const allResults: StockMedia[] = [];
  for (const response of responses) {
    if (response.status === "fulfilled") {
      allResults.push(...response.value.results);
    }
  }

  return allResults;
}

/**
 * Search for the best single stock image matching a scene query.
 * Returns the first portrait-oriented result, or null.
 */
export async function findBestStockImage(
  query: string,
  language?: string,
  signal?: AbortSignal,
  options?: StockSearchOptions,
): Promise<StockMedia | null> {
  return findBestStockImageExcluding(
    query,
    language,
    signal,
    new Set<string>(),
    options,
  );
}

async function findBestStockImageExcluding(
  query: string,
  language?: string,
  signal?: AbortSignal,
  usedUrls = new Set<string>(),
  options?: StockSearchOptions,
): Promise<StockMedia | null> {
  const results = await searchStockMedia(
    {
      query,
      orientation: "portrait",
      type: "photo",
      perPage: 3,
      language,
    },
    signal,
    options,
  );

  const unused = results.filter((result) => !usedUrls.has(result.url));
  const candidates = unused.length ? unused : results;

  const editorialCandidates = candidates.filter((result) => result.provider !== "picsum");
  const editorialPortrait = editorialCandidates.find((result) => result.height > result.width);
  const anyPortrait = candidates.find((result) => result.height > result.width);

  return editorialPortrait ?? editorialCandidates[0] ?? anyPortrait ?? candidates[0] ?? null;
}

/**
 * Search stock images for multiple scene queries in parallel.
 * Returns one result per query (null if not found).
 */
export async function findStockImagesForScenes(
  queries: Array<{ query: string; language?: string }>,
  signal?: AbortSignal,
  concurrency = 2,
  onProgress?: (completed: number, total: number) => void,
  options?: StockSearchOptions,
): Promise<Array<StockMedia | null>> {
  const results: Array<StockMedia | null> = new Array(queries.length).fill(
    null,
  );
  let completed = 0;
  let index = 0;
  const usedUrls = new Set<string>();

  async function worker() {
    while (index < queries.length) {
      if (signal?.aborted) break;
      const currentIndex = index++;
      const { query, language } = queries[currentIndex]!;

      try {
        const result = await findBestStockImageExcluding(
          query,
          language,
          signal,
          usedUrls,
          options,
        );
        results[currentIndex] = result;
        if (result?.url) {
          usedUrls.add(result.url);
        }
      } catch {
        results[currentIndex] = null;
      }

      completed++;
      onProgress?.(completed, queries.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, queries.length) },
    () => worker(),
  );
  await Promise.all(workers);

  const seenUrls = new Set<string>();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result?.url) continue;

    if (!seenUrls.has(result.url)) {
      seenUrls.add(result.url);
      continue;
    }

    const fallback =
      options?.includeNoKeyFallback === false
        ? null
        : (
            await searchPicsumPhotos({
              query: `${queries[i]?.query ?? "shorts"} scene ${i + 1}`,
              orientation: "portrait",
              type: "photo",
              perPage: 1,
              language: queries[i]?.language,
            })
          ).results[0];

    if (fallback) {
      results[i] = fallback;
      seenUrls.add(fallback.url);
    }
  }

  return results;
}
