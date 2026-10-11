import { readAuthState } from "@/lib/auth";
import { json, withErrors } from "@/lib/http";

export async function GET() {
  return withErrors(async () => json(await readAuthState()));
}
