"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type SpeakProps = {
  sessionUrl: string;
  toolUrl: string;
  label?: string;
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
    description: "Book a time on the business diary. Time is Africa/Johannesburg.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        meeting_type: { type: "string" },
        start: { type: "string" },
        minutes: { type: "number" },
        notes: { type: "string" },
      },
      required: ["name", "start"],
    },
  },
];

export default function SpeakToGrok({ sessionUrl, toolUrl, label = "Speak to Grok" }: SpeakProps) {
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState("This session is with the owner, not a caller.");
  const [caption, setCaption] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  async function start() {
    const audio = new AudioContext();
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
        }, seen);
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
      if (message.type === "response.done") setStatus("Listening. Grok knows this is the owner.");
      const call = readToolCall(message);
      if (!call || seen.has(call.callId)) return;
      seen.add(call.callId);
      const toolResponse = await fetch(toolUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: call.name, args: call.args }),
      });
      const output = await toolResponse.json().catch(() => ({ ok: false }));
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

function readToolCall(message: any): { callId: string; name: string; args: any } | null {
  if (message?.type === "response.function_call_arguments.done" && message.name && message.call_id) {
    return { callId: message.call_id, name: message.name, args: parseArgs(message.arguments) };
  }
  const item = message?.item;
  if (message?.type === "response.output_item.done" && item?.type === "function_call" && item.name) {
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
