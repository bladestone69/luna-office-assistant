import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "hostline_session";

function secret() {
  return process.env.HOSTLINE_SESSION_SECRET || "dev-only-hostline-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionToken() {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isAuthenticated() {
  return verifySessionToken(cookies().get(COOKIE)?.value);
}

export function sessionCookieName() {
  return COOKIE;
}

export function checkAdminPassword(password: string) {
  const expected = process.env.HOSTLINE_ADMIN_PASSWORD || "change-me";
  return password === expected;
}
