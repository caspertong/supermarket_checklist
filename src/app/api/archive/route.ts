import { json, withSession } from "@/lib/http";
import { listArchive } from "@/lib/lists";

export async function GET() {
  return withSession(async (session) => json(await listArchive(session.householdId)));
}
