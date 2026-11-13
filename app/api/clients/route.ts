import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, grokNumbers, phoneNumbers } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { makeClientSlug } from "@/lib/client-routing";
import { isAdminApiRequest } from "@/lib/auth";
import { getAdminClientDetail, listAdminClients } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  if (!(await isAdminApiRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listAdminClients();
    return NextResponse.json(items);
  } catch (error) {
    console.error("[clients GET]", error);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminApiRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
    const phone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
    const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
    const plan = body?.plan === "pro" ? "pro" : "starter";
    const lineId = typeof body?.lineId === "string" ? body.lineId.trim() : "";

    if (!name || !email || !lineId) {
      return NextResponse.json({ error: "Company name, contact email, and an available VoIP number are required" }, { status: 400 });
    }

    const [line] = await db.select().from(grokNumbers)
      .where(and(eq(grokNumbers.id, lineId), isNull(grokNumbers.clientId))).limit(1);
    if (!line) {
      return NextResponse.json({ error: "That VoIP number is no longer available" }, { status: 409 });
    }

    const baseSlug = makeClientSlug(name);
    let slug = baseSlug;
    for (let suffix = 2; suffix < 100; suffix += 1) {
      const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, slug)).limit(1);
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const client = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(clients)
        .values({
          name,
          email,
          notificationEmail: email,
          slug,
          phone: phone || null,
          industry: industry || null,
          plan,
        })
        .returning();

      const [claimed] = await tx.update(grokNumbers)
        .set({ clientId: created.id })
        .where(and(eq(grokNumbers.id, lineId), isNull(grokNumbers.clientId)))
        .returning({ id: grokNumbers.id, number: grokNumbers.phoneNumber });
      if (!claimed) throw new Error("LINE_TAKEN");

      await tx.insert(phoneNumbers).values({
        clientId: created.id,
        number: claimed.number,
        label: "primary",
        isActive: true,
      });
      return created;
    });

    const detail = await getAdminClientDetail(client.id);
    return NextResponse.json(detail?.client ?? null, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "LINE_TAKEN") {
      return NextResponse.json({ error: "That VoIP number was assigned to another client. Choose another." }, { status: 409 });
    }
    console.error("[clients POST]", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
