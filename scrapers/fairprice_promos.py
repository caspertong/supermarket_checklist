"""Pull FairPrice weekly price cuts of 30% or more.

The public tag promotions-boost flips Thursday 04:01 Singapore time.
Run this Thursday at 10:00 Singapore time. Bundle deals with no straight
markdown, and longer monthly offers under 30% off, are left out.
"""
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fairprice import fetch, rows
from promo_store import keep_major, save_store

SGT = ZoneInfo("Asia/Singapore")
TAG = "promotions-boost"


def common(values):
    if not values:
        return None
    return max(set(values), key=values.count)


def day(value):
    if not value or not isinstance(value, str):
        return None
    return value[:10]


def pull():
    first = fetch("promo", TAG, 1)
    total_pages = int((first.get("pagination") or {}).get("total_pages") or 1)
    collected = []
    windows = []

    def take(data):
        for row in rows(data):
            if row.get("promo_price") is None and row.get("price") is None:
                continue
            windows.append((day(row.get("promo_from")), day(row.get("promo_till"))))
            collected.append(
                {
                    "name": row["name"],
                    "size": row.get("size"),
                    "price": row.get("price"),
                    "promoPrice": row.get("promo_price"),
                    "previousPrice": row.get("price") if row.get("promo_price") not in (None, row.get("price")) else None,
                    "detail": (row.get("promo_desc") or "").strip() or None,
                    "until": day(row.get("promo_till")),
                    "url": row["url"],
                }
            )

    take(first)
    for page in range(2, total_pages + 1):
        time.sleep(0.4)
        take(fetch("promo", TAG, page))
        print(f"fairprice page {page}/{total_pages}", flush=True)

    starts = [start for start, _ in windows if start]
    ends = [end for _, end in windows if end]
    save_store(
        "fairprice",
        {
            "fetchedAt": datetime.now(SGT).isoformat(timespec="seconds"),
            "validFrom": common(starts),
            "validTill": common(ends),
            "note": "At least 30% off. Bundle deals and the monthly list are left out.",
            "leafletUrl": None,
            "items": keep_major(collected),
        },
    )


if __name__ == "__main__":
    pull()
