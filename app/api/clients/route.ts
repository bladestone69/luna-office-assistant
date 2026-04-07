import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";
import { getAdminClientDetail, listAdminClients } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
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
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
    const phone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
    const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
    const plan = body?.plan === "pro" ? "pro" : "starter";

    if (!name || !email) {
      return NextResponse.json({ error: "Company name and contact email are required" }, { status: 400 });
    }

    const [client] = await db
      .insert(clients)
      .values({
        name,
        email,
        phone: phone || null,
        industry: industry || null,
        plan,
      })
      .returning();

    const detail = await getAdminClientDetail(client.id);
    return NextResponse.json(detail?.client ?? null, { status: 201 });
  } catch (error) {
    console.error("[clients POST]", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
