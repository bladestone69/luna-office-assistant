import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import { getDeskSnapshot, upsertAgent } from "@/lib/store";

const schema = z.object({
  name: z.string().min(1),
  xaiAgentId: z.string().optional(),
  phoneNumber: z.string().optional(),
  voice: z.string().optional(),
  systemPrompt: z.string().optional(),
  status: z.enum(["draft", "live", "paused"]).optional(),
  languages: z.array(z.string()).optional(),
});

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getDeskSnapshot().agent);
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated()) {
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

  const agent = upsertAgent(parsed.data);
  return NextResponse.json(agent);
}
