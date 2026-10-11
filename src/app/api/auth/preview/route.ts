import { previewMembers } from "@/lib/auth";
import { json, withErrors } from "@/lib/http";

export async function POST(request: Request) {
  return withErrors(async () => {
    const body = (await request.json().catch(() => null)) as { passphrase?: unknown } | null;
    const members = await previewMembers(body?.passphrase);
    return json({ members });
  });
}
