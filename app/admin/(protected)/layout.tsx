import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm font-semibold text-sky">
            Ops home
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-ink">EVI Operations Console</h1>
        </div>
        <AdminLogoutButton />
      </header>
      {children}
    </main>
  );
}
