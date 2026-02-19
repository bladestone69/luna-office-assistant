import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { fail, enforceRateLimit } from "@/lib/api";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "admin-login");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid login request");
  }

  const valid = verifyAdminCredentials(parsed.data.username, parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createAdminSession(parsed.data.username);
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
