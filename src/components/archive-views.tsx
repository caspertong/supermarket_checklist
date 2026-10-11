"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackToChecklist } from "@/components/back-to-checklist";
import { Gate } from "@/components/gate";
import { api, formatQuantity } from "@/lib/client";
import type { ArchiveEntry, ListDTO, StoreName } from "@/lib/types";

const STORE_LABEL: Record<StoreName, string> = {
  fairprice: "FairPrice",
  shengsiong: "Sheng Siong",
};

export function ArchiveIndex() {
  return (
    <Gate>
      {() => <ArchiveList />}
    </Gate>
  );
}

function ArchiveList() {
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void api<ArchiveEntry[]>("/api/archive")
        .then(setEntries)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not open the archive."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <BackToChecklist />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Archive</h1>
      <p className="mt-2 text-sm text-mist">Older trips, kept by the Singapore date.</p>
      {error ? <p className="mt-6 text-sm text-amber">{error}</p> : null}
      <ul className="mt-6 space-y-3">
        {entries?.length === 0 ? <li className="glass rounded-3xl px-5 py-8 text-mist">No past lists yet. Today stays on the home screen.</li> : null}
        {entries?.map((entry) => (
          <li key={entry.date}>
            <Link href={`/archive/${entry.date}`} className="glass flex items-center justify-between rounded-3xl px-4 py-4">
              <span>
                <span className="block">{entry.dateLabel}</span>
                <span className="mt-1 block text-sm text-mist">
                  {entry.store ? STORE_LABEL[entry.store] : "No store"} · {entry.checked} of {entry.total} packed
                </span>
              </span>
              <span className="text-mist">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function ArchiveDay({ date }: { date: string }) {
  return (
    <Gate>
      {() => <Day date={date} />}
    </Gate>
  );
}

function Day({ date }: { date: string }) {
  const router = useRouter();
  const [list, setList] = useState<ListDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void api<ListDTO>(`/api/archive/${date}`)
        .then(setList)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not open that day."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [date]);

  const unchecked = list?.items.filter((item) => !item.checked).length ?? 0;

  async function copy() {
    setPending(true);
    setError(null);
    try {
      await api(`/api/archive/${date}/copy`, { method: "POST" });
      router.push("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not copy the leftovers.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <Link href="/archive" className="text-sm text-aqua">
        Archive
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{list?.dateLabel ?? "Past list"}</h1>
      <p className="mt-2 text-sm text-mist">{list?.store ? STORE_LABEL[list.store] : "No store was set"}</p>
      {error ? <p className="mt-4 text-sm text-amber">{error}</p> : null}
      <ul className="mt-6 space-y-3">
        {list?.items.map((item) => (
          <li key={item.id} className={`glass flex items-center gap-3 rounded-3xl p-3 ${item.checked ? "opacity-60" : ""}`}>
            <Image src={item.image} alt="" width={48} height={48} unoptimized className="size-12 rounded-2xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${item.checked ? "line-through" : ""}`}>{item.name}</span>
              <span className="text-sm text-mist">{formatQuantity(item.quantity)}</span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={pending || unchecked === 0}
        onClick={() => void copy()}
        className="mt-6 h-12 rounded-full bg-aqua font-medium text-ink disabled:opacity-50"
      >
        {pending ? "Copying…" : "Copy unchecked to today"}
      </button>
    </main>
  );
}
