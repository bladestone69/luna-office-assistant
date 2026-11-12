/**
 * Development seed script. Set SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD first.
 * Run with: node --conditions=react-server --import tsx scripts/seed.ts
 */
import { db } from "../db";
import { clients, clientUsers, adminCredentials } from "../db/schema";
import { hashSecret } from "../lib/password";
import { sql } from "drizzle-orm";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seeding is disabled in production.");
  }
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!adminPassword || !demoPassword || adminPassword.length < 12 || demoPassword.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD to unique passwords of at least 12 characters.");
  }
  console.log("🌱 Seeding database…");

  // ── Admin credentials ──────────────────────────────────────────────────────
  const adminHash = await hashSecret(adminPassword);
  await db.execute(sql`
    INSERT INTO admin_credentials (id, password_hash, updated_at)
    VALUES (1, ${adminHash}, NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  console.log("✅ Admin bootstrap complete; existing credentials preserved");

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
  const demoUserHash = await hashSecret(demoPassword);
  const [existing] = await db.select().from(clientUsers).where(sql`email = 'demo@vercelaura.ai'`).limit(1);
  if (!existing) {
    await db.insert(clientUsers).values({
      clientId,
      name: "Demo User",
      email: "demo@vercelaura.ai",
      passwordHash: demoUserHash,
      role: "agent",
    });
    console.log("✅ Demo user created");
  } else {
    console.log("ℹ️  Demo user already exists");
  }

  console.log("🎉 Done!");
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seeding failed");
  process.exitCode = 1;
});
