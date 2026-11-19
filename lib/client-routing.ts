import "server-only";

import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { clients, grokNumbers, phoneNumbers } from "@/db/schema";
import { normalizePhone } from "@/lib/grok-call";
import { getPractice } from "@/lib/practice";

export type PublicClientConfig = {
  clientId: string;
  name: string;
  slug: string;
  notificationEmail: string;
  meetingTypes: { key: string; label: string; durationMinutes: number }[];
  openingHour: number;
  closingHour: number;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function makeClientSlug(name: string) {
  return slugify(name) || "client";
}

function requestNumber(request: NextRequest, body?: unknown) {
  const candidate =
    request.headers.get("x-aura-number") ||
    request.headers.get("x-inbound-number") ||
    request.headers.get("x-called-number") ||
    request.nextUrl.searchParams.get("number") ||
    (body && typeof body === "object" && typeof (body as any).inboundNumber === "string" ? (body as any).inboundNumber : "");
  return normalizePhone(candidate || "");
}

export async function resolvePublicClient(request: NextRequest, body?: unknown): Promise<PublicClientConfig | null> {
  const slug = (
    request.nextUrl.searchParams.get("slug") ||
    request.nextUrl.searchParams.get("client") ||
    (body && typeof body === "object" && typeof (body as any).slug === "string" ? (body as any).slug : "")
  ).trim().toLowerCase();

  let clientId = "";
  if (slug) {
    const [client] = await db.select({ id: clients.id }).from(clients)
      .where(and(eq(clients.slug, slug), eq(clients.status, "active"))).limit(1);
    clientId = client?.id || "";
  }

  if (!clientId) {
    const number = requestNumber(request, body);
    if (number) {
      const [direct] = await db.select({ clientId: phoneNumbers.clientId }).from(phoneNumbers)
        .where(and(eq(phoneNumbers.number, number), eq(phoneNumbers.isActive, true))).limit(1);
      clientId = direct?.clientId || "";
      if (!clientId) {
        const [grok] = await db.select({ clientId: grokNumbers.clientId }).from(grokNumbers)
          .where(eq(grokNumbers.phoneNumber, number)).limit(1);
        clientId = grok?.clientId || "";
      }
    }
  }

  if (!clientId) return null;
  const [client] = await db.select().from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.status, "active"))).limit(1);
  if (!client) return null;

  const practice = await getPractice(client.id);
  return {
    clientId: client.id,
    name: client.name,
    slug: client.slug || "",
    notificationEmail: client.notificationEmail || client.email,
    meetingTypes: practice.visitTypes.map((item) => ({
      key: slugify(item.name),
      label: item.name,
      durationMinutes: item.minutes,
    })),
    openingHour: practice.openingHour,
    closingHour: practice.closingHour,
  };
}

export function findMeetingType(config: PublicClientConfig, value: string) {
  const needle = value.trim().toLowerCase();
  return config.meetingTypes.find((item) => item.key === needle || item.label.toLowerCase() === needle) || null;
}
