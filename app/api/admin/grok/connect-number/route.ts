import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { grokNumbers, phoneNumbers } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";
import { normalizePhone } from "@/lib/grok-call";

export async function POST(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "XAI_API_KEY is not set on the server" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const phone = normalizePhone(typeof body?.phoneNumber === "string" ? body.phoneNumber : "");
  const clientId = typeof body?.clientId === "string" ? body.clientId : null;
  if (!phone) {
    return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
  }

  const appUrl = (process.env.APP_URL || "https://www.auraoffice.xyz").replace(/\/$/, "");
  const response = await fetch("https://api.x.ai/v2/phone-numbers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin: "byo_trunk",
      name: `Aura ${phone}`,
      phone_number: phone,
      webhook: {
        name: `Aura ${phone}`,
        url: `${appUrl}/api/webhooks/xai/sip`,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: payload?.error || payload?.message || "xAI rejected the number" }, { status: response.status });
  }

  const webhook = payload.webhook || payload.phone_number?.webhook || {};
  const secret = webhook.secret || webhook.signing_secret || payload.signing_secret || payload.webhook_secret || null;
  const xaiId = payload.phone_number_id || payload.phone_number?.id || payload.id || null;

  const existing = await db.select().from(grokNumbers).where(eq(grokNumbers.phoneNumber, phone)).limit(1);
  if (existing[0]) {
    await db.update(grokNumbers).set({
      clientId,
      xaiPhoneNumberId: xaiId,
      webhookSecret: secret,
    }).where(eq(grokNumbers.id, existing[0].id));
  } else {
    await db.insert(grokNumbers).values({
      clientId,
      phoneNumber: phone,
      xaiPhoneNumberId: xaiId,
      webhookSecret: secret,
    });
  }

  const owned = await db.select().from(phoneNumbers).where(eq(phoneNumbers.number, phone)).limit(1);
  return NextResponse.json({
    ok: true,
    phoneNumber: phone,
    registered: true,
    savedOnClient: Boolean(owned[0]),
    sipUri: `sip:${phone}@sip.voice.x.ai;transport=tls`,
  });
}
