import json
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / "data" / "promotions.json"
MIN_CUT = 0.30


def is_major_cut(row: dict) -> bool:
    previous = row.get("previousPrice")
    now = row.get("promoPrice")
    if not isinstance(previous, (int, float)) or not isinstance(now, (int, float)):
        return False
    if previous <= 0 or now >= previous:
        return False
    return (previous - now) / previous >= MIN_CUT


def keep_major(items: list[dict]) -> list[dict]:
    kept = [row for row in items if is_major_cut(row)]
    kept.sort(key=lambda row: (row["previousPrice"] - row["promoPrice"]) / row["previousPrice"], reverse=True)
    return kept


def save_store(store: str, payload: dict) -> None:
    data = {}
    if PATH.exists():
        data = json.loads(PATH.read_text(encoding="utf-8"))
    data[store] = payload
    PATH.parent.mkdir(exist_ok=True)
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {store}: {len(payload.get('items', []))} items -> {PATH}")
