import { NextRequest, NextResponse } from "next/server";
import { getAdminClientDetail } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getAdminClientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("[client detail GET]", error);
    return NextResponse.json({ error: "Failed to load client details" }, { status: 500 });
  }
}
