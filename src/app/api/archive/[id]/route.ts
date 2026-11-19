import { json, withSession } from "@/lib/http";
import { ListError, readArchivedList } from "@/lib/lists";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withSession(async (session) => {
    const { id } = await context.params;
    const list = await readArchivedList(session.householdId, id);
    if (!list) throw new ListError(404, "That list is not in the archive.");
    return json(list);
  });
}
