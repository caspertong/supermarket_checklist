import { json, withSession } from "@/lib/http";
import { removeItem, updateItem } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return withSession(async (session) => {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      quantity?: unknown;
      unit?: unknown;
      note?: unknown;
      checked?: unknown;
    } | null;
    if (!body) return json({ error: "The form was empty." }, 400);
    const { list, itemName, checkedChange } = await updateItem(session, id, body);
    if (checkedChange === true || checkedChange === false) {
      await notifyOthers({
        householdId: session.householdId,
        actorId: session.memberId,
        body:
          checkedChange === true
            ? `${session.name} checked ${itemName}`
            : `${session.name} put ${itemName} back`,
      });
    }
    return json(list);
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withSession(async (session) => {
    const { id } = await context.params;
    const { list, itemName } = await removeItem(session, id);
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: `${session.name} removed ${itemName}`,
    });
    return json(list);
  });
}
