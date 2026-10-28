import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { clients, phoneNumbers } from "@/db/schema";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/grok-call";
import { placeOutboundCall } from "@/lib/place-call";

async function authenticate(req: NextRequest) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await authenticate(req);
  if (authError) return authError;

  let body: { clientId?: string; to?: string; greeting?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, to, greeting } = body;
  if (!clientId || !to) {
    return NextResponse.json({ error: "clientId and to (phone number) are required" }, { status: 400 });
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const [line] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, clientId)).limit(1);
  const from = normalizePhone(line?.number || "");
  const call = await placeOutboundCall({
    to,
    from,
    greeting: greeting || "",
  });
  if (!call.ok) return NextResponse.json({ error: call.error }, { status: 400 });
  return NextResponse.json({ success: true, callSid: call.callSid });
}
