import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    grok: Boolean(process.env.XAI_API_KEY),
    hume: Boolean(process.env.HUME_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    calendar: "aura",
  });
}
