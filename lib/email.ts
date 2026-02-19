import "server-only";
import nodemailer from "nodemailer";
import { APP_TIMEZONE } from "@/lib/constants";
import { requiredEnv } from "@/lib/env";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

function getTransporter() {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(requiredEnv("SMTP_PORT"));
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function getSender() {
  return requiredEnv("SMTP_FROM");
}

export function getErnestEmail() {
  return requiredEnv("ERNEST_EMAIL");
}

export async function sendEmail(payload: EmailPayload) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: getSender(),
    to: payload.to,
    subject: payload.subject,
    text: payload.text
  });
}

export function bookingConfirmationText(input: {
  name: string;
  meetingType: string;
  startIso: string;
  phone: string;
}) {
  const prettyTime = new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: APP_TIMEZONE
  }).format(new Date(input.startIso));

  return [
    `Hi ${input.name},`,
    "",
    "Your meeting request has been confirmed.",
    `Meeting type: ${input.meetingType}`,
    `When: ${prettyTime} (${APP_TIMEZONE})`,
    `Contact phone on file: ${input.phone}`,
    "",
    "This channel does not process policy switches, withdrawals, balances, or policy status requests.",
    "If details change, reply to this email and include your preferred callback time.",
    "",
    "Regards,",
    "Luna Office Assistant"
  ].join("\n");
}
