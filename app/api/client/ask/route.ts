import { NextRequest, NextResponse } from "next/server";
import { readClientSession } from "@/lib/client-access";
import { addClientBooking, addClientJob, loadClientDesk, saveClientBrief } from "@/lib/client-desk";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "save_brief",
      description: "Save how Grok should answer the phone for this business.",
      parameters: {
        type: "object",
        properties: {
          instructions: { type: "string" },
          greeting: { type: "string" },
          voice: { type: "string", enum: ["eve", "ara", "rex", "sal"] },
        },
        required: ["instructions"],
      },
    },
  },
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
      description: "Put a meeting on this business diary. Time is Africa/Johannesburg, 08:00 to 17:00.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          meeting_type: { type: "string" },
          start: { type: "string", description: "Local date time, for example 2026-10-27T10:00" },
          minutes: { type: "number" },
          notes: { type: "string" },
        },
        required: ["name", "start"],
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
    `You are Grok, the receptionist and personal assistant for ${desk.client.name}.`,
    `The person signed in is ${desk.user.name}.`,
    "Use only this desk. Do not invent bookings, messages, or calls.",
    "When they ask you to book, brief the phone agent, or take a job, call the matching tool.",
    `Voice on the line: ${desk.line.voice}. Number: ${desk.line.number || "not assigned"}.`,
    `Current brief: ${desk.line.instructions || "none yet"}.`,
    `Opening line: ${desk.line.greeting || "none yet"}.`,
    desk.work,
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
      const output = await runTool(session.clientId, name, args, desk.line);
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

async function runTool(
  clientId: string,
  name: string,
  args: Record<string, unknown>,
  line: { instructions: string; greeting: string; voice: string },
) {
  try {
    if (name === "save_brief") {
      await saveClientBrief(clientId, {
        instructions: String(args.instructions || line.instructions || ""),
        greeting: String(args.greeting || line.greeting || ""),
        voice: String(args.voice || line.voice || "eve"),
      });
      return { ok: true, saved: "brief" };
    }
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
        start: String(args.start || ""),
        notes: String(args.notes || ""),
        minutes: Number(args.minutes),
      });
      return { ok: true, bookingId: id };
    }
    return { ok: false, error: "Unknown tool" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Tool failed" };
  }
}
