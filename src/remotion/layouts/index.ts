import type { CardLayout, LayoutName } from "./types";
import { CenteredCard } from "./CenteredCard";
import { FullBleedText } from "./FullBleedText";
import { SplitCard } from "./SplitCard";
import { QuoteCard } from "./QuoteCard";
import { StatCard } from "./StatCard";
import { ListCard } from "./ListCard";
import { ComparisonCard } from "./ComparisonCard";
import { MinimalCard } from "./MinimalCard";
import { ReferenceCard } from "./ReferenceCard";

const LAYOUT_REGISTRY: Record<LayoutName, CardLayout> = {
  centered: CenteredCard,
  fullBleed: FullBleedText,
  split: SplitCard,
  quote: QuoteCard,
  stat: StatCard,
  list: ListCard,
  comparison: ComparisonCard,
  minimal: MinimalCard,
  "reference-card": ReferenceCard,
};

/** Resolve a layout component by name. Falls back to CenteredCard. */
export function resolveLayout(name?: string): CardLayout {
  if (name && name in LAYOUT_REGISTRY) {
    return LAYOUT_REGISTRY[name as LayoutName];
  }
  return CenteredCard;
}

/** All available layout names */
export const LAYOUT_NAMES = Object.keys(LAYOUT_REGISTRY) as LayoutName[];

export type { LayoutProps, CardLayout, LayoutName } from "./types";
