import { json, withSession } from "@/lib/http";
import { copyUnchecked, ListError } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";
import { isIsoDate } from "@/lib/sgt";

export async function POST(_request: Request, context: { params: Promise<{ date: string }> }) {
  return withSession(async (session) => {
    const { date } = await context.params;
    if (!isIsoDate(date)) throw new ListError(400, "That date is not valid.");
    const { list, copied } = await copyUnchecked(session, date);
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: `${session.name} copied ${copied} leftover ${copied === 1 ? "item" : "items"} to today`,
    });
    return json(list);
  });
}
