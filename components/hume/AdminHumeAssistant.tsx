"use client";

import { FormEvent, useMemo, useState } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

type AccessTokenResponse = {
  accessToken: string;
  configId: string;
  configVersion?: string;
  error?: string;
};

type VoiceMessage = ReturnType<typeof useVoice>["messages"][number];
type TranscriptMessage = Extract<
  VoiceMessage,
  { type: "assistant_message" | "user_message" }
>;

function isTranscriptMessage(message: VoiceMessage): message is TranscriptMessage {
  return message.type === "assistant_message" || message.type === "user_message";
}

function AssistantPanel() {
  const {
    connect,
    disconnect,
    clearMessages,
    messages,
    isMuted,
    mute,
    unmute,
    isAudioMuted,
    muteAudio,
    unmuteAudio,
    sendUserInput,
    status,
    error,
    callDurationTimestamp,
    readyState
  } = useVoice();

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [inputText, setInputText] = useState("");

  const transcript = useMemo(
    () =>
      messages
        .filter(isTranscriptMessage)
        .filter((message) => Boolean(message.message.content))
        .slice(-16),
    [messages]
  );

  async function startCall() {
    setBusy(true);
    setLocalError("");

    try {
      const response = await fetch("/api/hume/access-token", { method: "POST" });
      const data = (await response.json()) as AccessTokenResponse;

      if (!response.ok) {
        setLocalError(data.error || "Could not get Hume access token.");
        return;
      }

      await connect({
        auth: { type: "accessToken", value: data.accessToken },
        configId: data.configId,
        configVersion: data.configVersion || undefined,
        verboseTranscription: false
      });
    } catch {
      setLocalError("Could not start assistant call.");
    } finally {
      setBusy(false);
    }
  }

  async function endCall() {
    setBusy(true);
    setLocalError("");
    try {
      await disconnect();
    } catch {
      setLocalError("Could not disconnect cleanly.");
    } finally {
      setBusy(false);
    }
  }

  function sendTextInput(event: FormEvent) {
    event.preventDefault();
    if (!inputText.trim()) return;
    sendUserInput(inputText.trim());
    setInputText("");
  }

  const connected = status.value === "connected";

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-semibold text-ink">Hume AI Assistant (Admin)</h2>
      <p className="mt-2 text-sm text-ink/75">
        Voice assistant access is admin-only. Enforce policy restrictions in your Hume EVI
        config prompt and tools.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!connected ? (
          <button className="btn" type="button" onClick={startCall} disabled={busy}>
            {busy ? "Starting..." : "Start voice session"}
          </button>
        ) : (
          <button className="btn" type="button" onClick={endCall} disabled={busy}>
            {busy ? "Ending..." : "End voice session"}
          </button>
        )}

        <button
          className="btn btn-muted"
          type="button"
          onClick={isMuted ? unmute : mute}
          disabled={!connected || busy}
        >
          {isMuted ? "Unmute mic" : "Mute mic"}
        </button>

        <button
          className="btn btn-muted"
          type="button"
          onClick={isAudioMuted ? unmuteAudio : muteAudio}
          disabled={!connected || busy}
        >
          {isAudioMuted ? "Unmute assistant" : "Mute assistant"}
        </button>

        <button className="btn btn-muted" type="button" onClick={clearMessages}>
          Clear transcript
        </button>
      </div>

      <div className="mt-3 rounded-lg bg-ink/5 p-3 text-xs text-ink/80">
        <p>
          Status: <strong>{status.value}</strong> | Ready state: <strong>{readyState}</strong>
        </p>
        {callDurationTimestamp ? (
          <p className="mt-1">
            Last call duration: <strong>{callDurationTimestamp}</strong>
          </p>
        ) : null}
      </div>

      {localError ? <p className="mt-3 text-sm font-semibold text-alarm">{localError}</p> : null}
      {error ? (
        <p className="mt-3 text-sm font-semibold text-alarm">
          Voice error: {error.message}
        </p>
      ) : null}

      <form className="mt-4 flex gap-2" onSubmit={sendTextInput}>
        <input
          className="input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Send text input to assistant (optional)"
          disabled={!connected}
        />
        <button className="btn" type="submit" disabled={!connected}>
          Send
        </button>
      </form>

      <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-ink/15 bg-white p-3">
        {!transcript.length ? (
          <p className="text-sm text-ink/60">No transcript yet.</p>
        ) : (
          <ul className="space-y-2">
            {transcript.map((message, index) => {
              const role = message.type === "assistant_message" ? "Assistant" : "You";
              const bubbleStyle =
                message.type === "assistant_message"
                  ? "bg-sky/10 text-ink"
                  : "bg-mint/15 text-ink";

              return (
                <li key={`${message.type}-${index}`} className={`rounded-lg px-3 py-2 ${bubbleStyle}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{role}</p>
                  <p className="text-sm">{message.message.content}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export function AdminHumeAssistant() {
  return (
    <VoiceProvider clearMessagesOnDisconnect messageHistoryLimit={150}>
      <AssistantPanel />
    </VoiceProvider>
  );
}
