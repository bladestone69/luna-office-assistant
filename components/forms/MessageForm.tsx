"use client";

import { FormEvent, useState } from "react";
import { URGENCY_OPTIONS } from "@/lib/constants";

export function MessageForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<"Low" | "Med" | "High">("Low");
  const [preferredCallbackTime, setPreferredCallbackTime] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          reason,
          urgency,
          preferredCallbackTime,
          consent,
          website
        })
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        flaggedUrgent?: boolean;
      };

      if (!response.ok) {
        setError(data.error || "Could not send message.");
        return;
      }

      setSuccess(
        data.flaggedUrgent
          ? "Message sent and flagged URGENT."
          : data.message || "Message sent."
      );
      setName("");
      setPhone("");
      setEmail("");
      setReason("");
      setUrgency("Low");
      setPreferredCallbackTime("");
      setConsent(false);
      setWebsite("");
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto w-full max-w-2xl space-y-4 p-6" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold text-ink">Leave a Message</h1>
      <p className="text-sm text-ink/75">
        Messages are recorded for callback only. Policy actions are not processed from this
        channel.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Full name</span>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Phone</span>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Email (optional)</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Reason</span>
        <textarea
          className="input min-h-[120px]"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Include what you need help with. Avoid sending ID numbers."
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Urgency</span>
          <select
            className="input"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as "Low" | "Med" | "High")}
            required
          >
            {URGENCY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Preferred callback time</span>
          <input
            className="input"
            type="text"
            placeholder="Example: Tomorrow 09:00 - 11:00"
            value={preferredCallbackTime}
            onChange={(event) => setPreferredCallbackTime(event.target.value)}
            required
          />
        </label>
      </div>

      <label className="hidden" aria-hidden>
        Website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </label>

      <label className="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>
          I consent to POPIA-compliant processing of my message for callback and meeting
          scheduling only.
        </span>
      </label>

      {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}
      {success ? <p className="text-sm font-semibold text-mint">{success}</p> : null}

      <button type="submit" className="btn w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Submit message"}
      </button>
    </form>
  );
}
