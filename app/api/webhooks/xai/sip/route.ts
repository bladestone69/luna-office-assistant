import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { findGrokNumber, joinGrokSipCall, loadGrokConfigForNumber, normalizePhone } from "@/lib/grok-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event?.type !== "realtime.call.incoming") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const headers = Array.isArray(event?.data?.sip_headers) ? event.data.sip_headers : [];
  const to = headerValue(headers, "To");
  const from = headerValue(headers, "From");
  const number = await findGrokNumber(to);
  if (number?.webhookSecret && !verifyWebhook(req, raw, number.webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const callId = String(event?.data?.call_id || "");
  if (!callId) {
    return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
  }

  const config = await loadGrokConfigForNumber(to, from);
  waitUntil(joinGrokSipCall(callId, config).catch((error) => {
    console.error("[xai-sip]", error);
  }));

  return NextResponse.json({ ok: true });
}

function headerValue(headers: { name?: string; value?: string }[], name: string) {
  const row = headers.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return normalizePhone(row?.value || "");
}

function verifyWebhook(req: NextRequest, raw: string, secret: string) {
  const id = req.headers.get("webhook-id") || "";
  const timestamp = req.headers.get("webhook-timestamp") || "";
  const signature = req.headers.get("webhook-signature") || "";
  if (!id || !timestamp || !signature) return false;
  const signed = `${id}.${timestamp}.${raw}`;
  const digest = createHmac("sha256", secret).update(signed).digest("base64");
  return signature.split(" ").some((part) => {
    const value = part.startsWith("v1,") ? part.slice(3) : part;
    const left = Buffer.from(value);
    const right = Buffer.from(digest);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}
