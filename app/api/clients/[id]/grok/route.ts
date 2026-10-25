import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import {
  addGrokPrompt,
  cleanAudience,
  deleteGrokPrompt,
  getGrokSetup,
  makeDefaultPrompt,
  saveGrokVoice,
  updateGrokPrompt,
} from "@/lib/grok-setup";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await getGrokSetup(id));
  } catch (error) {
    console.error("[grok setup]", error);
    return NextResponse.json({ error: "Could not load Grok setup" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminApiRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "voice") {
      await saveGrokVoice(id, String(body?.voice || "eve"), String(body?.greeting || ""));
    } else if (action === "add-prompt") {
      await addGrokPrompt(id, String(body?.name || ""), String(body?.body || ""), body?.makeDefault === true, cleanAudience(body?.audience));
    } else if (action === "update-prompt") {
      const saved = await updateGrokPrompt(id, String(body?.promptId || ""), String(body?.name || ""), String(body?.body || ""));
      if (!saved) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    } else if (action === "delete-prompt") {
      const saved = await deleteGrokPrompt(id, String(body?.promptId || ""));
      if (!saved) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    } else if (action === "default-prompt") {
      const saved = await makeDefaultPrompt(id, String(body?.promptId || ""));
      if (!saved) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Unknown setup action" }, { status: 400 });
    }
    return NextResponse.json(await getGrokSetup(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save Grok setup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
