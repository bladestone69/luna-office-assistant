"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type SpeakProps = {
  sessionUrl: string;
  toolUrl: string;
  label?: string;
  onResult?: (result: { ok: boolean; message: string }) => void;
};

const TOOLS = [
  {
    type: "function",
    name: "add_job",
    description: "Save a job for the business.",
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
  {
    type: "function",
    name: "book_appointment",
    description: "Write the appointment onto the diary. Saying it out loud does not save it. Call this as soon as the owner confirms the person, day, and time. Tell the owner it is saved only when the result says saved true.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Who the appointment is for" },
        date: { type: "string", description: "Day in Africa/Johannesburg, YYYY-MM-DD" },
        time: { type: "string", description: "Start time, 24-hour HH:mm, any time of day or night" },
        minutes: { type: "number", description: "Leave unset. The visit type sets the length." },
        phone: { type: "string" },
        meeting_type: { type: "string", description: "Exact visit type name from the practice setup" },
        notes: { type: "string" },
        answers: { type: "string", description: "Practice question answers, one line each as Question: answer" },
      },
      required: ["name", "date", "time"],
    },
  },
  {
    type: "function",
    name: "schedule_call",
    description: "Tell Grok to phone someone at a set time and follow an instruction. This saves the job. Grok places the call when that time arrives.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Who to call" },
        phone: { type: "string", description: "Their number" },
        date: { type: "string", description: "YYYY-MM-DD in Johannesburg" },
        time: { type: "string", description: "HH:mm, 24 hour, any time of day" },
        instruction: { type: "string", description: "What Grok must say or ask on the call" },
      },
      required: ["name", "phone", "date", "time", "instruction"],
    },
  },
];

export default function SpeakToGrok({ sessionUrl, toolUrl, label = "Speak to Grok", onResult }: SpeakProps) {
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState("This session is with the owner, not a caller.");
  const [caption, setCaption] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const holdRef = useRef(false);

  useEffect(() => () => stopRef.current?.(), []);

  async function start() {
    const audio = new AudioContext();
    holdRef.current = false;
    setStatus("Connecting");
    setCaption("");
    try {
      const response = await fetch(sessionUrl, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        await audio.close();
        setStatus(data.error || "Could not start");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ws = new WebSocket("wss://api.x.ai/v1/realtime?model=grok-voice-latest", [`xai-client-secret.${data.token}`]);
      socketRef.current = ws;
      const seen = new Set<string>();
      const names = new Map<string, string>();
      let started = false;
      let nextTime = 0;

      const stop = () => {
        stopRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
        void audio.close();
        socketRef.current = null;
        setLive(false);
        setStatus("Session ended. That was the owner, not a caller.");
      };
      stopRef.current = stop;

      ws.onopen = () => setLive(true);
      ws.onerror = () => setStatus("The voice session failed");
      ws.onclose = () => {
        if (stopRef.current) stop();
      };
      ws.onmessage = (event) => {
        void handleMessage(String(event.data), data, ws, () => {
          if (started) return;
          started = true;
          setStatus("Listening. Grok knows this is the owner.");
          void startMic(audio, stream, ws);
          ws.send(JSON.stringify({ type: "response.create" }));
        }, (delta) => {
          nextTime = playPcm(audio, delta, nextTime);
          setStatus("Grok is speaking with the owner");
        }, seen, names);
      };
    } catch (error) {
      await audio.close().catch(() => undefined);
      setLive(false);
      setStatus(error instanceof Error ? error.message : "Microphone blocked");
    }

    async function handleMessage(
      raw: string,
      session: { voice: string; instructions: string },
      socket: WebSocket,
      onReady: () => void,
      onAudio: (delta: string) => void,
      seen: Set<string>,
      names: Map<string, string>,
    ) {
      let message: any;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }
      if (message.type === "session.created") {
        socket.send(JSON.stringify({
          type: "session.update",
          session: {
            voice: session.voice || "eve",
            instructions: session.instructions,
            turn_detection: { type: "server_vad" },
            tools: TOOLS,
            audio: {
              input: { format: { type: "audio/pcm", rate: 24000 } },
              output: { format: { type: "audio/pcm", rate: 24000 } },
            },
          },
        }));
      }
      if (message.type === "session.updated") onReady();
      if (message.type === "response.output_audio.delta" || message.type === "response.audio.delta") {
        const delta = message.delta || message.audio;
        if (typeof delta === "string") onAudio(delta);
      }
      if (message.type === "response.output_audio_transcript.delta" && message.delta) {
        setCaption((current) => `${current} ${message.delta}`.trim().slice(-280));
      }
      if (message.type === "response.done" && !holdRef.current && !functionItems(message).length) {
        setStatus("Listening. Grok knows this is the owner.");
      }
      const call = readToolCall(message, names);
      if (!call || seen.has(call.callId)) return;
      seen.add(call.callId);
      setStatus(call.name === "book_appointment" ? "Saving the appointment" : call.name === "schedule_call" ? "Saving the call" : "Saving");
      const toolResponse = await fetch(toolUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: call.name, args: call.args }),
      });
      const output = await toolResponse.json().catch(() => ({ ok: false, saved: false, message: "Not saved." }));
      const saved = output.saved === true || output.ok === true;
      const text = String(output.message || output.error || (saved ? "Saved." : "Not saved."));
      holdRef.current = true;
      setStatus(text);
      onResult?.({ ok: saved, message: text });
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: call.callId, output: JSON.stringify(output) },
      }));
      socket.send(JSON.stringify({ type: "response.create" }));
    }
  }

  return (
    <div>
      <button type="button" onClick={() => (live ? stopRef.current?.() : void start())} style={buttonStyle(live)}>
        {live ? "End session" : label}
      </button>
      <p style={{ margin: "8px 0 0", color: "#d6a86c", fontSize: 13 }}>{status}</p>
      {caption ? <p style={{ margin: "6px 0 0", color: "#d5e2ee", fontSize: 14 }}>{caption}</p> : null}
    </div>
  );
}

function buttonStyle(live: boolean): CSSProperties {
  return {
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    font: "inherit",
    fontWeight: 650,
    cursor: "pointer",
    background: live ? "#8f3d3d" : "#d6a86c",
    color: "#071018",
  };
}

async function startMic(audio: AudioContext, stream: MediaStream, ws: WebSocket) {
  await audio.audioWorklet.addModule("/grok-mic-processor.js");
  const source = audio.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(audio, "grok-mic");
  const mute = audio.createGain();
  mute.gain.value = 0;
  let pending: number[] = [];
  const rate = audio.sampleRate;
  node.port.onmessage = (event) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const chunk = event.data as Float32Array;
    for (let i = 0; i < chunk.length; i++) pending.push(chunk[i]);
    const hop = Math.floor(rate * 0.1);
    if (pending.length < hop) return;
    const slice = pending.slice(0, hop);
    pending = pending.slice(hop);
    const pcm = resample(Float32Array.from(slice), rate, 24000);
    ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm16(pcm) }));
  };
  source.connect(node);
  node.connect(mute);
  mute.connect(audio.destination);
  if (audio.state === "suspended") await audio.resume();
}

function resample(input: Float32Array, from: number, to: number) {
  if (from === to) return input;
  const ratio = from / to;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, input.length - 1);
    const mix = pos - left;
    out[i] = input[left] * (1 - mix) + input[right] * mix;
  }
  return out;
}

function pcm16(samples: Float32Array) {
  const view = new DataView(new ArrayBuffer(samples.length * 2));
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  const bytes = new Uint8Array(view.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function playPcm(audio: AudioContext, b64: string, nextTime: number) {
  const binary = atob(b64);
  const samples = new Float32Array(binary.length / 2);
  for (let i = 0; i < samples.length; i++) {
    const lo = binary.charCodeAt(i * 2);
    const hi = binary.charCodeAt(i * 2 + 1);
    let value = lo | (hi << 8);
    if (value & 0x8000) value -= 0x10000;
    samples[i] = value / 0x8000;
  }
  const buffer = audio.createBuffer(1, samples.length, 24000);
  buffer.copyToChannel(samples, 0);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  const start = Math.max(audio.currentTime + 0.05, nextTime);
  source.start(start);
  return start + buffer.duration;
}

function readToolCall(message: any, names: Map<string, string>): { callId: string; name: string; args: Record<string, unknown> } | null {
  if (message?.type === "response.function_call_arguments.done") {
    const callId = String(message.call_id || message.item_id || "");
    const name = String(message.name || names.get(callId) || "");
    const args = parseArgs(message.arguments);
    if (!callId || !name || !args) return null;
    names.set(callId, name);
    return { callId, name, args };
  }

  for (const item of functionItems(message)) {
    const callId = String(item.call_id || item.id || "");
    const name = String(item.name || item.function?.name || (callId ? names.get(callId) : "") || "");
    if (callId && name) names.set(callId, name);
    const raw = item.arguments;
    if (typeof raw === "string" && (!raw.trim() || raw.trim() === "{}")) continue;
    const args = parseArgs(raw);
    if (!callId || !name || !args || !Object.keys(args).length) continue;
    return { callId, name, args };
  }
  return null;
}

function functionItems(message: any) {
  const items: any[] = [];
  if (message?.item) items.push(message.item);
  if (Array.isArray(message?.response?.output)) items.push(...message.response.output);
  return items.filter((item) => item && (item.type === "function_call" || item.type === "function"));
}

function parseArgs(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
