import { NextRequest, NextResponse } from "next/server";
import * as callService from "@/services/callService";

// ─── Twilio Voice Webhook ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const entries = Object.fromEntries(body.entries());

    const callSid: string = entries.CallSid as string;
    const fromNumber: string = entries.From as string;
    const toNumber: string = entries.To as string;
    const direction: string = (entries.Direction as string) || "inbound";

    // Query params set by outbound route — call record already exists
    const configId = req.nextUrl.searchParams.get("configId") ?? undefined;
    const callId = req.nextUrl.searchParams.get("callId") ?? undefined;

    console.log(`[twilio-voice] direction=${direction} from=${fromNumber} to=${toNumber} callId=${callId ?? "none"}`);

    // ── Outbound: call already created ──────────────────────────────────────
    if (callId && configId) {
      await callService.updateCall(callId, { twilioCallSid: callSid });

      const humeUrl = `https://api.hume.ai/v0/evi/twilio?config_id=${configId}&api_key=${process.env.HUME_API_KEY}`;
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(entries)) params.append(k, String(v));

      const humeRes = await fetch(humeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const twiml = await humeRes.text();
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
        status: humeRes.status,
      });
    }

    // ── Inbound: resolve client + agent from called number ─────────────────
    const resolved = await callService.resolvePhoneToClient(toNumber);

    if (resolved) {
      const { num, agent } = resolved;

      const contact = await callService.upsertContactFromCall(num.clientId, fromNumber);

      const call = await callService.createCall({
        clientId: num.clientId,
        contactId: contact?.id,
        humeAgentId: num.humeAgentId ?? undefined,
        phoneNumberId: num.id,
        direction: direction === "outbound-api" ? "outbound" : "inbound",
        twilioCallSid: callSid,
        startedAt: new Date(),
      });

      const humeConfigId = agent?.humeConfigId ?? process.env.HUME_CONFIG_ID!;
      const humeUrl = `https://api.hume.ai/v0/evi/twilio?config_id=${humeConfigId}&api_key=${process.env.HUME_API_KEY}`;
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(entries)) params.append(k, String(v));

      const humeRes = await fetch(humeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const twiml = await humeRes.text();
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
        status: humeRes.status,
      });
    }

    // ── Fallback: no matching number — use default config ───────────────────
    console.log(`[twilio-voice] No phone match for to=${toNumber} — using default`);
    const configIdFallback = process.env.HUME_CONFIG_ID!;
    const humeUrl = `https://api.hume.ai/v0/evi/twilio?config_id=${configIdFallback}&api_key=${process.env.HUME_API_KEY}`;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(entries)) params.append(k, String(v));

    const humeRes = await fetch(humeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const twiml = await humeRes.text();
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
      status: humeRes.status,
    });

  } catch (err: any) {
    console.error("[twilio-voice] Error:", err.message);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, we could not connect your call. Please try again.</Say></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
