import { NextRequest, NextResponse } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { grokNumbers } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await isAdminApiRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: grokNumbers.id,
      number: grokNumbers.phoneNumber,
    })
    .from(grokNumbers)
    .where(isNull(grokNumbers.clientId));

  return NextResponse.json(rows);
}
