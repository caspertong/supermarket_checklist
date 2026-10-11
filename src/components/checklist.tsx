"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { localName, resolveEntry, suggestItems } from "@/data/catalog";
import { api, formatQuantity, urlBase64ToUint8Array } from "@/lib/client";
import type { ItemDTO, ListDTO, StoreName } from "@/lib/types";

type Row = ItemDTO & { key: string };
type View = Omit<ListDTO, "items"> & { items: Row[] };
type TodayResponse = { unchanged: true; revision: number } | (ListDTO & { unchanged: false });

type PendingOp =
  | { kind: "add"; key: string; name: string; slug: string | null; image: string; quantity: number; addedBy: string }
  | { kind: "check"; key: string; checked: boolean; actor: string }
  | { kind: "qty"; key: string; quantity: number }
  | { kind: "edit"; key: string; name: string; quantity: number; note: string | null; slug: string | null; image: string }
  | { kind: "remove"; key: string };

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
  const [list, setList] = useState<View | null>(null);
  const [draft, setDraft] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const revisionRef = useRef(0);
  const pendingRef = useRef(0);
  const addingRef = useRef(false);
  const serverRef = useRef<ListDTO | null>(null);
  const opsRef = useRef<PendingOp[]>([]);
  const queueRef = useRef(Promise.resolve());
  const idToKey = useRef(new Map<string, string>());

  function paint(base: ListDTO) {
    serverRef.current = base;
    revisionRef.current = base.revision;
    let items: Row[] = base.items.map((item) => ({
      ...item,
      key: idToKey.current.get(item.id) ?? item.id,
    }));
    for (const op of opsRef.current) items = applyOp(items, op);
    const next = { ...base, items };
    setList((current) => (current && sameView(current, next) ? current : next));
  }

  function commit(op: PendingOp, send: () => Promise<ListDTO>) {
    const base = serverRef.current;
    if (!base) return Promise.resolve(false);
    opsRef.current = [...opsRef.current, op];
    paint(base);
    pendingRef.current += 1;
    const job = queueRef.current.then(async () => {
      const before = serverRef.current;
      try {
        const server = await send();
        if (op.kind === "add" && before) {
          const known = new Set(before.items.map((item) => item.id));
          const created = server.items.find((item) => !known.has(item.id));
          if (created) idToKey.current.set(created.id, op.key);
        }
        opsRef.current = opsRef.current.filter((pending) => pending !== op);
        paint(server);
        return true;
      } catch (caught) {
        opsRef.current = opsRef.current.filter((pending) => pending !== op);
        if (before) paint(before);
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
        return false;
      } finally {
        pendingRef.current -= 1;
      }
    });
    queueRef.current = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }

  function serverId(key: string) {
    for (const [id, rowKey] of idToKey.current) {
      if (rowKey === key && !id.startsWith("tmp-")) return id;
    }
    return key.startsWith("tmp-") ? null : key;
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
      paint(data);
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
          if (!stopped && !data.unchanged) paint(data);
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

  function addResolved(name: string, slug: string | null, image: string) {
    if (addingRef.current || !name) return;
    addingRef.current = true;
    const key = `tmp-${crypto.randomUUID()}`;
    const amount = quantity;
    idToKey.current.set(key, key);
    setDraft("");
    setQuantity(1);
    void commit(
      { kind: "add", key, name, slug, image, quantity: amount, addedBy: member.name },
      () =>
        api<ListDTO>("/api/items", {
          method: "POST",
          body: JSON.stringify({ name, slug, quantity: amount }),
        }),
    ).then((ok) => {
      if (!ok) setDraft(name);
    });
    window.requestAnimationFrame(() => {
      addingRef.current = false;
    });
  }

  function patchRow(key: string, op: PendingOp, body: Record<string, unknown>) {
    return commit(op, () => {
      const id = serverId(key);
      if (!id) {
        if (!serverRef.current) throw new Error("The list is still opening.");
        return Promise.resolve(serverRef.current);
      }
      return api<ListDTO>(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    });
  }

  function remove(key: string) {
    return commit({ kind: "remove", key }, () => {
      const id = serverId(key);
      if (!id) {
        if (!serverRef.current) throw new Error("The list is still opening.");
        return Promise.resolve(serverRef.current);
      }
      return api<ListDTO>(`/api/items/${id}`, { method: "DELETE" });
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const resolved = resolveEntry(draft);
    if (!resolved.name) return;
    addResolved(resolved.name, resolved.slug, resolved.image);
  }

  async function chooseStore(store: StoreName) {
    if (!list) return;
    const next = list.store === store ? null : store;
    const base = serverRef.current;
    if (base) paint({ ...base, store: next });
    pendingRef.current += 1;
    try {
      const saved = await api<ListDTO>("/api/today", { method: "PATCH", body: JSON.stringify({ store: next }) });
      if (opsRef.current.length === 0) paint(saved);
    } catch (caught) {
      if (base && opsRef.current.length === 0) paint(base);
      setError(caught instanceof Error ? caught.message : "Could not update the store.");
    } finally {
      pendingRef.current -= 1;
    }
  }

  async function sendNudge(kind: "fairprice" | "shengsiong" | "check") {
    setNudgeOpen(false);
    setError(null);
    try {
      const result = await api<{ list?: ListDTO }>("/api/nudge", {
        method: "POST",
        body: JSON.stringify({ kind }),
      });
      if (result.list && opsRef.current.length === 0) paint(result.list);
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
            key={item.key}
            item={item}
            onCheck={() =>
              void patchRow(item.key, { kind: "check", key: item.key, checked: true, actor: member.name }, { checked: true })
            }
            onQuantity={(next) =>
              void patchRow(item.key, { kind: "qty", key: item.key, quantity: next }, { quantity: next })
            }
            onEdit={() => setEditing(item)}
            onRemove={() => void remove(item.key)}
          />
        ))}
        {doneItems.length > 0 ? <h2 className="pt-4 text-sm uppercase tracking-[0.16em] text-mist">In the basket</h2> : null}
        {doneItems.map((item) => (
          <ItemRow
            key={item.key}
            item={item}
            onCheck={() =>
              void patchRow(item.key, { kind: "check", key: item.key, checked: false, actor: member.name }, { checked: false })
            }
            onQuantity={(next) =>
              void patchRow(item.key, { kind: "qty", key: item.key, quantity: next }, { quantity: next })
            }
            onEdit={() => setEditing(item)}
            onRemove={() => void remove(item.key)}
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
                    onClick={() => addResolved(item.name, item.slug, item.image)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <Thumb src={item.image} />
                    <span>
                      <span className="block">{item.name}</span>
                      <span className="block text-xs text-mist">{localName(item)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mb-2 flex items-center justify-end gap-2 text-sm">
            <StepButton label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} />
            <span className="w-8 text-center">{quantity}</span>
            <StepButton label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))} />
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
          onSave={(patch) => {
            const resolved = resolveEntry(patch.name);
            setEditing(null);
            void patchRow(
              editing.key,
              {
                kind: "edit",
                key: editing.key,
                name: resolved.name,
                quantity: patch.quantity,
                note: patch.note || null,
                slug: resolved.slug,
                image: resolved.image,
              },
              { name: resolved.name, quantity: patch.quantity, note: patch.note },
            );
          }}
          onDelete={() => {
            setEditing(null);
            void remove(editing.key);
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
  onRemove,
}: {
  item: Row;
  onCheck: () => void;
  onQuantity: (quantity: number) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <article className={`glass rise flex gap-3 rounded-3xl p-3 ${item.checked ? "opacity-60" : ""}`}>
      <Thumb src={item.image} />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-base">
          <span className={item.checked ? "line-through" : ""}>{item.name}</span>
        </button>
        <div className="mt-2 flex items-center gap-2">
          <StepButton label={`Less ${item.name}`} onClick={() => onQuantity(Math.max(1, Math.round(item.quantity) - 1))} />
          <span className="text-sm text-mist">{formatQuantity(item.quantity)}</span>
          <StepButton label={`More ${item.name}`} onClick={() => onQuantity(Math.min(99, Math.round(item.quantity) + 1))} />
        </div>
        {item.note ? <p className="mt-1 text-sm text-mist">{item.note}</p> : null}
        <div className="mt-1 flex items-center gap-3">
          {item.addedBy ? <p className="text-xs text-mist">Added by {item.addedBy}</p> : null}
          <button type="button" onClick={onRemove} className="text-sm text-amber">
            Remove
          </button>
        </div>
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
  item: Row;
  onClose: () => void;
  onSave: (patch: { name: string; quantity: number; note: string }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(Math.max(1, Math.round(item.quantity))));
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
      <label className="block text-sm text-mist">
        Quantity
        <input
          value={quantity}
          inputMode="numeric"
          onChange={(event) => setQuantity(event.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white outline-none"
        />
      </label>
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
        onClick={() => void onSave({ name, quantity: Number(quantity), note })}
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

function sameView(current: View, next: View) {
  if (current.store !== next.store || current.date !== next.date || current.items.length !== next.items.length) {
    return false;
  }
  return current.items.every((item, index) => {
    const other = next.items[index];
    return (
      item.key === other.key &&
      item.name === other.name &&
      item.quantity === other.quantity &&
      item.checked === other.checked &&
      item.note === other.note &&
      item.image === other.image
    );
  });
}

function applyOp(items: Row[], op: PendingOp): Row[] {
  if (op.kind === "add") {
    if (items.some((item) => item.key === op.key)) return items;
    return [
      ...items,
      {
        id: op.key,
        key: op.key,
        name: op.name,
        slug: op.slug,
        image: op.image,
        quantity: op.quantity,
        unit: "pcs",
        note: null,
        checked: false,
        addedBy: op.addedBy,
        checkedBy: null,
      },
    ];
  }
  if (op.kind === "remove") return items.filter((item) => item.key !== op.key);
  if (op.kind === "check") {
    return items.map((item) =>
      item.key === op.key ? { ...item, checked: op.checked, checkedBy: op.checked ? op.actor : null } : item,
    );
  }
  if (op.kind === "qty") {
    return items.map((item) => (item.key === op.key ? { ...item, quantity: op.quantity } : item));
  }
  return items.map((item) =>
    item.key === op.key
      ? { ...item, name: op.name, quantity: op.quantity, note: op.note, slug: op.slug, image: op.image }
      : item,
  );
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

