import type { CardTheme } from "../themes";
import type { CardShortsScene } from "../types";
import { resolveLayout } from "../layouts";

interface SceneCardProps {
  scene: CardShortsScene;
  title: string;
  channel: string;
  theme: CardTheme;
  totalScenes: number;
  safeZone?: { top: number; bottom: number; left: number; right: number };
}

/**
 * Thin wrapper that dispatches to the appropriate layout component.
 * The layout is determined by `scene.layout` (defaults to "centered").
 */
export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  theme,
  totalScenes,
  safeZone,
}) => {
  const Layout = resolveLayout(scene.layout);
  return <Layout scene={scene} theme={theme} totalScenes={totalScenes} safeZone={safeZone} />;
};
