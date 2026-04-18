import type {
  StockMedia,
  StockSearchRequest,
  StockSearchResponse,
} from "./types";
import { getAvailableStockProviders } from "./config";
import { searchPexelsPhotos, searchPexelsVideos } from "./pexels";
import { searchPixabayPhotos, searchPixabayVideos } from "./pixabay";

/**
 * Search across all configured stock providers.
 * Returns merged results, prioritizing Pexels (higher quality portraits).
 */
export async function searchStockMedia(
  request: StockSearchRequest,
  signal?: AbortSignal,
): Promise<StockMedia[]> {
  const providers = getAvailableStockProviders();
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
  );

  // Prefer portrait-oriented images
  const portrait = results.find((r) => r.height > r.width);
  return portrait ?? results[0] ?? null;
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
): Promise<Array<StockMedia | null>> {
  const results: Array<StockMedia | null> = new Array(queries.length).fill(
    null,
  );
  let completed = 0;
  let index = 0;

  async function worker() {
    while (index < queries.length) {
      if (signal?.aborted) break;
      const currentIndex = index++;
      const { query, language } = queries[currentIndex]!;

      try {
        results[currentIndex] = await findBestStockImage(
          query,
          language,
          signal,
        );
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

  return results;
}
