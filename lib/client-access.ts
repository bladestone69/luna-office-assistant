import "server-only";
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, clientUsers } from "@/db/schema";
import { CLIENT_COOKIE, parseClientSession, type ClientSession } from "@/lib/client-session";
import { credentialTag } from "@/lib/session";

export async function resolveClientSession(token: string | undefined): Promise<ClientSession | null> {
  const session = parseClientSession(token);
  if (!session) return null;
  const [account] = await db.select({ passwordHash: clientUsers.passwordHash })
    .from(clientUsers).innerJoin(clients, eq(clients.id, clientUsers.clientId))
    .where(and(eq(clientUsers.id, session.userId), eq(clientUsers.clientId, session.clientId), eq(clients.status, "active")))
    .limit(1);
  if (!account || credentialTag(account.passwordHash) !== session.credentialTag) return null;
  return session;
}

export function readClientSession(request: NextRequest) {
  return resolveClientSession(request.cookies.get(CLIENT_COOKIE)?.value);
}
