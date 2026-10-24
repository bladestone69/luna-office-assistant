import "server-only";

import { NextRequest } from "next/server";
import { CLIENT_COOKIE, parseClientSession, type ClientSession } from "@/lib/client-session";

export function readClientSession(request: NextRequest): ClientSession | null {
  return parseClientSession(request.cookies.get(CLIENT_COOKIE)?.value);
}
