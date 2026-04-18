/**
 * Platform-specific export presets with safe zones.
 *
 * Safe zones define areas where platform UI overlays (title bar, music bar,
 * @handle, caption overlay) obscure content. Content should avoid these areas.
 */
import type { Platform } from "../types";

export interface SafeZone {
  /** Top safe zone in pixels (platform title bar, profile) */
  top: number;
  /** Bottom safe zone in pixels (music bar, CTA buttons) */
  bottom: number;
  /** Left safe zone */
  left: number;
  /** Right safe zone */
  right: number;
}

export interface ExportPreset {
  id: string;
  name: string;
  nameKo: string;
  platform: Platform;
  width: number;
  height: number;
  fps: number;
  maxDuration: number;
  codec: string;
  /** Safe zones where platform UI overlays content */
  safeZone: SafeZone;
  /** Description of what the safe zone avoids */
  safeZoneNote: string;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    nameKo: "유튜브 쇼츠",
    platform: "youtube",
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 60,
    codec: "h264",
    safeZone: { top: 160, bottom: 200, left: 24, right: 24 },
    safeZoneNote: "상단: 채널 아이콘+이름, 하단: 좋아요/댓글/공유 버튼 + 음악 바",
  },
  {
    id: "tiktok",
    name: "TikTok",
    nameKo: "틱톡",
    platform: "tiktok",
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 60,
    codec: "h264",
    safeZone: { top: 120, bottom: 280, left: 24, right: 100 },
    safeZoneNote: "상단: 팔로우 버튼, 하단: 캡션+음악, 우측: 좋아요/댓글/북마크/공유",
  },
  {
    id: "reels",
    name: "Instagram Reels",
    nameKo: "인스타 릴스",
    platform: "reels",
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 90,
    codec: "h264",
    safeZone: { top: 140, bottom: 340, left: 24, right: 80 },
    safeZoneNote: "상단: 카메라/검색, 하단: 캡션+음악+CTA, 우측: 좋아요/댓글/공유/리믹스",
  },
];

/** Get preset by platform */
export function getPresetByPlatform(platform: Platform): ExportPreset {
  return (
    EXPORT_PRESETS.find((p) => p.platform === platform) ??
    EXPORT_PRESETS[0]!
  );
}

/** Get preset by ID */
export function getPresetById(id: string): ExportPreset | undefined {
  return EXPORT_PRESETS.find((p) => p.id === id);
}

/**
 * Calculate CSS padding that respects safe zones.
 * Returns padding values for the content area.
 */
export function safeZonePadding(preset: ExportPreset): {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
} {
  return {
    paddingTop: preset.safeZone.top,
    paddingBottom: preset.safeZone.bottom,
    paddingLeft: preset.safeZone.left,
    paddingRight: preset.safeZone.right,
  };
}
