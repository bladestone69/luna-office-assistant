import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { requiredEnv } from "@/lib/env";

export const ADMIN_COOKIE = "luna_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function sign(payload: string): string {
  return createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET"))
    .update(payload)
    .digest("hex");
}

function secureCompare(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "ernest";
  const expectedPass = requiredEnv("ADMIN_PASSWORD");
  return secureCompare(username, expectedUser) && secureCompare(password, expectedPass);
}

export function createAdminSession(username: string): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${username}|${expiry}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}|${signature}`).toString("base64url");
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [username, expiryString, signature] = decoded.split("|");
    if (!username || !expiryString || !signature) return false;

    const payload = `${username}|${expiryString}`;
    const expectedSig = sign(payload);
    if (!secureCompare(signature, expectedSig)) return false;

    if (Date.now() > Number(expiryString)) return false;
    const expectedUser = process.env.ADMIN_USERNAME || "ernest";
    return secureCompare(username, expectedUser);
  } catch {
    return false;
  }
}

export function isAdminApiRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}
