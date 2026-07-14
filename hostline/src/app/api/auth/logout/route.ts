import { NextResponse } from "next/server";
import { clientCookieName, ownerCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ownerCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(clientCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
