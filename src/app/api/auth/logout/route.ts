import { logoutMember } from "@/lib/auth";
import { json, withErrors } from "@/lib/http";

export async function POST() {
  return withErrors(async () => {
    await logoutMember();
    return json({ ok: true });
  });
}
