// ─── Core Entities ─────────────────────────────────────────────────────────────
import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, serial } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const clientStatusEnum = pgEnum("client_status", ["active", "suspended", "churned"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "converted", "lost"]);
export const leadSourceEnum = pgEnum("lead_source", ["phone_call", "web", "referral", "manual"]);
export const callDirectionEnum = pgEnum("call_direction", ["inbound", "outbound"]);
export const callOutcomeEnum = pgEnum("call_outcome", ["completed", "missed", "voicemail", "failed"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "done"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "agent"]);

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  industry: text("industry"),
  plan: text("plan").default("starter"),
  status: clientStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Client Users (staff logins) ─────────────────────────────────────────────
export const clientUsers = pgTable("client_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Hume Agents ──────────────────────────────────────────────────────────────
export const humeAgents = pgTable("hume_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  humeConfigId: text("hume_config_id").notNull(),
  systemPrompt: text("system_prompt"),
  greetingScript: text("greeting_script"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Phone Numbers ─────────────────────────────────────────────────────────────
export const phoneNumbers = pgTable("phone_numbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  humeAgentId: uuid("hume_agent_id").references(() => humeAgents.id, { onDelete: "set null" }),
  twilioSid: text("twilio_sid"),
  number: text("number").notNull(),          // E.164 format, e.g. +1234567890
  label: text("label"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name"),
  phoneE164: text("phone_e164").notNull(),
  email: text("email"),
  company: text("company"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Leads ─────────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  name: text("name"),
  phone: text("phone").notNull(),
  email: text("email"),
  topic: text("topic").notNull().default("General inquiry"),
  status: leadStatusEnum("status").default("new"),
  source: leadSourceEnum("source").default("web"),
  chatGroupId: text("chat_group_id"),   // Hume chat_group_id for dedup
  notes: text("notes"),
  trelloCardId: text("trello_card_id"),  // Set when card is created
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Calls ─────────────────────────────────────────────────────────────────────
export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  humeAgentId: uuid("hume_agent_id").references(() => humeAgents.id, { onDelete: "set null" }),
  phoneNumberId: uuid("phone_number_id").references(() => phoneNumbers.id, { onDelete: "set null" }),
  direction: callDirectionEnum("direction").notNull(),
  twilioCallSid: text("twilio_call_sid").unique(),
  humeChatId: text("hume_chat_id"),
  humeChatGroupId: text("hume_chat_group_id"),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  outcome: callOutcomeEnum("outcome"),
  transcript: text("transcript"),   // JSON string of { speaker, text }[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to"),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: timestamp("due_at"),
  status: taskStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type HumeAgent = typeof humeAgents.$inferSelect;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type ClientUser = typeof clientUsers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
