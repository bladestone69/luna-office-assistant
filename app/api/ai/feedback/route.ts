import { NextRequest, NextResponse } from "next/server";
import { fail, enforceRateLimit } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { requiredEnv } from "@/lib/env";
import { redactIdLikeNumbers, sanitizeFreeText } from "@/lib/privacy";
import { appendSheetRow } from "@/lib/sheets";
import { aiFeedbackSchema } from "@/lib/validation";

function normalize(value: string) {
  return sanitizeFreeText(redactIdLikeNumbers(value || ""));
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-ai-ingest-token");
  if (!token || token !== requiredEnv("AI_INGEST_TOKEN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(request, "ai-feedback");
  if (limited) return limited;

  const rawBody = await request.json().catch(() => null);
  const parsed = aiFeedbackSchema.safeParse(rawBody);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid feedback payload");
  }

  const createdAt = new Date().toISOString();
  const safeSummary = normalize(parsed.data.summary);
  const safeNextAction = normalize(parsed.data.nextAction || "");
  const safeInstructionId = normalize(parsed.data.instructionId);
  const safeBookingEventId = normalize(parsed.data.bookingEventId || "");
  const safeStart = normalize(parsed.data.scheduledStartDateTime || "");
  const safeEnd = normalize(parsed.data.scheduledEndDateTime || "");
  const safeClientName = normalize(parsed.data.clientName || "");
  const safeClientPhone = normalize(parsed.data.clientPhone || "");
  const safeClientEmail = normalize(parsed.data.clientEmail || "");
  const safeMeetingType = normalize(parsed.data.meetingType || "");

  await appendSheetRow(SHEET_TABS.aiFeedback, [
    createdAt,
    safeInstructionId,
    parsed.data.status,
    safeSummary,
    safeNextAction,
    safeStart,
    safeEnd,
    safeBookingEventId,
    JSON.stringify(rawBody).slice(0, 3500)
  ]);

  if (safeStart && safeEnd && parsed.data.status === "completed") {
    await appendSheetRow(SHEET_TABS.bookings, [
      createdAt,
      safeClientName,
      safeClientPhone,
      safeClientEmail,
      safeMeetingType || "AI Scheduled Meeting",
      safeStart,
      safeEnd,
      safeBookingEventId,
      "false",
      ""
    ]);
  }

  return NextResponse.json({ ok: true });
}
