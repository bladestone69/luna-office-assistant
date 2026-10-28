import { NextRequest, NextResponse } from "next/server";
import { grokSipTwiml } from "@/lib/grok-call";

export async function GET(req: NextRequest) {
  return twiml(req);
}

export async function POST(req: NextRequest) {
  return twiml(req);
}

function twiml(req: NextRequest) {
  const greeting = req.nextUrl.searchParams.get("greeting") ?? "";
  const provider = req.nextUrl.searchParams.get("provider");
  const sipNumber = req.nextUrl.searchParams.get("sipNumber") ?? "";
  const humePhone = req.nextUrl.searchParams.get("humePhone") ?? "";
  const say = greeting ? `<Say>${escapeXml(greeting)}</Say>` : "";
  const dial = provider === "grok"
    ? (grokSipTwiml(sipNumber).match(/<Dial[\s\S]*<\/Dial>/)?.[0] ?? "")
    : `<Dial><Number>${escapeXml(humePhone)}</Number></Dial>`;
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${say}${dial}</Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;");
}
