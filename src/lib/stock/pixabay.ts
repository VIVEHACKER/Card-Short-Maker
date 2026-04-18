import type {
  StockMedia,
  StockSearchRequest,
  StockSearchResponse,
} from "./types";
import { getStockConfig } from "./config";

interface PixabayPhoto {
  id: number;
  pageURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
}

interface PixabayVideo {
  id: number;
  pageURL: string;
  videos: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    tiny?: { url: string; width: number; height: number };
  };
  user: string;
}

export async function searchPixabayPhotos(
  request: StockSearchRequest,
  signal?: AbortSignal,
): Promise<StockSearchResponse> {
  const { pixabayApiKey } = getStockConfig();
  if (!pixabayApiKey) {
    return { provider: "pixabay", results: [], totalResults: 0 };
  }

  const orientationMap: Record<string, string> = {
    portrait: "vertical",
    landscape: "horizontal",
    square: "all",
  };

  const params = new URLSearchParams({
    key: pixabayApiKey,
    q: request.query,
    per_page: String(request.perPage ?? 5),
    orientation: orientationMap[request.orientation ?? "portrait"] ?? "vertical",
    image_type: "photo",
    safesearch: "true",
    lang: request.language === "ko" ? "ko" : "en",
  });

  const res = await fetch(`/api/pixabay?${params}`, { signal });

  if (!res.ok) {
    throw new Error(`Pixabay API 오류: ${res.status}`);
  }

  const data = (await res.json()) as {
    hits: PixabayPhoto[];
    totalHits: number;
  };

  const results: StockMedia[] = data.hits.map((h) => ({
    id: `pixabay-${h.id}`,
    provider: "pixabay" as const,
    type: "photo" as const,
    url: h.largeImageURL,
    thumbnailUrl: h.webformatURL,
    width: h.imageWidth,
    height: h.imageHeight,
    photographer: h.user,
    pageUrl: h.pageURL,
  }));

  return { provider: "pixabay", results, totalResults: data.totalHits };
}

export async function searchPixabayVideos(
  request: StockSearchRequest,
  signal?: AbortSignal,
): Promise<StockSearchResponse> {
  const { pixabayApiKey } = getStockConfig();
  if (!pixabayApiKey) {
    return { provider: "pixabay", results: [], totalResults: 0 };
  }

  const params = new URLSearchParams({
    key: pixabayApiKey,
    q: request.query,
    per_page: String(request.perPage ?? 3),
    safesearch: "true",
    lang: request.language === "ko" ? "ko" : "en",
  });

  const res = await fetch(`/api/pixabay/videos?${params}`, { signal });

  if (!res.ok) {
    throw new Error(`Pixabay Video API 오류: ${res.status}`);
  }

  const data = (await res.json()) as {
    hits: PixabayVideo[];
    totalHits: number;
  };

  const results: StockMedia[] = data.hits.map((v) => {
    const video = v.videos.medium ?? v.videos.small ?? v.videos.tiny;
    return {
      id: `pixabay-v-${v.id}`,
      provider: "pixabay" as const,
      type: "video" as const,
      url: video?.url ?? "",
      thumbnailUrl: video?.url ?? "",
      width: video?.width ?? 0,
      height: video?.height ?? 0,
      photographer: v.user,
      pageUrl: v.pageURL,
      videoUrl: video?.url,
    };
  });

  return { provider: "pixabay", results, totalResults: data.totalHits };
}
