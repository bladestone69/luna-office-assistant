import { NextResponse } from "next/server";

const ADMIN_COOKIE = "luna_admin_session";
const CLIENT_COOKIE = "luna_client_session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  response.cookies.delete(CLIENT_COOKIE);
  return response;
}
