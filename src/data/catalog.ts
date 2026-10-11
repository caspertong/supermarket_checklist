import type { StoreName } from "@/lib/types";

export type CatalogCategory =
  | "produce"
  | "meat"
  | "seafood"
  | "soy"
  | "dairy"
  | "pantry"
  | "bakery"
  | "household";

export type CatalogItem = {
  slug: string;
  name: string;
  aliases: string[];
  category: CatalogCategory;
  image: string;
  stores: StoreName[];
};

const both: StoreName[] = ["fairprice", "shengsiong"];

function item(
  slug: string,
  name: string,
  category: CatalogCategory,
  aliases: string[],
): CatalogItem {
  return {
    slug,
    name,
    aliases,
    category,
    image: `/thumbs/${slug}.svg`,
    stores: both,
  };
}

export const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  produce: "Produce",
  meat: "Meat",
  seafood: "Seafood",
  soy: "Soy & tofu",
  dairy: "Dairy",
  pantry: "Pantry",
  bakery: "Bakery",
  household: "Household",
};

export const CATALOG: CatalogItem[] = [
  item("broccoli", "Broccoli", "produce", ["brocolli"]),
  item("spinach", "Spinach", "produce", ["spinnach", "spinage", "菠菜"]),
  item("bayam", "Bayam", "produce", ["amaranth", "red spinach"]),
  item("kailan", "Kailan", "produce", ["kai lan", "gai lan", "chinese broccoli", "芥兰", "芥藍"]),
  item("chye-sim", "Chye sim", "produce", ["choy sum", "caixin", "cai xin", "菜心"]),
  item("xiao-bai-cai", "Xiao bai cai", "produce", [
    "bok choy",
    "pak choy",
    "xiaobaicai",
    "siow pak chye",
    "小白菜",
  ]),
  item("kangkong", "Kangkong", "produce", ["kangkung", "water spinach", "蕹菜"]),
  item("cabbage", "Cabbage", "produce", ["round cabbage"]),
  item("carrot", "Carrot", "produce", ["carrots"]),
  item("cucumber", "Cucumber", "produce", ["cucumbers"]),
  item("tomato", "Tomato", "produce", ["tomatoes"]),
  item("onion", "Onion", "produce", ["onions", "yellow onion"]),
  item("garlic", "Garlic", "produce", []),
  item("ginger", "Ginger", "produce", []),
  item("chilli", "Chilli", "produce", ["chili", "red chilli", "red chili"]),
  item("potato", "Potato", "produce", ["potatoes"]),
  item("banana", "Banana", "produce", ["bananas"]),
  item("apple", "Apple", "produce", ["apples"]),
  item("lime", "Lime", "produce", ["limes", "limau"]),
  item("spring-onion", "Spring onion", "produce", ["scallion", "green onion"]),
  item("tau-geh", "Tau geh", "produce", [
    "tao gei",
    "taugeh",
    "tauge",
    "tau gei",
    "bean sprout",
    "bean sprouts",
    "豆芽",
  ]),
  item("mushroom", "Mushroom", "produce", ["mushrooms", "button mushroom"]),
  item("chicken", "Chicken", "meat", ["whole chicken", "ayam"]),
  item("chicken-drumstick", "Chicken drumstick", "meat", [
    "drumstick",
    "chicken leg",
    "chicken drumsticks",
    "鸡腿",
  ]),
  item("chicken-breast", "Chicken breast", "meat", ["boneless breast"]),
  item("chicken-wing", "Chicken wing", "meat", ["chicken wings", "wings"]),
  item("minced-pork", "Minced pork", "meat", ["pork mince", "ground pork"]),
  item("pork-belly", "Pork belly", "meat", ["samgyeopsal", "三层肉"]),
  item("fish", "Fish", "seafood", ["ikan", "yu", "鱼"]),
  item("salmon", "Salmon", "seafood", []),
  item("prawn", "Prawn", "seafood", ["prawns", "shrimp", "udang"]),
  item("squid", "Squid", "seafood", ["sotong"]),
  item("egg", "Egg", "pantry", ["eggs", "鸡蛋"]),
  item("tofu", "Tofu", "soy", ["toufu", "tau hu", "tauhu", "doufu", "beancurd", "豆腐"]),
  item("tau-kwa", "Tau kwa", "soy", ["tau gua", "taugua", "taukwa", "tau kua", "豆干"]),
  item("tau-pok", "Tau pok", "soy", ["taupok", "tofu puff", "tofu puffs", "fried tofu"]),
  item("milk", "Milk", "dairy", ["fresh milk", "牛奶"]),
  item("yoghurt", "Yoghurt", "dairy", ["yogurt", "yoghurt"]),
  item("cheese", "Cheese", "dairy", []),
  item("butter", "Butter", "dairy", []),
  item("rice", "Rice", "pantry", ["white rice"]),
  item("mee", "Mee", "pantry", ["yellow noodle", "yellow noodles", "noodles"]),
  item("instant-noodles", "Instant noodles", "pantry", ["maggi", "indomie", "instant noodle"]),
  item("soy-sauce", "Soy sauce", "pantry", ["soya sauce", "light soy sauce"]),
  item("oyster-sauce", "Oyster sauce", "pantry", []),
  item("cooking-oil", "Cooking oil", "pantry", ["oil", "vegetable oil"]),
  item("bread", "Bread", "bakery", ["gardenia", "loaf"]),
  item("salt", "Salt", "pantry", []),
  item("sugar", "Sugar", "pantry", []),
  item("toilet-paper", "Toilet paper", "household", ["toilet roll", "tissue"]),
  item("detergent", "Detergent", "household", ["laundry detergent", "washing powder"]),
  item("dish-soap", "Dish soap", "household", ["dishwashing liquid", "dish washing"]),
];

export const FALLBACK_IMAGE = "/thumbs/grocery.svg";

export function normalizeQuery(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesOf(item: CatalogItem) {
  return [item.name, ...item.aliases].map(normalizeQuery);
}

export function exactMatch(query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) return undefined;
  return CATALOG.find((entry) => namesOf(entry).includes(normalized));
}

export function suggestItems(query: string, limit = 6) {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  return CATALOG.map((entry) => {
    let score = 0;
    for (const name of namesOf(entry)) {
      if (name === normalized) score = Math.max(score, 100);
      else if (name.startsWith(normalized)) score = Math.max(score, 80);
      else if (name.includes(normalized)) score = Math.max(score, 50);
    }
    return { entry, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map((row) => row.entry);
}

export function imageForSlug(slug: string | null | undefined) {
  if (!slug) return FALLBACK_IMAGE;
  return CATALOG.find((entry) => entry.slug === slug)?.image ?? FALLBACK_IMAGE;
}

export function resolveEntry(query: string) {
  const match = exactMatch(query);
  if (match) {
    return { name: match.name, slug: match.slug, image: match.image };
  }
  const trimmed = query.trim().replace(/\s+/g, " ");
  return { name: trimmed, slug: null as string | null, image: FALLBACK_IMAGE };
}
