import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { hashPassword, isAdminApiRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const password = body.password ?? "";

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(clientUsers)
      .set({ passwordHash: hashPassword(password) })
      .where(and(eq(clientUsers.id, params.userId), eq(clientUsers.clientId, params.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client users password PUT/${params.userId}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
