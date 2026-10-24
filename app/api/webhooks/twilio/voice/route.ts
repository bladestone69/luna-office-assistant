import { NextRequest, NextResponse } from "next/server";
import * as callService from "@/services/callService";
import { grokSipTwiml, normalizePhone } from "@/lib/grok-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const entries = Object.fromEntries(body.entries());

    const callSid = String(entries.CallSid || "");
    const fromNumber = String(entries.From || "");
    const toNumber = String(entries.To || "");
    const direction = String(entries.Direction || "inbound");
    const configId = req.nextUrl.searchParams.get("configId") ?? undefined;
    const callId = req.nextUrl.searchParams.get("callId") ?? undefined;

    if (callId) {
      await callService.updateCall(callId, { twilioCallSid: callSid });
    }

    const resolved = await callService.resolvePhoneToClient(normalizePhone(toNumber) || toNumber);
    const provider = resolved?.agent?.voiceProvider === "hume" ? "hume" : "grok";

    if (!callId && resolved) {
      const contact = await callService.upsertContactFromCall(resolved.num.clientId, fromNumber);
      await callService.createCall({
        clientId: resolved.num.clientId,
        contactId: contact?.id,
        humeAgentId: resolved.num.humeAgentId ?? undefined,
        phoneNumberId: resolved.num.id,
        direction: direction === "outbound-api" ? "outbound" : "inbound",
        twilioCallSid: callSid,
        startedAt: new Date(),
      });
    }

    if (provider === "grok" && process.env.XAI_API_KEY) {
      const sipNumber = normalizePhone(toNumber) || process.env.TWILIO_PHONE_NUMBER || "";
      return xml(grokSipTwiml(sipNumber));
    }

    const humeConfigId = configId || resolved?.agent?.humeConfigId || process.env.HUME_CONFIG_ID;
    if (!humeConfigId || !process.env.HUME_API_KEY) {
      return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>The receptionist is not configured yet. Please try again later.</Say></Response>`);
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(entries)) params.append(key, String(value));
    const humeRes = await fetch(
      `https://api.hume.ai/v0/evi/twilio?config_id=${humeConfigId}&api_key=${process.env.HUME_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      },
    );
    return new NextResponse(await humeRes.text(), {
      headers: { "Content-Type": "text/xml" },
      status: humeRes.status,
    });
  } catch (error: any) {
    console.error("[twilio-voice]", error?.message || error);
    return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, we could not connect your call. Please try again.</Say></Response>`);
  }
}

function xml(body: string) {
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}
