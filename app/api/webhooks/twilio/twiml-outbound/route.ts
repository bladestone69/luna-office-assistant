import { NextRequest, NextResponse } from "next/server";

// Returns TwiML that greets then connects the call to Hume EVI
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const greeting = searchParams.get("greeting") ?? "Please hold while I connect you.";
  const humePhone = searchParams.get("humePhone") ?? "";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Dial record="record-from-ringing" recordingStatusCallback="${process.env.APP_URL ?? "https://www.auraoffice.xyz"}/api/webhooks/twilio/recording">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${process.env.APP_URL ?? "https://www.auraoffice.xyz"}/api/webhooks/twilio/status">${humePhone}</Number>
  </Dial>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
