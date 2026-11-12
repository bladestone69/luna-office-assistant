import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { readClientSession } from "@/lib/client-access";
import { hashClientPassword, verifyClientPassword } from "@/lib/client-password";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await readClientSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.clientId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body ?? {};

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword || currentPassword.length > 1024 || newPassword.length > 1024) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.id, session.userId), eq(clientUsers.clientId, session.clientId)))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!(await verifyClientPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const newHash = await hashClientPassword(newPassword);
  await db.update(clientUsers).set({ passwordHash: newHash }).where(eq(clientUsers.id, session.userId));

  return NextResponse.json({ ok: true });
}
