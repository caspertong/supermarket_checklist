import { json } from "@/lib/http";
import { isStoreName, refreshPromotionStore } from "@/lib/promotions/repository";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return json({ error: "Unauthorized." }, 401);
  }

  const store = new URL(request.url).searchParams.get("store");
  if (!isStoreName(store)) {
    return json({ error: "Use store=fairprice or store=shengsiong." }, 400);
  }

  try {
    const payload = await refreshPromotionStore(store);
    return json({
      ok: true,
      store,
      fetchedAt: payload.fetchedAt,
      count: payload.items.length,
    });
  } catch (error) {
    console.error("promotion refresh failed", store, error);
    return json(
      { error: error instanceof Error ? error.message : "Promotion refresh failed." },
      500,
    );
  }
}
