"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientDeskSnapshot } from "@/lib/types";
import { formatWhen, plainBillingLabel, plainLineLabel } from "@/lib/format";

type View = "home" | "people" | "calls";

export function ClientDesk({ initial }: { initial: ClientDeskSnapshot }) {
  const [desk, setDesk] = useState(initial);
  const [view, setView] = useState<View>("home");

  async function refresh() {
    const res = await fetch("/api/desk");
    if (res.ok) setDesk(await res.json());
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const lineTone =
    desk.line.status === "live"
      ? "bg-[var(--sea)]"
      : desk.line.status === "paused"
        ? "bg-amber-600"
        : "bg-[var(--mute)]";

  return (
    <main className="atmosphere min-h-dvh">
      <header className="border-b border-[var(--line)]/70 bg-[var(--paper)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-8">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--mute)]">Your desk</p>
            <h1 className="text-lg font-semibold tracking-tight">{desk.client.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button onClick={refresh} className="text-[var(--ink)]/55 hover:text-[var(--ink)]">
              Refresh
            </button>
            <button onClick={logout} className="text-[var(--ink)]/55 hover:text-[var(--ink)]">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
        <section className="overflow-hidden rounded-[28px] bg-[var(--panel)] text-[var(--paper)]">
          <div className="relative p-7 md:p-10">
            <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-[var(--sea)]/25 blur-3xl" />
            <div className="relative">
              <p className="mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                Good {greetingBucket()}, {desk.client.contactName.split(" ")[0]}
              </p>
              <h2 className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight md:text-5xl">
                {plainLineLabel(desk.line.status)}
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${lineTone}`} />
                  {desk.line.phoneNumber || "Number arriving soon"}
                </span>
                {desk.line.languages.length ? (
                  <span>{desk.line.languages.join(" · ")}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <Stat label="Calls today" value={String(desk.today.calls)} />
            <Stat label="New people" value={String(desk.today.newLeads)} />
            <Stat label="Talk time" value={`${desk.today.minutes} min`} />
          </div>
        </section>

        <nav className="mt-8 flex gap-2">
          {(
            [
              ["home", "Home"],
              ["people", "People"],
              ["calls", "Calls"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                view === id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-white/80 text-[var(--ink)]/70 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {view === "home" && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
              <h3 className="text-xl font-semibold tracking-tight">What needs a callback</h3>
              <ul className="mt-5 divide-y divide-[var(--line)]">
                {desk.leads.filter((l) => l.status === "new").slice(0, 5).map((lead) => (
                  <li key={lead.id} className="py-4">
                    <p className="font-medium">{lead.name}</p>
                    <p className="mt-1 text-sm text-[var(--ink)]/65">{lead.topic}</p>
                    <p className="mt-2 text-sm text-[var(--mute)]">
                      {lead.phone}
                      {lead.preferredCallbackTime ? ` · Prefer ${lead.preferredCallbackTime}` : ""}
                    </p>
                  </li>
                ))}
                {!desk.leads.some((l) => l.status === "new") ? (
                  <li className="py-6 text-sm text-[var(--mute)]">No new people waiting. Your line is quiet.</li>
                ) : null}
              </ul>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                <h3 className="text-lg font-semibold tracking-tight">Your plan</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{desk.plan.name}</p>
                <p className="mt-2 text-sm text-[var(--ink)]/65">
                  {desk.plan.minutesUsed} of {desk.plan.minutesIncluded} minutes used
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--mist)]">
                  <div
                    className="h-full rounded-full bg-[var(--sea)]"
                    style={{
                      width: `${Math.min(100, Math.round((desk.plan.minutesUsed / Math.max(1, desk.plan.minutesIncluded)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-[var(--mute)]">
                  {plainBillingLabel(desk.plan.billingStatus)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                <h3 className="text-lg font-semibold tracking-tight">Need a change?</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/65">
                  Greeting, voice, hours, and number changes are handled by Hostline for you. Message your Hostline contact and we tune the desk.
                </p>
              </div>
            </div>
          </div>
        )}

        {view === "people" && (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
            <ul className="divide-y divide-[var(--line)]">
              {desk.leads.map((lead) => (
                <li key={lead.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-medium tracking-tight">{lead.name}</p>
                      <p className="mt-1 text-sm text-[var(--ink)]/65">{lead.topic}</p>
                      <p className="mt-2 text-sm text-[var(--mute)]">
                        {lead.phone}
                        {lead.email ? ` · ${lead.email}` : ""}
                      </p>
                    </div>
                    <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--mute)]">
                      {lead.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === "calls" && (
          <div className="mt-6 space-y-3">
            {desk.calls.map((call) => (
              <article key={call.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{call.fromNumber}</p>
                  <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--mute)]">
                    {call.outcome} · {formatWhen(call.startedAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/70">
                  {call.summary || "Hostline answered this call."}
                </p>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-10 flex items-center justify-between text-sm text-[var(--mute)]">
          <Link href="/" className="hover:text-[var(--ink)]">
            Hostline
          </Link>
          <span>Powered quietly by Grok Voice</span>
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-5">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function greetingBucket() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
