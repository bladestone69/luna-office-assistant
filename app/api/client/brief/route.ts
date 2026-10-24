import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { saveClientBrief } from "@/lib/client-desk";

export async function PUT(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  try {
    await saveClientBrief(session.clientId, {
      instructions: typeof body?.instructions === "string" ? body.instructions : "",
      greeting: typeof body?.greeting === "string" ? body.greeting : "",
      voice: typeof body?.voice === "string" ? body.voice : "eve",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[client brief]", error);
    return NextResponse.json({ error: "Could not save the brief" }, { status: 500 });
  }
}
