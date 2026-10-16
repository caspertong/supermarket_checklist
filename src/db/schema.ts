import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { StorePromos } from "@/lib/types";

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export const households = pgTable("households", {
  id: text("id").primaryKey(),
  passphraseHash: text("passphrase_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slot: integer("slot").notNull(),
    pushSubscription: jsonb("push_subscription").$type<PushSubscriptionJSON | null>(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("members_household_slot").on(table.householdId, table.slot)],
);

export const lists = pgTable(
  "lists",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    listDate: date("list_date", { mode: "string" }).notNull(),
    store: text("store"),
    revision: integer("revision").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("lists_household_date").on(table.householdId, table.listDate)],
);

export const promotionStores = pgTable("promotion_stores", {
  store: text("store").primaryKey(),
  payload: jsonb("payload").$type<StorePromos>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  catalogSlug: text("catalog_slug"),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").notNull().default("pcs"),
  note: text("note"),
  checked: boolean("checked").notNull().default(false),
  addedBy: text("added_by").references(() => members.id),
  checkedBy: text("checked_by").references(() => members.id),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
