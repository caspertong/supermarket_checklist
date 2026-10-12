"""Match a promo row to a household catalog item, and keep the deepest cut for each."""
import re
from pathlib import Path

CATALOG = Path(__file__).resolve().parents[1] / "src" / "data" / "catalog.ts"

JUNK = (
    "shampoo", "body wash", "mouthwash", "deodorant", "dehumidifier", "laundry",
    "capsule", "cookie", "biscuit", "cracker", "nugget", "porridge", "pickled",
    "candy", "chocolate", "ice cream", "sandwich", "mantou", "bao", "pie",
    "cutlet", "cleaner", "yakitori", "puff",
)
HOUSEHOLD = {"detergent", "toilet-paper", "dish-soap", "wet-tissue", "baby-wipe", "diaper"}
SKIP_ALIASES = {"tissue", "oil"}
BLOCKS = {
    "sugar": ("drink", "nest", "pear", "reduced", "less", "kopi", "coffee"),
    "butter": ("peanut", "mussel", "sauce"),
    "garlic": ("mussel", "sauce", "crawfish", "seasoned"),
    "potato": ("curry",),
    "milk": ("wash", "almond", "goat"),
    "fresh-milk": ("wash", "almond", "goat"),
    "apple": ("shampoo", "drink", "sparkling", "cider"),
    "green-tea": ("mouthwash", "listerine"),
    "cheese": ("ring", "popcorn"),
    "salt": ("grilled", "salty"),
    "tofu": ("roll", "ring", "wrap"),
    "tomato": ("mussel", "sauce"),
    "chilli": ("fish head", "sauce"),
    "ginger": ("cleaner", "yuzu"),
    "prawn": ("ball", "paste", "cracker"),
}


def norm(value):
    return re.sub(r"[^a-z0-9\u4e00-\u9fff ]+", " ", value.lower()).strip()


def contains_term(padded, term):
    if re.search(r"[\u4e00-\u9fff]", term):
        return term in padded
    if f" {term} " in padded:
        return True
    words = term.split()
    if not words:
        return False
    for suffix in ("s", "es"):
        plural = " ".join([*words[:-1], words[-1] + suffix])
        if f" {plural} " in padded:
            return True
    return False


def catalog_entries():
    text = CATALOG.read_text(encoding="utf-8")
    entries = []
    for match in re.finditer(
        r"item\(\s*\"([^\"]+)\"\s*,\s*\"([^\"]+)\"\s*,\s*\"([^\"]+)\"\s*,\s*\[(.*?)\]\s*\)\s*,",
        text,
        re.S,
    ):
        aliases = [match.group(2), *re.findall(r"\"([^\"]+)\"", match.group(4))]
        entries.append((match.group(1), match.group(2), aliases))
    return entries


def match_slug(name, entries):
    padded = f" {norm(name)} "
    junk = any(contains_term(padded, word) for word in JUNK)
    best = None
    for slug, _label, aliases in entries:
        if junk and slug not in HOUSEHOLD:
            continue
        if any(contains_term(padded, word) for word in BLOCKS.get(slug, ())):
            continue
        for alias in aliases:
            term = norm(alias)
            if not term or term in SKIP_ALIASES:
                continue
            if len(term) < 3 and not re.search(r"[\u4e00-\u9fff]", term):
                continue
            if contains_term(padded, term) and (best is None or len(term) > best[0]):
                best = (len(term), slug, _label)
    if best:
        return best[1], best[2]
    if "sesame" in padded and contains_term(padded, "oil"):
        return "sesame-oil", "Sesame oil"
    if contains_term(padded, "oil") and not any(word in padded for word in ("chilli", "chili", "truffle")):
        return "cooking-oil", "Cooking oil"
    return None, None


def keep_essentials(items):
    entries = catalog_entries()
    chosen = {}
    for row in items:
        previous = row.get("previousPrice")
        now = row.get("promoPrice")
        if not previous or not now or previous <= 0 or now >= previous:
            continue
        slug, label = match_slug(row.get("name") or "", entries)
        if not slug:
            continue
        cut = (previous - now) / previous
        current = chosen.get(slug)
        if current is None or cut > current[0]:
            chosen[slug] = (cut, {**row, "detail": label})
    kept = [row for _cut, row in chosen.values()]
    kept.sort(key=lambda row: (row["previousPrice"] - row["promoPrice"]) / row["previousPrice"], reverse=True)
    return kept


def fill_promotions(items, limit=100):
    essentials = keep_essentials(items)
    used = {row["url"] for row in essentials}
    rest = [row for row in items if row.get("url") not in used]
    rest.sort(key=lambda row: (row["previousPrice"] - row["promoPrice"]) / row["previousPrice"], reverse=True)
    return (essentials + rest)[:limit]
