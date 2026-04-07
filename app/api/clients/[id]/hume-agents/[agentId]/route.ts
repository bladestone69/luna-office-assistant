import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { humeAgents } from "@/db/schema";
import { isAdminApiRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; agentId: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = body.name?.trim();
    const configId = body.configId?.trim();

    if (!name || !configId) {
      return NextResponse.json(
        { error: "Agent name and Hume Config ID are required" },
        { status: 400 }
      );
    }

    const [agent] = await db
      .update(humeAgents)
      .set({
        name,
        humeConfigId: configId,
        systemPrompt: body.systemPrompt?.trim() || null,
        greetingScript: body.greetingScript?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(humeAgents.id, params.agentId), eq(humeAgents.clientId, params.id)))
      .returning();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: agent.id,
      clientId: agent.clientId,
      name: agent.name,
      configId: agent.humeConfigId,
      greetingScript: agent.greetingScript ?? "",
      systemPrompt: agent.systemPrompt ?? "",
      status: "active",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client hume agents PUT/${params.agentId}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
