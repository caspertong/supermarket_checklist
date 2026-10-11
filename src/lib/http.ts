import { ListError } from "./lists";
import { getSession, type Session } from "./session";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function withSession(handler: (session: Session) => Promise<Response>) {
  const session = await getSession();
  if (!session) return json({ error: "Sign in first." }, 401);
  try {
    return await handler(session);
  } catch (error) {
    if (error instanceof ListError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Something went wrong." }, 500);
  }
}

export async function withErrors(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ListError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Something went wrong." }, 500);
  }
}
