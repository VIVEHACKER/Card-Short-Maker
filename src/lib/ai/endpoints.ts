const isDev = import.meta.env.DEV;
const env = import.meta.env;

export const OPENAI_BASE_URL = isDev
	? "/api/openai/v1"
	: "https://api.openai.com/v1";

export const GOOGLE_GENAI_BASE_URL = isDev
	? "/api/google-genai/v1beta"
	: "https://generativelanguage.googleapis.com/v1beta";

export const GOOGLE_TTS_BASE_URL = isDev
	? "/api/google-tts/v1"
	: "https://texttospeech.googleapis.com/v1";

/**
 * Anthropic은 브라우저 CORS 제약 때문에 로컬 개발 시 프록시 경유가 필요하다.
 * 배포 환경에서는 동일한 경로를 라우팅하거나 별도 백엔드 프록시를 둬야 한다.
 */
export const ANTHROPIC_BASE_URL =
	env.VITE_ANTHROPIC_BASE_URL ||
	(isDev ? "/api/anthropic/v1" : "https://api.anthropic.com/v1");
