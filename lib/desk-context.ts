import "server-only";

import { and, asc, desc, eq, gte } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@/db";
import { bookings, tasks } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";

function whenLabel(value: Date) {
  return DateTime.fromJSDate(value).setZone(APP_TIMEZONE).toFormat("ccc d LLL yyyy HH:mm");
}

export async function workBriefForClient(clientId: string, mode: "owner" | "caller" = "owner") {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const from = now.minus({ days: 60 }).startOf("day").toJSDate();

  const [bookingRows, jobRows] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.clientId, clientId), eq(bookings.status, "confirmed"), gte(bookings.startDateTime, from)))
      .orderBy(asc(bookings.startDateTime))
      .limit(200),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.clientId, clientId), eq(tasks.status, "pending")))
      .orderBy(desc(tasks.createdAt))
      .limit(40),
  ]);

  const upcoming = bookingRows.filter((row) => row.startDateTime.getTime() >= now.startOf("day").toMillis());
  const earlier = bookingRows.filter((row) => row.startDateTime.getTime() < now.startOf("day").toMillis());

  const line = (row: (typeof bookingRows)[number]) => {
    const length = Math.round((row.endDateTime.getTime() - row.startDateTime.getTime()) / 60000);
    const who = mode === "owner" ? `${row.name || "No name"}${row.phone ? `, ${row.phone}` : ""}` : "booked";
    return `- ${whenLabel(row.startDateTime)}, ${length || 30} min, ${row.meetingType}${mode === "owner" ? `, ${who}` : ""}${mode === "owner" && row.notes ? `. ${row.notes}` : ""}`;
  };

  const jobs = jobRows
    .map((job) => {
      const due = job.dueAt ? whenLabel(job.dueAt) : "no time set";
      const phone = job.callPhone ? `, ${job.callPhone}` : "";
      const detail = job.description ? `: ${job.description}` : "";
      return `- ${job.title}, ${due}${phone}${detail}`;
    })
    .join("\n");

  const diary = [
    "Full diary. This is every confirmed appointment from the last 60 days and everything still ahead. You can see the whole diary. Never say you cannot see the diary, and never say you only have today.",
    upcoming.length ? `Ahead:\n${upcoming.map(line).join("\n")}` : "Ahead: nothing booked.",
    earlier.length ? `Recent:\n${earlier.map(line).join("\n")}` : "Recent: nothing.",
    mode === "caller"
      ? "Use this diary only to say if a time is free or taken. Do not read out other people's names, numbers, or notes."
      : "",
    mode === "owner" ? (jobs ? `Open jobs:\n${jobs}` : "Open jobs: none.") : "",
  ]
    .filter(Boolean)
    .join("\n");

  return diary;
}
