import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api";
import { INSTRUCTION_STATUSES, SHEET_TABS } from "@/lib/constants";
import { requiredEnv } from "@/lib/env";
import { getRecentSheetRecords, isSheetsConfigured } from "@/lib/sheets";

const terminalStatuses = new Set<(typeof INSTRUCTION_STATUSES)[number]>([
  "completed",
  "failed"
]);

type StatusValue = (typeof INSTRUCTION_STATUSES)[number];

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-ai-ingest-token");
  if (!token || token !== requiredEnv("AI_INGEST_TOKEN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets integration is not configured." },
      { status: 503 }
    );
  }

  const limited = enforceRateLimit(request, "ai-instructions");
  if (limited) return limited;

  const includeClosed = request.nextUrl.searchParams.get("includeClosed") === "true";
  const max = Math.min(
    Number(request.nextUrl.searchParams.get("limit") || 50),
    200
  );

  const [instructions, aiFeedback] = await Promise.all([
    getRecentSheetRecords(SHEET_TABS.instructions, 300),
    getRecentSheetRecords(SHEET_TABS.aiFeedback, 600)
  ]);

  const latestFeedbackByInstruction = new Map<string, Record<string, string>>();
  aiFeedback.forEach((record) => {
    const instructionId = record.instructionId;
    if (instructionId && !latestFeedbackByInstruction.has(instructionId)) {
      latestFeedbackByInstruction.set(instructionId, record);
    }
  });

  const queue = instructions
    .map((instruction) => {
      const latest = latestFeedbackByInstruction.get(instruction.instructionId || "");
      const status = (latest?.status || instruction.status || "pending") as StatusValue;

      return {
        instructionId: instruction.instructionId || "",
        clientName: instruction.clientName || "",
        clientPhone: instruction.clientPhone || "",
        preferredCallTime: instruction.preferredCallTime || "",
        instructionText: instruction.instructionText || "",
        priority: instruction.priority || "normal",
        status,
        lastSummary: latest?.summary || "",
        lastUpdateAt: latest?.createdAt || instruction.createdAt || "",
        createdAt: instruction.createdAt || ""
      };
    })
    .filter((item) => (includeClosed ? true : !terminalStatuses.has(item.status)))
    .slice(0, max);

  return NextResponse.json({
    ok: true,
    count: queue.length,
    instructions: queue
  });
}
