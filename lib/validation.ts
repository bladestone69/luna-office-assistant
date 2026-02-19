import { z } from "zod";
import {
  INSTRUCTION_PRIORITIES,
  INSTRUCTION_STATUSES,
  MEETING_TYPE_KEYS,
  TOPIC_OPTIONS,
  URGENCY_OPTIONS
} from "@/lib/constants";

const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

const requiredTrimmedString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

const honeypotSchema = z.object({
  website: z.string().optional().default("")
});

export const leadSchema = honeypotSchema.extend({
  name: requiredTrimmedString("Name").max(100),
  phone: requiredTrimmedString("Phone")
    .max(25)
    .regex(phoneRegex, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(120),
  topic: z.enum(TOPIC_OPTIONS),
  preferredCallbackTime: requiredTrimmedString("Preferred callback time").max(80),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" })
  }),
  notes: z.string().trim().max(800).optional().default("")
});

export const messageSchema = honeypotSchema.extend({
  name: requiredTrimmedString("Name").max(100),
  phone: requiredTrimmedString("Phone")
    .max(25)
    .regex(phoneRegex, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(120)
    .optional()
    .or(z.literal("")),
  reason: requiredTrimmedString("Reason").max(1200),
  urgency: z.enum(URGENCY_OPTIONS),
  preferredCallbackTime: requiredTrimmedString("Preferred callback time").max(80),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" })
  })
});

export const bookingAvailabilitySchema = z.object({
  meetingType: z.enum(MEETING_TYPE_KEYS),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export const bookingSchema = honeypotSchema.extend({
  name: requiredTrimmedString("Name").max(100),
  phone: requiredTrimmedString("Phone")
    .max(25)
    .regex(phoneRegex, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(120),
  meetingType: z.enum(MEETING_TYPE_KEYS),
  startDateTime: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime({ offset: false })),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" })
  })
});

export const adminLoginSchema = z.object({
  username: requiredTrimmedString("Username").max(60),
  password: requiredTrimmedString("Password").max(120)
});

export const instructionCreateSchema = z.object({
  clientName: requiredTrimmedString("Client name").max(100),
  clientPhone: requiredTrimmedString("Client phone")
    .max(25)
    .regex(phoneRegex, "Enter a valid phone number"),
  preferredCallTime: z.string().trim().max(120).optional().default(""),
  instructionText: requiredTrimmedString("Instruction").max(1500),
  priority: z.enum(INSTRUCTION_PRIORITIES).default("normal")
});

export const aiFeedbackSchema = z.object({
  instructionId: requiredTrimmedString("instructionId").max(120),
  status: z.enum(INSTRUCTION_STATUSES),
  summary: requiredTrimmedString("summary").max(1800),
  nextAction: z.string().trim().max(500).optional().default(""),
  scheduledStartDateTime: z.string().trim().optional().default(""),
  scheduledEndDateTime: z.string().trim().optional().default(""),
  bookingEventId: z.string().trim().max(160).optional().default(""),
  clientName: z.string().trim().max(100).optional().default(""),
  clientPhone: z.string().trim().max(25).optional().default(""),
  clientEmail: z
    .string()
    .trim()
    .email("Invalid email")
    .max(120)
    .optional()
    .or(z.literal("")),
  meetingType: z.string().trim().max(80).optional().default("")
});
