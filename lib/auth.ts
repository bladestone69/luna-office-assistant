import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { requiredEnv } from "@/lib/env";

export const ADMIN_COOKIE = "vercelaura_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

// ─── Password hashing (PBKDF2) ────────────────────────────────────────────────

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const SALT_LEN = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = createHmac("sha512", requiredEnv("ADMIN_SESSION_SECRET"))
    .update(salt)
    .update(password)
    .digest();
  // Store as salt:hash (both hex)
  return salt.toString("hex") + ":" + hash.toString("hex");
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, "hex");
    const storedHash = Buffer.from(hashHex, "hex");
    const hash = createHmac("sha512", requiredEnv("ADMIN_SESSION_SECRET"))
      .update(salt)
      .update(password)
      .digest();
    if (hash.length !== storedHash.length) return false;
    return timingSafeEqual(hash, storedHash);
  } catch {
    return false;
  }
}

// ─── Session signing ──────────────────────────────────────────────────────────

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

// ─── Admin auth ───────────────────────────────────────────────────────────────

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "ernest";
  const userMatch = secureCompare(username.toLowerCase(), expectedUser.toLowerCase());
  if (!userMatch) return false;

  // Check DB-stored hash first (allows password changes to persist)
  try {
    const { db } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const { adminCredentials } = await import("@/db/schema");
    const [cred] = await db.select().from(adminCredentials).limit(1);
    if (cred?.passwordHash) {
      return verifyPassword(password, cred.passwordHash);
    }
  } catch {
    // DB not available yet — fall through to env check
  }

  // Fallback to env var password
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envPass) return false;
  return secureCompare(password, envPass);
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
