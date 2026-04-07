import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneNumbers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminClientDetail } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getAdminClientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(detail.phoneNumbers);
  } catch (error) {
    console.error("[phone numbers GET]", error);
    return NextResponse.json({ error: "Failed to load phone numbers" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const number = typeof body?.number === "string" ? body.number.trim() : "";
    const humeAgentId = typeof body?.humeAgentId === "string" ? body.humeAgentId.trim() : "";
    const isPrimary = body?.isPrimary === true;

    if (!number) {
      return NextResponse.json({ error: "A phone number is required" }, { status: 400 });
    }

    if (isPrimary) {
      await db.update(phoneNumbers).set({ label: null }).where(eq(phoneNumbers.clientId, id));
    }

    const [saved] = await db
      .insert(phoneNumbers)
      .values({
        clientId: id,
        humeAgentId: humeAgentId || null,
        number,
        label: isPrimary ? "primary" : null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      id: saved.id,
      clientId: saved.clientId,
      number: saved.number,
      agentId: saved.humeAgentId ?? "",
      isPrimary: saved.label === "primary",
      voiceEnabled: true,
      smsEnabled: false,
      status: saved.isActive ? "active" : "inactive",
    });
  } catch (error) {
    console.error("[phone numbers POST]", error);
    return NextResponse.json({ error: "Failed to save phone number" }, { status: 500 });
  }
}
