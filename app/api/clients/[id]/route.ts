import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getAdminClientSummary } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getAdminClientSummary(params.id);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const [updated] = await db
      .update(clients)
      .set({
        name: body.name?.trim() || undefined,
        email: body.email?.trim().toLowerCase() || undefined,
        phone: body.phone?.trim() || undefined,
        industry: body.industry?.trim() || undefined,
        plan: body.plan === "pro" ? "pro" : body.plan === "starter" ? "starter" : undefined,
      })
      .where(eq(clients.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const summary = await getAdminClientSummary(updated.id);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[clients PUT/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await db.delete(clients).where(eq(clients.id, params.id)).returning();
    if (!deleted.length) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[clients DELETE/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
