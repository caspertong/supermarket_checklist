import { json, withSession } from "@/lib/http";
import { setStore } from "@/lib/lists";
import { notifyOthers } from "@/lib/push";

export async function POST(request: Request) {
  return withSession(async (session) => {
    const body = (await request.json().catch(() => null)) as { kind?: unknown } | null;
    const kind = body?.kind;
    if (kind !== "fairprice" && kind !== "shengsiong" && kind !== "check") {
      return json({ error: "Choose a nudge." }, 400);
    }
    let list = null;
    if (kind === "fairprice" || kind === "shengsiong") {
      list = (await setStore(session, kind)).list;
    }
    const text =
      kind === "fairprice"
        ? `${session.name}: I'm at FairPrice`
        : kind === "shengsiong"
          ? `${session.name}: I'm at Sheng Siong`
          : `${session.name}: Please check the list`;
    await notifyOthers({
      householdId: session.householdId,
      actorId: session.memberId,
      body: text,
      force: true,
    });
    return json({ ok: true, list });
  });
}
