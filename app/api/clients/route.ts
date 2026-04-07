import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { listAdminClients } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allClients = await listAdminClients();
    return NextResponse.json(allClients);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[clients GET] Error:", message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || null;
    const industry = body.industry?.trim() || null;
    const plan = body.plan === "pro" ? "pro" : "starter";

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await db
      .insert(clients)
      .values({
        name,
        email,
        phone,
        industry,
        plan,
      })
      .returning();

    const summaries = await listAdminClients();
    const created = summaries.find((client) => client.contactEmail === email && client.name === name);

    return NextResponse.json(created ?? summaries[0] ?? null, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[clients POST] Error:", message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
