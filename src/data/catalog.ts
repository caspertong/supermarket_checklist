import type { StoreName } from "@/lib/types";

export type CatalogCategory =
  | "produce"
  | "meat"
  | "seafood"
  | "soy"
  | "dairy"
  | "drinks"
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
  drinks: "Drinks",
  pantry: "Pantry",
  bakery: "Bakery",
  household: "Household",
};

export const CATALOG: CatalogItem[] = [
  item("broccoli", "Broccoli", "produce", ["brocolli"]),
  item("spinach", "Spinach", "produce", ["spinnach", "spinage", "bo cai", "菠菜"]),
  item("kai-choy", "Kai choy", "produce", ["gai choy", "mustard greens", "芥菜", "芥菜仔"]),
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
  item("cucumber", "Cucumber", "produce", ["cucumbers", "青瓜"]),
  item("old-cucumber", "Old cucumber", "produce", ["老黄瓜", "lou wong gua", "lao huang gua"]),
  item("bitter-gourd", "Bitter gourd", "produce", ["苦瓜", "bitter melon", "ku gua", "bittergourd"]),
  item("radish", "Radish", "produce", ["white radish", "daikon", "白萝卜", "萝卜", "lobak", "lo bak"]),
  item("long-bean", "Long bean", "produce", ["长豆", "kacang panjang", "snake bean"]),
  item("ladies-finger", "Lady's finger", "produce", ["okra", "羊角豆", "ladies finger"]),
  item("brinjal", "Brinjal", "produce", ["eggplant", "aubergine", "茄子"]),
  item("cauliflower", "Cauliflower", "produce", ["花菜"]),
  item("lettuce", "Lettuce", "produce", ["生菜"]),
  item("celery", "Celery", "produce", ["西芹", "chinese celery"]),
  item("pumpkin", "Pumpkin", "produce", ["南瓜"]),
  item("sweet-potato", "Sweet potato", "produce", ["番薯", "kumara"]),
  item("corn", "Corn", "produce", ["玉米", "sweet corn"]),
  item("wong-bok", "Wong bok", "produce", ["napa cabbage", "大白菜", "wongbok", "chinese cabbage"]),
  item("capsicum", "Capsicum", "produce", ["bell pepper", "青椒", "红椒"]),
  item("french-bean", "French bean", "produce", ["green bean", "四季豆"]),
  item("tomato", "Tomato", "produce", ["tomatoes"]),
  item("onion", "Onion", "produce", ["onions", "yellow onion"]),
  item("garlic", "Garlic", "produce", []),
  item("ginger", "Ginger", "produce", []),
  item("chilli", "Chilli", "produce", ["chili", "red chilli", "red chili"]),
  item("potato", "Potato", "produce", ["potatoes"]),
  item("banana", "Banana", "produce", ["bananas"]),
  item("apple", "Apple", "produce", ["apples"]),
  item("strawberry", "Strawberry", "produce", ["strawberries", "草莓"]),
  item("kiwi", "Kiwi", "produce", ["kiwifruit", "kiwi fruit", "奇异果"]),
  item("grape", "Grape", "produce", ["grapes", "葡萄"]),
  item("watermelon", "Watermelon", "produce", ["water melon", "西瓜"]),
  item("honeydew", "Honeydew", "produce", ["honey dew", "蜜瓜"]),
  item("papaya", "Papaya", "produce", ["木瓜"]),
  item("passion-fruit", "Passion fruit", "produce", ["龙珠果", "百香果", "passionfruit"]),
  item("dragon-fruit", "Dragon fruit", "produce", ["火龙果"]),
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
  item("mushroom", "Mushroom", "produce", ["mushrooms", "button mushroom", "蘑菇", "白蘑菇", "mo gu"]),
  item("enoki", "Enoki mushroom", "produce", ["enoki", "golden needle mushroom", "金针菇", "jin zhen gu"]),
  item("shiitake", "Shiitake mushroom", "produce", ["shiitake", "xiang gu", "香菇", "冬菇", "dong gu"]),
  item("straw-mushroom", "Straw mushroom", "produce", ["straw mushroom", "cao gu", "草菇"]),
  item("chicken", "Chicken", "meat", ["whole chicken", "ayam"]),
  item("kampong-chicken", "Kampong chicken", "meat", ["kampung chicken", "甘榜鸡", "走地鸡"]),
  item("chicken-drumstick", "Chicken drumstick", "meat", [
    "drumstick",
    "chicken leg",
    "chicken drumsticks",
    "鸡腿",
  ]),
  item("chicken-breast", "Chicken breast", "meat", ["boneless breast"]),
  item("chicken-wing", "Chicken wing", "meat", ["chicken wings", "wings"]),
  item("minced-pork", "Minced pork", "meat", ["minced meat", "pork mince", "ground pork", "肉碎", "绞肉"]),
  item("pork-belly", "Pork belly", "meat", ["五花肉", "wu hua rou", "streaky pork"]),
  item("sam-chan", "Sam chan", "meat", ["三成肉", "三层肉", "sam chan yuk"]),
  item("false-loin", "False loin", "meat", ["假腰肉", "ka yew yuk"]),
  item("pork-loin", "Pork loin", "meat", ["腰肉", "yew yuk"]),
  item("pig-trotter", "Pig trotter", "meat", ["猪脚", "trotter", "pork knuckle"]),
  item("bak-kut", "Bak kut", "meat", ["bah kut", "肉骨", "排骨", "bak kut teh", "pork ribs"]),
  item("pork-chop", "Pork chop", "meat", ["pork chops"]),
  item("minced-beef", "Minced beef", "meat", ["beef mince", "ground beef"]),
  item("fish", "Fish", "seafood", ["ikan", "yu", "鱼"]),
  item("salmon", "Salmon", "seafood", ["三文鱼", "三文鱼片", "salmon fillet"]),
  item("batang", "Batang", "seafood", [
    "batang fish",
    "spanish mackerel",
    "mackerel",
    "马鲛鱼",
    "鲛鱼",
    "ikan tengiri",
    "tengiri",
  ]),
  item("prawn", "Prawn", "seafood", ["prawns", "shrimp", "udang"]),
  item("squid", "Squid", "seafood", ["sotong"]),
  item("fish-ball", "Fish ball", "seafood", ["fishball", "鱼圆", "鱼丸"]),
  item("fish-cake", "Fish cake", "seafood", ["fishcake", "鱼饼"]),
  item("crab-stick", "Crab stick", "seafood", ["crab sticks", "surimi", "蟹柳", "蟹味棒", "kanikama"]),
  item("pork-ball", "Pork ball", "meat", ["pork balls", "meatball", "meatballs", "猪肉丸", "肉丸"]),
  item("beef-ball", "Beef ball", "meat", ["beef balls", "牛肉丸"]),
  item("shabu-pork", "Shabu pork slice", "meat", ["shabu pork", "hotpot pork", "火锅猪肉片", "猪肉片"]),
  item("shabu-beef", "Shabu beef slice", "meat", ["shabu beef", "hotpot beef", "火锅牛肉片", "牛肉片"]),
  item("egg", "Egg", "pantry", ["eggs", "鸡蛋"]),
  item("quail-egg", "Quail egg", "pantry", ["quail eggs", "鹌鹑蛋"]),
  item("tofu", "Tofu", "soy", ["toufu", "tau hu", "tauhu", "doufu", "beancurd", "豆腐"]),
  item("tau-kwa", "Tau kwa", "soy", ["tau gua", "taugua", "taukwa", "tau kua", "豆干"]),
  item("tau-pok", "Tau pok", "soy", ["taupok", "tofu puff", "tofu puffs", "fried tofu"]),
  item("cheese-tofu", "Cheese tofu", "soy", ["cheese beancurd", "芝士豆腐", "奶酪豆腐"]),
  item("ring-roll", "Ring roll", "soy", [
    "xiang ling juan",
    "fried beancurd roll",
    "铃铃卷",
    "响铃卷",
    "instant bean curd roll",
  ]),
  item("fresh-milk", "Fresh milk", "dairy", ["milk", "牛奶", "freshmilk"]),
  item("packet-milk", "Packet milk", "dairy", ["uht milk", "packetmilk", "full cream milk", "盒装牛奶"]),
  item("oat-milk", "Oat milk", "dairy", ["oatmilk", "燕麦奶"]),
  item("soy-milk", "Soy milk", "dairy", ["soya milk", "soymilk", "豆奶"]),
  item("yoghurt", "Yoghurt", "dairy", ["yogurt", "yoghurt"]),
  item("cheese", "Cheese", "dairy", []),
  item("butter", "Butter", "dairy", []),
  item("rice", "Rice", "pantry", ["white rice"]),
  item("mee", "Mee", "pantry", ["yellow noodle", "yellow noodles", "noodles"]),
  item("bee-hoon", "Bee hoon", "pantry", ["rice vermicelli", "米粉", "mee hoon", "rice noodles"]),
  item("mee-sua", "Mee sua", "pantry", ["mee suah", "面线", "mian xian", "wheat vermicelli"]),
  item("tang-hoon", "Tang hoon", "pantry", [
    "tang hoon",
    "glass noodles",
    "cellophane noodles",
    "dong fen",
    "冬粉",
    "粉丝",
    "mung bean vermicelli",
  ]),
  item("hotpot-soup-base", "Hotpot soup base", "pantry", [
    "hotpot base",
    "hot pot soup",
    "火锅底料",
    "火锅汤料",
    "haidilao",
    "海底捞",
    "海底捞底料",
  ]),
  item("coconut-milk", "Coconut milk", "pantry", ["santan", "椰浆"]),
  item("instant-noodles", "Instant noodles", "pantry", ["maggi", "indomie", "instant noodle"]),
  item("spaghetti", "Spaghetti", "pantry", ["pasta", "意大利面"]),
  item("tuna-spread", "Tuna spread", "pantry", ["tuna", "吞拿鱼酱"]),
  item("sardine", "Sardine", "pantry", ["sardines", "沙丁鱼"]),
  item("luncheon-meat", "Luncheon meat", "pantry", ["午餐肉", "spam"]),
  item("pork-trotter", "Pork trotter", "pantry", ["猪脚罐", "猪脚灌", "canned pork trotter"]),
  item("coffee", "Coffee", "drinks", ["kopi", "咖啡"]),
  item("coffee-3in1", "3-in-1 coffee", "drinks", ["3 in 1 coffee", "3in1", "三合一咖啡"]),
  item("coffee-2in1", "2-in-1 coffee", "drinks", ["2 in 1 coffee", "2in1", "二合一咖啡"]),
  item("white-coffee", "White coffee", "drinks", ["白咖啡"]),
  item("nespresso", "Nespresso", "drinks", ["coffee capsule", "coffee pod", "胶囊咖啡"]),
  item("coca-cola", "Coca-Cola", "drinks", ["coke", "cola", "可乐"]),
  item("100-plus", "100 Plus", "drinks", ["100plus", "一百号"]),
  item("root-beer", "Root beer", "drinks", ["a and w", "aw root beer"]),
  item("sarsi", "Sarsi", "drinks", ["sarsaparilla"]),
  item("chrysanthemum-tea", "Chrysanthemum tea", "drinks", ["crysanthnum tea", "菊花茶"]),
  item("green-tea", "Green tea", "drinks", ["绿茶"]),
  item("lemon-tea", "Lemon tea", "drinks", ["ice lemon tea", "柠檬茶"]),
  item("coconut-water", "Coconut water", "drinks", ["椰子水", "椰青"]),
  item("milo", "Milo", "drinks", ["美禄"]),
  item("soy-bean", "Soy bean drink", "drinks", ["soybean", "豆浆", "yeos soybean"]),
  item("barley", "Barley", "drinks", ["barley drink", "薏米水"]),
  item("sugarcane", "Sugarcane", "drinks", ["sugar cane", "甘蔗水"]),
  item("yakult", "Yakult", "drinks", ["cultured milk", "vitagen"]),
  item("sprite", "Sprite", "drinks", ["7up", "7 up", "雪碧"]),
  item("pepsi", "Pepsi", "drinks", ["百事"]),
  item("orange-juice", "Orange juice", "drinks", ["橙汁"]),
  item("apple-juice", "Apple juice", "drinks", ["苹果汁"]),
  item("winter-melon", "Winter melon tea", "drinks", ["冬瓜茶"]),
  item("grass-jelly", "Grass jelly", "drinks", ["chin chow", "清凉", "凉粉"]),
  item("bandung", "Bandung", "drinks", ["rose syrup milk"]),
  item("kickapoo", "Kickapoo", "drinks", []),
  item("horlicks", "Horlicks", "drinks", ["好立克"]),
  item("ribena", "Ribena", "drinks", ["blackcurrant"]),
  item("light-soy", "Light soy sauce", "pantry", ["light soya sauce", "生抽", "sheng chou"]),
  item("dark-soy", "Dark soy sauce", "pantry", ["dark soya sauce", "老抽", "lao chou"]),
  item("sesame-oil", "Sesame oil", "pantry", ["seaseme oil", "麻油", "芝麻油", "ma you"]),
  item("hua-diao", "Hua diao jiu", "pantry", ["huadiao", "hua tiao jiu", "花雕酒", "花雕", "shaoxing", "绍兴酒"]),
  item("oyster-sauce", "Oyster sauce", "pantry", ["蚝油"]),
  item("cooking-oil", "Cooking oil", "pantry", ["oil", "vegetable oil"]),
  item("bread", "Bread", "bakery", ["gardenia", "loaf"]),
  item("salt", "Salt", "pantry", []),
  item("sugar", "Sugar", "pantry", []),
  item("toilet-paper", "Toilet paper", "household", ["toilet roll", "tissue"]),
  item("detergent", "Detergent", "household", ["laundry detergent", "washing powder"]),
  item("dish-soap", "Dish soap", "household", ["dishwashing liquid", "dish washing"]),
  item("wet-tissue", "Wet tissue", "household", ["wet tissues", "wet wipes", "湿纸巾", "湿巾"]),
  item("baby-wipe", "Baby wipe", "household", ["baby wipes", "婴儿湿巾", "宝宝湿巾"]),
  item("diaper", "Diapers", "household", ["diaper", "nappy", "nappies", "pampers", "尿片", "纸尿裤"]),
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

export function localName(entry: CatalogItem) {
  return entry.aliases.find((alias) => /\p{Script=Han}/u.test(alias)) ?? CATEGORY_LABEL[entry.category];
}

export function imageForSlug(slug: string | null | undefined) {
  if (!slug) return FALLBACK_IMAGE;
  if (slug === "milk") return "/thumbs/fresh-milk.svg";
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
