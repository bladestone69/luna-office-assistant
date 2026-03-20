import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { leads } from "@/db/schema";
import type { NewLead } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CreateLead {
  clientId: string;
  contactId?: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  topic?: string;
  preferredCallbackTime?: string | null;
  consent?: boolean;
  source?: "phone_call" | "web" | "referral" | "manual";
  status?: "new" | "contacted" | "qualified" | "converted" | "lost";
  chatGroupId?: string | null;
  notes?: string;
}

// ─── Lead Service ────────────────────────────────────────────────────────────
export async function createLead(data: CreateLead) {
  const [lead] = await db.insert(leads).values({
    clientId: data.clientId,
    contactId: data.contactId ?? null,
    name: data.name ?? null,
    phone: data.phone,
    email: data.email ?? null,
    topic: data.topic ?? "General inquiry",
    status: data.status ?? "new",
    source: data.source ?? "web",
    chatGroupId: data.chatGroupId ?? null,
    notes: data.notes ?? null,
  }).returning();
  return lead;
}

export async function updateLead(id: string, patch: Partial<NewLead>) {
  const [updated] = await db.update(leads)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return updated;
}

export async function getLeadByChatGroupId(clientId: string, chatGroupId: string) {
  const rows = await db.select().from(leads)
    .where(and(eq(leads.clientId, clientId), eq(leads.chatGroupId, chatGroupId)))
    .limit(1);
  return rows[0] ?? null;
}
