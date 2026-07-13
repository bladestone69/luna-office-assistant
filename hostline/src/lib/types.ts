export type AgentStatus = "draft" | "live" | "paused";

export interface Agent {
  id: string;
  name: string;
  xaiAgentId: string;
  phoneNumber: string;
  voice: string;
  systemPrompt: string;
  status: AgentStatus;
  languages: string[];
  updatedAt: string;
}

export interface Lead {
  id: string;
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

export interface DeskSnapshot {
  agent: Agent | null;
  leads: Lead[];
  calls: CallRecord[];
  setup: {
    hasXaiKey: boolean;
    hasAgentId: boolean;
    hasWebhookSecret: boolean;
    phoneNumber: string | null;
  };
}
