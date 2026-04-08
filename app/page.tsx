import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/marketing/LandingPage";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { CLIENT_COOKIE, parseClientSession } from "@/lib/client-session";

export default async function Page() {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  if (verifyAdminSession(adminToken)) {
    redirect("/admin");
  }

  const clientToken = cookieStore.get(CLIENT_COOKIE)?.value;
  if (parseClientSession(clientToken)) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
