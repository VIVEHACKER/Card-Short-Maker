export type StockProvider = "pexels" | "pixabay" | "commons" | "picsum";

export interface StockMedia {
  id: string;
  provider: StockProvider;
  type: "photo" | "video";
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  photographer?: string;
  pageUrl: string;
  /** Video-specific: direct video file URL */
  videoUrl?: string;
}

export interface StockSearchRequest {
  query: string;
  orientation?: "portrait" | "landscape" | "square";
  type?: "photo" | "video";
  perPage?: number;
  language?: string;
}

export interface StockSearchResponse {
  provider: StockProvider;
  results: StockMedia[];
  totalResults: number;
}

export interface StockConfig {
  pexelsApiKey: string;
  pixabayApiKey: string;
}
