import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, tasks } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";
import { APP_TIMEZONE } from "@/lib/constants";
import { getPractice } from "@/lib/practice";

function whenLabel(value: Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const [bookingRows, jobRows, practice] = await Promise.all([
      db.select().from(bookings).where(eq(bookings.clientId, id)).orderBy(desc(bookings.startDateTime)).limit(80),
      db.select().from(tasks).where(eq(tasks.clientId, id)).orderBy(desc(tasks.createdAt)).limit(40),
      getPractice(id),
    ]);

    return NextResponse.json({
      practice,
      bookings: bookingRows.map((row) => ({
        id: row.id,
        name: row.name || "Appointment",
        phone: row.phone || "",
        meetingType: row.meetingType,
        when: whenLabel(row.startDateTime),
        status: row.status || "confirmed",
        notes: row.notes || "",
        answers: row.answers || "",
      })),
      jobs: jobRows.map((row) => ({
        id: row.id,
        title: row.title,
        details: row.description || "",
        status: row.status || "pending",
        when: whenLabel(row.dueAt || row.createdAt),
        phone: row.callPhone || "",
        placeCall: Boolean(row.placeCall),
        callError: row.callError || "",
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load this client's diary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
