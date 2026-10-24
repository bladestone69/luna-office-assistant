import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { setClientMessageStatus } from "@/lib/client-desk";

const STATUSES = ["new", "contacted", "converted", "lost"] as const;

export async function PATCH(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = STATUSES.find((item) => item === body?.status);
  if (!id || !status) return NextResponse.json({ error: "Message id and status are required" }, { status: 400 });
  const saved = await setClientMessageStatus(session.clientId, id, status);
  if (!saved) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
