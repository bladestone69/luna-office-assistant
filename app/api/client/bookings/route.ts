import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { addClientBooking, cancelClientBooking } from "@/lib/client-desk";

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);

  try {
    const id = await addClientBooking(session.clientId, {
      name: typeof body?.name === "string" ? body.name : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      email: typeof body?.email === "string" ? body.email : "",
      meetingType: typeof body?.meetingType === "string" ? body.meetingType : "Appointment",
      start: typeof body?.start === "string" ? body.start : "",
      notes: typeof body?.notes === "string" ? body.notes : "",
      minutes: Number(body?.minutes),
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
  const saved = await cancelClientBooking(session.clientId, id);
  if (!saved) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
