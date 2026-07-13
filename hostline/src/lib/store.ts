import { randomUUID } from "crypto";
import type { Agent, CallRecord, DeskSnapshot, Lead } from "./types";

type StoreShape = {
  agent: Agent | null;
  leads: Lead[];
  calls: CallRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __hostlineStore?: StoreShape;
};

function seed(): StoreShape {
  const now = new Date().toISOString();
  return {
    agent: {
      id: "agent_seed",
      name: "Front Desk",
      xaiAgentId: process.env.XAI_AGENT_ID?.trim() || "",
      phoneNumber: process.env.XAI_PHONE_NUMBER?.trim() || "",
      voice: "ara",
      systemPrompt:
        "You are Hostline, the front-desk voice for a South African small business. Greet callers warmly. Qualify the reason for the call. Capture name, phone, and preferred callback time. Offer to book a meeting when appropriate. Speak clear English and switch to Afrikaans, Zulu, or Xhosa when the caller prefers. Keep answers short. When you have a lead, call the create_lead tool.",
      status: process.env.XAI_AGENT_ID ? "live" : "draft",
      languages: ["English", "Afrikaans", "Zulu", "Xhosa"],
      updatedAt: now,
    },
    leads: [
      {
        id: "lead_demo_1",
        name: "Thandi Mokoena",
        phone: "+27821234567",
        email: "thandi@example.co.za",
        topic: "New patient booking",
        preferredCallbackTime: "Tomorrow morning",
        consent: true,
        source: "phone_call",
        status: "new",
        createdAt: now,
      },
    ],
    calls: [
      {
        id: "call_demo_1",
        direction: "inbound",
        fromNumber: "+27821234567",
        toNumber: process.env.XAI_PHONE_NUMBER?.trim() || "+27000000000",
        durationSeconds: 184,
        outcome: "completed",
        summary: "Caller asked about opening hours and left a callback request.",
        transcript: null,
        startedAt: now,
        endedAt: now,
      },
    ],
  };
}

function getStore(): StoreShape {
  if (!globalStore.__hostlineStore) {
    globalStore.__hostlineStore = seed();
  }
  return globalStore.__hostlineStore;
}

export function getDeskSnapshot(): DeskSnapshot {
  const store = getStore();
  return {
    agent: store.agent,
    leads: [...store.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    calls: [...store.calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    setup: {
      hasXaiKey: Boolean(process.env.XAI_API_KEY?.trim()),
      hasAgentId: Boolean(process.env.XAI_AGENT_ID?.trim() || store.agent?.xaiAgentId),
      hasWebhookSecret: Boolean(process.env.XAI_WEBHOOK_SECRET?.trim()),
      phoneNumber: process.env.XAI_PHONE_NUMBER?.trim() || store.agent?.phoneNumber || null,
    },
  };
}

export function upsertAgent(patch: Partial<Agent> & Pick<Agent, "name">): Agent {
  const store = getStore();
  const now = new Date().toISOString();
  const next: Agent = {
    id: store.agent?.id ?? randomUUID(),
    name: patch.name,
    xaiAgentId: patch.xaiAgentId ?? store.agent?.xaiAgentId ?? "",
    phoneNumber: patch.phoneNumber ?? store.agent?.phoneNumber ?? "",
    voice: patch.voice ?? store.agent?.voice ?? "ara",
    systemPrompt: patch.systemPrompt ?? store.agent?.systemPrompt ?? "",
    status: patch.status ?? store.agent?.status ?? "draft",
    languages: patch.languages ?? store.agent?.languages ?? ["English"],
    updatedAt: now,
  };
  store.agent = next;
  return next;
}

export function createLead(input: {
  name: string;
  phone: string;
  email?: string | null;
  topic?: string;
  preferredCallbackTime?: string | null;
  consent?: boolean;
  source?: Lead["source"];
}): Lead {
  const store = getStore();
  const lead: Lead = {
    id: randomUUID(),
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

export function recordCall(input: Omit<CallRecord, "id">): CallRecord {
  const store = getStore();
  const call: CallRecord = { id: randomUUID(), ...input };
  store.calls.unshift(call);
  return call;
}
