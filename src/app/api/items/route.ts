import { json, withSession } from "@/lib/http";
import { addItem } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";

export async function POST(request: Request) {
  return withSession(async (session) => {
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      quantity?: unknown;
      unit?: unknown;
      note?: unknown;
      slug?: unknown;
    } | null;
    if (!body) return json({ error: "The form was empty." }, 400);
    const { list, addedName } = await addItem(session, body);
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: `${session.name} added ${addedName}`,
    });
    return json(list);
  });
}
