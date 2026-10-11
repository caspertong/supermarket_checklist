import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { households, members } from "@/db/schema";
import { getHousehold, ListError, memberNames } from "./lists";
import { clearSessionCookie, getSession, setSessionCookie, signSession } from "./session";

function cleanPersonName(value: unknown) {
  if (typeof value !== "string") throw new ListError(400, "Add both names.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 24) {
    throw new ListError(400, "Names need to be 1–24 characters.");
  }
  return name;
}

function cleanPassphrase(value: unknown) {
  if (typeof value !== "string") throw new ListError(400, "Choose a passphrase.");
  const passphrase = value.trim();
  if (passphrase.length < 4 || passphrase.length > 100) {
    throw new ListError(400, "Use a passphrase of at least 4 characters.");
  }
  return passphrase;
}

export async function readAuthState() {
  const household = await getHousehold();
  if (!household) return { state: "setup" as const };
  const session = await getSession();
  if (!session || session.householdId !== household.id) return { state: "login" as const };
  const people = await memberNames(household.id);
  const member = people.find((person) => person.id === session.memberId);
  if (!member) return { state: "login" as const };
  return { state: "in" as const, member };
}

export async function setupHousehold(input: {
  passphrase?: unknown;
  nameA?: unknown;
  nameB?: unknown;
  slot?: unknown;
}) {
  if (await getHousehold()) throw new ListError(409, "This family list is already set up.");
  const passphrase = cleanPassphrase(input.passphrase);
  const nameA = cleanPersonName(input.nameA);
  const nameB = cleanPersonName(input.nameB);
  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    throw new ListError(400, "Use two different names so you can tell each other apart.");
  }
  const slot = input.slot === 2 ? 2 : input.slot === 1 ? 1 : null;
  if (!slot) throw new ListError(400, "Choose which name this phone is.");

  const db = await getDb();
  const householdId = crypto.randomUUID();
  const firstId = crypto.randomUUID();
  const secondId = crypto.randomUUID();
  const passphraseHash = await bcrypt.hash(passphrase, 10);
  await db.insert(households).values({ id: householdId, passphraseHash });
  await db.insert(members).values([
    { id: firstId, householdId, name: nameA, slot: 1 },
    { id: secondId, householdId, name: nameB, slot: 2 },
  ]);
  const memberId = slot === 1 ? firstId : secondId;
  const name = slot === 1 ? nameA : nameB;
  const token = await signSession({ householdId, memberId, name });
  await setSessionCookie(token);
  return { id: memberId, name, slot };
}

export async function previewMembers(passphrase: unknown) {
  const household = await getHousehold();
  if (!household) throw new ListError(404, "Set up the list first.");
  const ok = await bcrypt.compare(cleanPassphrase(passphrase), household.passphraseHash);
  if (!ok) throw new ListError(401, "That passphrase does not match.");
  const people = await memberNames(household.id);
  return people.map((person) => ({ slot: person.slot, name: person.name }));
}

export async function loginMember(input: { passphrase?: unknown; slot?: unknown }) {
  const household = await getHousehold();
  if (!household) throw new ListError(404, "Set up the list first.");
  const ok = await bcrypt.compare(cleanPassphrase(input.passphrase), household.passphraseHash);
  if (!ok) throw new ListError(401, "That passphrase does not match.");
  const slot = input.slot === 2 ? 2 : input.slot === 1 ? 1 : null;
  if (!slot) throw new ListError(400, "Choose who you are.");
  const db = await getDb();
  const rows = await db.select().from(members).where(eq(members.householdId, household.id));
  const member = rows.find((person) => person.slot === slot);
  if (!member) throw new ListError(404, "That person is not on this list.");
  const token = await signSession({
    householdId: household.id,
    memberId: member.id,
    name: member.name,
  });
  await setSessionCookie(token);
  return { id: member.id, name: member.name, slot: member.slot };
}

export async function logoutMember() {
  await clearSessionCookie();
}
