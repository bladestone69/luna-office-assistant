import "server-only";

import { and, desc, eq, gt, lt } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, calls, clientUsers, clients, contacts, humeAgents, leads, phoneNumbers, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";
import { workBriefForClient } from "@/lib/desk-context";
import { dropCallOrder } from "@/lib/call-orders";
import { dialTask } from "@/lib/due-calls";
import { normalizePhone } from "@/lib/grok-call";
import { getPractice } from "@/lib/practice";
import { matchVisit } from "@/lib/practice-presets";

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
      phoneReady: Boolean(line),
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
      answers: row.answers || "",
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
    practice: await getPractice(clientId),
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
    .set(status === "done" ? { status, placeCall: false, updatedAt: new Date() } : { status, updatedAt: new Date() })
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
    answers?: string;
    minutes?: number;
  },
) {
  const start = parseBookingStart(input);
  if (!start.isValid) throw new Error("Not saved. Give a day and a time, for example 2026-10-28 14:00.");
  const practice = await getPractice(clientId);
  const visit = matchVisit(practice, input.meetingType);
  const requested = Math.round(Number(input.minutes));
  const minutes = visit
    ? visit.minutes
    : Number.isFinite(requested) && requested >= 5 && requested <= 480
      ? requested
      : 30;
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
  const meetingType = visit?.name || input.meetingType.trim().slice(0, 80) || "Appointment";
  const [row] = await db
    .insert(bookings)
    .values({
      clientId,
      name,
      phone: input.phone.trim().slice(0, 40),
      email: input.email?.trim().slice(0, 160) || null,
      meetingType,
      title: `${meetingType} - ${name}`,
      startDateTime: start.toJSDate(),
      endDateTime: end.toJSDate(),
      status: "confirmed",
      notes: input.notes?.trim().slice(0, 1000) || null,
      answers: input.answers?.trim().slice(0, 2000) || null,
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

export async function changeClientDiary(
  clientId: string,
  input: {
    action?: string;
    what?: string;
    name?: string;
    phone?: string;
    date?: string;
    time?: string;
    newPhone?: string;
    newName?: string;
    newDate?: string;
    newTime?: string;
    newInstruction?: string;
    newMeetingType?: string;
  },
) {
  const action = input.action === "cancel" ? "cancel" : "change";
  const what = input.what === "appointment" || input.what === "call" ? input.what : "";
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const [bookingRows, jobRows] = await Promise.all([
    db.select().from(bookings).where(and(eq(bookings.clientId, clientId), eq(bookings.status, "confirmed"))),
    db.select().from(tasks).where(and(eq(tasks.clientId, clientId), eq(tasks.status, "pending"))),
  ]);

  const needleName = (input.name || "").trim().toLowerCase();
  const needlePhone = (input.phone || "").replace(/\D/g, "");
  const needleDay = input.date ? resolveDay(input.date, now) : "";

  function phoneScore(value: string | null | undefined) {
    const have = (value || "").replace(/\D/g, "");
    if (!needlePhone || !have) return 0;
    if (have.endsWith(needlePhone) || needlePhone.endsWith(have.slice(-Math.min(4, have.length)))) return 6;
    return 0;
  }

  function dayScore(value: Date | null | undefined) {
    if (!needleDay || !value) return 0;
    const day = DateTime.fromJSDate(value).setZone(APP_TIMEZONE).toISODate();
    return day === needleDay ? 4 : 0;
  }

  type Hit = { kind: "appointment" | "call"; id: string; score: number; label: string };
  const hits: Hit[] = [];

  if (what !== "call") {
    for (const row of bookingRows) {
      const name = (row.name || "").toLowerCase();
      let score = phoneScore(row.phone) + dayScore(row.startDateTime);
      if (needleName && name.includes(needleName)) score += 4;
      if (score > 0) {
        const when = DateTime.fromJSDate(row.startDateTime).setZone(APP_TIMEZONE).toFormat("ccc d LLL HH:mm");
        hits.push({ kind: "appointment", id: row.id, score, label: `${when} ${row.meetingType} ${row.name || ""} ${row.phone || ""}`.trim() });
      }
    }
  }

  if (what !== "appointment") {
    for (const row of jobRows) {
      const name = `${row.title} ${row.description || ""}`.toLowerCase();
      let score = phoneScore(row.callPhone) + dayScore(row.dueAt);
      if (needleName && name.includes(needleName)) score += 4;
      if (row.placeCall) score += 1;
      if (score > 0) {
        const when = row.dueAt ? DateTime.fromJSDate(row.dueAt).setZone(APP_TIMEZONE).toFormat("ccc d LLL HH:mm") : "no time";
        hits.push({ kind: "call", id: row.id, score, label: `${when} ${row.title} ${row.callPhone || ""}`.trim() });
      }
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const chosen = hits[0] && (hits.length === 1 || hits[0].score >= hits[1].score + 2) ? hits[0] : null;
  const onlyCall = !chosen && jobRows.filter((row) => row.placeCall).length === 1 && (what === "call" || Boolean(input.newPhone));
  const target = chosen || (onlyCall
    ? { kind: "call" as const, id: jobRows.find((row) => row.placeCall)!.id, score: 1, label: "the open call" }
    : null);

  if (!target) {
    const choices = hits.slice(0, 5).map((hit) => hit.label).join("; ");
    throw new Error(choices ? `Not changed. Say which one: ${choices}` : "Not changed. Nothing on the diary matched.");
  }

  if (target.kind === "appointment") {
    const row = bookingRows.find((item) => item.id === target.id)!;
    if (action === "cancel") {
      await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(bookings.id, row.id), eq(bookings.clientId, clientId)));
      return { ok: true, saved: true, message: `CANCELLED. ${row.name || "The appointment"} is off the diary.` };
    }
    const nextName = (input.newName || row.name || "Appointment").trim().slice(0, 120);
    const nextPhone = input.newPhone ? normalizePhone(input.newPhone) : row.phone || "";
    const visit = input.newMeetingType ? matchVisit(await getPractice(clientId), input.newMeetingType) : null;
    const minutes = visit ? visit.minutes : Math.max(5, Math.round((row.endDateTime.getTime() - row.startDateTime.getTime()) / 60000));
    let start = DateTime.fromJSDate(row.startDateTime).setZone(APP_TIMEZONE);
    if (input.newDate || input.newTime) {
      const moved = parseBookingStart({
        date: input.newDate || start.toISODate() || "",
        time: input.newTime || start.toFormat("HH:mm"),
      });
      if (!moved.isValid) throw new Error("Not changed. Give a day and a time.");
      start = moved;
    }
    const end = start.plus({ minutes });
    await db.update(bookings).set({
      name: nextName,
      phone: nextPhone,
      meetingType: visit?.name || input.newMeetingType || row.meetingType,
      title: `${visit?.name || row.meetingType} - ${nextName}`,
      startDateTime: start.toJSDate(),
      endDateTime: end.toJSDate(),
      updatedAt: new Date(),
    }).where(and(eq(bookings.id, row.id), eq(bookings.clientId, clientId)));
    return { ok: true, saved: true, message: `CHANGED. ${nextName} is now ${start.toFormat("ccc d LLL HH:mm")}${nextPhone ? ` on ${nextPhone}` : ""}.` };
  }

  const job = jobRows.find((item) => item.id === target.id)!;
  if (action === "cancel") {
    await db.update(tasks).set({ status: "done", placeCall: false, callError: "Cancelled by the owner.", updatedAt: new Date() }).where(and(eq(tasks.id, job.id), eq(tasks.clientId, clientId)));
    await dropCallOrder(job.id);
    return { ok: true, saved: true, message: `CANCELLED. Grok will not call ${job.callPhone || "that number"}.` };
  }
  const nextPhone = input.newPhone ? normalizePhone(input.newPhone) : job.callPhone || "";
  if (input.newPhone && !nextPhone) throw new Error("Not changed. That is not a phone number.");
  let dueAt = job.dueAt;
  if (input.newDate || input.newTime) {
    const current = job.dueAt ? DateTime.fromJSDate(job.dueAt).setZone(APP_TIMEZONE) : now;
    const moved = parseBookingStart({
      date: input.newDate || current.toISODate() || "",
      time: input.newTime || current.toFormat("HH:mm"),
    });
    if (!moved.isValid) throw new Error("Not changed. Give a day and a time.");
    dueAt = moved.toJSDate();
  }
  const instruction = (input.newInstruction || "").trim().slice(0, 2000);
  const description = [instruction || job.description || "", nextPhone ? `Phone: ${nextPhone}` : ""].filter(Boolean).join("\n").slice(0, 2000);
  await db.update(tasks).set({
    callPhone: nextPhone || null,
    description,
    dueAt,
    placeCall: Boolean(nextPhone && dueAt),
    callError: null,
    updatedAt: new Date(),
  }).where(and(eq(tasks.id, job.id), eq(tasks.clientId, clientId)));
  const when = dueAt ? DateTime.fromJSDate(dueAt).setZone(APP_TIMEZONE).toFormat("ccc d LLL HH:mm") : "the same time";
  return { ok: true, saved: true, message: `CHANGED. Grok will call ${nextPhone || "that number"} at ${when}.` };
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
