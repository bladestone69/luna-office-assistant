import "server-only";

import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { callOrders } from "@/db/schema";

export async function armCallOrder(clientId: string, taskId: string, phone: string, instruction: string) {
  const [row] = await db
    .insert(callOrders)
    .values({ clientId, taskId, phone, instruction: instruction.slice(0, 2000) })
    .returning({ id: callOrders.id });
  return row.id;
}

export async function takeCallOrder(clientId: string) {
  const fresh = new Date(Date.now() - 5 * 60 * 1000);
  const [order] = await db
    .select()
    .from(callOrders)
    .where(and(eq(callOrders.clientId, clientId), isNull(callOrders.usedAt), gte(callOrders.armedAt, fresh)))
    .orderBy(desc(callOrders.armedAt))
    .limit(1);
  if (!order) return null;
  await db.update(callOrders).set({ usedAt: new Date() }).where(eq(callOrders.id, order.id));
  return order;
}

export async function dropCallOrder(taskId: string) {
  await db.delete(callOrders).where(and(eq(callOrders.taskId, taskId), isNull(callOrders.usedAt)));
}
