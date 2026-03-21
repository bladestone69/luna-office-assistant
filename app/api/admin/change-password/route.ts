import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { isAdminApiRequest } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body ?? {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  // Verify current password
  const { verifyAdminCredentials } = await import("@/lib/auth");
  const username = process.env.ADMIN_USERNAME || "ernest";
  const valid = await verifyAdminCredentials(username, currentPassword);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  // Hash and store
  const { db } = await import("@/db");
  const { adminCredentials } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");

  const newHash = hashPassword(newPassword);
  await db.execute(
    sql`INSERT INTO admin_credentials (id, password_hash, updated_at)
        VALUES (1, ${newHash}, NOW())
        ON CONFLICT (id) DO UPDATE SET password_hash = ${newHash}, updated_at = NOW()`
  );

  return NextResponse.json({ ok: true });
}
