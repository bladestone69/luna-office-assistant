import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { upsertClientAgent } from "@/lib/store";

const schema = z.object({
  clientId: z.string().min(1),
  name: z.string().optional(),
  xaiAgentId: z.string().optional(),
  phoneNumber: z.string().optional(),
  voice: z.string().optional(),
  systemPrompt: z.string().optional(),
  greetingScript: z.string().optional(),
  status: z.enum(["draft", "live", "paused"]).optional(),
  languages: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest) {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid agent payload" }, { status: 400 });
  }
  const { clientId, ...patch } = parsed.data;
  const agent = upsertClientAgent(clientId, patch);
  return NextResponse.json(agent);
}
