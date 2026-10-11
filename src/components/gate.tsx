"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthScreens } from "@/components/auth-screens";
import { api } from "@/lib/client";
import type { SessionDTO } from "@/lib/types";

export function Gate({
  children,
}: {
  children: (context: {
    member: { id: string; name: string; slot: number };
    signOut: () => Promise<void>;
  }) => ReactNode;
}) {
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await api<SessionDTO>("/api/auth/session"));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the list.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5">
        <p className="text-mist">{error}</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5">
        <p className="text-xs uppercase tracking-[0.22em] text-aqua">Family list</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Dou&apos;s</h1>
        <p className="mt-3 text-mist">Opening the list…</p>
      </main>
    );
  }

  if (session.state !== "in") {
    return <AuthScreens state={session.state} onDone={refresh} />;
  }

  const member = session.member;
  async function signOut() {
    await api("/api/auth/logout", { method: "POST" });
    setSession({ state: "login" });
  }

  return children({ member, signOut });
}
