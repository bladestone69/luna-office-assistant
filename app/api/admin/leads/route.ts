import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { listAdminLeads } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listAdminLeads();
    return NextResponse.json(items);
  } catch (error) {
    console.error("[admin leads GET]", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
