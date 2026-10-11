"""Pull Sheng Siong online promotions, plus the current in-store leaflet.

The newspaper leaflet is a two-week special. The one posted 2 Oct 2026
covers Friday 2 Oct through Thursday 15 Oct. The online Promotions page
is a separate list and is refreshed on the same Friday run.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
import websocket

sys.path.insert(0, str(Path(__file__).resolve().parent))

from promo_store import save_store

SGT = ZoneInfo("Asia/Singapore")
UA = {"User-Agent": "Mozilla/5.0"}
SOCKET = "wss://shengsiong.com.sg/websocket"
PAGE_SIZE = 5000
FILTERS = {
    "categoryFilter": {"slugs": []},
    "campaignPageFilter": {"slug": "", "category": {"slug": ""}},
    "shoppingListFilter": {"slug": "", "category": {"slug": ""}, "search": {"slug": ""}, "showKeptForLater": False},
    "searchFilter": {"slug": "", "category": {"slug": ""}},
    "preOrderCampaignFilter": {"slug": "", "category": {"slug": ""}},
    "ecommPromotionFilter": {"active": True, "category": {"slug": ""}},
}
MISC = {
    "brands": {"slugs": []},
    "prices": {"slugs": []},
    "countryOfOrigins": {"slugs": []},
    "dietaryHabits": {"slugs": []},
    "tags": {"slugs": []},
    "promotionTypes": {"slugs": []},
    "sortBy": {"slug": ""},
}


class Socket:
    def __init__(self):
        self.ws = websocket.create_connection(SOCKET, timeout=30, header=["User-Agent: Mozilla/5.0"])
        self.ws.send(json.dumps({"msg": "connect", "version": "1", "support": ["1", "pre2", "pre1"]}))
        self._read(lambda message: message.get("msg") == "connected")
        self.next_id = 1

    def call(self, method, params):
        call_id = str(self.next_id)
        self.next_id += 1
        self.ws.send(json.dumps({"msg": "method", "method": method, "params": params, "id": call_id}))
        message = self._read(lambda frame: frame.get("msg") == "result" and frame.get("id") == call_id)
        if message.get("error"):
            raise RuntimeError(message["error"])
        return message.get("result")

    def close(self):
        self.ws.close()

    def _read(self, predicate):
        for _ in range(30):
            message = json.loads(self.ws.recv())
            if message.get("msg") == "ping":
                self.ws.send(json.dumps({"msg": "pong"}))
                continue
            if predicate(message):
                return message
        raise TimeoutError("Sheng Siong socket did not answer.")


def leaflet():
    response = requests.get(
        "https://corporate.shengsiong.com.sg/wp-json/wp/v2/posts",
        params={"categories": 58, "per_page": 1, "_fields": "date,link,title,content"},
        headers=UA,
        timeout=20,
    )
    response.raise_for_status()
    posts = response.json()
    if not posts:
        return None
    post = posts[0]
    html = post["content"]["rendered"]
    title = re.sub(r"<[^>]+>", "", post["title"]["rendered"])
    title = title.replace("&#8211;", "–").replace("&amp;", "&")
    dates = re.findall(r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})", title)
    parsed = []
    for day, month, year in dates:
        parsed.append(datetime.strptime(f"{day} {month} {year}", "%d %b %Y").date().isoformat())
    pdfs = re.findall(r'href="([^"]+\.pdf)"', html)
    return {
        "title": title,
        "url": post["link"],
        "pdf": pdfs[0] if pdfs else None,
        "validFrom": parsed[0] if parsed else None,
        "validTill": parsed[1] if len(parsed) > 1 else None,
    }


def item_row(product):
    brand = (product.get("brand") or "").strip()
    name = (product.get("name") or "").strip()
    label = f"{brand} {name}".strip() if brand and brand.lower() not in name.lower() else name
    price = product.get("price")
    previous = product.get("prevPrice") or None
    if previous == 0:
        previous = None
    if not label or price is None:
        return None
    if previous is None and not product.get("associatedPromoRules"):
        return None
    slug = product.get("slug")
    return {
        "name": label,
        "size": product.get("packSize"),
        "price": previous,
        "promoPrice": price,
        "previousPrice": previous,
        "detail": None,
        "until": None,
        "url": f"https://shengsiong.com.sg/product/{slug}" if slug else "https://shengsiong.com.sg/promotions",
    }


def pull():
    flyer = leaflet()
    socket = Socket()
    try:
        count = socket.call("Products.getCountByAllSlugs", [FILTERS, MISC]) or {}
        total = int(count.get("count") or 0)
        batch = socket.call("Products.getByAllSlugs", [FILTERS, MISC, 1, max(total, PAGE_SIZE)]) or []
        items = []
        seen = set()
        for product in batch:
            row = item_row(product)
            if not row or row["url"] in seen:
                continue
            seen.add(row["url"])
            items.append(row)
        print(f"shengsiong {len(items)}/{total}", flush=True)
    finally:
        socket.close()

    save_store(
        "shengsiong",
        {
            "fetchedAt": datetime.now(SGT).isoformat(timespec="seconds"),
            "validFrom": flyer.get("validFrom") if flyer else None,
            "validTill": flyer.get("validTill") if flyer else None,
            "note": flyer.get("title") if flyer else "Online promotions.",
            "leafletUrl": (flyer or {}).get("pdf") or (flyer or {}).get("url"),
            "items": items,
        },
    )


if __name__ == "__main__":
    pull()
