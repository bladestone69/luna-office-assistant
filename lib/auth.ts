import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { adminCredentials } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requiredEnv } from "@/lib/env";
import { hashSecret, isModernPasswordHash, verifySecret } from "@/lib/password";
import { createSession, matchesCredential, parseSession } from "@/lib/session";

export const ADMIN_COOKIE = "vercelaura_admin_session";
export const hashPassword = hashSecret;

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function verifyPassword(password: string, stored: string) {
  if (isModernPasswordHash(stored)) return verifySecret(password, stored);
  const parts = stored.split(":");
  if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[0]) || !/^[a-f0-9]{128}$/.test(parts[1])) return false;
  const hash = createHmac("sha512", requiredEnv("ADMIN_SESSION_SECRET"))
    .update(Buffer.from(parts[0], "hex")).update(password).digest("hex");
  return secureCompare(hash, parts[1]);
}

async function currentCredential() {
  const [credential] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, 1)).limit(1);
  return credential?.passwordHash || process.env.ADMIN_PASSWORD || "";
}

export async function authenticateAdmin(username: string, password: string) {
  const expected = (process.env.ADMIN_USERNAME || "ernest").trim().toLowerCase();
  if (!secureCompare(username.trim().toLowerCase(), expected)) return false;
  // A database failure must never reactivate an older environment password.
  const [credential] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, 1)).limit(1);
  if (!credential?.passwordHash) {
    const passwordFromEnv = process.env.ADMIN_PASSWORD;
    return passwordFromEnv && secureCompare(password, passwordFromEnv) ? passwordFromEnv : null;
  }
  if (!await verifyPassword(password, credential.passwordHash)) return false;
  if (!isModernPasswordHash(credential.passwordHash)) {
    const passwordHash = await hashSecret(password);
    const [updated] = await db.update(adminCredentials).set({ passwordHash, updatedAt: new Date() })
      .where(and(eq(adminCredentials.id, 1), eq(adminCredentials.passwordHash, credential.passwordHash)))
      .returning({ passwordHash: adminCredentials.passwordHash });
    return updated?.passwordHash || null;
  }
  return credential.passwordHash;
}

export async function verifyAdminCredentials(username: string, password: string) {
  return Boolean(await authenticateAdmin(username, password));
}

export function createAdminSession(username: string, credential: string) {
  if (!credential) throw new Error("Admin credentials are not configured");
  return createSession({ role: "admin", subject: username.trim().toLowerCase() }, credential);
}

export async function verifyAdminSession(token: string | undefined) {
  const claims = parseSession(token, "admin");
  if (!claims || claims.subject !== (process.env.ADMIN_USERNAME || "ernest").trim().toLowerCase()) return false;
  const credential = await currentCredential();
  return Boolean(credential) && matchesCredential(claims, credential);
}

export function isAdminApiRequest(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}
