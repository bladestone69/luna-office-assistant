import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";

export default function BecomeClientPage() {
  return (
    <main className="min-h-screen bg-[#0C0C0E] text-[#F5F0E8]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-xl font-bold text-[#C9A84C]">
          Vercel Aura
        </Link>
        <Link
          href="/"
          className="text-sm text-[#8A8A8A] transition-colors hover:text-[#C9A84C]"
        >
          ← Back home
        </Link>
      </nav>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-bold text-[#F5F0E8]">
            Become a Client
          </h1>
          <p className="mt-4 text-[#8A8A8A]">
            Share your details and we will be in touch to discuss how Vercel Aura can support
            your business.
          </p>
        </div>

        <LeadForm />
      </section>
    </main>
  );
}
