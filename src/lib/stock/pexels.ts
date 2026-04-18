import type {
  StockMedia,
  StockSearchRequest,
  StockSearchResponse,
} from "./types";
import { getStockConfig } from "./config";

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    portrait: string;
    small: string;
    tiny: string;
  };
  width: number;
  height: number;
}

interface PexelsVideo {
  id: number;
  url: string;
  user: { name: string };
  image: string;
  video_files: Array<{
    id: number;
    link: string;
    width: number;
    height: number;
    quality: string;
  }>;
  width: number;
  height: number;
}

export async function searchPexelsPhotos(
  request: StockSearchRequest,
  signal?: AbortSignal,
): Promise<StockSearchResponse> {
  const { pexelsApiKey } = getStockConfig();
  if (!pexelsApiKey) {
    return { provider: "pexels", results: [], totalResults: 0 };
  }

  const params = new URLSearchParams({
    query: request.query,
    per_page: String(request.perPage ?? 5),
    orientation: request.orientation ?? "portrait",
  });

  const res = await fetch(`/api/pexels/v1/search?${params}`, {
    headers: { Authorization: pexelsApiKey },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Pexels API 오류: ${res.status}`);
  }

  const data = (await res.json()) as {
    photos: PexelsPhoto[];
    total_results: number;
  };

  const results: StockMedia[] = data.photos.map((p) => ({
    id: `pexels-${p.id}`,
    provider: "pexels" as const,
    type: "photo" as const,
    url: p.src.portrait,
    thumbnailUrl: p.src.medium,
    width: p.width,
    height: p.height,
    photographer: p.photographer,
    pageUrl: p.url,
  }));

  return { provider: "pexels", results, totalResults: data.total_results };
}

export async function searchPexelsVideos(
  request: StockSearchRequest,
  signal?: AbortSignal,
): Promise<StockSearchResponse> {
  const { pexelsApiKey } = getStockConfig();
  if (!pexelsApiKey) {
    return { provider: "pexels", results: [], totalResults: 0 };
  }

  const params = new URLSearchParams({
    query: request.query,
    per_page: String(request.perPage ?? 3),
    orientation: request.orientation ?? "portrait",
  });

  const res = await fetch(`/api/pexels/videos/search?${params}`, {
    headers: { Authorization: pexelsApiKey },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Pexels Video API 오류: ${res.status}`);
  }

  const data = (await res.json()) as {
    videos: PexelsVideo[];
    total_results: number;
  };

  const results: StockMedia[] = data.videos.map((v) => {
    const best =
      v.video_files.find((f) => f.quality === "hd" && f.width <= 1080) ??
      v.video_files[0];
    return {
      id: `pexels-v-${v.id}`,
      provider: "pexels" as const,
      type: "video" as const,
      url: v.image,
      thumbnailUrl: v.image,
      width: v.width,
      height: v.height,
      photographer: v.user.name,
      pageUrl: v.url,
      videoUrl: best?.link,
    };
  });

  return { provider: "pexels", results, totalResults: data.total_results };
}
