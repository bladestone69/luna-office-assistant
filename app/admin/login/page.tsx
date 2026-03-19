"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("ernest");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Unable to login. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-8 bg-[#0C0C0E]">
      <div className="mb-6 text-center">
        <span className="font-serif text-2xl font-bold text-[#C9A84C]">Luna</span>
      </div>

      <form className="panel space-y-4 p-6 gold-glow" onSubmit={onSubmit}>
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-[#F5F0E8]">Admin Login</h1>
          <p className="mt-2 text-sm text-[#8A8A8A]">
            Secure access to instruction queue, AI feedback, and booking outcomes.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
            Username
          </span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
            Password
          </span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm font-semibold text-red-400">
            {error}
          </p>
        ) : null}

        <button className="btn w-full" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-[#8A8A8A] transition-colors hover:text-[#C9A84C]"
      >
        ← Back to home
      </Link>
    </main>
  );
}
