import { createProjectFromBrief } from "../lib/pipeline";
import type { Brief, ExecutionMode, ShortsProject } from "../types";

const samples: Array<{
  accent: string;
  channel: string;
  preset: string;
  runtimeMode: ExecutionMode;
  updatedAt: string;
  brief: Brief;
  script: string;
}> = [
  {
    accent: "#f0b39b",
    channel: "channel-ivan",
    preset: "기본",
    runtimeMode: "hybrid",
    updatedAt: "11분 전",
    brief: {
      id: "brief-claude",
      title: "클로드가 승인창을 없앤 진짜 이유",
      topic: "Claude approval dialog removal",
      intent: "info",
      tone: "serious",
      targetDuration: 31,
      platform: "youtube",
      language: "ko",
      audience: "개발 자동화와 에이전트 워크플로에 관심 있는 실무자",
      thesis: "핵심은 빨라진 게 아니라 판단 권한 일부가 툴체인에 넘어갔다는 점입니다.",
    },
    script: `테스트 수정클로드로 코딩하다 파일 하나 쓸 때마다 승인창, bash 명령 칠 때마다 또 승인창 뜨던 거 기억나시죠?
흐름 끊기고 맥락 날아가고, 결국 사람이 병목이 되는 구조였습니다.
이번에 auto mode 뜨면서 클로드가 작업 위험도를 직접 판단하고 안전한 건 바로 실행해버립니다.
사람 역할이 모든 호출을 감시해서 어디까지 달릴지 기준을 정하는 쪽으로 바뀐 겁니다.
위험한 건 자동 차단이라 사람이 매번 붙잡고 있을 이유가 사라진 거죠.
핵심은 빨라진 게 아니라 판단 권한 일부가 툴체인에 넘어갔다는 점입니다.
말릴 기준 설계를 먼저 잡아본 사람이 이 구조에서 앞서갑니다.`,
  },
  {
    accent: "#efd17f",
    channel: "channel-ivan",
    preset: "밈 중심",
    runtimeMode: "local",
    updatedAt: "09:52",
    brief: {
      id: "brief-overtime",
      title: "AI 도입했더니 오히려 야근이 늘어난 이유",
      topic: "AI adoption and longer work hours",
      intent: "info",
      tone: "serious",
      targetDuration: 36,
      platform: "youtube",
      language: "ko",
      audience: "AI를 도입했지만 업무 효율이 체감되지 않는 팀 리더",
      thesis: "AI는 속도를 올리지만 판단 구조를 바꾸지 않으면 오히려 야근을 증폭합니다.",
    },
    script: `AI 도입했더니 오히려 야근이 늘어난 이유.
비효율 연구에서는 나왔는데, 그 이유는 AI가 결과물을 더 빨리 만들어서가 아닙니다.
그 이후를 사람이 검토하고 승인하고 수정하고 다시 설명하느라 루프가 길어졌기 때문입니다.
사람의 처리 속도는 남는 순간부터 새 병목이 됩니다.
기대감과 같이 올라온 확인 업무가 결국 사람 시간을 다 잡아먹습니다.
결국 AI 속도가 문제가 아니라, 누가 언제 판단하는지 다시 설계하지 않은 게 문제입니다.
좋은 자동화는 생성보다 판단 구조부터 바꾸는 데서 시작합니다.`,
  },
  {
    accent: "#8ac4ff",
    channel: "channel-a",
    preset: "리뷰",
    runtimeMode: "byo-api",
    updatedAt: "방금",
    brief: {
      id: "brief-hiring",
      title: "신입 채용 금지에 대한 내 생각",
      topic: "No junior hiring trend",
      intent: "opinion",
      tone: "serious",
      targetDuration: 45,
      platform: "youtube",
      language: "ko",
      audience: "채용과 조직 설계의 변화를 고민하는 창업자와 실무자",
      thesis: "신입 채용 금지는 비용 절감처럼 보이지만 장기적으로는 학습 구조를 버리는 선택입니다.",
    },
    script: `신입 채용 금지에 대한 내 생각이 생성 실패하는 이유는 감정만 있고 기준이 없기 때문입니다.
신입 채용 금지는 당장 교육 비용을 줄여주는 것처럼 보이지만 사실 미래 조직의 학습 경로를 끊습니다.
경력직만 뽑는 구조는 단기 생산성은 올려도 결국 팀의 모방 능력만 키웁니다.
신입은 느리지만 질문을 통해 시스템의 숨은 전제를 드러냅니다.
그래서 신입을 없애는 팀은 비용을 절감하는 게 아니라 사유의 입구를 막고 있는 겁니다.
문제는 채용 규모가 아니라 온보딩 구조를 설계하지 않은 데 있습니다.
생각 없이 채용을 줄인 조직은 결국 더 비싼 대가를 치릅니다.`,
  },
];

export function createSampleProjects(): ShortsProject[] {
  return samples.map((sample, index) =>
    createProjectFromBrief(sample.brief, sample.script, {
      id: `sample-${index + 1}`,
      accent: sample.accent,
      channel: sample.channel,
      preset: sample.preset,
      runtimeMode: sample.runtimeMode,
      updatedAt: sample.updatedAt,
      status: index === 0 ? "rendered" : index === 1 ? "review" : "editing",
    }),
  );
}
