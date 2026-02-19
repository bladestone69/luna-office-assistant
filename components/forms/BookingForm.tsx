"use client";

import { FormEvent, useMemo, useState } from "react";
import { APP_TIMEZONE, MEETING_TYPES } from "@/lib/constants";
import type { MeetingTypeKey } from "@/lib/constants";

type AvailabilityResponse = {
  slots: string[];
};

export function BookingForm() {
  const [meetingType, setMeetingType] = useState<MeetingTypeKey>("intro");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = useMemo(
    () => new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE }),
    []
  );

  async function loadAvailability() {
    setError("");
    setSuccess("");
    setSelectedSlot("");
    if (!date) {
      setError("Please choose a date first.");
      return;
    }

    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({ date, meetingType });
      const response = await fetch(`/api/bookings/availability?${params.toString()}`);
      const data = (await response.json()) as AvailabilityResponse & { error?: string };

      if (!response.ok) {
        setError(data.error || "Unable to fetch availability.");
        setSlots([]);
        return;
      }

      setSlots(data.slots || []);
      if (!data.slots?.length) {
        setError("No slots available for the selected date.");
      }
    } catch {
      setError("Availability request failed. Please try again.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSlot) {
      setError("Please choose an available time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          meetingType,
          startDateTime: selectedSlot,
          consent,
          website
        })
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error || "Booking failed.");
        return;
      }

      setSuccess(data.message || "Booking request submitted.");
      setName("");
      setPhone("");
      setEmail("");
      setConsent(false);
      setWebsite("");
      setSelectedSlot("");
      setSlots([]);
    } catch {
      setError("Could not submit booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto w-full max-w-2xl space-y-4 p-6" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold text-ink">Book a Meeting</h1>
      <p className="text-sm text-ink/75">
        We only use calendar free/busy availability. No private event details are read.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Meeting type</span>
        <select
          className="input"
          value={meetingType}
          onChange={(event) => {
            setMeetingType(event.target.value as MeetingTypeKey);
            setSlots([]);
            setSelectedSlot("");
          }}
          required
        >
          {Object.entries(MEETING_TYPES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Preferred date</span>
          <input
            className="input"
            type="date"
            min={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <button
          type="button"
          className="btn mt-auto h-11"
          disabled={loadingSlots}
          onClick={loadAvailability}
        >
          {loadingSlots ? "Checking..." : "Find times"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Available times ({APP_TIMEZONE})</p>
        {!slots.length ? (
          <p className="rounded-lg bg-sky/10 px-3 py-2 text-sm text-ink/75">
            Select a date and click Find times.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            {slots.map((slot) => {
              const label = new Intl.DateTimeFormat("en-ZA", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: APP_TIMEZONE
              }).format(new Date(slot));

              const active = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    active
                      ? "border-sky bg-sky/10 font-semibold text-ink"
                      : "border-ink/20 bg-white"
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
          I consent to my details being recorded under POPIA for callback and meeting
          scheduling only.
        </span>
      </label>

      {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}
      {success ? <p className="text-sm font-semibold text-mint">{success}</p> : null}

      <button type="submit" className="btn w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Confirm booking"}
      </button>
    </form>
  );
}
