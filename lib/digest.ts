import "server-only";

import { and, eq, gte, lt, or } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, calls, clients, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

export async function sendDailyClientDigests(now = DateTime.now().setZone(APP_TIMEZONE)) {
  const day = now.minus({ days: 1 }).startOf("day");
  const next = day.plus({ days: 1 });
  const clientRows = await db.select().from(clients).where(eq(clients.status, "active"));
  const results: { clientId: string; sent: boolean }[] = [];

  for (const client of clientRows) {
    const [callRows, bookingRows, openJobs] = await Promise.all([
      db.select({ id: calls.id }).from(calls).where(and(
        eq(calls.clientId, client.id),
        eq(calls.direction, "inbound"),
        gte(calls.startedAt, day.toJSDate()),
        lt(calls.startedAt, next.toJSDate()),
      )),
      db.select({ id: bookings.id }).from(bookings).where(and(
        eq(bookings.clientId, client.id),
        gte(bookings.createdAt, day.toJSDate()),
        lt(bookings.createdAt, next.toJSDate()),
      )),
      db.select({ id: tasks.id }).from(tasks).where(and(
        eq(tasks.clientId, client.id),
        or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress")),
      )),
    ]);

    const to = client.notificationEmail || client.email;
    await sendEmail({
      to,
      subject: `Aura daily digest - ${day.toFormat("dd LLL yyyy")}`,
      text: [
        `Daily summary for ${client.name}`,
        `Date: ${day.toFormat("dd LLL yyyy")} (${APP_TIMEZONE})`,
        "",
        `Calls received: ${callRows.length}`,
        `Bookings made: ${bookingRows.length}`,
        `Open jobs: ${openJobs.length}`,
        "",
        "Open Aura Office to review the details.",
      ].join("\n"),
    });
    results.push({ clientId: client.id, sent: true });
  }

  return results;
}
