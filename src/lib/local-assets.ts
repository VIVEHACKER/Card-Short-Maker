import type { Brief, SceneRole } from "../types";

export const SEMANTIC_VECTOR_SOURCE_HINT = "semantic vector visual";

type VisualDomain = "finance" | "work" | "content" | "general";
type VisualConcept =
	| "account"
	| "automation"
	| "bills"
	| "bottleneck"
	| "card"
	| "creator"
	| "growth"
	| "leak"
	| "planning"
	| "saving";

interface Palette {
	bgA: string;
	bgB: string;
	bgC: string;
	accent: string;
	accent2: string;
	ink: string;
	shadow: string;
}

const PALETTES: Record<VisualDomain, Palette[]> = {
	finance: [
		{ bgA: "#120f0b", bgB: "#402112", bgC: "#7a3d16", accent: "#f2b36f", accent2: "#7bd389", ink: "#fff7e8", shadow: "#050302" },
		{ bgA: "#071311", bgB: "#153f35", bgC: "#2c6f55", accent: "#e7c46a", accent2: "#87d6bd", ink: "#f6fff9", shadow: "#020706" },
	],
	work: [
		{ bgA: "#08111f", bgB: "#1b3861", bgC: "#365f89", accent: "#8fd3ff", accent2: "#f4d35e", ink: "#f6fbff", shadow: "#020712" },
		{ bgA: "#17151f", bgB: "#3a2b59", bgC: "#6a4c93", accent: "#f6bd60", accent2: "#b8f2e6", ink: "#fffaf0", shadow: "#06050a" },
	],
	content: [
		{ bgA: "#190b15", bgB: "#5f1737", bgC: "#b02e55", accent: "#ffd166", accent2: "#9bf6ff", ink: "#fff4fa", shadow: "#080208" },
		{ bgA: "#101014", bgB: "#343a40", bgC: "#f77f00", accent: "#ffba08", accent2: "#e9ecef", ink: "#fffaf0", shadow: "#050505" },
	],
	general: [
		{ bgA: "#101820", bgB: "#1f7a8c", bgC: "#325c6b", accent: "#f4d35e", accent2: "#f7f7f2", ink: "#f7f7f2", shadow: "#030709" },
		{ bgA: "#141414", bgB: "#6b2737", bgC: "#b33951", accent: "#f0a202", accent2: "#f8f4e3", ink: "#f8f4e3", shadow: "#050303" },
	],
};

/**
 * Deterministic scene-specific SVG visual.
 * It intentionally contains no narration text so the fixed card template owns all readable copy.
 */
export function buildLocalSceneCardImage(
	text: string,
	role: SceneRole,
	brief: Brief,
	index: number,
): string {
	const seed = `${brief.title}|${brief.topic}|${text}|${role}|${index}`;
	const hash = positiveHash(seed);
	const domain = resolveDomain(`${brief.title} ${brief.topic} ${text}`);
	const concept = resolveConcept(`${brief.title} ${brief.topic} ${text}`, domain, role);
	const palette = pickPalette(domain, hash);
	const variant = hash % 5;
	const orbA = 220 + (hash % 130);
	const orbB = 1110 - (hash % 220);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1792" viewBox="0 0 1024 1792" role="img" aria-label="semantic scene visual">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bgA}" />
      <stop offset="58%" stop-color="${palette.bgB}" />
      <stop offset="100%" stop-color="${palette.bgC}" />
    </linearGradient>
    <radialGradient id="pulse" cx="66%" cy="32%" r="64%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.56" />
      <stop offset="56%" stop-color="${palette.accent}" stop-opacity="0.09" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </radialGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="26" />
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="${(hash % 97) + 1}" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.08" />
      </feComponentTransfer>
    </filter>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M 72 0 L 0 0 0 72" fill="none" stroke="${palette.ink}" stroke-width="1" opacity="0.055" />
    </pattern>
  </defs>
  <rect width="1024" height="1792" fill="url(#bg)" />
  <rect width="1024" height="1792" fill="url(#pulse)" />
  <rect width="1024" height="1792" fill="url(#grid)" />
  <rect width="1024" height="1792" filter="url(#grain)" opacity="0.42" />
  <circle cx="${748 - (hash % 86)}" cy="${296 + (hash % 126)}" r="${245 + variant * 14}" fill="${palette.accent}" opacity="0.17" filter="url(#soft)" />
  <circle cx="${218 + (hash % 74)}" cy="${orbB}" r="${286 + variant * 18}" fill="${palette.accent2}" opacity="0.12" filter="url(#soft)" />
  <path d="M96 ${188 + variant * 6} H928" stroke="${palette.accent}" stroke-width="10" stroke-linecap="square" opacity="0.9" />
  <path d="M96 ${1580 - variant * 7} H928" stroke="${palette.ink}" stroke-width="2" stroke-linecap="round" opacity="0.18" />
  <g opacity="0.96" transform="translate(0 ${role === "hook" ? -18 : role === "cta" ? 22 : 0})">
    ${buildMotif(domain, concept, role, palette, hash, orbA)}
  </g>
</svg>`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildMotif(
	domain: VisualDomain,
	concept: VisualConcept,
	role: SceneRole,
	palette: Palette,
	hash: number,
	orbA: number,
): string {
	if (domain === "finance") {
		return buildFinanceMotif(concept, role, palette, hash, orbA);
	}
	if (domain === "work") {
		return buildWorkMotif(concept, palette, hash);
	}
	if (domain === "content") {
		return buildContentMotif(concept, palette, hash);
	}
	return buildGeneralMotif(concept, palette, hash);
}

function buildFinanceMotif(
	concept: VisualConcept,
	role: SceneRole,
	palette: Palette,
	hash: number,
	orbA: number,
): string {
	if (concept === "card") {
		return `<g id="motif-finance-card" transform="translate(104 344)">
  <rect x="36" y="38" width="784" height="470" rx="54" fill="${palette.shadow}" opacity="0.28" />
  <rect x="0" y="0" width="742" height="420" rx="48" fill="${palette.ink}" opacity="0.15" />
  <rect x="64" y="84" width="176" height="34" rx="17" fill="${palette.accent}" opacity="0.92" />
  <rect x="64" y="154" width="486" height="24" rx="12" fill="${palette.ink}" opacity="0.24" />
  <rect x="64" y="212" width="604" height="24" rx="12" fill="${palette.ink}" opacity="0.18" />
  <circle cx="574" cy="310" r="62" fill="${palette.accent}" opacity="0.56" />
  <circle cx="646" cy="310" r="62" fill="${palette.accent2}" opacity="0.48" />
  <path d="M86 522 C214 454, 338 592, 486 498 S694 390, 798 448" fill="none" stroke="${palette.accent2}" stroke-width="12" stroke-linecap="round" opacity="0.82" />
</g>`;
	}

	if (concept === "bills") {
		return `<g id="motif-finance-bills" transform="translate(118 326)">
  <rect x="116" y="66" width="592" height="612" rx="42" fill="${palette.shadow}" opacity="0.24" />
  <rect x="72" y="18" width="592" height="612" rx="42" fill="${palette.ink}" opacity="0.13" />
  <rect x="112" y="86" width="226" height="28" rx="14" fill="${palette.accent}" opacity="0.9" />
  <rect x="112" y="166" width="420" height="20" rx="10" fill="${palette.ink}" opacity="0.22" />
  <rect x="112" y="224" width="486" height="20" rx="10" fill="${palette.ink}" opacity="0.18" />
  <rect x="112" y="282" width="358" height="20" rx="10" fill="${palette.ink}" opacity="0.18" />
  <path d="M176 430 h360" stroke="${palette.accent2}" stroke-width="14" stroke-linecap="round" opacity="0.78" />
  <path d="M176 500 h260" stroke="${palette.accent}" stroke-width="14" stroke-linecap="round" opacity="0.72" />
  <path d="M680 214 a118 118 0 1 1 -1 0" fill="none" stroke="${palette.accent2}" stroke-width="16" stroke-linecap="round" opacity="0.62" />
  <path d="M694 158 l52 54 l-76 22" fill="none" stroke="${palette.accent2}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.74" />
</g>`;
	}

	if (concept === "saving") {
		return `<g id="motif-finance-saving" transform="translate(112 328)">
  <path d="M230 210 C230 120, 314 70, 424 70 C534 70, 618 120, 618 210 V498 C618 610, 538 686, 424 686 C310 686, 230 610, 230 498 Z" fill="${palette.ink}" opacity="0.13" />
  <path d="M292 130 H556" stroke="${palette.accent}" stroke-width="22" stroke-linecap="round" opacity="0.86" />
  <circle cx="328" cy="430" r="54" fill="${palette.accent}" opacity="0.82" />
  <circle cx="430" cy="476" r="54" fill="${palette.accent2}" opacity="0.76" />
  <circle cx="528" cy="404" r="54" fill="${palette.accent}" opacity="0.66" />
  <path d="M194 796 C326 692, 496 844, 664 720 S760 618, 820 654" fill="none" stroke="${palette.accent2}" stroke-width="13" stroke-linecap="round" opacity="0.78" />
  <rect x="612" y="242" width="150" height="128" rx="28" fill="${palette.shadow}" opacity="0.22" />
  <path d="M646 246 v-44 c0-42 26-70 66-70 s66 28 66 70 v44" fill="none" stroke="${palette.accent2}" stroke-width="16" stroke-linecap="round" opacity="0.84" />
</g>`;
	}

	if (concept === "leak") {
		return `<g id="motif-finance-leak" transform="translate(96 338)">
  <rect x="112" y="190" width="560" height="358" rx="62" fill="${palette.ink}" opacity="0.14" />
  <path d="M156 224 C252 128, 438 130, 614 210" fill="none" stroke="${palette.accent}" stroke-width="20" stroke-linecap="round" opacity="0.86" />
  <path d="M640 314 C722 354, 794 424, 838 522" fill="none" stroke="${palette.accent2}" stroke-width="16" stroke-linecap="round" stroke-dasharray="20 26" opacity="0.78" />
  ${coin(710, 410, 42, palette.accent)}
  ${coin(796, 510, 34, palette.accent2)}
  ${coin(848, 632, 28, palette.ink)}
  <path d="M104 736 C242 648, 386 764, 526 688 S702 580, 830 618" fill="none" stroke="${palette.accent}" stroke-width="13" stroke-linecap="round" opacity="0.72" />
</g>`;
	}

	return `<g id="motif-finance-account" transform="translate(104 334)">
  <rect x="24" y="34" width="792" height="524" rx="54" fill="${palette.shadow}" opacity="0.22" />
  <rect x="0" y="0" width="746" height="494" rx="52" fill="${palette.ink}" opacity="0.12" />
  <rect x="70" y="82" width="210" height="28" rx="14" fill="${palette.accent}" opacity="0.92" />
  <path d="M86 178 H650 M86 278 H650 M86 378 H650" stroke="${palette.ink}" stroke-width="2" opacity="0.18" />
  <rect x="94" y="212" width="${250 + (hash % 160)}" height="34" rx="17" fill="${palette.accent2}" opacity="0.72" />
  <rect x="94" y="312" width="${190 + (hash % 220)}" height="34" rx="17" fill="${palette.accent}" opacity="0.78" />
  <circle cx="720" cy="${orbA}" r="118" fill="${role === "cta" ? palette.accent2 : palette.accent}" opacity="0.38" />
  <path d="M668 ${orbA} h104 M720 ${orbA - 52} v104" stroke="${palette.ink}" stroke-width="16" stroke-linecap="round" opacity="0.48" />
</g>`;
}

function buildWorkMotif(concept: VisualConcept, palette: Palette, hash: number): string {
	if (concept === "automation") {
		return `<g id="motif-work-automation" transform="translate(108 336)">
  <rect x="0" y="0" width="808" height="520" rx="48" fill="${palette.shadow}" opacity="0.22" />
  <rect x="72" y="92" width="232" height="116" rx="30" fill="${palette.ink}" opacity="0.14" />
  <rect x="504" y="92" width="232" height="116" rx="30" fill="${palette.ink}" opacity="0.14" />
  <rect x="288" y="308" width="232" height="116" rx="30" fill="${palette.ink}" opacity="0.14" />
  <path d="M304 150 H502 M620 208 V306 M404 308 V210" stroke="${palette.accent}" stroke-width="14" stroke-linecap="round" opacity="0.86" />
  <circle cx="304" cy="150" r="28" fill="${palette.accent2}" opacity="0.88" />
  <circle cx="620" cy="306" r="28" fill="${palette.accent2}" opacity="0.72" />
</g>`;
	}

	if (concept === "bottleneck") {
		return `<g id="motif-work-bottleneck" transform="translate(112 332)">
  <rect x="0" y="0" width="800" height="560" rx="50" fill="${palette.shadow}" opacity="0.22" />
  <path d="M88 150 H380 C458 150 458 410 380 410 H88" fill="none" stroke="${palette.accent}" stroke-width="24" stroke-linecap="round" opacity="0.78" />
  <path d="M712 150 H492 C414 150 414 410 492 410 H712" fill="none" stroke="${palette.accent2}" stroke-width="24" stroke-linecap="round" opacity="0.78" />
  <circle cx="400" cy="280" r="78" fill="${palette.ink}" opacity="0.18" />
  <circle cx="400" cy="280" r="28" fill="${palette.accent}" opacity="0.92" />
</g>`;
	}

	return `<g id="motif-work-planning" transform="translate(112 352)">
  <rect x="0" y="0" width="800" height="520" rx="46" fill="${palette.shadow}" opacity="0.2" />
  <rect x="70" y="92" width="660" height="120" rx="28" fill="${palette.ink}" opacity="0.12" />
  <rect x="116" y="134" width="210" height="22" rx="11" fill="${palette.accent}" opacity="0.88" />
  <path d="M160 336 H640 M250 276 V396 M400 276 V396 M550 276 V396" stroke="${palette.accent2}" stroke-width="12" stroke-linecap="round" opacity="0.74" />
  <circle cx="160" cy="336" r="42" fill="${palette.accent}" opacity="0.84" />
  <circle cx="400" cy="336" r="42" fill="${palette.ink}" opacity="0.18" />
  <circle cx="640" cy="336" r="42" fill="${palette.accent}" opacity="0.84" />
</g>`;
}

function buildContentMotif(concept: VisualConcept, palette: Palette, hash: number): string {
	if (concept === "growth") {
		return `<g id="motif-content-growth" transform="translate(112 342)">
  <rect x="0" y="0" width="800" height="548" rx="48" fill="${palette.shadow}" opacity="0.24" />
  <path d="M96 430 C230 352, 354 474, 502 402 S684 302, 744 362" fill="none" stroke="${palette.accent2}" stroke-width="16" stroke-linecap="round" opacity="0.78" />
  <rect x="132" y="318" width="76" height="132" rx="28" fill="${palette.accent}" opacity="0.76" />
  <rect x="282" y="252" width="76" height="198" rx="28" fill="${palette.ink}" opacity="0.2" />
  <rect x="432" y="190" width="76" height="260" rx="28" fill="${palette.accent2}" opacity="0.68" />
  <rect x="582" y="116" width="76" height="334" rx="28" fill="${palette.accent}" opacity="0.78" />
</g>`;
	}

	return `<g id="motif-content-creator" transform="translate(112 342)">
  <rect x="0" y="0" width="800" height="548" rx="48" fill="${palette.shadow}" opacity="0.24" />
  <path d="M132 138 L132 410 L406 274 Z" fill="${palette.accent}" opacity="0.92" />
  <rect x="484" y="112" width="188" height="314" rx="26" fill="${palette.ink}" opacity="0.13" />
  <rect x="522" y="214" width="74" height="160" rx="37" fill="${palette.ink}" opacity="0.24" />
  <circle cx="640" cy="176" r="42" fill="${palette.accent2}" opacity="0.7" />
  <path d="M88 470 C230 392, 354 514, 502 442 S684 342, 744 402" fill="none" stroke="${palette.accent2}" stroke-width="10" stroke-linecap="round" opacity="0.7" />
</g>`;
}

function buildGeneralMotif(concept: VisualConcept, palette: Palette, hash: number): string {
	return `<g id="motif-general-${concept}" transform="translate(112 364)">
  <rect x="0" y="0" width="800" height="500" rx="44" fill="${palette.shadow}" opacity="0.22" />
  <path d="M86 126 H704" stroke="${palette.ink}" stroke-width="2" opacity="0.18" />
  <path d="M86 250 H704" stroke="${palette.ink}" stroke-width="2" opacity="0.14" />
  <path d="M86 374 H704" stroke="${palette.ink}" stroke-width="2" opacity="0.1" />
  <circle cx="${204 + (hash % 46)}" cy="248" r="122" fill="${palette.accent}" opacity="0.78" />
  <rect x="426" y="132" width="232" height="232" rx="40" fill="${palette.accent2}" opacity="0.28" />
  <path d="M156 248 H634" stroke="${palette.ink}" stroke-width="14" stroke-linecap="round" opacity="0.72" />
</g>`;
}

function coin(cx: number, cy: number, r: number, color: string): string {
	return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.78" />`;
}

function pickPalette(domain: VisualDomain, hash: number): Palette {
	const palettes = PALETTES[domain];
	return palettes[hash % palettes.length]!;
}

function resolveDomain(value: string): VisualDomain {
	if (/월급|통장|돈|저축|소비|카드|가계부|재테크|고정비|구독료|지출|할부|계좌|생활비/.test(value)) {
		return "finance";
	}
	if (/ai|업무|야근|자동화|팀|회의|생산성|일정|리더|협업/i.test(value)) {
		return "work";
	}
	if (/썸네일|조회수|클릭|콘텐츠|쇼츠|릴스|광고|랜딩|마케팅|전환율/.test(value)) {
		return "content";
	}
	return "general";
}

function resolveConcept(value: string, domain: VisualDomain, role: SceneRole): VisualConcept {
	const normalized = value.toLowerCase();

	if (domain === "finance") {
		if (/카드|결제|card|payment/.test(normalized)) return "card";
		if (/구독|보험|할부|고정비|청구|bill|invoice|subscription/.test(normalized)) return "bills";
		if (/저축|남은 돈|잠급|saving|save|jar|coins/.test(normalized)) return "saving";
		if (/새는|사라지|빠지는|leak|lost/.test(normalized)) return "leak";
		return role === "cta" ? "planning" : "account";
	}

	if (domain === "work") {
		if (/자동화|ai|automation/.test(normalized)) return "automation";
		if (/병목|야근|검토|bottleneck|overtime|review/.test(normalized)) return "bottleneck";
		return "planning";
	}

	if (domain === "content") {
		if (/조회수|클릭|전환율|ctr|conversion|growth/.test(normalized)) return "growth";
		return "creator";
	}

	return role === "payoff" ? "growth" : "planning";
}

function positiveHash(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}
