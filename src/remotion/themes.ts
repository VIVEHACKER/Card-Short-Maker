import { FONT_STACKS, FONTS } from "./fonts";

const SYS = "system-ui, sans-serif";

export interface CardTheme {
  name: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
  subtitleBg: string;
  /** Bold display font — hooks, stat numbers, big emphasis */
  displayFont: string;
  /** Heading font — card titles, section headers */
  headingFont: string;
  /** Body font — subtitles, descriptions */
  bodyFont: string;
  spring: { damping: number; stiffness: number; mass: number };
}

export const CARD_THEMES: Record<string, CardTheme> = {
  dark: {
    name: "Dark",
    background: "#0F0F0F",
    surface: "#1A1A2E",
    accent: "#6C63FF",
    text: "#F8FAFC",
    muted: "#94A3B8",
    subtitleBg: "rgba(0, 0, 0, 0.75)",
    displayFont: FONT_STACKS.display.dark,
    headingFont: FONT_STACKS.heading.dark,
    bodyFont: FONT_STACKS.body.dark,
    spring: { damping: 18, stiffness: 120, mass: 1 },
  },
  neon: {
    name: "Neon",
    background: "#0A0A1A",
    surface: "#111128",
    accent: "#22D3EE",
    text: "#F0F9FF",
    muted: "#7DD3FC",
    subtitleBg: "rgba(10, 10, 26, 0.8)",
    displayFont: FONT_STACKS.display.neon,
    headingFont: FONT_STACKS.heading.neon,
    bodyFont: FONT_STACKS.body.neon,
    spring: { damping: 14, stiffness: 100, mass: 0.8 },
  },
  warm: {
    name: "Warm",
    background: "#1C1917",
    surface: "#292524",
    accent: "#F59E0B",
    text: "#FAFAF9",
    muted: "#A8A29E",
    subtitleBg: "rgba(28, 25, 23, 0.8)",
    displayFont: FONT_STACKS.display.warm,
    headingFont: FONT_STACKS.heading.warm,
    bodyFont: FONT_STACKS.body.warm,
    spring: { damping: 20, stiffness: 90, mass: 1.2 },
  },
  clean: {
    name: "Clean",
    background: "#FFFFFF",
    surface: "#F1F5F9",
    accent: "#2563EB",
    text: "#0F172A",
    muted: "#64748B",
    subtitleBg: "rgba(255, 255, 255, 0.9)",
    displayFont: FONT_STACKS.display.clean,
    headingFont: FONT_STACKS.heading.clean,
    bodyFont: FONT_STACKS.body.clean,
    spring: { damping: 22, stiffness: 140, mass: 1 },
  },
  midnight: {
    name: "Midnight",
    background: "#0C0A1E",
    surface: "#16133A",
    accent: "#8B5CF6",
    text: "#EDE9FE",
    muted: "#A78BFA",
    subtitleBg: "rgba(12, 10, 30, 0.85)",
    displayFont: `${FONTS.blackHanSans}, ${SYS}`,
    headingFont: `${FONTS.notoSansKR}, ${SYS}`,
    bodyFont: `${FONTS.notoSansKR}, ${SYS}`,
    spring: { damping: 16, stiffness: 90, mass: 1.1 },
  },
  forest: {
    name: "Forest",
    background: "#0A1A0F",
    surface: "#142B1A",
    accent: "#22C55E",
    text: "#F0FDF4",
    muted: "#86EFAC",
    subtitleBg: "rgba(10, 26, 15, 0.85)",
    displayFont: `${FONTS.doHyeon}, ${SYS}`,
    headingFont: `${FONTS.gowunDodum}, ${SYS}`,
    bodyFont: `${FONTS.notoSansKR}, ${SYS}`,
    spring: { damping: 22, stiffness: 80, mass: 1.2 },
  },
  coral: {
    name: "Coral",
    background: "#1A0F0F",
    surface: "#2D1B1B",
    accent: "#FB7185",
    text: "#FFF1F2",
    muted: "#FDA4AF",
    subtitleBg: "rgba(26, 15, 15, 0.85)",
    displayFont: `${FONTS.jua}, ${SYS}`,
    headingFont: `${FONTS.notoSansKR}, ${SYS}`,
    bodyFont: `${FONTS.notoSansKR}, ${SYS}`,
    spring: { damping: 14, stiffness: 110, mass: 0.9 },
  },
  mono: {
    name: "Mono",
    background: "#000000",
    surface: "#111111",
    accent: "#FFFFFF",
    text: "#FFFFFF",
    muted: "#888888",
    subtitleBg: "rgba(0, 0, 0, 0.85)",
    displayFont: `${FONTS.blackHanSans}, ${SYS}`,
    headingFont: `${FONTS.ibmPlexSansKR}, ${SYS}`,
    bodyFont: `${FONTS.ibmPlexSansKR}, ${SYS}`,
    spring: { damping: 24, stiffness: 150, mass: 1 },
  },
  retro: {
    name: "Retro",
    background: "#1C1410",
    surface: "#2A2018",
    accent: "#D97706",
    text: "#FFFBEB",
    muted: "#B8977A",
    subtitleBg: "rgba(28, 20, 16, 0.85)",
    displayFont: `${FONTS.notoSerifKR}, ${SYS}`,
    headingFont: `${FONTS.notoSerifKR}, ${SYS}`,
    bodyFont: `${FONTS.notoSansKR}, ${SYS}`,
    spring: { damping: 20, stiffness: 70, mass: 1.3 },
  },
  gradient: {
    name: "Gradient",
    background: "#0F172A",
    surface: "#1E293B",
    accent: "#F472B6",
    text: "#F8FAFC",
    muted: "#94A3B8",
    subtitleBg: "rgba(15, 23, 42, 0.8)",
    displayFont: `${FONTS.doHyeon}, ${SYS}`,
    headingFont: `${FONTS.notoSansKR}, ${SYS}`,
    bodyFont: `${FONTS.notoSansKR}, ${SYS}`,
    spring: { damping: 15, stiffness: 100, mass: 0.9 },
  },
};

/** Create a custom theme by merging overrides onto a base theme */
export function createCustomTheme(
  base: string,
  overrides: Partial<CardTheme>,
): CardTheme {
  const baseTheme = CARD_THEMES[base] ?? CARD_THEMES.dark;
  return { ...baseTheme, ...overrides };
}

export function resolveTheme(
  accentColor?: string,
  themeName?: string,
): CardTheme {
  const base = CARD_THEMES[themeName ?? "dark"] ?? CARD_THEMES.dark;
  if (accentColor) {
    return { ...base, accent: accentColor };
  }
  return base;
}
