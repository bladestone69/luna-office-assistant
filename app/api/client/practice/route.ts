import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { savePractice } from "@/lib/practice";

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  try {
    const practice = await savePractice(session.clientId, {
      trade: body.trade,
      visitTypes: body.visitTypes,
      questions: body.questions,
    });
    return NextResponse.json({ ok: true, practice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the practice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
