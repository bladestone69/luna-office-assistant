import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import {
  ADMIN_COOKIE,
  CLIENT_COOKIE,
  createAdminSession,
  createClientSession,
  verifyAdminCredentials,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const isAdmin = await verifyAdminCredentials(email, password);
  if (isAdmin) {
    const token = createAdminSession(email);
    const response = NextResponse.json({ ok: true, role: "admin" });
    response.cookies.set({
      name: ADMIN_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  const [clientUser] = await db
    .select()
    .from(clientUsers)
    .where(eq(clientUsers.email, email))
    .limit(1);

  if (clientUser && verifyPassword(password, clientUser.passwordHash)) {
    const token = createClientSession({
      clientId: clientUser.clientId,
      userId: clientUser.id,
    });
    const response = NextResponse.json({
      ok: true,
      role: "client",
      clientId: clientUser.clientId,
      name: clientUser.name,
    });
    response.cookies.set({
      name: CLIENT_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
