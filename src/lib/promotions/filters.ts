import type { PromoItem } from "@/lib/types";

export const MIN_CUT = 0.3;

export function cutRate(row: PromoItem) {
  const previous = row.previousPrice;
  const now = row.promoPrice;
  if (previous == null || now == null || previous <= 0 || now >= previous) return 0;
  return (previous - now) / previous;
}

export function isMajorCut(row: PromoItem) {
  return cutRate(row) >= MIN_CUT;
}

export function keepMajor(items: PromoItem[]) {
  return items
    .filter(isMajorCut)
    .sort((a, b) => cutRate(b) - cutRate(a));
}

export function fillPromotions(items: PromoItem[], essentials: PromoItem[], limit = 100) {
  const used = new Set(essentials.map((row) => row.url));
  const rest = items.filter((row) => !used.has(row.url)).sort((a, b) => cutRate(b) - cutRate(a));
  return [...essentials, ...rest].slice(0, limit);
}

export function commonDate(values: (string | null | undefined)[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function dayPart(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  return value.slice(0, 10);
}
