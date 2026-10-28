import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { runOwnerTool } from "@/lib/owner-session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const args = body?.args && typeof body.args === "object" ? body.args : {};
  try {
    return NextResponse.json(await runOwnerTool(id, name, args));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not saved.";
    return NextResponse.json({ ok: false, saved: false, message, error: message });
  }
}
