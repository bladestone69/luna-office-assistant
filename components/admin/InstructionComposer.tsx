"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" }
] as const;

function parsePhoneNumbers(raw: string) {
  return raw
    .split(/\r?\n|,|;/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function InstructionComposer() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [phoneBlock, setPhoneBlock] = useState("");
  const [preferredCallTime, setPreferredCallTime] = useState("");
  const [pitchPrompt, setPitchPrompt] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedPhoneNumbers = useMemo(() => parsePhoneNumbers(phoneBlock), [phoneBlock]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!parsedPhoneNumbers.length) {
        setError("Add at least one phone number.");
        return;
      }

      const response = await fetch("/api/admin/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          phoneNumbers: parsedPhoneNumbers,
          preferredCallTime,
          pitchPrompt,
          priority
        })
      });

      const data = (await response.json()) as {
        error?: string;
        count?: number;
        instructionIds?: string[];
      };
      if (!response.ok) {
        setError(data.error || "Could not dispatch call batch.");
        return;
      }

      const dispatched = data.count || parsedPhoneNumbers.length;
      setSuccess(
        `Dispatched ${dispatched} call ${dispatched === 1 ? "instruction" : "instructions"} to EVI.`
      );
      setCampaignName("");
      setPhoneBlock("");
      setPreferredCallTime("");
      setPitchPrompt("");
      setPriority("normal");
      router.refresh();
    } catch {
      setError("Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Dispatch Calls to EVI</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/75">
            Paste one or many numbers. EVI will dial each number and run the pitch prompt
            you dispatch here.
          </p>
        </div>
        <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          {parsedPhoneNumbers.length} queued number
          {parsedPhoneNumbers.length === 1 ? "" : "s"}
        </span>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Campaign label (optional)</span>
            <input
              className="input"
              placeholder="Example: Retirement review outreach"
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Preferred call window</span>
            <input
              className="input"
              placeholder="Example: Weekdays 09:00-13:00"
              value={preferredCallTime}
              onChange={(event) => setPreferredCallTime(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-semibold">Phone numbers</span>
            <textarea
              className="input min-h-[200px]"
              placeholder={["+27821234567", "082 555 0182", "011-255-2323"].join("\n")}
              value={phoneBlock}
              onChange={(event) => setPhoneBlock(event.target.value)}
              required
            />
            <span className="mt-1 block text-xs text-ink/65">
              One number per line, or separate with commas.
            </span>
          </label>

          <div className="space-y-4 lg:col-span-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Pitch prompt for EVI</span>
              <textarea
                className="input min-h-[150px]"
                placeholder="Call the lead, introduce our review service, qualify interest, then ask to schedule a 30-minute review."
                value={pitchPrompt}
                onChange={(event) => setPitchPrompt(event.target.value)}
                required
              />
            </label>

            <label className="block max-w-xs">
              <span className="mb-1 block text-sm font-semibold">Priority</span>
              <select
                className="input"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as "low" | "normal" | "high")
                }
              >
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}
        {success ? <p className="text-sm font-semibold text-mint">{success}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Dispatching..." : "Dispatch To EVI"}
        </button>
      </form>
    </section>
  );
}
