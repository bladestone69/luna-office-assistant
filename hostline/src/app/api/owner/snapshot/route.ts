import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { getOwnerSnapshot } from "@/lib/store";

export async function GET() {
  if (!isOwnerAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getOwnerSnapshot());
}
