export const DEFAULT_GROK_VOICES = ["eve", "ara", "rex", "sal", "leo"] as const;

export function formatZar(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function plainBillingLabel(status: string) {
  switch (status) {
    case "trial":
      return "Trial";
    case "active":
      return "In good standing";
    case "past_due":
      return "Payment due";
    case "paused":
      return "Paused";
    case "churned":
      return "Closed";
    default:
      return status;
  }
}

export function plainLineLabel(status: string) {
  switch (status) {
    case "live":
      return "Your line is answering";
    case "setting_up":
      return "Hostline is still setting up your line";
    case "paused":
      return "Your line is paused";
    default:
      return status;
  }
}
