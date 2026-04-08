import "server-only";

export const CLIENT_COOKIE = "vercelaura_client_session";

export type ClientSession = {
  userId: string;
  clientId: string;
  expiresAt: number;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export function createClientSessionToken(clientId: string, userId: string): string {
  const payload = `${userId}|${clientId}|${Date.now() + SESSION_TTL_MS}`;
  return Buffer.from(payload).toString("base64url");
}

export function parseClientSession(token: string | undefined): ClientSession | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, clientId, expiresAtRaw] = decoded.split("|");
    const expiresAt = Number(expiresAtRaw);

    if (!userId || !clientId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    return { userId, clientId, expiresAt };
  } catch {
    return null;
  }
}
