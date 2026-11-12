import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, authenticateAdmin } from "@/lib/auth";
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

  try {
    const credential = await authenticateAdmin(parsed.data.username, parsed.data.password);
    if (!credential) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createAdminSession(parsed.data.username, credential);
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
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
