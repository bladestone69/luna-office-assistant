import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { workBriefForClient } from "@/lib/desk-context";
import { addClientBooking, addClientJob } from "@/lib/client-desk";
import { defaultPromptBody, getGrokSetup } from "@/lib/grok-setup";

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
  const instructions = [
    "This is a private web voice session, not a phone call.",
    `You are speaking with the owner, ${ownerName}, of ${client.name}.`,
    "The owner is not a client and not a caller. Address them as the owner.",
    prompt,
    `Opening: greet ${ownerName} by name and wait for what they need.`,
    work,
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
      name: String(args.name || ""),
      phone: String(args.phone || ""),
      email: String(args.email || ""),
      meetingType: String(args.meeting_type || "Appointment"),
      start: String(args.start || ""),
      notes: String(args.notes || ""),
      minutes: Number(args.minutes),
    });
    return { ok: true, bookingId: id };
  }
  return { ok: false, error: "Unknown tool" };
}
