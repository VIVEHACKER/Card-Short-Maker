/**
 * Central font loader for Remotion compositions.
 * All fonts loaded at module scope via @remotion/google-fonts.
 */
import { loadFont as loadBlackHanSans } from "@remotion/google-fonts/BlackHanSans";
import { loadFont as loadGowunDodum } from "@remotion/google-fonts/GowunDodum";
import { loadFont as loadDoHyeon } from "@remotion/google-fonts/DoHyeon";
import { loadFont as loadJua } from "@remotion/google-fonts/Jua";
import { loadFont as loadNotoSansKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoSerifKR } from "@remotion/google-fonts/NotoSerifKR";
import { loadFont as loadIBMPlexSansKR } from "@remotion/google-fonts/IBMPlexSansKR";

// Load all fonts at module scope
const blackHanSans = loadBlackHanSans();
const gowunDodum = loadGowunDodum();
const doHyeon = loadDoHyeon();
const jua = loadJua();
const notoSansKR = loadNotoSansKR();
const inter = loadInter();
const notoSerifKR = loadNotoSerifKR();
const ibmPlexSansKR = loadIBMPlexSansKR();

export const FONTS = {
  blackHanSans: blackHanSans.fontFamily,
  gowunDodum: gowunDodum.fontFamily,
  doHyeon: doHyeon.fontFamily,
  jua: jua.fontFamily,
  notoSansKR: notoSansKR.fontFamily,
  notoSerifKR: notoSerifKR.fontFamily,
  ibmPlexSansKR: ibmPlexSansKR.fontFamily,
  inter: inter.fontFamily,
} as const;

/** System fallback chain */
const SYS = "system-ui, sans-serif";

/** Pre-built font stacks for themes */
export const FONT_STACKS = {
  /** Bold display — hooks, stats, big numbers */
  display: {
    dark: `${FONTS.blackHanSans}, ${SYS}`,
    neon: `${FONTS.doHyeon}, ${SYS}`,
    warm: `${FONTS.jua}, ${SYS}`,
    clean: `${FONTS.inter}, ${SYS}`,
  },
  /** Heading — card titles, section headers */
  heading: {
    dark: `${FONTS.notoSansKR}, ${SYS}`,
    neon: `${FONTS.notoSansKR}, ${SYS}`,
    warm: `${FONTS.gowunDodum}, ${SYS}`,
    clean: `${FONTS.inter}, ${SYS}`,
  },
  /** Body — subtitles, descriptions */
  body: {
    dark: `${FONTS.notoSansKR}, ${SYS}`,
    neon: `${FONTS.notoSansKR}, ${SYS}`,
    warm: `${FONTS.notoSansKR}, ${SYS}`,
    clean: `${FONTS.notoSansKR}, ${SYS}`,
  },
} as const;
