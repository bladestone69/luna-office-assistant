import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { practiceProfiles } from "@/db/schema";
import { cleanPractice, practiceBrief, tradePreset, type PracticeSetup } from "@/lib/practice-presets";

function readList(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getPractice(clientId: string): Promise<PracticeSetup> {
  const [row] = await db.select().from(practiceProfiles).where(eq(practiceProfiles.clientId, clientId)).limit(1);
  if (!row) return tradePreset("custom");
  return cleanPractice({
    trade: row.trade,
    visitTypes: readList(row.visitTypes),
    questions: readList(row.questions),
  });
}

export async function savePractice(clientId: string, input: { trade?: unknown; visitTypes?: unknown; questions?: unknown }) {
  const practice = cleanPractice(input);
  const names = practice.visitTypes.map((item) => item.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    throw new Error("Two visit types have the same name. Rename one of them.");
  }
  const values = {
    clientId,
    trade: practice.trade,
    visitTypes: JSON.stringify(practice.visitTypes),
    questions: JSON.stringify(practice.questions),
    updatedAt: new Date(),
  };
  await db
    .insert(practiceProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: practiceProfiles.clientId,
      set: {
        trade: values.trade,
        visitTypes: values.visitTypes,
        questions: values.questions,
        updatedAt: values.updatedAt,
      },
    });
  return practice;
}

export async function practiceBriefFor(clientId: string) {
  return practiceBrief(await getPractice(clientId));
}
