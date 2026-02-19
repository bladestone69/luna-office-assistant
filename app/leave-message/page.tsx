import Link from "next/link";
import { MessageForm } from "@/components/forms/MessageForm";

export const metadata = {
  title: "Leave a Message | Luna Office Assistant"
};

export default function LeaveMessagePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/" className="mb-6 inline-block text-sm font-semibold text-sky">
        Back to home
      </Link>
      <MessageForm />
    </main>
  );
}
