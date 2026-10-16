import WebSocket from "ws";
import type { PromoItem, StorePromos } from "@/lib/types";
import { fillPromotions, keepMajor } from "./filters";
import { keepEssentials } from "./essentials";

const SOCKET = "wss://shengsiong.com.sg/websocket";
const FILTERS = {
  categoryFilter: { slugs: [] },
  campaignPageFilter: { slug: "", category: { slug: "" } },
  shoppingListFilter: { slug: "", category: { slug: "" }, search: { slug: "" }, showKeptForLater: false },
  searchFilter: { slug: "", category: { slug: "" } },
  preOrderCampaignFilter: { slug: "", category: { slug: "" } },
  ecommPromotionFilter: { active: true, category: { slug: "" } },
};
const MISC = {
  brands: { slugs: [] },
  prices: { slugs: [] },
  countryOfOrigins: { slugs: [] },
  dietaryHabits: { slugs: [] },
  tags: { slugs: [] },
  promotionTypes: { slugs: [] },
  sortBy: { slug: "" },
};

type SsProduct = {
  brand?: string;
  name?: string;
  packSize?: string;
  price?: number;
  prevPrice?: number;
  slug?: string;
  associatedPromoRules?: unknown;
};

function rowFromProduct(product: SsProduct): PromoItem | null {
  const brand = (product.brand ?? "").trim();
  const name = (product.name ?? "").trim();
  const label = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}`.trim() : name;
  const price = product.price;
  let previous = product.prevPrice ?? null;
  if (previous === 0) previous = null;
  if (!label || price == null) return null;
  if (previous == null && !product.associatedPromoRules) return null;
  const slug = product.slug;
  return {
    name: label,
    size: product.packSize ?? null,
    price: previous,
    promoPrice: price,
    previousPrice: previous,
    detail: null,
    until: null,
    url: slug ? `https://shengsiong.com.sg/product/${slug}` : "https://shengsiong.com.sg/promotions",
  };
}

class DdpSocket {
  private ws: WebSocket;
  private nextId = 1;
  private ready: Promise<void>;

  constructor() {
    this.ws = new WebSocket(SOCKET, { headers: { "User-Agent": "Mozilla/5.0" } });
    this.ready = new Promise((resolve, reject) => {
      this.ws.once("open", () => {
        this.ws.send(JSON.stringify({ msg: "connect", version: "1", support: ["1", "pre2", "pre1"] }));
      });
      const onMessage = (raw: WebSocket.RawData) => {
        const message = JSON.parse(String(raw)) as { msg?: string };
        if (message.msg === "ping") {
          this.ws.send(JSON.stringify({ msg: "pong" }));
          return;
        }
        if (message.msg === "connected") {
          this.ws.off("message", onMessage);
          resolve();
        }
      };
      this.ws.on("message", onMessage);
      this.ws.once("error", reject);
    });
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    await this.ready;
    const id = String(this.nextId++);
    this.ws.send(JSON.stringify({ msg: "method", method, params, id }));
    return new Promise((resolve, reject) => {
      const onMessage = (raw: WebSocket.RawData) => {
        const message = JSON.parse(String(raw)) as { msg?: string; id?: string; result?: T; error?: unknown };
        if (message.msg === "ping") {
          this.ws.send(JSON.stringify({ msg: "pong" }));
          return;
        }
        if (message.msg === "result" && message.id === id) {
          this.ws.off("message", onMessage);
          if (message.error) reject(message.error);
          else resolve(message.result as T);
        }
      };
      this.ws.on("message", onMessage);
      setTimeout(() => {
        this.ws.off("message", onMessage);
        reject(new Error("Sheng Siong socket timed out."));
      }, 60_000);
    });
  }

  close() {
    this.ws.close();
  }
}

export async function pullShengsiongPromotions(): Promise<StorePromos> {
  const socket = new DdpSocket();
  try {
    const count = await socket.call<{ count?: number }>("Products.getCountByAllSlugs", [FILTERS, MISC]);
    const total = count?.count ?? 0;
    const batch = await socket.call<SsProduct[]>("Products.getByAllSlugs", [
      FILTERS,
      MISC,
      1,
      Math.max(total, 5000),
    ]);
    const seen = new Set<string>();
    const raw: PromoItem[] = [];
    for (const product of batch ?? []) {
      const row = rowFromProduct(product);
      if (!row || seen.has(row.url)) continue;
      seen.add(row.url);
      raw.push(row);
    }
    const major = keepMajor(raw);
    const items = fillPromotions(major, keepEssentials(major));

    const fetchedAt = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .replace(" ", "T")
      .concat("+08:00");

    return {
      fetchedAt,
      validFrom: null,
      validTill: null,
      note: "Household essentials first, then the other cuts of 30% or more.",
      leafletUrl: null,
      items,
    };
  } finally {
    socket.close();
  }
}
