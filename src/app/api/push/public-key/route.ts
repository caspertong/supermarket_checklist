import { json } from "@/lib/http";
import { getSecrets } from "@/lib/secrets";

export async function GET() {
  return json({ publicKey: getSecrets().vapidPublicKey });
}
