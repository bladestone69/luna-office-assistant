import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  return children;
}
