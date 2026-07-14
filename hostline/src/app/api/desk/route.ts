import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth";
import { getClientDesk } from "@/lib/store";

export async function GET() {
  const session = getClientSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const desk = getClientDesk(session.clientId);
  if (!desk) return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  return NextResponse.json(desk);
}
