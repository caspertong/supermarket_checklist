import json
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / "data" / "promotions.json"


def save_store(store: str, payload: dict) -> None:
    data = {}
    if PATH.exists():
        data = json.loads(PATH.read_text(encoding="utf-8"))
    data[store] = payload
    PATH.parent.mkdir(exist_ok=True)
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {store}: {len(payload.get('items', []))} items -> {PATH}")
