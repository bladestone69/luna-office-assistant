import "server-only";

import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { phoneNumbers, tasks } from "@/db/schema";
import { armCallOrder, dropCallOrder } from "@/lib/call-orders";
import { placeOutboundCall } from "@/lib/place-call";

const NOT_READY = new Set([
  "The phone line is not ready for outbound calls yet.",
  "Grok is not connected to the phone line yet.",
]);

export async function dialTask(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task?.callPhone) return { ok: false as const, error: "This job has no phone number." };

  const claimed = await db
    .update(tasks)
    .set({ status: "in_progress", placeCall: false, callError: null, updatedAt: new Date() })
    .where(and(eq(tasks.id, task.id), eq(tasks.status, "pending")))
    .returning({ id: tasks.id });
  if (!claimed[0]) return { ok: false as const, error: "That call is already going out." };

  const [number] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.clientId, task.clientId)).limit(1);
  const instruction = [task.title, task.description].filter(Boolean).join(". ");
  await armCallOrder(task.clientId, task.id, task.callPhone, instruction);
  const call = await placeOutboundCall({
    to: task.callPhone,
    from: number?.number || process.env.TWILIO_PHONE_NUMBER || "",
    greeting: "",
  });

  if (!call.ok) {
    await dropCallOrder(task.id);
    const retry = NOT_READY.has(call.error);
    await db
      .update(tasks)
      .set({
        status: "pending",
        placeCall: retry,
        callError: call.error,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));
    return call;
  }

  return { ok: true as const, callSid: call.callSid };
}

export async function dialClientJob(clientId: string, jobId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, jobId), eq(tasks.clientId, clientId)))
    .limit(1);
  if (!task?.callPhone) return { ok: false as const, error: "This job has no phone number." };
  await db
    .update(tasks)
    .set({ status: "pending", placeCall: false, callError: null, updatedAt: new Date() })
    .where(eq(tasks.id, task.id));
  return dialTask(task.id);
}

export async function runDueCalls() {
  const now = new Date();
  const earliest = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const due = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.placeCall, true), eq(tasks.status, "pending"), lte(tasks.dueAt, now), gte(tasks.dueAt, earliest)))
    .limit(10);

  const results = [];
  for (const task of due) {
    results.push({ id: task.id, ...(await dialTask(task.id)) });
  }
  return results;
}
