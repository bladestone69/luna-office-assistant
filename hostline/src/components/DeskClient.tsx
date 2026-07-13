"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Agent, DeskSnapshot } from "@/lib/types";
import { DEFAULT_GROK_VOICES } from "@/lib/xai-client";

type Props = { initial: DeskSnapshot };

export function DeskClient({ initial }: Props) {
  const [tab, setTab] = useState<"overview" | "agent" | "leads" | "calls" | "setup">("overview");
  const [desk, setDesk] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const readyCount = useMemo(() => {
    return [desk.setup.hasXaiKey, desk.setup.hasAgentId, desk.setup.hasWebhookSecret].filter(Boolean).length;
  }, [desk.setup]);

  async function refresh() {
    const res = await fetch("/api/desk");
    if (res.ok) setDesk(await res.json());
  }

  async function saveAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      xaiAgentId: String(form.get("xaiAgentId") || ""),
      phoneNumber: String(form.get("phoneNumber") || ""),
      voice: String(form.get("voice") || "ara"),
      systemPrompt: String(form.get("systemPrompt") || ""),
      status: String(form.get("status") || "draft") as Agent["status"],
      languages: String(form.get("languages") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res = await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save agent.");
      return;
    }
    setMessage("Agent saved.");
    await refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="min-h-dvh bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-tight">
              Hostline
            </Link>
            <span className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--mute)]">Desk</span>
          </div>
          <button onClick={logout} className="text-sm text-[var(--ink)]/65 hover:text-[var(--ink)]">
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[200px_1fr] md:px-8">
        <aside className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {(
            [
              ["overview", "Overview"],
              ["agent", "Agent"],
              ["leads", "Leads"],
              ["calls", "Calls"],
              ["setup", "Setup"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm ${
                tab === id ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink)]/70 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>

        <section className="min-w-0">
          {tab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight">Desk overview</h1>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Setup ready" value={`${readyCount}/3`} />
                <Stat label="Leads" value={String(desk.leads.length)} />
                <Stat label="Calls" value={String(desk.calls.length)} />
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--mute)]">Active agent</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {desk.agent?.name || "No agent yet"}
                </h2>
                <p className="mt-2 text-sm text-[var(--ink)]/65">
                  Voice {desk.agent?.voice || "unset"} · Status {desk.agent?.status || "draft"}
                </p>
                <p className="mt-4 text-sm text-[var(--ink)]/75">
                  Phone: {desk.setup.phoneNumber || "Add a Grok provisioned number or SIP line"}
                </p>
              </div>
            </div>
          )}

          {tab === "agent" && desk.agent && (
            <form onSubmit={saveAgent} className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
              <h1 className="text-3xl font-semibold tracking-tight">Grok agent</h1>
              <Field label="Display name" name="name" defaultValue={desk.agent.name} />
              <Field label="xAI agent id" name="xaiAgentId" defaultValue={desk.agent.xaiAgentId} placeholder="from Voice Agent Builder" />
              <Field label="Phone number" name="phoneNumber" defaultValue={desk.agent.phoneNumber} placeholder="+27..." />
              <div>
                <label className="label" htmlFor="voice">Voice</label>
                <select id="voice" name="voice" className="input" defaultValue={desk.agent.voice}>
                  {DEFAULT_GROK_VOICES.map((voice) => (
                    <option key={voice} value={voice}>{voice}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" name="status" className="input" defaultValue={desk.agent.status}>
                  <option value="draft">draft</option>
                  <option value="live">live</option>
                  <option value="paused">paused</option>
                </select>
              </div>
              <Field
                label="Languages (comma separated)"
                name="languages"
                defaultValue={desk.agent.languages.join(", ")}
              />
              <div>
                <label className="label" htmlFor="systemPrompt">System prompt</label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  className="input min-h-40"
                  defaultValue={desk.agent.systemPrompt}
                />
              </div>
              {message ? <p className="text-sm text-[var(--sea-deep)]">{message}</p> : null}
              <button type="submit" className="cta-start" disabled={saving}>
                {saving ? "Saving…" : "Save agent"}
              </button>
            </form>
          )}

          {tab === "leads" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
              <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] text-[var(--mute)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Topic</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desk.leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-4 py-3">{lead.name}</td>
                        <td className="px-4 py-3">{lead.phone}</td>
                        <td className="px-4 py-3">{lead.topic}</td>
                        <td className="px-4 py-3">{lead.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "calls" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight">Calls</h1>
              <div className="space-y-3">
                {desk.calls.map((call) => (
                  <article key={call.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{call.fromNumber} → {call.toNumber}</p>
                      <p className="mono text-xs uppercase tracking-[0.14em] text-[var(--mute)]">
                        {call.direction} · {call.outcome}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink)]/70">
                      {call.summary || "No summary yet"}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === "setup" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight">Grok setup</h1>
              <Checklist
                items={[
                  { ok: desk.setup.hasXaiKey, label: "XAI_API_KEY set in environment" },
                  { ok: desk.setup.hasAgentId, label: "Voice Agent Builder agent id linked" },
                  { ok: desk.setup.hasWebhookSecret, label: "XAI_WEBHOOK_SECRET set for tool calls" },
                ]}
              />
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-sm leading-relaxed text-[var(--ink)]/80">
                <p className="font-medium text-[var(--ink)]">Wire tools to Hostline</p>
                <p className="mt-3">
                  In Voice Agent Builder, add a REST tool named <span className="mono">create_lead</span> that posts to:
                </p>
                <p className="mono mt-2 break-all rounded-md bg-[var(--mist)] p-3 text-xs">
                  POST /api/webhooks/xai
                </p>
                <p className="mt-3">
                  Send header <span className="mono">x-hostline-secret</span> with your webhook secret. Body example:
                </p>
                <pre className="mono mt-2 overflow-x-auto rounded-md bg-[var(--mist)] p-3 text-xs">{`{
  "tool": "create_lead",
  "name": "Caller name",
  "phone": "+27...",
  "topic": "Booking request",
  "preferred_callback_time": "Tomorrow 09:00",
  "consent": true
}`}</pre>
                <p className="mt-4">
                  Docs:{" "}
                  <a className="underline" href="https://x.ai/voice" target="_blank" rel="noreferrer">
                    x.ai/voice
                  </a>{" "}
                  ·{" "}
                  <a
                    className="underline"
                    href="https://docs.x.ai/developers/model-capabilities/audio/voice-agent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voice Agent API
                  </a>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--mute)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input
        id={props.name}
        name={props.name}
        className="input"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
      />
    </div>
  );
}

function Checklist({ items }: { items: Array<{ ok: boolean; label: string }> }) {
  return (
    <ul className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 text-sm">
          <span className={`mt-0.5 inline-block h-2.5 w-2.5 rounded-full ${item.ok ? "bg-[var(--sea)]" : "bg-[var(--mute)]"}`} />
          <span className={item.ok ? "text-[var(--ink)]" : "text-[var(--ink)]/60"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
