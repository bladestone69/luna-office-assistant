import "server-only";

import { and, desc, eq, gt, lt } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, calls, clientUsers, clients, contacts, humeAgents, leads, phoneNumbers, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";
import { workBriefForClient } from "@/lib/desk-context";
import { placeOutboundCall } from "@/lib/place-call";
import { normalizePhone } from "@/lib/grok-call";

const VOICES = ["eve", "ara", "rex", "sal"] as const;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function whenLabel(value: Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function transcriptLines(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 8).map((line) => ({
      speaker: String(line?.speaker || "Caller"),
      text: String(line?.text || "").slice(0, 400),
    }));
  } catch {
    return [];
  }
}

export async function loadClientDesk(clientId: string, userId: string) {
  const [clientRow] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const [userRow] = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.id, userId), eq(clientUsers.clientId, clientId)))
    .limit(1);
  if (!clientRow || !userRow) return null;

  const [agentRows, numberRows, leadRows, callRows, bookingRows, jobRows] = await Promise.all([
    db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId)).orderBy(desc(humeAgents.createdAt)),
    db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, clientId)).orderBy(desc(phoneNumbers.createdAt)),
    db.select().from(leads).where(eq(leads.clientId, clientId)).orderBy(desc(leads.createdAt)).limit(40),
    db.select().from(calls).where(eq(calls.clientId, clientId)).orderBy(desc(calls.startedAt)).limit(30),
    db.select().from(bookings).where(eq(bookings.clientId, clientId)).orderBy(desc(bookings.startDateTime)).limit(60),
    db.select().from(tasks).where(eq(tasks.clientId, clientId)).orderBy(desc(tasks.createdAt)).limit(40),
  ]);

  const contactIds = [...new Set(callRows.map((row) => row.contactId).filter((value): value is string => Boolean(value)))];
  const contactRows = contactIds.length
    ? await db.select().from(contacts).where(eq(contacts.clientId, clientId))
    : [];
  const contactsById = new Map(contactRows.map((row) => [row.id, row]));
  const agent = agentRows.find((row) => row.voiceProvider !== "hume") || agentRows[0] || null;
  const line = numberRows[0]?.number || "";
  const now = Date.now();

  return {
    user: { id: userRow.id, name: userRow.name, email: userRow.email, role: userRow.role || "agent" },
    client: {
      id: clientRow.id,
      name: clientRow.name,
      email: clientRow.email,
      phone: clientRow.phone || "",
      plan: clientRow.plan || "starter",
      industry: clientRow.industry || "",
    },
    line: {
      number: line,
      voice: agent?.grokVoice || "eve",
      greeting: agent?.greetingScript || "",
      instructions: agent?.grokInstructions || agent?.systemPrompt || "",
      provider: agent?.voiceProvider === "hume" ? "hume" : "grok",
      grokReady: Boolean(process.env.XAI_API_KEY),
      phoneReady: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (line || process.env.TWILIO_PHONE_NUMBER)),
    },
    bookings: bookingRows.map((row) => ({
      id: row.id,
      name: row.name || "Appointment",
      phone: row.phone || "",
      email: row.email || "",
      meetingType: row.meetingType,
      title: row.title || row.meetingType,
      start: iso(row.startDateTime),
      end: iso(row.endDateTime),
      when: whenLabel(row.startDateTime),
      status: row.status || "confirmed",
      notes: row.notes || "",
    })),
    messages: leadRows.map((row) => ({
      id: row.id,
      name: row.name || "Unknown",
      phone: row.phone,
      email: row.email || "",
      topic: row.topic,
      notes: row.notes || "",
      status: row.status || "new",
      source: row.source || "web",
      when: whenLabel(row.createdAt),
    })),
    calls: callRows.map((row) => {
      const contact = row.contactId ? contactsById.get(row.contactId) : null;
      return {
        id: row.id,
        name: contact?.name || "Unknown caller",
        number: contact?.phoneE164 || "",
        direction: row.direction,
        outcome: row.outcome || "unknown",
        durationSeconds: row.durationSeconds || 0,
        when: whenLabel(row.startedAt),
        startedAt: iso(row.startedAt),
        transcript: transcriptLines(row.transcript),
      };
    }),
    jobs: jobRows.map((row) => ({
      id: row.id,
      title: row.title,
      details: row.description || "",
      status: row.status || "pending",
      when: whenLabel(row.dueAt || row.createdAt),
      dueAt: iso(row.dueAt),
      open: row.status !== "done",
    })),
    upcomingCount: bookingRows.filter((row) => row.status === "confirmed" && row.startDateTime.getTime() >= now).length,
    work: await workBriefForClient(clientId),
  };
}

export async function saveClientBrief(clientId: string, input: { instructions: string; greeting: string; voice: string }) {
  const voice = VOICES.includes(input.voice as (typeof VOICES)[number]) ? input.voice : "eve";
  const instructions = input.instructions.trim().slice(0, 4000);
  const greeting = input.greeting.trim().slice(0, 500);
  const [existing] = await db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId)).orderBy(desc(humeAgents.createdAt)).limit(1);

  if (existing) {
    await db
      .update(humeAgents)
      .set({
        voiceProvider: "grok",
        grokVoice: voice,
        grokInstructions: instructions || null,
        greetingScript: greeting || null,
        systemPrompt: instructions || null,
        updatedAt: new Date(),
      })
      .where(eq(humeAgents.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(humeAgents)
    .values({
      clientId,
      name: "Grok receptionist",
      humeConfigId: "hume-backup",
      voiceProvider: "grok",
      grokVoice: voice,
      grokInstructions: instructions || null,
      greetingScript: greeting || null,
      systemPrompt: instructions || null,
    })
    .returning({ id: humeAgents.id });
  return created.id;
}

export async function addClientJob(
  clientId: string,
  input: { title: string; details: string; phone?: string; dueAt?: string | null; callNow?: boolean },
) {
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new Error("Tell Grok what the job is.");
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const details = [input.details.trim().slice(0, 2000), phone ? `Phone: ${phone}` : ""].filter(Boolean).join("\n");
  let dueAt: Date | null = null;
  if (input.dueAt) {
    const due = DateTime.fromISO(input.dueAt, { zone: APP_TIMEZONE });
    if (due.isValid) dueAt = due.toJSDate();
  }

  const [job] = await db
    .insert(tasks)
    .values({
      clientId,
      title,
      description: details || null,
      assignedTo: "Grok",
      status: "pending",
      dueAt,
    })
    .returning({ id: tasks.id });

  let call: { ok: boolean; error?: string; callSid?: string } | null = null;
  if (input.callNow && phone) {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    const [number] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, clientId)).limit(1);
    call = await placeOutboundCall({
      to: phone,
      from: number?.number || process.env.TWILIO_PHONE_NUMBER || "",
      greeting: input.details.trim() || `Hello, this is ${client?.name || "the office"}.`,
    });
    if (call.ok) {
      await db.update(tasks).set({ status: "in_progress", updatedAt: new Date() }).where(eq(tasks.id, job.id));
    }
  }

  return { id: job.id, call };
}

export async function setClientJobStatus(clientId: string, jobId: string, status: "pending" | "done") {
  const [job] = await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tasks.id, jobId), eq(tasks.clientId, clientId)))
    .returning({ id: tasks.id });
  return Boolean(job);
}

export async function addClientBooking(
  clientId: string,
  input: { name: string; phone: string; email?: string; meetingType: string; start: string; notes?: string; minutes?: number },
) {
  const start = DateTime.fromISO(input.start, { zone: APP_TIMEZONE });
  if (!start.isValid) throw new Error("Choose a valid time.");
  if (start.hour < 8 || start.hour >= 17) throw new Error("Bookings stay inside 08:00 to 17:00.");
  const minutes = [15, 30, 60].includes(Number(input.minutes)) ? Number(input.minutes) : 30;
  const end = start.plus({ minutes });
  if (end.hour > 17 || (end.hour === 17 && end.minute > 0)) throw new Error("That meeting runs past 17:00.");

  const clash = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.clientId, clientId),
        eq(bookings.status, "confirmed"),
        lt(bookings.startDateTime, end.toJSDate()),
        gt(bookings.endDateTime, start.toJSDate()),
      ),
    )
    .limit(1);
  if (clash[0]) throw new Error("That time is already booked.");

  const name = input.name.trim().slice(0, 120) || "Appointment";
  const [row] = await db
    .insert(bookings)
    .values({
      clientId,
      name,
      phone: input.phone.trim().slice(0, 40),
      email: input.email?.trim().slice(0, 160) || null,
      meetingType: input.meetingType.trim().slice(0, 80) || "Appointment",
      title: `${input.meetingType.trim() || "Appointment"} - ${name}`,
      startDateTime: start.toJSDate(),
      endDateTime: end.toJSDate(),
      status: "confirmed",
      notes: input.notes?.trim().slice(0, 1000) || null,
      consent: true,
    })
    .returning({ id: bookings.id });
  return row.id;
}

export async function cancelClientBooking(clientId: string, bookingId: string) {
  const [row] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, clientId)))
    .returning({ id: bookings.id });
  return Boolean(row);
}

export async function setClientMessageStatus(clientId: string, messageId: string, status: "new" | "contacted" | "converted" | "lost") {
  const [row] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(leads.id, messageId), eq(leads.clientId, clientId)))
    .returning({ id: leads.id });
  return Boolean(row);
}
