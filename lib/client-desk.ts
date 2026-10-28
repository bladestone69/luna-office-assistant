import "server-only";

import { and, desc, eq, gt, lt } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, calls, clientUsers, clients, contacts, humeAgents, leads, phoneNumbers, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";
import { workBriefForClient } from "@/lib/desk-context";
import { dialTask } from "@/lib/due-calls";
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
      phone: row.callPhone || "",
      placeCall: Boolean(row.placeCall),
      callError: row.callError || "",
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
  input: { title: string; details: string; phone?: string; dueAt?: string | null; callNow?: boolean; placeCall?: boolean },
) {
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new Error("Tell Grok what the job is.");
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const details = [input.details.trim().slice(0, 2000), phone ? `Phone: ${phone}` : ""].filter(Boolean).join("\n");
  let dueAt: Date | null = null;
  if (input.dueAt) {
    const due = DateTime.fromISO(input.dueAt.replace(" ", "T"), { zone: APP_TIMEZONE });
    if (due.isValid) dueAt = due.toJSDate();
  }
  const schedule = Boolean(input.placeCall && phone && dueAt && !input.callNow);

  const [job] = await db
    .insert(tasks)
    .values({
      clientId,
      title,
      description: details || null,
      assignedTo: "Grok",
      status: "pending",
      dueAt,
      callPhone: phone || null,
      placeCall: schedule,
    })
    .returning({ id: tasks.id });

  let call: { ok: boolean; error?: string; callSid?: string } | null = null;
  if (input.callNow && phone) {
    call = await dialTask(job.id);
  }

  return { id: job.id, call, scheduled: schedule };
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
  input: {
    name: string;
    phone: string;
    email?: string;
    meetingType: string;
    start: string;
    date?: string;
    time?: string;
    notes?: string;
    minutes?: number;
  },
) {
  const start = parseBookingStart(input);
  if (!start.isValid) throw new Error("Not saved. Give a day and a time, for example 2026-10-28 14:00.");
  const minutes = [15, 30, 60].includes(Number(input.minutes)) ? Number(input.minutes) : 30;
  const end = start.plus({ minutes });

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
  if (clash[0]) throw new Error("Not saved. That time is already booked.");

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

function parseBookingStart(input: { start?: string; date?: string; time?: string }) {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const dateText = (input.date || "").trim();
  const timeText = (input.time || "").trim();
  let raw = (input.start || "").trim();

  if (!raw && (dateText || timeText)) {
    raw = `${resolveDay(dateText, now)}T${clock(timeText || "09:00")}`;
  }

  const relative = raw.match(/^(today|tomorrow)(?:[ T,]+(.+))?$/i);
  if (relative) {
    const day = now.plus({ days: relative[1].toLowerCase() === "tomorrow" ? 1 : 0 }).toISODate();
    raw = `${day}T${clock(relative[2] || timeText || "09:00")}`;
  }

  const weekday = raw.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:[ T,]+(.+))?$/i);
  if (weekday) {
    const index = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(weekday[1].toLowerCase());
    const day = upcomingWeekday(now, index);
    raw = `${day.toISODate()}T${clock(weekday[2] || timeText || "09:00")}`;
  }

  raw = raw.replace(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}(?::\d{2}){0,2}\s*(?:am|pm)?)/i, (_, day, time) => `${day}T${clock(time)}`);

  let parsed = DateTime.fromISO(raw, { zone: APP_TIMEZONE });
  if (!parsed.isValid) {
    const formats = ["yyyy-MM-dd HH:mm", "yyyy-MM-dd h:mm a", "d MMMM yyyy HH:mm", "d MMM yyyy HH:mm", "d MMMM yyyy h:mm a"];
    for (const format of formats) {
      const attempt = DateTime.fromFormat(raw.replace("T", " "), format, { zone: APP_TIMEZONE });
      if (attempt.isValid) {
        parsed = attempt;
        break;
      }
    }
  }
  if (!parsed.isValid && (dateText || timeText)) {
    parsed = DateTime.fromISO(`${resolveDay(dateText, now)}T${clock(timeText || raw)}`, { zone: APP_TIMEZONE });
  }
  if (!parsed.isValid && /^(\d{1,2})(?::\d{2}){0,2}\s*(am|pm)?$/i.test(raw)) {
    parsed = DateTime.fromISO(`${now.toISODate()}T${clock(raw)}`, { zone: APP_TIMEZONE });
  }
  return parsed;
}

function upcomingWeekday(now: DateTime, index: number) {
  const weekday = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  let day = now.set({ weekday });
  if (day.startOf("day") < now.startOf("day")) day = day.plus({ weeks: 1 });
  return day;
}

function resolveDay(date: string, now: DateTime) {
  const lower = date.toLowerCase();
  if (!date || lower === "today") return now.toISODate();
  if (lower === "tomorrow") return now.plus({ days: 1 }).toISODate();
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const weekday = lower.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekday) {
    const index = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(weekday[1]);
    return upcomingWeekday(now, index).toISODate();
  }
  return date;
}

function clock(value: string) {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/);
  if (!match) return "09:00";
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  if (match[3] === "pm" && hour < 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;
  if (hour > 23) return "09:00";
  return `${String(hour).padStart(2, "0")}:${minute}`;
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
