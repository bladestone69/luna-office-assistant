import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { addClientBooking, addClientJob, changeClientDiary, loadClientDesk } from "@/lib/client-desk";
import { practiceBrief } from "@/lib/practice-presets";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_job",
      description: "Give Grok a job, such as a callback or a note to handle.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          details: { type: "string" },
          phone: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Put a meeting on this business diary. Any time of day or night in Africa/Johannesburg.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          meeting_type: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD in Africa/Johannesburg" },
          time: { type: "string", description: "HH:mm, 24 hour" },
          start: { type: "string", description: "Local date time, for example 2026-10-27T10:00" },
          minutes: { type: "number", description: "Ignored when meeting_type matches a visit type" },
          notes: { type: "string" },
          answers: { type: "string", description: "Practice question answers, one line each as Question: answer" },
        },
        required: ["name", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_call",
      description: "Phone someone at a set Johannesburg time and follow an instruction.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          instruction: { type: "string" },
        },
        required: ["name", "phone", "date", "time", "instruction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "change_diary",
      description: "Change or cancel an existing appointment or a call Grok must make. Never refuse. Match it by the current name, phone, or time.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["change", "cancel"] },
          what: { type: "string", enum: ["appointment", "call"] },
          name: { type: "string" },
          phone: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          new_phone: { type: "string" },
          new_name: { type: "string" },
          new_date: { type: "string" },
          new_time: { type: "string" },
          new_instruction: { type: "string" },
          meeting_type: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
];

export async function POST(request: NextRequest) {
  const session = readClientSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Grok is not connected to this desk yet. You can still save a brief and jobs. They apply as soon as the phone key is added." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const messages = incoming
    .filter((item: { role?: string; text?: string }) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
    .slice(-8)
    .map((item: { role: string; text: string }) => ({
      role: item.role,
      content: item.text.slice(0, 2000),
    }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }

  const desk = await loadClientDesk(session.clientId, session.userId);
  if (!desk) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const system = [
    `You are Grok, speaking with the owner ${desk.user.name} of ${desk.client.name} in a private web session.`,
    "This is not a phone call. The owner is not a client and not a caller.",
    "When a phone prompt is discussed, that prompt is for clients who call the business.",
    "Use only this desk. Do not invent bookings, messages, or calls.",
    "The trade, visit types, voice, and phone prompt are set by the admin. Do not offer to change them.",
    `Voice on the line: ${desk.line.voice}. Number: ${desk.line.number || "not assigned"}.`,
    `Current brief: ${desk.line.instructions || "none yet"}.`,
    `Opening line: ${desk.line.greeting || "none yet"}.`,
    desk.work,
    practiceBrief(desk.practice),
  ].join("\n");

  try {
    const first = await complete(apiKey, [
      { role: "system", content: system },
      ...messages,
    ], true);

    const toolCalls = first.tool_calls || [];
    if (!toolCalls.length) {
      return NextResponse.json({ reply: first.content || "I am here.", changed: false });
    }

    let changed = false;
    const toolMessages: { role: "tool"; tool_call_id: string; content: string }[] = [];
    for (const call of toolCalls) {
      const name = call.function?.name || "";
      const args = parseArgs(call.function?.arguments);
      const output = await runTool(session.clientId, name, args);
      if (output.ok) changed = true;
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(output),
      });
    }

    const second = await complete(apiKey, [
      { role: "system", content: system },
      ...messages,
      { role: "assistant", content: first.content || "", tool_calls: toolCalls },
      ...toolMessages,
    ], false);

    return NextResponse.json({ reply: second.content || "Done.", changed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grok could not answer";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function complete(apiKey: string, messages: unknown[], withTools: boolean) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4.20-0309-non-reasoning",
      temperature: 0.4,
      messages,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || "Grok could not answer");
  }
  const message = payload?.choices?.[0]?.message || {};
  return {
    content: typeof message.content === "string" ? message.content : "",
    tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
  };
}

function parseArgs(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

async function runTool(clientId: string, name: string, args: Record<string, unknown>) {
  try {
    if (name === "add_job") {
      const result = await addClientJob(clientId, {
        title: String(args.title || ""),
        details: String(args.details || ""),
        phone: String(args.phone || ""),
      });
      return { ok: true, jobId: result.id };
    }
    if (name === "book_appointment") {
      const id = await addClientBooking(clientId, {
        name: String(args.name || ""),
        phone: String(args.phone || ""),
        email: String(args.email || ""),
        meetingType: String(args.meeting_type || "Appointment"),
        start: String(args.start || args.start_iso || ""),
        date: String(args.date || ""),
        time: String(args.time || ""),
        notes: String(args.notes || ""),
        answers: String(args.answers || ""),
        minutes: Number(args.minutes),
      });
      return { ok: true, bookingId: id };
    }
    if (name === "schedule_call") {
      const who = String(args.name || "them");
      const date = String(args.date || "");
      const time = String(args.time || "");
      const result = await addClientJob(clientId, {
        title: `Call ${who}`,
        details: String(args.instruction || ""),
        phone: String(args.phone || ""),
        dueAt: date && time ? `${date}T${time}` : "",
        placeCall: true,
      });
      return { ok: true, jobId: result.id, saved: true };
    }
    if (name === "change_diary") {
      return await changeClientDiary(clientId, {
        action: String(args.action || "change"),
        what: String(args.what || ""),
        name: String(args.name || ""),
        phone: String(args.phone || ""),
        date: String(args.date || ""),
        time: String(args.time || ""),
        newPhone: String(args.new_phone || ""),
        newName: String(args.new_name || ""),
        newDate: String(args.new_date || ""),
        newTime: String(args.new_time || ""),
        newInstruction: String(args.new_instruction || ""),
        newMeetingType: String(args.meeting_type || ""),
      });
    }
    return { ok: false, error: "Unknown tool" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Tool failed" };
  }
}
