import "server-only";
import { DateTime } from "luxon";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { APP_TIMEZONE } from "@/lib/constants";
import { getFirstName } from "@/lib/privacy";

type BusySlot = {
  start: string;
  end: string;
};

function overlaps(startA: DateTime, endA: DateTime, startB: DateTime, endB: DateTime) {
  return startA < endB && endA > startB;
}

export async function getBusySlots(startIso: string, endIso: string): Promise<BusySlot[]> {
  const start = DateTime.fromISO(startIso).toJSDate();
  const end = DateTime.fromISO(endIso).toJSDate();

  const rows = await db
    .select({
      startDateTime: bookings.startDateTime,
      endDateTime: bookings.endDateTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        or(
          and(gte(bookings.startDateTime, start), lte(bookings.startDateTime, end)),
          and(gte(bookings.endDateTime, start), lte(bookings.endDateTime, end)),
          and(lte(bookings.startDateTime, start), gte(bookings.endDateTime, end))
        )
      )
    );

  return rows.map((row) => ({
    start: row.startDateTime.toISOString(),
    end: row.endDateTime.toISOString(),
  }));
}

export async function isSlotAvailable(startIso: string, endIso: string): Promise<boolean> {
  const busySlots = await getBusySlots(startIso, endIso);
  const candidateStart = DateTime.fromISO(startIso).setZone(APP_TIMEZONE);
  const candidateEnd = DateTime.fromISO(endIso).setZone(APP_TIMEZONE);

  return !busySlots.some((slot) =>
    overlaps(
      candidateStart,
      candidateEnd,
      DateTime.fromISO(slot.start).setZone(APP_TIMEZONE),
      DateTime.fromISO(slot.end).setZone(APP_TIMEZONE)
    )
  );
}

export async function getAvailableSlotsForDate(input: {
  date: string;
  durationMinutes: number;
}) {
  const dayStart = DateTime.fromISO(`${input.date}T08:00:00`, { zone: APP_TIMEZONE });
  const dayEnd = DateTime.fromISO(`${input.date}T17:00:00`, { zone: APP_TIMEZONE });

  if (!dayStart.isValid || !dayEnd.isValid) {
    throw new Error("Invalid date input");
  }

  const busySlots = await getBusySlots(dayStart.toISO()!, dayEnd.toISO()!);
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const slots: string[] = [];

  for (
    let cursor = dayStart;
    cursor.plus({ minutes: input.durationMinutes }) <= dayEnd;
    cursor = cursor.plus({ minutes: 15 })
  ) {
    const slotStart = cursor;
    const slotEnd = cursor.plus({ minutes: input.durationMinutes });

    if (slotStart < now.plus({ minutes: 10 })) {
      continue;
    }

    const blocked = busySlots.some((busy) =>
      overlaps(
        slotStart,
        slotEnd,
        DateTime.fromISO(busy.start).setZone(APP_TIMEZONE),
        DateTime.fromISO(busy.end).setZone(APP_TIMEZONE)
      )
    );

    if (!blocked) {
      slots.push(slotStart.toISO()!);
    }
  }

  return slots.slice(0, 24);
}

export async function createPrivacySafeEvent(input: {
  name: string;
  phone: string;
  email: string;
  meetingTypeLabel: string;
  startIso: string;
  endIso: string;
  clientId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  notes?: string;
  consent?: boolean;
}) {
  const summary = `Meeting - ${getFirstName(input.name)} - ${input.phone}`;

  const [inserted] = await db
    .insert(bookings)
    .values({
      clientId: input.clientId || null,
      contactId: input.contactId || null,
      leadId: input.leadId || null,
      name: input.name,
      phone: input.phone,
      email: input.email,
      meetingType: input.meetingTypeLabel,
      title: summary,
      startDateTime: DateTime.fromISO(input.startIso).toJSDate(),
      endDateTime: DateTime.fromISO(input.endIso).toJSDate(),
      status: "confirmed",
      notes: input.notes || `Scheduled via Aura. Type: ${input.meetingTypeLabel}`,
      consent: input.consent ?? false,
    })
    .returning({ id: bookings.id });

  return inserted?.id || "";
}
