import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { runOwnerTool } from "@/lib/owner-session";

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const args = body?.args && typeof body.args === "object" ? body.args : {};
  try {
    return NextResponse.json(await runOwnerTool(session.clientId, name, args));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Tool failed" });
  }
}
