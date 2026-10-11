import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { households, items, lists, members } from "@/db/schema";
import { CATALOG, exactMatch, imageForSlug, normalizeQuery } from "@/data/catalog";
import { formatDateLabel, todaySGT } from "./sgt";
import type { Session } from "./session";
import type { ArchiveEntry, ItemDTO, ListDTO, StoreName, Unit } from "./types";

const STORES = new Set<StoreName>(["fairprice", "shengsiong"]);

export class ListError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function asUnit(value: unknown): Unit {
  if (value === "pkt" || value === "kg" || value === "pcs") return value;
  return "pcs";
}

function asStore(value: unknown): StoreName | null {
  if (value === null || value === "") return null;
  if (typeof value === "string" && STORES.has(value as StoreName)) return value as StoreName;
  throw new ListError(400, "Choose FairPrice or Sheng Siong.");
}

function asQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ListError(400, "Quantity needs to be a whole number from 1 to 99.");
  }
  return quantity;
}

function asName(value: unknown) {
  if (typeof value !== "string") throw new ListError(400, "Add a name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) throw new ListError(400, "Use a shorter item name.");
  return name;
}

function asNote(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new ListError(400, "Note is not valid.");
  const note = value.trim();
  if (note.length > 120) throw new ListError(400, "Keep the note under 120 characters.");
  return note || null;
}

async function householdMembers(householdId: string) {
  const db = await getDb();
  return db.select().from(members).where(eq(members.householdId, householdId));
}

async function getOrCreateList(householdId: string, date: string) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(lists)
    .where(and(eq(lists.householdId, householdId), eq(lists.listDate, date)))
    .limit(1);
  if (existing[0]) return existing[0];

  const id = crypto.randomUUID();
  try {
    await db.insert(lists).values({
      id,
      householdId,
      listDate: date,
      revision: 1,
    });
  } catch {
    const again = await db
      .select()
      .from(lists)
      .where(and(eq(lists.householdId, householdId), eq(lists.listDate, date)))
      .limit(1);
    if (again[0]) return again[0];
    throw new ListError(500, "Could not open today's list.");
  }
  const created = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
  return created[0];
}

async function bump(listId: string) {
  const db = await getDb();
  await db
    .update(lists)
    .set({
      revision: sql`${lists.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId));
}

function toItem(
  row: typeof items.$inferSelect,
  names: Map<string, string>,
): ItemDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.catalogSlug,
    image: imageForSlug(row.catalogSlug),
    quantity: Number(row.quantity),
    unit: asUnit(row.unit),
    note: row.note,
    checked: row.checked,
    addedBy: row.addedBy ? (names.get(row.addedBy) ?? null) : null,
    checkedBy: row.checkedBy ? (names.get(row.checkedBy) ?? null) : null,
  };
}

export async function readList(householdId: string, date: string): Promise<ListDTO | null> {
  const db = await getDb();
  const listRows = await db
    .select()
    .from(lists)
    .where(and(eq(lists.householdId, householdId), eq(lists.listDate, date)))
    .limit(1);
  const list = listRows[0];
  if (!list) return null;
  const [people, rows] = await Promise.all([
    householdMembers(householdId),
    db.select().from(items).where(eq(items.listId, list.id)).orderBy(asc(items.position)),
  ]);
  const names = new Map(people.map((person) => [person.id, person.name]));
  const store = list.store === "fairprice" || list.store === "shengsiong" ? list.store : null;
  return {
    date: list.listDate,
    dateLabel: formatDateLabel(list.listDate),
    store,
    revision: list.revision,
    items: rows.map((row) => toItem(row, names)),
  };
}

export async function touchPresence(memberId: string) {
  const db = await getDb();
  await db.update(members).set({ lastSeenAt: new Date() }).where(eq(members.id, memberId));
}

export async function getToday(session: Session, revision: number | null, visible: boolean) {
  if (visible) await touchPresence(session.memberId);
  const date = todaySGT();
  const existing = await readList(session.householdId, date);
  if (existing && revision != null && existing.revision === revision) {
    return { unchanged: true as const, revision: existing.revision };
  }
  if (existing) return { unchanged: false as const, list: existing };
  if (revision === 0) return { unchanged: true as const, revision: 0 };
  return {
    unchanged: false as const,
    list: {
      date,
      dateLabel: formatDateLabel(date),
      store: null,
      revision: 0,
      items: [],
    } satisfies ListDTO,
  };
}

export async function addItem(
  session: Session,
  input: { name?: unknown; quantity?: unknown; unit?: unknown; note?: unknown; slug?: unknown },
) {
  const name = asName(input.name);
  const quantity = input.quantity == null ? 1 : asQuantity(input.quantity);
  const note = asNote(input.note);
  const bySlug =
    typeof input.slug === "string" ? CATALOG.find((entry) => entry.slug === input.slug) : undefined;
  const match = bySlug ?? exactMatch(name);
  const slug = match?.slug ?? null;
  const displayName = match?.name ?? name;

  const list = await getOrCreateList(session.householdId, todaySGT());
  const db = await getDb();
  const current = await db
    .select()
    .from(items)
    .where(eq(items.listId, list.id))
    .orderBy(desc(items.position))
    .limit(1);
  const position = (current[0]?.position ?? 0) + 1;
  await db.insert(items).values({
    id: crypto.randomUUID(),
    listId: list.id,
    name: displayName,
    catalogSlug: slug,
    quantity,
    unit: "pcs",
    note,
    addedBy: session.memberId,
    position,
  });
  await bump(list.id);
  const payload = await readList(session.householdId, list.listDate);
  return { list: payload!, addedName: displayName };
}

export async function updateItem(
  session: Session,
  itemId: string,
  input: {
    name?: unknown;
    quantity?: unknown;
    unit?: unknown;
    note?: unknown;
    checked?: unknown;
  },
) {
  const db = await getDb();
  const found = await db
    .select({ item: items, list: lists })
    .from(items)
    .innerJoin(lists, eq(items.listId, lists.id))
    .where(and(eq(items.id, itemId), eq(lists.householdId, session.householdId)))
    .limit(1);
  const row = found[0];
  if (!row) throw new ListError(404, "That item is no longer on the list.");
  if (row.list.listDate !== todaySGT()) {
    throw new ListError(400, "Past lists stay as they were.");
  }

  const patch: Partial<typeof items.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const name = asName(input.name);
    const match = exactMatch(name);
    patch.name = match?.name ?? name;
    patch.catalogSlug = match?.slug ?? null;
  }
  if (input.quantity !== undefined) patch.quantity = asQuantity(input.quantity);
  if (input.note !== undefined) patch.note = asNote(input.note);
  let checkedChange: boolean | null = null;
  if (input.checked !== undefined) {
    if (typeof input.checked !== "boolean") throw new ListError(400, "Check state is not valid.");
    patch.checked = input.checked;
    patch.checkedBy = input.checked ? session.memberId : null;
    checkedChange = input.checked;
  }

  await db.update(items).set(patch).where(eq(items.id, itemId));
  await bump(row.list.id);
  const payload = await readList(session.householdId, row.list.listDate);
  const updated = payload?.items.find((item) => item.id === itemId);
  return { list: payload!, itemName: updated?.name ?? row.item.name, checkedChange };
}

export async function removeItem(session: Session, itemId: string) {
  const db = await getDb();
  const found = await db
    .select({ item: items, list: lists })
    .from(items)
    .innerJoin(lists, eq(items.listId, lists.id))
    .where(and(eq(items.id, itemId), eq(lists.householdId, session.householdId)))
    .limit(1);
  const row = found[0];
  if (!row) throw new ListError(404, "That item is no longer on the list.");
  if (row.list.listDate !== todaySGT()) throw new ListError(400, "Past lists stay as they were.");
  await db.delete(items).where(eq(items.id, itemId));
  await bump(row.list.id);
  const payload = await readList(session.householdId, row.list.listDate);
  return { list: payload!, itemName: row.item.name };
}

export async function setStore(session: Session, store: unknown) {
  const next = asStore(store);
  const list = await getOrCreateList(session.householdId, todaySGT());
  const db = await getDb();
  await db.update(lists).set({ store: next }).where(eq(lists.id, list.id));
  await bump(list.id);
  const payload = await readList(session.householdId, list.listDate);
  return { list: payload!, store: next };
}

export async function listArchive(householdId: string): Promise<ArchiveEntry[]> {
  const db = await getDb();
  const today = todaySGT();
  const past = await db
    .select()
    .from(lists)
    .where(and(eq(lists.householdId, householdId), lt(lists.listDate, today)))
    .orderBy(desc(lists.listDate));
  const entries: ArchiveEntry[] = [];
  for (const list of past) {
    const rows = await db.select().from(items).where(eq(items.listId, list.id));
    entries.push({
      date: list.listDate,
      dateLabel: formatDateLabel(list.listDate),
      store: list.store === "fairprice" || list.store === "shengsiong" ? list.store : null,
      total: rows.length,
      checked: rows.filter((row) => row.checked).length,
    });
  }
  return entries;
}

export async function copyUnchecked(session: Session, fromDate: string) {
  const today = todaySGT();
  if (fromDate >= today) throw new ListError(400, "Choose a past list to copy.");
  const source = await readList(session.householdId, fromDate);
  if (!source) throw new ListError(404, "That day has no list.");
  const pending = source.items.filter((item) => !item.checked);
  if (pending.length === 0) throw new ListError(400, "Nothing left to copy.");

  const list = await getOrCreateList(session.householdId, today);
  const db = await getDb();
  const existing = await db.select().from(items).where(eq(items.listId, list.id));
  let position = existing.reduce((max, row) => Math.max(max, row.position), 0);
  let copied = 0;

  for (const item of pending) {
    const key = normalizeQuery(item.name);
    const match = existing.find(
      (row) => !row.checked && normalizeQuery(row.name) === key,
    );
    if (match) {
      await db
        .update(items)
        .set({
          quantity: Number(match.quantity) + item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(items.id, match.id));
      match.quantity = Number(match.quantity) + item.quantity;
    } else {
      position += 1;
      const id = crypto.randomUUID();
      await db.insert(items).values({
        id,
        listId: list.id,
        name: item.name,
        catalogSlug: item.slug,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        addedBy: session.memberId,
        position,
      });
      existing.push({
        id,
        listId: list.id,
        name: item.name,
        catalogSlug: item.slug,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        checked: false,
        addedBy: session.memberId,
        checkedBy: null,
        position,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    copied += 1;
  }

  await bump(list.id);
  const payload = await readList(session.householdId, today);
  return { list: payload!, copied };
}

export async function getHousehold() {
  const db = await getDb();
  const rows = await db.select().from(households).limit(1);
  return rows[0] ?? null;
}

export async function memberNames(householdId: string) {
  const people = await householdMembers(householdId);
  return people
    .sort((a, b) => a.slot - b.slot)
    .map((person) => ({ id: person.id, name: person.name, slot: person.slot }));
}

export { householdMembers };
