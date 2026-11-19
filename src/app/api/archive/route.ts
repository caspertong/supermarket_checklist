import { json, withSession } from "@/lib/http";
import { archiveActive, listArchive } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";

export async function GET() {
  return withSession(async (session) => json(await listArchive(session.householdId)));
}

export async function POST() {
  return withSession(async (session) => {
    const { list } = await archiveActive(session);
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: `${session.name} archived the list`,
    });
    return json(list);
  });
}
