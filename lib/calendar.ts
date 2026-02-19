import "server-only";
import { DateTime } from "luxon";
import { google } from "googleapis";
import { APP_TIMEZONE } from "@/lib/constants";
import { requiredEnv } from "@/lib/env";
import { getGoogleJwt } from "@/lib/google-auth";
import { getFirstName } from "@/lib/privacy";

type BusySlot = {
  start: string;
  end: string;
};

function getCalendarClient() {
  const auth = getGoogleJwt(["https://www.googleapis.com/auth/calendar"]);
  return google.calendar({ version: "v3", auth });
}

function calendarId() {
  return requiredEnv("GOOGLE_CALENDAR_ID");
}

function overlaps(startA: DateTime, endA: DateTime, startB: DateTime, endB: DateTime) {
  return startA < endB && endA > startB;
}

export async function getBusySlots(startIso: string, endIso: string): Promise<BusySlot[]> {
  const calendar = getCalendarClient();
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startIso,
      timeMax: endIso,
      timeZone: APP_TIMEZONE,
      items: [{ id: calendarId() }]
    }
  });

  const busy = response.data.calendars?.[calendarId()]?.busy || [];
  return busy.filter((item): item is BusySlot => Boolean(item.start && item.end));
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
}) {
  const calendar = getCalendarClient();
  const summary = `Meeting - ${getFirstName(input.name)} - ${input.phone}`;

  const event = await calendar.events.insert({
    calendarId: calendarId(),
    requestBody: {
      summary,
      description: `Scheduled via Luna Office Assistant.\nType: ${input.meetingTypeLabel}\nContact: ${input.name} | ${input.phone} | ${input.email}`,
      start: {
        dateTime: input.startIso,
        timeZone: APP_TIMEZONE
      },
      end: {
        dateTime: input.endIso,
        timeZone: APP_TIMEZONE
      }
    }
  });

  return event.data.id || "";
}
