import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";

export default function AdminProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 lg:px-6">
      <header className="panel relative overflow-hidden px-5 py-6 md:px-8">
        <div className="absolute -top-16 right-0 h-44 w-44 rounded-full bg-sky/20 blur-2xl" />
        <div className="absolute -bottom-20 left-12 h-56 w-56 rounded-full bg-mint/15 blur-3xl" />
        <div className="relative">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
            EVI Outbound Workspace
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-ink md:text-4xl">Dispatch + Results Console</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Send outbound call instructions to EVI and monitor outcomes from one clean
            interface.
          </p>
          <AdminNavTabs />
        </div>
      </header>
      <section className="mt-6">{children}</section>
    </main>
  );
}
