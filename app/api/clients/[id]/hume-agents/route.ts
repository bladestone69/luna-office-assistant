import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, humeAgents } from "@/db/schema";
import { listClientHumeAgents } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agents = await listClientHumeAgents(params.id);
    return NextResponse.json(agents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client hume agents GET/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [client] = await db.select().from(clients).where(eq(clients.id, params.id)).limit(1);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

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
      .insert(humeAgents)
      .values({
        clientId: params.id,
        name,
        humeConfigId: configId,
        systemPrompt: body.systemPrompt?.trim() || null,
        greetingScript: body.greetingScript?.trim() || null,
      })
      .returning();

    return NextResponse.json(
      {
        id: agent.id,
        clientId: agent.clientId,
        name: agent.name,
        configId: agent.humeConfigId,
        greetingScript: agent.greetingScript ?? "",
        systemPrompt: agent.systemPrompt ?? "",
        status: "active",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[client hume agents POST/${params.id}] Error:`, message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
