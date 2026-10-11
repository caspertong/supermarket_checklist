"""Sheng Siong in-store promo flyers via the corporate WordPress REST API (no login, not behind the shop WAF).
Verified 2026-10-12. Category 2 = "Promotions". Flyers are poster images + a PDF with outlined text
(pdftotext returns nothing), so item-level data needs OCR / a vision model.
Usage: python shengsiong_flyers.py
"""
import re, requests

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"}
URL = "https://corporate.shengsiong.com.sg/wp-json/wp/v2/posts"

r = requests.get(URL, params={"categories": 2, "per_page": 5, "_fields": "date,link,title,content"}, headers=UA, timeout=20)
r.raise_for_status()
for p in r.json():
    html = p["content"]["rendered"]
    print(p["date"], "|", p["title"]["rendered"], "|", p["link"])
    for u in re.findall(r'href="([^"]+\.pdf)"', html): print("   PDF:", u)
    for u in re.findall(r'<img[^>]+src="([^"]+)"', html): print("   IMG:", u)
