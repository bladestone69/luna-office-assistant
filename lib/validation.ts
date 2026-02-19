import { z } from "zod";
import {
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
