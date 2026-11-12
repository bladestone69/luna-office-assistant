import "server-only";
import { createSession, parseSession } from "@/lib/session";

export const CLIENT_COOKIE = "vercelaura_client_session";
export type ClientSession = { userId: string; clientId: string; expiresAt: number; credentialTag: string };

export function createClientSessionToken(clientId: string, userId: string, passwordHash: string) {
  return createSession({ role: "client", subject: userId, clientId }, passwordHash);
}

// Signature validation only. API routes also need resolveClientSession to check the account.
export function parseClientSession(token: string | undefined): ClientSession | null {
  const claims = parseSession(token, "client");
  if (!claims) return null;
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuid.test(claims.subject) || !uuid.test(claims.clientId!)) return null;
  return { userId: claims.subject, clientId: claims.clientId!, expiresAt: claims.expiresAt, credentialTag: claims.credentialTag };
}
