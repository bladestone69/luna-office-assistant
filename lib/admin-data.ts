import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calls, clientUsers, clients, humeAgents, leads, phoneNumbers } from "@/db/schema";

function formatDate(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function dayKey(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export type AdminClientSummary = {
  id: string;
  name: string;
  industry: string;
  plan: "starter" | "pro";
  status: "active" | "inactive" | "trial";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;
  HumeAgentCount: number;
  phoneNumberCount: number;
  totalCalls: number;
  callsToday: number;
  newLeadsToday: number;
  createdAt: string;
};

export async function listAdminClients(): Promise<AdminClientSummary[]> {
  const [clientRows, agentRows, numberRows, callRows, leadRows] = await Promise.all([
    db.select().from(clients),
    db.select().from(humeAgents),
    db.select().from(phoneNumbers),
    db.select().from(calls),
    db.select().from(leads),
  ]);

  const today = dayKey(new Date());

  return clientRows
    .map((client) => {
      const plan: AdminClientSummary["plan"] = client.plan === "pro" ? "pro" : "starter";
      const status: AdminClientSummary["status"] =
        client.status === "active"
          ? "active"
          : client.status === "churned"
            ? "inactive"
            : "trial";

      return {
        id: client.id,
        name: client.name,
        industry: client.industry ?? "",
        plan,
        status,
        contactName: "",
        contactEmail: client.email,
        contactPhone: client.phone ?? "",
        timezone: "Africa/Johannesburg",
        HumeAgentCount: agentRows.filter((agent) => agent.clientId === client.id).length,
        phoneNumberCount: numberRows.filter((number) => number.clientId === client.id).length,
        totalCalls: callRows.filter((call) => call.clientId === client.id).length,
        callsToday: callRows.filter(
          (call) => call.clientId === client.id && dayKey(call.startedAt) === today
        ).length,
        newLeadsToday: leadRows.filter(
          (lead) => lead.clientId === client.id && dayKey(lead.createdAt) === today
        ).length,
        createdAt: formatDate(client.createdAt),
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getAdminClientSummary(clientId: string) {
  const clientsList = await listAdminClients();
  return clientsList.find((client) => client.id === clientId) ?? null;
}

export async function listClientHumeAgents(clientId: string) {
  const rows = await db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId));

  return rows.map((agent) => ({
    id: agent.id,
    clientId: agent.clientId,
    name: agent.name,
    configId: agent.humeConfigId,
    greetingScript: agent.greetingScript ?? "",
    systemPrompt: agent.systemPrompt ?? "",
    status: "active" as const,
  }));
}

export async function listClientPhoneNumbers(clientId: string) {
  const rows = await db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, clientId));

  return rows.map((number) => ({
    id: number.id,
    clientId: number.clientId,
    number: number.number,
    agentId: number.humeAgentId ?? "",
    isPrimary: (number.label ?? "").toLowerCase() === "primary",
    voiceEnabled: Boolean(number.isActive),
    smsEnabled: false,
    status: number.isActive ? ("active" as const) : ("inactive" as const),
  }));
}

function defaultUserNameFromEmail(email: string) {
  const base = email.split("@")[0] ?? "client user";
  return base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function listClientUsers(clientId: string) {
  const rows = await db.select().from(clientUsers).where(eq(clientUsers.clientId, clientId));

  return rows.map((user) => ({
    id: user.id,
    clientId: user.clientId,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? ("owner" as const) : ("member" as const),
  }));
}

export async function createClientUser(input: {
  clientId: string;
  email: string;
  passwordHash: string;
}) {
  const [user] = await db
    .insert(clientUsers)
    .values({
      clientId: input.clientId,
      email: input.email.toLowerCase(),
      name: defaultUserNameFromEmail(input.email),
      passwordHash: input.passwordHash,
      role: "agent",
    })
    .returning();

  return {
    id: user.id,
    clientId: user.clientId,
    name: user.name,
    email: user.email,
    role: "member" as const,
  };
}
