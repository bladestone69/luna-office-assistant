import { NextRequest, NextResponse } from "next/server";
import { fail, enforceRateLimit, isHoneypotTriggered } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { getErnestEmail, sendEmail } from "@/lib/email";
import { redactIdLikeNumbers, sanitizeFreeText } from "@/lib/privacy";
import { appendSheetRow } from "@/lib/sheets";
import { leadSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "leads");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

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
  const notes = sanitizeFreeText(parsed.data.notes || "");

  await appendSheetRow(SHEET_TABS.leads, [
    createdAt,
    safeName,
    parsed.data.phone,
    parsed.data.email,
    parsed.data.topic,
    safeCallbackTime,
    String(parsed.data.consent),
    consentAt,
    "web",
    notes
  ]);

  await sendEmail({
    to: getErnestEmail(),
    subject: `New Lead: ${safeName}`,
    text: [
      "New lead submitted via Luna Office Assistant.",
      "",
      `Name: ${safeName}`,
      `Phone: ${parsed.data.phone}`,
      `Email: ${parsed.data.email}`,
      `Topic: ${parsed.data.topic}`,
      `Preferred callback time: ${safeCallbackTime}`,
      `Consent: ${parsed.data.consent}`,
      `Consent timestamp: ${consentAt}`,
      `Notes: ${notes || "N/A"}`
    ].join("\n")
  });

  return NextResponse.json({
    message: "Lead captured. Ernest will follow up."
  });
}
