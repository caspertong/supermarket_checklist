import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { promotionStores } from "@/db/schema";
import type { PromotionsDTO, StoreName, StorePromos } from "@/lib/types";

const EMPTY: StorePromos = {
  fetchedAt: null,
  validFrom: null,
  validTill: null,
  note: null,
  leafletUrl: null,
  items: [],
};

async function fromFile(): Promise<Partial<PromotionsDTO>> {
  try {
    const file = path.join(process.cwd(), "data", "promotions.json");
    return JSON.parse(await readFile(file, "utf8")) as Partial<PromotionsDTO>;
  } catch {
    return {};
  }
}

export async function loadPromotions(): Promise<PromotionsDTO> {
  const fileData = await fromFile();
  if (!process.env.DATABASE_URL) {
    return {
      fairprice: fileData.fairprice ?? EMPTY,
      shengsiong: fileData.shengsiong ?? EMPTY,
    };
  }

  const db = await getDb();
  const rows = await db.select().from(promotionStores);
  const byStore = new Map(rows.map((row) => [row.store as StoreName, row.payload]));
  return {
    fairprice: byStore.get("fairprice") ?? fileData.fairprice ?? EMPTY,
    shengsiong: byStore.get("shengsiong") ?? fileData.shengsiong ?? EMPTY,
  };
}

export async function savePromotionStore(store: StoreName, payload: StorePromos) {
  if (!process.env.DATABASE_URL) {
    const file = path.join(process.cwd(), "data", "promotions.json");
    const current = await fromFile();
    current[store] = payload;
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(current, null, 2), "utf8");
    return;
  }

  const db = await getDb();
  await db
    .insert(promotionStores)
    .values({ store, payload, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: promotionStores.store,
      set: { payload, updatedAt: new Date() },
    });
}

export async function refreshPromotionStore(store: StoreName) {
  const { pullFairpricePromotions } = await import("./fairprice");
  const { pullShengsiongPromotions } = await import("./shengsiong");
  const payload =
    store === "fairprice" ? await pullFairpricePromotions() : await pullShengsiongPromotions();
  await savePromotionStore(store, payload);
  return payload;
}

export function isStoreName(value: string | null): value is StoreName {
  return value === "fairprice" || value === "shengsiong";
}
