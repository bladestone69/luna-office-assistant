// Detects leads / appointment requests from call transcripts via phrase matching

const APPOINTMENT_PHRASES = [
  "record your appointment", "noted your appointment", "appointment request",
  "appointment is confirmed", "appointment has been", "i'll book", "i will book",
  "i'll schedule", "i will schedule", "i'll arrange", "let me book",
  "booking your", "scheduled for you", "set up an appointment",
  "set that up for you", "i've set", "i have set",
];

const LEAD_PHRASES = [
  "i'll pass", "i will pass", "someone will contact", "someone will call",
  "we will call", "we'll call you", "i'll have someone", "i will have someone",
  "i'll get someone", "i will get someone", "passed your details", "noted your details",
  "recorded your", "i'll make a note", "i will make a note", "i've made a note",
  "creating a lead", "logging this", "i'll log",
];

export interface TranscriptLine {
  speaker: "user" | "assistant";
  text: string;
}

export type DetectedType = "appointment" | "lead" | null;

export function detectLeadFromTranscript(lines: TranscriptLine[]): DetectedType {
  const agentLines = lines
    .filter(l => l.speaker === "assistant")
    .map(l => l.text.toLowerCase());

  for (const line of agentLines) {
    for (const phrase of APPOINTMENT_PHRASES) {
      if (line.includes(phrase)) return "appointment";
    }
  }
  for (const line of agentLines) {
    for (const phrase of LEAD_PHRASES) {
      if (line.includes(phrase)) return "lead";
    }
  }
  return null;
}
