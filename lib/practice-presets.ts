export type VisitType = { name: string; minutes: number };
export type IntakeQuestion = { prompt: string; required: boolean };
export type TradeId = "doctor" | "dentist" | "broker" | "electrician" | "custom";

export type PracticeSetup = {
  trade: TradeId;
  visitTypes: VisitType[];
  questions: IntakeQuestion[];
};

export const TRADES: { id: TradeId; label: string; blurb: string; visitTypes: VisitType[]; questions: IntakeQuestion[] }[] = [
  {
    id: "doctor",
    label: "Doctor",
    blurb: "Short consults, and an urgent slot that is not medical advice.",
    visitTypes: [
      { name: "Consultation", minutes: 20 },
      { name: "Follow-up", minutes: 15 },
      { name: "Procedure", minutes: 45 },
      { name: "Urgent slot", minutes: 15 },
    ],
    questions: [
      { prompt: "Full name", required: true },
      { prompt: "Phone number", required: true },
      { prompt: "What is the visit for", required: true },
      { prompt: "Can this wait, or is it urgent", required: true },
      { prompt: "Medical aid, if they have one", required: false },
    ],
  },
  {
    id: "dentist",
    label: "Dentist",
    blurb: "The chair time changes with the visit. A crown is not a check-up.",
    visitTypes: [
      { name: "Check-up and clean", minutes: 30 },
      { name: "Filling", minutes: 45 },
      { name: "Extraction", minutes: 45 },
      { name: "Crown or longer procedure", minutes: 90 },
      { name: "Emergency toothache", minutes: 30 },
    ],
    questions: [
      { prompt: "Full name", required: true },
      { prompt: "Phone number", required: true },
      { prompt: "What the visit is for", required: true },
      { prompt: "Which tooth or area hurts, if they know", required: false },
      { prompt: "Medical aid, if they have one", required: false },
    ],
  },
  {
    id: "broker",
    label: "Broker",
    blurb: "Qualify the person, then book a proper conversation. No invented premiums.",
    visitTypes: [
      { name: "New enquiry", minutes: 30 },
      { name: "Policy review", minutes: 45 },
      { name: "Claim discussion", minutes: 30 },
    ],
    questions: [
      { prompt: "Full name", required: true },
      { prompt: "Phone number", required: true },
      { prompt: "New client or existing", required: true },
      { prompt: "What they want help with", required: true },
      { prompt: "Best time for a callback if this is not the meeting", required: false },
    ],
  },
  {
    id: "electrician",
    label: "Electrician",
    blurb: "A quote can wait. A burning smell cannot. Always get the address.",
    visitTypes: [
      { name: "Quote visit", minutes: 45 },
      { name: "Repair", minutes: 60 },
      { name: "Call-out", minutes: 60 },
    ],
    questions: [
      { prompt: "Full name", required: true },
      { prompt: "Phone number", required: true },
      { prompt: "Street address", required: true },
      { prompt: "What is wrong", required: true },
      { prompt: "Is anyone in danger, or is the power off", required: true },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Start from a plain appointment and write your own visits and questions.",
    visitTypes: [{ name: "Appointment", minutes: 30 }],
    questions: [
      { prompt: "Full name", required: true },
      { prompt: "Phone number", required: true },
      { prompt: "What they need", required: true },
    ],
  },
];

export function isTrade(value: string): value is TradeId {
  return TRADES.some((trade) => trade.id === value);
}

export function tradePreset(id: string): PracticeSetup {
  const trade = TRADES.find((item) => item.id === id) || TRADES[TRADES.length - 1];
  return {
    trade: trade.id,
    visitTypes: trade.visitTypes.map((item) => ({ ...item })),
    questions: trade.questions.map((item) => ({ ...item })),
  };
}

export function tradeLabel(id: string) {
  return TRADES.find((item) => item.id === id)?.label || "Custom";
}

export function cleanPractice(input: { trade?: unknown; visitTypes?: unknown; questions?: unknown }): PracticeSetup {
  const trade = typeof input.trade === "string" && isTrade(input.trade) ? input.trade : "custom";
  const visitSource = Array.isArray(input.visitTypes) ? input.visitTypes : [];
  const questionSource = Array.isArray(input.questions) ? input.questions : [];

  const visitTypes = visitSource
    .slice(0, 12)
    .map((item) => {
      const row = item as { name?: unknown; minutes?: unknown };
      const name = String(row?.name || "").trim().slice(0, 80);
      let minutes = Math.round(Number(row?.minutes));
      if (!Number.isFinite(minutes)) minutes = 30;
      minutes = Math.min(480, Math.max(5, minutes));
      return { name, minutes };
    })
    .filter((item) => item.name);

  const questions = questionSource
    .slice(0, 12)
    .map((item) => {
      const row = item as { prompt?: unknown; required?: unknown };
      return {
        prompt: String(row?.prompt || "").trim().slice(0, 180),
        required: row?.required !== false,
      };
    })
    .filter((item) => item.prompt);

  if (!visitTypes.length) return tradePreset(trade);
  return { trade, visitTypes, questions };
}

export function matchVisit(practice: PracticeSetup, name: string) {
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  return (
    practice.visitTypes.find((item) => item.name.trim().toLowerCase() === needle) ||
    practice.visitTypes.find((item) => item.name.trim().toLowerCase().startsWith(needle) || needle.startsWith(item.name.trim().toLowerCase())) ||
    null
  );
}

export function practiceBrief(practice: PracticeSetup) {
  const types = practice.visitTypes.map((item) => `- ${item.name}: ${item.minutes} minutes`).join("\n");
  const questions = practice.questions.length
    ? practice.questions.map((item) => `- ${item.prompt}${item.required ? " (required)" : " (optional)"}`).join("\n")
    : "- Full name (required)\n- Phone number (required)\n- What they need (required)";
  return [
    `Practice setup: ${tradeLabel(practice.trade)}.`,
    "Visit types. meeting_type must be one of these names. The length is fixed by the type. Do not book a longer visit into a shorter gap.",
    types,
    "Before book_appointment, ask these questions. Put the answers in the answers field, one line each, written as the question, a colon, then the answer.",
    questions,
    "Do not call book_appointment until the required answers and a visit type are known.",
    "Do not give medical, dental, legal, or financial advice. Book the time or take a message.",
    "Any hour is allowed. There is no office-hour cutoff.",
  ].join("\n");
}
