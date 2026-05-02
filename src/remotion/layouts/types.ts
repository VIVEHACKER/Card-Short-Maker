import type { CardTheme } from "../themes";
import type { CardShortsScene } from "../types";

export interface SafeZone {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface LayoutProps {
  scene: CardShortsScene;
  theme: CardTheme;
  totalScenes: number;
  safeZone?: SafeZone;
}

export type CardLayout = React.FC<LayoutProps>;

export type LayoutName =
  | "centered"
  | "fullBleed"
  | "split"
  | "quote"
  | "stat"
  | "list"
  | "comparison"
  | "minimal"
  | "reference-card";
