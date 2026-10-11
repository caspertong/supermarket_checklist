"""FairPrice prices + promos via the public website API (no login).
Verified 2026-10-12. Usage:
  python fairprice.py category rice 1
  python fairprice.py promo promotions-boost 1     # Weekly Promotions
  python fairprice.py search milo 1
Promo slugs seen on /promotions: promotions-boost (Weekly), curated-lowest-price-in-30-days
(Price Slash), mix-and-match-1, carton-and-bundle-deals, campaign-flash-sale, ...
Page size is fixed at 20; loop `page` up to pagination.total_pages. Be gentle (sleep between pages).
"""
import sys, time, requests

API = "https://website-api.omni.fairprice.com.sg/api/product/v2"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"}

def fetch(kind, slug, page=1):
    if kind == "search":
        params = {"q": slug, "page": page}
    else:  # category or promo tag slug
        params = {"category": slug, "url": slug, "page": page,
                  "pageType": "category" if kind == "category" else "tag"}
    params["includeTagDetails"] = "true"
    r = requests.get(API, params=params, headers=UA, timeout=20)
    r.raise_for_status()
    return r.json()["data"]

def rows(data):
    for p in data.get("product", []):
        offers = p.get("offers") or []
        best = min((o for o in offers if o.get("price")), key=lambda o: o["price"], default=None)
        yield {
            "id": p["id"], "sku": p.get("clientItemId"), "name": p["name"],
            "size": (p.get("metaData") or {}).get("DisplayUnit"),
            "price": p.get("final_price"),
            "promo_price": best and best["price"],
            "promo_desc": "; ".join(o.get("shortDescriptionA") or o.get("description") or "" for o in offers),
            "promo_from": best and best.get("validFrom"), "promo_till": best and best.get("validTill"),
            "in_stock": p.get("has_stock"),
            "url": f"https://www.fairprice.com.sg/product/{p['slug']}",
        }

if __name__ == "__main__":
    kind, slug, page = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1
    d = fetch(kind, slug, page)
    print("pagination:", d.get("pagination"))
    for row in rows(d):
        print(row)
