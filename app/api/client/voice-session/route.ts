import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { readClientSession } from "@/lib/client-access";
import { mintOwnerSession } from "@/lib/owner-session";

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.id, session.userId), eq(clientUsers.clientId, session.clientId)))
    .limit(1);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await mintOwnerSession(session.clientId, user.name.trim() || "the owner"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
