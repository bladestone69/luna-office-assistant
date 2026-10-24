import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { loadClientDesk } from "@/lib/client-desk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const desk = await loadClientDesk(session.clientId, session.userId);
    if (!desk) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(desk);
  } catch (error) {
    console.error("[client desk]", error);
    return NextResponse.json({ error: "Could not load the desk" }, { status: 500 });
  }
}
