import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/calendar";
import { fail, enforceRateLimit } from "@/lib/api";
import { bookingAvailabilitySchema } from "@/lib/validation";
import { findMeetingType, resolvePublicClient } from "@/lib/client-routing";

export async function GET(request: NextRequest) {
  const client = await resolvePublicClient(request);
  if (!client) return fail("This booking link or phone line is not assigned to an active client.", 404);

  const limited = enforceRateLimit(request, "availability", client.clientId);
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const parsed = bookingAvailabilitySchema.safeParse({
    date: params.get("date"),
    meetingType: params.get("meetingType")
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid request");
  }

  const meeting = findMeetingType(client, parsed.data.meetingType);
  if (!meeting) return fail("That meeting type is not available for this business.");
  const durationMinutes = meeting.durationMinutes;

  try {
    const slots = await getAvailableSlotsForDate({
      date: parsed.data.date,
      durationMinutes,
      clientId: client.clientId,
      openingHour: client.openingHour,
      closingHour: client.closingHour,
    });
    return NextResponse.json({ slots });
  } catch {
    return fail("Could not get availability", 500);
  }
}
