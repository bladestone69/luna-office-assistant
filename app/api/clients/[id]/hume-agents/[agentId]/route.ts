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
    const voiceProvider = body?.voiceProvider === "hume" ? "hume" : "grok";
    const grokVoice = typeof body?.grokVoice === "string" && body.grokVoice.trim() ? body.grokVoice.trim() : "eve";
    const grokInstructions = typeof body?.grokInstructions === "string" ? body.grokInstructions.trim() : "";

    if (!name || (voiceProvider === "hume" && !configId)) {
      return NextResponse.json({ error: "Agent name is required. Hume backup also needs a config ID." }, { status: 400 });
    }

    const [agent] = await db
      .update(humeAgents)
      .set({
        name,
        humeConfigId: configId || "hume-backup",
        systemPrompt: systemPrompt || null,
        greetingScript: greetingScript || null,
        voiceProvider,
        grokVoice,
        grokInstructions: grokInstructions || null,
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
      voiceProvider: agent.voiceProvider === "hume" ? "hume" : "grok",
      grokVoice: agent.grokVoice || "eve",
      grokInstructions: agent.grokInstructions ?? "",
      status: "active",
    });
  } catch (error) {
    console.error("[hume agents PUT]", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
