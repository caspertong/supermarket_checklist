import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS households (
    id text PRIMARY KEY,
    passphrase_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id text PRIMARY KEY,
    household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name text NOT NULL,
    slot integer NOT NULL,
    push_subscription jsonb,
    last_seen_at timestamptz,
    UNIQUE (household_id, slot)
  )`,
  `CREATE TABLE IF NOT EXISTS lists (
    id text PRIMARY KEY,
    household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    list_date date NOT NULL,
    store text,
    revision integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (household_id, list_date)
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id text PRIMARY KEY,
    list_id text NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name text NOT NULL,
    catalog_slug text,
    quantity real NOT NULL DEFAULT 1,
    unit text NOT NULL DEFAULT 'pcs',
    note text,
    checked boolean NOT NULL DEFAULT false,
    added_by text REFERENCES members(id),
    checked_by text REFERENCES members(id),
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS items_list_idx ON items (list_id)`,
  `CREATE TABLE IF NOT EXISTS promotion_stores (
    store text PRIMARY KEY,
    payload jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
];

export type Database = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  douDb?: Database;
  douDbReady?: Promise<Database>;
};

async function initDatabase(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    for (const statement of STATEMENTS) {
      await sql.query(statement);
    }
    return drizzleNeon(sql, { schema });
  }

  const dataDir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  const db = drizzlePglite({
    connection: { dataDir },
    schema,
  });
  await db.$client.waitReady;
  for (const statement of STATEMENTS) {
    await db.$client.exec(statement);
  }
  return db as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!globalForDb.douDbReady) {
    globalForDb.douDbReady = initDatabase()
      .then((db) => {
        globalForDb.douDb = db;
        return db;
      })
      .catch((error) => {
        globalForDb.douDbReady = undefined;
        throw error;
      });
  }
  return globalForDb.douDbReady;
}
