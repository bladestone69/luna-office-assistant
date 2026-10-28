import "server-only";

import { normalizePhone } from "@/lib/grok-call";

function nationalNumber(e164: string) {
  if (e164.startsWith("+27") && e164.length >= 11) return `0${e164.slice(3)}`;
  return e164.replace(/^\+/, "");
}

export async function placeOutboundCall(input: { to: string; from: string; greeting: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const to = normalizePhone(input.to);
  const line = normalizePhone(input.from);
  const twilioFrom = normalizePhone(process.env.TWILIO_PHONE_NUMBER || "") || line;

  if (!accountSid || !authToken || !twilioFrom || !to) {
    return { ok: false as const, error: "The phone line is not ready for outbound calls yet." };
  }

  if (!process.env.XAI_API_KEY) {
    return { ok: false as const, error: "Grok is not connected to the phone line yet." };
  }

  const appUrl = (process.env.APP_URL || "https://www.auraoffice.xyz").replace(/\/$/, "");
  const sipNumber = line || twilioFrom;
  const twimlUrl = `${appUrl}/api/webhooks/twilio/twiml-outbound?provider=grok&greeting=${encodeURIComponent(input.greeting)}&sipNumber=${encodeURIComponent(sipNumber)}`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const sipUser = process.env.TELVIVA_SIP_USER || "";
  const sipPass = process.env.TELVIVA_SIP_PASSWORD || "";
  const sipHost = process.env.TELVIVA_SIP_HOST || "sip.telviva.com";
  const params = new URLSearchParams({
    From: twilioFrom,
    Url: twimlUrl,
  });

  if (sipUser && sipPass) {
    params.set("To", `sip:${nationalNumber(to)}@${sipHost}`);
    params.set("SipAuthUsername", sipUser);
    params.set("SipAuthPassword", sipPass);
  } else {
    params.set("To", to);
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false as const, error: payload?.message || "The call could not be placed." };
  }
  return { ok: true as const, callSid: String(payload.sid || "") };
}
