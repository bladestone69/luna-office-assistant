import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { eq, and, asc } from "drizzle-orm";
import { clients, humeAgents, leads, calls } from "@/db/schema";
import { createLead, updateLead } from "@/services/leadService";

// ─── Hume EVI Webhook ─────────────────────────────────────────────────────────
// Handles tool_call events from Hume EVI (e.g. create_lead).
export async function POST(req: NextRequest) {
  let event: any;
  try {
    const raw = await req.text();
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Verify signature ────────────────────────────────────────────────────────
  const signature = req.headers.get("x-hume-ai-webhook-signature");
  const timestamp = req.headers.get("x-hume-ai-webhook-timestamp");
  const apiKey = process.env.HUME_API_KEY;

  if (signature && timestamp && apiKey) {
    try {
      const rawBody = JSON.stringify(event);
      const expected = crypto
        .createHmac("sha256", apiKey)
        .update(`${rawBody}.${timestamp}`)
        .digest("hex");
      const tsNum = parseInt(timestamp, 10);
      if (Math.floor(Date.now() / 1000) - tsNum > 300) {
        return NextResponse.json({ error: "Timestamp too old" }, { status: 401 });
      }
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        console.warn("[hume-webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (err: any) {
      console.warn("[hume-webhook] Signature check skipped:", err.message);
    }
  }

  const eventName: string = event.event_name ?? "unknown";
  const configId: string = event.config_id ?? "";
  const chatGroupId: string = event.chat_group_id ?? "";

  console.log(`[hume-webhook] event=${eventName} config=${configId} chatGroup=${chatGroupId}`);

  // ── Resolve client ID ──────────────────────────────────────────────────────
  async function resolveClientId(): Promise<string | null> {
    if (chatGroupId) {
      const [matchedCall] = await db.select().from(calls)
        .where(eq(calls.humeChatGroupId, chatGroupId)).limit(1);
      if (matchedCall?.clientId) return matchedCall.clientId;
    }
    if (configId) {
      const [matchedAgent] = await db.select().from(humeAgents)
        .where(eq(humeAgents.humeConfigId, configId)).limit(1);
      if (matchedAgent?.clientId) return matchedAgent.clientId;
    }
    const [oldest] = await db.select().from(clients)
      .where(eq(clients.status, "active"))
      .orderBy(asc(clients.createdAt)).limit(1);
    return oldest?.id ?? null;
  }

  // ── Handle create_lead tool call ───────────────────────────────────────────
  if (eventName === "tool_call" && event.tool_call_message?.name === "create_lead") {
    let params: any = {};
    try {
      params = typeof event.tool_call_message.parameters === "string"
        ? JSON.parse(event.tool_call_message.parameters)
        : event.tool_call_message.parameters ?? {};
    } catch { /**/ }

    const clientId = await resolveClientId();
    if (!clientId) {
      console.warn("[hume-webhook] Could not resolve client — lead dropped");
      return NextResponse.json({ status: "ok", dropped: true });
    }

    // Deduplicate: one lead per chat_group_id
    if (chatGroupId) {
      const [existing] = await db.select().from(leads)
        .where(and(eq(leads.clientId, clientId), eq(leads.chatGroupId, chatGroupId)))
        .limit(1);
      if (existing) {
        console.log(`[hume-webhook] Lead already exists for chat_group=${chatGroupId} — skipping`);
        return NextResponse.json({ status: "ok", duplicate: true });
      }
    }

    const lead = await createLead({
      clientId,
      name: params.name ?? "Unknown",
      phone: params.phone ?? event.caller_number ?? "Unknown",
      email: params.email ?? null,
      topic: params.topic ?? "General inquiry",
      preferredCallbackTime: params.preferred_callback_time ?? null,
      consent: params.consent ?? false,
      source: "phone_call",
      status: "new",
      chatGroupId: chatGroupId || null,
    });

    console.log(`[hume-webhook] Lead created: ${lead.id} for client ${clientId}`);

    // ── Create Trello card ─────────────────────────────────────────────────
    const trelloKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_ACCESS_TOKEN;
    const trelloListId = process.env.TRELLO_LEADS_LIST_ID;

    if (trelloKey && trelloToken && trelloListId) {
      try {
        const { createTrelloCard, formatLeadCard } = await import("@/services/trelloService");
        const cardBody = formatLeadCard(lead);
        const card = await createTrelloCard({
          apiKey: trelloKey,
          token: trelloToken,
          boardId: process.env.TRELLO_BOARD_ID!,
          listId: trelloListId,
          name: cardBody.name,
          desc: cardBody.desc,
        });
        await updateLead(lead.id, { trelloCardId: card.id });
        console.log(`[hume-webhook] Trello card created: ${card.shortUrl}`);
      } catch (err: any) {
        console.error("[hume-webhook] Trello error:", err.message);
      }
    }

    return NextResponse.json({ status: "ok", leadId: lead.id });
  }

  return NextResponse.json({ status: "ok" });
}
