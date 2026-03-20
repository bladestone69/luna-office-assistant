import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 lg:px-6 bg-[#0C0C0E]">
      <header className="panel relative overflow-hidden px-5 py-6 md:px-8 gold-glow">
        <div className="absolute -top-16 right-0 h-44 w-44 rounded-full bg-[#C9A84C]/10 blur-2xl" />
        <div className="absolute -bottom-20 left-12 h-56 w-56 rounded-full bg-[#C9A84C]/8 blur-3xl" />
        <div className="relative">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]/70"
          >
            Luna Dispatch Console
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#F5F0E8] md:text-4xl">
            Dispatch + Results
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8A8A8A]">
            Send outbound call instructions to EVI and monitor outcomes from one clean
            interface.
          </p>
          <div className="mt-5">
            <AdminNavTabs />
          </div>
        </div>
      </header>
      <section className="mt-6">{children}</section>
    </main>
  );
}
