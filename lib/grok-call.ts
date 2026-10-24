import WebSocket from "ws";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, grokNumbers, humeAgents, leads, phoneNumbers } from "@/db/schema";
import { createPrivacySafeEvent, isSlotAvailable } from "@/lib/calendar";
import { DateTime } from "luxon";
import { APP_TIMEZONE } from "@/lib/constants";

export type GrokCallConfig = {
  clientId: string | null;
  businessName: string;
  voice: string;
  instructions: string;
  from: string;
  to: string;
};

const TOOLS = [
  {
    type: "function",
    name: "take_message",
    description: "Save a message from the caller when they want a callback or to leave a message.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        topic: { type: "string" },
        notes: { type: "string" },
      },
      required: ["phone", "topic"],
    },
  },
  {
    type: "function",
    name: "book_appointment",
    description: "Book a meeting in the business calendar. Times are Africa/Johannesburg unless the caller says otherwise.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        meeting_type: { type: "string" },
        start_iso: { type: "string", description: "ISO 8601 start time" },
        duration_minutes: { type: "number" },
        notes: { type: "string" },
      },
      required: ["name", "phone", "start_iso"],
    },
  },
];

export async function loadGrokConfigForNumber(toRaw: string, fromRaw: string): Promise<GrokCallConfig> {
  const to = normalizePhone(toRaw);
  const from = normalizePhone(fromRaw);
  let clientId: string | null = null;
  let businessName = "the business";
  let voice = "eve";
  let instructions = "";
  let greeting = "";

  if (to) {
    const [number] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.number, to)).limit(1);
    if (number) {
      clientId = number.clientId;
      const [client] = await db.select().from(clients).where(eq(clients.id, number.clientId)).limit(1);
      if (client?.name) businessName = client.name;
      if (number.humeAgentId) {
        const [agent] = await db.select().from(humeAgents).where(eq(humeAgents.id, number.humeAgentId)).limit(1);
        if (agent) {
          voice = agent.grokVoice || "eve";
          instructions = agent.grokInstructions || agent.systemPrompt || "";
          greeting = agent.greetingScript || "";
        }
      }
    }
  }

  if (!instructions) {
    const extra = clientId
      ? (await db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId)).limit(1))[0]
      : null;
    if (extra) {
      voice = extra.grokVoice || voice;
      instructions = extra.grokInstructions || extra.systemPrompt || "";
      greeting = extra.greetingScript || greeting;
    }
  }

  const base = instructions.trim() ||
    `You are the phone receptionist for ${businessName} in South Africa. ` +
    `Answer briefly, take a message with take_message, or book a time with book_appointment. ` +
    `Never invent an open slot. If booking fails, offer another time.`;

  const opening = greeting.trim()
    ? `Start the call by saying: ${greeting.trim()}\n`
    : "";

  return {
    clientId,
    businessName,
    voice,
    from,
    to,
    instructions: `${opening}${base}\nCaller number: ${from || "unknown"}. Business: ${businessName}. Times are Africa/Johannesburg.`,
  };
}

export function joinGrokSipCall(callId: string, config: GrokCallConfig): Promise<void> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("XAI_API_KEY is not set"));
  }

  return new Promise((resolve, reject) => {
    const url = `wss://api.x.ai/v1/realtime?call_id=${encodeURIComponent(callId)}&model=grok-voice-latest`;
    const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const timer = setTimeout(() => {
      ws.close();
    }, 280_000);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    ws.on("open", () => {
      ws.send(JSON.stringify({
        type: "session.update",
        session: {
          voice: config.voice || "eve",
          instructions: config.instructions,
          turn_detection: { type: "server_vad" },
          tools: TOOLS,
        },
      }));
      ws.send(JSON.stringify({ type: "response.create" }));
    });

    const seen = new Set<string>();
    ws.on("message", (data) => {
      void handleSocketMessage(ws, data.toString(), config, seen);
    });

    ws.on("close", finish);
    ws.on("error", (error) => {
      console.error("[grok-call]", error);
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    });
  });
}

async function handleSocketMessage(ws: WebSocket, raw: string, config: GrokCallConfig, seen: Set<string>) {
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }

  const call = extractFunctionCall(event);
  if (!call || seen.has(call.callId)) return;
  seen.add(call.callId);

  let output: unknown;
  try {
    output = await runTool(call.name, call.args, config);
  } catch (error) {
    output = { ok: false, error: error instanceof Error ? error.message : "Tool failed" };
  }

  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: call.callId,
      output: JSON.stringify(output),
    },
  }));
  ws.send(JSON.stringify({ type: "response.create" }));
}

function extractFunctionCall(event: any): { callId: string; name: string; args: any } | null {
  if (event?.type === "response.function_call_arguments.done" && event.name && event.call_id) {
    return { callId: event.call_id, name: event.name, args: parseArgs(event.arguments) };
  }
  const item = event?.item;
  if (event?.type === "response.output_item.done" && item?.type === "function_call" && item.name) {
    return { callId: item.call_id, name: item.name, args: parseArgs(item.arguments) };
  }
  return null;
}

function parseArgs(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

async function runTool(name: string, args: any, config: GrokCallConfig) {
  if (name === "take_message") {
    const phone = String(args.phone || config.from || "").trim();
    const topic = String(args.topic || "Message").trim();
    if (!phone) return { ok: false, error: "A phone number is required" };
    if (!config.clientId) return { ok: false, error: "This phone line is not assigned to a client" };
    const [lead] = await db.insert(leads).values({
      clientId: config.clientId,
      name: String(args.name || "").trim() || null,
      phone,
      email: String(args.email || "").trim() || null,
      topic,
      notes: String(args.notes || "").trim() || null,
      source: "phone_call",
      status: "new",
    }).returning({ id: leads.id });
    return { ok: true, leadId: lead.id };
  }

  if (name === "book_appointment") {
    const start = DateTime.fromISO(String(args.start_iso || ""), { zone: APP_TIMEZONE });
    if (!start.isValid) return { ok: false, error: "Invalid start time" };
    const minutes = Number(args.duration_minutes) > 0 ? Number(args.duration_minutes) : 30;
    const end = start.plus({ minutes });
    const free = await isSlotAvailable(start.toISO()!, end.toISO()!);
    if (!free) return { ok: false, error: "That time is already booked" };
    const id = await createPrivacySafeEvent({
      name: String(args.name || "Caller"),
      phone: String(args.phone || config.from || ""),
      email: String(args.email || ""),
      meetingTypeLabel: String(args.meeting_type || "Appointment"),
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      clientId: config.clientId,
      notes: String(args.notes || ""),
      consent: true,
    });
    return { ok: true, bookingId: id, start: start.toISO(), end: end.toISO() };
  }

  return { ok: false, error: `Unknown tool ${name}` };
}

export function grokSipTwiml(phoneNumber: string) {
  const user = normalizePhone(phoneNumber).replace(/[^\d+]/g, "");
  const uri = `sip:${user}@sip.voice.x.ai;transport=tls`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial answerOnBridge="true"><Sip>${escapeXml(uri)}</Sip></Dial></Response>`;
}

export function normalizePhone(value: string) {
  const match = String(value || "").match(/\+\d{8,15}/);
  if (match) return match[0];
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

export async function findGrokNumber(phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const [row] = await db.select().from(grokNumbers).where(eq(grokNumbers.phoneNumber, normalized)).limit(1);
  return row ?? null;
}
