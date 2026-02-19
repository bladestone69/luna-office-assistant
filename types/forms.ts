import type { MeetingTypeKey } from "@/lib/constants";

export type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  topic: string;
  preferredCallbackTime: string;
  consent: boolean;
  notes?: string;
  website?: string;
};

export type MessagePayload = {
  name: string;
  phone: string;
  email?: string;
  reason: string;
  urgency: "Low" | "Med" | "High";
  preferredCallbackTime: string;
  consent: boolean;
  website?: string;
};

export type BookingAvailabilityPayload = {
  meetingType: MeetingTypeKey;
  date: string;
};

export type BookingPayload = {
  name: string;
  phone: string;
  email: string;
  meetingType: MeetingTypeKey;
  startDateTime: string;
  consent: boolean;
  website?: string;
};
