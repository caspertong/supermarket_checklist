import { json, withSession } from "@/lib/http";
import { getToday, setStore } from "@/lib/lists";

export async function GET(request: Request) {
  return withSession(async (session) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get("revision");
    const revision = raw == null || raw === "" ? null : Number(raw);
    const visible = url.searchParams.get("visible") === "1";
    const result = await getToday(session, Number.isFinite(revision) ? revision : null, visible);
    if (result.unchanged) return json({ unchanged: true, revision: result.revision });
    return json({ unchanged: false, ...result.list });
  });
}

export async function PATCH(request: Request) {
  return withSession(async (session) => {
    const body = (await request.json().catch(() => null)) as { store?: unknown } | null;
    const { list } = await setStore(session, body?.store ?? null);
    return json(list);
  });
}
