import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { grokPrompts, humeAgents } from "@/db/schema";

export const GROK_VOICES = [
  ["eve", "Eve", "female"],
  ["ara", "Ara", "female"],
  ["aurora", "Aurora", "female"],
  ["carina", "Carina", "female"],
  ["celeste", "Celeste", "female"],
  ["iris", "Iris", "female"],
  ["liora", "Liora", "female"],
  ["luna", "Luna", "female"],
  ["ursa", "Ursa", "female"],
  ["rex", "Rex", "male"],
  ["sal", "Sal", "male"],
  ["leo", "Leo", "male"],
  ["orion", "Orion", "male"],
  ["altair", "Altair", "male"],
  ["atlas", "Atlas", "male"],
  ["castor", "Castor", "male"],
  ["cosmo", "Cosmo", "male"],
  ["helios", "Helios", "male"],
  ["helix", "Helix", "male"],
  ["kepler", "Kepler", "male"],
  ["lumen", "Lumen", "male"],
  ["lux", "Lux", "male"],
  ["naksh", "Naksh", "male"],
  ["perseus", "Perseus", "male"],
  ["rigel", "Rigel", "male"],
  ["sirius", "Sirius", "male"],
  ["zagan", "Zagan", "male"],
  ["zenith", "Zenith", "male"],
] as const;

export type PromptAudience = "call" | "session";

export function cleanAudience(value: unknown): PromptAudience {
  return value === "session" ? "session" : "call";
}

export function cleanVoice(value: string) {
  return VOICE_IDS.has(value) ? value : "eve";
}

const VOICE_IDS = new Set<string>(GROK_VOICES.map((voice) => voice[0]));

async function ensureAgent(clientId: string) {
  const [existing] = await db.select().from(humeAgents).where(eq(humeAgents.clientId, clientId)).orderBy(desc(humeAgents.createdAt)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(humeAgents)
    .values({
      clientId,
      name: "Grok receptionist",
      humeConfigId: "hume-backup",
      voiceProvider: "grok",
      grokVoice: "eve",
    })
    .returning();
  return created;
}

export async function getGrokSetup(clientId: string) {
  const agent = await ensureAgent(clientId);
  const prompts = await db.select().from(grokPrompts).where(eq(grokPrompts.clientId, clientId)).orderBy(desc(grokPrompts.isDefault), desc(grokPrompts.updatedAt));
  return {
    voice: agent.grokVoice || "eve",
    greeting: agent.greetingScript || "",
    provider: agent.voiceProvider === "hume" ? "hume" : "grok",
    humeConfigId: agent.humeConfigId === "hume-backup" ? "" : agent.humeConfigId,
    voices: GROK_VOICES.map(([id, name, gender]) => ({ id, name, gender })),
    prompts: prompts.map((prompt) => ({
      id: prompt.id,
      name: prompt.name,
      body: prompt.body,
      audience: prompt.audience === "session" ? "session" : "call",
      isDefault: Boolean(prompt.isDefault),
    })),
    defaultCallId: prompts.find((prompt) => prompt.audience !== "session" && prompt.isDefault)?.id || "",
    defaultSessionId: prompts.find((prompt) => prompt.audience === "session" && prompt.isDefault)?.id || "",
  };
}

export async function saveGrokVoice(clientId: string, voice: string, greeting: string) {
  const agent = await ensureAgent(clientId);
  await db
    .update(humeAgents)
    .set({
      voiceProvider: "grok",
      grokVoice: cleanVoice(voice),
      greetingScript: greeting.trim().slice(0, 500) || null,
      updatedAt: new Date(),
    })
    .where(eq(humeAgents.id, agent.id));
}

export async function addGrokPrompt(clientId: string, name: string, body: string, makeDefault: boolean, audience: PromptAudience = "call") {
  const title = name.trim().slice(0, 80);
  const text = body.trim().slice(0, 4000);
  if (!title || !text) throw new Error("A prompt needs a name and the words Grok should follow.");
  const existing = await db
    .select({ id: grokPrompts.id })
    .from(grokPrompts)
    .where(and(eq(grokPrompts.clientId, clientId), eq(grokPrompts.audience, audience)));
  const isDefault = makeDefault || existing.length === 0;
  if (isDefault) {
    await db
      .update(grokPrompts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(grokPrompts.clientId, clientId), eq(grokPrompts.audience, audience)));
  }
  const [prompt] = await db
    .insert(grokPrompts)
    .values({ clientId, name: title, body: text, isDefault, audience })
    .returning();
  if (isDefault && audience === "call") await applyDefault(clientId, text);
  return prompt.id;
}

export async function updateGrokPrompt(clientId: string, promptId: string, name: string, body: string) {
  const title = name.trim().slice(0, 80);
  const text = body.trim().slice(0, 4000);
  if (!title || !text) throw new Error("A prompt needs a name and the words Grok should follow.");
  const [prompt] = await db
    .update(grokPrompts)
    .set({ name: title, body: text, updatedAt: new Date() })
    .where(and(eq(grokPrompts.id, promptId), eq(grokPrompts.clientId, clientId)))
    .returning();
  if (!prompt) return false;
  if (prompt.isDefault && prompt.audience !== "session") await applyDefault(clientId, text);
  return true;
}

export async function deleteGrokPrompt(clientId: string, promptId: string) {
  const [prompt] = await db
    .delete(grokPrompts)
    .where(and(eq(grokPrompts.id, promptId), eq(grokPrompts.clientId, clientId)))
    .returning();
  if (!prompt) return false;
  if (prompt.isDefault) {
    const [next] = await db
      .select()
      .from(grokPrompts)
      .where(and(eq(grokPrompts.clientId, clientId), eq(grokPrompts.audience, prompt.audience)))
      .orderBy(desc(grokPrompts.updatedAt))
      .limit(1);
    if (next) {
      await db.update(grokPrompts).set({ isDefault: true, updatedAt: new Date() }).where(eq(grokPrompts.id, next.id));
      if (next.audience !== "session") await applyDefault(clientId, next.body);
    }
  }
  return true;
}

export async function makeDefaultPrompt(clientId: string, promptId: string) {
  const [prompt] = await db.select().from(grokPrompts).where(and(eq(grokPrompts.id, promptId), eq(grokPrompts.clientId, clientId))).limit(1);
  if (!prompt) return false;
  await db
    .update(grokPrompts)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(grokPrompts.clientId, clientId), eq(grokPrompts.audience, prompt.audience)));
  await db.update(grokPrompts).set({ isDefault: true, updatedAt: new Date() }).where(eq(grokPrompts.id, prompt.id));
  if (prompt.audience !== "session") await applyDefault(clientId, prompt.body);
  return true;
}

async function applyDefault(clientId: string, body: string) {
  const agent = await ensureAgent(clientId);
  await db
    .update(humeAgents)
    .set({
      voiceProvider: "grok",
      grokInstructions: body,
      systemPrompt: body,
      updatedAt: new Date(),
    })
    .where(eq(humeAgents.id, agent.id));
}

export async function defaultPromptBody(clientId: string, audience: PromptAudience = "call") {
  const [prompt] = await db
    .select()
    .from(grokPrompts)
    .where(and(eq(grokPrompts.clientId, clientId), eq(grokPrompts.audience, audience), eq(grokPrompts.isDefault, true)))
    .limit(1);
  return prompt?.body || "";
}
