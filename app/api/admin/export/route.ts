import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { fail } from "@/lib/api";
import { SHEET_TABS } from "@/lib/constants";
import { toCsv } from "@/lib/csv";
import { getAllSheetRecords } from "@/lib/sheets";

const exportMap = {
  instructions: SHEET_TABS.instructions,
  ai_feedback: SHEET_TABS.aiFeedback,
  bookings: SHEET_TABS.bookings
} as const;

export async function GET(request: NextRequest) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = request.nextUrl.searchParams.get("tab")?.toLowerCase() as
    | keyof typeof exportMap
    | undefined;

  if (!tab || !(tab in exportMap)) {
    return fail("Invalid export tab");
  }

  const records = await getAllSheetRecords(exportMap[tab]);
  const csv = toCsv(records);
  const filename = `${tab}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}
