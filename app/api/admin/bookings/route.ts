import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.startDateTime))
      .limit(200);

    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
