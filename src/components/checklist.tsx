"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CATEGORY_LABEL, resolveEntry, suggestItems } from "@/data/catalog";
import { api, formatAmount, urlBase64ToUint8Array } from "@/lib/client";
import type { ItemDTO, ListDTO, StoreName, Unit } from "@/lib/types";

type TodayResponse = { unchanged: true; revision: number } | (ListDTO & { unchanged: false });

const STORE_LABEL: Record<StoreName, string> = {
  fairprice: "FairPrice",
  shengsiong: "Sheng Siong",
};

export function Checklist({
  member,
  onSignOut,
}: {
  member: { name: string };
  onSignOut: () => Promise<void>;
}) {
  const [list, setList] = useState<ListDTO | null>(null);
  const [draft, setDraft] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>("pcs");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItemDTO | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const revisionRef = useRef(0);
  const pendingRef = useRef(0);

  function adopt(next: ListDTO) {
    revisionRef.current = next.revision;
    setList(next);
  }

  async function mutate(run: () => Promise<ListDTO>) {
    pendingRef.current += 1;
    setError(null);
    try {
      adopt(await run());
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return false;
    } finally {
      pendingRef.current -= 1;
    }
  }

  useEffect(() => {
    let stopped = false;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const hintTimer = window.setTimeout(() => setIosHint(ios && !standalone), 0);

    async function load() {
      const data = await api<TodayResponse>("/api/today?visible=1");
      if (stopped || data.unchanged) return;
      adopt(data);
    }

    void load().catch((caught) => {
      if (!stopped) setError(caught instanceof Error ? caught.message : "Could not open today.");
    });

    if ("Notification" in window && Notification.permission === "granted") {
      void subscribe().then(() => setAlertsOn(true)).catch(() => {});
    }

    const timer = window.setInterval(() => {
      if (pendingRef.current > 0) return;
      const visible = document.visibilityState === "visible" ? "1" : "0";
      void api<TodayResponse>(`/api/today?revision=${revisionRef.current}&visible=${visible}`)
        .then((data) => {
          if (!stopped && !data.unchanged) adopt(data);
        })
        .catch(() => {});
    }, 2000);

    return () => {
      stopped = true;
      window.clearTimeout(hintTimer);
      window.clearInterval(timer);
    };
  }, []);

  const suggestions = suggestItems(draft);
  const openItems = list?.items.filter((item) => !item.checked) ?? [];
  const doneItems = list?.items.filter((item) => item.checked) ?? [];

  async function addResolved(name: string, slug: string | null) {
    const ok = await mutate(() =>
      api<ListDTO>("/api/items", {
        method: "POST",
        body: JSON.stringify({ name, slug, quantity, unit }),
      }),
    );
    if (ok) {
      setDraft("");
      setQuantity(1);
      setUnit("pcs");
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const resolved = resolveEntry(draft);
    if (!resolved.name) return;
    void addResolved(resolved.name, resolved.slug);
  }

  async function chooseStore(store: StoreName) {
    if (!list) return;
    const next = list.store === store ? null : store;
    await mutate(() => api<ListDTO>("/api/today", { method: "PATCH", body: JSON.stringify({ store: next }) }));
  }

  async function sendNudge(kind: "fairprice" | "shengsiong" | "check") {
    setNudgeOpen(false);
    setError(null);
    try {
      const result = await api<{ list?: ListDTO }>("/api/nudge", {
        method: "POST",
        body: JSON.stringify({ kind }),
      });
      if (result.list) adopt(result.list);
      setNotice(kind === "check" ? "Nudge sent." : "They'll know where you are.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the nudge.");
    }
  }

  async function enableAlerts() {
    setError(null);
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error("This browser cannot show notifications yet.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications stay off until you allow them.");
      await subscribe();
      setAlertsOn(true);
      setNotice("Alerts are on for this phone.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not turn on alerts.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-56">
      <header className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.7rem] font-semibold leading-none tracking-tight">Dou&apos;s</h1>
            <p className="mt-1 text-sm text-mist">Family Checklist</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/archive" className="text-mist">
              Archive
            </Link>
            <button type="button" onClick={() => void onSignOut()} className="text-mist">
              Switch
            </button>
          </div>
        </div>
        <p className="mt-5 text-lg">{list?.dateLabel ?? "Today"}</p>
        <p className="text-sm text-mist">Signed in as {member.name}</p>
        <div className="mt-4 flex gap-2">
          {(Object.keys(STORE_LABEL) as StoreName[]).map((store) => (
            <button
              key={store}
              type="button"
              onClick={() => void chooseStore(store)}
              className={`h-11 flex-1 rounded-full border text-sm ${
                list?.store === store ? "border-aqua bg-aqua/15 text-aqua" : "border-white/10 text-mist"
              }`}
            >
              {STORE_LABEL[store]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-mist">
            {list ? `${doneItems.length} of ${list.items.length} in the basket` : "Loading today…"}
          </p>
          <button type="button" onClick={() => setNudgeOpen(true)} className="h-10 rounded-full bg-white/10 px-4 text-sm">
            Nudge
          </button>
        </div>
        {iosHint ? (
          <p className="mt-3 text-sm leading-6 text-mist">
            On iPhone, use Share, then Add to Home Screen, so alerts can reach you.
          </p>
        ) : null}
        {!alertsOn && !iosHint ? (
          <button type="button" onClick={() => void enableAlerts()} className="mt-3 text-sm text-aqua">
            Allow notifications
          </button>
        ) : null}
        {notice ? <p className="mt-3 text-sm text-aqua">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-amber">{error}</p> : null}
      </header>

      <section className="mt-6 space-y-3">
        {list && list.items.length === 0 ? (
          <div className="glass rise rounded-3xl px-5 py-8">
            <p className="text-lg">Nothing on the list yet.</p>
            <p className="mt-2 text-sm leading-6 text-mist">Try tau gua, broccoli, chicken drumstick, or eggs.</p>
          </div>
        ) : null}
        {openItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onCheck={() =>
              void mutate(() =>
                api<ListDTO>(`/api/items/${item.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ checked: true }),
                }),
              )
            }
            onQuantity={(next) =>
              void mutate(() =>
                api<ListDTO>(`/api/items/${item.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ quantity: next }),
                }),
              )
            }
            onEdit={() => setEditing(item)}
          />
        ))}
        {doneItems.length > 0 ? <h2 className="pt-4 text-sm uppercase tracking-[0.16em] text-mist">In the basket</h2> : null}
        {doneItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onCheck={() =>
              void mutate(() =>
                api<ListDTO>(`/api/items/${item.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ checked: false }),
                }),
              )
            }
            onQuantity={(next) =>
              void mutate(() =>
                api<ListDTO>(`/api/items/${item.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ quantity: next }),
                }),
              )
            }
            onEdit={() => setEditing(item)}
          />
        ))}
      </section>

      <form
        onSubmit={onSubmit}
        className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-md">
          {suggestions.length > 0 ? (
            <ul className="glass mb-2 overflow-hidden rounded-3xl">
              {suggestions.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => void addResolved(item.name, item.slug)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <Thumb src={item.image} />
                    <span>
                      <span className="block">{item.name}</span>
                      <span className="block text-xs text-mist">{CATEGORY_LABEL[item.category]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mb-2 flex gap-2">
            {(["pcs", "pkt", "kg"] as Unit[]).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setUnit(choice)}
                className={`h-9 rounded-full px-3 text-xs uppercase tracking-[0.14em] ${
                  unit === choice ? "bg-aqua text-ink" : "bg-white/10 text-mist"
                }`}
              >
                {choice}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2 text-sm">
              <StepButton label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(stepOf(unit), value - stepOf(unit)))} />
              <span className="w-8 text-center">{quantity}</span>
              <StepButton label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + stepOf(unit)))} />
            </span>
          </div>
          <div className="glass flex items-center gap-2 rounded-full p-1.5">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add broccoli, tau kwa, fish…"
              aria-label="Add an item"
              className="h-12 min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-mist/80"
            />
            <button type="submit" className="h-12 rounded-full bg-aqua px-5 font-medium text-ink">
              Add
            </button>
          </div>
        </div>
      </form>

      {editing ? (
        <Editor
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            const ok = await mutate(() =>
              api<ListDTO>(`/api/items/${editing.id}`, { method: "PATCH", body: JSON.stringify(patch) }),
            );
            if (ok) setEditing(null);
          }}
          onDelete={async () => {
            const ok = await mutate(() => api<ListDTO>(`/api/items/${editing.id}`, { method: "DELETE" }));
            if (ok) setEditing(null);
          }}
        />
      ) : null}

      {nudgeOpen ? (
        <Sheet title="Nudge" onClose={() => setNudgeOpen(false)}>
          <button type="button" className="h-12 w-full rounded-full bg-white/10" onClick={() => void sendNudge("fairprice")}>
            I&apos;m at FairPrice
          </button>
          <button type="button" className="h-12 w-full rounded-full bg-white/10" onClick={() => void sendNudge("shengsiong")}>
            I&apos;m at Sheng Siong
          </button>
          <button type="button" className="h-12 w-full rounded-full bg-white/10" onClick={() => void sendNudge("check")}>
            Please check the list
          </button>
        </Sheet>
      ) : null}
    </main>
  );
}

function ItemRow({
  item,
  onCheck,
  onQuantity,
  onEdit,
}: {
  item: ItemDTO;
  onCheck: () => void;
  onQuantity: (quantity: number) => void;
  onEdit: () => void;
}) {
  const step = stepOf(item.unit);
  const minimum = item.unit === "kg" ? 0.25 : 1;
  return (
    <article className={`glass rise flex gap-3 rounded-3xl p-3 ${item.checked ? "opacity-60" : ""}`}>
      <Thumb src={item.image} />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-base">
          <span className={item.checked ? "line-through" : ""}>{item.name}</span>
        </button>
        <div className="mt-2 flex items-center gap-2">
          <StepButton label={`Less ${item.name}`} onClick={() => onQuantity(Math.max(minimum, item.quantity - step))} />
          <span className="text-sm text-mist">{formatAmount(item.quantity, item.unit)}</span>
          <StepButton label={`More ${item.name}`} onClick={() => onQuantity(Math.min(99, item.quantity + step))} />
        </div>
        {item.note ? <p className="mt-1 text-sm text-mist">{item.note}</p> : null}
        {item.addedBy ? <p className="mt-1 text-xs text-mist">Added by {item.addedBy}</p> : null}
      </div>
      <button
        type="button"
        aria-pressed={item.checked}
        aria-label={item.checked ? `Put ${item.name} back` : `Check ${item.name}`}
        onClick={onCheck}
        className={`grid size-11 shrink-0 place-items-center rounded-full border ${
          item.checked ? "border-amber bg-amber text-ink" : "border-white/15"
        }`}
      >
        {item.checked ? "✓" : ""}
      </button>
    </article>
  );
}

function Editor({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: ItemDTO;
  onClose: () => void;
  onSave: (patch: { name: string; quantity: number; unit: Unit; note: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [note, setNote] = useState(item.note ?? "");

  return (
    <Sheet title="Edit item" onClose={onClose}>
      <label className="block text-sm text-mist">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white outline-none"
        />
      </label>
      <div className="flex gap-2">
        <label className="block flex-1 text-sm text-mist">
          Quantity
          <input
            value={quantity}
            inputMode="decimal"
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white outline-none"
          />
        </label>
        <div className="flex items-end gap-2">
          {(["pcs", "pkt", "kg"] as Unit[]).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setUnit(choice)}
              className={`h-12 rounded-2xl px-3 text-xs uppercase ${unit === choice ? "bg-aqua text-ink" : "bg-white/10 text-mist"}`}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm text-mist">
        Note
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white outline-none"
        />
      </label>
      <button
        type="button"
        className="h-12 w-full rounded-full bg-aqua font-medium text-ink"
        onClick={() => void onSave({ name, quantity: Number(quantity), unit, note })}
      >
        Save
      </button>
      <button type="button" className="h-12 w-full rounded-full text-amber" onClick={() => void onDelete()}>
        Remove
      </button>
    </Sheet>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="glass rise mx-auto w-full max-w-md space-y-3 rounded-3xl p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-mist">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <Image src={src} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-2xl object-cover" />
  );
}

function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full bg-white/10 text-lg leading-none"
    >
      {label.startsWith("Less") || label.startsWith("Decrease") ? "−" : "+"}
    </button>
  );
}

function stepOf(unit: Unit) {
  return unit === "kg" ? 0.5 : 1;
}

async function subscribe() {
  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await api<{ publicKey: string }>("/api/push/public-key");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  await api("/api/push/subscribe", { method: "POST", body: JSON.stringify(subscription) });
}

