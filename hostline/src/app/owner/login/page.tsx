"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "owner", password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not open the atelier.");
        return;
      }
      router.push(data.redirect || "/owner");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--panel)] text-[var(--paper)]">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <Link href="/" className="mono text-xs uppercase tracking-[0.2em] text-white/45">
          Hostline
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Owner atelier</h1>
        <p className="mt-3 text-white/60">
          Clients, Grok studio, billing, and platform keys. Not visible to desk users.
        </p>
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/50" htmlFor="password">
              Owner password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-[var(--paper)] outline-none focus:border-[var(--sea)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-[var(--sea)] px-4 py-3 font-semibold text-[var(--paper)] transition hover:bg-[var(--sea-deep)]"
          >
            {loading ? "Opening…" : "Enter atelier"}
          </button>
        </form>
        <p className="mt-8 text-sm text-white/40">
          Looking for your business desk?{" "}
          <Link href="/desk/login" className="text-white/75 underline">
            Open client desk
          </Link>
        </p>
      </div>
    </main>
  );
}
