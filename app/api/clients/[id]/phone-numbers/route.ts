import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, phoneNumbers } from "@/db/schema";
import { listClientPhoneNumbers } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const numbers = await listClientPhoneNumbers(params.id);
    return NextResponse.json(numbers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client phone numbers GET/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [client] = await db.select().from(clients).where(eq(clients.id, params.id)).limit(1);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await req.json();
    const number = body.twilioNumber?.trim();
    if (!number) {
      return NextResponse.json({ error: "Twilio number is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(phoneNumbers)
      .values({
        clientId: params.id,
        humeAgentId: body.humeAgentId?.trim() || null,
        number,
        label: body.isPrimary ? "Primary" : null,
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      {
        id: created.id,
        clientId: created.clientId,
        number: created.number,
        agentId: created.humeAgentId ?? "",
        isPrimary: (created.label ?? "").toLowerCase() === "primary",
        voiceEnabled: Boolean(created.isActive),
        smsEnabled: false,
        status: created.isActive ? "active" : "inactive",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client phone numbers POST/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
