import { json, withSession } from "@/lib/http";
import { copyUnchecked, ListError } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withSession(async (session) => {
    const { id } = await context.params;
    if (!id) throw new ListError(400, "That list is not valid.");
    const { list, copied } = await copyUnchecked(session, id);
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: `${session.name} copied ${copied} leftover ${copied === 1 ? "item" : "items"} to the list`,
    });
    return json(list);
  });
}
