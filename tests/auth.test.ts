import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";

const state = vi.hoisted(() => ({
  adminHash: "", clientHash: "", accountExists: true, databaseDown: false,
  predicates: [] as unknown[], writes: [] as Record<string, unknown>[],
}));

vi.mock("@/db", () => ({ db: {
  select: () => {
    let tableName = "";
    const query: any = {
      from: (table: any) => { tableName = table[Symbol.for("drizzle:Name")]; return query; },
      innerJoin: () => query,
      where: (predicate: unknown) => { state.predicates.push(predicate); return query; },
      limit: async () => {
        if (state.databaseDown) throw new Error("Database unavailable");
        if (tableName === "admin_credentials") return state.adminHash ? [{ id: 1, passwordHash: state.adminHash }] : [];
        if (!state.accountExists) return [];
        return [{ passwordHash: state.clientHash, user: {
          id: "22222222-2222-4222-8222-222222222222", clientId: "11111111-1111-4111-8111-111111111111",
          name: "Test Owner", passwordHash: state.clientHash,
        } }];
      },
    };
    return query;
  },
  update: (table: any) => {
    let values: Record<string, unknown> = {};
    const query: any = {
      set: (input: Record<string, unknown>) => { values = input; state.writes.push(input); return query; },
      where: () => query,
      returning: async () => {
        if (table[Symbol.for("drizzle:Name")] === "admin_credentials") state.adminHash = String(values.passwordHash);
        else state.clientHash = String(values.passwordHash);
        return [{ passwordHash: values.passwordHash }];
      },
    };
    return query;
  },
} }));

vi.mock("@/lib/client-desk", () => ({ loadClientDesk: vi.fn(async () => ({ client: { id: "test" } })) }));
vi.mock("@/lib/admin-data", () => ({ listAdminLeads: vi.fn(async () => []) }));

import { createClientSessionToken, parseClientSession, CLIENT_COOKIE } from "@/lib/client-session";
import { readClientSession, resolveClientSession } from "@/lib/client-access";
import { createSession, parseSession, SESSION_TTL_MS } from "@/lib/session";
import { hashClientPassword, verifyClientPassword } from "@/lib/client-password";
import { hashPassword, verifyPassword, verifyAdminSession, createAdminSession, ADMIN_COOKIE } from "@/lib/auth";
import { POST as adminLogin } from "@/app/api/admin/login/route";
import { POST as login } from "@/app/api/login/route";
import { GET as desk } from "@/app/api/client/desk/route";
import { GET as adminLeads } from "@/app/api/admin/leads/route";
import { GET as adminBookings } from "@/app/api/admin/bookings/route";

const clientId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
let requestCount = 0;
function request(path: string, body: unknown) {
  return new NextRequest(`https://www.auraoffice.xyz${path}`, {
    method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${++requestCount}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-enough-entropy";
  process.env.ADMIN_USERNAME = "test-admin";
  process.env.ADMIN_PASSWORD = "environment-password";
  state.adminHash = ""; state.clientHash = "test-credential";
  state.accountExists = true; state.databaseDown = false; state.predicates = []; state.writes = [];
});
afterEach(() => vi.useRealTimers());

describe("signed sessions", () => {
  it("rejects old unsigned cookies and malformed tokens", () => {
    const old = Buffer.from(`${userId}|${clientId}|${Date.now() + 100000}`).toString("base64url");
    for (const token of [old, "bad", "", "x".repeat(3000)]) expect(parseClientSession(token)).toBeNull();
  });
  it("rejects changes to tenant, user, and expiry without a valid signature", () => {
    const token = createClientSessionToken(clientId, userId, state.clientHash);
    expect(parseClientSession(token)?.clientId).toBe(clientId);
    const [payload, signature] = token.split(".");
    for (const patch of [{ clientId: userId }, { subject: clientId }, { expiresAt: Date.now() + 2 * SESSION_TTL_MS }]) {
      const altered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), ...patch })).toString("base64url");
      expect(parseClientSession(`${altered}.${signature}`)).toBeNull();
    }
    expect(parseClientSession(`${token}.extra`)).toBeNull();
  });
  it("expires sessions and rejects another role or a rotated signing secret", () => {
    const token = createClientSessionToken(clientId, userId, state.clientHash);
    expect(parseSession(token, "admin")).toBeNull();
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + SESSION_TTL_MS);
    expect(parseClientSession(token)).toBeNull();
    vi.useRealTimers(); process.env.ADMIN_SESSION_SECRET = "rotated-secret";
    expect(parseClientSession(token)).toBeNull();
  });
  it("fails closed without a secret or with invalid signed identifiers", () => {
    expect(parseClientSession(createSession({ role: "client", subject: "invalid", clientId }, "hash"))).toBeNull();
    delete process.env.ADMIN_SESSION_SECRET;
    expect(() => createClientSessionToken(clientId, userId, "hash")).toThrow();
  });
});

describe("current account authorization", () => {
  it("requires an admin session before reading appointment details", async () => {
    const response = await adminBookings(new NextRequest("https://www.auraoffice.xyz/api/admin/bookings"));
    expect(response.status).toBe(401);
    expect(state.predicates).toHaveLength(0);
  });
  it("blocks unsigned, revoked, and cross-role cookies at protected API routes", async () => {
    const client = createClientSessionToken(clientId, userId, state.clientHash);
    const admin = createAdminSession("test-admin", process.env.ADMIN_PASSWORD!);
    const old = Buffer.from(`${userId}|${clientId}|${Date.now() + 100000}`).toString("base64url");
    const protectedRequest = (cookie: string) => new NextRequest("https://www.auraoffice.xyz/api/test", { headers: { cookie } });
    expect((await desk(protectedRequest(`${CLIENT_COOKIE}=${client}`))).status).toBe(200);
    for (const token of [old, admin]) expect((await desk(protectedRequest(`${CLIENT_COOKIE}=${token}`))).status).toBe(401);
    state.clientHash = "reset-password-hash";
    expect((await desk(protectedRequest(`${CLIENT_COOKIE}=${client}`))).status).toBe(401);
    expect((await adminLeads(protectedRequest(`${ADMIN_COOKIE}=${admin}`))).status).toBe(200);
    for (const token of [old, client]) expect((await adminLeads(protectedRequest(`${ADMIN_COOKIE}=${token}`))).status).toBe(401);
  });
  it("requires the current user, tenant, and active account in every lookup", async () => {
    const token = createClientSessionToken(clientId, userId, state.clientHash);
    expect((await resolveClientSession(token))?.userId).toBe(userId);
    const sql = new PgDialect().sqlToQuery(state.predicates.at(-1) as any);
    expect(sql.params).toEqual([userId, clientId, "active"]);
    expect(sql.sql).toContain('"client_users"."client_id"');
    expect(sql.sql).toContain('"clients"."status"');
  });
  it("revokes access on password reset, account removal, or suspension", async () => {
    const token = createClientSessionToken(clientId, userId, state.clientHash);
    state.clientHash = "new-password-hash";
    expect(await resolveClientSession(token)).toBeNull();
    state.accountExists = false;
    expect(await resolveClientSession(token)).toBeNull();
    expect(await readClientSession(new NextRequest("https://example.com", { headers: { cookie: `${CLIENT_COOKIE}=unsigned` } }))).toBeNull();
  });
  it("revokes admin sessions when the current password changes", async () => {
    const token = createAdminSession("test-admin", process.env.ADMIN_PASSWORD!);
    expect(await verifyAdminSession(token)).toBe(true);
    state.adminHash = "new-password-hash";
    expect(await verifyAdminSession(token)).toBe(false);
  });
});

describe("password storage", () => {
  it("uses unique salted scrypt hashes and verifies the correct password only", async () => {
    const first = await hashClientPassword("correct-password");
    const second = await hashClientPassword("correct-password");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt-v1:/);
    expect(await verifyClientPassword("correct-password", first)).toBe(true);
    expect(await verifyClientPassword("wrong-password", first)).toBe(false);
    expect(await verifyClientPassword("anything", "scrypt-v1:bad:hash")).toBe(false);
    const admin = await hashPassword("admin-password");
    expect(await verifyPassword("admin-password", admin)).toBe(true);
  });
});

describe("login route regressions", () => {
  it("waits for admin credential verification and rejects a wrong password", async () => {
    const response = await adminLogin(request("/api/admin/login", { username: "test-admin", password: "wrong-password" }));
    expect(response.status).toBe(401);
    expect(response.cookies.get(ADMIN_COOKIE)).toBeUndefined();
  });
  it("authenticates through both admin entry points with signed cookies", async () => {
    for (const [handler, body] of [[adminLogin, { username: "test-admin", password: "environment-password" }], [login, { email: "test-admin", password: "environment-password" }]] as const) {
      const response = await handler(request("/api/login", body));
      expect(response.status).toBe(200);
      expect(await verifyAdminSession(response.cookies.get(ADMIN_COOKIE)?.value)).toBe(true);
      expect(response.cookies.get(ADMIN_COOKIE)?.httpOnly).toBe(true);
    }
  });
  it("does not accept an obsolete environment password after an admin password change", async () => {
    state.adminHash = await hashPassword("changed-admin-password");
    state.accountExists = false;
    expect((await login(request("/api/login", { email: "test-admin", password: "environment-password" }))).status).toBe(401);
    expect((await login(request("/api/login", { email: "test-admin", password: "changed-admin-password" }))).status).toBe(200);
  });
  it("migrates the legacy admin hash without accepting an incorrect password", async () => {
    const salt = Buffer.alloc(32, 7);
    const digest = createHmac("sha512", process.env.ADMIN_SESSION_SECRET!).update(salt).update("legacy-password").digest("hex");
    state.adminHash = `${salt.toString("hex")}:${digest}`;
    expect((await adminLogin(request("/api/admin/login", { username: "test-admin", password: "wrong-password" }))).status).toBe(401);
    const response = await adminLogin(request("/api/admin/login", { username: "test-admin", password: "legacy-password" }));
    expect(response.status).toBe(200);
    expect(state.adminHash).toMatch(/^scrypt-v1:/);
    expect(await verifyAdminSession(response.cookies.get(ADMIN_COOKIE)?.value)).toBe(true);
  });
  it("does not fall back to environment credentials during a database outage", async () => {
    state.databaseDown = true;
    for (const [handler, body] of [[adminLogin, { username: "test-admin", password: "environment-password" }], [login, { email: "test-admin", password: "environment-password" }]] as const) {
      const response = await handler(request("/api/login", body));
      expect(response.status).toBe(503);
      expect(response.cookies.get(ADMIN_COOKIE)).toBeUndefined();
    }
  });
  it("upgrades a legacy client password and binds the new session to that hash", async () => {
    state.clientHash = createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update("client-password").digest("hex");
    const response = await login(request("/api/login", { email: "owner@example.com", password: "client-password" }));
    expect(response.status).toBe(200);
    expect(state.clientHash).toMatch(/^scrypt-v1:/);
    expect(await resolveClientSession(response.cookies.get(CLIENT_COOKIE)?.value)).not.toBeNull();
  });
  it("rejects a client without an active account and invalid request bodies", async () => {
    state.accountExists = false;
    expect((await login(request("/api/login", { email: "owner@example.com", password: "client-password" }))).status).toBe(401);
    expect((await login(request("/api/login", null))).status).toBe(400);
  });
});
