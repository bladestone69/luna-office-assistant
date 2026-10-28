import "server-only";

import { normalizePhone } from "@/lib/grok-call";

export async function placeOutboundCall(input: { to: string; from: string; greeting: string }): Promise<{ ok: true; callSid: string } | { ok: false; error: string }> {
  const to = normalizePhone(input.to);
  const from = normalizePhone(input.from);
  if (!to || !from) {
    return { ok: false as const, error: "A from number and a to number are required." };
  }
  if (!process.env.XAI_API_KEY) {
    return { ok: false as const, error: "Grok is not connected to the phone line yet." };
  }

  return {
    ok: false as const,
    error: "Grok can answer once Cool Ideas sends inbound calls to the line. Outbound is not possible until Cool Ideas bridges the answered call to that same Grok address. Twilio is no longer the dialler.",
  };
}
