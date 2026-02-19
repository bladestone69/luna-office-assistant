"use client";

import { FormEvent, useState } from "react";
import { TOPIC_OPTIONS } from "@/lib/constants";

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPIC_OPTIONS[0]);
  const [preferredCallbackTime, setPreferredCallbackTime] = useState("");
  const [notes, setNotes] = useState("");
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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          topic,
          preferredCallbackTime,
          consent,
          notes,
          website
        })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error || "Could not submit lead.");
        return;
      }

      setSuccess(data.message || "Lead submitted.");
      setName("");
      setPhone("");
      setEmail("");
      setPreferredCallbackTime("");
      setNotes("");
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
      <h1 className="text-2xl font-bold text-ink">Become a Client</h1>
      <p className="text-sm text-ink/75">
        Share your details and broad topic. We do not process policy changes or account
        requests on this form.
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
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Broad topic</span>
        <select
          className="input"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          required
        >
          {TOPIC_OPTIONS.map((option) => (
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
          placeholder="Example: Weekdays after 15:00"
          value={preferredCallbackTime}
          onChange={(event) => setPreferredCallbackTime(event.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Notes (optional)</span>
        <textarea
          className="input min-h-[100px]"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional context. Please do not include ID numbers."
        />
      </label>

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
          I consent to POPIA-compliant processing of my contact details for callback and
          onboarding only.
        </span>
      </label>

      {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}
      {success ? <p className="text-sm font-semibold text-mint">{success}</p> : null}

      <button type="submit" className="btn w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit lead"}
      </button>
    </form>
  );
}
