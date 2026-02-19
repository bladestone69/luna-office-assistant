import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { fail, enforceRateLimit } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { redactIdLikeNumbers, sanitizeFreeText } from "@/lib/privacy";
import { appendSheetRow, isSheetsConfigured } from "@/lib/sheets";
import { instructionCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSheetsConfigured()) {
    return fail("Google Sheets integration is not configured.", 503);
  }

  const limited = enforceRateLimit(request, "admin-instructions");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = instructionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid instruction payload");
  }

  const createdAt = new Date().toISOString();
  const instructionId = randomUUID();
  const safeName = redactIdLikeNumbers(parsed.data.clientName);
  const safePhone = redactIdLikeNumbers(parsed.data.clientPhone);
  const safePreferredCallTime = redactIdLikeNumbers(parsed.data.preferredCallTime);
  const safeInstructionText = sanitizeFreeText(parsed.data.instructionText);

  await appendSheetRow(SHEET_TABS.instructions, [
    createdAt,
    instructionId,
    safeName,
    safePhone,
    safePreferredCallTime,
    safeInstructionText,
    parsed.data.priority,
    "pending",
    process.env.ADMIN_USERNAME || "admin",
    "admin-web"
  ]);

  return NextResponse.json({
    ok: true,
    instructionId
  });
}
