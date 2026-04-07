export interface Client {
  id: string;
  name: string;
  industry: string;
  plan: "starter" | "pro";
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  timezone?: string;
  HumeAgentCount: number;
  phoneNumberCount: number;
  totalCalls: number;
  callsToday: number;
  newLeadsToday: number;
  createdAt: string;
}

export interface HumeAgent {
  id: string;
  clientId: string;
  name: string;
  configId: string;
  greetingScript?: string;
  systemPrompt?: string;
  status: "active" | "paused";
}

export interface PhoneNumber {
  id: string;
  clientId: string;
  number: string;
  agentId: string;
  isPrimary: boolean;
  voiceEnabled: boolean;
  smsEnabled: boolean;
  status: "active" | "inactive";
}

export interface ClientUser {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface AdminContact {
  id: string;
  fullName: string;
  phoneE164: string;
  email: string;
  source: string;
  lastSeenAt: string;
}

export interface AdminLead {
  id: string;
  name: string;
  phone: string;
  topic: string;
  preferredCallbackTime: string;
  status: string;
  createdAt: string;
}

export interface AdminTranscriptLine {
  speaker: string;
  text: string;
}

export interface AdminCall {
  id: string;
  direction: string;
  contactName: string;
  contactPhone: string;
  durationSeconds: number;
  startedAt: string;
  outcome: string;
  summary: string | null;
  hasTranscript: boolean;
  transcriptLines: AdminTranscriptLine[];
}

export interface AdminTask {
  id: string;
  taskType: string;
  status: string;
  dueAt: string;
  notes: string;
}

export interface AdminClientDetail {
  client: Client;
  humeAgents: HumeAgent[];
  phoneNumbers: PhoneNumber[];
  clientUsers: ClientUser[];
  contacts: AdminContact[];
  leads: AdminLead[];
  calls: AdminCall[];
  tasks: AdminTask[];
}
