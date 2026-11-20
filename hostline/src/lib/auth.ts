import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type SessionRole = "owner" | "client";

export type SessionPayload = {
  role: SessionRole;
  clientId?: string;
  email?: string;
  issuedAt: number;
};

const OWNER_COOKIE = "hostline_owner";
const CLIENT_COOKIE = "hostline_client";

function secret() {
  return process.env.HOSTLINE_SESSION_SECRET || "dev-only-hostline-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function createOwnerSession() {
  return encode({ role: "owner", issuedAt: Date.now() });
}

export function createClientSession(clientId: string, email: string) {
  return encode({ role: "client", clientId, email, issuedAt: Date.now() });
}

export function ownerCookieName() {
  return OWNER_COOKIE;
}

export function clientCookieName() {
  return CLIENT_COOKIE;
}

export function getOwnerSession(): SessionPayload | null {
  const session = decode(cookies().get(OWNER_COOKIE)?.value);
  return session?.role === "owner" ? session : null;
}

export function getClientSession(): SessionPayload | null {
  const session = decode(cookies().get(CLIENT_COOKIE)?.value);
  return session?.role === "client" && session.clientId ? session : null;
}

export function isOwnerAuthenticated() {
  return Boolean(getOwnerSession());
}

export function checkOwnerPassword(password: string) {
  const expected = process.env.HOSTLINE_OWNER_PASSWORD || process.env.HOSTLINE_ADMIN_PASSWORD || "change-me";
  return password === expected;
}

export function sessionCookieOptions(maxAge = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
