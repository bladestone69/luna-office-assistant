import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { getGrokSetup } from "@/lib/grok-setup";

export async function GET(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getGrokSetup(session.clientId));
}

export async function POST() {
  return NextResponse.json(
    { error: "Only the admin can change the voice and the prompts." },
    { status: 403 },
  );
}
