import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";

export async function workBriefForClient(clientId: string) {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const dayStart = now.startOf("day").toJSDate();
  const dayEnd = now.endOf("day").toJSDate();

  const [jobRows, dayBookings] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.clientId, clientId), eq(tasks.status, "pending")))
      .orderBy(desc(tasks.createdAt))
      .limit(8),
    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.clientId, clientId),
          eq(bookings.status, "confirmed"),
          gte(bookings.startDateTime, dayStart),
          lte(bookings.startDateTime, dayEnd),
        ),
      )
      .orderBy(bookings.startDateTime),
  ]);

  const jobs = jobRows
    .map((job) => `- ${job.title}${job.description ? `: ${job.description}` : ""}`)
    .join("\n");
  const diary = dayBookings
    .map((booking) => {
      const when = DateTime.fromJSDate(booking.startDateTime).setZone(APP_TIMEZONE).toFormat("HH:mm");
      return `- ${when} ${booking.title || booking.meetingType} with ${booking.name || "a caller"}`;
    })
    .join("\n");

  return [
    jobs ? `Open jobs from the desk:\n${jobs}` : "Open jobs from the desk: none.",
    diary ? `Diary today:\n${diary}` : "Diary today: nothing booked.",
    "Never invent an open slot. Use the tools to save a message or a booking.",
  ].join("\n");
}
