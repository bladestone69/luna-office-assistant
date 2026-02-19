"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" }
] as const;

export function InstructionComposer() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [preferredCallTime, setPreferredCallTime] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientPhone,
          preferredCallTime,
          instructionText,
          priority
        })
      });

      const data = (await response.json()) as { error?: string; instructionId?: string };
      if (!response.ok) {
        setError(data.error || "Could not save instruction.");
        return;
      }

      setSuccess(`Instruction queued. ID: ${data.instructionId}`);
      setClientName("");
      setClientPhone("");
      setPreferredCallTime("");
      setInstructionText("");
      setPriority("normal");
      router.refresh();
    } catch {
      setError("Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-semibold text-ink">Dispatch Instruction to EVI</h2>
      <p className="mt-2 text-sm text-ink/75">
        Example: call Mr. Gouws at 011 255 2323 and book the next available review
        meeting.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Client name</span>
            <input
              className="input"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Client phone</span>
            <input
              className="input"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Preferred call time</span>
            <input
              className="input"
              placeholder="Example: Today after 14:30"
              value={preferredCallTime}
              onChange={(event) => setPreferredCallTime(event.target.value)}
            />
          </label>
          <label className="block">
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

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Instruction</span>
          <textarea
            className="input min-h-[120px]"
            value={instructionText}
            onChange={(event) => setInstructionText(event.target.value)}
            placeholder="What should EVI do on the outbound call?"
            required
          />
        </label>

        {error ? <p className="text-sm font-semibold text-alarm">{error}</p> : null}
        {success ? <p className="text-sm font-semibold text-mint">{success}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Queueing..." : "Queue instruction"}
        </button>
      </form>
    </section>
  );
}
