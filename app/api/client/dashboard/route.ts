import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { calls, clientUsers, clients, contacts, humeAgents, leads, phoneNumbers } from "@/db/schema";
import { CLIENT_COOKIE, parseClientSession } from "@/lib/client-session";

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function labelFromDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatLeadSource(value: string | null | undefined) {
  switch (value) {
    case "phone_call":
      return "Phone call";
    case "web":
      return "Website";
    case "referral":
      return "Referral";
    case "manual":
      return "Manual";
    default:
      return "Unknown";
  }
}

function formatLeadStatus(value: string | null | undefined) {
  if (!value) {
    return "new";
  }

  return value.replace(/_/g, " ");
}

export async function GET(request: NextRequest) {
  const session = parseClientSession(request.cookies.get(CLIENT_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [clientRow] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, session.clientId))
    .limit(1);

  if (!clientRow) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [userRow] = await db
    .select()
    .from(clientUsers)
    .where(and(eq(clientUsers.id, session.userId), eq(clientUsers.clientId, session.clientId)))
    .limit(1);

  if (!userRow) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userRows, agentRows, numberRows, leadRows, callRows] = await Promise.all([
    db.select().from(clientUsers).where(eq(clientUsers.clientId, session.clientId)).orderBy(desc(clientUsers.createdAt)),
    db.select().from(humeAgents).where(eq(humeAgents.clientId, session.clientId)).orderBy(desc(humeAgents.createdAt)),
    db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, session.clientId)).orderBy(desc(phoneNumbers.createdAt)),
    db.select().from(leads).where(eq(leads.clientId, session.clientId)).orderBy(desc(leads.createdAt)),
    db.select().from(calls).where(eq(calls.clientId, session.clientId)).orderBy(desc(calls.startedAt)),
  ]);

  const contactIds = [
    ...new Set(callRows.map((row) => row.contactId).filter((value): value is string => Boolean(value))),
  ];
  const contactRows = contactIds.length
    ? await db.select().from(contacts).where(inArray(contacts.id, contactIds))
    : [];
  const contactsById = new Map(contactRows.map((row) => [row.id, row]));

  const recentCalls = callRows.slice(0, 10).map((row) => {
    const contact = row.contactId ? contactsById.get(row.contactId) : null;
    return {
      id: row.id,
      name: contact?.name || contact?.phoneE164 || "Unknown caller",
      number: contact?.phoneE164 || "Unknown number",
      startedAt: iso(row.startedAt),
      timeLabel: labelFromDate(row.startedAt),
      outcome: row.outcome || "unknown",
      durationSeconds: row.durationSeconds || 0,
    };
  });

  const recentLeads = leadRows.slice(0, 10).map((row) => ({
    id: row.id,
    name: row.name || row.phone,
    phone: row.phone,
    topic: row.topic,
    status: formatLeadStatus(row.status),
    source: formatLeadSource(row.source),
    createdAt: iso(row.createdAt),
    timeLabel: labelFromDate(row.createdAt),
  }));

  const primaryNumber =
    numberRows.find((row) => row.label === "primary")?.number || numberRows[0]?.number || "";

  return NextResponse.json({
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      clientId: userRow.clientId,
      role: userRow.role || "agent",
    },
    client: {
      id: clientRow.id,
      name: clientRow.name,
      email: clientRow.email,
      phone: clientRow.phone || "",
      plan: clientRow.plan || "starter",
      status: clientRow.status || "active",
      industry: clientRow.industry || "",
    },
    stats: {
      missedCalls: callRows.filter((row) => row.outcome === "missed").length,
      newLeads: leadRows.length,
      totalCalls: callRows.length,
    },
    recentCalls,
    recentLeads,
    ai: {
      active: agentRows.length > 0,
      agentCount: agentRows.length,
      phoneNumberCount: numberRows.length,
      primaryNumber,
      hasTrello: leadRows.some((row) => Boolean(row.trelloCardId)),
    },
    team: {
      memberCount: userRows.length,
    },
  });
}
