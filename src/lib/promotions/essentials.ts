import { readFileSync } from "node:fs";
import path from "node:path";
import type { PromoItem } from "@/lib/types";
import { cutRate } from "./filters";

const JUNK = [
  "shampoo", "body wash", "mouthwash", "deodorant", "dehumidifier", "laundry",
  "capsule", "cookie", "biscuit", "cracker", "nugget", "porridge", "pickled",
  "candy", "chocolate", "ice cream", "sandwich", "mantou", "bao", "pie",
  "cutlet", "cleaner", "yakitori", "puff",
];
const HOUSEHOLD = new Set(["detergent", "toilet-paper", "dish-soap", "wet-tissue", "baby-wipe", "diaper"]);
const SKIP_ALIASES = new Set(["tissue", "oil"]);
const BLOCKS: Record<string, string[]> = {
  sugar: ["drink", "nest", "pear", "reduced", "less", "kopi", "coffee"],
  butter: ["peanut", "mussel", "sauce"],
  garlic: ["mussel", "sauce", "crawfish", "seasoned"],
  potato: ["curry"],
  milk: ["wash", "almond", "goat"],
  "fresh-milk": ["wash", "almond", "goat"],
  apple: ["shampoo", "drink", "sparkling", "cider"],
  "green-tea": ["mouthwash", "listerine"],
  cheese: ["ring", "popcorn"],
  salt: ["grilled", "salty"],
  tofu: ["roll", "ring", "wrap"],
  tomato: ["mussel", "sauce"],
  chilli: ["fish head", "sauce"],
  ginger: ["cleaner", "yuzu"],
  prawn: ["ball", "paste", "cracker"],
};

type CatalogEntry = { slug: string; label: string; aliases: string[] };

function norm(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(padded: string, term: string) {
  if (/\p{Script=Han}/u.test(term)) return padded.includes(term);
  if (padded.includes(` ${term} `)) return true;
  const words = term.split(" ");
  if (!words.length) return false;
  for (const suffix of ["s", "es"]) {
    const plural = [...words.slice(0, -1), words.at(-1)! + suffix].join(" ");
    if (padded.includes(` ${plural} `)) return true;
  }
  return false;
}

function catalogEntries(): CatalogEntry[] {
  const file = path.join(process.cwd(), "src", "data", "catalog.ts");
  const text = readFileSync(file, "utf8");
  const entries: CatalogEntry[] = [];
  const pattern =
    /item\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"[^"]+"\s*,\s*\[([\s\S]*?)\]\s*\)\s*,/g;
  for (const match of text.matchAll(pattern)) {
    const slug = match[1];
    const label = match[2];
    const aliasBlock = match[3];
    const aliases = [label, ...aliasBlock.match(/"([^"]+)"/g)?.map((part) => part.slice(1, -1)) ?? []];
    entries.push({ slug, label, aliases });
  }
  return entries;
}

let cached: CatalogEntry[] | null = null;

function entries() {
  cached ??= catalogEntries();
  return cached;
}

function matchSlug(name: string) {
  const padded = ` ${norm(name)} `;
  const junk = JUNK.some((word) => containsTerm(padded, word));
  let best: { len: number; slug: string; label: string } | null = null;
  for (const entry of entries()) {
    if (junk && !HOUSEHOLD.has(entry.slug)) continue;
    const blocked = BLOCKS[entry.slug] ?? [];
    if (blocked.some((word) => containsTerm(padded, word))) continue;
    for (const alias of entry.aliases) {
      const term = norm(alias);
      if (!term || SKIP_ALIASES.has(term)) continue;
      if (term.length < 3 && !/\p{Script=Han}/u.test(term)) continue;
      if (containsTerm(padded, term) && (!best || term.length > best.len)) {
        best = { len: term.length, slug: entry.slug, label: entry.label };
      }
    }
  }
  if (best) return { slug: best.slug, label: best.label };
  if (padded.includes("sesame") && containsTerm(padded, "oil")) return { slug: "sesame-oil", label: "Sesame oil" };
  if (containsTerm(padded, "oil") && !["chilli", "chili", "truffle"].some((word) => padded.includes(word))) {
    return { slug: "cooking-oil", label: "Cooking oil" };
  }
  return null;
}

export function keepEssentials(items: PromoItem[]) {
  const chosen = new Map<string, { cut: number; row: PromoItem }>();
  for (const row of items) {
    const match = matchSlug(row.name);
    if (!match) continue;
    const cut = cutRate(row);
    if (cut < 0.3) continue;
    const current = chosen.get(match.slug);
    if (!current || cut > current.cut) {
      chosen.set(match.slug, { cut, row: { ...row, detail: match.label } });
    }
  }
  return [...chosen.values()]
    .map((entry) => entry.row)
    .sort((a, b) => cutRate(b) - cutRate(a));
}
