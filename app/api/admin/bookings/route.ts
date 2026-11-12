import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminApiRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.startDateTime))
      .limit(200);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[admin bookings]", err);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
