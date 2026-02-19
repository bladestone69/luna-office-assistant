import { URGENT_KEYWORDS } from "@/lib/constants";

export function redactIdLikeNumbers(input: string): string {
  return input.replace(/\b(?:\d[\s-]?){6,20}\d\b/g, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 6) return match;

    const maskedDigits = `${"*".repeat(digits.length - 3)}${digits.slice(-3)}`;
    let index = 0;

    return match.replace(/\d/g, () => maskedDigits[index++] ?? "*");
  });
}

export function sanitizeFreeText(input: string): string {
  return redactIdLikeNumbers(input.trim()).replace(/\s{2,}/g, " ");
}

export function isUrgentMessage(reason: string, urgency: "Low" | "Med" | "High") {
  if (urgency === "High") {
    return true;
  }

  const reasonLower = reason.toLowerCase();
  return URGENT_KEYWORDS.some((keyword) => reasonLower.includes(keyword));
}

export function getFirstName(name: string): string {
  const [firstName] = name.trim().split(/\s+/);
  return firstName || "Client";
}
