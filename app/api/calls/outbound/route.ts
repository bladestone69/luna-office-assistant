import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { clients, humeAgents, phoneNumbers } from "@/db/schema";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { grokSipTwiml, normalizePhone } from "@/lib/grok-call";

async function authenticate(req: NextRequest) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// ─── POST /api/calls/outbound ─────────────────────────────────────────────────
// Body: { clientId: string, to: string, greeting?: string }
export async function POST(req: NextRequest) {
  const authError = await authenticate(req);
  if (authError) return authError;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  }

  let body: { clientId?: string; to?: string; greeting?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, to, greeting } = body;

  if (!clientId || !to) {
    return NextResponse.json(
      { error: "clientId and to (phone number) are required" },
      { status: 400 }
    );
  }

  // Resolve client's Hume agent and their Twilio phone number
  const [client] = await db.select().from(clients)
    .where(eq(clients.id, clientId)).limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Find the Hume agent for this client
  const [agent] = await db.select().from(humeAgents)
    .where(eq(humeAgents.clientId, clientId)).limit(1);

  // Find the Twilio number assigned to this agent
  let humePhone = process.env.HUME_PHONE_NUMBER ?? fromNumber;
  if (agent) {
    const [phoneNumber] = await db.select().from(phoneNumbers)
      .where(eq(phoneNumbers.humeAgentId, agent.id))
      .limit(1);
    if (phoneNumber?.number) {
      humePhone = phoneNumber.number;
    }
  }

  const greetingText = greeting ?? `Hello, this is ${client.name}. Please hold while I connect you.`;
  const appUrl = process.env.APP_URL ?? "https://www.auraoffice.xyz";
  const useGrok = agent?.voiceProvider !== "hume" && Boolean(process.env.XAI_API_KEY);
  const sipNumber = normalizePhone(fromNumber);
  const twimlUrl = useGrok
    ? `${appUrl}/api/webhooks/twilio/twiml-outbound?provider=grok&greeting=${encodeURIComponent(greetingText)}&sipNumber=${encodeURIComponent(sipNumber)}`
    : `${appUrl}/api/webhooks/twilio/twiml-outbound?greeting=${encodeURIComponent(greetingText)}&humePhone=${encodeURIComponent(humePhone)}`;

  // Create outbound call via Twilio REST API
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Url: twimlUrl,
        statusCallback: `${appUrl}/api/webhooks/twilio/status`,
        statusCallbackEvent: "initiated ringing answered completed",
      }).toString(),
    }
  );

  const result = await twilioRes.json();

  if (!twilioRes.ok) {
    console.error("[outbound-call] Twilio error:", result);
    return NextResponse.json(
      { error: result.message ?? "Twilio call failed" },
      { status: 500 }
    );
  }

  console.log(`[outbound-call] Call initiated: ${result.sid} → ${to}`);

  return NextResponse.json({
    success: true,
    callSid: result.sid,
    status: result.status,
  });
}

