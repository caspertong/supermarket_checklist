import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members, type PushSubscriptionJSON } from "@/db/schema";
import { json, withSession } from "@/lib/http";

function isSubscription(value: unknown): value is PushSubscriptionJSON {
  if (!value || typeof value !== "object") return false;
  const subscription = value as PushSubscriptionJSON;
  return (
    typeof subscription.endpoint === "string" &&
    typeof subscription.keys?.p256dh === "string" &&
    typeof subscription.keys?.auth === "string"
  );
}

export async function POST(request: Request) {
  return withSession(async (session) => {
    const body = await request.json().catch(() => null);
    if (!isSubscription(body)) return json({ error: "That push subscription is not valid." }, 400);
    const db = await getDb();
    await db.update(members).set({ pushSubscription: body }).where(eq(members.id, session.memberId));
    return json({ ok: true });
  });
}

export async function DELETE() {
  return withSession(async (session) => {
    const db = await getDb();
    await db.update(members).set({ pushSubscription: null }).where(eq(members.id, session.memberId));
    return json({ ok: true });
  });
}
