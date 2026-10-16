import { json, withSession } from "@/lib/http";
import { loadPromotions } from "@/lib/promotions/repository";

export async function GET() {
  return withSession(async () => json(await loadPromotions()));
}
