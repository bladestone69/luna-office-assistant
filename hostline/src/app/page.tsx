import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Caller rings",
    copy: "Your Hostline number picks up in one ring, day or night.",
  },
  {
    n: "02",
    title: "Grok listens",
    copy: "Speech-to-speech voice handles accents, interruptions, and language switches.",
  },
  {
    n: "03",
    title: "Desk acts",
    copy: "Leads land on your desk. Callbacks and bookings are ready when you are.",
  },
];

const industries = [
  { name: "Medical practices", note: "After-hours triage and appointment capture" },
  { name: "Law firms", note: "Intake questions without missing a matter" },
  { name: "Estate agencies", note: "Viewing requests qualified on the first call" },
  { name: "Trade services", note: "Quotes logged while you stay on site" },
];

export default function HomePage() {
  return (
    <main className="atmosphere min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <Monogram />
          <span className="text-lg font-semibold tracking-tight">Hostline</span>
        </div>
        <nav className="flex items-center gap-3 text-sm md:gap-5">
          <Link href="/desk/login" className="hidden text-[var(--ink)]/70 hover:text-[var(--ink)] sm:inline">
            Client desk
          </Link>
          <Link href="/owner/login" className="cta-start text-sm">
            Owner atelier
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-20">
        <div className="relative z-10 max-w-xl">
          <div className="overflow-hidden">
            <p className="kinetic-line mono mb-5 text-xs uppercase tracking-[0.22em] text-[var(--mute)]">
              Hostline
            </p>
          </div>
          <h1 className="overflow-hidden text-5xl font-semibold leading-[0.95] tracking-tighter md:text-6xl">
            <span className="kinetic-line">The front desk</span>
            <br />
            <span className="kinetic-line">that never hangs up</span>
          </h1>
          <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-[var(--ink)]/75">
            Grok Voice receptionist for South African SMEs. You run the platform. Your clients only see a calm desk.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/owner/login" className="cta-start">
              Enter atelier
            </Link>
            <Link href="/desk/login" className="cta-see">
              Open a desk
            </Link>
          </div>
        </div>

        <div className="relative min-h-[320px] md:min-h-[420px]">
          <div className="drift-layer absolute inset-0 rounded-[28px] bg-[var(--panel)]" />
          <div className="absolute inset-4 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#173039] via-[#0f1c24] to-[#1a3d38]">
            <div className="absolute -right-10 top-8 h-56 w-56 rounded-full bg-[var(--sea)]/25 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-[var(--paper)]">
              <p className="mono text-[11px] uppercase tracking-[0.2em] text-white/45">Live line</p>
              <p className="mt-3 text-2xl font-medium tracking-tight md:text-3xl">
                &ldquo;Good morning, you have reached the practice. How can I help?&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm text-white/60">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--sea)]" />
                Grok Voice · inbound
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2 md:px-8">
          <Link
            href="/owner/login"
            className="group rounded-[24px] bg-[var(--panel)] p-8 text-[var(--paper)] transition hover:-translate-y-0.5"
          >
            <p className="mono text-[11px] uppercase tracking-[0.18em] text-white/45">For you</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Owner atelier</h2>
            <p className="mt-4 max-w-[36ch] text-white/65">
              Onboard clients, wire Grok agents, assign numbers, track ZAR billing and minute usage.
            </p>
            <p className="mt-8 text-sm text-[var(--sea)] group-hover:underline">Enter atelier</p>
          </Link>
          <Link
            href="/desk/login"
            className="group rounded-[24px] border border-[var(--line)] bg-white p-8 transition hover:-translate-y-0.5"
          >
            <p className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--mute)]">For your clients</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Client desk</h2>
            <p className="mt-4 max-w-[36ch] text-[var(--ink)]/65">
              No API keys. No webhooks. Just line status, people who called, and what needs a callback.
            </p>
            <p className="mt-8 text-sm text-[var(--sea-deep)] group-hover:underline">Open a desk</p>
          </Link>
        </div>
      </section>

      <section id="path" className="bg-[var(--paper)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-8">
          <h2 className="max-w-[12ch] text-3xl font-semibold tracking-tight md:text-4xl">
            Three beats from ring to result
          </h2>
          <div className="mt-12 grid gap-0 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.n}
                className="border-t border-[var(--line)] py-8 md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0"
              >
                <p className="mono text-xs text-[var(--mute)]">{step.n}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 max-w-[34ch] text-[var(--ink)]/70">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built on Grok Voice, not a phone tree
          </h2>
          <p className="mt-5 max-w-[48ch] text-[var(--ink)]/70 leading-relaxed">
            Hostline sits on xAI Voice Agent Builder. You keep the technical surface. Clients keep a quiet desk that feels like their own receptionist.
          </p>
          <ul className="mt-8 space-y-3 text-[var(--ink)]/80">
            <li>Owner atelier for clients, Grok studio, and billing</li>
            <li>Client desk for calls, people, and line status only</li>
            <li>English, Afrikaans, Zulu, and Xhosa ready prompts</li>
          </ul>
        </div>
        <div className="rounded-[20px] bg-[var(--panel)] p-8 text-[var(--paper)]">
          <p className="mono text-[11px] uppercase tracking-[0.18em] text-white/45">Two doors</p>
          <p className="mt-4 text-2xl font-medium tracking-tight leading-snug">
            One product. Two experiences. You run the switchboard. They walk into a calm front desk.
          </p>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-8">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Made for busy desks</h2>
          <div className="mt-10 divide-y divide-[var(--line)]">
            {industries.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:justify-between"
              >
                <h3 className="text-xl font-medium tracking-tight">{item.name}</h3>
                <p className="text-[var(--ink)]/65 md:max-w-[42ch] md:text-right">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--panel)] text-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <h2 className="max-w-[16ch] text-3xl font-semibold tracking-tight md:text-5xl">
              Run Hostline your way
            </h2>
            <p className="mt-4 max-w-[40ch] text-white/60">
              Open the atelier to manage clients, or step into a desk the way your clients will.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/owner/login" className="cta-open">
              Enter atelier
            </Link>
            <Link href="/desk/login" className="inline-flex items-center px-2 font-medium text-white/75 underline">
              Open a desk
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-[var(--mute)] md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <Monogram small />
          <span className="font-medium">Hostline</span>
        </div>
        <p>Grok Voice receptionist for South African SMEs.</p>
      </footer>
    </main>
  );
}

function Monogram({ small = false }: { small?: boolean }) {
  const size = small ? 22 : 28;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2A7A6E" />
      <path d="M9 22V10h2.4v4.7H20.4V10H22.8v12h-2.4v-5.1H11.4V22H9z" fill="#F7FAFC" />
      <path d="M8 24.5c4.2 1.4 11.8 1.4 16 0" stroke="#F7FAFC" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
