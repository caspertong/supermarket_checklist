import { readFile } from "node:fs/promises";
import path from "node:path";
import { json, withSession } from "@/lib/http";
import type { PromotionsDTO, StoreName, StorePromos } from "@/lib/types";

const EMPTY: StorePromos = {
  fetchedAt: null,
  validFrom: null,
  validTill: null,
  note: null,
  leafletUrl: null,
  items: [],
};

export async function GET() {
  return withSession(async () => {
    const file = path.join(process.cwd(), "data", "promotions.json");
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<PromotionsDTO>;
      const stores: StoreName[] = ["fairprice", "shengsiong"];
      const payload = Object.fromEntries(stores.map((store) => [store, parsed[store] ?? EMPTY])) as PromotionsDTO;
      return json(payload);
    } catch {
      return json({ fairprice: EMPTY, shengsiong: EMPTY } satisfies PromotionsDTO);
    }
  });
}
