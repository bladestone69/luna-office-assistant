export interface Client {
  id: string;
  name: string;
  industry: string;
  plan: "starter" | "pro";
  status: "active" | "inactive" | "trial";
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
