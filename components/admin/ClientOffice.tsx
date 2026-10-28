"use client";

import { useEffect, useState } from "react";
import styles from "@/app/admin/(console)/page.module.css";
import { TRADES, tradeLabel, tradePreset, type TradeId } from "@/lib/practice-presets";

type Practice = {
  trade: TradeId;
  visitTypes: { name: string; minutes: number }[];
  questions: { prompt: string; required: boolean }[];
};

type DiaryBooking = {
  id: string;
  name: string;
  phone: string;
  meetingType: string;
  when: string;
  status: string;
  notes: string;
  answers: string;
};

type DiaryJob = {
  id: string;
  title: string;
  details: string;
  status: string;
  when: string;
  phone: string;
  placeCall: boolean;
  callError: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

export function ClientDiaryTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [bookings, setBookings] = useState<DiaryBooking[]>([]);
  const [jobs, setJobs] = useState<DiaryJob[]>([]);
  const [trade, setTrade] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ bookings: DiaryBooking[]; jobs: DiaryJob[]; practice: Practice }>(`/api/clients/${clientId}/diary`)
      .then((data) => {
        if (cancelled) return;
        setBookings(data.bookings || []);
        setJobs(data.jobs || []);
        setTrade(tradeLabel(data.practice?.trade || "custom"));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load this diary");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>{clientName} diary</h2>
      </div>
      <p className={styles.emptyState} style={{ textAlign: "left" }}>
        Only this client. Other businesses are not in this list. The trade is {trade || "not set yet"}.
      </p>
      {loading ? <p className={styles.emptyState}>Loading this diary...</p> : null}
      {error ? <p className={styles.emptyState}>{error}</p> : null}
      {!loading && !error && !bookings.length && !jobs.length ? <p className={styles.emptyState}>Nothing booked for this client yet.</p> : null}
      {bookings.length ? (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Visit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((row) => (
                <tr key={row.id}>
                  <td>{row.when}</td>
                  <td className={styles.tdName}>
                    {row.name}
                    <div className={styles.tdMuted}>{row.phone}</div>
                    {row.answers ? <div className={styles.tdMuted}>{row.answers}</div> : null}
                  </td>
                  <td>{row.meetingType}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {jobs.length ? (
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Work for Grok</h3>
          {jobs.map((job) => (
            <p key={job.id}>
              <strong>{job.title}</strong> · {job.when || "No time"} · {job.phone || "No phone"} · {job.placeCall ? "Call queued" : job.status}
              {job.details ? ` — ${job.details}` : ""}
              {job.callError ? ` — ${job.callError}` : ""}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ClientPracticeTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [trade, setTrade] = useState<TradeId>("custom");
  const [visitTypes, setVisitTypes] = useState(tradePreset("custom").visitTypes);
  const [questions, setQuestions] = useState(tradePreset("custom").questions);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Practice>(`/api/clients/${clientId}/practice`)
      .then((data) => {
        if (cancelled || !data?.visitTypes) return;
        setTrade(data.trade);
        setVisitTypes(data.visitTypes);
        setQuestions(data.questions || []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setMessage(loadError instanceof Error ? loadError.message : "Could not load the setup");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function pickTrade(next: TradeId) {
    const preset = tradePreset(next);
    setTrade(next);
    setVisitTypes(preset.visitTypes);
    setQuestions(preset.questions);
    setMessage("Filled from that trade. Edit it, then save. The client cannot change this.");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await api(`/api/clients/${clientId}/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade, visitTypes, questions }),
      });
      setMessage(`Saved for ${clientName}. Their diary now uses these visits and questions.`);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Practice setup</h2>
      </div>
      <p className={styles.emptyState} style={{ textAlign: "left" }}>
        You set this. {clientName} sees their diary with these visits. They cannot turn a doctor into a plumber.
      </p>
      {!ready ? <p className={styles.emptyState}>Loading setup...</p> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Trade</h3>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>What this business is</label>
            <select className="input" value={trade} onChange={(event) => pickTrade(event.target.value as TradeId)}>
              {TRADES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <p className={styles.clientDetailMeta}>{TRADES.find((item) => item.id === trade)?.blurb}</p>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Visit types</h3>
          {visitTypes.map((item, index) => (
            <div key={`visit-${index}`} className={styles.formRow} style={{ display: "grid", gridTemplateColumns: "1fr 110px auto", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Name"
                value={item.name}
                required
                onChange={(event) => {
                  const next = visitTypes.slice();
                  next[index] = { ...item, name: event.target.value };
                  setVisitTypes(next);
                }}
              />
              <input
                className="input"
                type="number"
                min={5}
                max={480}
                aria-label="Minutes"
                value={item.minutes}
                required
                onChange={(event) => {
                  const next = visitTypes.slice();
                  next[index] = { ...item, minutes: Number(event.target.value) };
                  setVisitTypes(next);
                }}
              />
              <button className={styles.btnGhost} type="button" disabled={visitTypes.length === 1} onClick={() => setVisitTypes(visitTypes.filter((_, row) => row !== index))}>
                Remove
              </button>
            </div>
          ))}
          <button className={styles.btnGhost} type="button" onClick={() => setVisitTypes([...visitTypes, { name: "", minutes: 30 }])}>
            Add visit
          </button>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Questions Grok must ask</h3>
          {questions.map((item, index) => (
            <div key={`question-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Question"
                value={item.prompt}
                onChange={(event) => {
                  const next = questions.slice();
                  next[index] = { ...item, prompt: event.target.value };
                  setQuestions(next);
                }}
              />
              <select
                className="input"
                aria-label="Required"
                value={item.required ? "yes" : "no"}
                onChange={(event) => {
                  const next = questions.slice();
                  next[index] = { ...item, required: event.target.value === "yes" };
                  setQuestions(next);
                }}
              >
                <option value="yes">Required</option>
                <option value="no">Optional</option>
              </select>
              <button className={styles.btnGhost} type="button" onClick={() => setQuestions(questions.filter((_, row) => row !== index))}>
                Remove
              </button>
            </div>
          ))}
          <button className={styles.btnGhost} type="button" onClick={() => setQuestions([...questions, { prompt: "", required: true }])}>
            Add question
          </button>
        </div>
        <button className={styles.btnPrimary} style={{ width: "auto" }} type="submit" disabled={saving}>
          {saving ? "Saving" : "Save this client's setup"}
        </button>
        {message ? <p style={{ color: message.startsWith("Could") || message.startsWith("Two") ? "#f87171" : "#4ade80", fontSize: 13 }}>{message}</p> : null}
      </form>
    </div>
  );
}
