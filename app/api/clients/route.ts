import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { clients } from "@/db/schema";
import { verifyAdminSession } from "@/lib/auth";

const ADMIN_COOKIE = "admin_session";

// ─── Auth Helper ─────────────────────────────────────────────────────────────
async function authenticate(req: NextRequest) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// ─── GET /api/clients or /api/clients/:id ───────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id?: string } }
) {
  const authError = await authenticate(req);
  if (authError) return authError;

  const { id } = params;

  try {
    if (id) {
      // Get single client
      const [client] = await db.select().from(clients)
        .where(eq(clients.id, id))
        .limit(1);

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      return NextResponse.json(client);
    } else {
      // List all clients
      const allClients = await db.select().from(clients);
      return NextResponse.json(allClients);
    }
  } catch (err: any) {
    console.error("[clients GET] Error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── POST /api/clients — Create a new client ─────────────────────────────────
export async function POST(req: NextRequest) {
  const authError = await authenticate(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, email, phone, industry, plan } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const [newClient] = await db.insert(clients).values({
      name,
      email: email.toLowerCase(),
      phone: phone ?? null,
      industry: industry ?? null,
      plan: plan ?? "starter",
    }).returning();

    return NextResponse.json(newClient, { status: 201 });
  } catch (err: any) {
    console.error("[clients POST] Error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── PUT /api/clients/:id — Update a client ────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authenticate(req);
  if (authError) return authError;

  const { id } = params;

  try {
    const body = await req.json();
    const { name, email, phone, industry, plan } = body;

    const [updated] = await db.update(clients)
      .set({
        name: name ?? undefined,
        email: email?.toLowerCase() ?? undefined,
        phone: phone ?? undefined,
        industry: industry ?? undefined,
        plan: plan ?? undefined,
      })
      .where(eq(clients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(`[clients PUT/${id}] Error:`, err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── DELETE /api/clients/:id — Delete a client ─────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authenticate(req);
  if (authError) return authError;

  const { id } = params;

  try {
    const result = await db.delete(clients)
      .where(eq(clients.id, id));

    if (result.count === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[clients DELETE/${id}] Error:`, err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
