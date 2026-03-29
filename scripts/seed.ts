/**
 * Seed script — run with: npx ts-node --project tsconfig.json scripts/seed.ts
 * Or via drizzle studio to verify data looks right.
 */
import { db } from "../db";
import { clients, clientUsers, adminCredentials } from "../db/schema";
import { hashPassword } from "../lib/auth";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database…");

  // ── Admin credentials ──────────────────────────────────────────────────────
  // Username: ernest, Password: Admin1
  const adminHash = hashPassword("Admin1");
  await db.execute(sql`
    INSERT INTO admin_credentials (id, password_hash, updated_at)
    VALUES (1, ${adminHash}, NOW())
    ON CONFLICT (id) DO UPDATE SET password_hash = ${adminHash}, updated_at = NOW()
  `);
  console.log("✅ Admin credentials seeded (ernest / Admin1)");

  // ── Demo client ───────────────────────────────────────────────────────────
  const [demoClient] = await db.select().from(clients).where(sql`name = 'Demo Client'`).limit(1);
  let clientId: string;

  if (!demoClient) {
    const inserted = await db.insert(clients).values({
      name: "Demo Client",
      email: "demo@example.com",
      industry: "SaaS",
      plan: "pro",
      status: "active",
    }).returning();
    clientId = inserted[0].id;
    console.log("✅ Demo client created");
  } else {
    clientId = demoClient.id;
    console.log("ℹ️  Demo client already exists");
  }

  // ── Demo client user ──────────────────────────────────────────────────────
  const demoUserHash = hashPassword("demo123");
  const [existing] = await db.select().from(clientUsers).where(sql`email = 'demo@vercelaura.ai'`).limit(1);
  if (!existing) {
    await db.insert(clientUsers).values({
      clientId,
      name: "Demo User",
      email: "demo@vercelaura.ai",
      passwordHash: demoUserHash,
      role: "agent",
    });
    console.log("✅ Demo user created (demo@vercelaura.ai / demo123)");
  } else {
    console.log("ℹ️  Demo user already exists");
  }

  console.log("🎉 Done!");
}

seed().catch(console.error);
