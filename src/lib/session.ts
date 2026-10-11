import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSecrets } from "./secrets";

export const SESSION_COOKIE = "dou_session";

export type Session = {
  householdId: string;
  memberId: string;
  name: string;
};

function secretKey() {
  return new TextEncoder().encode(getSecrets().authSecret);
}

export async function signSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("400d")
    .sign(secretKey());
}

export async function readSession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.householdId !== "string" ||
      typeof payload.memberId !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      householdId: payload.householdId,
      memberId: payload.memberId,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSession(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
