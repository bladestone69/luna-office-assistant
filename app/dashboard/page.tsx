"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SpeakToGrok from "@/components/grok/SpeakToGrok";
import { tradeLabel, type PracticeSetup } from "@/lib/practice-presets";
import styles from "./desk.module.css";

type Section = "today" | "calendar" | "messages" | "calls" | "grok";

type Desk = {
  user: { name: string; email: string; role: string };
  client: { name: string; industry: string; plan: string; phone: string };
  line: {
    number: string;
    voice: string;
    greeting: string;
    instructions: string;
    provider: string;
    grokReady: boolean;
    phoneReady: boolean;
  };
  bookings: Booking[];
  messages: Message[];
  calls: CallItem[];
  jobs: Job[];
  practice: PracticeSetup;
};

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  meetingType: string;
  title: string;
  start: string;
  when: string;
  status: string;
  notes: string;
  answers: string;
};

type Message = {
  id: string;
  name: string;
  phone: string;
  topic: string;
  notes: string;
  status: string;
  source: string;
  when: string;
};

type CallItem = {
  id: string;
  name: string;
  number: string;
  direction: string;
  outcome: string;
  durationSeconds: number;
  when: string;
  transcript: { speaker: string; text: string }[];
};

type Job = {
  id: string;
  title: string;
  details: string;
  status: string;
  when: string;
  dueAt: string;
  phone: string;
  placeCall: boolean;
  callError: string;
  open: boolean;
};

const NAV: { id: Section; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "calendar", label: "Diary" },
  { id: "messages", label: "Messages" },
  { id: "calls", label: "Calls" },
  { id: "grok", label: "Grok" },
];

const ZONE = "Africa/Johannesburg";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

function dayKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function weekdayIndex() {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short" }).format(new Date());
  return { Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 }[name] ?? 0;
}

function weekOffset(day: string) {
  const monday = (iso: string) => {
    const [year, month, date] = iso.split("-").map(Number);
    const utc = new Date(Date.UTC(year, month - 1, date));
    const weekday = utc.getUTCDay();
    utc.setUTCDate(utc.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    return utc.getTime();
  };
  return Math.round((monday(day) - monday(dayKey(new Date()))) / (7 * 86400000));
}

function weekDays(offset: number) {
  const start = new Date();
  start.setDate(start.getDate() - weekdayIndex() + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (!seconds) return "No duration";
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("today");
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    const data = await api<Desk>("/api/client/desk");
    setDesk(data);
  }

  useEffect(() => {
    let cancelled = false;
    api<Desk>("/api/client/desk")
      .then((data) => {
        if (!cancelled) setDesk(data);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Could not open the desk";
        if (message === "Unauthorized") {
          router.replace("/login");
          return;
        }
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className={styles.shell}>
        <main className={styles.main}>
          <p className={styles.kicker}>Aura</p>
          <h1 className={styles.title}>Opening your desk</h1>
        </main>
      </div>
    );
  }

  if (error || !desk) {
    return (
      <div className={styles.shell}>
        <main className={styles.main}>
          <h1 className={styles.title}>The desk did not open</h1>
          <p className={styles.error}>{error || "Try signing in again."}</p>
        </main>
      </div>
    );
  }

  const openJobs = desk.jobs.filter((job) => job.open);
  const freshMessages = desk.messages.filter((message) => message.status === "new");
  const upcoming = desk.bookings.filter((booking) => booking.status === "confirmed" && new Date(booking.start).getTime() >= Date.now());

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <strong>Aura</strong>
          <span>{desk.client.name}</span>
        </div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <button key={item.id} type="button" data-on={section === item.id} onClick={() => setSection(item.id)}>
              {item.label}
              {item.id === "messages" && freshMessages.length > 0 ? <span className={styles.count}>{freshMessages.length}</span> : null}
              {item.id === "grok" && openJobs.length > 0 ? <span className={styles.count}>{openJobs.length}</span> : null}
            </button>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <p className={styles.company}>{desk.client.name}</p>
          <p className={styles.quiet}>{desk.user.name}</p>
          <p className={styles.quiet}>{desk.line.number || "No number yet"}</p>
          <div className={styles.actions}>
            <button className={styles.tiny} type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {section === "today" && (
          <Today desk={desk} upcoming={upcoming} messages={freshMessages} jobs={openJobs} onJump={setSection} />
        )}
        {section === "calendar" && <Diary desk={desk} onChanged={reload} />}
        {section === "messages" && <Messages desk={desk} onChanged={reload} />}
        {section === "calls" && <Calls desk={desk} />}
        {section === "grok" && <Grok desk={desk} onChanged={reload} onOpenDiary={() => setSection("calendar")} />}
      </main>
    </div>
  );
}

function Today({
  desk,
  upcoming,
  messages,
  jobs,
  onJump,
}: {
  desk: Desk;
  upcoming: Booking[];
  messages: Message[];
  jobs: Job[];
  onJump: (section: Section) => void;
}) {
  const next = [...upcoming].sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
  return (
    <>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>Today</p>
          <h1 className={styles.title}>{desk.user.name.split(" ")[0]}</h1>
          <p className={styles.lede}>
            {desk.client.name} desk. Grok answers the line, keeps the diary, and takes the jobs you hand over.
          </p>
        </div>
        <Status desk={desk} />
      </header>
      <section className={styles.cards}>
        <button className={styles.card} type="button" onClick={() => onJump("calendar")}>
          <span>Next in the diary</span>
          <strong>{next ? next.when.split(",")[0] : "Clear"}</strong>
          <p>{next ? `${next.title} · ${next.name}` : "No confirmed booking ahead."}</p>
        </button>
        <button className={styles.card} type="button" onClick={() => onJump("messages")}>
          <span>New messages</span>
          <strong>{messages.length}</strong>
          <p>{messages[0] ? messages[0].topic : "Nothing waiting."}</p>
        </button>
        <button className={styles.card} type="button" onClick={() => onJump("grok")}>
          <span>Open jobs for Grok</span>
          <strong>{jobs.length}</strong>
          <p>{jobs[0] ? jobs[0].title : "The slate is clear."}</p>
        </button>
      </section>
      <section className={styles.grid}>
        <div className={styles.panel}>
          <span className={styles.label}>Latest calls</span>
          <div className={styles.list}>
            {desk.calls.slice(0, 5).map((call) => (
              <article key={call.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3>{call.name}</h3>
                  <span className={styles.meta}>{call.when}</span>
                </div>
                <p>
                  {call.direction} · {call.outcome} · {durationLabel(call.durationSeconds)}
                </p>
              </article>
            ))}
            {!desk.calls.length && <p className={styles.empty}>Calls land here once the line rings.</p>}
          </div>
        </div>
        <div className={styles.panel}>
          <span className={styles.label}>How Grok answers</span>
          <p>{desk.line.instructions || "No brief yet. Open Grok and tell it who you are and how to speak."}</p>
          <p className={styles.quiet}>Voice {desk.line.voice}. Opening line: {desk.line.greeting || "not set"}.</p>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={() => onJump("grok")}>
              Give Grok work
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function Status({ desk }: { desk: Desk }) {
  return (
    <div className={styles.row}>
      <span className={styles.pill}>{desk.line.number || "Number not assigned"}</span>
      <span className={styles.pill} data-live={desk.line.grokReady}>
        {desk.line.grokReady ? "Grok live on the line" : "Grok briefed, phone key still off"}
      </span>
    </div>
  );
}

function Diary({ desk, onChanged }: { desk: Desk; onChanged: () => Promise<void> }) {
  const types = desk.practice?.visitTypes?.length ? desk.practice.visitTypes : [{ name: "Appointment", minutes: 30 }];
  const questions = desk.practice?.questions || [];
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(dayKey(new Date()));
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    meetingType: types[0].name,
    start: "",
    minutes: String(types[0].minutes),
    notes: "",
    answers: {} as Record<string, string>,
  });
  const [work, setWork] = useState({ name: "", phone: "", when: "", instruction: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const days = useMemo(() => weekDays(offset), [offset]);
  const visible = desk.bookings.filter((booking) => booking.status !== "cancelled" && dayKey(booking.start) === selected);
  const jobs = desk.jobs.filter((job) => job.status !== "done" && job.dueAt && dayKey(job.dueAt) === selected);
  const upcoming = desk.bookings
    .filter((booking) => booking.status === "confirmed" && new Date(booking.start).getTime() >= Date.now() - 60 * 60 * 1000)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));

  async function saveWork() {
    setSaving(true);
    setMessage("");
    try {
      await api("/api/client/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Call ${work.name || "them"}`,
          details: work.instruction,
          phone: work.phone,
          dueAt: work.when,
          placeCall: true,
        }),
      });
      setWork({ name: "", phone: "", when: "", instruction: "" });
      setMessage("Saved. Grok will call that number at that time.");
      await onChanged();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Could not save the call");
    } finally {
      setSaving(false);
    }
  }

  async function callAgain(id: string) {
    setMessage("");
    try {
      await api("/api/client/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call-now", id }),
      });
      setMessage("The call is going out now.");
      await onChanged();
    } catch (callError) {
      setMessage(callError instanceof Error ? callError.message : "The call was not placed");
    }
  }

  async function cancelJob(id: string) {
    setMessage("");
    try {
      await api("/api/client/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "done" }),
      });
      setMessage("Cancelled. Grok will not make that call.");
      await onChanged();
    } catch (cancelError) {
      setMessage(cancelError instanceof Error ? cancelError.message : "Could not cancel");
    }
  }

  async function saveBooking() {
    setSaving(true);
    setMessage("");
    try {
      await api("/api/client/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          answers: questions
            .map((question) => {
              const value = (form.answers[question.prompt] || "").trim();
              return value ? `${question.prompt}: ${value}` : "";
            })
            .filter(Boolean)
            .join("\n"),
        }),
      });
      setForm({
        name: "",
        phone: "",
        email: "",
        meetingType: types[0]?.name || "Appointment",
        start: "",
        minutes: String(types[0]?.minutes || 30),
        notes: "",
        answers: {},
      });
      const bookedDay = dayKey(form.start);
      setSelected(bookedDay);
      setOffset(weekOffset(bookedDay));
      const when = new Date(form.start).toLocaleString("en-ZA", {
        timeZone: ZONE,
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessage(`Booked for ${when}. It is on the diary.`);
      await onChanged();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Could not book");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    setMessage("");
    try {
      await api("/api/client/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await onChanged();
    } catch (cancelError) {
      setMessage(cancelError instanceof Error ? cancelError.message : "Could not cancel");
    }
  }

  return (
    <>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>Diary</p>
          <h1 className={styles.title}>{desk.client.name}</h1>
          <p className={styles.lede}>
            This diary is only yours. Admin set you up as {tradeLabel(desk.practice?.trade || "custom")}.
            {" "}Visits: {(desk.practice?.visitTypes || []).map((item) => `${item.name} (${item.minutes} min)`).join(", ") || "not set yet"}.
            The trade and the questions stay with admin.
          </p>
        </div>
        <div className={styles.row}>
          <button className={styles.tiny} type="button" onClick={() => setOffset((value) => value - 1)}>Previous</button>
          <button className={styles.tiny} type="button" onClick={() => setOffset(0)}>This week</button>
          <button className={styles.tiny} type="button" onClick={() => setOffset((value) => value + 1)}>Next</button>
        </div>
      </header>
      {upcoming.length ? (
        <div className={styles.panel} style={{ marginBottom: 16 }}>
          <span className={styles.label}>Saved appointments</span>
          <div className={styles.list}>
            {upcoming.slice(0, 8).map((booking) => (
              <button
                key={booking.id}
                className={styles.item}
                type="button"
                onClick={() => {
                  const day = dayKey(booking.start);
                  setSelected(day);
                  setOffset(weekOffset(day));
                }}
              >
                <strong>{booking.name}</strong> · {booking.when} · {booking.meetingType}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className={styles.week}>
        {days.map((date) => {
          const key = dayKey(date);
          const count = desk.bookings.filter((booking) => booking.status === "confirmed" && dayKey(booking.start) === key).length
            + desk.jobs.filter((job) => job.status !== "done" && job.dueAt && dayKey(job.dueAt) === key).length;
          return (
            <button key={key} className={styles.day} type="button" data-on={selected === key} onClick={() => setSelected(key)}>
              <small>{new Intl.DateTimeFormat("en-ZA", { timeZone: ZONE, weekday: "short" }).format(date)}</small>
              <b>{new Intl.DateTimeFormat("en-ZA", { timeZone: ZONE, day: "numeric" }).format(date)}</b>
              <small>{count ? `${count} booked` : "Open"}</small>
            </button>
          );
        })}
      </div>
      <section className={styles.grid}>
        <div className={styles.panel}>
          <span className={styles.label}>On this day</span>
          <div className={styles.list}>
            {visible.map((booking) => (
              <article key={booking.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3>{booking.title}</h3>
                  <span className={styles.meta}>{booking.status}</span>
                </div>
                <p>{booking.when} · {booking.name} · {booking.phone || "No phone"}</p>
                {booking.answers ? <p>{booking.answers}</p> : null}
                {booking.notes ? <p>{booking.notes}</p> : null}
                {booking.status === "confirmed" ? (
                  <div className={styles.actions}>
                    <button className={styles.tiny} type="button" onClick={() => void cancel(booking.id)}>Cancel</button>
                  </div>
                ) : null}
              </article>
            ))}
            {!visible.length && !jobs.length && <p className={styles.empty}>Nothing on this day.</p>}
            {jobs.map((job) => (
              <article key={job.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3>{job.title}</h3>
                  <span className={styles.meta}>{job.placeCall ? "Call queued" : job.status}</span>
                </div>
                <p>{job.when} · {job.phone || "No phone"}</p>
                {job.details ? <p>{job.details}</p> : null}
                {job.callError ? <p className={styles.error}>{job.callError}</p> : null}
                {job.phone ? (
                  <div className={styles.actions}>
                    <button className={styles.tiny} type="button" onClick={() => void callAgain(job.id)}>Call now</button>
                    <button className={styles.tiny} type="button" onClick={() => void cancelJob(job.id)}>Cancel</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
        <form
          className={`${styles.panel} ${styles.form}`}
          onSubmit={(event) => {
            event.preventDefault();
            void saveBooking();
          }}
        >
          <span className={styles.label}>Add a booking</span>
          <input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <div className={styles.split}>
            <input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div className={styles.split}>
            <select
              value={form.meetingType}
              onChange={(event) => {
                const found = types.find((item) => item.name === event.target.value);
                setForm({ ...form, meetingType: event.target.value, minutes: String(found?.minutes || 30) });
              }}
            >
              {types.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
            <input value={`${form.minutes} minutes`} readOnly aria-label="Visit length" />
          </div>
          {questions.map((question) => (
            <input
              key={question.prompt}
              placeholder={question.required ? `${question.prompt} *` : question.prompt}
              value={form.answers[question.prompt] || ""}
              required={question.required}
              onChange={(event) => setForm({ ...form, answers: { ...form.answers, [question.prompt]: event.target.value } })}
            />
          ))}
          <input type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} required />
          <textarea placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <button className={styles.primary} type="submit" disabled={saving}>{saving ? "Saving" : "Book it"}</button>
          {message ? <p className={message.startsWith("Booked") || message.startsWith("Saved") || message.startsWith("The call") ? styles.quiet : styles.error}>{message}</p> : null}
        </form>
        <form
          className={`${styles.panel} ${styles.form}`}
          onSubmit={(event) => {
            event.preventDefault();
            void saveWork();
          }}
        >
          <span className={styles.label}>Add work for Grok</span>
          <input placeholder="Who to call, for example Ben" value={work.name} onChange={(event) => setWork({ ...work, name: event.target.value })} required />
          <input placeholder="Phone, for example 0113334499" value={work.phone} onChange={(event) => setWork({ ...work, phone: event.target.value })} required />
          <input type="datetime-local" value={work.when} onChange={(event) => setWork({ ...work, when: event.target.value })} required />
          <textarea placeholder="What Grok must do on the call. Ask Ben for the payment." value={work.instruction} onChange={(event) => setWork({ ...work, instruction: event.target.value })} required />
          <button className={styles.primary} type="submit" disabled={saving}>{saving ? "Saving" : "Grok calls at this time"}</button>
        </form>
      </section>
    </>
  );
}

function Messages({ desk, onChanged }: { desk: Desk; onChanged: () => Promise<void> }) {
  const [error, setError] = useState("");

  async function mark(id: string, status: string) {
    setError("");
    try {
      await api("/api/client/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await onChanged();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Could not update");
    }
  }

  return (
    <>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>Messages</p>
          <h1 className={styles.title}>What callers left</h1>
          <p className={styles.lede}>Grok files a message here when someone wants a callback or cannot reach you.</p>
        </div>
      </header>
      <div className={styles.panel}>
        <div className={styles.list}>
          {desk.messages.map((message) => (
            <article key={message.id} className={styles.item}>
              <div className={styles.itemHead}>
                <h3>{message.name}</h3>
                <span className={styles.meta}>{message.status}</span>
              </div>
              <p>{message.topic} · {message.phone} · {message.when}</p>
              {message.notes ? <p>{message.notes}</p> : null}
              <div className={styles.actions}>
                <button className={styles.tiny} type="button" onClick={() => void mark(message.id, "contacted")}>Contacted</button>
                <button className={styles.tiny} type="button" onClick={() => void mark(message.id, "converted")}>Done</button>
              </div>
            </article>
          ))}
          {!desk.messages.length && <p className={styles.empty}>No messages yet.</p>}
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </>
  );
}

function Calls({ desk }: { desk: Desk }) {
  return (
    <>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>Calls</p>
          <h1 className={styles.title}>The line</h1>
          <p className={styles.lede}>Inbound and outbound calls for {desk.client.name}, with whatever transcript came back.</p>
        </div>
        <Status desk={desk} />
      </header>
      <div className={styles.panel}>
        <div className={styles.list}>
          {desk.calls.map((call) => (
            <article key={call.id} className={styles.item}>
              <div className={styles.itemHead}>
                <h3>{call.name}</h3>
                <span className={styles.meta}>{call.when}</span>
              </div>
              <p>
                {call.number || "Unknown number"} · {call.direction} · {call.outcome} · {durationLabel(call.durationSeconds)}
              </p>
              {call.transcript.length ? (
                <div className={styles.transcript}>
                  {call.transcript.map((line, index) => (
                    <p key={`${call.id}-${index}`}><strong>{line.speaker}.</strong> {line.text}</p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {!desk.calls.length && <p className={styles.empty}>No calls recorded yet.</p>}
        </div>
      </div>
    </>
  );
}

function Grok({ desk, onChanged, onOpenDiary }: { desk: Desk; onChanged: () => Promise<void>; onOpenDiary: () => void }) {
  const [job, setJob] = useState({ title: "", details: "", phone: "", dueAt: "", callNow: false });
  const [thread, setThread] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  async function saveJob(event: React.FormEvent) {
    event.preventDefault();
    setBusy("job");
    setNote("");
    try {
      const result = await api<{ call?: { ok: boolean; error?: string } | null }>("/api/client/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      setJob({ title: "", details: "", phone: "", dueAt: "", callNow: false });
      if (result.call && !result.call.ok) setNote(`Job saved. Call was not placed: ${result.call.error}`);
      else if (result.call?.ok) setNote("Job saved and the call is going out.");
      else setNote("Job saved. Grok will see it on the next client call and in this session.");
      await onChanged();
    } catch (saveError) {
      setNote(saveError instanceof Error ? saveError.message : "Could not save the job");
    } finally {
      setBusy("");
    }
  }

  async function finishJob(id: string) {
    await api("/api/client/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "done" }),
    });
    await onChanged();
  }

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...thread, { role: "user" as const, text }];
    setThread(next);
    setDraft("");
    setBusy("ask");
    try {
      const result = await api<{ reply: string; changed: boolean }>("/api/client/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      setThread([...next, { role: "assistant", text: result.reply }]);
      if (result.changed) await onChanged();
    } catch (askError) {
      setThread([...next, { role: "assistant", text: askError instanceof Error ? askError.message : "Grok could not answer." }]);
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>Grok</p>
          <h1 className={styles.title}>Give Grok the work</h1>
          <p className={styles.lede}>
            Speak to Grok, or hand over a job. Voice, prompts, and the trade are set by admin, not from this screen.
          </p>
        </div>
        <Status desk={desk} />
      </header>
      <section className={styles.panel} style={{ marginBottom: 16 }}>
        <span className={styles.label}>Speak to Grok</span>
        <p className={styles.quiet}>This session knows it is talking to you, not to a caller.</p>
        <div className={styles.actions}>
          <button className={styles.tiny} type="button" onClick={onOpenDiary}>Open diary</button>
        </div>
        <SpeakToGrok
          sessionUrl="/api/client/voice-session"
          toolUrl="/api/client/voice-tool"
          onResult={(result) => {
            setNote(result.message);
            if (result.ok) void onChanged();
          }}
        />
      </section>
      <form className={`${styles.panel} ${styles.form}`} onSubmit={(event) => void saveJob(event)}>
          <span className={styles.label}>A job</span>
          <input placeholder="Call the supplier back" value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} required />
          <textarea placeholder="What Grok should say or do." value={job.details} onChange={(event) => setJob({ ...job, details: event.target.value })} />
          <div className={styles.split}>
            <input placeholder="Phone, if it is a call" value={job.phone} onChange={(event) => setJob({ ...job, phone: event.target.value })} />
            <input type="datetime-local" value={job.dueAt} onChange={(event) => setJob({ ...job, dueAt: event.target.value })} />
          </div>
          <label className={styles.quiet}>
            <input type="checkbox" checked={job.callNow} onChange={(event) => setJob({ ...job, callNow: event.target.checked })} /> Call this number now
          </label>
          <button className={styles.primary} type="submit" disabled={busy === "job"}>{busy === "job" ? "Saving" : "Hand it to Grok"}</button>
        </form>
      {note ? <p className={styles.note}>{note}</p> : null}
      <section className={styles.grid} style={{ marginTop: 16 }}>
        <div className={styles.panel}>
          <span className={styles.label}>Open jobs</span>
          <div className={styles.list}>
            {desk.jobs.map((item) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3>{item.title}</h3>
                  <span className={styles.meta}>{item.status}</span>
                </div>
                {item.details ? <p>{item.details}</p> : null}
                <p className={styles.quiet}>{item.when}</p>
                {item.status !== "done" ? (
                  <div className={styles.actions}>
                    <button className={styles.tiny} type="button" onClick={() => void finishJob(item.id)}>Mark done</button>
                  </div>
                ) : null}
              </article>
            ))}
            {!desk.jobs.length && <p className={styles.empty}>No jobs yet.</p>}
          </div>
        </div>
        <form className={`${styles.panel} ${styles.chat}`} onSubmit={(event) => void ask(event)}>
          <span className={styles.label}>Talk to Grok</span>
          <div className={styles.list}>
            {thread.map((item, index) => (
              <div key={`${item.role}-${index}`} className={styles.bubble} data-role={item.role}>{item.text}</div>
            ))}
            {!thread.length && <p className={styles.empty}>Ask Grok to book someone, take a job, or rewrite the phone brief.</p>}
          </div>
          <textarea placeholder="Book a review with Sarah tomorrow at 10, and tell the phone agent we are closed on Fridays." value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button className={styles.primary} type="submit" disabled={busy === "ask" || !draft.trim()}>
            {busy === "ask" ? "Grok is working" : "Send"}
          </button>
        </form>
      </section>
    </>
  );
}
