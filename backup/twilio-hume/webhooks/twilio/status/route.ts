import { NextRequest, NextResponse } from "next/server";
import * as callService from "@/services/callService";

// ─── Twilio Status Callback ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const entries = Object.fromEntries(body.entries());

    const callSid: string = entries.CallSid as string;
    const callStatus: string = entries.CallStatus as string;
    const duration: string = entries.CallDuration as string;

    console.log(`[twilio-status] sid=${callSid} status=${callStatus} duration=${duration ?? "n/a"}`);

    if (callStatus === "completed" && callSid) {
      const call = await callService.getCallByTwilioSid(callSid);
      if (call) {
        await callService.updateCall(call.id, {
          endedAt: new Date(),
          durationSeconds: duration ? parseInt(duration, 10) : 0,
          outcome: "completed",
        });
        // Sync transcript after short delay (gives Hume time to process)
        setTimeout(() => callService.syncHumeTranscript(call.id, callSid, call.clientId), 5000);
      }
    } else if (callStatus === "no_answer" || callStatus === "busy" || callStatus === "failed") {
      const call = await callService.getCallByTwilioSid(callSid);
      if (call) {
        await callService.updateCall(call.id, {
          endedAt: new Date(),
          outcome: callStatus === "no_answer" ? "missed" : "failed",
        });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error("[twilio-status] Error:", err.message);
    return new NextResponse(null, { status: 200 });
  }
}
