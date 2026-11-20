import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { getOwnerSnapshot, markInvoicePaid } from "@/lib/store";

export async function GET() {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snap = getOwnerSnapshot();
  return NextResponse.json({ invoices: snap.invoices, plans: snap.plans, metrics: snap.metrics });
}

const paySchema = z.object({ invoiceId: z.string().min(1) });

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
  const parsed = paySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }
  const inv = markInvoicePaid(parsed.data.invoiceId);
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json(inv);
}
