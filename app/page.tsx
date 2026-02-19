import Link from "next/link";

const actions = [
  {
    href: "/book",
    title: "Book a Meeting",
    description:
      "Request a meeting slot using privacy-safe availability checks only."
  },
  {
    href: "/become-client",
    title: "Become a Client",
    description:
      "Share your contact details and preferred callback time for a follow-up."
  },
  {
    href: "/leave-message",
    title: "Leave a Message",
    description:
      "Send a message for Ernest with urgency and callback preference."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-10">
      <header className="mb-10">
        <div className="inline-flex rounded-full border border-sky/30 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky">
          Luna Office Assistant
        </div>
        <h1 className="mt-4 text-4xl font-bold text-ink md:text-5xl">
          Ernest&apos;s Private Office Desk
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-ink/80 md:text-base">
          This tool only records requests and schedules meetings. No policy
          switches, withdrawals, balances, or status checks are processed here.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="panel group p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold text-ink">{action.title}</h2>
            <p className="mt-3 text-sm text-ink/75">{action.description}</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-sky">
              Open
            </span>
          </Link>
        ))}
      </section>

      <footer className="mt-auto pt-12 text-xs text-ink/70">
        Timezone for scheduling: <strong>Africa/Johannesburg</strong>
        <span className="mx-2">|</span>
        <Link href="/admin/login" className="font-semibold text-sky">
          Admin login
        </Link>
      </footer>
    </main>
  );
}
