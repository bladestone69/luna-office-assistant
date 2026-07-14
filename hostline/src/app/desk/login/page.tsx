"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function DeskLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ role: "client", email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not open your desk.");
        return;
      }
      router.push(data.redirect || "/desk");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="atmosphere flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_20px_60px_rgba(20,33,43,0.08)]">
        <Link href="/" className="mono text-xs uppercase tracking-[0.18em] text-[var(--mute)]">
          Hostline
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Open your desk</h1>
        <p className="mt-2 text-sm text-[var(--ink)]/65">
          See who called, who needs a callback, and whether your line is answering.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Desk email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="cta-start w-full" disabled={loading}>
            {loading ? "Opening…" : "Open desk"}
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--mute)]">
          Hostline owner?{" "}
          <Link href="/owner/login" className="text-[var(--ink)] underline">
            Enter atelier
          </Link>
        </p>
      </div>
    </main>
  );
}
