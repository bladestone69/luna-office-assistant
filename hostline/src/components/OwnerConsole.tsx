"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Agent, Client, OwnerSnapshot, PlanId } from "@/lib/types";
import { DEFAULT_GROK_VOICES } from "@/lib/xai-client";
import { formatWhen, formatZar, plainBillingLabel } from "@/lib/format";

type Tab = "pulse" | "clients" | "studio" | "billing" | "platform";

export function OwnerConsole({ initial }: { initial: OwnerSnapshot }) {
  const [snap, setSnap] = useState(initial);
  const [tab, setTab] = useState<Tab>("pulse");
  const [selectedId, setSelectedId] = useState(initial.clients[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const selected = useMemo(
    () => snap.clients.find((c) => c.id === selectedId) || snap.clients[0] || null,
    [snap.clients, selectedId]
  );
  const selectedAgent = useMemo(
    () => (selected ? snap.agents.find((a) => a.clientId === selected.id) || null : null),
    [snap.agents, selected]
  );

  async function refresh() {
    const res = await fetch("/api/owner/snapshot");
    if (res.ok) setSnap(await res.json());
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      industry: String(form.get("industry") || ""),
      contactName: String(form.get("contactName") || ""),
      contactEmail: String(form.get("contactEmail") || ""),
      contactPhone: String(form.get("contactPhone") || ""),
      loginEmail: String(form.get("loginEmail") || ""),
      password: String(form.get("password") || ""),
      planId: String(form.get("planId") || "starter") as PlanId,
      notes: String(form.get("notes") || ""),
    };
    const res = await fetch("/api/owner/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setNote("Could not create client.");
      return;
    }
    const client = (await res.json()) as Client;
    event.currentTarget.reset();
    setNote(`${client.name} is on trial. Open Studio to wire Grok.`);
    await refresh();
    setSelectedId(client.id);
    setTab("studio");
  }

  async function patchClient(patch: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true);
    const res = await fetch("/api/owner/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: selected.id, ...patch }),
    });
    setBusy(false);
    if (!res.ok) {
      setNote("Update failed.");
      return;
    }
    setNote("Client updated.");
    await refresh();
  }

  async function saveAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setNote("");
    const form = new FormData(event.currentTarget);
    const payload = {
      clientId: selected.id,
      name: String(form.get("name") || ""),
      xaiAgentId: String(form.get("xaiAgentId") || ""),
      phoneNumber: String(form.get("phoneNumber") || ""),
      voice: String(form.get("voice") || "ara"),
      greetingScript: String(form.get("greetingScript") || ""),
      systemPrompt: String(form.get("systemPrompt") || ""),
      status: String(form.get("status") || "draft"),
      languages: String(form.get("languages") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res = await fetch("/api/owner/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setNote("Could not save Grok agent.");
      return;
    }
    const agent = (await res.json()) as Agent;
    if (agent.status === "live" && agent.phoneNumber && agent.xaiAgentId) {
      await patchClient({ status: "live" });
    }
    setNote("Grok desk saved for this client.");
    await refresh();
  }

  async function payInvoice(invoiceId: string) {
    setBusy(true);
    await fetch("/api/owner/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    setBusy(false);
    await refresh();
  }

  return (
    <main className="min-h-dvh bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--panel)] text-[var(--paper)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-tight">
              Hostline
            </Link>
            <span className="mono hidden text-[11px] uppercase tracking-[0.18em] text-white/45 sm:inline">
              Owner atelier
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/55 md:inline">
              {snap.metrics.liveClients} live · {formatZar(snap.metrics.mrrZar)} MRR
            </span>
            <button onClick={logout} className="text-white/70 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-[220px_1fr] md:px-8 md:py-8">
        <aside className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {(
            [
              ["pulse", "Pulse"],
              ["clients", "Clients"],
              ["studio", "Grok studio"],
              ["billing", "Billing"],
              ["platform", "Platform"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-md px-3 py-2.5 text-left text-sm transition ${
                tab === id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-white/70 text-[var(--ink)]/70 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>

        <section className="min-w-0 space-y-6">
          {note ? (
            <p className="rounded-xl border border-[var(--sea)]/25 bg-[var(--sea)]/10 px-4 py-3 text-sm text-[var(--sea-deep)]">
              {note}
            </p>
          ) : null}

          {tab === "pulse" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Platform pulse</h1>
                <p className="mt-2 max-w-[48ch] text-[var(--ink)]/65">
                  Every client desk, every Grok minute, every rand. This is your Hostline command floor.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Live desks" value={String(snap.metrics.liveClients)} />
                <Metric label="Trials" value={String(snap.metrics.trialClients)} />
                <Metric label="MRR" value={formatZar(snap.metrics.mrrZar)} />
                <Metric label="Minutes this month" value={String(snap.metrics.minutesThisMonth)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Needs you">
                  <ul className="space-y-3">
                    {snap.clients
                      .filter((c) => c.status === "onboarding" || c.billingStatus === "past_due" || c.billingStatus === "trial")
                      .map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-[var(--mute)]">
                              {c.status} · {plainBillingLabel(c.billingStatus)}
                            </p>
                          </div>
                          <button
                            className="text-[var(--sea-deep)] underline"
                            onClick={() => {
                              setSelectedId(c.id);
                              setTab(c.billingStatus === "past_due" ? "billing" : "studio");
                            }}
                          >
                            Open
                          </button>
                        </li>
                      ))}
                    {!snap.clients.some((c) => c.status === "onboarding" || c.billingStatus === "past_due" || c.billingStatus === "trial") ? (
                      <li className="text-sm text-[var(--mute)]">All desks are calm.</li>
                    ) : null}
                  </ul>
                </Panel>
                <Panel title="Latest leads across desks">
                  <ul className="space-y-3">
                    {snap.leads.slice(0, 5).map((lead) => {
                      const client = snap.clients.find((c) => c.id === lead.clientId);
                      return (
                        <li key={lead.id} className="text-sm">
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-[var(--mute)]">
                            {client?.name || "Unknown"} · {lead.topic}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </div>
            </div>
          )}

          {tab === "clients" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
                  <p className="mt-2 text-[var(--ink)]/65">Onboard a desk, then finish it in Grok studio.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] text-[var(--mute)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Billing</th>
                      <th className="px-4 py-3 font-medium">Minutes</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {snap.clients.map((client) => {
                      const plan = snap.plans.find((p) => p.id === client.planId);
                      return (
                        <tr key={client.id} className="border-b border-[var(--line)] last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium">{client.name}</p>
                            <p className="text-[var(--mute)]">{client.industry}</p>
                          </td>
                          <td className="px-4 py-3">{plan?.name}</td>
                          <td className="px-4 py-3">{client.status}</td>
                          <td className="px-4 py-3">{plainBillingLabel(client.billingStatus)}</td>
                          <td className="px-4 py-3">
                            {client.minutesUsed}/{client.minutesIncluded}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="text-[var(--sea-deep)] underline"
                              onClick={() => {
                                setSelectedId(client.id);
                                setTab("studio");
                              }}
                            >
                              Studio
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <form onSubmit={createClient} className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 md:grid-cols-2">
                <h2 className="md:col-span-2 text-xl font-semibold tracking-tight">Onboard a client</h2>
                <Field name="name" label="Business name" placeholder="Greenbank Clinic" required />
                <Field name="industry" label="Industry" placeholder="Medical" required />
                <Field name="contactName" label="Owner contact" required />
                <Field name="contactEmail" label="Contact email" type="email" required />
                <Field name="contactPhone" label="Contact phone" required />
                <Field name="loginEmail" label="Desk login email" type="email" required />
                <Field name="password" label="Desk password" required />
                <div>
                  <label className="label" htmlFor="planId">Plan</label>
                  <select id="planId" name="planId" className="input" defaultValue="starter">
                    {snap.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatZar(plan.monthlyZar)}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label" htmlFor="notes">Owner notes</label>
                  <textarea id="notes" name="notes" className="input min-h-24" placeholder="Voice preference, hours, escalation rules" />
                </div>
                <div className="md:col-span-2">
                  <button className="cta-start" disabled={busy} type="submit">
                    {busy ? "Creating…" : "Create client desk"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "studio" && selected && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Grok studio</h1>
                  <p className="mt-2 text-[var(--ink)]/65">
                    Wire the voice, number, and prompt for one client. Clients never see this screen.
                  </p>
                </div>
                <select
                  className="input max-w-xs"
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {snap.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <form onSubmit={saveAgent} className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-tight">{selected.name}</h2>
                    <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--mute)]">
                      {selectedAgent?.status || "draft"}
                    </span>
                  </div>
                  <Field name="name" label="Desk label" defaultValue={selectedAgent?.name || `${selected.name} Desk`} />
                  <Field
                    name="xaiAgentId"
                    label="xAI agent id"
                    defaultValue={selectedAgent?.xaiAgentId || ""}
                    placeholder="from Voice Agent Builder"
                  />
                  <Field
                    name="phoneNumber"
                    label="Phone number"
                    defaultValue={selectedAgent?.phoneNumber || ""}
                    placeholder="+27..."
                  />
                  <div>
                    <label className="label" htmlFor="voice">Voice</label>
                    <select id="voice" name="voice" className="input" defaultValue={selectedAgent?.voice || "ara"}>
                      {DEFAULT_GROK_VOICES.map((voice) => (
                        <option key={voice} value={voice}>{voice}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="status">Line status</label>
                    <select id="status" name="status" className="input" defaultValue={selectedAgent?.status || "draft"}>
                      <option value="draft">draft</option>
                      <option value="live">live</option>
                      <option value="paused">paused</option>
                    </select>
                  </div>
                  <Field
                    name="languages"
                    label="Languages"
                    defaultValue={(selectedAgent?.languages || []).join(", ")}
                  />
                  <div>
                    <label className="label" htmlFor="greetingScript">Greeting</label>
                    <textarea
                      id="greetingScript"
                      name="greetingScript"
                      className="input min-h-20"
                      defaultValue={selectedAgent?.greetingScript || ""}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="systemPrompt">System prompt</label>
                    <textarea
                      id="systemPrompt"
                      name="systemPrompt"
                      className="input min-h-40"
                      defaultValue={selectedAgent?.systemPrompt || ""}
                    />
                  </div>
                  <button className="cta-start" disabled={busy} type="submit">
                    {busy ? "Saving…" : "Save Grok desk"}
                  </button>
                </form>

                <div className="space-y-4">
                  <Panel title="Client controls">
                    <div className="space-y-3 text-sm">
                      <p>
                        Desk login: <span className="mono">{selected.loginEmail}</span>
                      </p>
                      <p>
                        Password: <span className="mono">{selected.password}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button className="cta-see" disabled={busy} onClick={() => patchClient({ status: "live", billingStatus: "active" })}>
                          Mark live
                        </button>
                        <button className="cta-see" disabled={busy} onClick={() => patchClient({ status: "paused", billingStatus: "paused" })}>
                          Pause desk
                        </button>
                      </div>
                    </div>
                  </Panel>
                  <Panel title="Setup checklist">
                    <Checklist
                      items={[
                        { ok: Boolean(selectedAgent?.xaiAgentId), label: "Grok agent id linked" },
                        { ok: Boolean(selectedAgent?.phoneNumber), label: "Phone number assigned" },
                        { ok: selectedAgent?.status === "live", label: "Line set to live" },
                        { ok: selected.status === "live", label: "Client marked live" },
                      ]}
                    />
                  </Panel>
                  <Panel title="Recent activity">
                    <ul className="space-y-3 text-sm">
                      {snap.calls
                        .filter((c) => c.clientId === selected.id)
                        .slice(0, 4)
                        .map((call) => (
                          <li key={call.id}>
                            <p className="font-medium">{call.summary || "Call logged"}</p>
                            <p className="text-[var(--mute)]">{formatWhen(call.startedAt)}</p>
                          </li>
                        ))}
                    </ul>
                  </Panel>
                </div>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
                <p className="mt-2 text-[var(--ink)]/65">
                  ZAR plans, minute usage, and invoice state across every desk.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {snap.plans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
                    <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--mute)]">{plan.name}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{formatZar(plan.monthlyZar)}</p>
                    <p className="mt-2 text-sm text-[var(--ink)]/65">
                      {plan.includedMinutes} min · overage {formatZar(plan.overagePerMinuteZar)}/min
                    </p>
                    <p className="mt-3 text-sm text-[var(--ink)]/70">{plan.description}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] text-[var(--mute)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Period</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {snap.invoices.map((inv) => {
                      const client = snap.clients.find((c) => c.id === inv.clientId);
                      return (
                        <tr key={inv.id} className="border-b border-[var(--line)] last:border-0">
                          <td className="px-4 py-3">{client?.name || inv.clientId}</td>
                          <td className="px-4 py-3">{inv.periodLabel}</td>
                          <td className="px-4 py-3">{formatZar(inv.amountZar)}</td>
                          <td className="px-4 py-3">{inv.status}</td>
                          <td className="px-4 py-3 text-right">
                            {inv.status !== "paid" ? (
                              <button className="text-[var(--sea-deep)] underline" disabled={busy} onClick={() => payInvoice(inv.id)}>
                                Mark paid
                              </button>
                            ) : (
                              <span className="text-[var(--mute)]">Paid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Panel title="Usage by client">
                <ul className="space-y-3">
                  {snap.clients.map((client) => {
                    const pct = Math.min(100, Math.round((client.minutesUsed / Math.max(1, client.minutesIncluded)) * 100));
                    return (
                      <li key={client.id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-[var(--mute)]">
                            {client.minutesUsed}/{client.minutesIncluded} min
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--mist)]">
                          <div className="h-full rounded-full bg-[var(--sea)]" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          )}

          {tab === "platform" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Platform</h1>
                <p className="mt-2 text-[var(--ink)]/65">
                  Owner-only Grok wiring. Keep keys here. Clients only see their calm desk.
                </p>
              </div>
              <Checklist
                items={[
                  { ok: snap.platform.hasXaiKey, label: "XAI_API_KEY present" },
                  { ok: snap.platform.hasWebhookSecret, label: "XAI_WEBHOOK_SECRET present" },
                ]}
              />
              <Panel title="Tool webhook">
                <p className="text-sm text-[var(--ink)]/75">
                  Point every Grok agent tool at this endpoint and send header <span className="mono">x-hostline-secret</span>.
                </p>
                <p className="mono mt-3 break-all rounded-md bg-[var(--mist)] p-3 text-xs">
                  {snap.platform.webhookUrlHint}
                </p>
              </Panel>
              <Panel title="Demo client logins">
                <ul className="space-y-2 text-sm">
                  {snap.clients.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[var(--mute)]"> · {c.loginEmail} / {c.password}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--mute)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field(props: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input
        id={props.name}
        name={props.name}
        className="input"
        type={props.type || "text"}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        required={props.required}
      />
    </div>
  );
}

function Checklist({ items }: { items: Array<{ ok: boolean; label: string }> }) {
  return (
    <ul className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 text-sm">
          <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${item.ok ? "bg-[var(--sea)]" : "bg-[var(--mute)]"}`} />
          <span className={item.ok ? "text-[var(--ink)]" : "text-[var(--ink)]/60"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
