import "server-only";

import { normalizePhone } from "@/lib/grok-call";

export async function placeOutboundCall(input: { to: string; from: string; greeting: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const to = normalizePhone(input.to);
  const from = normalizePhone(input.from) || process.env.TWILIO_PHONE_NUMBER || "";

  if (!accountSid || !authToken || !from || !to) {
    return { ok: false as const, error: "The phone line is not ready for outbound calls yet." };
  }

  if (!process.env.XAI_API_KEY) {
    return { ok: false as const, error: "Grok is not connected to the phone line yet." };
  }

  const appUrl = (process.env.APP_URL || "https://www.auraoffice.xyz").replace(/\/$/, "");
  const twimlUrl = `${appUrl}/api/webhooks/twilio/twiml-outbound?provider=grok&greeting=${encodeURIComponent(input.greeting)}&sipNumber=${encodeURIComponent(from)}`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: from,
      Url: twimlUrl,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false as const, error: payload?.message || "The call could not be placed." };
  }
  return { ok: true as const, callSid: String(payload.sid || "") };
}
