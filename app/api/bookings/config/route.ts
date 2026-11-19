import { NextRequest, NextResponse } from "next/server";
import { resolvePublicClient } from "@/lib/client-routing";

export async function GET(request: NextRequest) {
  const client = await resolvePublicClient(request);
  if (!client) {
    return NextResponse.json({ error: "This booking link or phone line is not assigned to an active client." }, { status: 404 });
  }
  return NextResponse.json({
    name: client.name,
    slug: client.slug,
    meetingTypes: client.meetingTypes,
    openingHour: client.openingHour,
    closingHour: client.closingHour,
  });
}
