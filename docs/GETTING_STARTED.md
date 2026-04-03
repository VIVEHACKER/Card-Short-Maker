# Getting Started / 시작하기

## 1. Install / 설치

한국어:

```bash
npm install
```

이 단계에서 `ffmpeg-static`도 함께 설치됩니다.  
별도로 FFmpeg를 깔지 않아도 기본 렌더는 동작합니다.

English:

```bash
npm install
```

`ffmpeg-static` is installed in this step as well.  
The default renderer works without a separate FFmpeg installation.

## 2. Open the studio / 스튜디오 열기

```bash
npm run dev
```

브리프를 입력하고 `자동 생성`을 누르면 장면이 만들어집니다.  
씬 카드, QA, 익스포트 패널이 모두 같은 프로젝트 JSON을 공유합니다.

Enter a brief and press `자동 생성` to create scenes.  
Scene cards, QA, and export panels all share the same project JSON.

## 3. Generate from CLI / CLI로 생성

```bash
npm run cli -- generate --brief ./examples/sample-brief.json --out ./examples/generated-project.json
```

## 4. Review QA / QA 확인

```bash
npm run cli -- qa --project ./examples/generated-project.json
```

## 5. Render an MP4 / MP4 렌더

```bash
npm run cli -- render --project ./examples/generated-project.json --out ./examples/render-output
```

성공하면 아래 두 결과가 생깁니다.

- 최종 MP4
- `_render` 워크스페이스

If successful, you will get:

- a final MP4
- a `_render` workspace

## 6. Troubleshooting / 문제 해결

### Korean TTS voice is missing / 한국어 음성이 없을 때

한국어:

- Windows 음성에 `Microsoft Heami Desktop`이 없으면 기본 음성으로 대체될 수 있습니다.
- `설정 > 시간 및 언어 > 음성`에서 음성 팩 설치 상태를 확인하세요.

English:

- If `Microsoft Heami Desktop` is not installed, the renderer may fall back to another voice.
- Check voice pack availability in `Settings > Time & Language > Speech`.

### FFmpeg path issue / FFmpeg 경로 문제

한국어:

- 기본값은 번들된 `ffmpeg-static`입니다.
- 그래도 문제가 있으면 직접 경로를 넘기세요.

```bash
npm run cli -- render --project ./examples/generated-project.json --ffmpeg C:\ffmpeg\bin\ffmpeg.exe
```

English:

- The default is bundled `ffmpeg-static`.
- If that still fails, pass a custom FFmpeg path.

```bash
npm run cli -- render --project ./examples/generated-project.json --ffmpeg C:\ffmpeg\bin\ffmpeg.exe
```

### Silent render / 음성 없이 렌더

```bash
npm run cli -- render --project ./examples/generated-project.json --no-tts
```

## 7. What to edit first / 처음엔 뭘 고치면 되나

한국어:

- 장면 문장
- 장면 길이
- 자막 두 줄
- 실행 모드

English:

- scene sentence
- scene duration
- subtitle lines
- execution mode
