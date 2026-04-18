import { Player } from "@remotion/player";
import { useMemo, useState } from "react";
import type { ShortsProject } from "../types";
import {
  CardShorts,
  calculateCardShortsDuration,
  projectToCardShortsProps,
  CARD_THEMES,
} from "../remotion";
import type { CardShortsProps } from "../remotion";

interface RemotionPreviewProps {
  project: ShortsProject;
}

export function RemotionPreview({ project }: RemotionPreviewProps) {
  const [themeName, setThemeName] = useState("dark");

  const inputProps = useMemo<CardShortsProps>(() => {
    const props = projectToCardShortsProps(project);
    return { ...props, themeName };
  }, [project, themeName]);

  const durationInFrames = useMemo(
    () => calculateCardShortsDuration(inputProps.scenes),
    [inputProps.scenes],
  );

  return (
    <div className="remotion-preview">
      {/* Theme selector */}
      <div className="remotion-preview__themes">
        {Object.entries(CARD_THEMES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={`theme-chip ${key === themeName ? "theme-chip--active" : ""}`}
            onClick={() => setThemeName(key)}
            style={{
              "--chip-accent": t.accent,
              "--chip-bg": t.background,
            } as React.CSSProperties}
          >
            <span
              className="theme-chip__dot"
              style={{ background: t.accent }}
            />
            {t.name}
          </button>
        ))}
      </div>

      {/* Remotion Player */}
      <div className="remotion-preview__player">
        <Player
          component={CardShorts}
          inputProps={inputProps}
          durationInFrames={Math.max(1, durationInFrames)}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={30}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 16,
            overflow: "hidden",
          }}
          controls
          autoPlay={false}
          loop
          clickToPlay
        />
      </div>
    </div>
  );
}
