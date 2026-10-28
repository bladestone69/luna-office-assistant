import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    grok: Boolean(process.env.XAI_API_KEY),
    hume: false,
    twilio: false,
    calendar: "aura",
  });
}
