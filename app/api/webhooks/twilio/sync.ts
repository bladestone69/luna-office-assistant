import { db } from "@/db";
import { eq, and, asc } from "drizzle-orm";
import { calls, leads, contacts } from "@/db/schema";
import * as callService from "@/services/callService";
import { createLead } from "@/services/leadService";
import { detectLeadFromTranscript } from "@/services/transcriptDetection";

interface TranscriptLine { speaker: "user" | "assistant"; text: string; }

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
      console.log(`[sync-transcript] No Hume chat found for sid=${twilioCallSid}`);
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

    await callService.saveTranscripts(callId, lines);
    await callService.updateCall(callId, {
      humeChatId: humeChat.id,
      humeChatGroupId: humeChat.chat_group_id,
    });

    console.log(`[sync-transcript] Saved ${lines.length} lines for call ${callId}`);

    // ── Auto-detect leads / appointments from transcript ─────────────────────
    const detected = detectLeadFromTranscript(lines);
    if (detected) {
      const topic = detected === "appointment" ? "Appointment Request" : "General Inquiry";

      const callRows = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
      const call = callRows[0];
      const contact = call?.contactId
        ? (await db.select().from(contacts).where(eq(contacts.id, call.contactId)).limit(1))[0]
        : null;

      // Deduplicate: one auto-lead per call
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
        console.log(`[sync-transcript] Auto-created "${topic}" lead for call ${callId}`);
      }
    }

    return true;
  } catch (err: any) {
    console.error("[sync-transcript] Error:", err.message);
    return false;
  }
}
