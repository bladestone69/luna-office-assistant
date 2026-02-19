import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";
import { fail, enforceRateLimit, isHoneypotTriggered } from "@/lib/api";
import {
  createPrivacySafeEvent,
  isSlotAvailable
} from "@/lib/calendar";
import { APP_TIMEZONE, MEETING_TYPES, SHEET_TABS } from "@/lib/constants";
import {
  bookingConfirmationText,
  getErnestEmail,
  sendEmail
} from "@/lib/email";
import { getFirstName, redactIdLikeNumbers } from "@/lib/privacy";
import { appendSheetRow, isSheetsConfigured } from "@/lib/sheets";
import { bookingSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSheetsConfigured()) {
    return fail("Google Sheets integration is not configured.", 503);
  }

  const limited = enforceRateLimit(request, "bookings");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input");
  }

  if (isHoneypotTriggered(parsed.data.website)) {
    return fail("Unable to process request", 400);
  }

  const meeting = MEETING_TYPES[parsed.data.meetingType];
  const safeName = redactIdLikeNumbers(parsed.data.name);
  const start = DateTime.fromISO(parsed.data.startDateTime, { zone: APP_TIMEZONE });
  if (!start.isValid) {
    return fail("Invalid meeting start time");
  }

  const end = start.plus({ minutes: meeting.durationMinutes });
  const openingHour = 8;
  const closingHour = 17;

  if (
    start.hour < openingHour ||
    end.hour > closingHour ||
    (end.hour === closingHour && end.minute > 0)
  ) {
    return fail("Selected slot is outside office hours.");
  }

  const startIso = start.toISO();
  const endIso = end.toISO();
  if (!startIso || !endIso) {
    return fail("Invalid date conversion");
  }

  try {
    const available = await isSlotAvailable(startIso, endIso);
    if (!available) {
      return NextResponse.json(
        { error: "That slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    const calendarEventId = await createPrivacySafeEvent({
      name: safeName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      meetingTypeLabel: meeting.label,
      startIso,
      endIso
    });

    const createdAt = new Date().toISOString();
    const consentAt = createdAt;

    await appendSheetRow(SHEET_TABS.bookings, [
      createdAt,
      safeName,
      parsed.data.phone,
      parsed.data.email,
      meeting.label,
      startIso,
      endIso,
      calendarEventId,
      String(parsed.data.consent),
      consentAt
    ]);

    await Promise.all([
      sendEmail({
        to: parsed.data.email,
        subject: "Meeting confirmed - Luna Office Assistant",
        text: bookingConfirmationText({
          name: safeName,
          meetingType: meeting.label,
          startIso,
          phone: parsed.data.phone
        })
      }),
      sendEmail({
        to: getErnestEmail(),
        subject: `New Booking: ${getFirstName(safeName)}`,
        text: [
          "Meeting confirmed via Luna Office Assistant.",
          "",
          `Name: ${safeName}`,
          `Phone: ${parsed.data.phone}`,
          `Email: ${parsed.data.email}`,
          `Type: ${meeting.label}`,
          `Start: ${startIso} (${APP_TIMEZONE})`,
          `End: ${endIso} (${APP_TIMEZONE})`,
          `Calendar event id: ${calendarEventId}`,
          `Consent timestamp: ${consentAt}`
        ].join("\n")
      })
    ]);

    return NextResponse.json({
      message: "Booking confirmed. A confirmation email has been sent."
    });
  } catch {
    return fail("Could not create booking. Please try again.", 500);
  }
}
