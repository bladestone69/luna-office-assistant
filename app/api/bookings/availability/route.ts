import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/calendar";
import { MEETING_TYPES } from "@/lib/constants";
import { fail, enforceRateLimit } from "@/lib/api";
import { bookingAvailabilitySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, "availability");
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const parsed = bookingAvailabilitySchema.safeParse({
    date: params.get("date"),
    meetingType: params.get("meetingType")
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid request");
  }

  const durationMinutes = MEETING_TYPES[parsed.data.meetingType].durationMinutes;

  try {
    const slots = await getAvailableSlotsForDate({
      date: parsed.data.date,
      durationMinutes
    });
    return NextResponse.json({ slots });
  } catch {
    return fail("Could not get availability", 500);
  }
}
