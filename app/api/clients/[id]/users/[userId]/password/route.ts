import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isAdminApiRequest } from "@/lib/auth";
import { hashClientPassword } from "@/lib/client-password";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;

  try {
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const [updated] = await db
      .update(clientUsers)
      .set({ passwordHash: hashClientPassword(password) })
      .where(and(eq(clientUsers.id, userId), eq(clientUsers.clientId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[client user password PUT]", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
