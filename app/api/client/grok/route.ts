import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import {
  addGrokPrompt,
  deleteGrokPrompt,
  getGrokSetup,
  makeDefaultPrompt,
  saveGrokVoice,
  updateGrokPrompt,
} from "@/lib/grok-setup";

async function act(clientId: string, body: any) {
  const action = typeof body?.action === "string" ? body.action : "";
  if (action === "voice") {
    await saveGrokVoice(clientId, String(body?.voice || "eve"), String(body?.greeting || ""));
    return;
  }
  if (action === "add-prompt") {
    await addGrokPrompt(clientId, String(body?.name || ""), String(body?.body || ""), body?.makeDefault === true);
    return;
  }
  if (action === "update-prompt") {
    if (!(await updateGrokPrompt(clientId, String(body?.promptId || ""), String(body?.name || ""), String(body?.body || "")))) {
      throw new Error("Prompt not found");
    }
    return;
  }
  if (action === "delete-prompt") {
    if (!(await deleteGrokPrompt(clientId, String(body?.promptId || "")))) throw new Error("Prompt not found");
    return;
  }
  if (action === "default-prompt") {
    if (!(await makeDefaultPrompt(clientId, String(body?.promptId || "")))) throw new Error("Prompt not found");
    return;
  }
  throw new Error("Unknown setup action");
}

export async function GET(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getGrokSetup(session.clientId));
}

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  try {
    await act(session.clientId, body);
    return NextResponse.json(await getGrokSetup(session.clientId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save Grok setup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
