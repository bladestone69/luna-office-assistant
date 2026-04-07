import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { humeAgents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminClientDetail } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getAdminClientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(detail.humeAgents);
  } catch (error) {
    console.error("[hume agents GET]", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const configId = typeof body?.configId === "string" ? body.configId.trim() : "";
    const systemPrompt = typeof body?.systemPrompt === "string" ? body.systemPrompt.trim() : "";
    const greetingScript = typeof body?.greetingScript === "string" ? body.greetingScript.trim() : "";

    if (!name || !configId) {
      return NextResponse.json({ error: "Agent name and config ID are required" }, { status: 400 });
    }

    const [agent] = await db
      .insert(humeAgents)
      .values({
        clientId: id,
        name,
        humeConfigId: configId,
        systemPrompt: systemPrompt || null,
        greetingScript: greetingScript || null,
      })
      .returning();

    return NextResponse.json({
      id: agent.id,
      clientId: agent.clientId,
      name: agent.name,
      configId: agent.humeConfigId,
      systemPrompt: agent.systemPrompt ?? "",
      greetingScript: agent.greetingScript ?? "",
      status: "active",
    });
  } catch (error) {
    console.error("[hume agents POST]", error);
    return NextResponse.json({ error: "Failed to save agent" }, { status: 500 });
  }
}
