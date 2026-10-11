import webpush from "web-push";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { members, type PushSubscriptionJSON } from "@/db/schema";
import { getSecrets } from "./secrets";

const WATCHING_MS = 8000;

let configured = false;

function configurePush() {
  if (configured) return;
  const secrets = getSecrets();
  webpush.setVapidDetails(secrets.vapidSubject, secrets.vapidPublicKey, secrets.vapidPrivateKey);
  configured = true;
}

function seenRecently(value: Date | string | null) {
  if (!value) return false;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Date.now() - time < WATCHING_MS;
}

export async function notifyOthers(options: {
  householdId: string;
  actorId: string;
  body: string;
  force?: boolean;
  url?: string;
}) {
  try {
    configurePush();
    const db = await getDb();
    const others = await db
      .select()
      .from(members)
      .where(and(eq(members.householdId, options.householdId), ne(members.id, options.actorId)));

    const payload = JSON.stringify({
      title: "Dou's",
      body: options.body,
      url: options.url ?? "/",
    });

    await Promise.all(
      others.map(async (member) => {
        if (!member.pushSubscription) return;
        if (!options.force && seenRecently(member.lastSeenAt)) return;
        try {
          await webpush.sendNotification(member.pushSubscription as PushSubscriptionJSON, payload);
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await db
              .update(members)
              .set({ pushSubscription: null })
              .where(eq(members.id, member.id));
          } else {
            console.error("Push failed", error);
          }
        }
      }),
    );
  } catch (error) {
    console.error("Push failed", error);
  }
}
