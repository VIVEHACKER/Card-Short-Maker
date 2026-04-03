# Shorts Studio Architecture

Meta description: Shorts Studio는 숏폼 제작의 핵심 판단을 데이터 계약과 스튜디오 UI로 드러내는 기준 구현입니다.

Tags: `architecture`, `shorts`, `scene-engine`, `qa`, `react`, `22B Labs`

## Thesis

숏폼 제작은 편집 문제가 아니라 의사결정 문제입니다.

편집기는 결과를 다룹니다.  
하지만 제작 비용은 결과보다 앞선 단계, 즉 무엇을 말하고 어떻게 나눌지를 정하는 순간에 발생합니다.

그래서 이 프로젝트는 미디어 편집 앱을 흉내 내는 대신, **의사결정을 먼저 모델링하는 제품**으로 시작합니다.

## System Flow

```text
[INPUT]
  -> [BRIEF NORMALIZER]
  -> [SCRIPT ENGINE]
  -> [SCENE ENGINE]
  -> [MEDIA ENGINE]
  -> [VOICE ENGINE]
  -> [SUBTITLE ENGINE]
  -> [QA ENGINE]
  -> [EXPORT / RENDER]
```

## Contracts

핵심 데이터는 자유 텍스트가 아니라 객체로 이동해야 합니다.

```ts
type Brief = {
  title: string;
  topic: string;
  intent: "info" | "opinion" | "story";
  tone: "neutral" | "serious" | "energetic" | "urgent";
  targetDuration: number;
  platform: "youtube" | "tiktok" | "reels";
  language: "ko" | "en";
};
```

```ts
type Scene = {
  id: string;
  text: string;
  duration: number;
  role: "hook" | "build" | "payoff" | "cta";
};
```

이 계약이 먼저 있어야, 어떤 모델을 붙이든 결과가 비교 가능해집니다.

## UI Principle

UI는 프리미어의 축소판이 아닙니다.

- 좌측은 “무슨 프로젝트를 다루는가”
- 중앙은 “지금 어떤 장면을 보고 있는가”
- 우측은 “왜 이 장면이 이런 상태인가”

즉 편집 도구가 아니라 **판단 콘솔**이어야 합니다.

## Reference Implementation Scope

현재 버전은 다음을 목표로 합니다.

- 브리프 입력
- 스크립트 기반 자동 씬 분해
- 씬별 미디어 쿼리 생성
- 자막 라인 분해
- QA 점수와 수정 포인트 표시
- 렌더 매니페스트 내보내기

아직 포함하지 않는 것:

- 실제 FFmpeg 렌더 실행
- TTS API 연동
- 스톡/밈/GIF 자동 수집
- 업로드 자동화

## Why This Matters

대부분의 숏폼 자동화는 “더 강한 생성 모델”을 찾다가 끝납니다.  
하지만 실제로는 생성보다 평가 기준과 피드백 루프가 더 중요합니다.

좋은 영상이란 무엇인지 점수화할 수 있어야, 재생성도 가능해집니다.

좋은 툴은 결과물을 만듭니다.  
좋은 프로토콜은 산업의 문법을 만듭니다.

