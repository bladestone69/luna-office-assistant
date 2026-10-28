import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { addClientJob, setClientJobStatus } from "@/lib/client-desk";
import { dialClientJob } from "@/lib/due-calls";

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action === "call-now") {
    const result = await dialClientJob(session.clientId, String(body?.id || ""));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, call: result });
  }

  try {
    const result = await addClientJob(session.clientId, {
      title: typeof body?.title === "string" ? body.title : "",
      details: typeof body?.details === "string" ? body.details : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      dueAt: typeof body?.dueAt === "string" ? body.dueAt : null,
      callNow: body?.callNow === true,
      placeCall: body?.placeCall === true,
    });
    return NextResponse.json({ ok: true, id: result.id, call: result.call });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the job";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status === "done" ? "done" : body?.status === "pending" ? "pending" : null;
  if (!id || !status) return NextResponse.json({ error: "Job id and status are required" }, { status: 400 });

  const saved = await setClientJobStatus(session.clientId, id, status);
  if (!saved) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
