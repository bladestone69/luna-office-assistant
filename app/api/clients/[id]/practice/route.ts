import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { getPractice, savePractice } from "@/lib/practice";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await getPractice(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load the practice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  try {
    const practice = await savePractice(id, {
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
