import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { clientUsers, clients } from "@/db/schema";
import { ADMIN_COOKIE, createAdminSession, authenticateAdmin } from "@/lib/auth";
import { hashClientPassword, verifyClientPassword } from "@/lib/client-password";
import { isModernPasswordHash } from "@/lib/password";
import { enforceRateLimit } from "@/lib/api";
import { CLIENT_COOKIE, createClientSessionToken } from "@/lib/client-session";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "login");
  if (limited) return limited;
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || email.length > 254 || password.length > 1024) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // ─── Check admin ─────────────────────────────────────────────────────────────
  try {
    const adminCredential = await authenticateAdmin(email, password);
    if (adminCredential) {
      const token = createAdminSession(email, adminCredential);
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

    // ─── Check client users ───────────────────────────────────────────────────────
    const [account] = await db.select({ user: clientUsers }).from(clientUsers)
      .innerJoin(clients, eq(clients.id, clientUsers.clientId))
      .where(and(eq(clientUsers.email, email.toLowerCase()), eq(clients.status, "active")))
      .limit(1);
    const clientUser = account?.user;

    if (clientUser) {
      const valid = await verifyClientPassword(password, clientUser.passwordHash);
      if (valid) {
        let passwordHash = clientUser.passwordHash;
        if (!isModernPasswordHash(passwordHash)) {
          const upgradedHash = await hashClientPassword(password);
          const [upgraded] = await db.update(clientUsers).set({ passwordHash: upgradedHash })
            .where(and(eq(clientUsers.id, clientUser.id), eq(clientUsers.passwordHash, passwordHash)))
            .returning({ passwordHash: clientUsers.passwordHash });
          if (!upgraded) return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
          passwordHash = upgraded.passwordHash;
        }
        const token = createClientSessionToken(clientUser.clientId, clientUser.id, passwordHash);
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
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
