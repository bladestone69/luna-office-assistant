import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers, clients } from "@/db/schema";
import { createClientUser, listClientUsers } from "@/lib/admin-data";
import { hashPassword, isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await listClientUsers(params.id);
    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client users GET/${params.id}] Error:`, message);
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
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || password.length < 6) {
      return NextResponse.json(
        { error: "Email and a password of at least 6 characters are required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(clientUsers)
      .where(and(eq(clientUsers.clientId, params.id), eq(clientUsers.email, email)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "That login already exists" }, { status: 409 });
    }

    const user = await createClientUser({
      clientId: params.id,
      email,
      passwordHash: hashPassword(password),
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client users POST/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
