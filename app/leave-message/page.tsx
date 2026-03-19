import Link from "next/link";

export default function LeaveMessagePage() {
  return (
    <main className="min-h-screen bg-[#0C0C0E] text-[#F5F0E8]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-xl font-bold text-[#C9A84C]">
          Luna
        </Link>
        <Link
          href="/"
          className="text-sm text-[#8A8A8A] transition-colors hover:text-[#C9A84C]"
        >
          ← Back home
        </Link>
      </nav>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-bold text-[#F5F0E8]">
            Leave a Message
          </h1>
          <p className="mt-4 text-[#8A8A8A]">
            Have a question or need to get in touch? Send us a message and we will
            respond within one business day.
          </p>
        </div>

        <div className="panel space-y-4 p-6">
          <form className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
                  Your name
                </span>
                <input className="input" type="text" placeholder="Jane Smith" required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
                  Phone number
                </span>
                <input className="input" type="tel" placeholder="+27 11 000 0000" required />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
                Email address
              </span>
              <input className="input" type="email" placeholder="jane@company.co.za" required />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#F5F0E8]">
                Your message
              </span>
              <textarea
                className="input min-h-[120px]"
                placeholder="How can we help you?"
                required
              />
            </label>

            <button type="submit" className="btn w-full rounded-xl py-3">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
