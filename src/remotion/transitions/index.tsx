/**
 * Transition registry — maps transition names to @remotion/transitions presentations.
 */
import { springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { flip } from "@remotion/transitions/flip";
import { wipe } from "@remotion/transitions/wipe";
import type { TransitionPresentation, TransitionPresentationComponentProps, TransitionTiming } from "@remotion/transitions";

export type TransitionName =
  | "fade"
  | "slideUp"
  | "slideLeft"
  | "slideRight"
  | "flip"
  | "wipe"
  | "scale"
  | "blur"
  | "zoomOut"
  | "none";

interface TransitionConfig {
  presentation: TransitionPresentation<Record<string, unknown>>;
  timing: TransitionTiming;
}

const SPRING_FAST = springTiming({ config: { damping: 20, stiffness: 100 }, durationInFrames: 12 });
const SPRING_MED = springTiming({ config: { damping: 18, stiffness: 80 }, durationInFrames: 15 });

/** Custom blur presentation — quick depth-of-field swap */
function blurPresentation(): TransitionPresentation<Record<string, unknown>> {
  return {
    component: ({
      children,
      presentationDirection,
      presentationProgress,
    }: TransitionPresentationComponentProps<Record<string, unknown>>) => {
      const isEntering = presentationDirection === "entering";
      const progress = isEntering ? presentationProgress : 1 - presentationProgress;
      const blur = (1 - progress) * 18;
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: progress,
            filter: `blur(${blur.toFixed(2)}px)`,
            willChange: "filter, opacity",
          }}
        >
          {children}
        </div>
      );
    },
    props: {},
  };
}

/** Custom zoom-out presentation — fade away while shrinking */
function zoomOutPresentation(): TransitionPresentation<Record<string, unknown>> {
  return {
    component: ({
      children,
      presentationDirection,
      presentationProgress,
    }: TransitionPresentationComponentProps<Record<string, unknown>>) => {
      const isEntering = presentationDirection === "entering";
      const progress = isEntering ? presentationProgress : 1 - presentationProgress;
      const s = isEntering
        ? 1.15 - progress * 0.15
        : 1 + (1 - progress) * 0.2;
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: progress,
            transform: `scale(${s})`,
            willChange: "transform, opacity",
          }}
        >
          {children}
        </div>
      );
    },
    props: {},
  };
}

/** Custom scale presentation — zoom in from center */
function scalePresentation(): TransitionPresentation<Record<string, unknown>> {
  return {
    component: ({
      children,
      presentationDirection,
      presentationProgress,
    }: TransitionPresentationComponentProps<Record<string, unknown>>) => {
      const isEntering = presentationDirection === "entering";
      const opacity = isEntering ? presentationProgress : 1 - presentationProgress;
      const s = isEntering
        ? 0.85 + presentationProgress * 0.15
        : 1 + (1 - presentationProgress) * 0.15;

      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity,
            transform: `scale(${s})`,
            willChange: "transform, opacity",
          }}
        >
          {children}
        </div>
      );
    },
    props: {},
  };
}

const TRANSITIONS: Record<TransitionName, TransitionConfig> = {
  fade: {
    presentation: fade() as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_MED,
  },
  slideUp: {
    presentation: slide({ direction: "from-bottom" }) as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_FAST,
  },
  slideLeft: {
    presentation: slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_FAST,
  },
  slideRight: {
    presentation: slide({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_FAST,
  },
  flip: {
    presentation: flip({ direction: "from-bottom" }) as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_MED,
  },
  wipe: {
    presentation: wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>,
    timing: SPRING_MED,
  },
  scale: {
    presentation: scalePresentation(),
    timing: SPRING_MED,
  },
  blur: {
    presentation: blurPresentation(),
    timing: SPRING_FAST,
  },
  zoomOut: {
    presentation: zoomOutPresentation(),
    timing: SPRING_MED,
  },
  none: {
    presentation: fade() as TransitionPresentation<Record<string, unknown>>,
    timing: springTiming({ durationInFrames: 1 }),
  },
};

export function resolveTransition(name?: string): TransitionConfig {
  if (name && name in TRANSITIONS) {
    return TRANSITIONS[name as TransitionName];
  }
  return TRANSITIONS.fade;
}

export const TRANSITION_NAMES = Object.keys(TRANSITIONS) as TransitionName[];
