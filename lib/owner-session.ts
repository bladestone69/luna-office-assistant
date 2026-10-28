import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { workBriefForClient } from "@/lib/desk-context";
import { addClientBooking, addClientJob } from "@/lib/client-desk";
import { defaultPromptBody, getGrokSetup } from "@/lib/grok-setup";
import { practiceBriefFor } from "@/lib/practice";

export async function mintOwnerSession(clientId: string, ownerName: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("Grok is not connected yet.");
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new Error("Client not found");

  const setup = await getGrokSetup(clientId);
  const prompt = (await defaultPromptBody(clientId, "session")) ||
    "Help the owner run the business. Talk about the diary, callbacks, and what the phone agent should say to clients.";
  const work = await workBriefForClient(clientId);
  const practice = await practiceBriefFor(clientId);
  const nowLabel = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const instructions = [
    "This is a private web voice session, not a phone call.",
    `You are speaking with the owner, ${ownerName}, of ${client.name}.`,
    "The owner is not a client and not a caller. Address them as the owner.",
    prompt,
    `Opening: greet ${ownerName} by name and wait for what they need.`,
    work,
    practice,
    `Now in Johannesburg: ${nowLabel}.`,
    "Diary rule: talking does not save an appointment. The diary changes only when you call book_appointment and the result says saved true.",
    "Once the owner confirms who it is for, the visit type, and the day and time, call book_appointment immediately. Do not ask them to confirm again.",
    "meeting_type must be one of the visit types in the practice setup. The visit type sets the length. Put the practice-question answers in the answers field.",
    "Pass date as YYYY-MM-DD and time as HH:mm, 24 hour, Africa/Johannesburg. Any time of day or night is allowed.",
    "If the owner wants a person called at a time, call schedule_call with the phone number, the day, the time, and the instruction. That is what makes Grok dial.",
    "If the tool result says saved false, tell the owner the exact reason and do not say it was saved.",
    "Only say the appointment is on the diary when saved is true.",
  ].join("\n");

  const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { seconds: 300 },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.value) {
    throw new Error(payload?.error?.message || payload?.error || "Could not open a voice session");
  }

  return {
    token: String(payload.value),
    voice: setup.voice || "eve",
    instructions,
    ownerName,
    businessName: client.name,
  };
}

export async function runOwnerTool(clientId: string, name: string, args: Record<string, unknown>) {
  if (name === "add_job") {
    const result = await addClientJob(clientId, {
      title: String(args.title || ""),
      details: String(args.details || ""),
      phone: String(args.phone || ""),
    });
    return { ok: true, jobId: result.id };
  }
  if (name === "book_appointment") {
    const id = await addClientBooking(clientId, {
      name: String(args.name || args.person || ""),
      phone: String(args.phone || ""),
      email: String(args.email || ""),
      meetingType: String(args.meeting_type || args.meetingType || args.service || "Appointment"),
      start: String(args.start || args.start_iso || args.datetime || ""),
      date: String(args.date || args.day || ""),
      time: String(args.time || ""),
      notes: String(args.notes || ""),
      answers: String(args.answers || ""),
      minutes: Number(args.minutes || args.duration_minutes || args.duration),
    });
    return {
      ok: true,
      saved: true,
      bookingId: id,
      message: "SAVED. The appointment is on the diary. Tell the owner it is saved.",
    };
  }
  if (name === "schedule_call") {
    const who = String(args.name || "them");
    const phone = String(args.phone || "");
    const date = String(args.date || "");
    const time = String(args.time || "");
    const instruction = String(args.instruction || args.details || "");
    const dueAt = date && time ? `${date}T${time}` : String(args.due_at || "");
    const result = await addClientJob(clientId, {
      title: `Call ${who}`,
      details: instruction,
      phone,
      dueAt,
      placeCall: true,
    });
    return {
      ok: true,
      saved: true,
      jobId: result.id,
      message: "SAVED. Grok will call that number at that time and follow the instruction.",
    };
  }
  return { ok: false, error: "Unknown tool" };
}
