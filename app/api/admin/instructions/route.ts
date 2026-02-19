import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { fail, enforceRateLimit } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { appendSheetRow, isSheetsConfigured } from "@/lib/sheets";
import { instructionCreateSchema } from "@/lib/validation";

function normalizeText(value: string) {
  return value.trim().replace(/\s{2,}/g, " ");
}

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
  const campaignName = normalizeText(parsed.data.campaignName || "") || "Outbound campaign";
  const preferredCallTime = normalizeText(parsed.data.preferredCallTime || "");
  const pitchPrompt = normalizeText(parsed.data.pitchPrompt);

  const uniquePhones = [...new Set(parsed.data.phoneNumbers.map(normalizeText).filter(Boolean))];
  if (!uniquePhones.length) {
    return fail("Add at least one phone number");
  }

  const jobs = uniquePhones.map((clientPhone, index) => ({
    instructionId: randomUUID(),
    clientName: uniquePhones.length > 1 ? `${campaignName} #${index + 1}` : campaignName,
    clientPhone
  }));

  await Promise.all(
    jobs.map((job) =>
      appendSheetRow(SHEET_TABS.instructions, [
        createdAt,
        job.instructionId,
        job.clientName,
        job.clientPhone,
        preferredCallTime,
        pitchPrompt,
        parsed.data.priority,
        "pending",
        process.env.ADMIN_USERNAME || "admin",
        "admin-dispatch"
      ])
    )
  );

  return NextResponse.json({
    ok: true,
    count: jobs.length,
    instructionId: jobs[0]?.instructionId || "",
    instructionIds: jobs.map((job) => job.instructionId)
  });
}
