import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Verify client session
  const token = req.cookies.get("luna_client_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, clientId] = decoded.split("|").slice(0, 2);
    if (clientId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body ?? {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const [user] = await db.select().from(clientUsers).where(eq(clientUsers.id, id)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const { hashPassword } = await import("@/lib/auth");
  const newHash = hashPassword(newPassword);
  await db.update(clientUsers).set({ passwordHash: newHash }).where(eq(clientUsers.id, id));

  return NextResponse.json({ ok: true });
}
