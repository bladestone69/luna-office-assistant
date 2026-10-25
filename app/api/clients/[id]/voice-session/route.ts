import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";
import { mintOwnerSession } from "@/lib/owner-session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  try {
    return NextResponse.json(await mintOwnerSession(id, "the owner"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
