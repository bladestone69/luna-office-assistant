import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";

export const metadata = {
  title: "Become a Client | Luna Office Assistant"
};

export default function BecomeClientPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/" className="mb-6 inline-block text-sm font-semibold text-sky">
        Back to home
      </Link>
      <LeadForm />
    </main>
  );
}
