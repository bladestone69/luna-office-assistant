import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { humeAgents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isAdminApiRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, agentId } = await params;

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
      .update(humeAgents)
      .set({
        name,
        humeConfigId: configId,
        systemPrompt: systemPrompt || null,
        greetingScript: greetingScript || null,
        updatedAt: new Date(),
      })
      .where(and(eq(humeAgents.id, agentId), eq(humeAgents.clientId, id)))
      .returning();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

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
    console.error("[hume agents PUT]", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
