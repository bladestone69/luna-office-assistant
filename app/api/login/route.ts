import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { clientUsers } from "@/db/schema";
import { createAdminSession } from "@/lib/auth";

const ADMIN_COOKIE = "vercelaura_admin_session";
const CLIENT_COOKIE = "vercelaura_client_session";

function secureCompare(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function hashPassword(password: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "luna-secret")
    .update(password)
    .digest("hex");
}

function verifyClientPassword(plain: string, storedHash: string): boolean {
  return secureCompare(hashPassword(plain), storedHash);
}

function createClientToken(clientId: string, userId: string): string {
  const ttl = 1000 * 60 * 60 * 12; // 12 hours
  const payload = `${userId}|${clientId}|${Date.now() + ttl}`;
  return Buffer.from(payload).toString("base64url");
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // ─── Check admin ─────────────────────────────────────────────────────────────
  const adminUsername = (process.env.ADMIN_USERNAME ?? "").trim();
  const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

  if (adminUsername && adminPassword) {
    const emailMatch = secureCompare(email.toLowerCase(), adminUsername.toLowerCase());
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
      const token = createClientToken(clientUser.clientId, clientUser.id);
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
