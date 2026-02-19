import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function enforceRateLimit(
  request: NextRequest,
  scope: string
): NextResponse | null {
  const ip = getRequestIp(request);
  const result = rateLimit(`${scope}:${ip}`);
  if (!result.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${result.retryAfterSec}s.` },
      { status: 429 }
    );
  }
  return null;
}

export function isHoneypotTriggered(website: unknown) {
  return typeof website === "string" && website.trim().length > 0;
}
