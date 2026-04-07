"use client";

import { FormEvent, useState } from "react";
import { TOPIC_OPTIONS } from "@/lib/constants";

const INDUSTRIES = [
  "Medical Practice",
  "Law Firm",
  "Real Estate",
  "Financial Services",
  "Construction",
  "Accounting",
  "Other",
] as const;

type IndustryOption = (typeof INDUSTRIES)[number];
type TopicOption = (typeof TOPIC_OPTIONS)[number];

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState<IndustryOption>(INDUSTRIES[0]);
  const [topic, setTopic] = useState<TopicOption>(TOPIC_OPTIONS[0]);
  const [preferredCallbackTime, setPreferredCallbackTime] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          company,
          industry,
          topic,
          preferredCallbackTime,
          message,
          consent,
          website,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not submit. Please try again.");
        return;
      }

      setSuccess(data.message || "Thank you! We'll be in touch soon.");
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setCompany("");
      setIndustry(INDUSTRIES[0]);
      setTopic(TOPIC_OPTIONS[0]);
      setPreferredCallbackTime("");
      setMessage("");
      setConsent(false);
      setWebsite("");
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Full name *</span>
          <input className="input" type="text" placeholder="Jane Smith" value={name}
            onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Phone number *</span>
          <input className="input" type="tel" placeholder="+27 11 000 0000" value={phone}
            onChange={(e) => setPhone(e.target.value)} required />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Business name</span>
          <input className="input" type="text" placeholder="Smith & Partners" value={company}
            onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Industry</span>
          <select
            className="input"
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryOption)}
          >
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Email *</span>
        <input className="input" type="email" placeholder="jane@smith.co.za" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">What do you need help with?</span>
          <select
            className="input"
            value={topic}
            onChange={(e) => setTopic(e.target.value as TopicOption)}
          >
            {TOPIC_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Best time to call</span>
          <input className="input" type="text" placeholder="e.g. Weekdays after 14:00"
            value={preferredCallbackTime} onChange={(e) => setPreferredCallbackTime(e.target.value)} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">Anything else we should know?</span>
        <textarea className="input min-h-[100px]" placeholder="Tell us briefly what you're looking for..."
          value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>

      {/* Honeypot — hidden from real users */}
      <label className="hidden" aria-hidden>
        <input type="text" tabIndex={-1} autoComplete="off" value={website}
          onChange={(e) => setWebsite(e.target.value)} />
      </label>

      <label className="flex gap-2 text-sm text-[#8A8A8A] items-start">
        <input type="checkbox" className="mt-0.5" checked={consent}
          onChange={(e) => setConsent(e.target.checked)} required />
        <span>
          I consent to Aura Office contacting me about our services. I understand my details
          will not be shared with third parties.{" "}
          <span className="text-[#C9A84C]">POPIA-compliant.</span>
        </span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-4 text-center">
          <p className="font-semibold text-[#C9A84C]">You&apos;re on the list!</p>
          <p className="mt-1 text-sm text-[#8A8A8A]">{success}</p>
        </div>
      ) : (
        <button type="submit" className="btn w-full py-3" disabled={submitting}>
          {submitting ? "Submitting..." : "Get a call back"}
        </button>
      )}
    </form>
  );
}
