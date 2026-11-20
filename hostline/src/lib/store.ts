import { randomUUID } from "crypto";
import {
  PLANS,
  type Agent,
  type BillingStatus,
  type CallRecord,
  type Client,
  type ClientDeskSnapshot,
  type ClientStatus,
  type Invoice,
  type Lead,
  type OwnerSnapshot,
  type PlanId,
} from "./types";

type StoreShape = {
  clients: Client[];
  agents: Agent[];
  leads: Lead[];
  calls: CallRecord[];
  invoices: Invoice[];
};

const globalStore = globalThis as typeof globalThis & {
  __hostlineStoreV2?: StoreShape;
};

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function seed(): StoreShape {
  const now = new Date().toISOString();
  const clinicId = "client_clinic";
  const lawId = "client_law";
  const estateId = "client_estate";

  const clients: Client[] = [
    {
      id: clinicId,
      name: "Greenbank Clinic",
      industry: "Medical",
      contactName: "Dr. Ayanda Nkosi",
      contactEmail: "ayanda@greenbank.clinic",
      contactPhone: "+27821230001",
      loginEmail: "desk@greenbank.clinic",
      password: "clinic-desk",
      status: "live",
      planId: "practice",
      billingStatus: "active",
      minutesUsed: 412,
      minutesIncluded: 800,
      nextBillingDate: daysFromNow(12),
      notes: "After-hours line. Prefer ara voice.",
      createdAt: hoursAgo(720),
      updatedAt: now,
    },
    {
      id: lawId,
      name: "Mokoena & Partners",
      industry: "Legal",
      contactName: "Sipho Mokoena",
      contactEmail: "sipho@mokoena.law",
      contactPhone: "+27821230002",
      loginEmail: "desk@mokoena.law",
      password: "law-desk",
      status: "live",
      planId: "firm",
      billingStatus: "active",
      minutesUsed: 1180,
      minutesIncluded: 2000,
      nextBillingDate: daysFromNow(5),
      notes: "Intake only. Escalate urgent matters.",
      createdAt: hoursAgo(900),
      updatedAt: now,
    },
    {
      id: estateId,
      name: "Harbour View Estates",
      industry: "Real estate",
      contactName: "Lerato Dlamini",
      contactEmail: "lerato@harbourview.co.za",
      contactPhone: "+27821230003",
      loginEmail: "desk@harbourview.co.za",
      password: "estate-desk",
      status: "onboarding",
      planId: "starter",
      billingStatus: "trial",
      minutesUsed: 48,
      minutesIncluded: 300,
      nextBillingDate: daysFromNow(21),
      notes: "Trial week. Waiting on Grok agent id.",
      createdAt: hoursAgo(48),
      updatedAt: now,
    },
  ];

  const agents: Agent[] = [
    {
      id: "agent_clinic",
      clientId: clinicId,
      name: "Clinic Front Desk",
      xaiAgentId: "grok_agent_clinic_demo",
      phoneNumber: "+27115550101",
      voice: "ara",
      greetingScript: "Good day, you have reached Greenbank Clinic. How may I help you?",
      systemPrompt:
        "You are the Hostline receptionist for Greenbank Clinic in South Africa. Capture patient name, phone, reason for call, and preferred callback. Offer appointments when asked. Switch languages when the caller prefers.",
      status: "live",
      languages: ["English", "Zulu", "Afrikaans"],
      updatedAt: now,
    },
    {
      id: "agent_law",
      clientId: lawId,
      name: "Intake Line",
      xaiAgentId: "grok_agent_law_demo",
      phoneNumber: "+27115550102",
      voice: "rex",
      greetingScript: "Mokoena and Partners, good day. How can we assist?",
      systemPrompt:
        "You are the Hostline intake receptionist for Mokoena & Partners. Qualify new matters, capture contact details, and never give legal advice.",
      status: "live",
      languages: ["English", "Afrikaans"],
      updatedAt: now,
    },
    {
      id: "agent_estate",
      clientId: estateId,
      name: "Viewings Desk",
      xaiAgentId: "",
      phoneNumber: "",
      voice: "eve",
      greetingScript: "Harbour View Estates, hello. Looking for a viewing?",
      systemPrompt:
        "You are the Hostline receptionist for Harbour View Estates. Capture buyer or seller interest, suburb preference, and callback time.",
      status: "draft",
      languages: ["English", "Zulu", "Xhosa"],
      updatedAt: now,
    },
  ];

  const leads: Lead[] = [
    {
      id: "lead_1",
      clientId: clinicId,
      name: "Thandi Mokoena",
      phone: "+27821234567",
      email: "thandi@example.co.za",
      topic: "New patient booking",
      preferredCallbackTime: "Tomorrow morning",
      consent: true,
      source: "phone_call",
      status: "new",
      createdAt: hoursAgo(2),
    },
    {
      id: "lead_2",
      clientId: lawId,
      name: "Johan Botha",
      phone: "+27829876543",
      email: null,
      topic: "Commercial lease review",
      preferredCallbackTime: "Today after 16:00",
      consent: true,
      source: "phone_call",
      status: "new",
      createdAt: hoursAgo(5),
    },
    {
      id: "lead_3",
      clientId: clinicId,
      name: "Naledi Khumalo",
      phone: "+27821112233",
      email: "naledi@mail.co.za",
      topic: "Follow-up results",
      preferredCallbackTime: null,
      consent: true,
      source: "phone_call",
      status: "contacted",
      createdAt: hoursAgo(26),
    },
  ];

  const calls: CallRecord[] = [
    {
      id: "call_1",
      clientId: clinicId,
      direction: "inbound",
      fromNumber: "+27821234567",
      toNumber: "+27115550101",
      durationSeconds: 184,
      outcome: "completed",
      summary: "New patient asked for a GP slot and left a morning callback.",
      transcript: null,
      startedAt: hoursAgo(2),
      endedAt: hoursAgo(2),
    },
    {
      id: "call_2",
      clientId: lawId,
      direction: "inbound",
      fromNumber: "+27829876543",
      toNumber: "+27115550102",
      durationSeconds: 261,
      outcome: "completed",
      summary: "Prospective client needs a commercial lease review this week.",
      transcript: null,
      startedAt: hoursAgo(5),
      endedAt: hoursAgo(5),
    },
    {
      id: "call_3",
      clientId: clinicId,
      direction: "inbound",
      fromNumber: "+27824445566",
      toNumber: "+27115550101",
      durationSeconds: 42,
      outcome: "missed",
      summary: "Caller hung up during greeting.",
      transcript: null,
      startedAt: hoursAgo(8),
      endedAt: hoursAgo(8),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv_1",
      clientId: clinicId,
      periodLabel: "June 2026",
      amountZar: 2999,
      status: "paid",
      issuedAt: hoursAgo(720),
      paidAt: hoursAgo(700),
    },
    {
      id: "inv_2",
      clientId: lawId,
      periodLabel: "June 2026",
      amountZar: 5999,
      status: "paid",
      issuedAt: hoursAgo(720),
      paidAt: hoursAgo(690),
    },
    {
      id: "inv_3",
      clientId: clinicId,
      periodLabel: "July 2026",
      amountZar: 2999,
      status: "due",
      issuedAt: hoursAgo(48),
      paidAt: null,
    },
  ];

  return { clients, agents, leads, calls, invoices };
}

function getStore(): StoreShape {
  if (!globalStore.__hostlineStoreV2) {
    globalStore.__hostlineStoreV2 = seed();
  }
  return globalStore.__hostlineStoreV2;
}

function planOf(planId: PlanId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

function platformSetup() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return {
    hasXaiKey: Boolean(process.env.XAI_API_KEY?.trim()),
    hasWebhookSecret: Boolean(process.env.XAI_WEBHOOK_SECRET?.trim()),
    webhookUrlHint: `${base.replace(/\/$/, "")}/api/webhooks/xai`,
  };
}

export function getOwnerSnapshot(): OwnerSnapshot {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const liveClients = store.clients.filter((c) => c.status === "live").length;
  const trialClients = store.clients.filter((c) => c.billingStatus === "trial").length;
  const mrrZar = store.clients
    .filter((c) => c.billingStatus === "active" || c.billingStatus === "past_due")
    .reduce((sum, c) => sum + planOf(c.planId).monthlyZar, 0);
  const minutesThisMonth = store.clients.reduce((sum, c) => sum + c.minutesUsed, 0);
  const newLeads = store.leads.filter((l) => l.status === "new").length;
  const callsToday = store.calls.filter((c) => c.startedAt.startsWith(today)).length;

  return {
    clients: [...store.clients].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    agents: store.agents,
    leads: [...store.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    calls: [...store.calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    invoices: [...store.invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    plans: PLANS,
    platform: platformSetup(),
    metrics: { liveClients, trialClients, mrrZar, minutesThisMonth, newLeads, callsToday },
  };
}

export function getClientByLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    getStore().clients.find(
      (c) => c.loginEmail.toLowerCase() === normalized && c.password === password
    ) || null
  );
}

export function getClientById(clientId: string) {
  return getStore().clients.find((c) => c.id === clientId) || null;
}

export function getClientDesk(clientId: string): ClientDeskSnapshot | null {
  const store = getStore();
  const client = store.clients.find((c) => c.id === clientId);
  if (!client) return null;
  const agent = store.agents.find((a) => a.clientId === clientId) || null;
  const plan = planOf(client.planId);
  const today = new Date().toISOString().slice(0, 10);
  const leads = store.leads
    .filter((l) => l.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const calls = store.calls
    .filter((c) => c.clientId === clientId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const lineStatus =
    client.status === "paused"
      ? "paused"
      : agent?.status === "live" && agent.phoneNumber
        ? "live"
        : "setting_up";

  return {
    client: {
      id: client.id,
      name: client.name,
      industry: client.industry,
      contactName: client.contactName,
      planId: client.planId,
      status: client.status,
    },
    line: {
      status: lineStatus,
      phoneNumber: agent?.phoneNumber || null,
      voiceLabel: agent?.voice || "pending",
      languages: agent?.languages || [],
    },
    today: {
      calls: calls.filter((c) => c.startedAt.startsWith(today)).length,
      newLeads: leads.filter((l) => l.status === "new").length,
      minutes: Math.round(
        calls
          .filter((c) => c.startedAt.startsWith(today))
          .reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / 60
      ),
    },
    leads,
    calls,
    plan: {
      name: plan.name,
      minutesUsed: client.minutesUsed,
      minutesIncluded: client.minutesIncluded || plan.includedMinutes,
      billingStatus: client.billingStatus,
      nextBillingDate: client.nextBillingDate,
    },
  };
}

export function createClient(input: {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  loginEmail: string;
  password: string;
  planId: PlanId;
  notes?: string;
}) {
  const store = getStore();
  const now = new Date().toISOString();
  const plan = planOf(input.planId);
  const client: Client = {
    id: randomUUID(),
    name: input.name,
    industry: input.industry,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    loginEmail: input.loginEmail,
    password: input.password,
    status: "onboarding",
    planId: input.planId,
    billingStatus: "trial",
    minutesUsed: 0,
    minutesIncluded: plan.includedMinutes,
    nextBillingDate: daysFromNow(14),
    notes: input.notes || "",
    createdAt: now,
    updatedAt: now,
  };
  store.clients.unshift(client);
  store.agents.unshift({
    id: randomUUID(),
    clientId: client.id,
    name: `${client.name} Desk`,
    xaiAgentId: "",
    phoneNumber: "",
    voice: "ara",
    greetingScript: `Good day, you have reached ${client.name}. How may I help you?`,
    systemPrompt: `You are the Hostline receptionist for ${client.name}. Capture name, phone, topic, and preferred callback. Keep answers short. Switch languages when asked.`,
    status: "draft",
    languages: ["English", "Afrikaans", "Zulu", "Xhosa"],
    updatedAt: now,
  });
  return client;
}

export function updateClient(
  clientId: string,
  patch: Partial<
    Pick<
      Client,
      | "name"
      | "industry"
      | "contactName"
      | "contactEmail"
      | "contactPhone"
      | "loginEmail"
      | "password"
      | "status"
      | "planId"
      | "billingStatus"
      | "notes"
      | "minutesUsed"
      | "minutesIncluded"
      | "nextBillingDate"
    >
  >
) {
  const store = getStore();
  const idx = store.clients.findIndex((c) => c.id === clientId);
  if (idx < 0) return null;
  const current = store.clients[idx];
  const nextPlanId = patch.planId || current.planId;
  const plan = planOf(nextPlanId);
  const updated: Client = {
    ...current,
    ...patch,
    planId: nextPlanId,
    minutesIncluded: patch.minutesIncluded ?? (patch.planId ? plan.includedMinutes : current.minutesIncluded),
    updatedAt: new Date().toISOString(),
  };
  store.clients[idx] = updated;
  return updated;
}

export function upsertClientAgent(
  clientId: string,
  patch: Partial<Omit<Agent, "id" | "clientId">> & { name?: string }
) {
  const store = getStore();
  const idx = store.agents.findIndex((a) => a.clientId === clientId);
  const now = new Date().toISOString();
  if (idx < 0) {
    const created: Agent = {
      id: randomUUID(),
      clientId,
      name: patch.name || "Front Desk",
      xaiAgentId: patch.xaiAgentId || "",
      phoneNumber: patch.phoneNumber || "",
      voice: patch.voice || "ara",
      systemPrompt: patch.systemPrompt || "",
      greetingScript: patch.greetingScript || "",
      status: patch.status || "draft",
      languages: patch.languages || ["English"],
      updatedAt: now,
    };
    store.agents.push(created);
    return created;
  }
  const current = store.agents[idx];
  const updated: Agent = {
    ...current,
    ...patch,
    name: patch.name ?? current.name,
    updatedAt: now,
  };
  store.agents[idx] = updated;
  return updated;
}

export function createLead(input: {
  clientId: string;
  name: string;
  phone: string;
  email?: string | null;
  topic?: string;
  preferredCallbackTime?: string | null;
  consent?: boolean;
  source?: Lead["source"];
}) {
  const store = getStore();
  const lead: Lead = {
    id: randomUUID(),
    clientId: input.clientId,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    topic: input.topic ?? "General inquiry",
    preferredCallbackTime: input.preferredCallbackTime ?? null,
    consent: Boolean(input.consent),
    source: input.source ?? "phone_call",
    status: "new",
    createdAt: new Date().toISOString(),
  };
  store.leads.unshift(lead);
  return lead;
}

export function recordCall(input: Omit<CallRecord, "id">) {
  const store = getStore();
  const call: CallRecord = { id: randomUUID(), ...input };
  store.calls.unshift(call);
  const client = store.clients.find((c) => c.id === input.clientId);
  if (client && input.durationSeconds) {
    client.minutesUsed += Math.max(1, Math.round(input.durationSeconds / 60));
    client.updatedAt = new Date().toISOString();
  }
  return call;
}

export function findClientIdByPhone(toNumber: string) {
  const normalized = toNumber.replace(/\s+/g, "");
  const agent = getStore().agents.find((a) => a.phoneNumber.replace(/\s+/g, "") === normalized);
  return agent?.clientId || null;
}

export function markInvoicePaid(invoiceId: string) {
  const store = getStore();
  const inv = store.invoices.find((i) => i.id === invoiceId);
  if (!inv) return null;
  inv.status = "paid";
  inv.paidAt = new Date().toISOString();
  const client = store.clients.find((c) => c.id === inv.clientId);
  if (client && client.billingStatus === "past_due") {
    client.billingStatus = "active";
    client.updatedAt = new Date().toISOString();
  }
  return inv;
}

export function setClientBilling(clientId: string, billingStatus: BillingStatus, status?: ClientStatus) {
  return updateClient(clientId, {
    billingStatus,
    ...(status ? { status } : {}),
  });
}
