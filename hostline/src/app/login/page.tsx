"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not sign in.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
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
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Open the desk</h1>
        <p className="mt-2 text-sm text-[var(--ink)]/65">
          Sign in to manage your Grok voice agent, leads, and calls.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="password">
              Admin password
            </label>
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
            {loading ? "Opening…" : "Start Hostline"}
          </button>
        </form>
      </div>
    </main>
  );
}
