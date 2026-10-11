import { setupHousehold } from "@/lib/auth";
import { json, withErrors } from "@/lib/http";

export async function POST(request: Request) {
  return withErrors(async () => {
    const body = (await request.json().catch(() => null)) as {
      passphrase?: unknown;
      nameA?: unknown;
      nameB?: unknown;
      slot?: unknown;
    } | null;
    if (!body) return json({ error: "The form was empty." }, 400);
    const member = await setupHousehold(body);
    return json({ member });
  });
}
