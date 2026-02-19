import Link from "next/link";
import { BookingForm } from "@/components/forms/BookingForm";

export const metadata = {
  title: "Book a Meeting | Luna Office Assistant"
};

export default function BookPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/" className="mb-6 inline-block text-sm font-semibold text-sky">
        Back to home
      </Link>
      <BookingForm />
    </main>
  );
}
