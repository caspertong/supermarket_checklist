"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/client";

export function AuthScreens({ state, onDone }: { state: "setup" | "login"; onDone: () => Promise<void> }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-aqua">Family list</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Dou&apos;s</h1>
      <p className="mt-1 text-lg text-mist">Family Checklist</p>
      <p className="mt-4 max-w-sm text-sm leading-6 text-mist">The two of you, one list. Singapore names, photos, and a nudge when something changes.</p>
      <div className="glass rise mt-8 rounded-3xl p-5">
        {state === "setup" ? <SetupForm onDone={onDone} /> : <LoginForm onDone={onDone} />}
      </div>
    </main>
  );
}

function SetupForm({ onDone }: { onDone: () => Promise<void> }) {
  const [passphrase, setPassphrase] = useState("");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [slot, setSlot] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/setup", {
        method: "POST",
        body: JSON.stringify({ passphrase, nameA, nameB, slot }),
      });
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not set up the list.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Shared passphrase" value={passphrase} onChange={setPassphrase} type="password" autoComplete="new-password" />
      <Field label="First name" value={nameA} onChange={setNameA} autoComplete="given-name" />
      <Field label="Second name" value={nameB} onChange={setNameB} />
      <div className="grid grid-cols-2 gap-2">
        <Choice active={slot === 1} onClick={() => setSlot(1)} label={nameA.trim() || "First name"} />
        <Choice active={slot === 2} onClick={() => setSlot(2)} label={nameB.trim() || "Second name"} />
      </div>
      <p className="text-xs text-mist">This phone will sign in as the highlighted name.</p>
      {error ? <p className="text-sm text-amber">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-aqua font-medium text-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create our list"}
      </button>
    </form>
  );
}

function LoginForm({ onDone }: { onDone: () => Promise<void> }) {
  const [passphrase, setPassphrase] = useState("");
  const [people, setPeople] = useState<Array<{ slot: number; name: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function reveal(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api<{ members: Array<{ slot: number; name: string }> }>("/api/auth/preview", {
        method: "POST",
        body: JSON.stringify({ passphrase }),
      });
      setPeople(result.members);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not check the passphrase.");
    } finally {
      setPending(false);
    }
  }

  async function choose(slot: number) {
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ passphrase, slot }),
      });
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  if (people) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-mist">Who is holding this phone?</p>
        {people.map((person) => (
          <button
            key={person.slot}
            type="button"
            disabled={pending}
            onClick={() => void choose(person.slot)}
            className="h-12 w-full rounded-full bg-white/10 text-base disabled:opacity-60"
          >
            {person.name}
          </button>
        ))}
        {error ? <p className="text-sm text-amber">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={reveal} className="space-y-4">
      <Field label="Shared passphrase" value={passphrase} onChange={setPassphrase} type="password" autoComplete="current-password" />
      {error ? <p className="text-sm text-amber">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-aqua font-medium text-ink disabled:opacity-60"
      >
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mist">{label}</span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-aqua/70"
      />
    </label>
  );
}

function Choice({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-2xl border px-3 text-sm ${
        active ? "border-aqua bg-aqua/15 text-aqua" : "border-white/10 text-mist"
      }`}
    >
      {label}
    </button>
  );
}
