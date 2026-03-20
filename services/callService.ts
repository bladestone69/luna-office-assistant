import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { calls, leads, contacts, phoneNumbers, humeAgents } from "@/db/schema";
import { upsertContact } from "./contactService";

export interface CreateCall {
  clientId: string;
  contactId?: string;
  humeAgentId?: string;
  phoneNumberId?: string;
  direction: "inbound" | "outbound";
  twilioCallSid?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  outcome?: "completed" | "missed" | "voicemail" | "failed";
}

export interface TranscriptLine {
  speaker: "user" | "assistant";
  text: string;
}

// ─── Call CRUD ────────────────────────────────────────────────────────────────
export async function createCall(data: CreateCall) {
  const [call] = await db.insert(calls).values({
    clientId: data.clientId,
    contactId: data.contactId ?? null,
    humeAgentId: data.humeAgentId ?? null,
    phoneNumberId: data.phoneNumberId ?? null,
    direction: data.direction,
    twilioCallSid: data.twilioCallSid ?? null,
    startedAt: data.startedAt,
    endedAt: data.endedAt ?? null,
    durationSeconds: data.durationSeconds ?? null,
    outcome: data.outcome ?? null,
  }).returning();
  return call;
}

export async function updateCall(id: string, patch: Partial<{
  twilioCallSid: string;
  humeChatId: string;
  humeChatGroupId: string;
  endedAt: Date;
  durationSeconds: number;
  outcome: "completed" | "missed" | "voicemail" | "failed";
  transcript: string;
}>) {
  const [updated] = await db.update(calls)
    .set(patch)
    .where(eq(calls.id, id))
    .returning();
  return updated;
}

export async function getCallByTwilioSid(twilioCallSid: string) {
  const rows = await db.select().from(calls)
    .where(eq(calls.twilioCallSid, twilioCallSid))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveTranscripts(callId: string, lines: TranscriptLine[]) {
  await updateCall(callId, { transcript: JSON.stringify(lines) });
}

// ─── Phone Resolution ─────────────────────────────────────────────────────────
export async function resolvePhoneToClient(number: string) {
  const normalized = number.replace(/\s/g, "");
  const rows = await db.select().from(phoneNumbers)
    .where(and(
      eq(phoneNumbers.number, normalized),
      eq(phoneNumbers.isActive, true)
    ))
    .limit(1);

  if (!rows[0]) return null;

  const num = rows[0];
  const agent = num.humeAgentId
    ? (await db.select().from(humeAgents).where(eq(humeAgents.id, num.humeAgentId)).limit(1))[0] ?? null
    : null;

  return { num, agent };
}

// ─── Contact helper ───────────────────────────────────────────────────────────
export async function upsertContactFromCall(clientId: string, phoneE164: string) {
  return upsertContact({ clientId, phoneE164 });
}

// ─── Transcript Sync ─────────────────────────────────────────────────────────
export async function syncHumeTranscript(callId: string, twilioCallSid: string, clientId: string): Promise<boolean> {
  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) return false;

  try {
    let humeChat: any = null;
    let page = 0;

    while (!humeChat && page < 5) {
      const res = await fetch(
        `https://api.hume.ai/v0/evi/chats?page_size=20&page_number=${page}&ascending_order=false`,
        { headers: { "X-Hume-Api-Key": apiKey } }
      );
      if (!res.ok) break;
      const data = await res.json();
      const chats: any[] = data.chats_page || [];

      humeChat = chats.find((c: any) => {
        try {
          const meta = typeof c.metadata === "string" ? JSON.parse(c.metadata) : c.metadata;
          return meta?.twilio?.call_sid === twilioCallSid;
        } catch { return false; }
      });

      if (chats.length < 20) break;
      page++;
    }

    if (!humeChat) {
      console.log(`[sync] No Hume chat for sid=${twilioCallSid}`);
      return false;
    }

    const chatRes = await fetch(
      `https://api.hume.ai/v0/evi/chats/${humeChat.id}?page_size=500`,
      { headers: { "X-Hume-Api-Key": apiKey } }
    );
    if (!chatRes.ok) return false;

    const chatData = await chatRes.json();
    const events: any[] = chatData.events_page || [];

    const messages = events.filter((e: any) =>
      e.type === "USER_MESSAGE" || e.type === "AGENT_MESSAGE"
    );

    if (messages.length === 0) return false;

    const lines: TranscriptLine[] = messages
      .filter((e: any) => (e.message_text || "").trim())
      .map((e: any) => ({
        speaker: e.type === "USER_MESSAGE" ? "user" : "assistant",
        text: e.message_text || "",
      }));

    await saveTranscripts(callId, lines);
    await updateCall(callId, {
      humeChatId: humeChat.id,
      humeChatGroupId: humeChat.chat_group_id,
    });

    console.log(`[sync] Saved ${lines.length} lines for call ${callId}`);

    // Auto-detect lead / appointment from transcript
    const { detectLeadFromTranscript } = await import("@/services/transcriptDetection");
    const { createLead } = await import("@/services/leadService");

    const detected = detectLeadFromTranscript(lines);
    if (detected) {
      const topic = detected === "appointment" ? "Appointment Request" : "General Inquiry";

      const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
      const contact = call?.contactId
        ? (await db.select().from(contacts).where(eq(contacts.id, call.contactId)).limit(1))[0]
        : null;

      const [existing] = await db.select().from(leads)
        .where(and(eq(leads.clientId, clientId), eq(leads.notes, `auto:${callId}`)))
        .limit(1);

      if (!existing) {
        await createLead({
          clientId,
          contactId: call?.contactId ?? undefined,
          phone: contact?.phoneE164 ?? "Unknown",
          name: contact?.name ?? undefined,
          topic,
          source: "phone_call",
          status: "new",
          chatGroupId: humeChat.chat_group_id,
          notes: `auto:${callId}`,
        });
        console.log(`[sync] Auto-created "${topic}" lead for call ${callId}`);
      }
    }

    return true;
  } catch (err: any) {
    console.error("[sync] Error:", err.message);
    return false;
  }
}
