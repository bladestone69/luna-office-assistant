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
        body: JSON.stringify({ username, password })
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
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-8">
      <Link href="/" className="mb-5 text-sm font-semibold text-sky">
        Back to home
      </Link>
      <form className="panel space-y-4 p-6" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold text-ink">Admin Login</h1>
        <p className="text-sm text-ink/75">Restricted dashboard access for Ernest only.</p>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Username</span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}

        <button className="btn w-full" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
