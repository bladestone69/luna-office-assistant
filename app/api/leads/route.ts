import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { leads, clients } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";

async function authenticate(req: NextRequest) {
  if (!(await isAdminApiRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// ─── POST /api/leads — Create a new lead ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const authError = await authenticate(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { clientId, name, phone, email, topic, notes } = body;

    if (!clientId || !phone) {
      return NextResponse.json(
        { error: "clientId and phone are required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const [client] = await db.select().from(clients)
      .where(eq(clients.id, clientId)).limit(1);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [newLead] = await db.insert(leads).values({
      clientId,
      name: name ?? "Unknown",
      phone,
      email: email ?? null,
      topic: topic ?? "General inquiry",
      notes: notes ?? null,
      source: "web",
      status: "new",
    }).returning();

    return NextResponse.json(newLead, { status: 201 });
  } catch (err: any) {
    console.error("[leads POST] Error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── GET /api/leads — List leads ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authError = await authenticate(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (clientId) {
      const clientLeads = await db.select().from(leads)
        .where(eq(leads.clientId, clientId))
        .orderBy(desc(leads.createdAt));
      return NextResponse.json(clientLeads);
    }

    const allLeads = await db.select().from(leads)
      .orderBy(desc(leads.createdAt));
    return NextResponse.json(allLeads);
  } catch (err: any) {
    console.error("[leads GET] Error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
