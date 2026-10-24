export type PlanId = "starter" | "practice" | "firm";
export type BillingStatus = "trial" | "active" | "past_due" | "paused" | "churned";
export type AgentStatus = "draft" | "live" | "paused";
export type ClientStatus = "onboarding" | "live" | "paused" | "churned";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyZar: number;
  includedMinutes: number;
  overagePerMinuteZar: number;
  description: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  periodLabel: string;
  amountZar: number;
  status: "paid" | "due" | "overdue";
  issuedAt: string;
  paidAt: string | null;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  loginEmail: string;
  password: string;
  status: ClientStatus;
  planId: PlanId;
  billingStatus: BillingStatus;
  minutesUsed: number;
  minutesIncluded: number;
  nextBillingDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  clientId: string;
  name: string;
  xaiAgentId: string;
  phoneNumber: string;
  voice: string;
  systemPrompt: string;
  greetingScript: string;
  status: AgentStatus;
  languages: string[];
  updatedAt: string;
}

export interface Lead {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  preferredCallbackTime: string | null;
  consent: boolean;
  source: "phone_call" | "web" | "manual";
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  createdAt: string;
}

export interface CallRecord {
  id: string;
  clientId: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  durationSeconds: number | null;
  outcome: "completed" | "missed" | "voicemail" | "failed" | "in_progress";
  summary: string | null;
  transcript: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface PlatformSetup {
  hasXaiKey: boolean;
  hasWebhookSecret: boolean;
  webhookUrlHint: string;
}

export interface OwnerSnapshot {
  clients: Client[];
  agents: Agent[];
  leads: Lead[];
  calls: CallRecord[];
  invoices: Invoice[];
  plans: Plan[];
  platform: PlatformSetup;
  metrics: {
    liveClients: number;
    trialClients: number;
    mrrZar: number;
    minutesThisMonth: number;
    newLeads: number;
    callsToday: number;
  };
}

export interface ClientDeskSnapshot {
  client: Pick<Client, "id" | "name" | "industry" | "contactName" | "planId" | "status">;
  line: {
    status: "live" | "setting_up" | "paused";
    phoneNumber: string | null;
    voiceLabel: string;
    languages: string[];
  };
  today: {
    calls: number;
    newLeads: number;
    minutes: number;
  };
  leads: Lead[];
  calls: CallRecord[];
  plan: {
    name: string;
    minutesUsed: number;
    minutesIncluded: number;
    billingStatus: BillingStatus;
    nextBillingDate: string;
  };
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyZar: 1499,
    includedMinutes: 300,
    overagePerMinuteZar: 1.2,
    description: "Solo desks and quiet lines",
  },
  {
    id: "practice",
    name: "Practice",
    monthlyZar: 2999,
    includedMinutes: 800,
    overagePerMinuteZar: 1.0,
    description: "Busy practices and agencies",
  },
  {
    id: "firm",
    name: "Firm",
    monthlyZar: 5999,
    includedMinutes: 2000,
    overagePerMinuteZar: 0.8,
    description: "Multi-line firms and groups",
  },
];
