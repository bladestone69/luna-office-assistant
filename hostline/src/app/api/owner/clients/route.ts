import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { createClient, getOwnerSnapshot, updateClient } from "@/lib/store";

const createSchema = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(5),
  loginEmail: z.string().email(),
  password: z.string().min(4),
  planId: z.enum(["starter", "practice", "firm"]),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2).optional(),
  industry: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(5).optional(),
  loginEmail: z.string().email().optional(),
  password: z.string().min(4).optional(),
  planId: z.enum(["starter", "practice", "firm"]).optional(),
  status: z.enum(["onboarding", "live", "paused", "churned"]).optional(),
  billingStatus: z.enum(["trial", "active", "past_due", "paused", "churned"]).optional(),
  notes: z.string().optional(),
  minutesUsed: z.number().optional(),
  minutesIncluded: z.number().optional(),
});

export async function GET() {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getOwnerSnapshot().clients);
}

export async function POST(req: NextRequest) {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid client", details: parsed.error.flatten() }, { status: 400 });
  }
  const client = createClient(parsed.data);
  return NextResponse.json(client, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const { clientId, ...patch } = parsed.data;
  const updated = updateClient(clientId, patch);
  if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(updated);
}
