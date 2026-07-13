import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead, getDeskSnapshot, recordCall } from "@/lib/store";
import { verifyWebhookSecret } from "@/lib/xai";

const leadSchema = z.object({
  tool: z.literal("create_lead").optional(),
  name: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().email().optional().nullable(),
  topic: z.string().optional(),
  preferred_callback_time: z.string().optional().nullable(),
  consent: z.boolean().optional(),
});

const callSchema = z.object({
  tool: z.literal("record_call"),
  direction: z.enum(["inbound", "outbound"]).default("inbound"),
  fromNumber: z.string(),
  toNumber: z.string(),
  durationSeconds: z.number().optional().nullable(),
  outcome: z.enum(["completed", "missed", "voicemail", "failed", "in_progress"]).default("completed"),
  summary: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req.headers.get("x-hostline-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: any;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tool = json.tool || json.name || "create_lead";

  if (tool === "create_lead") {
    const parsed = leadSchema.safeParse({ ...json, tool: "create_lead" });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid create_lead payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const lead = createLead({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      topic: parsed.data.topic,
      preferredCallbackTime: parsed.data.preferred_callback_time,
      consent: parsed.data.consent,
      source: "phone_call",
    });
    return NextResponse.json({ ok: true, leadId: lead.id });
  }

  if (tool === "record_call") {
    const parsed = callSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid record_call payload" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const call = recordCall({
      direction: parsed.data.direction,
      fromNumber: parsed.data.fromNumber,
      toNumber: parsed.data.toNumber,
      durationSeconds: parsed.data.durationSeconds ?? null,
      outcome: parsed.data.outcome,
      summary: parsed.data.summary ?? null,
      transcript: parsed.data.transcript ?? null,
      startedAt: parsed.data.startedAt ?? now,
      endedAt: parsed.data.endedAt ?? now,
    });
    return NextResponse.json({ ok: true, callId: call.id });
  }

  return NextResponse.json({
    ok: true,
    ignored: true,
    tool,
    desk: {
      leads: getDeskSnapshot().leads.length,
      calls: getDeskSnapshot().calls.length,
    },
  });
}
