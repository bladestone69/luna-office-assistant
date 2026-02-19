export const APP_TIMEZONE = "Africa/Johannesburg";

export const MEETING_TYPES = {
  intro: { label: "Intro Call (15m)", durationMinutes: 15 },
  review: { label: "Review Meeting (30m)", durationMinutes: 30 },
  consultation: { label: "Full Consultation (60m)", durationMinutes: 60 }
} as const;

export type MeetingTypeKey = keyof typeof MEETING_TYPES;
export const MEETING_TYPE_KEYS = ["intro", "review", "consultation"] as const;

export const TOPIC_OPTIONS = [
  "Retirement Planning",
  "Risk Cover",
  "Investment Advice",
  "Estate Planning",
  "Medical Aid Review",
  "General Advice"
] as const;

export const URGENCY_OPTIONS = ["Low", "Med", "High"] as const;

export const URGENT_KEYWORDS = [
  "fraud",
  "claim deadline",
  "death",
  "accident",
  "debit order"
];

export const SHEET_TABS = {
  leads: "Leads",
  messages: "Messages",
  bookings: "Bookings"
} as const;

export type SheetTab = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];

export const SHEET_COLUMNS = {
  Leads: [
    "createdAt",
    "name",
    "phone",
    "email",
    "topic",
    "preferredCallbackTime",
    "consent",
    "consentAt",
    "source",
    "notes"
  ],
  Messages: [
    "createdAt",
    "name",
    "phone",
    "email",
    "reason",
    "urgency",
    "preferredCallbackTime",
    "consent",
    "consentAt",
    "flaggedUrgent"
  ],
  Bookings: [
    "createdAt",
    "name",
    "phone",
    "email",
    "meetingType",
    "startDateTime",
    "endDateTime",
    "calendarEventId",
    "consent",
    "consentAt"
  ]
} as const;
