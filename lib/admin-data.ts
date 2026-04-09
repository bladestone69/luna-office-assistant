import "server-only";

import {
  calls,
  clientUsers,
  clients,
  contacts,
  humeAgents,
  leads,
  phoneNumbers,
  tasks,
} from "@/db/schema";
import { db } from "@/db";
import type {
  AdminCall,
  AdminClientDetail,
  AdminContact,
  AdminGlobalLead,
  AdminLead,
  AdminTask,
  Client,
  ClientUser,
  HumeAgent,
  PhoneNumber,
} from "@/app/admin/types";
import { desc, eq } from "drizzle-orm";

const DEFAULT_TIMEZONE = "Africa/Johannesburg";

function toDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function toDateString(value: Date | null | undefined) {
  if (!value) {
    return "";
  }
  return value.toISOString().slice(0, 10);
}

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function deriveContactName(
  clientRow: typeof clients.$inferSelect,
  userRows: typeof clientUsers.$inferSelect[],
) {
  const owner = userRows.find((user) => user.role === "admin");
  return owner?.name || clientRow.name;
}

function mapUserRole(role: string | null | undefined): ClientUser["role"] {
  return role === "admin" ? "owner" : "member";
}

function mapAgent(row: typeof humeAgents.$inferSelect): HumeAgent {
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    configId: row.humeConfigId,
    greetingScript: row.greetingScript ?? "",
    systemPrompt: row.systemPrompt ?? "",
    status: "active",
  };
}

function mapPhoneNumber(row: typeof phoneNumbers.$inferSelect): PhoneNumber {
  return {
    id: row.id,
    clientId: row.clientId,
    number: row.number,
    agentId: row.humeAgentId ?? "",
    isPrimary: row.label === "primary",
    voiceEnabled: true,
    smsEnabled: false,
    status: row.isActive ? "active" : "inactive",
  };
}

function mapClientUser(row: typeof clientUsers.$inferSelect): ClientUser {
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    email: row.email,
    role: mapUserRole(row.role),
  };
}

function parseLeadNotes(rawNotes: string | null | undefined) {
  const parsed = {
    company: "",
    industry: "",
    preferredCallbackTime: "",
    message: "",
  };

  if (!rawNotes) {
    return parsed;
  }

  const extraLines: string[] = [];

  for (const line of rawNotes.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
    if (line.startsWith("Company: ")) {
      parsed.company = line.slice("Company: ".length).trim();
      continue;
    }

    if (line.startsWith("Industry: ")) {
      parsed.industry = line.slice("Industry: ".length).trim();
      continue;
    }

    if (line.startsWith("Preferred callback: ")) {
      parsed.preferredCallbackTime = line.slice("Preferred callback: ".length).trim();
      continue;
    }

    if (line.startsWith("Message: ")) {
      parsed.message = line.slice("Message: ".length).trim();
      continue;
    }

    extraLines.push(line);
  }

  if (!parsed.message && extraLines.length) {
    parsed.message = extraLines.join(" ");
  }

  return parsed;
}

function parseTranscript(
  rawTranscript: string | null,
): { speaker: string; text: string }[] {
  if (!rawTranscript) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTranscript);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const speaker =
          typeof item.speaker === "string"
            ? item.speaker
            : typeof item.role === "string"
              ? item.role
              : "caller";
        const text =
          typeof item.text === "string"
            ? item.text
            : typeof item.message === "string"
              ? item.message
              : "";

        if (!text) {
          return null;
        }

        return { speaker, text };
      })
      .filter((item): item is { speaker: string; text: string } => Boolean(item));
  } catch {
    return [];
  }
}

function buildClientSummary(
  clientRow: typeof clients.$inferSelect,
  agentRows: typeof humeAgents.$inferSelect[],
  numberRows: typeof phoneNumbers.$inferSelect[],
  userRows: typeof clientUsers.$inferSelect[],
  callRows: typeof calls.$inferSelect[],
  leadRows: typeof leads.$inferSelect[],
): Client {
  const todayKey = toDateKey(new Date());
  const totalCalls = callRows.length;
  const callsToday = callRows.filter((row) => toDateKey(row.startedAt) === todayKey).length;
  const newLeadsToday = leadRows.filter((row) => toDateKey(row.createdAt) === todayKey).length;

  return {
    id: clientRow.id,
    name: clientRow.name,
    industry: clientRow.industry ?? "General",
    plan: clientRow.plan === "pro" ? "pro" : "starter",
    status: clientRow.status ?? "active",
    contactName: deriveContactName(clientRow, userRows),
    contactEmail: clientRow.email,
    contactPhone: clientRow.phone ?? "",
    timezone: DEFAULT_TIMEZONE,
    HumeAgentCount: agentRows.length,
    phoneNumberCount: numberRows.length,
    totalCalls,
    callsToday,
    newLeadsToday,
    createdAt: toDateString(clientRow.createdAt),
  };
}

export async function listAdminClients(): Promise<Client[]> {
  const [clientRows, agentRows, numberRows, userRows, callRows, leadRows] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select().from(humeAgents),
    db.select().from(phoneNumbers),
    db.select().from(clientUsers),
    db.select().from(calls),
    db.select().from(leads),
  ]);

  return clientRows.map((clientRow) =>
    buildClientSummary(
      clientRow,
      agentRows.filter((row) => row.clientId === clientRow.id),
      numberRows.filter((row) => row.clientId === clientRow.id),
      userRows.filter((row) => row.clientId === clientRow.id),
      callRows.filter((row) => row.clientId === clientRow.id),
      leadRows.filter((row) => row.clientId === clientRow.id),
    ),
  );
}

export async function listAdminLeads(): Promise<AdminGlobalLead[]> {
  const [leadRows, clientRows] = await Promise.all([
    db.select().from(leads).orderBy(desc(leads.createdAt)),
    db.select().from(clients),
  ]);

  const clientNames = new Map(clientRows.map((row) => [row.id, row.name]));

  return leadRows.map((row) => {
    const details = parseLeadNotes(row.notes);

    return {
      id: row.id,
      name: row.name || row.email || row.phone,
      phone: row.phone,
      email: row.email ?? "",
      topic: row.topic,
      status: row.status ?? "new",
      source: row.source ?? "web",
      company: details.company,
      industry: details.industry,
      preferredCallbackTime: details.preferredCallbackTime,
      message: details.message,
      clientName: row.clientId ? clientNames.get(row.clientId) ?? "" : "",
      createdAt: toIsoString(row.createdAt),
    };
  });
}

export async function getAdminClientDetail(clientId: string): Promise<AdminClientDetail | null> {
  const [clientRow] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

  if (!clientRow) {
    return null;
  }

  const [agentRows, numberRows, userRows, contactRows, leadRows, callRows, taskRows] = await Promise.all([
    db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId)).orderBy(desc(humeAgents.createdAt)),
    db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, clientId)).orderBy(desc(phoneNumbers.createdAt)),
    db.select().from(clientUsers).where(eq(clientUsers.clientId, clientId)).orderBy(desc(clientUsers.createdAt)),
    db.select().from(contacts).where(eq(contacts.clientId, clientId)).orderBy(desc(contacts.updatedAt)),
    db.select().from(leads).where(eq(leads.clientId, clientId)).orderBy(desc(leads.createdAt)),
    db.select().from(calls).where(eq(calls.clientId, clientId)).orderBy(desc(calls.startedAt)),
    db.select().from(tasks).where(eq(tasks.clientId, clientId)).orderBy(desc(tasks.createdAt)),
  ]);

  const contactsById = new Map(contactRows.map((row) => [row.id, row]));

  const mappedContacts: AdminContact[] = contactRows.map((row) => ({
    id: row.id,
    fullName: row.name || row.email || row.phoneE164,
    phoneE164: row.phoneE164,
    email: row.email ?? "",
    source: row.company ?? "Manual",
    lastSeenAt: toIsoString(row.updatedAt || row.createdAt),
  }));

  const mappedLeads: AdminLead[] = leadRows.map((row) => {
    const details = parseLeadNotes(row.notes);

    return {
      id: row.id,
      name: row.name || row.email || row.phone,
      phone: row.phone,
      topic: row.topic,
      preferredCallbackTime: details.preferredCallbackTime,
      status: row.status ?? "new",
      createdAt: toIsoString(row.createdAt),
    };
  });

  const mappedCalls: AdminCall[] = callRows.map((row) => {
    const relatedContact = row.contactId ? contactsById.get(row.contactId) : undefined;
    const transcriptLines = parseTranscript(row.transcript ?? null);
    const summary =
      transcriptLines.length > 0 ? transcriptLines.map((line) => line.text).join(" ").slice(0, 180) : null;

    return {
      id: row.id,
      direction: row.direction,
      contactName: relatedContact?.name || relatedContact?.email || "Unknown",
      contactPhone: relatedContact?.phoneE164 || "",
      durationSeconds: row.durationSeconds ?? 0,
      startedAt: toIsoString(row.startedAt),
      outcome: row.outcome ?? "completed",
      summary,
      hasTranscript: transcriptLines.length > 0,
      transcriptLines,
    };
  });

  const mappedTasks: AdminTask[] = taskRows.map((row) => ({
    id: row.id,
    taskType: row.title,
    status: row.status ?? "pending",
    dueAt: row.dueAt ? toDateString(row.dueAt) : "",
    notes: row.description ?? "",
  }));

  return {
    client: buildClientSummary(clientRow, agentRows, numberRows, userRows, callRows, leadRows),
    humeAgents: agentRows.map(mapAgent),
    phoneNumbers: numberRows.map(mapPhoneNumber),
    clientUsers: userRows.map(mapClientUser),
    contacts: mappedContacts,
    leads: mappedLeads,
    calls: mappedCalls,
    tasks: mappedTasks,
  };
}
