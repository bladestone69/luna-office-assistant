/**
 * Thin helpers for xAI Grok Voice Agent.
 * Voice Agent Builder: https://console.x.ai/voice/agents
 * Voice Agent API docs: https://docs.x.ai/developers/model-capabilities/audio/voice-agent
 */

export function xaiConfigured() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export async function listXaiVoices(): Promise<Array<{ id: string; name?: string }>> {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) return [];

  try {
    const res = await fetch("https://api.x.ai/v1/audio/voices", {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { voices?: Array<{ voice_id?: string; id?: string; name?: string }> };
    return (data.voices ?? []).map((v) => ({
      id: v.voice_id || v.id || "unknown",
      name: v.name,
    }));
  } catch {
    return [];
  }
}

export function verifyWebhookSecret(headerValue: string | null) {
  const expected = process.env.XAI_WEBHOOK_SECRET?.trim();
  if (!expected) return true;
  return headerValue === expected;
}

export const DEFAULT_GROK_VOICES = ["eve", "ara", "rex", "sal", "leo"] as const;
