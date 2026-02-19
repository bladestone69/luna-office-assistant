import { NextRequest, NextResponse } from "next/server";
import { fail, enforceRateLimit, isHoneypotTriggered } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { getErnestEmail, sendEmail } from "@/lib/email";
import {
  isUrgentMessage,
  redactIdLikeNumbers,
  sanitizeFreeText
} from "@/lib/privacy";
import { appendSheetRow, isSheetsConfigured } from "@/lib/sheets";
import { messageSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSheetsConfigured()) {
    return fail("Google Sheets integration is not configured.", 503);
  }

  const limited = enforceRateLimit(request, "messages");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input");
  }

  if (isHoneypotTriggered(parsed.data.website)) {
    return fail("Unable to process request", 400);
  }

  const createdAt = new Date().toISOString();
  const consentAt = createdAt;
  const safeName = redactIdLikeNumbers(parsed.data.name);
  const safeCallbackTime = redactIdLikeNumbers(parsed.data.preferredCallbackTime);
  const reason = sanitizeFreeText(parsed.data.reason);
  const flaggedUrgent = isUrgentMessage(reason, parsed.data.urgency);
  const subjectPrefix = flaggedUrgent ? "URGENT: " : "";

  await appendSheetRow(SHEET_TABS.messages, [
    createdAt,
    safeName,
    parsed.data.phone,
    parsed.data.email || "",
    reason,
    parsed.data.urgency,
    safeCallbackTime,
    String(parsed.data.consent),
    consentAt,
    String(flaggedUrgent)
  ]);

  await sendEmail({
    to: getErnestEmail(),
    subject: `${subjectPrefix}New Message: ${safeName}`,
    text: [
      "New message submitted via Luna Office Assistant.",
      "",
      `Name: ${safeName}`,
      `Phone: ${parsed.data.phone}`,
      `Email: ${parsed.data.email || "N/A"}`,
      `Urgency: ${parsed.data.urgency}`,
      `Flagged urgent: ${flaggedUrgent}`,
      `Preferred callback time: ${safeCallbackTime}`,
      `Consent: ${parsed.data.consent}`,
      `Consent timestamp: ${consentAt}`,
      `Reason: ${reason}`
    ].join("\n")
  });

  return NextResponse.json({
    message: "Message captured for callback.",
    flaggedUrgent
  });
}
