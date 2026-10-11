"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gate } from "@/components/gate";
import { api } from "@/lib/client";
import { formatDateLabel } from "@/lib/sgt";
import type { PromoItem, PromotionsDTO, StoreName, StorePromos } from "@/lib/types";

const STORE_LABEL: Record<StoreName, string> = {
  fairprice: "FairPrice",
  shengsiong: "Sheng Siong",
};

export function Promotions() {
  return (
    <Gate>
      {() => <PromotionList />}
    </Gate>
  );
}

function PromotionList() {
  const [data, setData] = useState<PromotionsDTO | null>(null);
  const [store, setStore] = useState<StoreName>("fairprice");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void api<PromotionsDTO>("/api/promotions")
        .then(setData)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not open promotions."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const current = data?.[store];
  const needle = query.trim().toLowerCase();
  const matched = (current?.items ?? []).filter((item) => !needle || item.name.toLowerCase().includes(needle));
  const visible = matched.slice(0, 60);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <Link href="/" className="text-sm text-aqua">
        Today
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Promotion</h1>
      <p className="mt-2 text-sm leading-6 text-mist">
        FairPrice refreshes Thursday. Sheng Siong&apos;s leaflet is a two-week special posted on a Friday, and the online list refreshes the same day.
      </p>
      <div className="mt-4 flex gap-2">
        {(Object.keys(STORE_LABEL) as StoreName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setStore(name)}
            className={`h-11 flex-1 rounded-full border text-sm ${
              store === name ? "border-aqua bg-aqua/15 text-aqua" : "border-white/10 text-mist"
            }`}
          >
            {STORE_LABEL[name]}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-amber">{error}</p> : null}
      {current ? <Summary store={current} /> : <p className="mt-6 text-sm text-mist">Loading promotions…</p>}
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search milk, eggs, rice…"
        aria-label="Search promotions"
        className="glass mt-4 h-12 rounded-full px-4 outline-none placeholder:text-mist/80"
      />
      <ul className="mt-4 space-y-3 pb-8">
        {current && current.items.length === 0 ? (
          <li className="glass rounded-3xl px-5 py-8 text-sm leading-6 text-mist">
            No promotions saved yet. The weekly job writes them into data/promotions.json.
          </li>
        ) : null}
        {current && current.items.length > 0 && matched.length === 0 ? (
          <li className="glass rounded-3xl px-5 py-8 text-sm text-mist">Nothing matches that search.</li>
        ) : null}
        {visible.map((item) => (
          <li key={`${item.url}-${item.name}-${item.size}`}>
            <PromoRow item={item} />
          </li>
        ))}
        {matched.length > visible.length ? (
          <li className="text-center text-sm text-mist">
            Showing {visible.length} of {matched.length}. Search to narrow the list.
          </li>
        ) : null}
      </ul>
    </main>
  );
}

function Summary({ store }: { store: StorePromos }) {
  const from = store.validFrom ? formatDateLabel(store.validFrom) : null;
  const till = store.validTill ? formatDateLabel(store.validTill) : null;
  return (
    <div className="mt-4 text-sm text-mist">
      <p>
        {store.items.length} promotions
        {from && till ? ` · ${from} – ${till}` : ""}
      </p>
      {store.note ? <p className="mt-1">{store.note}</p> : null}
      {store.leafletUrl ? (
        <a href={store.leafletUrl} className="mt-1 inline-block text-aqua" target="_blank" rel="noreferrer">
          Open the leaflet
        </a>
      ) : null}
    </div>
  );
}

function PromoRow({ item }: { item: PromoItem }) {
  const now = item.promoPrice ?? item.price;
  const was = item.previousPrice && item.previousPrice !== now ? item.previousPrice : null;
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="glass block rounded-3xl px-4 py-4">
      <span className="block">{item.name}</span>
      <span className="mt-1 block text-sm text-mist">
        {[item.size, money(now), was ? `was ${money(was)}` : null].filter(Boolean).join(" · ")}
      </span>
      {item.detail ? <span className="mt-1 block text-sm text-aqua">{item.detail}</span> : null}
    </a>
  );
}

function money(value: number | null) {
  if (value == null) return null;
  return `$${value.toFixed(2)}`;
}
