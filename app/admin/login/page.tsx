"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        setSubmitting(false);
        return;
      }

      if (data.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
      router.refresh();
    } catch {
      setError("Unable to login. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-8 bg-[#070E1A]">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#4A90D9] mx-auto mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <circle cx="12" cy="12" r="6" />
          </svg>
        </div>
        <span className="text-xl font-bold text-[#F0F4F8]">Vercel Aura</span>
        <p className="text-[#8899A6] text-sm mt-1">Admin Console</p>
      </div>

      <form className="bg-[#0D1B2A] rounded-2xl p-6 shadow-xl border border-[#1E3A5F] space-y-4" onSubmit={onSubmit}>
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#F0F4F8]">Admin Login</h1>
          <p className="mt-2 text-sm text-[#8899A6]">
            Secure access to Vercel Aura dispatch, clients, and settings.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#F0F4F8] mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-[#070E1A] border border-[#1E3A5F] text-[#F0F4F8] placeholder-[#5B8DB8] text-sm focus:outline-none focus:border-[#4A90D9] transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@vercelaura.ai"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#F0F4F8] mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-[#070E1A] border border-[#1E3A5F] text-[#F0F4F8] placeholder-[#5B8DB8] text-sm focus:outline-none focus:border-[#4A90D9] transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl bg-[#4A90D9] hover:bg-[#3a7bc4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-[#5B8DB8] hover:text-[#4A90D9] transition-colors"
      >
        ← Back to home
      </Link>
    </main>
  );
}
