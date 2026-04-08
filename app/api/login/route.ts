import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { clientUsers } from "@/db/schema";
import { ADMIN_COOKIE, createAdminSession } from "@/lib/auth";
import { verifyClientPassword } from "@/lib/client-password";
import { CLIENT_COOKIE, createClientSessionToken } from "@/lib/client-session";

function secureCompare(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // ─── Check admin ─────────────────────────────────────────────────────────────
  const adminUsername = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

  if (adminUsername && adminPassword) {
    const emailMatch = secureCompare(email.toLowerCase(), adminUsername);
    const passMatch = secureCompare(password, adminPassword);
    if (emailMatch && passMatch) {
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
  }

  // ─── Check client users ───────────────────────────────────────────────────────
  const [clientUser] = await db.select().from(clientUsers)
    .where(eq(clientUsers.email, email.toLowerCase()))
    .limit(1);

  if (clientUser) {
    const valid = verifyClientPassword(password, clientUser.passwordHash);
    if (valid) {
      const token = createClientSessionToken(clientUser.clientId, clientUser.id);
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
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
