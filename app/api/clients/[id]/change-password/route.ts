import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { CLIENT_COOKIE, hashPassword, parseClientSession, verifyPassword } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = parseClientSession(req.cookies.get(CLIENT_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body ?? {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const [user] = await db
    .select()
    .from(clientUsers)
    .where(eq(clientUsers.id, session.userId))
    .limit(1);

  if (!user || user.clientId !== params.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  await db
    .update(clientUsers)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(clientUsers.id, user.id));

  return NextResponse.json({ ok: true });
}
