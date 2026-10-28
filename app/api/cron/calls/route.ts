import { NextRequest, NextResponse } from "next/server";
import { runDueCalls } from "@/lib/due-calls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await runDueCalls();
  return NextResponse.json({ ok: true, results });
}
