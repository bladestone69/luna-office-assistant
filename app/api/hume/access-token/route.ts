import { fetchAccessToken } from "hume";
import { NextRequest, NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/auth";
import { fail, enforceRateLimit } from "@/lib/api";
import { optionalEnv, requiredEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(request, "hume-access-token");
  if (limited) return limited;

  try {
    const accessToken = await fetchAccessToken({
      apiKey: requiredEnv("HUME_API_KEY"),
      secretKey: requiredEnv("HUME_SECRET_KEY"),
      host: optionalEnv("HUME_API_HOST", "api.hume.ai")
    });

    return NextResponse.json({
      accessToken,
      configId: requiredEnv("HUME_CONFIG_ID"),
      configVersion: optionalEnv("HUME_CONFIG_VERSION")
    });
  } catch {
    return fail("Unable to create Hume access token.", 500);
  }
}
