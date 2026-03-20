import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { contacts } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CreateContact {
  clientId: string;
  name?: string;
  phoneE164: string;
  email?: string;
  company?: string;
  notes?: string;
}

// ─── Contact Service ─────────────────────────────────────────────────────────
export async function upsertContact(data: CreateContact) {
  const existing = await db.select().from(contacts)
    .where(and(eq(contacts.clientId, data.clientId), eq(contacts.phoneE164, data.phoneE164)))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db.update(contacts)
      .set({ name: data.name ?? existing[0].name, email: data.email ?? existing[0].email, updatedAt: new Date() })
      .where(eq(contacts.id, existing[0].id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(contacts).values({
    clientId: data.clientId,
    name: data.name ?? null,
    phoneE164: data.phoneE164,
    email: data.email ?? null,
    company: data.company ?? null,
    notes: data.notes ?? null,
  }).returning();
  return inserted;
}
