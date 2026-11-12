import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { requiredEnv } from "@/lib/env";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
type SessionClaims = {
  version: 2;
  role: "admin" | "client";
  subject: string;
  clientId?: string;
  expiresAt: number;
  credentialTag: string;
};

function digest(context: string, value: string) {
  return createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET"))
    .update(`${context}\0${value}`).digest("hex");
}

export function credentialTag(credential: string) {
  return digest("aura-credential-v2", credential);
}

export function createSession(claims: Omit<SessionClaims, "version" | "expiresAt" | "credentialTag">, credential: string) {
  const payload = Buffer.from(JSON.stringify({
    ...claims, version: 2, expiresAt: Date.now() + SESSION_TTL_MS, credentialTag: credentialTag(credential),
  })).toString("base64url");
  return `${payload}.${digest("aura-session-v2", payload)}`;
}

export function parseSession(token: string | undefined, role: SessionClaims["role"]): SessionClaims | null {
  if (!token || token.length > 2048) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1])) return null;
    const expected = digest("aura-session-v2", parts[0]);
    if (!timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return null;
    const claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (claims.version !== 2 || claims.role !== role || typeof claims.subject !== "string" || !claims.subject ||
        typeof claims.credentialTag !== "string" || !/^[a-f0-9]{64}$/.test(claims.credentialTag) ||
        !Number.isSafeInteger(claims.expiresAt) || claims.expiresAt <= Date.now() ||
        claims.expiresAt > Date.now() + SESSION_TTL_MS) return null;
    if (role === "client" && (typeof claims.clientId !== "string" || !claims.clientId)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function matchesCredential(claims: SessionClaims, credential: string) {
  return timingSafeEqual(Buffer.from(claims.credentialTag), Buffer.from(credentialTag(credential)));
}
