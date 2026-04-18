import { Composition, type CalculateMetadataFunction } from "remotion";
import { CardShorts, calculateCardShortsDuration } from "./CardShorts";
import type { CardShortsProps } from "./types";

/**
 * Remotion entry point for standalone rendering.
 *
 * Usage:
 *   npx remotion studio src/remotion/Root.tsx
 *   npx remotion render src/remotion/Root.tsx CardShorts --props ./props.json
 */
export const RemotionRoot: React.FC = () => {
  const defaultProps: CardShortsProps = {
    title: "AI 도입했더니 오히려 야근이 늘어난 이유",
    channel: "테크인사이트",
    accent: "#6C63FF",
    themeName: "dark",
    scenes: [
      {
        id: "s1",
        index: 1,
        text: "AI 도구를 도입했지만, 업무 시간은 오히려 늘었다.",
        duration: 5,
        role: "hook",
        mediaQuery: "office worker stressed late night",
        subtitleLines: ["AI 도구를 도입했지만", "업무 시간은 오히려 늘었다"],
        emphasisWords: ["AI", "늘었다"],
        notes: "충격적 도입부",
      },
      {
        id: "s2",
        index: 2,
        text: "속도는 빨라졌지만, 판단 권한이 재설계되지 않았기 때문이다.",
        duration: 6,
        role: "build",
        mediaQuery: "workflow bottleneck diagram",
        subtitleLines: [
          "속도는 빨라졌지만",
          "판단 권한이 재설계되지 않았다",
        ],
        emphasisWords: ["판단 권한", "재설계"],
        notes: "원인 분석",
      },
      {
        id: "s3",
        index: 3,
        text: "AI는 속도를 늘리지만, 구조를 바꾸지 않으면 병목을 더 만든다.",
        duration: 5,
        role: "payoff",
        mediaQuery: "system architecture redesign",
        subtitleLines: ["구조를 바꾸지 않으면", "병목을 더 만든다"],
        emphasisWords: ["구조", "병목"],
        notes: "핵심 메시지",
      },
      {
        id: "s4",
        index: 4,
        text: "당신의 팀은 AI를 어떻게 쓰고 있나요?",
        duration: 4,
        role: "cta",
        mediaQuery: "team collaboration discussion",
        subtitleLines: ["당신의 팀은", "AI를 어떻게 쓰고 있나요?"],
        emphasisWords: ["당신의 팀"],
        notes: "행동 유도",
      },
    ],
  };

  const durationInFrames = calculateCardShortsDuration(defaultProps.scenes);

  return (
    <>
      <Composition
        id="CardShorts"
        component={CardShorts}
        durationInFrames={durationInFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={(async ({ props }) => ({
          durationInFrames: calculateCardShortsDuration(props.scenes),
        })) as CalculateMetadataFunction<CardShortsProps>}
      />
    </>
  );
};
