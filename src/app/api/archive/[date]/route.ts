import { json, withSession } from "@/lib/http";
import { readList, ListError } from "@/lib/lists";
import { isIsoDate, todaySGT } from "@/lib/sgt";

export async function GET(_request: Request, context: { params: Promise<{ date: string }> }) {
  return withSession(async (session) => {
    const { date } = await context.params;
    if (!isIsoDate(date) || date >= todaySGT()) {
      throw new ListError(404, "That day is not in the archive.");
    }
    const list = await readList(session.householdId, date);
    if (!list) throw new ListError(404, "That day has no list.");
    return json(list);
  });
}
