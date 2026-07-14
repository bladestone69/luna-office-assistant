import { NextRequest, NextResponse } from "next/server";
import {
  checkOwnerPassword,
  createClientSession,
  createOwnerSession,
  clientCookieName,
  ownerCookieName,
  sessionCookieOptions,
} from "@/lib/auth";
import { getClientByLogin } from "@/lib/store";

export async function POST(req: NextRequest) {
  let body: { role?: string; password?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role === "client" ? "client" : "owner";

  if (role === "owner") {
    if (!body.password || !checkOwnerPassword(body.password)) {
      return NextResponse.json({ error: "Invalid owner password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, role: "owner", redirect: "/owner" });
    res.cookies.set(ownerCookieName(), createOwnerSession(), sessionCookieOptions());
    return res;
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const client = getClientByLogin(body.email, body.password);
  if (!client) {
    return NextResponse.json({ error: "Invalid desk login" }, { status: 401 });
  }
  if (client.status === "churned") {
    return NextResponse.json({ error: "This desk is closed. Contact Hostline." }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, role: "client", redirect: "/desk" });
  res.cookies.set(
    clientCookieName(),
    createClientSession(client.id, client.loginEmail),
    sessionCookieOptions()
  );
  return res;
}
