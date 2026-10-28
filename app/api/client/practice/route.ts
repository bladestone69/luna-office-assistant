import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Only the admin can change the trade, visit types, and questions." },
    { status: 403 },
  );
}
