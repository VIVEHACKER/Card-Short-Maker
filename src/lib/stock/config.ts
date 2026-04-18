import type { StockConfig, StockProvider } from "./types";

const STORAGE_KEY = "shorts-studio:stock-config";

const DEFAULT_CONFIG: StockConfig = {
  pexelsApiKey: "",
  pixabayApiKey: "",
};

export function getStockConfig(): StockConfig {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<StockConfig>;
    return {
      pexelsApiKey:
        typeof parsed.pexelsApiKey === "string" ? parsed.pexelsApiKey : "",
      pixabayApiKey:
        typeof parsed.pixabayApiKey === "string" ? parsed.pixabayApiKey : "",
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveStockConfig(config: StockConfig): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function hasStockProvider(): boolean {
  const config = getStockConfig();
  return !!(config.pexelsApiKey.trim() || config.pixabayApiKey.trim());
}

export function getAvailableStockProviders(): StockProvider[] {
  const config = getStockConfig();
  const providers: StockProvider[] = [];
  if (config.pexelsApiKey.trim()) providers.push("pexels");
  if (config.pixabayApiKey.trim()) providers.push("pixabay");
  return providers;
}
